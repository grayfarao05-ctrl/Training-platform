import type jsPDF from 'jspdf';
import type autoTable from 'jspdf-autotable';
import { ReportData } from './types';
import { formatDateEnZA, getReportFileName } from './reportService';

async function getPdfTools() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  return { jsPDF, autoTable };
}

// ==========================================
// Color & Geometry Helpers
// ==========================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 79, g: 70, b: 229 }; // Indigo fallback
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

/**
 * Draws the shared professional dark navy header with vector ITreal wordmark,
 * thin course accent stripe, report title, and course subtitle.
 */
function drawReportHeader(doc: jsPDF, title: string, course: ReportData['course']) {
  // 1. Dark Navy Top Band (#0E1126)
  doc.setFillColor(14, 17, 38);
  doc.rect(0, 0, 210, 26, 'F');

  // 2. Thin Course Accent Stripe directly beneath navy band
  const accent = hexToRgb(course.accentHex || '#2563eb');
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 26, 210, 2, 'F');

  // 3. ITreal Vector Wordmark ("IT" in white, "real" in cyan #22D3EE)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('IT', 14, 17);
  const itWidth = doc.getTextWidth('IT');

  doc.setTextColor(34, 211, 238); // Cyan #22D3EE
  doc.text('real', 14 + itWidth, 17);

  // Subtitle under wordmark
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('TECH SOLUTIONS • CERTIFICATION TRAINING PLATFORM', 14, 22);

  // 4. Right: Report Title and Course Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 196, 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(34, 211, 238);
  doc.text(`${course.name} (${course.shortLabel})`, 196, 19, { align: 'right' });
}

/**
 * Draws the shared footer on every page.
 */
function drawReportFooter(doc: jsPDF, pageNumber: number, totalPages: number, reportId: string) {
  const footerY = 286;
  doc.setDrawColor(226, 232, 240); // slate 200
  doc.setLineWidth(0.3);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate 500

  // Left: Official instructor contact
  doc.text('ITreal Tech Solutions  •  Instructor: Gray Farao  •  076 154 2903  •  grayfarao05@gmail.com', 14, footerY + 4.5);

  // Center: Report ID
  doc.text(`Report ID: ${reportId}`, 14, footerY + 8);

  // Right: Page counter
  doc.text(`Page ${pageNumber} of ${totalPages}`, 196, footerY + 4.5, { align: 'right' });
}

// ==========================================
// TEMPLATE A: PROGRESS REPORT (1 - 2 Pages)
// ==========================================

