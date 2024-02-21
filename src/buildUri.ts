import GLib from 'gi://GLib'

export function buildUri(options: {
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

export default buildUri
