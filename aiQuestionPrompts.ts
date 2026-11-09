import { QuestionType, AiQuestionDraft, MatchPair } from './types';

export function normalizeQuestionType(typeInput?: string): QuestionType {
  const t = (typeInput || 'choice').toLowerCase().trim();
  if (t === 'cli' || t === 'terminal') return 'terminal';
  if (t === 'image' || t === 'diagram') return 'image';
  if (t === 'multi' || t === 'multiselect' || t === 'multiple') return 'multi';
  if (t === 'fill' || t === 'fill-in-the-blank') return 'fill';
  if (t === 'match' || t === 'matching') return 'match';
  if (t === 'order' || t === 'sequence') return 'order';
  return 'choice';
}

export interface PromptParams {
  type: QuestionType;
  courseName?: string;
  courseDesc?: string;
  domain?: string;
  difficulty?: string;
  objectiveTitle?: string;
  topic?: string;
  count: number;
}

export function buildDraftPrompt(params: PromptParams): string {
  const {
    type,
    courseName = 'CompTIA A+ Certification',
    courseDesc = 'Industry standard IT hardware, operating systems, and networking support credential.',
    domain = 'General IT & Troubleshooting',
    difficulty = 'Medium',
    objectiveTitle = '',
    topic = '',
    count = 3
  } = params;

  let typeSpecificInstructions = '';
  let typeSchema = '';

  switch (type) {
    case 'choice':
      typeSpecificInstructions = `Each draft MUST be a Multiple Choice question:
- Exactly 4 plausible options (1 clearly correct answer, 3 plausible distractors).
- "correctAnswer": 0, 1, 2, or 3 (0-based integer index of the correct option).`;
      typeSchema = `{
  "question": string, // scenario-based question stem
  "options": [string, string, string, string], // exactly 4 options
  "correctAnswer": number, // index 0..3
  "explanation": string // why correct answer is right and why others are incorrect
}`;
      break;

    case 'multi':
      typeSpecificInstructions = `Each draft MUST be a Multi-Select question ("Select all that apply"):
- Between 4 and 6 total options.
- "correctAnswers": an array containing exactly 2 or 3 distinct 0-based integer indices corresponding to the correct choices.
- The question stem must clearly indicate how many choices or that multiple apply (e.g. "(Select TWO)" or "(Select THREE)").`;
      typeSchema = `{
  "question": string, // scenario question stem stating "(Select TWO)" or "(Select THREE)"
  "options": string[], // between 4 and 6 options
  "correctAnswers": number[], // exactly 2 or 3 distinct indices in range 0..(options.length - 1)
  "explanation": string // technical rationale for all correct choices
}`;
      break;

    case 'fill':
      typeSpecificInstructions = `Each draft MUST be a Fill-in-the-Blank question:
- A targeted technical question asking for a specific acronym, command, protocol name, or port number.
- "acceptedAnswers": a non-empty array of acceptable case-insensitive string variants (e.g. ["APIPA", "Automatic Private IP Addressing"]).`;
      typeSchema = `{
  "question": string, // clear prompt asking for a specific term, acronym, or value
  "acceptedAnswers": string[], // array of valid accepted variants
  "explanation": string // technical background and context
}`;
      break;

    case 'match':
      typeSpecificInstructions = `Each draft MUST be a Matching Pairs challenge:
- "pairs": between 4 and 6 pairs of { "left": string, "right": string }.
- Left and right terms must have strict 1-to-1 mappings with NO ambiguous or overlapping definitions.
- Left and right strings must each be concise, distinct labels or concepts.`;
      typeSchema = `{
  "question": string, // clear matching instruction (e.g. "Match each protocol to its default port:")
  "pairs": [
    { "left": string, "right": string } // 4 to 6 unambiguous pairs
  ],
  "explanation": string // breakdown of each correct association
}`;
      break;

    case 'order':
      typeSpecificInstructions = `Each draft MUST be a Sequence Ordering challenge:
- "steps": between 4 and 6 steps provided in the EXACT CORRECT CHRONOLOGICAL or PROCEDURAL order.
- The student will be presented with these steps shuffled and must order them from first to last.`;
      typeSchema = `{
  "question": string, // task prompt (e.g. "Arrange the CompTIA troubleshooting steps in correct order:")
  "steps": string[], // between 4 and 6 steps in the 100% CORRECT sequence from first to last
  "explanation": string // explanation of the procedural workflow
}`;
      break;

    case 'image':
      typeSpecificInstructions = `Each draft MUST be a Diagram / Visual question:
- "options": exactly 4 options.
- "correctAnswer": 0, 1, 2, or 3.
- "altText": a clear, descriptive accessibility description of the visual diagram or photo.
- "imageIdea": a concise description (1-2 sentences) of the photo, motherboard schematic, port diagram, or flowchart that an instructor or designer should supply. NEVER output a URL or link.`;
      typeSchema = `{
  "question": string, // question referring to the diagram/illustration
  "options": [string, string, string, string], // exactly 4 options
  "correctAnswer": number, // index 0..3
  "altText": string, // accessibility description of the visual asset
  "imageIdea": string, // short description of the graphic to provide (NEVER an image URL)
  "explanation": string // technical explanation
}`;
      break;

    case 'terminal':
      typeSpecificInstructions = `Each draft MUST be a Command Line Interface (CLI Simulation) task:
- "question": the workplace task or diagnostic command requested (e.g. "Test connectivity to 192.168.1.1").
- "acceptedCommands": an array of 1 to 4 acceptable command strings (e.g. ["ping 192.168.1.1", "ping -t 192.168.1.1"]).
- "simulatedOutput": realistic terminal output that would appear when executing the command.
- "hint": a helpful student hint (e.g. "Use the standard ICMP utility followed by the target IP address").`;
      typeSchema = `{
  "question": string, // the CLI scenario task
  "acceptedCommands": string[], // list of valid command string variants
  "simulatedOutput": string, // realistic console terminal output
  "hint": string, // student hint
  "explanation": string // technical explanation of command flags and behavior
}`;
      break;
  }

  return `You are a senior technical curriculum instructor creating exam-authentic diagnostic practice questions for the ITreal learning platform.

TARGET CURRICULUM CONTEXT:
- Course: "${courseName}"
- Course Overview: "${courseDesc}"
- Domain / Module: "${domain}"
- Difficulty Level: "${difficulty}"
${objectiveTitle ? `- Target Objective: "${objectiveTitle}"` : ''}
${topic ? `- Topic or Notes: "${topic.slice(0, 500)}"` : ''}
- Requested Number of Drafts: ${count}
- Requested Question Type: "${type}"

CRITICAL EDITORIAL RULES:
1. LANGUAGE: Use plain South African English (e.g. "colour", "programme", "prioritise", "organisation", "loadshedding" or "matriculant" where contextually appropriate).
2. CURRENCY: Always use South African Rands (ZAR / "R", e.g. "R450", "R2,500"), never dollars or other foreign currency.
3. FACTUAL ACCURACY: Only test verified, industry-standard technical facts (CompTIA objectives, standard RFC protocols, SA BCEA/POPIA labor/privacy laws). Never hallucinate fictional commands or invalid specifications.
4. JSON ONLY: Respond ONLY with a valid JSON object matching the exact schema specified below. Do not wrap in markdown or include conversational text.

TYPE SPECIFICATIONS:
${typeSpecificInstructions}

OUTPUT SCHEMA:
{
  "drafts": [
    ${typeSchema}
  ]
}
Generate exactly ${count} distinct, high-quality drafts conforming to this schema.`;
}

