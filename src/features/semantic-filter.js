import { pipeline, env } from '../lib/transformers.min.js'

if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('src/lib/')
}
env.backends.onnx.wasm.numThreads = 1

let embedderPipeline = null
let embedderLoading = null

const getEmbedder = () => {
  if (embedderPipeline) return Promise.resolve(embedderPipeline)
  if (embedderLoading) return embedderLoading
  embedderLoading = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  }).then((p) => {
    embedderPipeline = p
    return p
  })
  return embedderLoading
}

const embed = async (text) => {
  const embedder = await getEmbedder()
  const output = await embedder(text.slice(0, 256), { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

const cosineSimilarity = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0)

let cachedQuery = null
let cachedQueryEmbedding = null

export const semanticCheck = async (query, postText) => {
  if (query !== cachedQuery) {
    cachedQuery = query
    cachedQueryEmbedding = await embed(query)
  }
  const postEmbedding = await embed(postText)
  return cosineSimilarity(cachedQueryEmbedding, postEmbedding)
}
