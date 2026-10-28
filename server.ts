import express, { type Express } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/bmp',
]);

export type AnalysisMode = 'cloud' | 'local';

type AppOptions = {
  aiClient?: GoogleGenAI | null;
  fetchImpl?: typeof fetch;
};

class ProviderAppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = 'ProviderAppError';
    this.statusCode = statusCode;
  }
}

function normalizeMimeType(mimeType?: string): string {
  const cleaned = typeof mimeType === 'string' ? mimeType : '';
  return cleaned.split(';')[0].trim().toLowerCase();
}

function asInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function parseResponseJson(raw: unknown, providerLabel: string): any {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      throw new ProviderAppError(`${providerLabel} returned malformed JSON. Please verify the model output and try again.`, 502);
    }
  }

  if (raw && typeof raw === 'object') {
    return raw;
  }

  throw new ProviderAppError(`${providerLabel} returned an empty or invalid response.`, 502);
}

function sanitizeDetection(detection: any, index: number): any {
  const rawConfidence = Number(detection?.confidence ?? 0);
  const confidence = Number.isFinite(rawConfidence) ? Math.min(Math.max(rawConfidence, 0), 1) : 0;
  const numericBox = Array.isArray(detection?.box_2d) ? detection.box_2d : [];
  const box_2d = numericBox.length === 4 && numericBox.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))
    ? [Number(numericBox[0]), Number(numericBox[1]), Number(numericBox[2]), Number(numericBox[3])] as [number, number, number, number]
    : undefined;

  const licensePlate = detection?.license_plate && typeof detection.license_plate === 'object' ? detection.license_plate : {};
  const licenseValue = typeof licensePlate.value === 'string' && licensePlate.value.trim() ? licensePlate.value : 'NOT_READABLE';
  const licenseStatus = ['READABLE', 'PARTIAL', 'NOT_READABLE'].includes(licensePlate.status) ? licensePlate.status : 'NOT_READABLE';
  const licenseConfidence = Number.isFinite(Number(licensePlate.confidence)) ? Number(licensePlate.confidence) : 0;

  const vehicleType = typeof detection?.vehicle_type === 'string' && detection.vehicle_type.trim() ? detection.vehicle_type : 'other';
  const category = typeof detection?.category === 'string' && detection.category.trim() ? detection.category : 'NO_CONFIRMED_VIOLATION';
  const targetLabel = typeof detection?.target_label === 'string' && detection.target_label.trim() ? detection.target_label : `Detection ${index + 1}`;

  const confidenceLevel = ['High', 'Medium', 'Low'].includes(detection?.confidence_level)
    ? detection.confidence_level
    : confidence >= 0.7
      ? 'High'
      : confidence >= 0.4
        ? 'Medium'
        : 'Low';

  return {
    id: asInteger(detection?.id ?? index + 1, index + 1),
    vehicle_type: vehicleType,
    target_label: targetLabel,
    category,
    is_violation: Boolean(detection?.is_violation),
    is_potential: Boolean(detection?.is_potential),
    is_uncertain: Boolean(detection?.is_uncertain),
    confidence,
    confidence_level: confidenceLevel,
    evidence: typeof detection?.evidence === 'string' && detection.evidence.trim() ? detection.evidence : 'No supporting evidence was returned.',
    occupants_count: Number.isInteger(detection?.occupants_count) ? asInteger(detection.occupants_count, 1) : undefined,
    helmet_status: ['WEARING_HELMET', 'NO_HELMET', 'UNCERTAIN'].includes(detection?.helmet_status) ? detection.helmet_status : undefined,
    seatbelt_status: ['SEATBELT_VISIBLE', 'SEATBELT_NOT_VISIBLE', 'UNCERTAIN'].includes(detection?.seatbelt_status) ? detection.seatbelt_status : undefined,
    timestamp: typeof detection?.timestamp === 'string' ? detection.timestamp : undefined,
    license_plate: {
      value: licenseValue,
      confidence: Number.isFinite(licenseConfidence) ? Math.min(Math.max(licenseConfidence, 0), 1) : 0,
      status: licenseStatus,
    },
    box_2d,
  };
}

