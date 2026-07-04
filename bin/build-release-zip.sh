#!/usr/bin/env bash
#
# Builds a clean, submission-ready content-mood-analyzer.zip.
#
# This exists because `vendor/` and `build/` are gitignored (dev-only in
# version control) but required at runtime - a zip made from a plain git
# export/archive would fatal on activation (missing composer autoloader)
# and show a blank admin UI (missing compiled JS/CSS). This script always
# rebuilds both before packaging, and packages from the real filesystem
# (respecting .distignore) rather than from git, so gitignored-but-required
# files are never accidentally left out.
#
# Never touches the developer's own vendor/ (dev dependencies stay intact) -
# a fresh, production-only vendor/ is generated directly inside the package
# build directory instead.
#
set -euo pipefail

PLUGIN_SLUG="content-mood-analyzer"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$(mktemp -d)/${PLUGIN_SLUG}"
ZIP_PATH="${ROOT_DIR}/release/${PLUGIN_SLUG}.zip"

cd "$ROOT_DIR"

echo "==> Building JS/CSS bundles"
npm run build --silent

echo "==> Assembling clean plugin directory (respecting .distignore)"
mkdir -p "$BUILD_DIR"
rsync -a \
    --exclude-from="${ROOT_DIR}/.distignore" \
    --exclude='release' \
    --exclude='vendor' \
    "${ROOT_DIR}/" "$BUILD_DIR/"
sync

echo "==> Installing production-only Composer dependencies into the package"
(cd "$BUILD_DIR" && composer install --no-dev --optimize-autoloader --quiet)
sync

# This environment mounts the working directory over a network/sync layer
# (Local by Flywheel) with occasionally-lagged read-after-write visibility
# between processes; a short pause avoids flaky "file missing" failures
# below on such setups. Harmless no-op on a normal local filesystem.
sleep 2

echo "==> Zipping"
mkdir -p "${ROOT_DIR}/release"
rm -f "$ZIP_PATH"
(cd "$(dirname "$BUILD_DIR")" && zip -rq "$ZIP_PATH" "$PLUGIN_SLUG")
sync
sleep 1

echo "==> Sanity check: dev-only paths must NOT be in the zip"
if unzip -l "$ZIP_PATH" | grep -E '/\.git/|/\.claude/|/node_modules/|/cloudflare-worker/|/svn-assets/|CLAUDE\.md'; then
    echo "FAILED: dev-only files leaked into the zip" >&2
    exit 1
fi

echo "==> Sanity check: required runtime paths must BE in the zip"
for required in vendor/autoload.php build/admin.bundle.js build/public.bundle.js; do
    found=0
    for attempt in 1 2 3 4 5; do
        if unzip -l "$ZIP_PATH" | grep -q "$PLUGIN_SLUG/$required"; then
            found=1
            break
        fi
        sleep 1
    done
    if [ "$found" -ne 1 ]; then
        echo "FAILED: required file missing from zip: $required" >&2
        exit 1
    fi
done

rm -rf "$(dirname "$BUILD_DIR")"

echo "==> Done: $ZIP_PATH"
