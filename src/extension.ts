import Clutter from 'gi://Clutter'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import Soup from 'gi://Soup'
import St from 'gi://St'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { MessageTray, SystemNotificationSource, Notification } from 'resource:///org/gnome/shell/ui/messageTray.js'

import { error } from './log.js'

function buildUri(options: {
  readonly flags?: GLib.UriFlags
  readonly scheme: string
  readonly user?: string | null
  readonly password?: string | null
  readonly authParams?: string | null
  readonly host?: string | null
  readonly port?: number
  readonly path?: string
  readonly query?: string | null
  readonly fragment?: string | null
}): GLib.Uri {
  const {
    flags = GLib.UriFlags.NONE,
    scheme,
    user = null,
    password = null,
    authParams = null,
    host = null,
    port = -1,
    path = '',
    query = null,
    fragment = null,
  } = options
  return GLib.uri_build_with_user(flags, scheme, user, password, authParams, host, port, path, query, fragment)
}

class GithubNotifications {
  private token: string = ''
  private handle: string = ''
  private hideWidget: boolean = false
  private hideCount: boolean = false
  private refreshInterval: number = 60
  private githubInterval: number = 60
  private timeout: number | null = null
  private httpSession: Soup.Session | null = null
  private notifications: unknown[] = []
  private lastModified: unknown = null
  private retryAttempts: number = 0
  private retryIntervals: number[] = [60, 120, 240, 480, 960, 1920, 3600]
  private hasLazilyInit: boolean = false
  private showAlertNotification: boolean = false
  private showParticipatingOnly: boolean = false
  private _source: SystemNotificationSource | null = null
  private extension: GithubNotificationsExtension
  private settings: Gio.Settings
  private box: St.BoxLayout
  private domain: string
  private label: St.Label
  private authUri: GLib.Uri
  private authManager: Soup.AuthManager
  private auth: Soup.AuthBasic

  public constructor(extension: GithubNotificationsExtension) {
    this.extension = extension
    this.settings = extension.getSettings()
  }

  private interval(): number {
    let i = this.refreshInterval
    if (this.retryAttempts > 0) {
      i = this.retryIntervals[this.retryAttempts] || 3600
    }
    return Math.max(i, this.githubInterval)
  }

  private lazyInit(): void {
    this.hasLazilyInit = true
    this.reloadSettings()
    this.initHttp()
    this.settings!.connect('changed', () => {
      this.reloadSettings()
      this.initHttp()
      this.stopLoop()
      this.planFetch(5, false)
    })
    this.initUI()
  }

  public start(): void {
    if (!this.hasLazilyInit) {
      this.lazyInit()
    }
    this.fetchNotifications()
    Main.panel._rightBox.insert_child_at_index(this.box, 0) // TODO: patch type definition
  }

  public stop(): void {
    this.stopLoop()
    Main.panel._rightBox.remove_child(this.box)
  }

  private reloadSettings(): void {
    this.domain = this.settings.get_string('domain')!
    this.token = this.settings.get_string('token')!
    this.handle = this.settings.get_string('handle')!
    this.hideWidget = this.settings.get_boolean('hide-widget')
    this.hideCount = this.settings.get_boolean('hide-notification-count')
    this.refreshInterval = this.settings.get_int('refresh-interval')
    this.showAlertNotification = this.settings.get_boolean('show-alert')
    this.showParticipatingOnly = this.settings.get_boolean('show-participating-only')
    this.checkVisibility()
  }

  private checkVisibility(): void {
    if (this.box) {
      this.box.visible = !this.hideWidget || this.notifications.length != 0
    }
    if (this.label) {
      this.label.visible = !this.hideCount
    }
  }

  private stopLoop(): void {
    if (this.timeout) {
      // Mainloop.source_remove(this.timeout);
      GLib.source_remove(this.timeout)
      this.timeout = null
    }
  }

  private initUI(): void {
    this.box = new St.BoxLayout({
      style_class: 'panel-button',
      reactive: true,
      can_focus: true,
      track_hover: true,
    })
    this.label = new St.Label({
      text: '' + this.notifications.length,
      style_class: 'system-status-icon notifications-length',
      y_align: Clutter.ActorAlign.CENTER,
      y_expand: true,
    })

    this.checkVisibility()

    let icon = new St.Icon({
      style_class: 'system-status-icon',
    })
    // icon.gicon = Gio.icon_new_for_string(`${this.extension.path}/github.svg`)
    icon.gicon = Gio.icon_new_for_string(GLib.build_filenamev([this.extension.path, 'github.svg']))

    this.box.add_actor(icon)
    this.box.add_actor(this.label)

    this.box.connect('button-press-event', (_, event) => {
      let button = event.get_button()

      if (button == 1) {
        this.showBrowserUri()
      } else if (button == 3) {
        this.extension.openPreferences()
      }
    })
  }