export function normalizeTrafficSafetyResponse(raw: unknown): any {
  const parsed = parseResponseJson(raw, 'AI');

  if (!parsed || typeof parsed !== 'object') {
    throw new ProviderAppError('AI returned an empty or invalid response. Please try again.', 502);
  }

  const quality = parsed.quality_check && typeof parsed.quality_check === 'object' ? parsed.quality_check : {};
  const detectionsSource = Array.isArray(parsed.detections) ? parsed.detections : [];
  const detections = detectionsSource.map((detection: any, index: number) => sanitizeDetection(detection, index));

  const summarySource = parsed.summary && typeof parsed.summary === 'object' ? parsed.summary : {};
  const riderCountFromDetections = detections.filter((d: any) => d.vehicle_type === 'motorcycle' || d.vehicle_type === 'scooter').length;
  const totalRidersCandidate = typeof summarySource.total_riders === 'number' ? summarySource.total_riders : riderCountFromDetections;
  const totalRiders = asInteger(totalRidersCandidate || detections.length, 0);

  const wearingHelmetCandidate = typeof summarySource.wearing_helmet === 'number' ? summarySource.wearing_helmet : detections.filter((d: any) => d.helmet_status === 'WEARING_HELMET').length;
  const noHelmetCandidate = typeof summarySource.no_helmet === 'number' ? summarySource.no_helmet : detections.filter((d: any) => d.category === 'NO_HELMET' || d.helmet_status === 'NO_HELMET').length;

  const finalAssessmentSource = parsed.final_assessment && typeof parsed.final_assessment === 'object' ? parsed.final_assessment : {};
  const confirmedViolationsCandidate = typeof finalAssessmentSource.confirmed_violations === 'number' ? finalAssessmentSource.confirmed_violations : detections.filter((d: any) => d.is_violation).length;
  const potentialIssuesCandidate = typeof finalAssessmentSource.potential_issues === 'number' ? finalAssessmentSource.potential_issues : detections.filter((d: any) => d.is_potential).length;
  const manualReviewRequired = Boolean(finalAssessmentSource.manual_review_required ?? detections.some((d: any) => d.is_uncertain || d.is_potential));

  const summary = {
    total_riders: totalRiders,
    wearing_helmet: asInteger(wearingHelmetCandidate, 0),
    no_helmet: asInteger(noHelmetCandidate, 0),
    triple_riding: asInteger(
      typeof summarySource.triple_riding === 'number' ? summarySource.triple_riding : detections.filter((d: any) => d.category === 'TRIPLE_RIDING').length,
      0,
    ),
    cars_detected: asInteger(
      typeof summarySource.cars_detected === 'number' ? summarySource.cars_detected : detections.filter((d: any) => d.vehicle_type === 'car').length,
      0,
    ),
    seatbelt_issues: asInteger(
      typeof summarySource.seatbelt_issues === 'number' ? summarySource.seatbelt_issues : detections.filter((d: any) => d.category === 'POTENTIAL_SEATBELT_ISSUE').length,
      0,
    ),
    occupancy_issues: asInteger(
      typeof summarySource.occupancy_issues === 'number' ? summarySource.occupancy_issues : detections.filter((d: any) => d.category === 'POTENTIAL_OCCUPANCY_ISSUE').length,
      0,
    ),
    uncertain: asInteger(
      typeof summarySource.uncertain === 'number' ? summarySource.uncertain : detections.filter((d: any) => d.is_uncertain).length,
      0,
    ),
  };

  const normalized: any = {
    quality_check: {
      is_usable: Boolean(quality.is_usable ?? true),
      message: typeof quality.message === 'string' && quality.message.trim() ? quality.message : 'The selected AI model reviewed the image.',
    },
    summary,
    detections,
    final_assessment: {
      confirmed_violations: asInteger(confirmedViolationsCandidate, 0),
      potential_issues: asInteger(potentialIssuesCandidate, 0),
      manual_review_required: manualReviewRequired,
    },
  };

  const imageAnalysis = parsed.image_analysis && typeof parsed.image_analysis === 'object' ? parsed.image_analysis : {};
  const finalResult = parsed.final_result && typeof parsed.final_result === 'object' ? parsed.final_result : {};

  if (Object.keys(imageAnalysis).length > 0) {
    normalized.image_analysis = {
      total_riders: asInteger(typeof imageAnalysis.total_riders === 'number' ? imageAnalysis.total_riders : summary.total_riders, summary.total_riders),
      wearing_helmet: asInteger(typeof imageAnalysis.wearing_helmet === 'number' ? imageAnalysis.wearing_helmet : summary.wearing_helmet, summary.wearing_helmet),
      no_helmet: asInteger(typeof imageAnalysis.no_helmet === 'number' ? imageAnalysis.no_helmet : summary.no_helmet, summary.no_helmet),
      uncertain: asInteger(typeof imageAnalysis.uncertain === 'number' ? imageAnalysis.uncertain : summary.uncertain, summary.uncertain),
    };
  }

  if (Object.keys(finalResult).length > 0) {
    normalized.final_result = {
      no_helmet_detected: Boolean(finalResult.no_helmet_detected ?? summary.no_helmet > 0),
      no_helmet_count: asInteger(typeof finalResult.no_helmet_count === 'number' ? finalResult.no_helmet_count : summary.no_helmet, summary.no_helmet),
    };
  }

  return normalized;
}

