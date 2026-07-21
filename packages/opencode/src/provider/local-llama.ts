import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { LlamaServer, getLlamaServer, AVAILABLE_MODELS, type ModelInfo } from "./llama-server"
import { Log } from "../util/log"

const log = Log.create({ service: "provider:local-llama" })

export function createLocalLlama(options?: { baseUrl?: string }) {
  return createOpenAICompatible({
    name: "local-llama",
    baseURL: options?.baseUrl ?? "http://127.0.0.1:8080/v1",
    apiKey: "not-needed",
  })
}

export async function ensureLlamaServer(modelId: string): Promise<LlamaServer> {
  const llama = getLlamaServer()

  if (!llama.isModelDownloaded(modelId)) {
    log.info(`Model ${modelId} not found, downloading...`)
    await llama.downloadModel(modelId, (downloaded, total) => {
      const pct = ((downloaded / total) * 100).toFixed(1)
      process.stdout.write(`\rDownloading: ${pct}%`)
    })
    process.stdout.write("\n")
  }

  if (!llama.isRunning()) {
    await llama.start(modelId)
  }

  return llama
}

export function getLocalModels(): ModelInfo[] {
  return AVAILABLE_MODELS
}

export function getDefaultModel(): string {
  return "qwen2.5-coder-3b"
}
