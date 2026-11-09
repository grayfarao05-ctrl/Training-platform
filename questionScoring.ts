import { TestQuestion, QuestionType } from './types';

/**
 * Normalises string answers according to Phase 1 specification:
 * - trim
 * - lowercase (unless caseSensitive is true)
 * - collapse repeated whitespace/tabs/newlines into a single space
 * - strip trailing full stop (period)
 *
 * Terminal commands are compared strictly as plain text only.
 * NEVER evaluate or execute student input.
 */
export function normalizeAnswerText(input: unknown, caseSensitive: boolean = false): string {
  if (typeof input !== 'string') return '';
  let str = input.trim();
  if (!caseSensitive) {
    str = str.toLowerCase();
  }
  // Collapse repeated whitespace
  str = str.replace(/\s+/g, ' ');
  // Strip trailing full stops/periods
  str = str.replace(/\.+$/, '');
  return str.trim();
}

/**
 * Pure scoring function used universally across student & review screens.
 * Every question is worth exactly 1 mark (all-or-nothing, no partial credit).
 *
 * @param question - The TestQuestion definition
 * @param answer - The student's recorded answer (type-agnostic JSON-safe value)
 * @returns boolean indicating whether the answer is 100% correct
 */
export function isAnswerCorrect(question: TestQuestion, answer: unknown): boolean {
  if (!question) return false;
  const qType: QuestionType = question.type || 'choice';

  switch (qType) {
    case 'choice':
    case 'image': {
      // Choice & image questions expect a single option index (number)
      if (typeof answer !== 'number') return false;
      return answer === question.correctAnswer;
    }

    case 'multi': {
      // Multiple-response expects an array of selected option indexes (number[])
      // All correct indexes must be selected, and no incorrect indexes (all-or-nothing)
      if (!Array.isArray(answer) || !Array.isArray(question.correctAnswers)) return false;
      if (answer.length !== question.correctAnswers.length) return false;

      const userSorted = [...answer].map(Number).sort((a, b) => a - b);
      const correctSorted = [...question.correctAnswers].map(Number).sort((a, b) => a - b);

      return userSorted.every((val, idx) => val === correctSorted[idx]);
    }

    case 'fill': {
      // Fill-in-the-blank expects a string that matches one of acceptedAnswers
      if (typeof answer !== 'string') return false;
      if (!Array.isArray(question.acceptedAnswers) || question.acceptedAnswers.length === 0) {
        return false;
      }

      const caseSensitive = Boolean(question.caseSensitive);
      const normalizedUser = normalizeAnswerText(answer, caseSensitive);
      if (!normalizedUser) return false;

      return question.acceptedAnswers.some(accepted => {
        const normalizedAccepted = normalizeAnswerText(accepted, caseSensitive);
        return normalizedUser === normalizedAccepted;
      });
    }

    case 'match': {
      // Match expects an object mapping left string to right string: Record<string, string>
      // Every pair { left, right } in question.pairs must be correctly matched
      if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return false;
      if (!Array.isArray(question.pairs) || question.pairs.length === 0) return false;

      const userMap = answer as Record<string, string>;
      return question.pairs.every(pair => {
        if (!pair.left || !pair.right) return false;
        return userMap[pair.left] === pair.right;
      });
    }

    case 'order': {
      // Drag/button order expects an array of strings in correct step order: string[]
      if (!Array.isArray(answer) || !Array.isArray(question.steps)) return false;
      if (answer.length !== question.steps.length) return false;

      return question.steps.every((expectedStep, idx) => answer[idx] === expectedStep);
    }

    case 'terminal': {
      // Terminal simulation expects a plain text command string
      if (typeof answer !== 'string') return false;
      if (!Array.isArray(question.acceptedCommands) || question.acceptedCommands.length === 0) {
        return false;
      }

      // Terminal commands are normalised with case-insensitivity by default
      const normalizedCmd = normalizeAnswerText(answer, false);
      if (!normalizedCmd) return false;

      return question.acceptedCommands.some(cmd => {
        const normalizedAccepted = normalizeAnswerText(cmd, false);
        return normalizedCmd === normalizedAccepted;
      });
    }

    default:
      return false;
  }
}
