#!/usr/bin/env bash
# ==============================================================================
# Devmanus Facebook Extension - 1-Click macOS / Linux Setup
# Fully automates dependencies, open-source AI models, and Chrome extension build
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}====================================================${RESET}"
echo -e "${BOLD}${CYAN}      Devmanus FB Extension & AI Agent Setup        ${RESET}"
echo -e "${BOLD}${CYAN}====================================================${RESET}"

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}Error: Node.js is not installed.${RESET}"
  echo -e "Please install Node.js 20+ from https://nodejs.org/ and rerun."
  exit 1
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo -e "${YELLOW}Warning: Node.js 20+ is recommended. Current version: $(node -v)${RESET}"
fi
echo -e "${GREEN}✓ Node.js version:${RESET} $(node -v)"

# 2. Check Ollama & Open-Source AI Model
echo -e "\n${BOLD}[1/4] Checking Ollama & Open-Source AI Models...${RESET}"
if command -v ollama >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Ollama is installed:${RESET} $(ollama --version)"
  if ! curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo -e "${YELLOW}Starting local Ollama service in background...${RESET}"
    nohup ollama serve >/dev/null 2>&1 &
    sleep 3
  fi
  echo -e "Ensuring default model 'llama3.2:1b' is installed..."
  ollama pull llama3.2:1b
else
  echo -e "${YELLOW}Notice: Ollama is not installed yet.${RESET}"
  echo -e "Install Ollama from ${BOLD}https://ollama.com${RESET} (or: ${CYAN}brew install --cask ollama${RESET})"
fi

# 3. Install Extension Dependencies
echo -e "\n${BOLD}[2/4] Installing Extension Dependencies...${RESET}"
npm install

# 4. Install Backend Dependencies & Configure .env
echo -e "\n${BOLD}[3/4] Installing Local Backend Dependencies...${RESET}"
cd server
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✓ Created server/.env preconfigured for local Ollama.${RESET}"
else
  echo -e "${GREEN}✓ server/.env exists.${RESET}"
fi
cd ..

# 5. Build Extension Bundle
echo -e "\n${BOLD}[4/4] Building Extension Bundle (dist/)...${RESET}"
npm run build

echo -e "\n${BOLD}${GREEN}====================================================${RESET}"
echo -e "${BOLD}${GREEN}            Setup Completed Successfully!           ${RESET}"
echo -e "${BOLD}${GREEN}====================================================${RESET}"
echo -e "\n${BOLD}How to Run:${RESET}"
echo -e "1. Start backend & frontend watcher:  ${CYAN}npm run dev:all${RESET} (or ${CYAN}./start.sh${RESET})"
echo -e "2. In Google Chrome, navigate to:    ${CYAN}chrome://extensions${RESET}"
echo -e "3. Toggle on ${BOLD}Developer mode${RESET} (top right)"
echo -e "4. Click ${BOLD}Load unpacked${RESET} and select the ${CYAN}dist/${RESET} folder in this repository."
echo -e "5. Pin Devmanus to your browser bar and open Facebook to test!"
echo
