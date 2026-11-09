import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { getFallbackQuestion, getFallbackQuestions, getFallbackCvCase, getFallbackContractCase } from './aiGeneratorFallback.js';
import { normalizeQuestionType, buildDraftPrompt, buildRetryPrompt, validateDraft, sanitizeDraft } from './aiQuestionPrompts.js';
import { compileCurriculumToInteractiveLesson } from './interactiveLessonCompiler.js';

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
      console.warn(`[AI] Model "${model}" failed, evaluating fallback:`, e?.message || e);
      lastError = e;
      const msg = e?.message || String(e || '');
      // If error is about API key credentials, fail fast
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED')) {
        throw e;
      }
      // Otherwise, retry next candidate model (e.g. high demand, 503, 429)
    }
  }
  throw lastError;
}

function formatGeminiError(e: any): string {
  const rawMsg = e?.message || String(e || '');
  if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || rawMsg.includes('PERMISSION_DENIED')) {
    return 'Gemini API key is not configured or invalid. Please check or select your API key in the Settings > Secrets panel.';
  }
  if (rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API quota exceeded. You can check your API key quota or select a billing-enabled key in Settings > Secrets.';
  }
  if (rawMsg.includes('high demand') || rawMsg.includes('Spikes in demand') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('503')) {
    return 'The AI model is temporarily experiencing high traffic spikes. Automatic model fallback is active; please click generate again in a moment.';
  }
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch {}
  return rawMsg || 'Failed to communicate with Gemini API';
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // AI Generator: Contract Red Flags Case
  app.post('/api/ai/generate-contract-case', async (req, res) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { 
        difficulty = 'medium', 
        topic = 'Entry-level IT Helpdesk Technician offer', 
        minWage = 27.58 
      } = req.body || {};

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
      "id": string (unique slug like clause_1),
      "heading": string (e.g. "1. Remuneration & Overtime"),
      "text": string (the clause text),
      "flag": { "category": string, "reason": string } // ONLY if it is a red flag
    }
  ],
  "missingItems": string[],
  "correctVerdict": "sign" | "ask-first" | "dont-sign"
}`;

      let parsed: any = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          parsed = await generateWithModelFallback(ai, prompt);
        } catch (e: any) {
          console.warn('[AI Server] Live Gemini contract case failed, using fallback:', e?.message || e);
        }
      }
      if (!parsed) {
        parsed = getFallbackContractCase(topic, difficulty, minWage);
      }
      res.json(parsed);
    } catch (e: any) {
      console.error('Gemini contract case generation error:', e);
      res.json(getFallbackContractCase());
    }
  });

  // AI Generator: CV Clinic Case
  app.post('/api/ai/generate-cv-case', async (req, res) => {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const { 
        difficulty = 'medium', 
        candidateRole = 'Entry-level IT Support & Admin Matriculant' 
      } = req.body || {};

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
          "id": string (unique like line_1),
          "text": string,
          "mistake": { "category": "contact"|"privacy"|"honesty"|"format"|"spelling"|"content", "reason": string } // ONLY if mistake
        }
      ]
    }
  ]
}`;

      let parsed: any = null;
      if (process.env.GEMINI_API_KEY) {
        try {
          parsed = await generateWithModelFallback(ai, prompt);
        } catch (e: any) {
          console.warn('[AI Server] Live Gemini CV case failed, using fallback:', e?.message || e);
        }
      }
      if (!parsed) {
        parsed = getFallbackCvCase(candidateRole, difficulty);
      }
      res.json(parsed);
    } catch (e: any) {
      console.error('Gemini CV case generation error:', e);
      res.json(getFallbackCvCase());
    }
  });

  // AI Generator: Interactive Lesson Module strictly grounded in uploaded PDF / curriculum notes
  app.post('/api/ai/generate-interactive-lesson', async (req, res) => {
    const body = req.body || {};
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

    try {
      let generatedLesson: any = null;
      if (process.env.GEMINI_API_KEY && trimmedSource.length > 20) {
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
      }
      res.json(generatedLesson || fallbackLesson);
    } catch (e: any) {
      console.warn('[AI Server] Interactive lesson generation fallback:', e?.message || e);
      res.json(fallbackLesson);
    }
  });

  // AI Generator: Practice Question (Type-aware with strict schema validation and single retry)
  app.post('/api/ai/generate-question', async (req, res) => {
    try {
      const body = req.body || {};
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
          console.warn('[AI Server] Live Gemini question generation failed, evaluating fallback:', e?.message || e);
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
          console.warn(`[AI Server] Draft failed validation (${check.reason}), attempting single retry...`);
          let retriedDraft: any = null;
          if (ai) {
            try {
              const retryPrompt = buildRetryPrompt(rawDraft, normalizedType, check.reason || 'Invalid schema');
              retriedDraft = await generateWithModelFallback(ai, retryPrompt);
            } catch (retryErr) {
              console.warn('[AI Server] Single retry call failed:', retryErr);
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

      // If no valid drafts survived (or Gemini wasn't called/failed), populate with type-aware curriculum fallbacks
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

      // Ensure every single draft strictly has the requested type attached
      const finalizedDrafts = validDrafts.slice(0, requestedCount).map(d => ({
        ...d,
        type: normalizedType,
        aiDrafted: true
      }));

      const primary = finalizedDrafts[0] || {};
      res.json({
        drafts: finalizedDrafts,
        droppedCount,
        requestedType: normalizedType,
        // Legacy fields for backward compatibility
        text: primary.question || primary.text || '',
        options: primary.options || [],
        correctAnswer: primary.correctAnswer ?? 0,
        explanation: primary.explanation || ''
      });
    } catch (e: any) {
      console.error('Gemini question generation error in server.ts:', e);
      const fallback = getFallbackQuestions({ count: 3 });
      res.json({
        drafts: fallback,
        droppedCount: 0,
        requestedType: 'choice',
        text: fallback[0]?.question || '',
        options: (fallback[0] as any)?.options || [],
        correctAnswer: (fallback[0] as any)?.correctAnswer ?? 0,
        explanation: fallback[0]?.explanation || ''
      });
    }
  });

  app.get('/api/pdf-proxy', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
      }
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:' || (parsed.hostname !== 'firebasestorage.googleapis.com' && parsed.hostname !== 'storage.googleapis.com')) {
        return res.status(403).json({ error: 'Disallowed host or protocol' });
      }
      const response = await fetch(targetUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: `Storage returned ${response.status}` });
      }
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', arrayBuffer.byteLength);
      res.send(Buffer.from(arrayBuffer));
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Proxy error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
