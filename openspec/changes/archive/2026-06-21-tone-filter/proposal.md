## Why

LinkedIn feeds surface a steady stream of rants, outrage bait, and aggressive posts that have nothing to do with topic-based filters — they're exhausting regardless of subject matter. A small on-device classifier can detect negative or hostile tone and collapse these posts the same way slop and semantic filters do, without any server-side requests.

## What Changes

- Add a **Tone filter** toggle to the Filters settings panel
- Add a `tone-threshold` slider (0–100, default 70) so users can tune sensitivity
- Add a `tone-filter` message handler in `service_worker.js` that runs a `text-classification` pipeline using a small quantized model
- In `feed.js`, send a `tone-check` message for each post not already collapsed, and collapse matching posts with a "🌩 Negative tone" collapse banner
- Bundle a small quantized sentiment model (≈17 MB) alongside the existing ONNX wasm runtime

## Capabilities

### New Capabilities
- `tone-filter`: Detects negative, aggressive, or hostile tone in feed posts using an on-device text-classification model and collapses matching posts

### Modified Capabilities

## Impact

- `src/service_worker.js`: new `tone-check` message handler; loads a second `pipeline()` instance for `text-classification`
- `src/features/feed.js`: new `tone-check` call in `blockPosts`, new banner label
- `src/features/tone-filter.js`: new file — pipeline loader and classification wrapper
- `src/popup/popup.html` / `popup.js` / `popup.css`: new toggle + slider in the Filters panel
- `chrome.storage.local` keys: `tone-filter` (bool), `tone-threshold` (number 0–100)
- `manifest.json`: new bundled model file reference (if model is shipped locally rather than fetched from HuggingFace CDN)
- Model size: `Xenova/distilbert-base-uncased-finetuned-sst-2-english` quantized ≈ 17 MB (fits alongside existing 23 MB MiniLM model)
