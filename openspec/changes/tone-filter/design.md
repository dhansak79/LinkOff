## Context

The extension already runs two on-device models in the service worker via transformers.js / ONNX wasm:
- `Xenova/all-MiniLM-L6-v2` — sentence embeddings for semantic similarity (`feature-extraction` pipeline)
- The same model re-used for slop-archetype matching against `SLOP_ARCHETYPES`

Both are handled in `service_worker.js` via `chrome.runtime.onMessage`. The content script (`feed.js`) sends per-post messages and the worker returns a score asynchronously.

Tone classification is a different ML task: `text-classification` rather than `feature-extraction`. It produces a label (POSITIVE / NEGATIVE) and a confidence score directly, without needing cosine similarity.

## Goals / Non-Goals

**Goals:**
- Collapse posts whose tone is classified as negative or hostile above a user-configured threshold
- Keep the model on-device (no external API calls)
- Reuse the existing service-worker message-passing and banner infrastructure
- Default off, so existing users see no change until they opt in

**Non-Goals:**
- Multi-language support (model is English-only)
- Fine-tuning or feedback loops
- Distinguishing sub-types of negativity (anger vs. sadness vs. sarcasm)
- Applying tone filtering to posts already collapsed by other detectors

## Decisions

### Model: `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (quantized ≈ 17 MB)

Chosen because it is the smallest production-quality binary classifier available via Xenova with ONNX support. It loads fast and returns a single NEGATIVE confidence score that maps cleanly to a threshold slider.

**Alternative considered — `Xenova/twitter-roberta-base-sentiment-latest`**: Better domain fit (social media language) and 3-class output (positive/neutral/negative), but ~60 MB quantized. The size penalty outweighs the accuracy gain for a default-off feature.

**Alternative considered — zero-shot with existing MiniLM**: Query the embedder with `["negative post", "aggressive content"]`. Avoids a new model entirely, but cosine similarity between a post embedding and a label string is significantly less accurate for tone than a purpose-trained classifier.

### New file `src/features/tone-filter.js`

Mirrors `semantic-filter.js`: lazy-loads the pipeline on first use, cached between service-worker activations. Exports a single `toneCheck(postText)` → `{ score, label }`.

### Threshold: 0–100 slider, stored as `tone-threshold` (integer), default 70

The model returns a confidence score in [0, 1]. The slider value divides by 100 before comparison. 70% feels conservative enough to avoid false positives on factual negative reporting while catching rants and outrage bait.

### Integration point in `feed.js`

After slop and archetype checks, before the semantic-filter check. Posts already collapsed are skipped (same `data-hidden` guard). Uses the same `chrome.runtime.sendMessage` / callback pattern as `slop-archetype-check`.

### Banner label

`"🌩 Negative tone"` — consistent with existing `"🤖 AI post"` and `"🎯 Pattern match"` label conventions. The full collapse banner (with Unfollow and Trust author when a vanity name is extractable) is reused unchanged.

## Risks / Trade-offs

- **SST-2 accuracy on LinkedIn text** → The model was trained on movie reviews; irony, dry humour, or factual reports of bad news may be misclassified. Mitigated by a higher default threshold (70%) and the user-adjustable slider. The existing "Show anyway" / "Trust author" escape hatches handle edge cases.
- **Two ONNX pipelines in MV3 service worker** → MV3 workers can be killed and restarted under memory pressure. Each pipeline re-loads lazily on next message. Cold-start adds latency but no correctness issue.
- **Model download on first use** → 17 MB fetched from HuggingFace CDN (same as existing MiniLM). Nothing to bundle; transformers.js caches in the browser.

## Open Questions

- Is 70% the right default threshold? May need adjustment after real-world testing.

**Decided:** Banner signal line reads `"negative tone · NN%"` to match the `"pattern match · NN%"` format on the archetype banner.
