import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  increment,
} from './firebase';

export type WelcomeInviteStatus = 'pending' | 'sent' | 'opened';
export type WelcomeDestination = 'landing' | 'signup' | 'custom';

export interface WelcomeInvite {
  id: string; // 6-char short ID e.g. "xtpkjs"
  name: string;
  phone: string; // Normalized E.164 digits without '+', e.g. "27821234567"
  rawPhone?: string;
  status: WelcomeInviteStatus;
  sentAt?: string | null;
  openedAt?: string | null;
  openCount: number;
  createdAt: string;
}

export interface WelcomeIntroSettings {
  enabledOnEntry: boolean;
  showOncePerSession: boolean;
  buttonLabel: string;
  destination: WelcomeDestination;
  href: string;
  baseUrl: string;
  whatsappTemplate: string;
  updatedAt?: string;
}

export const DEFAULT_WELCOME_SETTINGS: WelcomeIntroSettings = {
  enabledOnEntry: false,
  showOncePerSession: true,
  buttonLabel: 'Continue to the website',
  destination: 'landing',
  href: '',
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://itreal.co.za',
  whatsappTemplate:
    'Hi {name}! Thank you for your interest in ITreal Tech Solutions. We put together a personal welcome for you: {link}',
};

const SHORT_ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generateShortId(length = 6): string {
  let out = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) {
      out += SHORT_ID_ALPHABET[arr[i] % SHORT_ID_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      out += SHORT_ID_ALPHABET[Math.floor(Math.random() * SHORT_ID_ALPHABET.length)];
    }
  }
  return out;
}

/**
 * Normalizes South African phone numbers for WhatsApp wa.me links.
 * Examples:
 *  "082 123 4567"   -> "27821234567"
 *  "+27 82-123-4567" -> "27821234567"
 *  "0027821234567"  -> "27821234567"
 *  "821234567"      -> "27821234567"
 */
export function normalizeSAPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0027') && digits.length >= 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '27' + digits.slice(1);
  }
  if (digits.length === 9 && /^[6-8]/.test(digits)) {
    return '27' + digits;
  }
  return digits;
}

export function extractFirstName(fullName: string): string {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return cleaned.split(' ')[0];
}

export function buildShortLink(baseUrl: string, shortId: string): string {
  const cleanBase = (baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${cleanBase}/${shortId}`;
}

export function formatWhatsAppMessage(template: string, name: string, link: string): string {
  return (template || DEFAULT_WELCOME_SETTINGS.whatsappTemplate)
    .replace(/\{name\}/gi, name)
    .replace(/\{link\}/gi, link);
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = normalizeSAPhone(phone);
  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

// ===============================================================
// Firestore Settings Helpers
// ===============================================================

export async function getWelcomeIntroSettings(): Promise<WelcomeIntroSettings> {
  try {
    const snap = await getDoc(doc(db, 'app_settings', 'welcome_intro'));
    if (snap.exists()) {
      return {
        ...DEFAULT_WELCOME_SETTINGS,
        ...(snap.data() as Partial<WelcomeIntroSettings>),
      };
    }
  } catch (err) {
    console.warn('Could not load welcome_intro settings:', err);
  }
  return { ...DEFAULT_WELCOME_SETTINGS };
}

export async function saveWelcomeIntroSettings(settings: WelcomeIntroSettings): Promise<void> {
  await setDoc(
    doc(db, 'app_settings', 'welcome_intro'),
    {
      ...settings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ===============================================================
// Firestore Welcome Invites CRUD
// ===============================================================

export async function listWelcomeInvites(): Promise<WelcomeInvite[]> {
  const snap = await getDocs(collection(db, 'welcome_invites'));
  const list = snap.docs.map((d) => ({
    ...(d.data() as Omit<WelcomeInvite, 'id'>),
    id: d.id,
  }));
  list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return list;
}

export async function fetchWelcomeInvite(shortId: string): Promise<WelcomeInvite | null> {
  const cleanId = shortId.trim().toLowerCase();
  if (!/^[a-z0-9]{6}$/.test(cleanId)) return null;
  try {
    const snap = await getDoc(doc(db, 'welcome_invites', cleanId));
    if (!snap.exists()) return null;
    return {
      ...(snap.data() as Omit<WelcomeInvite, 'id'>),
      id: snap.id,
    };
  } catch (err) {
    console.warn('Could not fetch welcome invite:', err);
    return null;
  }
}

export async function recordInviteOpened(shortId: string): Promise<void> {
  try {
    const cleanId = shortId.trim().toLowerCase();
    await updateDoc(doc(db, 'welcome_invites', cleanId), {
      status: 'opened',
      openedAt: new Date().toISOString(),
      openCount: increment(1),
    });
  } catch (err) {
    console.warn('Could not record invite open:', err);
  }
}

export async function createWelcomeInvitesBatch(
  leads: { name: string; phone: string; rawPhone?: string }[],
  existingIds: Set<string> = new Set()
): Promise<WelcomeInvite[]> {
  const created: WelcomeInvite[] = [];
  const usedIds = new Set(existingIds);
  const now = new Date().toISOString();

  // Firestore batch max is 500 writes; chunk at 400 to stay safely below limit
  const CHUNK_SIZE = 400;
  for (let start = 0; start < leads.length; start += CHUNK_SIZE) {
    const slice = leads.slice(start, start + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const lead of slice) {
      let id = generateShortId(6);
      let tries = 0;
      while (usedIds.has(id) && tries < 20) {
        id = generateShortId(6);
        tries++;
      }
      usedIds.add(id);

      const invite: WelcomeInvite = {
        id,
        name: lead.name.trim(),
        phone: normalizeSAPhone(lead.phone),
        rawPhone: lead.rawPhone || lead.phone,
        status: 'pending',
        sentAt: null,
        openedAt: null,
        openCount: 0,
        createdAt: now,
      };
      batch.set(doc(db, 'welcome_invites', id), invite);
      created.push(invite);
    }

    await batch.commit();
  }

  return created;
}

export async function markInviteSent(shortId: string, currentStatus?: WelcomeInviteStatus): Promise<void> {
  // Never downgrade an already-opened invite back to "sent"
  const nextStatus: WelcomeInviteStatus = currentStatus === 'opened' ? 'opened' : 'sent';
  await updateDoc(doc(db, 'welcome_invites', shortId), {
    status: nextStatus,
    sentAt: new Date().toISOString(),
  });
}

export async function deleteWelcomeInvite(shortId: string): Promise<void> {
  await deleteDoc(doc(db, 'welcome_invites', shortId));
}
