#!/usr/bin/env bash
# ==============================================================================
# Devmanus Extension - 1-Click Docker Starter (macOS / Linux)
# Starts backend server and Chrome Extension Builder via Docker Compose
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BOLD}${CYAN}=== Starting Devmanus in Docker Mode ===${RESET}"

# 1. Auto-build Chrome extension dist/ bundle immediately if npm is present
if command -v npm >/dev/null 2>&1; then
  echo -e "\n${BOLD}[1/3] Generating Extension dist/ bundle...${RESET}"
  npm run build
  echo -e "${GREEN}✓ dist/ bundle generated successfully.${RESET}"
else
  echo -e "\n${YELLOW}npm not found locally. dist/ will be built automatically inside Docker container.${RESET}"
fi

# 2. Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not installed or not in PATH.${RESET}"
  echo -e "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
  echo -e "Alternatively, you can run locally using: ${CYAN}npm run dev:all${RESET}"
  exit 1
fi

# 3. Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker daemon is not running.${RESET}"
  echo -e "Please open Docker Desktop and wait until it finishes starting, then rerun this script."
  exit 1
fi

# 4. Build and start services in background
echo -e "\n${BOLD}[2/3] Starting Devmanus Backend & Extension containers...${RESET}"
docker compose up -d --build

echo -e "\n${BOLD}[3/3] Waiting for services to become healthy...${RESET}"
sleep 3

echo -e "${GREEN}✓ Docker containers running:${RESET}"
docker compose ps

# 5. Verify dist/ folder
if [ -f "$PROJECT_ROOT/dist/manifest.json" ]; then
  echo -e "\n${GREEN}✓ Chrome Extension dist/ ready at:${RESET} ${CYAN}$PROJECT_ROOT/dist${RESET}"
else
  echo -e "\n${YELLOW}Waiting for extension-builder container to finish generating dist/...${RESET}"
  sleep 3
fi

echo -e "\n${BOLD}${GREEN}====================================================${RESET}"
echo -e "${BOLD}${GREEN}          Devmanus Docker Services Ready!           ${RESET}"
echo -e "${BOLD}${GREEN}====================================================${RESET}"
echo -e "Backend Server:        ${CYAN}http://127.0.0.1:3000/health${RESET}"
echo -e "Sidepanel Web Preview: ${CYAN}http://127.0.0.1:3000/sidepanel${RESET}"
echo -e "Extension Assets:      ${CYAN}http://127.0.0.1:3000/dist/manifest.json${RESET}"
echo -e "\n${BOLD}Chrome Extension Auto-Run:${RESET}"
echo -e "Run: ${CYAN}./scripts/launch-chrome.sh${RESET} to automatically open Chrome with Devmanus preloaded!"
echo -e "Or manually: open ${CYAN}chrome://extensions${RESET} -> Enable Developer mode -> 'Load unpacked' -> select ${CYAN}$PROJECT_ROOT/dist${RESET}"
echo
echo -e "To view backend logs:  ${CYAN}docker compose logs -f backend${RESET}"
echo -e "To stop containers:    ${CYAN}docker compose down${RESET}"