export async function generateProgressReportPdf(reportData: ReportData, reportId: string): Promise<jsPDF> {
  const { jsPDF, autoTable } = await getPdfTools();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const accent = hexToRgb(reportData.course.accentHex || '#2563eb');

  // --- PAGE 1 ---
  drawReportHeader(doc, 'Student Progress Report', reportData.course);

  let currentY = 34;

  // 1. Student & Meta Info Card
  doc.setFillColor(248, 250, 252); // slate 50
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 182, 25, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('STUDENT NAME', 20, currentY + 6);
  doc.text('EMAIL ADDRESS', 80, currentY + 6);
  doc.text('REPORT PERIOD', 140, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate 900
  doc.text(reportData.student.fullName, 20, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(reportData.student.email || 'Registered Student', 80, currentY + 12);

  const periodText = reportData.period.isAllTime
    ? 'All Time (Full Enrollment)'
    : `${formatDateEnZA(reportData.period.start)} - ${formatDateEnZA(reportData.period.end)}`;
  doc.text(periodText, 140, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('COURSE TRACK', 20, currentY + 18);
  doc.text('DATE GENERATED', 140, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`${reportData.course.name} (${reportData.course.shortLabel})`, 20, currentY + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(formatDateEnZA(reportData.issuedAt), 140, currentY + 23);

  currentY += 29;

  // 2. Executive Summary Callout
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(14, currentY, 3, 11, 'F');

  doc.setFillColor(241, 245, 249);
  doc.rect(17, currentY, 179, 11, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text('SUMMARY:', 20, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(reportData.summarySentence, 20, currentY + 8.5);

  currentY += 15;

  // 3. Exam Readiness & Key Metrics Banner
  const metricBoxW = 43.5;
  const metrics = [
    { 
      label: 'EXAM READINESS', 
      val: `${reportData.examReadiness.percentage}%`, 
      sub: 'Weighted Syllabus',
      color: accent 
    },
    { 
      label: 'OBJECTIVES DONE', 
      val: `${reportData.objectives.completedCount} / ${reportData.objectives.totalCount}`, 
      sub: `${reportData.objectives.totalCount > 0 ? Math.round((reportData.objectives.completedCount / reportData.objectives.totalCount) * 100) : 0}% Covered`,
      color: { r: 16, g: 185, b: 129 } 
    },
    { 
      label: 'TESTS TAKEN', 
      val: reportData.tests.totalCount > 0 ? `${reportData.tests.totalCount}` : 'None', 
      sub: reportData.tests.averageScore !== null ? `Avg: ${reportData.tests.averageScore}%` : 'No test records',
      color: { r: 59, g: 130, b: 246 } 
    },
    { 
      label: 'STUDY TIME', 
      val: `${reportData.effort.recordedStudyHours} hrs`, 
      sub: `${reportData.effort.daysActiveInPeriod} active days`,
      color: { r: 139, g: 92, b: 246 } 
    }
  ];

  metrics.forEach((m, idx) => {
    const xPos = 14 + idx * (metricBoxW + 2.6);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xPos, currentY, metricBoxW, 19, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, xPos + 4, currentY + 5);

    doc.setFontSize(12);
    doc.setTextColor(m.color.r, m.color.g, m.color.b);
    doc.text(m.val, xPos + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, xPos + 4, currentY + 16.5);
  });

  currentY += 23;

  // 4. Progress By Domain (with graphical progress bars)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Curriculum Progress by Domain', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Core exam domains for ${reportData.course.name}`, 14, currentY + 4);

  currentY += 7;

  reportData.domains.forEach((d) => {
    const percent = d.totalObjectives > 0 
      ? Math.round((d.completedObjectives / d.totalObjectives) * 100) 
      : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(d.domainTitle, 14, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${d.completedObjectives} of ${d.totalObjectives} objectives (${percent}%)`, 196, currentY + 3.5, { align: 'right' });

    // Progress bar track
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(14, currentY + 5, 182, 3, 1.5, 1.5, 'F');

    // Filled progress
    if (percent > 0) {
      const fillW = Math.max(3, (percent / 100) * 182);
      doc.setFillColor(accent.r, accent.g, accent.b);
      doc.roundedRect(14, currentY + 5, fillW, 3, 1.5, 1.5, 'F');
    }

    currentY += 10.5;
  });

  currentY += 2;

  // 5. Readiness Explanation Note
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 9, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`* Exam Readiness (${reportData.examReadiness.percentage}%): ${reportData.examReadiness.explanation}`, 18, currentY + 5.5);

  currentY += 13;

  // 6. Split Row: Effort & Weekly Activity Chart (Left) + Engagement Box (Right)
  const colLeftW = 118;
  const colRightW = 60;
  const colRightX = 14 + colLeftW + 4;

  // Left: Effort & Weekly Activity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Study Effort & Activity Distribution', 14, currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY + 3, colLeftW, 34, 2, 2, 'FD');

  // Mini Bar Chart of Weekly Activity
  const weeks = reportData.effort.weeklyActivity.slice(-4);
  const chartW = colLeftW - 16;
  const barSlotW = chartW / 4;
  const maxStudy = Math.max(5, ...weeks.map(w => w.studyHours || w.daysActive || 1));

  weeks.forEach((w, wIdx) => {
    const barX = 20 + wIdx * barSlotW + 4;
    const barW = 12;
    const maxBarH = 16;
    const val = w.studyHours || (w.daysActive * 0.5);
    const barH = Math.max(1.5, (val / maxStudy) * maxBarH);
    const barY = currentY + 26 - barH;

    // Track
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(barX, currentY + 10, barW, maxBarH, 1, 1, 'F');

    // Fill
    doc.setFillColor(accent.r, accent.g, accent.b);
    doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');

    // Labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`${w.studyHours}h`, barX + barW / 2, barY - 1, { align: 'center' });
    doc.text(w.weekLabel.split(' ')[0], barX + barW / 2, currentY + 31, { align: 'center' });
  });

  // Right: Engagement (not exam results) Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Engagement', colRightX, currentY);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(colRightX, currentY + 3, colRightW, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(234, 88, 12); // Orange / Amber
  doc.text('ENGAGEMENT (NOT EXAM RESULTS)', colRightX + 4, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Total XP Earned: ${reportData.engagement.xp.toLocaleString()} XP`, colRightX + 4, currentY + 16);
  doc.text(`• Platform Level: Level 0${reportData.engagement.level}`, colRightX + 4, currentY + 22);
  doc.text(`• Study Streak: ${reportData.effort.currentStreak} day${reportData.effort.currentStreak === 1 ? '' : 's'}`, colRightX + 4, currentY + 28);
  doc.text(`• Interactive Drills: Active`, colRightX + 4, currentY + 33);

  currentY += 42;

  // 7. Tutor Comment Box (if present on Page 1 or if fits)
  if (reportData.tutorComment) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Instructor / Tutor Observation', 14, currentY);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, currentY + 3, 182, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const splitComment = doc.splitTextToSize(`"${reportData.tutorComment}"`, 174);
    doc.text(splitComment, 18, currentY + 8);
  }

  // --- PAGE 2: Tests, Boss Challenges & Weakest Topics ---
  doc.addPage();
  drawReportHeader(doc, 'Student Progress Report (Page 2)', reportData.course);

  let p2Y = 34;

  // 1. Tests & Exam Simulations Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Practice Tests & Exam Simulations', 14, p2Y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const trendText = reportData.tests.trend === 'improving' ? 'Improving (Recent scores higher)'
    : reportData.tests.trend === 'declining' ? 'Needs Review'
    : reportData.tests.trend === 'steady' ? 'Steady Performance'
    : 'Benchmark In Progress';
  doc.text(`Performance Trend: ${trendText}  •  Overall Average: ${reportData.tests.averageScore !== null ? reportData.tests.averageScore + '%' : 'No test records'}`, 14, p2Y + 4.5);

  p2Y += 7;

  if (reportData.tests.items.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, p2Y, 182, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No test records found for this period. Practice tests and exam simulations will appear here once attempted.', 18, p2Y + 9);
    p2Y += 21;
  } else {
    const tableBody = reportData.tests.items.slice(0, 8).map(t => [
      formatDateEnZA(t.date),
      t.type,
      t.subject,
      `${t.score}%`,
      t.passed ? 'PASSED' : 'NEEDS WORK',
      'No data for this period' // Duration per Phase 0 audit
    ]);

    autoTable(doc, {
      startY: p2Y,
      margin: { left: 14, right: 14 },
      head: [['Date', 'Format', 'Subject / Domain', 'Score', 'Status', 'Recorded Duration']],
      body: tableBody,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY;
    p2Y = (finalY || p2Y + 40) + 7;
  }

  // 2. Weakest Topics Section (Strictly compliant with Phase 0 audit)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Domain Diagnostic & Weakest Topics', 14, p2Y);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, p2Y + 3, 182, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  // As established in Phase 0 audit, per-question correctness is not stored in test results.
  doc.text('Per-question error diagnostics: No data for this period (granular question mistake tracking is not enabled for past tests).', 18, p2Y + 9);
  doc.text('Recommendation: Review domains with curriculum coverage below 70% listed on Page 1 before attempting full mock exams.', 18, p2Y + 14);

  p2Y += 24;

  // 3. Weekly Boss Challenge Submissions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Practical Boss Challenges & Hands-on Tasks', 14, p2Y);

  p2Y += 5;

  if (reportData.bossChallenges.submissions.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, p2Y, 182, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No boss challenge submissions on record for this period.', 18, p2Y + 8);
    p2Y += 19;
  } else {
    const bossBody = reportData.bossChallenges.submissions.slice(0, 4).map(b => [
      formatDateEnZA(b.timestamp),
      'Hands-on Practical Scenario',
      b.status === 'graded' ? (b.isCorrect ? 'Verified Complete' : 'Reviewed') : 'Under Review',
      b.xpAwarded ? `+${b.xpAwarded} XP` : '--'
    ]);

    autoTable(doc, {
      startY: p2Y,
      margin: { left: 14, right: 14 },
      head: [['Date Submitted', 'Challenge Type', 'Grading Status', 'Reward Awarded']],
      body: bossBody,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY;
    p2Y = (finalY || p2Y + 25) + 6;
  }

  // 4. Verification & Advisory Footer Bar
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, p2Y, 182, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('AUTHENTICITY & VERIFICATION', 18, p2Y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated by ITreal Tech Solutions platform for student academic review. Document ID: ${reportId}`, 18, p2Y + 9.5);

  // Draw footers on both pages
  doc.setPage(1);
  drawReportFooter(doc, 1, 2, reportId);
  doc.setPage(2);
  drawReportFooter(doc, 2, 2, reportId);

  return doc;
}

// ==========================================
// TEMPLATE B: EMPLOYER SUMMARY (Exactly 1 Page)
// ==========================================

export async function generateEmployerSummaryPdf(
  reportData: ReportData,
  reportId: string,
  verifyUrl: string
): Promise<jsPDF> {
  const { jsPDF, autoTable } = await getPdfTools();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const accent = hexToRgb(reportData.course.accentHex || '#2563eb');

  // Single Page: White background default
  drawReportHeader(doc, 'Employer Training Summary', reportData.course);

  let currentY = 33;

  // 1. Candidate & Verification Header Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, currentY, 182, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CANDIDATE NAME', 20, currentY + 6);
  doc.text('CERTIFICATION CURRICULUM', 80, currentY + 6);
  doc.text('TRAINING PERIOD', 140, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(reportData.student.fullName, 20, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`${reportData.course.name} (${reportData.course.shortLabel})`, 80, currentY + 12);

  const periodText = reportData.period.isAllTime
    ? 'Comprehensive Enrollment'
    : `${formatDateEnZA(reportData.period.start)} - ${formatDateEnZA(reportData.period.end)}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(periodText, 140, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REPORT ID', 20, currentY + 18.5);
  doc.text('ISSUE DATE', 140, currentY + 18.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(reportId, 20, currentY + 23.5);
  doc.text(formatDateEnZA(reportData.issuedAt), 140, currentY + 23.5);

  currentY += 30;

  // 2. Four Key Performance Metrics Cards
  const cardW = 43.5;
  const metrics = [
    { 
      label: 'OBJECTIVES MASTERED', 
      val: `${reportData.objectives.completedCount} / ${reportData.objectives.totalCount}`,
      sub: `${reportData.objectives.totalCount > 0 ? Math.round((reportData.objectives.completedCount / reportData.objectives.totalCount) * 100) : 0}% Course Coverage`,
      color: accent 
    },
    { 
      label: 'EXAMS & TESTS TAKEN', 
      val: reportData.tests.totalCount > 0 ? `${reportData.tests.totalCount}` : '0',
      sub: 'Simulated Assessments',
      color: { r: 59, g: 130, b: 246 } 
    },
    { 
      label: 'AVERAGE & BEST SCORE', 
      val: reportData.tests.averageScore !== null ? `${reportData.tests.averageScore}%` : 'N/A',
      sub: reportData.tests.bestScore !== null ? `Highest Score: ${reportData.tests.bestScore}%` : 'Assessments pending',
      color: { r: 16, g: 185, b: 129 } 
    },
    { 
      label: 'STUDY HOURS LOGGED', 
      val: `${reportData.effort.recordedStudyHours} hrs`,
      sub: `${reportData.effort.daysActiveInPeriod} verified active days`,
      color: { r: 139, g: 92, b: 246 } 
    }
  ];

  metrics.forEach((m, idx) => {
    const xPos = 14 + idx * (cardW + 2.6);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(xPos, currentY, cardW, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, xPos + 4, currentY + 5.5);

    doc.setFontSize(11);
    doc.setTextColor(m.color.r, m.color.g, m.color.b);
    doc.text(m.val, xPos + 4, currentY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, xPos + 4, currentY + 17);
  });

  currentY += 25;

  // 3. Domain Competencies Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Curriculum Domain Competencies', 14, currentY);

  currentY += 3;

  const domainRows = reportData.domains.map(d => {
    const pct = d.totalObjectives > 0 
      ? Math.round((d.completedObjectives / d.totalObjectives) * 100) 
      : 0;
    const statusText = pct === 100 ? 'Fully Mastered (100%)'
      : pct >= 70 ? `Proficient (${pct}%)`
      : pct > 0 ? `In Progress (${pct}%)`
      : 'Enrolled / Not Started';
    return [
      d.domainTitle,
      `${d.completedObjectives} of ${d.totalObjectives} objectives completed`,
      statusText
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [['Domain Area', 'Objectives Completed', 'Proficiency Standing']],
    body: domainRows,
    theme: 'plain',
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 7.2
    }
  });

  const domainTableFinalY = (doc as any).lastAutoTable?.finalY;
  currentY = (domainTableFinalY || currentY + 30) + 5;

  // 4. Skills Covered (built from titles of completed objectives)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Key Technical Skills & Competencies Covered', 14, currentY);

  currentY += 4;

  const completedSkills = reportData.objectives.completedTitles;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 30, 2, 2, 'FD');

  if (completedSkills.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Training in progress — completed module skills will be catalogued here upon completion of respective milestones.', 18, currentY + 14);
  } else {
    // Show up to 8 top skills in 2 clean columns
    const displaySkills = completedSkills.slice(0, 8);
    const midPoint = Math.ceil(displaySkills.length / 2);
    const col1 = displaySkills.slice(0, midPoint);
    const col2 = displaySkills.slice(midPoint);

    const drawCol = (items: string[], startX: number) => {
      items.forEach((skill, idx) => {
        const itemY = currentY + 5.5 + idx * 5.8;
        // Accent bullet
        doc.setFillColor(accent.r, accent.g, accent.b);
        doc.circle(startX, itemY - 1, 0.9, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        const truncated = skill.length > 50 ? skill.slice(0, 48) + '...' : skill;
        doc.text(truncated, startX + 3, itemY);
      });
    };

    drawCol(col1, 20);
    drawCol(col2, 108);

    if (completedSkills.length > 8) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`+ ${completedSkills.length - 8} additional curriculum modules completed`, 18, currentY + 28);
    }
  }

  currentY += 34;

  // 5. Instructor Endorsement / Tutor Comment
  if (reportData.tutorComment) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Instructor Recommendation & Evaluation', 14, currentY);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY + 2.5, 182, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(`"${reportData.tutorComment}"`, 174);
    doc.text(lines, 18, currentY + 7);

    currentY += 20;
  } else {
    currentY += 2;
  }

  // 6. Online Verification Link
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('AUTHENTICITY VERIFICATION', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text(`Verify this report online at: ${verifyUrl}`, 14, currentY + 4);

  currentY += 8;

  // 7. Mandatory Boxed Disclaimer (ALWAYS PRINTED AT BOTTOM OF EXACTLY 1 PAGE)
  const disclaimerY = 264;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225); // slate 300
  doc.setLineWidth(0.4);
  doc.roundedRect(14, disclaimerY, 182, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL RECORD DISCLAIMER', 18, disclaimerY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('This is an ITreal Tech Solutions training record. It is not a CompTIA certification or an exam result.', 18, disclaimerY + 9);
  doc.text('Issued under student consent for employer and vocational evaluation purposes only.', 18, disclaimerY + 12.5);

  // Single Page Footer
  drawReportFooter(doc, 1, 1, reportId);

  return doc;
}

// ==========================================
// Download & Export Utilities
// ==========================================

export async function downloadProgressReport(reportData: ReportData, reportId: string) {
  const doc = await generateProgressReportPdf(reportData, reportId);
  const fileName = getReportFileName(
    reportData.student.fullName,
    reportData.student.email,
    reportData.course.shortLabel,
    reportData.issuedAt
  );
  doc.save(fileName);
}

export async function downloadEmployerSummary(reportData: ReportData, reportId: string, verifyUrl: string) {
  const doc = await generateEmployerSummaryPdf(reportData, reportId, verifyUrl);
  const fileName = getReportFileName(
    reportData.student.fullName,
    reportData.student.email,
    `${reportData.course.shortLabel}_EmployerSummary`,
    reportData.issuedAt
  );
  doc.save(fileName);
}

export async function generateProgressReportBlob(reportData: ReportData, reportId: string): Promise<Blob> {
  const doc = await generateProgressReportPdf(reportData, reportId);
  return doc.output('blob');
}

