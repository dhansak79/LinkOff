import { pipeline, env } from '../lib/transformers.min.js'

if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('src/lib/')
}
env.backends.onnx.wasm.numThreads = 1

let classifierLoading = null

// A resolved promise is memoized, so this also serves as the "already loaded" cache.
const getClassifier = () => {
  if (classifierLoading) return classifierLoading
  classifierLoading = pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', {
    quantized: true,
  })
  return classifierLoading
}

export const toneCheck = async (postText) => {
  const classifier = await getClassifier()
  const [result] = await classifier(postText.slice(0, 256))
  const negativeScore = result.label === 'NEGATIVE' ? result.score : 1 - result.score
  return { score: negativeScore, label: result.label }
}
