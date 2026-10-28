import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Accept up to 50MB for high-resolution photo captures
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'AI Traffic Safety Analyzer (Camera & Photo)',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Core Traffic Safety Analysis Logic
  async function handleTrafficAnalysis(req: express.Request, res: express.Response) {
    try {
      const { image, imageUrl, mimeType = 'image/jpeg', mode = 'cloud' } = req.body;

      if (mode !== 'cloud' && mode !== 'local') {
        return res.status(400).json({ error: 'Invalid AI mode. Choose cloud or local.' });
      }
      const rawImage = image || imageUrl;

      if (!rawImage) {
        return res.status(400).json({ error: 'Please choose an image to analyze.' });
      }

      let cleanBase64 = rawImage;
      let detectedMime = mimeType;

      // Handle server-side URL fetching to avoid browser CORS restrictions
      if (typeof rawImage === 'string' && (rawImage.startsWith('http://') || rawImage.startsWith('https://'))) {
        try {
          const fetchRes = await fetch(rawImage);
          if (!fetchRes.ok) {
            throw new Error(`Failed to fetch image: ${fetchRes.statusText}`);
          }
          const arrayBuffer = await fetchRes.arrayBuffer();
          cleanBase64 = Buffer.from(arrayBuffer).toString('base64');
          detectedMime = fetchRes.headers.get('content-type') || 'image/jpeg';
        } catch (fetchErr: any) {
          console.error('Server URL fetch error:', fetchErr);
          return res.status(400).json({ error: 'Unable to load the image from the provided URL.' });
        }
      } else if (typeof rawImage === 'string' && rawImage.startsWith('data:')) {
        const matches = rawImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          detectedMime = matches[1];
          cleanBase64 = matches[2];
        } else {
          cleanBase64 = rawImage.replace(/^data:[^;]+;base64,/, '');
        }
      }

      if (!detectedMime.startsWith('image/')) {
        return res.status(415).json({ error: 'Unsupported image type. Please upload a valid image.' });
      }
      if (!cleanBase64 || cleanBase64.length > 35_000_000) {
        return res.status(413).json({ error: 'Image payload is empty or too large. Please use an image under 25 MB.' });
      }

      // Exhaustive multi-target scanning prompt
      const promptText = `You are a high-precision Municipal Traffic Safety AI.
Exhaustively scan the ENTIRE scene and detect EVERY SINGLE person and vehicle present.

MANDATORY RULES:
1. EXHAUSTIVE MULTI-PERSON DETECTION:
   - Do NOT stop after detecting 1 or 2 persons.
   - Scan left-to-right, foreground, midground, and background.
   - Detect EVERY motorcycle driver, EVERY scooter driver, and EVERY pillion/passenger.
   - Also detect cars, vans, and auto-rickshaws if visible.

2. HELMET CLASSIFICATION FOR EACH PERSON:
   - If head or hair is visible without a certified helmet:
     category = "NO_HELMET", is_violation = true, helmet_status = "NO_HELMET"
   - If helmet is worn:
     category = "NO_CONFIRMED_VIOLATION", is_violation = false, helmet_status = "WEARING_HELMET"
   - If head is obscured or distant:
     category = "UNCERTAIN", is_uncertain = true, helmet_status = "UNCERTAIN"

3. MULTIPLE OCCUPANTS / TRIPLE RIDING:
   - If 3 or more people are on one two-wheeler: category = "TRIPLE_RIDING", is_violation = true.

4. PRECISE BOUNDING BOX (box_2d):
   - Provide [ymin, xmin, ymax, xmax] coordinates on 0-1000 scale tightly surrounding each target.
   - Ensure the box covers the rider/person and their vehicle portion accurately.

5. LICENSE PLATE:
   - Attempt to read visible license plates for the vehicles. If unclear, set status: "NOT_READABLE", value: "NOT_READABLE".`;

      let lastError: any = null;
      let response: any = null;

      if (mode === 'local') {
        const ollamaBaseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
        const ollamaModel = process.env.OLLAMA_MODEL || 'gemma3:12b';
        let ollamaResponse: Response;
        try {
          ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS || 120000)),
            body: JSON.stringify({
              model: ollamaModel,
              stream: false,
              format: 'json',
              messages: [{
                role: 'user',
                content: `${promptText}\n\nReturn one JSON object with keys quality_check, summary, detections, and final_assessment. Each detection should include id, vehicle_type, target_label, category, is_violation, is_potential, is_uncertain, confidence from 0 to 1, confidence_level (High/Medium/Low), evidence, box_2d as [ymin, xmin, ymax, xmax] on a 0-1000 scale when visible, occupants_count when visible, helmet_status, and license_plate with value, confidence, and status. Use only the category and status values listed above. Do not invent details; mark unclear observations UNCERTAIN. AI output is not legal proof.`,
                images: [cleanBase64],
              }],
              options: { temperature: 0.1 },
            }),
          });
        } catch (error: any) {
          const timedOut = error?.name === 'TimeoutError';
          return res.status(503).json({ error: timedOut
            ? 'Local AI timed out. Try a smaller image or increase OLLAMA_TIMEOUT_MS.'
            : 'Cannot connect to Ollama. Start Ollama and confirm the local model is available. No cloud fallback was attempted.' });
        }
        if (ollamaResponse.status === 404) {
          return res.status(503).json({ error: `Ollama model '${ollamaModel}' was not found. Pull it with: ollama pull ${ollamaModel}` });
        }
        if (!ollamaResponse.ok) {
          return res.status(502).json({ error: `Ollama returned an error (${ollamaResponse.status}). Check the Ollama server logs.` });
        }
        const localPayload: any = await ollamaResponse.json().catch(() => null);
        const localText = localPayload?.message?.content;
        if (typeof localText !== 'string' || !localText.trim()) {
          return res.status(502).json({ error: 'Ollama returned an empty or invalid response. No cloud fallback was attempted.' });
        }
        response = { text: localText };
      } else if (!ai) {
        return res.status(503).json({ error: 'Gemini Cloud Mode is not configured. Add GEMINI_API_KEY or select Local Mode.' });
      }

      // Models to try in priority order: gemini-3.1-flash-lite is responsive and fast; fallback to gemini-3.8-flash
      const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

      if (mode === 'cloud') {
        for (const modelName of candidateModels) {
          try {
            response = await ai!.models.generateContent({
              model: modelName,
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: detectedMime,
                        data: cleanBase64,
                      },
                    },
                    {
                      text: promptText,
                    },
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
                      required: [
                        'total_riders',
                        'wearing_helmet',
                        'no_helmet',
                        'triple_riding',
                        'cars_detected',
                        'seatbelt_issues',
                        'occupancy_issues',
                        'uncertain',
                      ],
                    },
                    detections: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.INTEGER },
                          vehicle_type: {
                            type: Type.STRING,
                            enum: ['motorcycle', 'scooter', 'car', 'other'],
                          },
                          target_label: { type: Type.STRING },
                          category: {
                            type: Type.STRING,
                            enum: [
                              'NO_HELMET',
                              'TRIPLE_RIDING',
                              'POTENTIAL_SEATBELT_ISSUE',
                              'POTENTIAL_OCCUPANCY_ISSUE',
                              'UNCERTAIN',
                              'NO_CONFIRMED_VIOLATION',
                            ],
                          },
                          is_violation: { type: Type.BOOLEAN },
                          is_potential: { type: Type.BOOLEAN },
                          is_uncertain: { type: Type.BOOLEAN },
                          confidence: { type: Type.NUMBER },
                          confidence_level: {
                            type: Type.STRING,
                            enum: ['High', 'Medium', 'Low'],
                          },
                          evidence: { type: Type.STRING },
                          occupants_count: { type: Type.INTEGER },
                          helmet_status: {
                            type: Type.STRING,
                            enum: ['WEARING_HELMET', 'NO_HELMET', 'UNCERTAIN'],
                          },
                          seatbelt_status: {
                            type: Type.STRING,
                            enum: ['SEATBELT_VISIBLE', 'SEATBELT_NOT_VISIBLE', 'UNCERTAIN'],
                          },
                          license_plate: {
                            type: Type.OBJECT,
                            properties: {
                              value: { type: Type.STRING },
                              confidence: { type: Type.NUMBER },
                              status: {
                                type: Type.STRING,
                                enum: ['READABLE', 'PARTIAL', 'NOT_READABLE'],
                              },
                            },
                            required: ['value', 'confidence', 'status'],
                          },
                          timestamp: { type: Type.STRING },
                          box_2d: {
                            type: Type.ARRAY,
                            items: { type: Type.NUMBER },
                            description: '[ymin, xmin, ymax, xmax] 0-1000',
                          },
                        },
                        required: [
                          'id',
                          'vehicle_type',
                          'target_label',
                          'category',
                          'is_violation',
                          'is_potential',
                          'is_uncertain',
                          'confidence',
                          'confidence_level',
                          'evidence',
                        ],
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
  
            if (response && response.text) {
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.warn(`Model ${modelName} attempt failed:`, err?.message || err);
          }
        }
  
      }
      if (!response || !response.text) {
        throw lastError || new Error('No response returned from AI model.');
      }

      let parsedData: any;
      try {
        parsedData = JSON.parse(response.text);
      } catch (jsonErr) {
        console.error('Failed to parse Gemini response as JSON:', response.text);
        throw new Error('AI returned an unexpected format. Please try again.');
      }

      // Ensure detections is an array and IDs are numbered 1..N
      if (!Array.isArray(parsedData.detections)) {
        parsedData.detections = [];
      } else {
        parsedData.detections = parsedData.detections.map((d: any, idx: number) => ({
          ...d,
          id: idx + 1,
          // Do not invent a bounding box when the model did not return one.
          box_2d: Array.isArray(d.box_2d) && d.box_2d.length === 4 ? d.box_2d : undefined,
        }));
      }

      // Compute consistent assessment
      const confirmedCount = parsedData.detections.filter((d: any) => d.is_violation).length;
      const potentialCount = parsedData.detections.filter((d: any) => d.is_potential).length;
      const noHelmetCount = parsedData.detections.filter((d: any) => d.category === 'NO_HELMET' || d.helmet_status === 'NO_HELMET').length;
      const wearingHelmetCount = parsedData.detections.filter((d: any) => d.helmet_status === 'WEARING_HELMET').length;
      const totalRidersCount = parsedData.detections.filter((d: any) => d.vehicle_type === 'motorcycle' || d.vehicle_type === 'scooter').length || parsedData.detections.length;

      parsedData.summary = {
        total_riders: totalRidersCount,
        wearing_helmet: wearingHelmetCount,
        no_helmet: noHelmetCount,
        triple_riding: parsedData.detections.filter((d: any) => d.category === 'TRIPLE_RIDING').length,
        cars_detected: parsedData.detections.filter((d: any) => d.vehicle_type === 'car').length,
        seatbelt_issues: parsedData.detections.filter((d: any) => d.category === 'POTENTIAL_SEATBELT_ISSUE').length,
        occupancy_issues: parsedData.detections.filter((d: any) => d.category === 'POTENTIAL_OCCUPANCY_ISSUE').length,
        uncertain: parsedData.detections.filter((d: any) => d.is_uncertain).length,
      };

      parsedData.final_assessment = {
        confirmed_violations: confirmedCount,
        potential_issues: potentialCount,
        manual_review_required: parsedData.detections.some((d: any) => d.is_uncertain || d.is_potential),
      };

      parsedData.image_analysis = {
        total_riders: totalRidersCount,
        wearing_helmet: wearingHelmetCount,
        no_helmet: noHelmetCount,
        uncertain: parsedData.summary.uncertain,
      };
      parsedData.final_result = {
        no_helmet_detected: noHelmetCount > 0,
        no_helmet_count: noHelmetCount,
      };

      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error analyzing traffic safety image:', error);
      // Never turn provider failures into fabricated detections.
      const message = 'Analysis failed. Check the selected provider configuration and try again. Local Mode never falls back to Gemini.';
      return res.status(502).json({ error: message });
    }
  }

  // Endpoints: dedicated image & live camera capture analysis
  app.post('/api/analyze-traffic', handleTrafficAnalysis);
  app.post('/api/analyze-helmet', handleTrafficAnalysis);

  // Setup Vite middleware in dev or static serving in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Vision Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
