# AntCoder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Local-only AI coding agent with llama.cpp backend. Zero cloud, full privacy.**

AntCoder is a fork of [OpenCode X](https://github.com/sdeonvacation/opencode-x) (MIT licensed) designed to run entirely on your machine using local LLMs via llama.cpp. No API keys, no cloud dependencies, no telemetry.

---

## Features

- **100% Local** — runs on your hardware, your data stays private
- **llama.cpp backend** — uses llama-server for fast inference
- **Auto-download models** — downloads GGUF models from HuggingFace on first run
- **Leader + Workers** — multi-agent system with parallel subagents
- **All platforms** — CLI, Desktop (Tauri), and Web UI
- **Open source** — MIT license, fork and extend freely

## Quick Start

```bash
# Install dependencies
bun install

# Run AntCoder (downloads model on first run)
bun run dev
```

## Default Model

| Model | Size | Context | Quality |
|-------|------|---------|---------|
| **Qwen2.5-Coder-3B** | ~1.85GB | 32K | Good for coding |
| Qwen2.5-Coder-1.5B | ~1.0GB | 32K | Lightweight |
| Qwen2.5-Coder-0.5B | ~0.4GB | 32K | Fast, basic |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   AntCoder                       │
├─────────────────────────────────────────────────┤
│  Leader Agent (orchestrates tasks)              │
│  Worker Agents (coder, explorer, planner)       │
├─────────────────────────────────────────────────┤
│  Local LLM Provider                             │
│  - Spawns llama-server as child process         │
│  - OpenAI-compatible API at localhost:8080      │
├─────────────────────────────────────────────────┤
│  llama-server (bundled binary)                  │
│  - Metal/CUDA/Vulkan auto-detection             │
│  - Sleep-on-idle for RAM management             │
├─────────────────────────────────────────────────┤
│  GGUF Models (downloaded on first run)          │
│  - Stored in ~/.config/antcoder/models/         │
└─────────────────────────────────────────────────┘
```

## Configuration

Edit `antcoder.json` to change models or settings:

```json
{
  "model": "local-llama/qwen2.5-coder-3b"
}
```

## Credits

Built on top of:
- [OpenCode X](https://github.com/sdeonvacation/opencode-x) — MIT License
- [OpenCode](https://github.com/anomalyco/opencode) — MIT License
- [llama.cpp](https://github.com/ggml-org/llama.cpp) — MIT License

## License

MIT