function isLikelyVisionModel(modelName: string): boolean {
  const normalized = modelName.toLowerCase();
  return /vision|gemma|llava|qwen|pixtral|minicpm|bakllava|mistral|moondream|llama.*vision/i.test(normalized);
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const aiClient = options.aiClient ?? (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);
  const fetchFn = options.fetchImpl ?? fetch;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'AI Traffic Safety Analyzer (Camera & Photo)',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  async function analyzeTraffic(req: express.Request, res: express.Response) {
    try {
      const payload = req.body ?? {};
      const { image, imageUrl, mimeType, mode = 'cloud' } = payload;
      const normalizedMode = typeof mode === 'string' ? mode.toLowerCase() : 'cloud';

      if (normalizedMode !== 'cloud' && normalizedMode !== 'local') {
        return res.status(400).json({ error: 'Invalid AI mode. Choose cloud or local.' });
      }

      const rawImage = image ?? imageUrl;
      if (rawImage === undefined || rawImage === null || (typeof rawImage === 'string' && rawImage.trim().length === 0)) {
        return res.status(400).json({ error: 'Please choose an image to analyze.' });
      }

      let cleanBase64 = typeof rawImage === 'string' ? rawImage : '';
      let detectedMime = normalizeMimeType(mimeType ?? 'image/jpeg');

      if (typeof rawImage === 'string' && /^https?:\/\//i.test(rawImage)) {
        try {
          const fetchResponse = await fetchFn(rawImage);
          if (!fetchResponse.ok) {
            throw new ProviderAppError(`Failed to fetch image from the provided URL (${fetchResponse.status}).`, 400);
          }
          const arrayBuffer = await fetchResponse.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
          detectedMime = normalizeMimeType(fetchResponse.headers.get('content-type') ?? detectedMime) || 'image/jpeg';
        } catch (error) {
          if (error instanceof ProviderAppError) {
            throw error;
          }
          throw new ProviderAppError('Unable to load the image from the provided URL.', 400);
        }
      } else if (typeof rawImage === 'string' && rawImage.startsWith('data:')) {
        const match = rawImage.match(/^data:([^;,]+);base64,(.+)$/i);
        if (match) {
          detectedMime = normalizeMimeType(match[1]) || detectedMime;
          cleanBase64 = match[2] ?? '';
        } else {
          cleanBase64 = rawImage.replace(/^data:[^;]+;base64,/, '');
        }
      }

      if (!detectedMime || !detectedMime.startsWith('image/')) {
        return res.status(415).json({ error: 'Unsupported image type. Please upload a valid image.' });
      }
      if (!ACCEPTED_IMAGE_MIME_TYPES.has(detectedMime)) {
        return res.status(415).json({ error: `Unsupported image type: ${detectedMime}. Please upload JPEG, PNG, WebP, or BMP.` });
      }

      const actualImageBytes = Buffer.byteLength(cleanBase64, 'base64');
      if (actualImageBytes < 1 || actualImageBytes > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: 'Image payload is empty or too large. Please use an image under 25 MB.' });
      }

      const promptText = `You are a high-precision Municipal Traffic Safety AI. Carefully inspect the provided image and return only a valid JSON object matching the expected traffic-safety contract. Do not invent facts. If the scene is unclear, mark the result as uncertain and require manual review. Return a strong summary plus detection entries with a valid bounding box only when one is visible and reliable.`;

      let providerText: string | null = null;

      if (normalizedMode === 'local') {
        const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
        const ollamaModel = process.env.OLLAMA_MODEL || 'gemma3:12b';
        const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

        if (!isLikelyVisionModel(ollamaModel)) {
          throw new ProviderAppError(`Configured Ollama model '${ollamaModel}' may not support image input. Use a vision-capable model such as gemma3:12b.`, 400);
        }

        try {
          const response = await fetchFn(`${ollamaBaseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(timeoutMs),
            body: JSON.stringify({
              model: ollamaModel,
              stream: false,
              format: 'json',
              messages: [
                {
                  role: 'user',
                  content: `${promptText} Return one JSON object with keys quality_check, summary, detections, and final_assessment. Each detection should include id, vehicle_type, target_label, category, is_violation, is_potential, is_uncertain, confidence, confidence_level, evidence, box_2d when visible, occupants_count when visible, helmet_status, and license_plate. Use only the provided category and status values. Never fabricate bounding boxes or detection details.`,
                  images: [cleanBase64],
                },
              ],
              options: { temperature: 0.1 },
            }),
          });

          if (response.status === 404) {
            throw new ProviderAppError(`Ollama model '${ollamaModel}' was not found. Pull it with: ollama pull ${ollamaModel}`, 503);
          }
          if (!response.ok) {
            throw new ProviderAppError(`Ollama returned an error (${response.status}). Check the Ollama server logs.`, 502);
          }

          const payload = await response.json().catch(() => null);
          const content = payload?.message?.content;
          if (typeof content !== 'string' || !content.trim()) {
            throw new ProviderAppError('Ollama returned an empty or invalid response. No cloud fallback was attempted.', 502);
          }
          providerText = content;
        } catch (error) {
          if (error instanceof ProviderAppError) {
            throw error;
          }
          const timedOut = error instanceof Error && error.name === 'TimeoutError';
          throw new ProviderAppError(
            timedOut
              ? 'Local AI timed out. Try a smaller image or increase OLLAMA_TIMEOUT_MS.'
              : 'Cannot connect to Ollama. Start Ollama and confirm the local model is available. No cloud fallback was attempted.',
            503,
          );
        }
      } else {
        if (!aiClient) {
          throw new ProviderAppError('Gemini Cloud Mode is not configured. Add GEMINI_API_KEY or select Local Mode.', 503);
        }

        const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
        let lastError: Error | null = null;

        for (const modelName of candidateModels) {
          try {
            const response = await aiClient.models.generateContent({
              model: modelName,
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType: detectedMime, data: cleanBase64 } },
                    { text: promptText },
                  ],
                },
              ],
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    quality_check: {
                      type: Type.OBJECT,
                      properties: {
                        is_usable: { type: Type.BOOLEAN },
                        message: { type: Type.STRING },
                      },
                      required: ['is_usable', 'message'],
                    },
                    summary: {
                      type: Type.OBJECT,
                      properties: {
                        total_riders: { type: Type.INTEGER },
                        wearing_helmet: { type: Type.INTEGER },
                        no_helmet: { type: Type.INTEGER },
                        triple_riding: { type: Type.INTEGER },
                        cars_detected: { type: Type.INTEGER },
                        seatbelt_issues: { type: Type.INTEGER },
                        occupancy_issues: { type: Type.INTEGER },
                        uncertain: { type: Type.INTEGER },
                      },
                      required: ['total_riders', 'wearing_helmet', 'no_helmet', 'triple_riding', 'cars_detected', 'seatbelt_issues', 'occupancy_issues', 'uncertain'],
                    },
                    detections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.INTEGER },
                          vehicle_type: { type: Type.STRING },
                          target_label: { type: Type.STRING },
                          category: { type: Type.STRING },
                          is_violation: { type: Type.BOOLEAN },
                          is_potential: { type: Type.BOOLEAN },
                          is_uncertain: { type: Type.BOOLEAN },
                          confidence: { type: Type.NUMBER },
                          confidence_level: { type: Type.STRING },
                          evidence: { type: Type.STRING },
                          occupants_count: { type: Type.INTEGER },
                          helmet_status: { type: Type.STRING },
                          seatbelt_status: { type: Type.STRING },
                          license_plate: {
                            type: Type.OBJECT,
                            properties: {
                              value: { type: Type.STRING },
                              confidence: { type: Type.NUMBER },
                              status: { type: Type.STRING },
                            },
                            required: ['value', 'confidence', 'status'],
                          },
                          timestamp: { type: Type.STRING },
                          box_2d: {
                            type: Type.ARRAY,
                            items: { type: Type.NUMBER },
                          },
                        },
                        required: ['id', 'vehicle_type', 'target_label', 'category', 'is_violation', 'is_potential', 'is_uncertain', 'confidence', 'confidence_level', 'evidence'],
                      },
                    },
                    final_assessment: {
                      type: Type.OBJECT,
                      properties: {
                        confirmed_violations: { type: Type.INTEGER },
                        potential_issues: { type: Type.INTEGER },
                        manual_review_required: { type: Type.BOOLEAN },
                      },
                      required: ['confirmed_violations', 'potential_issues', 'manual_review_required'],
                    },
                  },
                  required: ['quality_check', 'summary', 'detections', 'final_assessment'],
                },
              },
            });

            if (typeof response?.text === 'string' && response.text.trim()) {
              providerText = response.text;
              break;
            }
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
          }
        }

        if (!providerText) {
          throw lastError ?? new ProviderAppError('No response returned from Gemini.', 502);
        }
      }

      if (!providerText || !providerText.trim()) {
        throw new ProviderAppError('AI returned an empty response. Please try again.', 502);
      }

      const parsedData = normalizeTrafficSafetyResponse(providerText);
      return res.json(parsedData);
    } catch (error) {
      if (error instanceof ProviderAppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error && error.message ? error.message : 'Analysis failed. Check the selected provider configuration and try again.';
      return res.status(502).json({ error: message });
    }
  }

  app.post('/api/analyze-traffic', analyzeTraffic);
  app.post('/api/analyze-helmet', analyzeTraffic);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  return app;
}

export async function startServer(portInput?: number): Promise<import('http').Server> {
  const port = Number.isFinite(portInput) ? (portInput as number) : Number(process.env.PORT) || 3000;
  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`AI Vision Server running on http://0.0.0.0:${port}`);
      resolve(server);
    });
  });
}

const isDirectExecution = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isDirectExecution) {
  void startServer();
}
