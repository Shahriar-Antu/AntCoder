import { spawn, type ChildProcess } from "child_process"
import { existsSync, statSync, mkdirSync } from "fs"
import path from "path"
import os from "os"
import { Log } from "../util/log"

const log = Log.create({ service: "llama-server" })

export interface LlamaServerConfig {
  modelsDir: string
  port?: number
  contextSize?: number
  gpuLayers?: number
  sleepIdleSeconds?: number
}

export interface ModelInfo {
  id: string
  name: string
  repo: string
  filename: string
  sizeBytes: number
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: "qwen2.5-coder-3b",
    name: "Qwen2.5-Coder-3B",
    repo: "Qwen/Qwen2.5-Coder-3B-Instruct-GGUF",
    filename: "qwen2.5-coder-3b-instruct-q4_k_m.gguf",
    sizeBytes: 1_930_000_000,
  },
  {
    id: "qwen2.5-coder-1.5b",
    name: "Qwen2.5-Coder-1.5B",
    repo: "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
    filename: "qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
    sizeBytes: 1_050_000_000,
  },
  {
    id: "qwen2.5-coder-0.5b",
    name: "Qwen2.5-Coder-0.5B",
    repo: "Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF",
    filename: "qwen2.5-coder-0.5b-instruct-q4_k_m.gguf",
    sizeBytes: 400_000_000,
  },
]

export class LlamaServer {
  private server: ChildProcess | null = null
  private config: LlamaServerConfig
  private currentModel: string | null = null

  constructor(config: LlamaServerConfig) {
    this.config = {
      port: 8080,
      contextSize: 4096,
      gpuLayers: 99,
      sleepIdleSeconds: 300,
      ...config,
    }
    mkdirSync(this.config.modelsDir, { recursive: true })
  }

  get baseUrl(): string {
    return `http://127.0.0.1:${this.config.port}`
  }

  get modelsDir(): string {
    return this.config.modelsDir
  }

  isModelDownloaded(modelId: string): boolean {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
    if (!model) return false
    const modelPath = path.join(this.config.modelsDir, model.filename)
    if (!existsSync(modelPath)) return false
    const { size } = statSync(modelPath)
    return size > 100_000_000
  }

  getModelPath(modelId: string): string | null {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
    if (!model) return null
    const modelPath = path.join(this.config.modelsDir, model.filename)
    return existsSync(modelPath) ? modelPath : null
  }

  async downloadModel(
    modelId: string,
    onProgress?: (downloaded: number, total: number) => void,
  ): Promise<string> {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId)
    if (!model) throw new Error(`Unknown model: ${modelId}`)

    const modelPath = path.join(this.config.modelsDir, model.filename)
    if (this.isModelDownloaded(modelId)) {
      log.info(`Model ${modelId} already downloaded`)
      return modelPath
    }

    log.info(`Downloading ${model.name}...`)
    const url = `https://huggingface.co/${model.repo}/resolve/main/${model.filename}`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Download failed: ${response.statusText}`)

    const total = Number(response.headers.get("content-length")) || model.sizeBytes
    let downloaded = 0

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      downloaded += value.length
      onProgress?.(downloaded, total)
    }

    const { writeFileSync } = await import("fs")
    const buffer = Buffer.concat(chunks)
    writeFileSync(modelPath, buffer)

    log.info(`Downloaded ${model.name} to ${modelPath}`)
    return modelPath
  }

  async start(modelId: string): Promise<void> {
    if (this.server) {
      await this.stop()
    }

    const modelPath = this.getModelPath(modelId)
    if (!modelPath) {
      throw new Error(`Model ${modelId} not downloaded. Run download first.`)
    }

    log.info(`Starting llama-server with ${modelId}...`)

    this.server = spawn(
      "llama-server",
      [
        "-m",
        modelPath,
        "-c",
        String(this.config.contextSize),
        "-ngl",
        String(this.config.gpuLayers),
        "--port",
        String(this.config.port),
        "--host",
        "127.0.0.1",
        "--sleep-idle-seconds",
        String(this.config.sleepIdleSeconds),
      ],
      { stdio: "pipe" },
    )

    this.currentModel = modelId

    this.server.stdout?.on("data", (data) => {
      const line = data.toString()
      if (line.includes("HTTP server listening")) {
        log.info(`llama-server ready on port ${this.config.port}`)
      }
    })

    this.server.stderr?.on("data", (data) => {
      log.debug(`llama-server: ${data.toString().trim()}`)
    })

    this.server.on("exit", (code) => {
      log.info(`llama-server exited with code ${code}`)
      this.server = null
      this.currentModel = null
    })

    await this.waitForReady()
  }

  private async waitForReady(timeout = 30_000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      try {
        const health = await fetch(`${this.baseUrl}/health`)
        const data = (await health.json()) as { status: string }
        if (data.status === "ok") return
      } catch {}
      await new Promise((r) => setTimeout(r, 500))
    }
    throw new Error("llama-server failed to start")
  }

  async stop(): Promise<void> {
    if (!this.server) return

    return new Promise((resolve) => {
      this.server!.on("exit", () => {
        this.server = null
        this.currentModel = null
        resolve()
      })
      this.server!.kill("SIGTERM")
    })
  }

  async healthCheck(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.baseUrl}/health`)
      const data = (await resp.json()) as { status: string }
      return data.status === "ok"
    } catch {
      return false
    }
  }

  isRunning(): boolean {
    return this.server !== null && !this.server.killed
  }

  getCurrentModel(): string | null {
    return this.currentModel
  }
}

let instance: LlamaServer | null = null

export function getLlamaServer(config?: LlamaServerConfig): LlamaServer {
  if (!instance) {
    const defaultConfig: LlamaServerConfig = {
      modelsDir: path.join(
        os.homedir(),
        process.platform === "darwin"
          ? "Library/Application Support/antcoder/models"
          : process.platform === "win32"
            ? "AppData/Roaming/antcoder/models"
            : ".config/antcoder/models",
      ),
    }
    instance = new LlamaServer(config ?? defaultConfig)
  }
  return instance
}
