# MOOS: Traffic Safety AI

MOOS is a prototype that assists with visual traffic-safety review using Gemini Cloud AI. AI detections can be wrong; a human must verify the image and evidence before taking enforcement action. AI output alone is not proof of a legal violation.

## AI analysis

- **Gemini Cloud AI:** sends the selected image to the configured Gemini API. Requests use your Gemini API quota. The app analyzes one selected image per request, so avoid repeated tests if you need to conserve quota.
- **No local-model mode:** the current version does not support Ollama or local model inference. The backend requires access to the Gemini API and a valid `GEMINI_API_KEY`.

**Privacy:** Images submitted for live analysis are sent to the configured Gemini API. Do not upload sensitive images unless you are authorized to do so. Review the applicable Google API and hosting privacy terms before using real-world evidence.

## Features

- Upload a traffic image and request AI-assisted traffic-safety analysis.
- Review structured detections, confidence indicators, evidence summaries, and possible helmet or other traffic-safety concerns.
- Inspect preset demonstration scenarios.
- Use the citation/challan workflow and export detection records to CSV.
- Use the Challenge Summary Maker to draft an editable project summary from supplied information.
- Receive explicit errors when the API is unavailable or configuration is missing; failed live analysis should not be replaced with fabricated detections.

## Local development setup

1. Install a supported Node.js version and npm.
2. Clone or download this repository.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Configure `GEMINI_API_KEY` in a local `.env` file, or provide it through your hosting platform's secret manager. Never commit the real key.
5. Start the development server:
   ```sh
   npm run dev
   ```
6. Open the local URL printed by the server (the default backend port is `3000`).

## Environment configuration

- `GEMINI_API_KEY`: required for live Gemini analysis.
- `APP_URL`: optional hosting URL used by the deployment environment where applicable.

The `.env.example` file contains placeholders only. Replace them in your local, uncommitted `.env` file or configure secrets through your hosting provider.

## Commands

- `npm run dev`: start the app and backend.
- `npm run lint`: TypeScript check.
- `npm run build`: production frontend build.
- `npm test`: run the repository's automated tests.

## Deployment notes

When hosted on Google AI Studio/Cloud Run, configure `GEMINI_API_KEY` using the platform's secret configuration. A local `127.0.0.1` address inside a hosted backend refers to that backend's own runtime, not your laptop. This project version does not include a local-model provider.

## Accuracy and human review

AI models can miss riders, misread license plates, misclassify helmets, or infer violations from unclear images. Treat all results as preliminary assistance, manually inspect the original image and evidence, and verify uncertain cases before any enforcement decision. Do not treat model output as a confirmed legal finding.
