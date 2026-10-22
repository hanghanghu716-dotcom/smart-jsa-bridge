#!/usr/bin/env bash
set -euo pipefail

# GitHub's Ubuntu 24.04 image includes Chrome and its runtime libraries.
# Cache only the downloaded Noto fonts, not the runner's package database.
font_cache="$PWD/.cache/build-fonts"
font_target="$HOME/.local/share/fonts/smart-jsa-build"
mkdir -p "$font_cache" "$font_target"
if [[ ! -f "$font_cache/fonts.sha256" ]] || ! (cd "$font_cache" && sha256sum --quiet -c fonts.sha256); then
  sudo apt-get update -qq
  download_dir="$(mktemp -d)"
  (
    cd "$download_dir"
    apt-get download fonts-noto-cjk fonts-noto-core
    : > "$font_cache/packages.txt"
    for package in ./*.deb; do
      dpkg-deb --field "$package" Package Version >> "$font_cache/packages.txt"
      dpkg-deb --extract "$package" "$font_cache"
    done
  )
  (cd "$font_cache" && find usr/share/fonts -type f -print0 | sort -z | xargs -0 sha256sum > fonts.sha256)
fi
cp -R "$font_cache/usr/share/fonts/." "$font_target/"
fc-cache -f "$font_target"

# Fail before the build if the runner image no longer provides working Chrome.
chrome="${PUPPETEER_EXECUTABLE_PATH:-/usr/bin/google-chrome}"
timeout 30 "$chrome" --headless --no-sandbox --disable-gpu --dump-dom about:blank > /dev/null
renderer_context="$( { "$chrome" --version; fc-list | sort; cat "$font_cache/fonts.sha256"; } | sha256sum | cut -d' ' -f1)"
echo "JSA_RENDER_CACHE_CONTEXT=$renderer_context" >> "$GITHUB_ENV"
echo "Rendering environment ready; font download cache verified."
