#! /bin/bash
set -o errexit -o pipefail -o nounset
cd "$(dirname "$0")"

if command -v upx; then
  exec upx --lzma --best "$TARGET_FILE"
else
  echo 'Cannot find upx. Skip.' >&2
fi
