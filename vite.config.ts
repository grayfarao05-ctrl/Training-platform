import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getFallbackQuestion, getFallbackQuestions, getFallbackCvCase, getFallbackContractCase } from './aiGeneratorFallback';
import { normalizeQuestionType, buildDraftPrompt, buildRetryPrompt, validateDraft, sanitizeDraft } from './aiQuestionPrompts';
import { compileCurriculumToInteractiveLesson } from './interactiveLessonCompiler';

function pdfProxyPlugin() {
  return {
    name: 'pdf-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/pdf-proxy', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing url parameter' }));
            return;
          }
          const parsed = new URL(targetUrl);
          if (parsed.protocol !== 'https:' || (parsed.hostname !== 'firebasestorage.googleapis.com' && parsed.hostname !== 'storage.googleapis.com')) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: 'Disallowed host or protocol' }));
            return;
          }

          const response = await fetch(targetUrl);
          if (!response.ok) {
            res.statusCode = response.status;
            res.end(JSON.stringify({ error: `Storage returned ${response.status}` }));
            return;
          }

          const buffer = await response.arrayBuffer();
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Length', buffer.byteLength);
          res.end(Buffer.from(buffer));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e?.message || 'Proxy error' }));
        }
      });
    }
  };
}

const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function generateWithModelFallback(ai: any, prompt: string) {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      const text = response.text;
      if (text) {
        return JSON.parse(text);
      }
    } catch (e: any) {
      console.warn(`[AI Vite Middleware] Model "${model}" failed, evaluating fallback:`, e?.message || e);
      lastError = e;
      const msg = e?.message || String(e || '');
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED')) {
        throw e;
      }
    }
  }
  throw lastError;
}

