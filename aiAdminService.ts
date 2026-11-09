import { ContractCase, CVClinicCase, QuestionType, CourseId, AiDraftResponse, AiQuestionDraft } from './types';

export interface GenerateContractCaseParams {
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  minWage?: number;
}

export interface GenerateCvCaseParams {
  difficulty?: 'easy' | 'medium' | 'hard';
  candidateRole?: string;
}

export interface GenerateQuestionParams {
  questionType?: QuestionType | 'cli';
  type?: string;
  course?: CourseId;
  courseName?: string;
  courseDescription?: string;
  domain?: string;
  domainId?: string;
  domainTitle?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
  objectiveTitle?: string;
  topic?: string;
  count?: number;
}

function extractCleanErrorMessage(errorData: any, status: number): string {
  const raw = errorData?.error || '';
  if (!raw) return `AI generation failed with status ${status}`;
  if (typeof raw === 'string') {
    if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid') || raw.includes('PERMISSION_DENIED')) {
      return 'Gemini API key is not configured or invalid. Please check or select your API key in the Settings > Secrets panel.';
    }
    if (raw.includes('RESOURCE_EXHAUSTED')) {
      return 'Gemini API quota exceeded. You can check your API key quota or select a billing-enabled key in Settings > Secrets.';
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        if (parsed.error.message.includes('API key not valid')) {
          return 'Gemini API key is not configured or invalid. Please check or select your API key in the Settings > Secrets panel.';
        }
        return parsed.error.message;
      }
    } catch {}
  }
  return String(raw);
}

/**
 * Generate a complete, valid Contract Red Flags case using server-side Gemini.
 */
export async function generateAiContractCase(params: GenerateContractCaseParams): Promise<ContractCase> {
  const response = await fetch('/api/ai/generate-contract-case', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractCleanErrorMessage(errorData, response.status));
  }

  const data = await response.json();
  return data as ContractCase;
}

/**
 * Generate a complete, valid CV Clinic case using server-side Gemini.
 */
export async function generateAiCvCase(params: GenerateCvCaseParams): Promise<CVClinicCase> {
  const response = await fetch('/api/ai/generate-cv-case', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractCleanErrorMessage(errorData, response.status));
  }

  const data = await response.json();
  return data as CVClinicCase;
}

/**
 * Generate practice question drafts using server-side type-aware Gemini.
 * Returns array of drafts with strict validation, dropped count, and backward-compatible fields.
 */
export async function generateAiQuestion(params: GenerateQuestionParams): Promise<AiDraftResponse & {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}> {
  const response = await fetch('/api/ai/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      questionType: params.questionType || (params.type as any) || 'choice',
      count: params.count || 3
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(extractCleanErrorMessage(errorData, response.status));
  }

  return response.json();
}
