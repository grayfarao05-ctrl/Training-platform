import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Sparkles,
  Play,
  Save,
  RotateCcw,
  Eye,
  Settings2,
  CheckCircle2,
  Loader2,
  Sliders,
  Upload,
  FileSpreadsheet,
  MessageCircle,
  Copy,
  Trash2,
  Download,
  UserPlus,
  Search,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { WelcomeIntro } from '../WelcomeIntro';
import { createIntro } from '../WelcomeIntro/introEngine.js';
import itrealLogo from '../WelcomeIntro/itrealLogo.js';
import {
  WelcomeInvite,
  WelcomeIntroSettings,
  WelcomeDestination,
  DEFAULT_WELCOME_SETTINGS,
  getWelcomeIntroSettings,
  saveWelcomeIntroSettings,
  listWelcomeInvites,
  createWelcomeInvitesBatch,
  markInviteSent,
  deleteWelcomeInvite,
  normalizeSAPhone,
  extractFirstName,
  buildShortLink,
  formatWhatsAppMessage,
  buildWhatsAppUrl,
} from '../../welcomeInvitesService';

interface AdminWelcomeIntroTabProps {
  setAdminFeedback: (msg: string | null) => void;
}

const KEYFRAMES = [
  { label: '0.3s Beam', t: 0.3 },
  { label: '1.2s Bounce', t: 1.2 },
  { label: '2.0s Arc Up', t: 2.0 },
  { label: '3.3s Writing', t: 3.3 },
  { label: '4.6s Arc Down', t: 4.6 },
  { label: '6.2s Logo Trace', t: 6.2 },
  { label: '7.7s Fuse Run', t: 7.7 },
  { label: '9.5s Final', t: 9.5 },
];

