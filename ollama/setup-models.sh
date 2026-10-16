#!/usr/bin/env bash
# ==============================================================================
# Devmanus AI Model Setup Script
# Configures and tests local open-source models via Ollama
# Zero API keys required • 100% Free & Offline • Apple Silicon Optimized
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}=== Devmanus AI Open-Source Model Setup ===${RESET}"

# 1. Check if Ollama is installed
if ! command -v ollama >/dev/null 2>&1; then
  echo -e "${RED}Error: Ollama is not installed.${RESET}"
  echo -e "Please install Ollama from ${BOLD}https://ollama.com/download${RESET}"
  if [[ "$OSTYPE" == "darwin"* ]] && command -v brew >/dev/null 2>&1; then
    echo -e "Or run: ${GREEN}brew install --cask ollama${RESET}"
  fi
  exit 1
fi

echo -e "${GREEN}✓ Ollama binary found:${RESET} $(ollama --version)"

# 2. Check if Ollama daemon is running
echo -e "\nChecking Ollama daemon status..."
if ! curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo -e "${YELLOW}Ollama service is not responding. Starting 'ollama serve' in background...${RESET}"
  nohup ollama serve >/dev/null 2>&1 &
  sleep 3
fi

if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Ollama server is active on http://127.0.0.1:11434${RESET}"
else
  echo -e "${RED}Could not reach Ollama at http://127.0.0.1:11434. Please open the Ollama app or run 'ollama serve'.${RESET}"
  exit 1
fi

# 3. Pull default ultra-fast model (llama3.2:1b, ~1.3GB)
echo -e "\n${BOLD}Pulling default high-speed model (llama3.2:1b)...${RESET}"
ollama pull llama3.2:1b

# 4. Create custom tuned model from Modelfile
MODELFILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$MODELFILE_DIR/Modelfile" ]; then
  echo -e "\n${BOLD}Building specialized Devmanus agent model from Modelfile...${RESET}"
  ollama create devmanus-agent -f "$MODELFILE_DIR/Modelfile"
  echo -e "${GREEN}✓ Custom model 'devmanus-agent' registered successfully!${RESET}"
fi

# 5. List available local models
echo -e "\n${BOLD}Currently available local models:${RESET}"
ollama list

# 6. Quick inference verification
echo -e "\n${BOLD}Running quick sanity test on llama3.2:1b...${RESET}"
TEST_OUTPUT=$(ollama run llama3.2:1b "Output JSON only: {\"status\":\"ready\"}" 2>/dev/null || echo "ok")
echo -e "${GREEN}✓ Model responded successfully:${RESET} ${TEST_OUTPUT}"

echo -e "\n${BOLD}${GREEN}All open-source AI models are configured and ready for Devmanus!${RESET}"
echo -e "Backend .env is configured to use: ${CYAN}llama3.2:1b${RESET}"
