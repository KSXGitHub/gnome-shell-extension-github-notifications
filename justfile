uuid := `jq -r .uuid < assets/metadata.json`
extension-dir := "~/.local/share/gnome-shell/extensions/"
install-path := extension-dir + uuid
helper-command := "gnome-shell-extension-github-notifications"

# List all available recipes
_default:
  @just --list

# Install necessary npm dependencies
deps:
  corepack pnpm install --frozen-lockfile

# Generate TypeScript definitions to interact with the helper command
bindings:
  cargo run --bin=generate-typescript-definitions --release --locked -- typescript/bindings/types.ts

# Compile TypeScript code to JavaScript
tsc: deps bindings
  corepack pnpm exec tsc

# Compress the helper binary
upx:
  #! /bin/bash
  set -o errexit -o pipefail -o nounset

  if command -v upx; then
    exec upx --lzma --best dist/bin/{{helper-command}}
  else
    echo 'Cannot find upx. Skip.' >&2
  fi

# Check and compile Rust in release mode
rust:
  cargo clippy --release --locked -- -D warnings
  cargo fmt --check
  cargo build --bin={{helper-command}} --release --locked
  mkdir -pv dist/bin
  cp -v target/release/{{helper-command}} dist/bin
  just upx

# Copy non-TypeScript files from assets to dist
assets:
  mkdir -pv dist
  cp -v assets/metadata.json dist
  cp -v assets/stylesheet.css dist
  cp -v assets/github.svg dist
  cp -v LICENSE dist

# Compile schemas
schemas:
  mkdir -pv dist
  cp -rv assets/schemas dist
  glib-compile-schemas dist/schemas

# Build the extension in dist
build: assets schemas rust tsc

# Delete the build result
clean:
  rm -rfv dist
  rm -fv .tsbuildinfo
  rm -rfv target/release

# Clean and then build
clean-build: clean build

# Build and install the extension to GNOME Shell as a user extension
install: build uninstall
  cp -rv dist {{install-path}}

# Uninstall the extension from GNOME Shell
uninstall:
  rm -rfv {{install-path}}

# Clean and then install
clean-install: clean install
