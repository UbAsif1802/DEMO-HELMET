# MOOS: Traffic Safety AI

MOOS is a prototype that assists with visual traffic-safety review. AI detections can be wrong; a human must verify the image and evidence before taking enforcement action. AI output alone is not proof of a legal violation.

## AI modes

- **Cloud Mode (Gemini):** sends the selected image to the configured Gemini API and uses your Gemini quota. The app analyzes one selected image per request. Avoid repeated test requests if you need to conserve quota.
- **Local Mode (Ollama):** sends the image to the Ollama server configured for the MOOS backend. It never silently falls back to Gemini. If Ollama is unavailable or the model is missing, the request returns an error.

**Privacy:** Local Mode is local only if the browser, MOOS backend, Ollama server, and other processing/storage paths are all under your control and running locally. If MOOS is hosted remotely, the backend's `127.0.0.1` refers to the host server, not your laptop.

## Local setup

1. Install Ollama from its official website and start the Ollama service.
2. Pull the default vision model:
   ```sh
   ollama pull gemma3:12b
   ```
3. Copy `.env.example` to `.env`. Adjust `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, and `OLLAMA_TIMEOUT_MS` if required. The default URL is `http://127.0.0.1:11434`.
4. Install dependencies with `npm install`.
5. Start MOOS using `npm run dev` and choose **Local · Ollama** in the AI Analysis Mode selector.
6. Run `ollama list` and ensure the model name matches `OLLAMA_MODEL`.

## Cloud setup

Set `GEMINI_API_KEY` in your local environment or hosting secret manager. Cloud Mode returns an explicit error if the key is missing or Gemini fails; it does not fabricate detections to disguise quota or configuration errors.

## Commands

- `npm run dev`: start the app and backend.
- `npm run lint`: TypeScript check.
- `npm run build`: production frontend build.
- `npm test`: run lightweight contract tests.

## Hardware and accuracy

Gemma 3 12B may be slow or exceed available memory depending on quantization, context length, GPU offloading, and other running applications. MOOS does not guarantee the model fits entirely in GPU VRAM. Benchmark latency and accuracy locally. Models can hallucinate, miss riders, misread plates, or infer violations from unclear images. Treat uncertain cases as requiring manual review and verify plate numbers against the original evidence.
