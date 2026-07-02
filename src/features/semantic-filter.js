import { pipeline, env } from '../lib/transformers.min.js'

if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('src/lib/')
}
env.backends.onnx.wasm.numThreads = 1

let embedderLoading = null

// A resolved promise is memoized, so this also serves as the "already loaded" cache.
// On rejection the cache is cleared so a transient load failure can be retried.
const getEmbedder = () => {
  if (embedderLoading) return embedderLoading
  embedderLoading = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    quantized: true,
  }).catch((err) => {
    embedderLoading = null
    throw err
  })
  return embedderLoading
}

const embed = async (text) => {
  const embedder = await getEmbedder()
  const output = await embedder(text.slice(0, 256), { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

const cosineSimilarity = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0)

let cachedQueriesKey = null
let cachedQueryEmbeddings = []

export const semanticCheck = async (queries, postText) => {
  const key = queries.join('|')
  if (key !== cachedQueriesKey) {
    // Only commit the cache once the embeddings actually resolve — otherwise
    // a failed load poisons the key and a same-query retry would silently
    // skip re-embedding and run against the stale (empty) cache.
    const embeddings = await Promise.all(queries.map(embed))
    cachedQueriesKey = key
    cachedQueryEmbeddings = embeddings
  }
  const postEmbedding = await embed(postText)
  const scores = cachedQueryEmbeddings.map((qe) => cosineSimilarity(qe, postEmbedding))
  const best = scores.indexOf(Math.max(...scores))
  return { score: scores[best], topic: queries[best] }
}
