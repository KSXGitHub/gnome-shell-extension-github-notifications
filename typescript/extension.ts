import Clutter from 'gi://Clutter'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'
import St from 'gi://St'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import { SystemNotificationSource, Notification } from 'resource:///org/gnome/shell/ui/messageTray.js'

import type { Input, Item, Output } from './bindings/types.js'
import { info, error } from './log.js'

class GithubNotifications {
  private token: string = ''
  private hideWidget: boolean = false
  private hideCount: boolean = false
  private refreshInterval: number = 60
  private githubInterval: number = 60
  private timeout: number | null = null
  private notifications: Item[] = []
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
    this.settings!.connect('changed', () => {
      this.reloadSettings()
      this.stopLoop()
      this.planFetch(5, false)
    })
    this.initUI()
  }

  public start(): void {
    if (!this.hasLazilyInit) {
      this.lazyInit()
    }
    this.fetchNotifications().catch(err => error('[fetch] ' + err))
    Main.panel._rightBox.insert_child_at_index(this.box, 0) // TODO: patch type definition
  }

  public stop(): void {
    this.stopLoop()
    Main.panel._rightBox.remove_child(this.box)
  }

  private reloadSettings(): void {
    this.domain = this.settings.get_string('domain')!
    this.token = this.settings.get_string('token')!
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

  private planFetch(delay: number, retry: boolean): void {
    if (retry) {
      this.retryAttempts++
    } else {
      this.retryAttempts = 0
    }
    this.stopLoop()
    this.timeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, delay, () => {
      this.fetchNotifications().catch((err: unknown) => error('[fetch] ' + error))
      return false
    })
  }

  private async fetchNotifications(): Promise<void> {
    const inputObject: Input = {
      domain: this.domain,
      token: this.token,
      show_participating_only: this.showParticipatingOnly,
      timeout: {
        amount: 5,
        unit: 's',
      },
    }
    const inputText = JSON.stringify(inputObject)

    const program = GLib.build_filenamev([this.extension.path, 'bin', 'gnome-shell-extension-github-notifications'])
    const flags = Gio.SubprocessFlags.STDIN_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    const process = Gio.Subprocess.new([program], flags)
    const cancellable = new Gio.Cancellable()

    const [stdout, stderr] = await process.communicate_utf8_async(inputText, cancellable)

    if (!process.get_successful()) {
      error('The helper process fails')
      error(stderr!)
      this.planFetch(this.interval(), true)
      return
    }

    if (!stdout) {
      this.planFetch(this.interval(), true)
      throw new TypeError('stdout is null')
    }

    const output: Output = JSON.parse(stdout)

    if (output.type == 'Unauthorized') {
      error('Unauthorized. Check your token in the settings')
      this.label.set_text('!')
      this.planFetch(this.interval(), true)
      return
    }

    if (output.type == 'OtherFailure') {
      const { response, status_code } = output
      error('HTTP error: ' + status_code)
      error('response error: ' + JSON.stringify(response))
      this.planFetch(this.interval(), true)
      return
    }

    if (output.type != 'Success') {
      const _: never = output // type guard
      throw new Error(`Variant not handled: ${(output as Output).type}`)
    }

    const { last_modified, poll_interval, status_code, response } = output

    if (last_modified) {
      this.lastModified = last_modified
    }

    if (poll_interval) {
      this.githubInterval = Number(poll_interval)
    }

    this.planFetch(this.interval(), false)

    if (status_code == 200) {
      this.updateNotifications(response)
    }
  }

  private updateNotifications(data: Item[]): void {
    if (!Array.isArray(data)) {
      info('[response] ' + JSON.stringify(data))
      error('GitHub API did not return an array')
      return
    }

    const lastNotificationsCount = this.notifications?.length ?? 0
    this.notifications = data
    this.label && this.label.set_text('' + data.length)
    this.checkVisibility()
    this.alertWithNotifications(lastNotificationsCount)
  }

  private alertWithNotifications(lastCount: number): void {
    const newCount = this.notifications.length
    if (newCount && newCount > lastCount && this.showAlertNotification) {
      try {
        const message = `You have ${newCount} new notifications`
        this.notify('Github Notifications', message)
      } catch (e) {
        error('Cannot notify ' + e)
      }
    }
  }

  private notify(title: string, message: string): void {
    let notification: Notification

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
}

export default class GithubNotificationsExtension extends Extension {
  #core: GithubNotifications

  public enable(): void {
    this.#core = new GithubNotifications(this)
    this.#core.start()
  }

  public disable(): void {
    this.#core.stop()
    this.#core = null as any
  }
}