export function buildRetryPrompt(draft: any, requestedType: QuestionType, reason: string): string {
  return `The following question draft failed strict schema validation for Question Type "${requestedType}".
Validation Error: "${reason}"

Draft Content:
${JSON.stringify(draft, null, 2)}

Please rewrite and fix this draft so it strictly satisfies all requirements for Question Type "${requestedType}".
Return ONLY the corrected JSON draft object (not in an array).`;
}

export function validateDraft(draft: any, requestedType: QuestionType): { valid: boolean; reason?: string } {
  if (!draft || typeof draft !== 'object') {
    return { valid: false, reason: 'Draft is not a valid JSON object' };
  }

  const qText = (draft.question || draft.text || '').trim();
  if (!qText) {
    return { valid: false, reason: 'Question stem text is missing or empty' };
  }

  const exp = (draft.explanation || '').trim();
  if (!exp) {
    return { valid: false, reason: 'Technical explanation is missing or empty' };
  }

  switch (requestedType) {
    case 'choice': {
      if (!Array.isArray(draft.options) || draft.options.length !== 4) {
        return { valid: false, reason: 'Multiple choice questions must have exactly 4 options' };
      }
      if (!draft.options.every((o: any) => typeof o === 'string' && o.trim().length > 0)) {
        return { valid: false, reason: 'All 4 options must be non-empty strings' };
      }
      if (typeof draft.correctAnswer !== 'number' || !Number.isInteger(draft.correctAnswer) || draft.correctAnswer < 0 || draft.correctAnswer > 3) {
        return { valid: false, reason: 'correctAnswer must be an index 0, 1, 2, or 3' };
      }
      return { valid: true };
    }

    case 'multi': {
      if (!Array.isArray(draft.options) || draft.options.length < 4 || draft.options.length > 6) {
        return { valid: false, reason: 'Multi-select questions must provide between 4 and 6 options' };
      }
      if (!draft.options.every((o: any) => typeof o === 'string' && o.trim().length > 0)) {
        return { valid: false, reason: 'All options must be non-empty strings' };
      }
      if (!Array.isArray(draft.correctAnswers) || draft.correctAnswers.length < 2 || draft.correctAnswers.length > 3) {
        return { valid: false, reason: 'Multi-select must designate exactly 2 or 3 correct answers' };
      }
      const unique = new Set(draft.correctAnswers);
      if (unique.size !== draft.correctAnswers.length) {
        return { valid: false, reason: 'correctAnswers cannot contain duplicate option indices' };
      }
      if (!draft.correctAnswers.every((idx: any) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && idx < draft.options.length)) {
        return { valid: false, reason: 'Each correctAnswer index must point to a valid option in range' };
      }
      return { valid: true };
    }

    case 'fill': {
      if (!Array.isArray(draft.acceptedAnswers) || draft.acceptedAnswers.length === 0) {
        return { valid: false, reason: 'Fill-in-the-blank requires at least 1 accepted answer string' };
      }
      if (!draft.acceptedAnswers.every((a: any) => typeof a === 'string' && a.trim().length > 0)) {
        return { valid: false, reason: 'Accepted answer variants must be non-empty strings' };
      }
      return { valid: true };
    }

    case 'match': {
      if (!Array.isArray(draft.pairs) || draft.pairs.length < 4 || draft.pairs.length > 6) {
        return { valid: false, reason: 'Matching questions must contain between 4 and 6 pairs' };
      }
      const lefts = new Set<string>();
      const rights = new Set<string>();
      for (let i = 0; i < draft.pairs.length; i++) {
        const p = draft.pairs[i];
        if (!p || typeof p.left !== 'string' || !p.left.trim() || typeof p.right !== 'string' || !p.right.trim()) {
          return { valid: false, reason: `Pair #${i + 1} must have non-empty left and right values` };
        }
        lefts.add(p.left.trim().toLowerCase());
        rights.add(p.right.trim().toLowerCase());
      }
      if (lefts.size !== draft.pairs.length || rights.size !== draft.pairs.length) {
        return { valid: false, reason: 'Matching pairs cannot have duplicate or ambiguous left/right items' };
      }
      return { valid: true };
    }

    case 'order': {
      if (!Array.isArray(draft.steps) || draft.steps.length < 4 || draft.steps.length > 6) {
        return { valid: false, reason: 'Sequence ordering must contain between 4 and 6 steps' };
      }
      if (!draft.steps.every((s: any) => typeof s === 'string' && s.trim().length > 0)) {
        return { valid: false, reason: 'All sequence steps must be non-empty strings' };
      }
      return { valid: true };
    }

    case 'image': {
      if (!Array.isArray(draft.options) || draft.options.length !== 4) {
        return { valid: false, reason: 'Diagram / Image questions must have 4 options' };
      }
      if (!draft.options.every((o: any) => typeof o === 'string' && o.trim().length > 0)) {
        return { valid: false, reason: 'All 4 options must be non-empty strings' };
      }
      if (typeof draft.correctAnswer !== 'number' || !Number.isInteger(draft.correctAnswer) || draft.correctAnswer < 0 || draft.correctAnswer > 3) {
        return { valid: false, reason: 'correctAnswer must be an index 0, 1, 2, or 3' };
      }
      if (!draft.altText || typeof draft.altText !== 'string' || !draft.altText.trim()) {
        return { valid: false, reason: 'altText is required for accessibility' };
      }
      if (!draft.imageIdea || typeof draft.imageIdea !== 'string' || !draft.imageIdea.trim()) {
        return { valid: false, reason: 'imageIdea description is required' };
      }
      if (draft.imageIdea.toLowerCase().startsWith('http://') || draft.imageIdea.toLowerCase().startsWith('https://')) {
        return { valid: false, reason: 'imageIdea must be a description of the photo/diagram, never an image URL' };
      }
      return { valid: true };
    }

    case 'terminal': {
      if (!Array.isArray(draft.acceptedCommands) || draft.acceptedCommands.length === 0) {
        return { valid: false, reason: 'CLI simulation requires at least 1 accepted command' };
      }
      if (!draft.acceptedCommands.every((c: any) => typeof c === 'string' && c.trim().length > 0)) {
        return { valid: false, reason: 'All accepted commands must be non-empty strings' };
      }
      if (!draft.simulatedOutput || typeof draft.simulatedOutput !== 'string' || !draft.simulatedOutput.trim()) {
        return { valid: false, reason: 'simulatedOutput is required for CLI simulations' };
      }
      if (!draft.hint || typeof draft.hint !== 'string' || !draft.hint.trim()) {
        return { valid: false, reason: 'Student hint is required for CLI simulations' };
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

export function sanitizeDraft(draft: any, requestedType: QuestionType, defaults: any = {}): AiQuestionDraft {
  const base = {
    type: requestedType,
    question: (draft.question || draft.text || '').trim(),
    explanation: (draft.explanation || '').trim(),
    course: defaults.course,
    domain: defaults.domain,
    difficulty: defaults.difficulty || 'Medium',
    objectiveTitle: defaults.objectiveTitle || '',
    aiDrafted: true
  };

  switch (requestedType) {
    case 'choice':
      return {
        ...base,
        type: 'choice',
        options: (draft.options || []).map((o: any) => String(o || '').trim()),
        correctAnswer: Number(draft.correctAnswer ?? 0)
      };

    case 'multi':
      return {
        ...base,
        type: 'multi',
        options: (draft.options || []).map((o: any) => String(o || '').trim()),
        correctAnswers: (draft.correctAnswers || []).map((idx: any) => Number(idx))
      };

    case 'fill':
      return {
        ...base,
        type: 'fill',
        acceptedAnswers: (draft.acceptedAnswers || []).map((a: any) => String(a || '').trim())
      };

    case 'match':
      return {
        ...base,
        type: 'match',
        pairs: (draft.pairs || []).map((p: any) => ({
          left: String(p.left || '').trim(),
          right: String(p.right || '').trim()
        }))
      };

    case 'order':
      return {
        ...base,
        type: 'order',
        steps: (draft.steps || []).map((s: any) => String(s || '').trim())
      };

    case 'image':
      return {
        ...base,
        type: 'image',
        options: (draft.options || []).map((o: any) => String(o || '').trim()),
        correctAnswer: Number(draft.correctAnswer ?? 0),
        altText: String(draft.altText || '').trim(),
        imageIdea: String(draft.imageIdea || '').trim()
      };

    case 'terminal':
      return {
        ...base,
        type: 'terminal',
        acceptedCommands: (draft.acceptedCommands || []).map((c: any) => String(c || '').trim()),
        simulatedOutput: String(draft.simulatedOutput || '').trim(),
        hint: String(draft.hint || '').trim()
      };
  }
}
