import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

let classifyPost
let pipelineMock
let mockClassifierFn

beforeEach(async () => {
  vi.resetModules()
  const transformers = await import('../../src/lib/transformers.min.js')
  pipelineMock = transformers.pipeline
  pipelineMock.mockReset()
  mockClassifierFn = vi.fn()
  pipelineMock.mockResolvedValue(mockClassifierFn)
  classifyPost = (await import('../../src/features/classifier.js')).classifyPost
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('classifyPost', () => {
  it('returns label and score for a high-confidence non-genuine result', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['self-promotion', 'hustle culture', 'genuine insight'],
      scores: [0.82, 0.12, 0.06],
    })
    const result = await classifyPost('I just closed a massive deal!')
    expect(result).toEqual({ label: 'self-promotion', score: 0.82 })
  })

  it('returns null when top label is genuine insight', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['genuine insight', 'self-promotion'],
      scores: [0.75, 0.25],
    })
    const result = await classifyPost('Here is a fascinating technical breakdown')
    expect(result).toBeNull()
  })

  it('returns null when confidence is below the threshold', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['hustle culture', 'genuine insight'],
      scores: [0.60, 0.40],
    })
    const result = await classifyPost('Rise and grind!')
    expect(result).toBeNull()
  })

  it('truncates text to 512 characters before classifying', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['thought leadership', 'genuine insight'],
      scores: [0.80, 0.20],
    })
    const longText = 'A'.repeat(1000)
    await classifyPost(longText)
    const [passedText] = mockClassifierFn.mock.calls[0]
    expect(passedText.length).toBe(512)
  })

  it('reuses the cached pipeline on subsequent calls', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['self-promotion', 'genuine insight'],
      scores: [0.70, 0.30],
    })
    await classifyPost('First call')
    await classifyPost('Second call')
    expect(pipelineMock).toHaveBeenCalledTimes(1)
  })

  it('returns pipelineLoading for concurrent calls made before the pipeline resolves', async () => {
    mockClassifierFn.mockResolvedValue({
      labels: ['self-promotion', 'genuine insight'],
      scores: [0.75, 0.25],
    })
    const [r1, r2] = await Promise.all([classifyPost('concurrent 1'), classifyPost('concurrent 2')])
    expect(pipelineMock).toHaveBeenCalledTimes(1)
    expect(r1).toEqual({ label: 'self-promotion', score: 0.75 })
    expect(r2).toEqual({ label: 'self-promotion', score: 0.75 })
  })

  it('sets wasmPaths when chrome.runtime.getURL is available', async () => {
    vi.resetModules()
    const getURL = vi.fn().mockReturnValue('chrome-extension://abc/src/lib/')
    vi.stubGlobal('chrome', { runtime: { getURL } })

    const transformers = await import('../../src/lib/transformers.min.js')
    transformers.pipeline.mockResolvedValue(vi.fn().mockResolvedValue({
      labels: ['self-promotion'], scores: [0.9],
    }))

    const { classifyPost: classifyWithChrome } = await import('../../src/features/classifier.js')
    await classifyWithChrome('test')

    expect(getURL).toHaveBeenCalledWith('src/lib/')
    expect(transformers.env.backends.onnx.wasm.wasmPaths).toBe('chrome-extension://abc/src/lib/')
  })
})
