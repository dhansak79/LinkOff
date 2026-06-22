// @vitest-environment jsdom
import { vi, beforeEach, afterEach, it } from 'vitest'

vi.mock('../../src/lib/transformers.min.js', () => ({
  pipeline: vi.fn(),
  env: { backends: { onnx: { wasm: {} } } },
}))

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Requirement: Political content preset topic
// These scenarios describe popup UI behaviour — not testable via jsdom.
// ---------------------------------------------------------------------------

it.todo('Scenario: Political content checkbox exists and is off by default')
it.todo('Scenario: Political content checkbox is persisted when enabled')

// ---------------------------------------------------------------------------
// Requirement: War and conflict preset topic
// These scenarios describe popup UI behaviour — not testable via jsdom.
// ---------------------------------------------------------------------------

it.todo('Scenario: War and conflict checkbox exists and is off by default')
it.todo('Scenario: War and conflict checkbox is persisted when enabled')
