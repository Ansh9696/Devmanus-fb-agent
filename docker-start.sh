#!/usr/bin/env bash
# ==============================================================================
# Devmanus Extension - 1-Click Docker Starter (macOS / Linux)
# Starts backend server and Ollama AI via Docker Compose
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}=== Starting Devmanus in Docker Mode ===${RESET}"

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not installed or not in PATH.${RESET}"
  echo -e "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker daemon is not running.${RESET}"
  echo -e "Please open Docker Desktop and wait until it finishes starting."
  exit 1
fi

# Build and start services in background
echo -e "\n${BOLD}Starting Devmanus Backend & Ollama containers...${RESET}"
docker compose up -d --build

echo -e "\n${BOLD}Waiting for services to become healthy...${RESET}"
sleep 4

echo -e "${GREEN}✓ Docker containers running:${RESET}"
docker compose ps

echo -e "\n${BOLD}${GREEN}====================================================${RESET}"
echo -e "${BOLD}${GREEN}          Devmanus Docker Services Ready!           ${RESET}"
echo -e "${BOLD}${GREEN}====================================================${RESET}"
echo -e "Backend Server:  ${CYAN}http://127.0.0.1:3000/health${RESET}"
echo -e "Ollama Engine:   ${CYAN}http://127.0.0.1:11434${RESET}"
echo -e "\n${BOLD}Chrome Extension Setup:${RESET}"
echo -e "1. Open Google Chrome: ${CYAN}chrome://extensions${RESET}"
echo -e "2. Enable 'Developer mode' (top right)"
echo -e "3. Click 'Load unpacked' -> select the ${CYAN}dist/${RESET} folder in this project"
echo -e "4. Pin Devmanus and open Facebook!"
echo
echo -e "To view backend logs:  ${CYAN}docker compose logs -f backend${RESET}"
echo -e "To stop containers:    ${CYAN}docker compose down${RESET}"
