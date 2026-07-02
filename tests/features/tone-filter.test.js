import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

let toneCheck
let pipelineMock
let mockClassifierFn

beforeEach(async () => {
  vi.resetModules()
  const transformers = await import('../../src/lib/transformers.min.js')
  pipelineMock = transformers.pipeline
  pipelineMock.mockReset()
  mockClassifierFn = vi.fn()
  pipelineMock.mockResolvedValue(mockClassifierFn)
  toneCheck = (await import('../../src/features/tone-filter.js')).toneCheck
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toneCheck', () => {
  it('calls pipeline with the text-classification model', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }])
    await toneCheck('great content')
    expect(pipelineMock).toHaveBeenCalledWith(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
      { quantized: true }
    )
  })

  it('returns NEGATIVE label and score when classifier returns NEGATIVE', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'NEGATIVE', score: 0.87 }])
    const result = await toneCheck('outrage bait')
    expect(result.label).toBe('NEGATIVE')
    expect(result.score).toBeCloseTo(0.87)
  })

  it('returns POSITIVE label and inverted score when classifier returns POSITIVE', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }])
    const result = await toneCheck('wonderful post')
    expect(result.label).toBe('POSITIVE')
    expect(result.score).toBeCloseTo(0.05)
  })

  it('truncates post text to 256 characters', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    await toneCheck('A'.repeat(500))
    expect(mockClassifierFn.mock.calls[0][0].length).toBe(256)
  })

  it('reuses the cached pipeline for subsequent calls', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    await toneCheck('first post')
    await toneCheck('second post')
    expect(pipelineMock).toHaveBeenCalledTimes(1)
  })

  it('reuses an in-flight pipeline load for concurrent calls', async () => {
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    await Promise.all([toneCheck('post a'), toneCheck('post b')])
    expect(pipelineMock).toHaveBeenCalledTimes(1)
  })

  it('sets wasmPaths when chrome.runtime.getURL is available', async () => {
    vi.resetModules()
    const getURL = vi.fn().mockReturnValue('chrome-extension://abc/src/lib/')
    vi.stubGlobal('chrome', { runtime: { getURL } })

    const transformers = await import('../../src/lib/transformers.min.js')
    transformers.pipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    )

    const { toneCheck: tc } = await import('../../src/features/tone-filter.js')
    await tc('post')

    expect(getURL).toHaveBeenCalledWith('src/lib/')
    expect(transformers.env.backends.onnx.wasm.wasmPaths).toBe('chrome-extension://abc/src/lib/')
  })

  it('does not throw when chrome is defined but chrome.runtime is not', async () => {
    vi.resetModules()
    vi.stubGlobal('chrome', {})
    const transformers = await import('../../src/lib/transformers.min.js')
    transformers.pipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    )
    await expect(import('../../src/features/tone-filter.js')).resolves.toBeDefined()
  })

  it('retries loading the pipeline after a prior load failure', async () => {
    pipelineMock.mockRejectedValueOnce(new Error('model download failed'))
    await expect(toneCheck('some post')).rejects.toThrow('model download failed')

    pipelineMock.mockResolvedValueOnce(mockClassifierFn)
    mockClassifierFn.mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }])
    const result = await toneCheck('some post')
    expect(result.label).toBe('POSITIVE')
    expect(pipelineMock).toHaveBeenCalledTimes(2)
  })
})
