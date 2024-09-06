# GNOME Extension: GitHub Notifications

Integrate github's notifications within the gnome desktop environment.

## Development

**Required tools:**
* [`just`](https://just.systems/)
* [`cargo`](https://www.rust-lang.org/)
* [`corepack`](https://nodejs.org/)
* [`jq`](https://jqlang.github.io/jq/)
* [`upx`](https://upx.github.io/) (optional)

### List all tasks

```sh
just --list
```

### Build

```sh
just build
```

### Install

```sh
just install
```

## FAQs

### Why does this extension require a binary?

I don't want to deal with `libsoup3` API, so I write a Rust program to interact with GitHub server.

The old code (for older GNOME Shell) uses `libsoup2`, which drastically differs from `libsoup3`, making the porting process unnecessarily difficult for someone who is not familiar with the API (such as myself).

The choices was either to learn `libsoup3` without any prior knowledge and with limited and sometimes mismatched documentation, or rewrite it in Rust. I chose rewriting it in Rust because it gets the job done.

## Credits

This is a fork of https://github.com/alexduf/gnome-github-notifications that supports (only) GNOME 46.

## License

[GPL-2.0](https://github.com/KSXGitHub/gnome-shell-extension-github-notifications/blob/master/LICENSE).
