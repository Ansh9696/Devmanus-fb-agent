#!/usr/bin/env bash
# ==============================================================================
# Devmanus AI Extension - 1-Click Starter
# Verifies Ollama is running, then launches backend server and extension watcher
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}Starting Devmanus Facebook AI Extension...${RESET}"

# Verify Ollama is running
if ! curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo -e "${YELLOW}Ollama is not running. Starting Ollama in background...${RESET}"
  if command -v ollama >/dev/null 2>&1; then
    nohup ollama serve >/dev/null 2>&1 &
    sleep 3
  else
    echo -e "${YELLOW}Ollama binary not found in PATH. Please launch Ollama manually.${RESET}"
  fi
fi

if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Ollama server is online on http://127.0.0.1:11434${RESET}"
fi

# Run backend & frontend concurrently
npm run dev:all
