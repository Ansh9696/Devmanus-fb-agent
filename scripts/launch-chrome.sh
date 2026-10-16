#!/usr/bin/env bash
# ==============================================================================
# Devmanus Extension - Automatic Chrome Launcher
# Launches Google Chrome with Devmanus preloaded from dist/
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"

# Ensure dist exists
if [ ! -f "$DIST_DIR/manifest.json" ]; then
  echo -e "${YELLOW}dist/ folder not found or incomplete. Building now...${RESET}"
  (cd "$PROJECT_ROOT" && npm run build)
fi

echo -e "${BOLD}${CYAN}=== Launching Google Chrome with Devmanus Extension ===${RESET}"
echo -e "Loading extension from: ${CYAN}$DIST_DIR${RESET}"

# macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [ -f "$CHROME_BIN" ]; then
    echo -e "${GREEN}✓ Launching Google Chrome with --load-extension...${RESET}"
    "$CHROME_BIN" --load-extension="$DIST_DIR" "https://www.facebook.com" >/dev/null 2>&1 &
    echo -e "${GREEN}✓ Chrome started with Devmanus extension and Facebook ready!${RESET}"
    exit 0
  else
    echo -e "${YELLOW}Google Chrome not found in standard /Applications path.${RESET}"
    open "chrome://extensions" || true
  fi
# Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --load-extension="$DIST_DIR" "https://www.facebook.com" >/dev/null 2>&1 &
    echo -e "${GREEN}✓ Chrome started on Linux!${RESET}"
    exit 0
  elif command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --load-extension="$DIST_DIR" "https://www.facebook.com" >/dev/null 2>&1 &
    echo -e "${GREEN}✓ Chromium started on Linux!${RESET}"
    exit 0
  fi
fi

echo -e "\n${BOLD}Manual Step:${RESET}"
echo -e "1. Open Chrome to: ${CYAN}chrome://extensions${RESET}"
echo -e "2. Enable 'Developer mode'"
echo -e "3. Click 'Load unpacked' and choose: ${CYAN}$DIST_DIR${RESET}"
