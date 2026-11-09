import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ReferenceFigures, ContractRequiredItemKey, ContractFlagCategory } from './types';

export const CONTRACT_REQUIRED_ITEMS: { key: ContractRequiredItemKey; label: string; description: string }[] = [
  { key: 'duties', label: 'Job title and duties', description: 'Clear job title and brief job description' },
  { key: 'pay', label: 'Pay and payday', description: 'Gross pay amount, hourly rate, and payment date' },
  { key: 'hours', label: 'Working hours and overtime', description: 'Standard hours of work and overtime provisions' },
  { key: 'probation', label: 'Probation', description: 'Duration, review milestones, and probation terms' },
  { key: 'leave', label: 'Leave (annual, sick, family responsibility)', description: 'Statutory leave provisions under the BCEA' },
  { key: 'notice', label: 'Notice period', description: 'Notice required to terminate employment' },
  { key: 'uif', label: 'UIF registration', description: 'Employer UIF registration and contributions' }
];

export const CONTRACT_FLAG_CATEGORIES: { id: ContractFlagCategory; label: string; tip: string }[] = [
  { id: 'duties', label: 'Job Title & Duties', tip: 'Vague, unlimited, or unilateral duty changes' },
  { id: 'pay', label: 'Pay & Deductions', tip: 'Below legal minimum, illegal deductions, or vague paydays' },
  { id: 'hours', label: 'Hours & Overtime', tip: 'Excessive hours without overtime pay or mandatory unpaid overtime' },
  { id: 'probation', label: 'Probation Clause', tip: 'Disproportionately long probation or summary firing clauses' },
  { id: 'leave', label: 'Leave Entitlements', tip: 'No paid sick leave, forfeited annual leave, or BCEA breaches' },
  { id: 'notice', label: 'Notice Period', tip: 'Unreasonable resignation penalties or one-sided notice' },
  { id: 'uif', label: 'UIF & Statutory', tip: 'Refusal to register for UIF or illegal statutory waivers' },
  { id: 'blank', label: 'Blank / Incomplete Clause', tip: 'Signing uncompleted figures, open blanks, or missing appendix' },
  { id: 'verbal', label: 'Verbal Agreement Conflict', tip: 'Contradicts verbal job promises or says verbal commitments are void' }
];

export const LESSON_TIPS: Record<ContractFlagCategory, string> = {
  duties: 'Check the job title and duties match the advert and the interview.',
  pay: 'Check the gross monthly amount, the payday and the hourly rate against the legal minimum ({{minWage}} from {{minWageFrom}}). Confirm on {{source}}.',
  hours: 'Look for normal working hours and how overtime is paid.',
  probation: 'Check how long it lasts and what happens when it ends.',
  leave: 'Annual, sick and family responsibility leave should be covered.',
  notice: 'Check how much notice you or the employer must give.',
  uif: 'Your employer must register you for UIF and pay contributions. Without registration you may not be able to claim.',
  blank: 'Never sign a blank or incomplete contract.',
  verbal: 'If something promised verbally is not in the contract, ask for it to be added.'
};

export const CONTRACT_FINAL_TIP = 'Ask for your own signed copy and keep it safe. If you do not understand a clause, ask before you sign.';

export const CONTRACT_FOOTER_NOTE = 'Figures checked {{checkedOn}}. Always confirm on official websites.';

export const DEFAULT_REFERENCE_FIGURES: ReferenceFigures = {
  minimumWageHourly: 27.58,
  minimumWageFrom: '1 March 2026',
  uifRatePercent: 1,
  checkedOn: 'October 2026',
  source: 'labour.gov.za'
};

/**
 * Replaces legal figures placeholders in lesson tips and contract text.
 * If figures document is null or not set, outputs fallback text and flags isFallback.
 */
export function replaceFiguresPlaceholders(text: string, figures: ReferenceFigures | null): { text: string; isFallback: boolean } {
  let isFallback = false;

  const minWageStr = figures && typeof figures.minimumWageHourly === 'number'
    ? `R${figures.minimumWageHourly.toFixed(2)}`
    : (isFallback = true, 'the current legal minimum');

  const minWageFromStr = figures?.minimumWageFrom || (isFallback = true, 'the gazetted date');
  const uifRateStr = figures && typeof figures.uifRatePercent === 'number'
    ? `${figures.uifRatePercent}%`
    : (isFallback = true, 'the statutory rate');
  const checkedOnStr = figures?.checkedOn || (isFallback = true, 'recent gazette');
  const sourceStr = figures?.source || 'labour.gov.za';

  const replaced = text
    .replace(/\{\{minWage\}\}/g, minWageStr)
    .replace(/\{\{minWageFrom\}\}/g, minWageFromStr)
    .replace(/\{\{uifRate\}\}/g, uifRateStr)
    .replace(/\{\{checkedOn\}\}/g, checkedOnStr)
    .replace(/\{\{source\}\}/g, sourceStr);

  return { text: replaced, isFallback };
}

/**
 * Real-time listener for reference_figures/main
 */
export function subscribeReferenceFigures(callback: (figures: ReferenceFigures | null) => void) {
  const docRef = doc(db, 'reference_figures', 'main');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as ReferenceFigures);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'reference_figures/main');
      callback(null);
    }
  );
}

/**
 * Save or update reference_figures/main (admin only)
 */
export async function saveReferenceFigures(figures: ReferenceFigures): Promise<void> {
  const docRef = doc(db, 'reference_figures', 'main');
  await setDoc(docRef, figures, { merge: true });
}
