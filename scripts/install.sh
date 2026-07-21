#!/usr/bin/env bash
# AntCoder Installer for Linux/macOS
# Usage: curl -fsSL https://antcoder.ai/install | bash

set -euo pipefail

REPO="Shahriar-Antu/AntCoder"
BINARY_NAME="antcoder"
INSTALL_DIR="${HOME}/.local/bin"
MODELS_DIR="${HOME}/.config/antcoder/models"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[antcoder]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }
success() { echo -e "${GREEN}[ok]${NC} $*"; }

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) error "Unsupported architecture: $ARCH" ;;
esac

case $OS in
  linux)
    if [[ $(uname -o 2>/dev/null) == "Android" ]]; then
      OS="android"
    else
      OS="linux"
    fi
    ;;
  darwin) OS="darwin" ;;
  *) error "Unsupported OS: $OS" ;;
esac

# Get latest release
log "Fetching latest release..."
RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")
VERSION=$(echo "$RELEASE_JSON" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
[[ -z "$VERSION" ]] && error "Failed to get latest version"

log "Installing ${BINARY_NAME} ${VERSION}..."

# Determine asset name
if [[ "$OS" == "darwin" ]]; then
  ASSET="${BINARY_NAME}-${OS}-${ARCH}.zip"
elif [[ "$OS" == "linux" ]]; then
  ASSET="${BINARY_NAME}-${OS}-${ARCH}.tar.gz"
else
  error "No binary for $OS"
fi

# Download
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

log "Downloading ${ASSET}..."
curl -fL# -o "${TEMP_DIR}/${ASSET}" "$DOWNLOAD_URL" || error "Download failed"

# Extract
log "Extracting..."
cd "$TEMP_DIR"
if [[ "$ASSET" == *.zip ]]; then
  unzip -q "$ASSET"
else
  tar -xzf "$ASSET"
fi

# Install binary
mkdir -p "$INSTALL_DIR"
install -m 755 "${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"

# Create models directory
mkdir -p "$MODELS_DIR"

# Add to PATH if needed
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  SHELL_RC=""
  case $(basename "$SHELL") in
    bash) SHELL_RC="${HOME}/.bashrc" ;;
    zsh) SHELL_RC="${HOME}/.zshrc" ;;
    fish) SHELL_RC="${HOME}/.config/fish/config.fish" ;;
  esac

  if [[ -n "$SHELL_RC" ]]; then
    echo "export PATH=\"\$PATH:${INSTALL_DIR}\"" >> "$SHELL_RC"
    log "Added ${INSTALL_DIR} to PATH in ${SHELL_RC}"
    warn "Restart your shell or run: source ${SHELL_RC}"
  fi
fi

# Verify
if command -v "$BINARY_NAME" >/dev/null 2>&1; then
  success "${BINARY_NAME} ${VERSION} installed successfully!"
  log "Run '${BINARY_NAME}' to start (downloads model on first run ~1.85GB)"
  log "Models stored in: ${MODELS_DIR}"
else
  warn "Binary installed but not in PATH. Add ${INSTALL_DIR} to your PATH."
fi