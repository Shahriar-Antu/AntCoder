# AntCoder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

**Local-only AI coding agent with llama.cpp backend. Zero cloud, full privacy.**

AntCoder is a fork of [OpenCode X](https://github.com/sdeonvacation/opencode-x) (MIT licensed) designed to run entirely on your machine using local LLMs via llama.cpp. No API keys, no cloud dependencies, no data leaves your computer.

## Features

- **100% Local** — Runs on your hardware, no internet required after model download
- **Multiple Models** — Qwen2.5-Coder (0.5B, 1.5B, 3B) and more via HuggingFace
- **Leader + Workers** — Parallel subagents for complex tasks
- **OpenCode Architecture** — Built on OpenCode X's proven foundation
- **MIT Licensed** — Fork, modify, extend freely

## Quick Start

```bash
# Clone and install
git clone https://github.com/Shahriar-Antu/AntCoder
cd AntCoder
bun install

# Run CLI (downloads model on first run ~1.85GB)
bun run --cwd packages/opencode dev
```

## Requirements

- **Bun** 1.3.11+
- **llama.cpp** server binary in PATH (or bundled)
- **RAM**: 4GB+ for 3B model, 2GB+ for 1.5B model

## Models

| Model | Size | RAM | Best For |
|-------|------|-----|----------|
| Qwen2.5-Coder-3B | 1.85GB | ~3GB | General coding (default) |
| Qwen2.5-Coder-1.5B | 1.0GB | ~2GB | Fast completion |
| Qwen2.5-Coder-0.5B | 0.4GB | ~1GB | Edge devices |

Models auto-download from HuggingFace on first run.

## Architecture

```
┌─────────────────────────────────────────┐
│              AntCoder CLI               │
├─────────────────────────────────────────┤
│  Leader Agent (orchestrator)            │
│  ├─ Worker: Coder (writes code)         │
│  ├─ Worker: Explorer (reads, searches)  │
│  └─ Worker: Planner (creates plans)     │
├─────────────────────────────────────────┤
│  Local LLM Provider (OpenAI-compatible) │
├─────────────────────────────────────────┤
│  llama-server (child process)           │
│  └─ GGUF Model (on disk)                │
└─────────────────────────────────────────┘
```

## Configuration

Default config (`antcoder.json`):

```json
{
  "provider": {
    "local-llama": {
      "name": "Local Llama",
      "models": {
        "qwen2.5-coder-3b": { ... },
        "qwen2.5-coder-1.5b": { ... },
        "qwen2.5-coder-0.5b": { ... }
      }
    }
  },
  "model": "local-llama/qwen2.5-coder-3b"
}
```

## Development

```bash
# Typecheck
bun --cwd packages/opencode typecheck

# Build binary
bun --cwd packages/opencode run build

# Run tests
bun --cwd packages/opencode test --timeout 30000
```

## License

MIT — Fork of OpenCode X (MIT) + original work.

## Credits

- [OpenCode](https://github.com/anomalyco/opencode) — Original terminal AI agent
- [OpenCode X](https://github.com/sdeonvacation/opencode-x) — Enhanced fork with parallel agents
- [llama.cpp](https://github.com/ggml-org/llama.cpp) — Local inference engine
- [Qwen](https://github.com/QwenLM/Qwen2.5-Coder) — Code models