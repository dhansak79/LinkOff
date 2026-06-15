import { pipeline, env } from '../lib/transformers.min.js'

if (typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('src/lib/')
}
env.backends.onnx.wasm.numThreads = 1

const LABELS = [
  'self-promotion',
  'hustle culture',
  'humble brag',
  'thought leadership',
  'inspirational cliché',
  'genuine insight',
]

const CONFIDENCE_THRESHOLD = 0.65

let classifierPipeline = null
let pipelineLoading = null

const getClassifier = () => {
  if (classifierPipeline) return Promise.resolve(classifierPipeline)
  if (pipelineLoading) return pipelineLoading

  pipelineLoading = pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small', {
    quantized: true,
  }).then((p) => {
    classifierPipeline = p
    return p
  })

  return pipelineLoading
}

export const classifyPost = async (text) => {
  const classifier = await getClassifier()
  const result = await classifier(text.slice(0, 512), LABELS)
  const topLabel = result.labels[0]
  const topScore = result.scores[0]

  if (topLabel === 'genuine insight' || topScore < CONFIDENCE_THRESHOLD) {
    return null
  }

  return { label: topLabel, score: topScore }
}