  private showBrowserUri(): void {
    try {
      let url = `https://${this.domain}/notifications`
      if (this.showParticipatingOnly) {
        url = `https://${this.domain}/notifications/participating`
      }

      // Gtk.show_uri(null, url, Gtk.get_current_event_time())
      Gtk.show_uri(null, url, Gdk.CURRENT_TIME)
    } catch (e) {
      error('Cannot open uri ' + e)
    }
  }

  private initHttp(): void {
    this.authUri = buildUri({
      scheme: 'https',
      user: this.handle,
      password: this.token,
      host: `api.${this.domain}`,
      path: '/notifications',
      query: this.showParticipatingOnly ? 'participating=1' : null,
    })

    if (this.httpSession) {
      this.httpSession.abort()
    } else {
      this.httpSession = new Soup.Session()
      this.httpSession.user_agent = 'gnome-shell-extension github notification via libsoup'

      this.authManager = new Soup.AuthManager()
      this.auth = new Soup.AuthBasic({ authority: `api.${this.domain}`, realm: 'Github Api' })

      this.authManager.use_auth(this.authUri, this.auth)
      // Soup.Session.prototype.add_feature.call(this.httpSession, this.authManager)
      this.httpSession.add_feature(this.authManager)
    }
  }

  private planFetch(delay: number, retry: boolean): void {
    if (retry) {
      this.retryAttempts++
    } else {
      this.retryAttempts = 0
    }
    this.stopLoop()
    // this.timeout = Mainloop.timeout_add_seconds(delay, () => {
    //     this.fetchNotifications();
    //     return false;
    // });
    this.timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, delay, () => {
      this.fetchNotifications()
      return false
    })
  }

  private fetchNotifications(): void {
    let message = new Soup.Message({ method: 'GET', uri: this.authUri })
    if (this.lastModified) {
      // github's API is currently broken: marking a notification as read won't modify the "last-modified" header
      // so this is useless for now
      //message.request_headers.append('If-Modified-Since', this.lastModified);
    }

    this.httpSession!.queue_message(message, (_, response) => {
      try {
        if (response.status_code == 200 || response.status_code == 304) {
          if (response.response_headers.get('Last-Modified')) {
            this.lastModified = response.response_headers.get('Last-Modified')
          }
          if (response.response_headers.get('X-Poll-Interval')) {
            this.githubInterval = response.response_headers.get('X-Poll-Interval')
          }
          this.planFetch(this.interval(), false)
          if (response.status_code == 200) {
            let data = JSON.parse(response.response_body.data)
            this.updateNotifications(data)
          }
          return
        }
        if (response.status_code == 401) {
          error('Unauthorized. Check your github handle and token in the settings')
          this.planFetch(this.interval(), true)
          this.label.set_text('!')
          return
        }
        if (!response.response_body.data && response.status_code > 400) {
          error('HTTP error:' + response.status_code)
          this.planFetch(this.interval(), true)
          return
        }
        // if we reach this point, none of the cases above have been triggered
        // which likely means there was an error locally or on the network
        // therefore we should try again in a while
        error('HTTP error:' + response.status_code)
        error('response error: ' + JSON.stringify(response))
        this.planFetch(this.interval(), true)
        this.label.set_text('!')
        return
      } catch (e) {
        error('HTTP exception:' + e)
        return
      }
    })
  }

  updateNotifications(data) {
    let lastNotificationsCount = this.notifications.length

    this.notifications = data
    this.label && this.label.set_text('' + data.length)
    this.checkVisibility()
    this.alertWithNotifications(lastNotificationsCount)
  }

  alertWithNotifications(lastCount) {
    let newCount = this.notifications.length

    if (newCount && newCount > lastCount && this.showAlertNotification) {
      try {
        let message = 'You have ' + newCount + ' new notifications'

        this.notify('Github Notifications', message)
      } catch (e) {
        error('Cannot notify ' + e)
      }
    }
  }

  private notify(title: string, message: string): void {
    let notification: Notification

    // this.addNotificationSource()
    if (!this._source) {
      this._source = new SystemNotificationSource('GitHub Notification', 'github')
      this._source.connect('destroy', () => {
        this._source = null
      })
      Main.messageTray.add(this._source)
    }

    if (this._source.notifications.length == 0) {
      notification = new Notification(this._source, title, message)

      notification.setTransient(true)
      notification.setResident(false)
      notification.connect('activated', this.showBrowserUri.bind(this)) // Open on click
    } else {
      notification = this._source.notifications[0]
      notification.update(title, message, { clear: true })
    }

    // this._source.notify(notification)
    this._source.pushNotification(notification)
  }

  // private addNotificationSource(): void {
  //   if (this._source) {
  //     return
  //   }

  //   this._source = new SystemNotificationSource('GitHub Notification', 'github')
  //   this._source.connect('destroy', () => {
  //     this._source = null
  //   })
  //   Main.messageTray.add(this._source)
  // }
}

export default class GithubNotificationsExtension extends Extension {
  private _githubNotification: GithubNotifications

  public enable(): void {
    this._githubNotification = new GithubNotifications(this)
    this._githubNotification.start()
  }

  public disable(): void {
    this._githubNotification.stop()
    this._githubNotification = null as any
  }
}