export const AdminWelcomeIntroTab: React.FC<AdminWelcomeIntroTabProps> = ({ setAdminFeedback }) => {
  const [settings, setSettings] = useState<WelcomeIntroSettings>(DEFAULT_WELCOME_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fullscreen preview state
  const [previewName, setPreviewName] = useState<string>('MARK');
  const [previewFullscreen, setPreviewFullscreen] = useState<boolean>(false);
  const [activePreviewStudent, setActivePreviewStudent] = useState<string>('');

  // Inline scrubber state
  const [scrubTime, setScrubTime] = useState(9.5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const introRef = useRef<ReturnType<typeof createIntro> | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Invites list state
  const [invites, setInvites] = useState<WelcomeInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [leadSearch, setLeadSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'opened'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual quick-add lead state
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [addingManual, setAddingManual] = useState(false);

  // Excel / CSV importer state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [nameCol, setNameCol] = useState<string>('');
  const [phoneCol, setPhoneCol] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);

  const loadAll = async () => {
    setLoadingSettings(true);
    setLoadingInvites(true);
    try {
      const [cfg, list] = await Promise.all([
        getWelcomeIntroSettings(),
        listWelcomeInvites(),
      ]);
      setSettings(cfg);
      setInvites(list);
    } catch (err) {
      console.warn('Error loading Welcome Intro admin data:', err);
    } finally {
      setLoadingSettings(false);
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Re-render inline scrubber whenever time or previewName changes
  useEffect(() => {
    const drawFrame = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      introRef.current = createIntro(img, { studentName: previewName.trim() });
      const ctx = canvas.getContext('2d');
      if (!ctx || !introRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      introRef.current.draw(ctx, scrubTime, { scale: 1.0, sparkleCount: 36 });
    };

    if (logoImgRef.current && logoImgRef.current.complete && logoImgRef.current.naturalWidth > 0) {
      drawFrame(logoImgRef.current);
      return;
    }

    const img = new Image();
    img.src = itrealLogo;
    logoImgRef.current = img;
    if (img.complete && img.naturalWidth > 0) {
      drawFrame(img);
    } else {
      img.onload = () => drawFrame(img);
    }
  }, [scrubTime, previewName]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const payload: WelcomeIntroSettings = {
        ...settings,
        buttonLabel: settings.buttonLabel.trim() || DEFAULT_WELCOME_SETTINGS.buttonLabel,
        href: settings.href.trim(),
        baseUrl: (settings.baseUrl.trim() || window.location.origin).replace(/\/+$/, ''),
        whatsappTemplate: settings.whatsappTemplate.trim() || DEFAULT_WELCOME_SETTINGS.whatsappTemplate,
      };
      await saveWelcomeIntroSettings(payload);
      setSettings(payload);
      setAdminFeedback('Welcome Intro & WhatsApp settings saved!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setAdminFeedback('Failed to save settings. Check Firestore permissions.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Excel / CSV file parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

        if (!rows.length) {
          setAdminFeedback('That file appears to be empty.');
          return;
        }

        const headers = Object.keys(rows[0]);
        setParsedHeaders(headers);
        setParsedRows(rows);

        // Auto-detect Name & Phone columns
        const guessedName =
          headers.find((h) => /first\s*name|student\s*name|full\s*name|^name$/i.test(h.trim())) ||
          headers.find((h) => /name/i.test(h)) ||
          headers[0] ||
          '';
        const guessedPhone =
          headers.find((h) => /whatsapp|cell|mobile|phone|number|tel|contact/i.test(h)) ||
          headers[1] ||
          headers[0] ||
          '';

        setNameCol(guessedName);
        setPhoneCol(guessedPhone);
      } catch (err) {
        console.error('Failed parsing spreadsheet:', err);
        setAdminFeedback('Could not read Excel/CSV file. Make sure it is a valid .xlsx, .xls, or .csv file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const previewImportLeads = useMemo(() => {
    if (!parsedRows.length || !nameCol) return [];
    const seenPhones = new Set(invites.map((i) => i.phone).filter(Boolean));
    const list: { name: string; phone: string; rawPhone: string; duplicate: boolean }[] = [];

    for (const row of parsedRows) {
      const rawName = String(row[nameCol] ?? '').trim();
      const firstName = extractFirstName(rawName);
      if (!firstName) continue;
      const rawPhone = phoneCol ? String(row[phoneCol] ?? '').trim() : '';
      const normPhone = normalizeSAPhone(rawPhone);
      const duplicate = Boolean(normPhone && seenPhones.has(normPhone));
      list.push({ name: firstName, phone: normPhone, rawPhone, duplicate });
    }
    return list;
  }, [parsedRows, nameCol, phoneCol, invites]);

  const handleConfirmImport = async () => {
    const toImport = previewImportLeads.filter((l) => !l.duplicate);
    if (!toImport.length) {
      setAdminFeedback('No new leads to import (all entries already exist or are empty).');
      return;
    }

    setImporting(true);
    try {
      const existingIds = new Set(invites.map((i) => i.id));
      const created = await createWelcomeInvitesBatch(toImport, existingIds);
      setInvites((prev) => [...created, ...prev]);
      setParsedRows([]);
      setParsedHeaders([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAdminFeedback(`Imported ${created.length} leads with unique short links!`);
    } catch (err) {
      console.error('Import error:', err);
      setAdminFeedback('Failed to import leads. Check Firestore rules.');
    } finally {
      setImporting(false);
    }
  };

  const handleAddManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const first = extractFirstName(manualName);
    if (!first) return;
    setAddingManual(true);
    try {
      const existingIds = new Set(invites.map((i) => i.id));
      const created = await createWelcomeInvitesBatch(
        [{ name: first, phone: manualPhone, rawPhone: manualPhone }],
        existingIds
      );
      setInvites((prev) => [...created, ...prev]);
      setManualName('');
      setManualPhone('');
      setAdminFeedback(`Added ${first} (/${created[0].id})!`);
    } catch (err) {
      console.error('Manual add error:', err);
      setAdminFeedback('Failed to add lead.');
    } finally {
      setAddingManual(false);
    }
  };

  const handleSendWhatsApp = async (invite: WelcomeInvite) => {
    const link = buildShortLink(settings.baseUrl, invite.id);
    const msg = formatWhatsAppMessage(settings.whatsappTemplate, invite.name, link);
    const waUrl = buildWhatsAppUrl(invite.phone, msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    try {
      await markInviteSent(invite.id, invite.status);
      setInvites((prev) =>
        prev.map((item) =>
          item.id === invite.id
            ? {
                ...item,
                status: item.status === 'opened' ? 'opened' : 'sent',
                sentAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      console.warn('Could not mark invite sent:', err);
    }
  };

  const handleCopyLink = async (invite: WelcomeInvite) => {
    const link = buildShortLink(settings.baseUrl, invite.id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId((cur) => (cur === invite.id ? null : cur)), 2000);
    } catch {
      setAdminFeedback(`Link: ${link}`);
    }
  };

  const handleDeleteInvite = async (invite: WelcomeInvite) => {
    try {
      await deleteWelcomeInvite(invite.id);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setAdminFeedback(`Removed ${invite.name}.`);
    } catch (err) {
      console.error('Failed deleting invite:', err);
      setAdminFeedback('Failed to delete lead.');
    }
  };

  const handleExportCsv = () => {
    if (!invites.length) return;
    const rows = invites.map((inv) => {
      const link = buildShortLink(settings.baseUrl, inv.id);
      const msg = formatWhatsAppMessage(settings.whatsappTemplate, inv.name, link);
      const waUrl = buildWhatsAppUrl(inv.phone, msg);
      return {
        Name: inv.name,
        Phone: inv.phone,
        ShortID: inv.id,
        PersonalLink: link,
        WhatsAppLink: waUrl,
        Status: inv.status,
        Opens: inv.openCount || 0,
        SentAt: inv.sentAt || '',
        OpenedAt: inv.openedAt || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WhatsApp Invites');
    XLSX.writeFile(wb, 'itreal-whatsapp-invites.csv', { bookType: 'csv' });
    setAdminFeedback('Exported CSV with all short links & WhatsApp URLs!');
  };

  const filteredInvites = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    return invites.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.name.toLowerCase().includes(q) ||
        inv.phone.toLowerCase().includes(q) ||
        inv.id.toLowerCase().includes(q)
      );
    });
  }, [invites, leadSearch, statusFilter]);

  const counts = useMemo(() => {
    let pending = 0;
    let sent = 0;
    let opened = 0;
    for (const i of invites) {
      if (i.status === 'opened') opened++;
      else if (i.status === 'sent') sent++;
      else pending++;
    }
    return { total: invites.length, pending, sent, opened };
  }, [invites]);

  const launchPreview = (name: string) => {
    setActivePreviewStudent(name);
    setPreviewFullscreen(true);
  };

  return (
    <div className="space-y-8">
      {/* True Fullscreen Live Preview Overlay (Portaled to document.body) */}
      {previewFullscreen && (
        <WelcomeIntro
          studentName={activePreviewStudent}
          buttonLabel={settings.buttonLabel || DEFAULT_WELCOME_SETTINGS.buttonLabel}
          onContinue={() => setPreviewFullscreen(false)}
        />
      )}

      {/* Header Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] mb-2">
              <Sparkles size={14} /> Personalized WhatsApp Welcome Hub
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[var(--text-main)]">
              Welcome Intro &amp; WhatsApp Links
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Import your Excel/CSV list of prospective students, generate personal short links (e.g. <code className="text-cyan-400">/xtpkjs</code>) that trace their name in light, and send 1-click WhatsApp invites with live open tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              placeholder="Test Name (e.g. MARK)"
              className="w-36 sm:w-44 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => launchPreview(previewName)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Play size={15} fill="currentColor" /> Fullscreen Preview
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1: EXCEL / CSV IMPORTER + WHATSAPP CAMPAIGN LEADS        */}
      {/* ================================================================ */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" /> Excel / CSV Lead Importer &amp; WhatsApp Sender
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Upload an <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file with names &amp; numbers. South African numbers (<code>082...</code>) auto-convert to <code>2782...</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] hover:bg-white/10 border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              title="Refresh open statuses"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!invites.length}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 disabled:opacity-40 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Leads', value: counts.total, color: 'text-white' },
            { label: 'Pending', value: counts.pending, color: 'text-amber-400' },
            { label: 'Sent', value: counts.sent, color: 'text-cyan-400' },
            { label: 'Opened Link', value: counts.opened, color: 'text-emerald-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                {stat.label}
              </div>
              <div className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Upload Box + Quick Manual Add */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Excel Upload */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                <Upload size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-main)]">
                  {fileName ? `Loaded: ${fileName}` : 'Upload Excel or CSV File'}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Supports .xlsx, .xls, and .csv with Name &amp; Phone columns
                </div>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
            >
              Choose File
            </button>
          </div>

          {/* Quick Add Single Student */}
          <form
            onSubmit={handleAddManualLead}
            className="lg:col-span-5 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="First name (e.g. Jade)"
              required
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={manualPhone}
              onChange={(e) => setManualPhone(e.target.value)}
              placeholder="082 123 4567"
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={addingManual}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {addingManual ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Add
            </button>
          </form>
        </div>

        {/* Column Mapping & Import Preview (shown when a file is loaded) */}
        {parsedRows.length > 0 && (
          <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">
                    Name Column
                  </label>
                  <select
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)]"
                  >
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-1">
                    Phone Column
                  </label>
                  <select
                    value={phoneCol}
                    onChange={(e) => setPhoneCol(e.target.value)}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)]"
                  >
                    <option value="">(None)</option>
                    {parsedHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-[var(--text-main)] pt-4">
                  Ready to import{' '}
                  <strong className="text-emerald-400">
                    {previewImportLeads.filter((l) => !l.duplicate).length}
                  </strong>{' '}
                  new leads ({previewImportLeads.filter((l) => l.duplicate).length} duplicates skipped)
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setParsedHeaders([]);
                    setFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Generate Short Links &amp; Import
                </button>
              </div>
            </div>

            {/* First 5 rows preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-indigo-300 border-b border-white/10">
                    <th className="py-2 pr-4">First Name (Intro)</th>
                    <th className="py-2 pr-4">Original Number</th>
                    <th className="py-2 pr-4">WhatsApp Number</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewImportLeads.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-2 pr-4 font-bold text-white uppercase">{row.name}</td>
                      <td className="py-2 pr-4 text-[var(--text-muted)]">{row.rawPhone || '—'}</td>
                      <td className="py-2 pr-4 font-mono text-cyan-300">{row.phone || '—'}</td>
                      <td className="py-2">
                        {row.duplicate ? (
                          <span className="text-amber-400 font-bold">Already imported</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">New</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Search leads by name, phone, or short ID..."
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-color)]">
            {(['all', 'pending', 'sent', 'opened'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
          {loadingInvites ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              No leads yet. Upload your Excel/CSV file above or add a student manually to generate personalized short links.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface)] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">WhatsApp Number</th>
                  <th className="py-3.5 px-4">Short Link</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredInvites.map((inv) => {
                  const fullLink = buildShortLink(settings.baseUrl, inv.id);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-bold text-[var(--text-main)]">{inv.name}</td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        {inv.phone ? `+${inv.phone}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`/${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-cyan-400 hover:underline inline-flex items-center gap-1"
                          title={fullLink}
                        >
                          /{inv.id} <ExternalLink size={11} />
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        {inv.status === 'opened' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Opened {inv.openCount > 1 ? `(${inv.openCount}×)` : ''}
                          </span>
                        ) : inv.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(inv)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer"
                            title="Open WhatsApp with pre-filled personal message"
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => launchPreview(inv.name)}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-cyan-500/20 text-[var(--text-muted)] hover:text-cyan-300 border border-[var(--border-color)] cursor-pointer"
                            title={`Preview ${inv.name}'s fullscreen intro`}
                          >
                            <Play size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv)}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-indigo-500/20 text-[var(--text-muted)] hover:text-indigo-300 border border-[var(--border-color)] cursor-pointer"
                            title="Copy personal short link"
                          >
                            {copiedId === inv.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvite(inv)}
                            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-400 border border-[var(--border-color)] cursor-pointer"
                            title="Delete lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 2: FRAME INSPECTOR + CAMPAIGN / DISPLAY SETTINGS         */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Frame Scrubber */}
        <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
              <Eye size={15} className="text-cyan-400" /> Frame Inspector ({previewName.trim() ? previewName.trim().toUpperCase() : 'Generic'})
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              t = {scrubTime.toFixed(2)}s
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#03070d] shadow-inner">
            <canvas
              ref={canvasRef}
              width={960}
              height={580}
              className="w-full h-auto block"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Sliders size={14} className="text-[var(--text-muted)]" />
              <input
                type="range"
                min={0}
                max={9.8}
                step={0.05}
                value={scrubTime}
                onChange={(e) => setScrubTime(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {KEYFRAMES.map((kf) => (
                <button
                  key={kf.t}
                  type="button"
                  onClick={() => setScrubTime(kf.t)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                    Math.abs(scrubTime - kf.t) < 0.08
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {kf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings Form */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] flex items-center gap-2">
              <Settings2 size={15} className="text-indigo-400" /> Campaign &amp; Destination Settings
            </h3>

            {loadingSettings ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                {/* Base URL */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    Website Base URL (for WhatsApp Links)
                  </label>
                  <input
                    type="text"
                    value={settings.baseUrl}
                    onChange={(e) => setSettings((s) => ({ ...s, baseUrl: e.target.value }))}
                    placeholder="https://itreal.co.za"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* WhatsApp Message Template */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    WhatsApp Message Template (<code className="text-cyan-400">{'{name}'}</code> &amp; <code className="text-cyan-400">{'{link}'}</code>)
                  </label>
                  <textarea
                    rows={3}
                    value={settings.whatsappTemplate}
                    onChange={(e) => setSettings((s) => ({ ...s, whatsappTemplate: e.target.value }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Continue Destination */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    After Intro &ldquo;Continue&rdquo; Destination
                  </label>
                  <select
                    value={settings.destination}
                    onChange={(e) => setSettings((s) => ({ ...s, destination: e.target.value as WelcomeDestination }))}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs font-bold text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="landing">ITreal Landing Page (Courses &amp; Reviews)</option>
                    <option value="signup">Sign-Up / Registration Screen</option>
                    <option value="custom">Custom Redirect URL</option>
                  </select>
                </div>

                {settings.destination === 'custom' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                      Custom Redirect URL
                    </label>
                    <input
                      type="text"
                      value={settings.href}
                      onChange={(e) => setSettings((s) => ({ ...s, href: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Button Label */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                    Continue Button Label
                  </label>
                  <input
                    type="text"
                    value={settings.buttonLabel}
                    onChange={(e) => setSettings((s) => ({ ...s, buttonLabel: e.target.value }))}
                    placeholder="Continue to the website"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Toggles */}
                <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-main)]">Show Generic Intro on Website Entry</span>
                  <input
                    type="checkbox"
                    checked={settings.enabledOnEntry}
                    onChange={(e) => setSettings((s) => ({ ...s, enabledOnEntry: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] cursor-pointer">
                  <span className="text-xs font-bold text-[var(--text-main)]">Play Once Per Session</span>
                  <input
                    type="checkbox"
                    checked={settings.showOncePerSession}
                    onChange={(e) => setSettings((s) => ({ ...s, showOncePerSession: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer"
                  />
                </label>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setSettings(DEFAULT_WELCOME_SETTINGS)}
              className="px-4 py-3 rounded-xl bg-[var(--bg-surface)] hover:bg-white/10 border border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings || loadingSettings}
              className="flex-1 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {savingSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcomeIntroTab;
