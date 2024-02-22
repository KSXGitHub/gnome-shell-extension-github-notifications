uuid := `jq -r .uuid < src/metadata.json`
extension-dir := "~/.local/share/gnome-shell/extensions/"
install-path := extension-dir + uuid

# List all available recipes
_default:
  @just --list

# Install necessary npm dependencies
deps:
  pnpm install --frozen-lockfile

# Compile TypeScript code to JavaScript
tsc: deps
  pnpm exec tsc

# Check and compile Rust in release mode
rust:
  cargo clippy --release --locked -- -D warnings
  cargo fmt --check
  cargo build --release --locked
  mkdir -pv dist/bin
  cp -v target/release/gnome-shell-extension-github-notifications dist/bin

# Copy non-TypeScript files from src to dist
assets:
  mkdir -pv dist
  cp -v src/metadata.json dist
  cp -v src/stylesheet.css dist
  cp -v src/github.svg dist

# Compile schemas
schemas:
  mkdir -pv dist
  cp -rv src/schemas dist
  glib-compile-schemas dist/schemas

# Build the extension in dist
build: assets schemas tsc rust

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
