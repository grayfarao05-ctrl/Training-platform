import {
  CourseId,
  LessonData,
  LessonSection,
  TextLessonSection,
  DiagramLessonSection,
  VirtualLabSection,
  TerminalLessonSection,
  MatcherLessonSection,
  FinanceSimLessonSection,
  PromptLabLessonSection,
  QuizLessonSection
} from './types';

/**
 * Deterministically compiles raw curriculum text (extracted from an uploaded PDF or lesson notes)
 * into a multi-stage interactive LessonData object strictly grounded in the source text.
 */
export function compileCurriculumToInteractiveLesson(params: {
  courseId: CourseId;
  objectiveId: string;
  objectiveTitle: string;
  domainName: string;
  sourceText: string;
}): LessonData {
  const { courseId, objectiveId, objectiveTitle, domainName, sourceText } = params;

  const cleanedLines = sourceText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 2);

  // Group paragraphs & headings from the curriculum text
  const paragraphs = sourceText
    .split(/\n\s*\n/)
    .map(block => block.replace(/\s+/g, ' ').trim())
    .filter(block => block.length > 35);

  const leadParagraph =
    paragraphs[0] ||
    cleanedLines.slice(0, 3).join(' ') ||
    `Interactive study module for ${objectiveId}: ${objectiveTitle}.`;

  // Extract bullet-like or key specification lines from the source text
  const bulletLines = cleanedLines
    .filter(l => /^[-•*0-9]/.test(l) || l.includes(':'))
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 12 && l.length < 220);

  // Extract key terms ("Term: Definition" or "Term - Definition") directly from the source text
  const extractedTerms: { term: string; definition: string }[] = [];
  for (const line of cleanedLines) {
    const colonMatch = line.match(/^([A-Za-z0-9/\-() ]{3,40})\s*[:–-]\s*(.{15,200})$/);
    if (colonMatch && extractedTerms.length < 8) {
      extractedTerms.push({
        term: colonMatch[1].trim(),
        definition: colonMatch[2].trim()
      });
    }
  }

  if (extractedTerms.length === 0) {
    extractedTerms.push(
      {
        term: objectiveTitle.split(':')[0] || objectiveTitle,
        definition: leadParagraph.slice(0, 160)
      },
      {
        term: domainName,
        definition: bulletLines[0] || `Core specification area covered in ${objectiveId}.`
      }
    );
  }

  // Build 2-4 structured text sections strictly from the uploaded curriculum text
  const chunkCount = Math.max(1, Math.min(4, Math.ceil(paragraphs.length / 2)));
  const textSections = Array.from({ length: chunkCount }).map((_, idx) => {
    const slice = paragraphs.slice(idx * 2, idx * 2 + 2);
    const sectionBullets = bulletLines.slice(idx * 4, idx * 4 + 4);
    return {
      heading:
        idx === 0
          ? `1. Core Concepts: ${objectiveTitle}`
          : `${idx + 1}. Technical Specifications & Applied Rules`,
      body:
        slice.length > 0
          ? slice
          : [leadParagraph],
      bulletPoints: sectionBullets.length > 0 ? sectionBullets : bulletLines.slice(0, 4),
      callout:
        idx === 0
          ? {
              type: 'exam-tip' as const,
              title: 'Key Curriculum Focus',
              content:
                bulletLines[0] ||
                slice[0] ||
                `Review all specifications and procedures for ${objectiveTitle}.`
            }
          : undefined
    };
  });

  const textStage: TextLessonSection = {
    id: `sec-text-${objectiveId}`,
    type: 'text',
    title: `Curriculum Briefing: ${objectiveTitle}`,
    subtitle: 'Extracted Directly from Official Course Material',
    estimatedMinutes: 6,
    content: {
      lead: leadParagraph,
      sections: textSections,
      keyTakeaways:
        bulletLines.slice(0, 4).length > 0
          ? bulletLines.slice(0, 4)
          : [leadParagraph.slice(0, 140)],
      technicalTerms: extractedTerms
    }
  };

  // Stage 2: Interactive Blueprint Diagram with Hotspots derived from extracted terms/sections
  const hotspotCoords = [
    { x: 25, y: 30 },
    { x: 52, y: 28 },
    { x: 75, y: 38 },
    { x: 35, y: 68 },
    { x: 68, y: 72 }
  ];

  const diagramHotspots = extractedTerms.slice(0, 5).map((item, idx) => ({
    id: `hs-${idx + 1}`,
    x: hotspotCoords[idx % hotspotCoords.length].x,
    y: hotspotCoords[idx % hotspotCoords.length].y,
    name: item.term,
    category: domainName,
    shortDescription: item.definition,
    fullSpecs: bulletLines[idx] || item.definition,
    troubleshootingNote:
      bulletLines[idx + 1] ||
      `Verify ${item.term} configuration and operational parameters during diagnostics.`,
    examRelevance: `Core concept from ${objectiveId}: ${objectiveTitle}`
  }));

  const diagramStage: DiagramLessonSection = {
    id: `sec-diagram-${objectiveId}`,
    type: 'diagram',
    title: `Interactive Blueprint: ${objectiveTitle}`,
    subtitle: 'Click Each Numbered Hotspot to Inspect Curriculum Specifications',
    estimatedMinutes: 5,
    diagramId: `${courseId}-${objectiveId}-blueprint`,
    diagramTitle: `${objectiveTitle} — Interactive Architecture`,
    description: `Explore the core components and concepts extracted from your ${objectiveTitle} study material.`,
    hotspots: diagramHotspots,
    quizQuestions:
      diagramHotspots.length > 0
        ? [
            {
              prompt: `Locate the node corresponding to: "${diagramHotspots[0].shortDescription.slice(0, 90)}..."`,
              targetHotspotId: diagramHotspots[0].id,
              hint: `Look for ${diagramHotspots[0].name} on the blueprint.`
            }
          ]
        : []
  };

  // Stage 3: Interactive Specification Matcher from extracted terms
  const matcherPairs = extractedTerms.slice(0, 4).map((item, idx) => ({
    id: `pair-${idx + 1}`,
    sourceLabel: item.term,
    sourceCategory: `Concept #${idx + 1}`,
    targetLabel: item.definition.slice(0, 75) + (item.definition.length > 75 ? '...' : ''),
    targetSpec: item.definition,
    explanation: `${item.term}: ${item.definition}`
  }));

  const matcherStage: MatcherLessonSection = {
    id: `sec-matcher-${objectiveId}`,
    type: 'matcher',
    title: 'Interactive Specification & Concept Matcher',
    subtitle: 'Connect Curriculum Terms to Their Exact Definitions',
    estimatedMinutes: 5,
    matcherTitle: `${objectiveTitle} — Specification Patch Matrix`,
    description: 'Select each concept on the left and snap it to its matching curriculum definition on the right.',
    mode: 'concept-match',
    xpReward: 120,
    pairs: matcherPairs
  };

  // Stage 4: Course-Specific Interactive Hands-On Simulator
  let handsOnStage: LessonSection;

  if (courseId === 'matric-to-money') {
    const finStage: FinanceSimLessonSection = {
      id: `sec-fin-${objectiveId}`,
      type: 'finance-sim',
      title: 'Interactive South African Payslip & ZAR Budget Lab',
      subtitle: 'Apply Curriculum Rules to a Real South African Salary Scenario',
      estimatedMinutes: 7,
      simTitle: `${objectiveTitle} — Practical ZAR & BCEA Simulator`,
      employeeName: 'Lerato Mokoena',
      roleTitle: 'Entry-Level IT Coordinator (Pretoria)',
      grossMonthlyZar: 15000,
      xpReward: 175,
      payslipItems: [
        {
          id: 'ps-1',
          label: 'Basic Salary (Gross)',
          amountZar: 15000,
          category: 'earnings',
          explanation: bulletLines[0] || 'Guaranteed gross monthly earnings before statutory deductions.',
          bceaOrSarsRule: 'BCEA Section 32 requires written payslips and timely payment in South African Rand (R).'
        },
        {
          id: 'ps-2',
          label: 'PAYE Income Tax (SARS)',
          amountZar: 1185,
          category: 'deduction',
          explanation: 'Monthly Pay-As-You-Earn income tax remitted to SARS.',
          bceaOrSarsRule: 'Calculated according to annual SARS tax tables and rebates.'
        },
        {
          id: 'ps-3',
          label: 'UIF Contribution (1% Statutory)',
          amountZar: 150,
          category: 'deduction',
          explanation: 'Mandatory 1% employee Unemployment Insurance Fund deduction.',
          bceaOrSarsRule: 'Matched by an additional 1% paid by the employer.'
        },
        {
          id: 'ps-4',
          label: 'Net Take-Home Pay',
          amountZar: 13665,
          category: 'net',
          explanation: 'Actual Rand amount deposited into your bank account for 50/30/20 budgeting.',
          bceaOrSarsRule: 'Always budget using Net Take-Home Pay rather than Gross Cost-to-Company.'
        }
      ],
      budgetTargetPercent: {
        needsMax: 50,
        wantsMax: 30,
        savingsMin: 20
      },
      auditQuestion: {
        question: `Based on "${objectiveTitle}", what is the primary takeaway regarding workplace compliance?`,
        options: [
          bulletLines[0] || leadParagraph.slice(0, 95),
          'Verbal promises override all written South African laws.',
          'Employers can deduct 80% of wages without consent.',
          'Payslips are optional in South Africa.'
        ],
        correctAnswer: 0,
        explanation: bulletLines[0] || leadParagraph
      }
    };
    handsOnStage = finStage;
  } else if (courseId === 'beyond-the-chatbot') {
    const promptStage: PromptLabLessonSection = {
      id: `sec-prompt-${objectiveId}`,
      type: 'prompt-lab',
      title: 'Interactive Prompt Engineering & Verification Sandbox',
      subtitle: 'Engineer Structured Prompts and Audit AI Outputs',
      estimatedMinutes: 7,
      labTitle: `${objectiveTitle} — Interactive AI Sandbox`,
      scenarioBrief: `Apply the principles from "${objectiveTitle}" to engineer a high-precision, POPIA-safe prompt and catch unverified AI claims.`,
      baseWeakPrompt: `Summarize ${objectiveTitle} for our team.`,
      weakOutputPreview: 'Here is a generic summary without specific constraints, citations, or South African compliance checks.',
      optimalOutputPreview: `STRUCTURED BRIEFING: ${objectiveTitle}\n• Key Rule: ${bulletLines[0] || leadParagraph.slice(0, 100)}\n• Implementation: ${bulletLines[1] || 'Verified against internal SOP.'}\n• Governance: [POPIA-SAFE & HUMAN-VERIFIED]`,
      xpReward: 175,
      toggles: [
        {
          id: 't-role',
          category: 'role',
          label: 'Define Specialist Role & Objective Context',
          promptSnippet: `ROLE: Act as a specialist instructor covering ${objectiveTitle} (${domainName}).`,
          qualityBoost: 30,
          isOptimal: true,
          feedback: '✓ Good! Specifying the specialist role anchors the model response.'
        },
        {
          id: 't-ctx',
          category: 'context',
          label: 'Inject Grounded Curriculum Specifications',
          promptSnippet: `SOURCE FACTS: ${bulletLines.slice(0, 2).join(' | ') || leadParagraph.slice(0, 120)}`,
          qualityBoost: 30,
          isOptimal: true,
          feedback: '✓ Grounding the prompt in your exact source text prevents hallucinations.'
        },
        {
          id: 't-trap',
          category: 'popia-safety',
          label: 'Include Unredacted Client SA ID & Personal Data (TRAP)',
          promptSnippet: 'RAW PII: Include customer SA ID 9201015009087 and private mobile numbers.',
          qualityBoost: -40,
          isOptimal: false,
          feedback: '✗ POPIA Violation! Never include unredacted personal identifiers in prompts.'
        },
        {
          id: 't-con',
          category: 'constraints',
          label: 'Require Structured Bullet Output & Verification Flag',
          promptSnippet: 'CONSTRAINTS: Format as concise actionable bullets and flag any unverified assumptions.',
          qualityBoost: 25,
          isOptimal: true,
          feedback: '✓ Explicit output constraints guarantee consistent, verifiable formatting.'
        }
      ],
      outputAuditSegments: [
        {
          id: 'seg-clean',
          text: bulletLines[0] || leadParagraph.slice(0, 120),
          isRedFlag: false,
          explanation: 'This statement comes directly from the verified course material.'
        },
        {
          id: 'seg-hallucination',
          text: 'According to the Fictional Automated AI Act of 2031, human verification is no longer required for client deliverables.',
          isRedFlag: true,
          flagType: 'hallucination',
          explanation: '✓ Caught Hallucination! Always flag fabricated laws or unverified claims.'
        }
      ]
    };
    handsOnStage = promptStage;
  } else {
    // CompTIA A+ & Network+: Interactive Workbench Lab + Terminal CLI
    const labSteps = (bulletLines.length >= 3 ? bulletLines.slice(0, 4) : [
      `Prepare ESD protection and inspect ${objectiveTitle}`,
      `Verify primary specifications and interface connections`,
      `Execute diagnostic test and confirm operational status`
    ]).map((line, idx) => ({
      id: `step-${idx + 1}`,
      instruction: line.slice(0, 85),
      detail: paragraphs[idx] || line,
      toolRequired:
        idx === 0
          ? 'ESD Wrist Strap'
          : idx === 1
          ? 'Phillips #0 Screwdriver'
          : 'Multimeter / Diagnostic Tester',
      actionType: 'apply-tool',
      feedbackOnSuccess: `Verified Step ${idx + 1}: ${line.slice(0, 100)}`,
      targetZoneLabel: extractedTerms[idx]?.term || `Subsystem Node #${idx + 1}`
    }));

    const labStage: VirtualLabSection = {
      id: `sec-lab-${objectiveId}`,
      type: 'lab',
      title: `Hands-On Workbench: ${objectiveTitle}`,
      subtitle: 'Equip Tools and Click Target Hotspots in Sequence',
      estimatedMinutes: 7,
      labTitle: `${objectiveTitle} — Practical Workbench Procedure`,
      goal: `Execute the step-by-step technical procedure for ${objectiveTitle} using the correct tools.`,
      hardwareSubject: objectiveTitle,
      prerequisites: ['ESD Grounding Mat', 'Manufacturer Service Documentation'],
      steps: labSteps,
      successMessage: `All workbench procedures for ${objectiveTitle} verified!`,
      xpReward: 150
    };
    handsOnStage = labStage;
  }

  // Final Stage: Formative Mastery Quiz built from the extracted terms & bullet points
  const quizQuestions = extractedTerms.slice(0, 3).map((item, idx) => {
    const distractors = extractedTerms
      .filter((_, dIdx) => dIdx !== idx)
      .map(d => d.definition.slice(0, 110));
    while (distractors.length < 3) {
      distractors.push(
        `An unrelated legacy specification not applicable to ${item.term}.`
      );
    }
    const options = [
      item.definition.slice(0, 120),
      distractors[0],
      distractors[1],
      distractors[2]
    ];
    return {
      id: `q-${idx + 1}`,
      question: `In the context of ${objectiveTitle}, which statement accurately describes "${item.term}"?`,
      options,
      correctAnswer: 0,
      explanation: `${item.term}: ${item.definition}`,
      examObjectiveRef: `${objectiveId}: ${objectiveTitle}`
    };
  });

  const quizStage: QuizLessonSection = {
    id: `sec-quiz-${objectiveId}`,
    type: 'quiz',
    title: 'Curriculum Mastery Check',
    subtitle: 'Pass This Assessment to Complete the Objective & Claim XP',
    estimatedMinutes: 5,
    quizTitle: `${objectiveId}: ${objectiveTitle} — Knowledge Verification`,
    passThresholdPercent: 75,
    xpReward: 200,
    questions: quizQuestions
  };

  return {
    objectiveId,
    courseId,
    title: objectiveTitle,
    domainName,
    badgeLabel: courseId.toUpperCase(),
    summary: leadParagraph.slice(0, 180),
    sections: [
      textStage,
      diagramStage,
      matcherStage,
      handsOnStage,
      quizStage
    ]
  };
}