function aiEndpointsPlugin() {
  return {
    name: 'ai-endpoints',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith('/api/ai/')) {
          return next();
        }

        let body: any = {};
        try {
          let rawData = '';
          for await (const chunk of req) {
            rawData += chunk;
          }
          body = rawData ? JSON.parse(rawData) : {};
        } catch {
          body = {};
        }

        try {
          if (req.url === '/api/ai/generate-contract-case') {
            const { difficulty = 'medium', topic = 'Entry-level IT Helpdesk Technician offer', minWage = 27.58 } = body;
            const prompt = `You are a South African labour law and HR educator creating an educational scenario for a gamified learning platform ("Contract Red Flags" for "Matric to Money").
Create an employment contract case for a job seeker.

Parameters:
- Candidate/Role Topic: "${topic}"
- Difficulty: "${difficulty}" (easy: obvious violations like R15/hr or no leave; medium: subtle clauses like unilateral overtime or wage deductions; hard: sophisticated clauses like extreme restraint of trade or forfeit of statutory rights)
- South African legal reference: Basic Conditions of Employment Act (BCEA). Current minimum wage is approx R${minWage}/hour.
- 7 Statutory Required Items: duties, pay, hours, probation, leave, notice, uif.
- Possible Flag Categories: duties, pay, hours, probation, leave, notice, uif, blank, verbal.
- Verdicts: "sign" (if fully compliant with no bad clauses), "ask-first" (if missing terms or needs clarification), "dont-sign" (if illegal/unlawful terms exist).

Requirements:
1. Title: Short, descriptive (max 80 chars, e.g. "Junior Support Tech - FastNet Solutions")
2. Brief: 1-2 sentences setting the stage for the student (max 200 chars, e.g. "Thabo was verbally promised transport allowance, but the contract says verbal promises are void.")
3. TimeLimitSeconds: ${difficulty === 'easy' ? 90 : difficulty === 'hard' ? 120 : 100}
4. Clauses: Between 8 and 14 clauses representing the full agreement sections (e.g. "Commencement", "Position & Duties", "Remuneration", "Hours of Work", "Probation", "Leave", "Termination", "General").
   - Plant between 2 and 5 red flag clauses! Each red flag MUST have a valid "flag" object:
     { "category": one of ["duties", "pay", "hours", "probation", "leave", "notice", "uif", "blank", "verbal"], "reason": "concise explanation of why this is unlawful or unfair under SA law (max 180 chars)" }
   - Clauses without a flag MUST NOT have the flag property.
5. MissingItems: An array of keys from ["duties", "pay", "hours", "probation", "leave", "notice", "uif"] that are COMPLETELY OMITTED from the contract clauses (between 1 and 3 items). Important: If an item is present as a red flag clause, do NOT also mark it as missing.
6. CorrectVerdict: "dont-sign" (if severe illegal terms), "ask-first" (if missing terms or ambiguous), or "sign" (if clean).

Respond ONLY with a valid JSON object matching this schema:
{
  "title": string,
  "brief": string,
  "difficulty": "easy" | "medium" | "hard",
  "timeLimitSeconds": number,
  "clauses": [
    {
      "id": string,
      "heading": string,
      "text": string,
      "flag": { "category": string, "reason": string }
    }
  ],
  "missingItems": string[],
  "correctVerdict": "sign" | "ask-first" | "dont-sign"
}`;
            let parsed: any = null;
            if (process.env.GEMINI_API_KEY) {
              try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({
                  apiKey: process.env.GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                parsed = await generateWithModelFallback(ai, prompt);
              } catch (e: any) {
                console.warn('[AI] Live Gemini contract case failed, using fallback:', e?.message || e);
              }
            }
            if (!parsed) {
              parsed = getFallbackContractCase(topic, difficulty, minWage);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
            return;
          }

          if (req.url === '/api/ai/generate-cv-case') {
            const { difficulty = 'medium', candidateRole = 'Entry-level IT Support & Admin Matriculant' } = body;
            const prompt = `You are a South African career coach creating a CV clinic training scenario for matriculants and entry-level IT job seekers ("CV Clinic" mini-game).
Create a realistic one-page sample CV with planted mistakes that South African job seekers often make.

Parameters:
- Candidate Role: "${candidateRole}"
- Difficulty: "${difficulty}"
- South African context: SA IDs, phone numbers (+27), email etiquette, POPIA privacy, matric NSC, CompTIA certifications.
- Mistake categories: "contact", "privacy", "honesty", "format", "spelling", "content".

Requirements:
1. Title: e.g. "Sipho Khumalo - Entry-Level Support CV" (max 80 chars)
2. Brief: One-line note giving context to the player (max 200 chars, e.g. "Sipho has not written his A+ exam yet and lives in Soweto.")
3. TimeLimitSeconds: 60
4. Sections: Between 4 and 6 sections (e.g. "# File", "# Personal Information", "# Professional Summary", "# Education", "# Certifications & Skills", "# Experience").
   - Under "# File", include a file name line (e.g. "Sipho_CV_Final_version2.docx").
   - Each line is { id, text, mistake?: { category, reason } }.
   - Plant between 3 and 7 mistakes total!
   - Common realistic mistakes:
     - privacy: full SA ID number, physical home address, marital status, religion
     - contact: unprofessional email (e.g. coolguy99@yahoo.com)
     - honesty: claiming certified when exam is only booked or in progress
     - format: .docx or messy file name instead of Firstname_Surname_CV.pdf
     - spelling: common typos in technical terms (e.g. "Hardward", "Ecxel")
     - content: vague buzzwords with no achievements or evidence
   - Lines without mistakes must omit the mistake property.

Respond ONLY with a valid JSON object matching this schema:
{
  "title": string,
  "brief": string,
  "difficulty": "easy" | "medium" | "hard",
  "timeLimitSeconds": number,
  "sections": [
    {
      "heading": string,
      "lines": [
        {
          "id": string,
          "text": string,
          "mistake": { "category": string, "reason": string }
        }
      ]
    }
  ]
}`;
            let parsed: any = null;
            if (process.env.GEMINI_API_KEY) {
              try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({
                  apiKey: process.env.GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                parsed = await generateWithModelFallback(ai, prompt);
              } catch (e: any) {
                console.warn('[AI] Live Gemini CV case failed, using fallback:', e?.message || e);
              }
            }
            if (!parsed) {
              parsed = getFallbackCvCase(candidateRole, difficulty);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
            return;
          }

          if (req.url === '/api/ai/generate-interactive-lesson') {
            const {
              courseId = 'a-plus',
              objectiveId = '1.1',
              objectiveTitle = 'Interactive Module',
              domainName = 'Core Curriculum',
              sourceText = ''
            } = body;

            const trimmedSource = String(sourceText || '').trim().slice(0, 18000);
            const fallbackLesson = compileCurriculumToInteractiveLesson({
              courseId,
              objectiveId,
              objectiveTitle,
              domainName,
              sourceText: trimmedSource || `${objectiveTitle} (${domainName})`
            });

            let generatedLesson: any = null;
            if (process.env.GEMINI_API_KEY && trimmedSource.length > 20) {
              try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({
                  apiKey: process.env.GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const prompt = `You are an instructional designer for ITreal Tech Solutions (South Africa).
Convert the following curriculum text strictly into a valid JSON LessonData object for:
- Course ID: "${courseId}"
- Objective ID: "${objectiveId}"
- Objective Title: "${objectiveTitle}"
- Domain: "${domainName}"

CRITICAL RULE: Base all facts, terms, steps, commands, and quiz questions STRICTLY on the provided curriculum text below. Use South African context (en-ZA, ZAR "R", POPIA/BCEA where relevant).

CURRICULUM SOURCE TEXT:
"""
${trimmedSource}
"""

Return ONLY a JSON object matching the exact structure of this reference template (keep the same section types and property names, replacing the content with rich curriculum-specific content):
${JSON.stringify(fallbackLesson, null, 2)}`;
                const candidate = await generateWithModelFallback(ai, prompt);
                if (candidate && Array.isArray(candidate.sections) && candidate.sections.length >= 3) {
                  generatedLesson = candidate;
                }
              } catch (e: any) {
                console.warn('[AI Vite Middleware] Live Gemini interactive lesson generation failed, using deterministic curriculum compiler:', e?.message || e);
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(generatedLesson || fallbackLesson));
            return;
          }

          if (req.url === '/api/ai/generate-question') {
            const {
              questionType,
              type,
              course,
              courseName = typeof course === 'object' ? course.name : (course === 'matric-to-money' ? 'Matric to Money' : 'CompTIA A+'),
              courseDescription = typeof course === 'object' ? course.description : '',
              courseDesc = courseDescription,
              domain = body.domainTitle || 'General IT & Troubleshooting',
              domainTitle = domain,
              difficulty = 'Medium',
              objectiveTitle = '',
              topic = '',
              count = 3
            } = body;

            const normalizedType = normalizeQuestionType(questionType || type);
            const requestedCount = Math.max(1, Math.min(5, Number(count) || 3));
            const cleanTopic = typeof topic === 'string' ? topic.slice(0, 500) : '';

            const prompt = buildDraftPrompt({
              type: normalizedType,
              courseName,
              courseDesc: courseDesc || (course === 'matric-to-money' ? 'South African school-leaver work readiness, employment law, and practical IT entry-level skills.' : 'Industry standard IT hardware, operating systems, and networking support credential.'),
              domain: domainTitle || domain,
              difficulty,
              objectiveTitle,
              topic: cleanTopic,
              count: requestedCount
            });

            let ai: any = null;
            let rawDrafts: any[] = [];
            if (process.env.GEMINI_API_KEY) {
              try {
                const { GoogleGenAI } = await import('@google/genai');
                ai = new GoogleGenAI({
                  apiKey: process.env.GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                const parsed = await generateWithModelFallback(ai, prompt);
                if (parsed && Array.isArray(parsed.drafts)) {
                  rawDrafts = parsed.drafts;
                } else if (Array.isArray(parsed)) {
                  rawDrafts = parsed;
                } else if (parsed && typeof parsed === 'object') {
                  rawDrafts = [parsed];
                }
              } catch (e: any) {
                console.warn('[AI Vite Middleware] Live Gemini question generation failed, using fallback:', e?.message || e);
              }
            }

            const validDrafts: any[] = [];
            let droppedCount = 0;

            for (const rawDraft of rawDrafts) {
              const check = validateDraft(rawDraft, normalizedType);
              if (check.valid) {
                validDrafts.push(sanitizeDraft(rawDraft, normalizedType, {
                  course: typeof course === 'string' ? course : course?.id,
                  domain: domainTitle || domain,
                  difficulty,
                  objectiveTitle
                }));
              } else {
                console.warn(`[AI Vite Middleware] Draft failed validation (${check.reason}), attempting single retry...`);
                let retriedDraft: any = null;
                if (ai) {
                  try {
                    const retryPrompt = buildRetryPrompt(rawDraft, normalizedType, check.reason || 'Invalid schema');
                    retriedDraft = await generateWithModelFallback(ai, retryPrompt);
                  } catch (retryErr) {
                    console.warn('[AI Vite Middleware] Single retry call failed:', retryErr);
                  }
                }

                if (retriedDraft) {
                  const retryCheck = validateDraft(retriedDraft, normalizedType);
                  if (retryCheck.valid) {
                    validDrafts.push(sanitizeDraft(retriedDraft, normalizedType, {
                      course: typeof course === 'string' ? course : course?.id,
                      domain: domainTitle || domain,
                      difficulty,
                      objectiveTitle
                    }));
                    continue;
                  }
                }
                droppedCount++;
              }
            }

            if (validDrafts.length === 0) {
              const fallbackDrafts = getFallbackQuestions({
                type: normalizedType,
                course: typeof course === 'string' ? course : course?.id,
                courseName,
                domainTitle: domainTitle || domain,
                difficulty,
                objectiveTitle,
                topic: cleanTopic,
                count: requestedCount
              });
              validDrafts.push(...fallbackDrafts);
            }

            const finalizedDrafts = validDrafts.slice(0, requestedCount).map(d => ({
              ...d,
              type: normalizedType,
              aiDrafted: true
            }));

            const primary = finalizedDrafts[0] || {};
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              drafts: finalizedDrafts,
              droppedCount,
              requestedType: normalizedType,
              text: primary.question || primary.text || '',
              options: primary.options || [],
              correctAnswer: primary.correctAnswer ?? 0,
              explanation: primary.explanation || ''
            }));
            return;
          }

          next();
        } catch (e: any) {
          console.error('AI generation endpoint error:', e);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'AI generation temporarily unavailable' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), pdfProxyPlugin(), aiEndpointsPlugin()],
      optimizeDeps: {
        include: [
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom',
          'react-dom/client',
          'lucide-react',
          'motion',
          'motion/react',
          'firebase/app',
          'firebase/auth',
          'firebase/firestore',
          'firebase/storage',
          'react-markdown',
          'clsx',
          'tailwind-merge',
        ],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/firebase') || id.includes('@firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
                return 'vendor-motion';
              }
            }
          }
        }
      },
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
