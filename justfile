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

# Copy non-TypeScript files from src to dist
assets:
  mkdir -pv dist
  cp -v src/metadata.json dist/metadata.json
  cp -v src/stylesheet.css dist/stylesheet.css
  cp -v src/github.svg dist/github.svg

# Compile schemas
schemas:
  mkdir -pv dist
  cp -rv src/schemas dist
  glib-compile-schemas dist/schemas

# Build the extension in dist
build: assets schemas tsc

# Delete the build result
clean:
  rm -rfv dist

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
