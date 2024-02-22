import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class GitHubNotificationsPreferences extends ExtensionPreferences {
  public getPreferencesWidget (): Gtk.Widget {
    return buildPrefsWidget(this.getSettings())
  }
}

const TOKEN_EXPLAINER =
  `To get your token, please visit <a href="https://github.com/settings/tokens/new?scopes=notifications&amp;description=Gnome%20desktop%20notifications">https://github.com/settings/tokens</a>
 - Click on "Generate Token"
 - In "Select scopes", choose only "notifications"
 - Copy and paste the token in the above field

Only Github Enterprise users need to change the "Github Hostname"
It should not include "http[s]://" or path params.

* This refresh interval will be ignored if smaller than Github's policy.
See <a href="https://developer.github.com/v3/activity/notifications/">https://developer.github.com/v3/activity/notifications</a>`

function makeLabeledOptionBox(labelText: string): Gtk.Box {
  const box = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 10,
  })
  const label = new Gtk.Label({
    label: labelText,
  })

  box.append(label)
  return box
}

function bindSettingToGtkWidget(options: {
  readonly key: string
  readonly widget: Gtk.Widget
  readonly property: string
  readonly settings: Gio.Settings
}): void {
  const { key, widget, property, settings } = options
  settings.bind(key, widget, property, Gio.SettingsBindFlags.DEFAULT)
}

function makeLabeledSwitchOptionBox(options: {
  readonly label: string
  readonly key: string
  readonly settings: Gio.Settings
}): Gtk.Box {
  const { label, key, settings } = options
  const box = makeLabeledOptionBox(label)

  const switch_ = new Gtk.Switch()
  bindSettingToGtkWidget({ key, widget: switch_, property: 'state', settings })

  box.append(switch_)
  return box
}

function makeLabeledEntryOptionBox(options: {
  readonly label: string
  readonly key: string
  readonly settings: Gio.Settings
}): Gtk.Box {
  const { label, key, settings } = options
  const box = makeLabeledOptionBox(label)

  const entry = new Gtk.Entry()
  bindSettingToGtkWidget({ key, widget: entry, property: 'text', settings })

  box.append(entry)
  return box
}

function makeLabeledSpinButtonOptionBox(options: {
  readonly label: string
  readonly key: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly settings: Gio.Settings
}): Gtk.Box {
  const { label, key, min, max, step, settings } = options
  const box = makeLabeledOptionBox(label)

  const spinButton = Gtk.SpinButton.new_with_range(min, max, step)
  bindSettingToGtkWidget({ key, widget: spinButton, property: 'value', settings })

  box.append(spinButton)
  return box
}

function buildPrefsWidget(settings: Gio.Settings): Gtk.Box {
  const mainBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    margin_top: 20,
    margin_bottom: 20,
    margin_start: 20,
    margin_end: 20,
    spacing: 10,
  })

  const innerWidgets = [
    makeLabeledEntryOptionBox({ label: 'Github Hostname', key: 'domain', settings }),
    makeLabeledEntryOptionBox({ label: 'Github Token', key: 'token', settings }),
    makeLabeledEntryOptionBox({ label: 'Github Handle', key: 'handle', settings }),
    makeLabeledSwitchOptionBox({ label: 'Show notifications alert', key: 'show-alert', settings }),
    makeLabeledSpinButtonOptionBox({
      label: 'Refresh interval (in seconds)*',
      key: 'refresh-interval',
      min: 60,
      max: 86400,
      step: 1,
      settings,
    }),
    makeLabeledSwitchOptionBox({
      label: "Only count notifications if you're participating (mention, review asked...)",
      key: 'show-participating-only',
      settings,
    }),
    makeLabeledSwitchOptionBox({
      label: 'Hide notification count',
      key: 'hide-notification-count',
      settings,
    }),
    makeLabeledSwitchOptionBox({
      label: 'Hide widget when there are no notifications',
      key: 'hide-widget',
      settings,
    }),
    new Gtk.Label({
      label: TOKEN_EXPLAINER,
      selectable: true,
      use_markup: true,
    }),
  ]

  for (const widget of innerWidgets) {
    mainBox.append(widget)
  }

  return mainBox
}
