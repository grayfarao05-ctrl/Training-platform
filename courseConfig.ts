import type { CourseConfig, Domain, UserStats, CourseProgress, CourseGame, CourseId } from './types';
import { COMPTIA_DOMAINS } from './constants';

export const A_PLUS_GAMES: CourseGame[] = [
  {
    id: 'match-the-trio',
    title: 'Match the Trio',
    description: 'Find the 3 connected cards (e.g. Port, Protocol, Description). Beat 60s for the Mastery Badge!',
    icon: 'Layers',
    badge: 'Advanced Mode',
    badgeType: 'gold',
    xpReward: '+200 XP',
    statsKey: 'trio'
  },
  {
    id: 'subnet-speed-run',
    title: 'Subnet Speed-Run',
    description: 'Fast-fire quiz. Identify valid and invalid IP addresses and subnet masks. Hit a streak of 15!',
    icon: 'Zap',
    xpReward: '+100 XP',
    statsKey: 'speedrun'
  },
  {
    id: 'cli-challenge',
    title: 'Command Line Challenge',
    description: 'Test your CLI skills. Get a streak of 10 for the Terminal Master Badge!',
    icon: 'Terminal',
    badge: 'Expert Mode',
    badgeType: 'red',
    xpReward: 'XP per Command',
    statsKey: 'cli'
  },
  {
    id: 'motherboard-puzzle',
    title: 'Motherboard Puzzle',
    description: 'Drag and drop components to build a PC. Learn motherboard layouts hands-on!',
    icon: 'Gamepad2',
    badge: 'New Simulator',
    badgeType: 'red',
    xpReward: '+100 XP',
    statsKey: 'puzzle'
  },
  {
    id: 'path-finder',
    title: 'Path Finder',
    description: 'Troubleshoot IPv4 configurations. Fix gateways, DNS, and subnets in real-world scenarios.',
    icon: 'Network',
    badge: 'New Game',
    badgeType: 'red',
    xpReward: '+300 XP',
    statsKey: 'pathFinder'
  },
  {
    id: 'acronym-attack',
    title: 'Acronym Attack',
    description: 'Fast-paced acronym recall. Master the CompTIA A+ vocabulary under pressure!',
    icon: 'Zap',
    badge: 'Hot Game',
    badgeType: 'orange',
    xpReward: '+500 XP',
    statsKey: 'acronym'
  }
];

export const NETWORK_PLUS_GAMES: CourseGame[] = [];

export const MATRIC_TO_MONEY_GAMES: CourseGame[] = [
  {
    id: 'cv-clinic',
    title: 'CV Clinic',
    description: 'Spot planted mistakes in sample CVs before the timer runs out. Master South African hiring standards!',
    icon: 'FileCheck',
    badge: 'New Simulator',
    badgeType: 'green',
    xpReward: '+10 XP / Mistake',
    statsKey: 'cvClinic'
  },
  {
    id: 'contract-red-flags',
    title: 'Contract Red Flags',
    description: 'Spot unlawful terms, verify mandatory BCEA protections, and recommend the right legal verdict.',
    icon: 'FileWarning',
    badge: 'Module 5',
    badgeType: 'red',
    xpReward: '+10 XP / Term',
    statsKey: 'contractRedFlags'
  }
];

export const MATRIC_TO_MONEY_DOMAINS: Domain[] = [
  {
    id: 'm2m-d1',
    title: 'Professional CVs & Applications',
    name: 'Professional CVs & Applications',
    color: 'text-emerald-500',
    exam: 'Module 1',
    objectives: [],
    course: 'matric-to-money',
    objectivesCount: 0
  },
  {
    id: 'm2m-d2',
    title: 'Interview Mastery & Etiquette',
    name: 'Interview Mastery & Etiquette',
    color: 'text-teal-400',
    exam: 'Module 2',
    objectives: [],
    course: 'matric-to-money',
    objectivesCount: 0
  }
];


export const NETWORK_PLUS_DOMAINS: Domain[] = [
  {
    id: 'np-d1',
    title: 'Networking Concepts',
    name: 'Networking Concepts',
    color: 'text-blue-500',
    exam: 'Core 1',
    objectives: [],
    course: 'network-plus',
    objectivesCount: 0
  },
  {
    id: 'np-d2',
    title: 'Network Implementation',
    name: 'Network Implementation',
    color: 'text-cyan-500',
    exam: 'Core 1',
    objectives: [],
    course: 'network-plus',
    objectivesCount: 0
  },
  {
    id: 'np-d3',
    title: 'Network Operations',
    name: 'Network Operations',
    color: 'text-indigo-400',
    exam: 'Core 1',
    objectives: [],
    course: 'network-plus',
    objectivesCount: 0
  },
  {
    id: 'np-d4',
    title: 'Network Security',
    name: 'Network Security',
    color: 'text-sky-400',
    exam: 'Core 1',
    objectives: [],
    course: 'network-plus',
    objectivesCount: 0
  },
  {
    id: 'np-d5',
    title: 'Network Troubleshooting',
    name: 'Network Troubleshooting',
    color: 'text-blue-400',
    exam: 'Core 1',
    objectives: [],
    course: 'network-plus',
    objectivesCount: 0
  }
];

export const PRACTICAL_AI_GAMES: CourseGame[] = [];

export const PRACTICAL_AI_DOMAINS: Domain[] = [
  {
    id: 'ai-d1',
    title: 'Module 1: The Engine Mindset & Prompt Frameworks',
    name: 'Module 1: The Engine Mindset & Prompt Frameworks',
    color: 'text-violet-400',
    exam: 'Module 1',
    course: 'practical-ai',
    objectivesCount: 1,
    objectives: [
      {
        id: '1.1',
        title: 'Stop Talking to It Like a Person (Role-Task-Rule Framework)',
        domain: 'ai-d1',
        exam: 'Module 1',
        course: 'practical-ai',
        description: 'Why chat prompts fail and how to turn AI into a reliable workplace assistant using the Role-Task-Rule framework.',
        content: `### Why the chat box tricks you
When you open ChatGPT or Gemini, it looks just like WhatsApp. That design makes most people type things like:
> *"Can you write me a CV?"* or *"How do I start a business?"*

The AI replies with two pages of fancy English that sounds clever but says very little. If you send that CV to an employer on Careers24 or Pnet, they immediately spot that it was generated by a bot. The problem is not the AI. The problem is that you treated it like an oracle instead of an assistant who knows nothing about your situation.

An AI model is a **prediction engine**. If you feed it vague words, it averages out the entire internet and gives you back a bland, generic answer. If you give it precise parameters, it produces work you can use in the real world immediately.

---

### The Role-Task-Rule Framework
To get practical output, stop chatting. Start briefing the tool the way a manager briefs an intern. Every prompt you use for work must have three components:

1. **Role**: Who the AI is pretending to be. This anchors its vocabulary, expertise, and tone.
2. **Task**: The exact action it must complete, including who the deliverable is for.
3. **Rules**: The strict boundaries it cannot cross. This is where you limit length, forbid buzzwords, and lock down the output format.

#### Comparison: Chat Prompt vs. System Prompt

| ❌ Weak Chat Prompt (Unusable) | ✔ Role-Task-Rule System Prompt (Ready for Work) |
| :--- | :--- |
| *"Write a cover letter for an IT technician job."*<br><br>**Result:** Produces fluffy filler (*"esteemed hiring team"*, *"dynamic synergy"*) that gets rejected immediately. | **Role:** You are a career coach helping an entry-level technician in Johannesburg.<br>**Task:** Write a short, three-paragraph email applying for a junior desktop support role advertised on Pnet.<br>**Rules:** Use plain, professional English. Mention that I hold an A+ certificate and have hands-on experience replacing laptop screens and running CAT6 network cabling. Do not use words like *"passionate"*, *"delighted"*, or *"synergy"*. Keep the whole email under 150 words. |

---

### Working with Constraints
The secret to reliable output is giving the AI strict boundaries:
- **Tell it what NOT to do**: Forbid generic adjectives, corporate buzzwords, and preamble text.
- **Lock down the format**: Before it generates, instruct the exact structure. If you need a price comparison for backup power equipment between Takealot and a local supplier, do not ask for a summary. Instruct it to output a 3-column table:
  - *Item Name*
  - *Price in Rands (R)*
  - *Battery Capacity (Ah / Wh)*

If you give the engine clear tracks, it cannot derail.

---

### Practical Task: The Job Matcher
1. **Find a Job:** Open Pnet, Careers24, or Indeed and locate one real entry-level job posting in your field.
2. **Extract Spec:** Copy the requirements and qualifications section from the advertisement.
3. **Open AI Tool:** Open your preferred free AI tool (ChatGPT, Claude, or Google Gemini).
4. **Execute System Prompt:**
\`\`\`text
Role: You are an experienced hiring manager in South Africa.
Task: Compare the pasted job spec against my current skills and list 3 strengths and 2 gaps I need to work on.
Rules: Output the result as a simple table with two columns: 'Where I Match' and 'What I Need to Learn'. Do not write an introductory paragraph.
\`\`\`
5. **Review Gaps:** Paste the job spec and your current experience under your prompt. Review the output table and see if the gaps match what you need to study next.

---

### Reference & Legal Safety (POPIA)
- **Protection of Personal Information Act 4 of 2013 (South African Government Gazette)**
- **Bowmans Law:** POPIA Compliance & Workplace AI Implementation Guidelines
- **DAIR.AI:** Prompt Engineering Guide & Structured Patterns

> ⚠️ **Important Verification Note:** Free-tier AI tools occasionally update their default settings regarding whether prompts are stored for model training. Students must be instructed to disable *"Chat History & Training"* in account settings to protect personal and employer data under POPIA.`,
        questions: [
          {
            id: 'q-ai-1.1-1',
            objectiveId: '1.1',
            course: 'practical-ai',
            question: 'Why does typing a short, general question into an AI chatbot usually produce a useless, generic answer?',
            options: [
              'Because free AI models do not have access to modern information',
              'Because AI is a prediction engine that averages the entire internet when given vague prompts without constraints',
              'Because chatbots are deliberately programmed to withhold specific answers until paid',
              'Because internet connection speed in South Africa limits model accuracy'
            ],
            correctAnswer: 1,
            explanation: 'AI models predict tokens based on context. Without specific parameters, constraints, and context, the engine averages the web, producing bland, generic fluff.'
          },
          {
            id: 'q-ai-1.1-2',
            objectiveId: '1.1',
            course: 'practical-ai',
            question: 'What are the three essential components of the Role-Task-Rule framework?',
            options: [
              'Reader, Topic, Resolution',
              'Role (identity/tone), Task (exact deliverable), Rules (strict boundaries & format)',
              'Requirement, Timeline, Review',
              'Router, Terminal, Route'
            ],
            correctAnswer: 1,
            explanation: 'Role anchors expertise and tone, Task specifies the action and audience, and Rules lock down length, forbid buzzwords, and control format.'
          },
          {
            id: 'q-ai-1.1-3',
            objectiveId: '1.1',
            course: 'practical-ai',
            question: 'Which prompt component prevents the AI from using fluffy buzzwords like "dynamic", "esteemed", or "passionate"?',
            options: [
              'Role',
              'Task',
              'Rules',
              'Temperature'
            ],
            correctAnswer: 2,
            explanation: 'The Rules component sets negative constraints (what not to do) and boundaries on vocabulary and tone.'
          },
          {
            id: 'q-ai-1.1-4',
            objectiveId: '1.1',
            course: 'practical-ai',
            question: 'Under South African law (POPIA), what critical precaution must you take before entering work data into a public AI tool?',
            options: [
              'Pay a licensing fee to SARS',
              'Never upload confidential client details, SA ID numbers, or banking details, and disable chat training in settings',
              'Translate all text into Afrikaans or isiZulu first',
              'Only use the tool during Eskom off-peak hours'
            ],
            correctAnswer: 1,
            explanation: 'POPIA strictly regulates processing of personal information. You must never paste private identifiers (ID numbers, bank details) into public cloud tools and should disable training on chat history.'
          }
        ]
      }
    ]
  },
  {
    id: 'ai-d2',
    title: 'Module 2: Working with Your Own Documents & Specs',
    name: 'Module 2: Working with Your Own Documents & Specs',
    color: 'text-purple-400',
    exam: 'Module 2',
    course: 'practical-ai',
    objectivesCount: 1,
    objectives: [
      {
        id: '2.1',
        title: 'Feeding AI Job Specs, Pricelists & Notes Without Burning Data',
        domain: 'ai-d2',
        exam: 'Module 2',
        course: 'practical-ai',
        description: 'How to feed Makro/Takealot supplier pricelists, Pnet job specs, or PDF notes into AI without running out of mobile data or confusing the context window.',
        content: `### Mobile data reality in South Africa
In South Africa, mobile data is costly, and connections during load shedding can be unstable. Many learners make the mistake of uploading whole 50-page PDF catalogs or multi-megabyte manual files into chatbots.
This burns your mobile data bundle, slows down generation, and frequently causes the AI to miss key details because the relevant facts get lost in the noise.

---

### The Targeted Copy Method
Do not feed the AI a whole textbook or entire website when you only need one section.
- **Copy only the relevant slice:** For a job advertisement, copy only the *Requirements* and *Responsibilities*. Leave out the company marketing fluff.
- **Convert tables to text:** If you are copying from a supplier spreadsheet (e.g. Scoop, Miro, or Makro), copy just the 10 rows you care about as tab-separated plain text.
- **Strip images:** PDFs with high-resolution photos burn upload bandwidth without giving text models any extra understanding.

---

### The Context Sandwich Prompt Pattern
When feeding your own text into AI, always place your data inside clear boundary markers so the engine does not confuse your document with your instructions:

\`\`\`text
Role: You are a purchasing assistant for an IT support company in Durban.
Task: Review the supplier price list below and extract all Wi-Fi access points and routers priced under R1,500.
Rules: Output as a 3-column table: [Brand/Model, Price in Rands (R), Primary Feature]. Sort from lowest to highest price.

--- BEGIN SUPPLIER DATA ---
[Paste your 10 to 15 lines of raw product text here]
--- END SUPPLIER DATA ---
\`\`\`

---

### Practical Task: The Supplier Price Filter
1. **Find Sample Prices:** Look up 3 networking items on Takealot or Scoop (e.g. Cat6 cable 100m, 8-port Gigabit switch, Wi-Fi 6 router).
2. **Copy Details:** Copy the product title and Rand price into a text scratchpad.
3. **Execute Sandwich Prompt:** Feed the items into ChatGPT, Gemini, or Claude using the Context Sandwich format above.
4. **Verify Result:** Check that the AI correctly filtered and sorted the items without inventing prices.`,
        questions: [
          {
            id: 'q-ai-2.1-1',
            objectiveId: '2.1',
            course: 'practical-ai',
            question: 'Why is uploading entire 50-page PDF catalogs into free AI tools bad practice for South African learners on mobile?',
            options: [
              'Because PDFs cannot be read by modern AI systems',
              'Because large files burn costly mobile data and dilute the context window, causing the AI to miss critical facts',
              'Because South African ISPs block PDF uploads to international servers',
              'Because PDF text is automatically converted to US Dollars'
            ],
            correctAnswer: 1,
            explanation: 'Uploading huge documents wastes mobile bandwidth and overflows the effective attention window of the model, leading to hallucinated or missed details.'
          },
          {
            id: 'q-ai-2.1-2',
            objectiveId: '2.1',
            course: 'practical-ai',
            question: 'What is the purpose of using boundary markers like "--- BEGIN DATA ---" in prompt design?',
            options: [
              'It encrypts the text so hackers cannot read it',
              'It separates your operational instructions from the raw document content, preventing the AI from confusing the two',
              'It forces the AI to output in uppercase letters',
              'It reduces mobile data usage by 50%'
            ],
            correctAnswer: 1,
            explanation: 'Boundary delimiters clearly isolate source material from instructions, preventing the model from confusing text inside the document with prompting rules.'
          },
          {
            id: 'q-ai-2.1-3',
            objectiveId: '2.1',
            course: 'practical-ai',
            question: 'When analyzing a job advertisement from Pnet or Careers24, which section should you copy into your AI prompt for matching?',
            options: [
              'The entire webpage including user comments and footer links',
              'Only the requirements, qualifications, and core duties section',
              'Only the company logo and address',
              'The terms and conditions of the job portal'
            ],
            correctAnswer: 1,
            explanation: 'The Targeted Copy method advises extracting only the core requirements and duties to maximize model precision and minimize data usage.'
          }
        ]
      }
    ]
  },
  {
    id: 'ai-d3',
    title: 'Module 3: Structured Outputs, Tables & WhatsApp Templates',
    name: 'Module 3: Structured Outputs, Tables & WhatsApp Templates',
    color: 'text-fuchsia-400',
    exam: 'Module 3',
    course: 'practical-ai',
    objectivesCount: 1,
    objectives: [
      {
        id: '3.1',
        title: 'Structured Outputs: Tables, CSV Data & WhatsApp Customer Templates',
        domain: 'ai-d3',
        exam: 'Module 3',
        course: 'practical-ai',
        description: 'Force AI to produce structured markdown tables, Excel-ready CSV, and ready-to-send WhatsApp business templates instead of long essays.',
        content: `### Why conversational paragraphs fail in business
Clients, managers, and customers in South Africa do not have time to read 4 long paragraphs of text.
- If a customer messages you on **WhatsApp** asking for a repair price, they want a clean breakdown with Rand amounts and a collection date.
- If your manager asks for a weekly summary, they want a table they can paste directly into **Microsoft Excel** or Google Sheets.

When you ask AI to *"give me a quote"* without constraints, it produces an essay with filler text like *"Dear valued customer, it gives us immense pleasure..."*. You must force it to produce structured deliverables.

---

### Forcing Markdown Tables and CSV
To paste straight into spreadsheets, instruct the exact column names:

\`\`\`text
Rule: Output ONLY a Markdown table with the following headers:
| Item # | Description | Quantity | Unit Price (ZAR) | Total (ZAR) |
Do not write any introductory or concluding remarks.
\`\`\`

If you need a CSV file to import into an accounting app or inventory system, tell it:
\`\`\`text
Rule: Output raw CSV format with comma delimiters. No code fences, no markdown formatting.
\`\`\`

---

### WhatsApp Business Template Formatting
WhatsApp supports specific text formatting that makes business messages look sharp:
- \`*bold text*\` using asterisks
- \`_italic text_\` using underscores
- \`~strikethrough~\` using tildes

#### Production Prompt Template:
\`\`\`text
Role: You are a professional tech technician in Johannesburg.
Task: Write a WhatsApp customer update for a completed laptop screen replacement.
Rules:
1. Use WhatsApp bold syntax (*text*) for headings, dates, and amounts.
2. State the total owed in Rands: R1,250.
3. Mention that payment can be made via EFT or cash on collection.
4. Keep the entire message under 50 words.
\`\`\`

#### Resulting WhatsApp Message:
> Hi *Sarah*, your HP laptop screen replacement is *complete and tested*.
> 
> *Total Due:* R1,250
> *Payment:* Cash or EFT on collection
> *Hours:* Mon–Fri, 08:30–17:00
> 
> Please let us know when you would like to collect!

---

### Practical Task: The WhatsApp Quote Generator
1. Open your AI tool (Claude, ChatGPT, or Gemini).
2. Ask it to generate a WhatsApp quote for installing a 1kVA UPS with 2 batteries for a home office in Pretoria.
3. Enforce the rules: Bold tags, line breaks, itemized Rand breakdown, 40-word limit.
4. Verify the output is clean enough to send directly to a client with zero manual editing.`,
        questions: [
          {
            id: 'q-ai-3.1-1',
            objectiveId: '3.1',
            course: 'practical-ai',
            question: 'How do you format bold text in a WhatsApp message created by an AI prompt?',
            options: [
              'Wrap the text in HTML tags like <b>text</b>',
              'Wrap the text in asterisks like *text*',
              'Write the entire word in capital letters',
              'Use the markdown syntax [bold]text[/bold]'
            ],
            correctAnswer: 1,
            explanation: 'WhatsApp uses asterisks (*text*) to render bold typography on mobile devices.'
          },
          {
            id: 'q-ai-3.1-2',
            objectiveId: '3.1',
            course: 'practical-ai',
            question: 'If you want data from an AI prompt that can be pasted directly into Excel with separate columns, which output format should you specify?',
            options: [
              'A standard English narrative essay',
              'A Markdown table or comma-separated values (CSV) format',
              'A numbered bullet list with long sentences',
              'A JSON schema with nested arrays'
            ],
            correctAnswer: 1,
            explanation: 'Markdown tables or CSV format paste cleanly into spreadsheet software like Microsoft Excel or Google Sheets with each field in its proper column.'
          },
          {
            id: 'q-ai-3.1-3',
            objectiveId: '3.1',
            course: 'practical-ai',
            question: 'What is the primary benefit of adding the negative constraint "Do not write any introductory or concluding remarks"?',
            options: [
              'It lowers your internet connection latency',
              'It eliminates conversational chatter so the output can be immediately copied into business systems without editing',
              'It translates the prompt into South African English',
              'It increases the model temperature parameter'
            ],
            correctAnswer: 1,
            explanation: 'Negative formatting constraints prevent the model from generating unnecessary greetings and conversational filler, producing clean, copy-paste ready data.'
          }
        ]
      }
    ]
  },
  {
    id: 'ai-d4',
    title: 'Module 4: Multi-Step Workflows & Client Automation',
    name: 'Module 4: Multi-Step Workflows & Client Automation',
    color: 'text-indigo-400',
    exam: 'Module 4',
    course: 'practical-ai',
    objectivesCount: 1,
    objectives: [
      {
        id: '4.1',
        title: 'Turning Messy Voice Notes into Quotes & Invoices',
        domain: 'ai-d4',
        exam: 'Module 4',
        course: 'practical-ai',
        description: 'Chain multiple tasks together to transform chaotic audio transcriptions or field notes into professional quotes, invoices, and follow-up emails.',
        content: `### Single-shot vs. Multi-step chaining
When field technicians, electricians, or freelancers finish a job, they are usually on the road. They often record a messy 30-second WhatsApp voice note to themselves:
> *"Hey, finished at the client in Midrand. Ran 45 meters of Cat6, replaced two RJ45 jacks, took 2.5 hours. Client agreed on R450 per hour labour plus R350 for the cable. Remind me to invoice them on Monday."*

If you ask AI in one messy prompt to *"Turn this into an invoice, calculate VAT, write an email, and make a WhatsApp message"*, the model often hallucinates numbers, misses the math, or produces an inconsistent mess.

The professional solution is **Multi-Step Chaining**:
1. **Step 1: Extract & Normalize Data** (Turn speech into a clean JSON or bullet inventory).
2. **Step 2: Calculate & Structure** (Compute line items, apply 15% South African VAT, verify totals).
3. **Step 3: Format Deliverables** (Produce the final PDF invoice layout and client email).

---

### Step 1: The Extraction Prompt
\`\`\`text
Role: You are an administrative assistant.
Task: Extract line items, quantities, and hourly rates from this technician note.
Rules: Output as a simple list: Item, Quantity, Unit Price in Rands. Do not calculate totals yet.
\`\`\`

---

### Step 2: The Math & Verification Prompt
Always instruct the AI to show its working steps to prevent calculation errors:
\`\`\`text
Task: Calculate the line item subtotals, sum them, add 15% South African VAT, and provide the grand total in ZAR.
\`\`\`

---

### Step 3: The Client Deliverable
\`\`\`text
Task: Take the verified totals and generate:
1. An invoice table ready to paste into Word or Excel.
2. A polite, 3-sentence email to the accounts department attaching the quote.
\`\`\`

---

### Practical Task: The Field Tech Workflow
1. Write down an imaginary messy 3-sentence note for a service call (e.g. replacing a router in Centurion).
2. Execute Step 1 (Extraction) in your AI tool.
3. In the same chat, execute Step 2 (Calculate VAT and total in Rands).
4. Inspect the output to verify the math is 100% accurate before sending to a client.`,
        questions: [
          {
            id: 'q-ai-4.1-1',
            objectiveId: '4.1',
            course: 'practical-ai',
            question: 'Why is it better to split a complex invoicing task into multiple prompt steps instead of asking for everything at once?',
            options: [
              'Because AI tools charge per word generated',
              'Because chaining steps allows you to verify extraction and arithmetic independently before generating final client documents',
              'Because multi-step prompts work without an internet connection',
              'Because single prompts cannot output text longer than 20 words'
            ],
            correctAnswer: 1,
            explanation: 'Multi-step chaining breaks reasoning down into manageable stages (extract -> calculate -> format), dramatically reducing math errors and hallucinated line items.'
          },
          {
            id: 'q-ai-4.1-2',
            objectiveId: '4.1',
            course: 'practical-ai',
            question: 'What is the current standard VAT rate in South Africa to instruct your AI model when generating business invoices?',
            options: [
              '10%',
              '14%',
              '15%',
              '18%'
            ],
            correctAnswer: 2,
            explanation: 'The South African Value-Added Tax (VAT) standard rate has been 15% since 1 April 2018.'
          },
          {
            id: 'q-ai-4.1-3',
            objectiveId: '4.1',
            course: 'practical-ai',
            question: 'What prompt instruction helps verify that an AI model did not make an arithmetic error in a financial quote?',
            options: [
              'Instruct it to show its calculation steps line by line before writing the final total',
              'Tell it to speak in French',
              'Use the highest creative temperature setting',
              'Ask it to repeat the prompt three times'
            ],
            correctAnswer: 0,
            explanation: 'Requiring the model to output intermediate calculation steps (Chain-of-Thought) forces deterministic token sequencing and prevents arithmetic mistakes.'
          }
        ]
      }
    ]
  },
  {
    id: 'ai-d5',
    title: 'Module 5: POPIA Compliance & Safety in South Africa',
    name: 'Module 5: POPIA Compliance & Safety in South Africa',
    color: 'text-rose-400',
    exam: 'Module 5',
    course: 'practical-ai',
    objectivesCount: 1,
    objectives: [
      {
        id: '5.1',
        title: 'POPIA Compliance: What You Can Never Upload to Cloud AI',
        domain: 'ai-d5',
        exam: 'Module 5',
        course: 'practical-ai',
        description: 'Understand South Africa\'s Protection of Personal Information Act (POPIA Act 4 of 2013), red-line data items, and safe workplace AI practices.',
        content: `### POPIA in the South African Workplace
The **Protection of Personal Information Act 4 of 2013 (POPIA)** sets strict legal obligations on businesses and employees regarding how personal data is collected, stored, and processed.
If you work at an IT company, call center, school, or retail store, pasting customer or employee data into a public AI tool can be considered an **unauthorized data breach** under POPIA.

---

### The Red Line: What You Must NEVER Upload
Never type or paste any of the following into public AI prompts:
1. **13-digit South African ID Numbers**: These contain dates of birth and citizenship codes that can be used for identity theft.
2. **Banking Details**: Account numbers, branch codes, credit card digits, or proof of payment PDFs.
3. **Residential & Physical Addresses**: Home addresses linked to customer names.
4. **Client Telephone Numbers & Personal Email Addresses**: Direct contact information.
5. **Medical, Criminal, or Biometric Records**: Special personal information under POPIA subject to severe penalties.

---

### Data Masking & Safe Anonymization
You can still use AI to draft emails, analyze customer complaint patterns, and generate reports—you just need to **mask the data first**:

| ❌ Dangerous (POPIA Breach) | ✔ Safe (Anonymized) |
| :--- | :--- |
| *"Draft a collection letter for Sipho Khumalo, ID 8504125089087, living at 14 5th Avenue, Randburg, owing R4,500 on account 1049284."* | *"Role: Accounts administrator.<br>Task: Draft a formal, polite overdue payment reminder.<br>Variables:<br>- Client Name: [CLIENT_NAME]<br>- Amount Owed: R4,500<br>- Due Date: 7 days from notice.<br>Rules: Use South African legal business tone."* |

Notice how the safe version keeps the structure and numbers, but leaves the customer's actual identity as a placeholder that you fill in on your local computer after generating!

---

### Account Privacy Checklist
Before using AI tools at work or school, follow these three privacy rules:
1. **Turn off Model Training:** In ChatGPT (Settings > Data Controls > disable *Improve model for everyone*). In Claude and Gemini, verify workspace privacy controls.
2. **Clear Chat History:** Regularly delete conversations containing business logic.
3. **Check Company Policy:** Always confirm with your employer or IT administrator before using third-party AI for work deliverables.

---

### Practical Task: The POPIA Scrubbing Exercise
1. Take a sample job card with fake personal details (name, phone number, address, problem description).
2. Practice identifying and replacing every personal identifier with bracketed tags: \`[NAME]\`, \`[PHONE]\`, \`[LOCATION]\`.
3. Feed the scrubbed text into an AI model for troubleshooting recommendations.
4. Verify that the answer gives you the technical solution without any sensitive data ever touching cloud servers.`,
        questions: [
          {
            id: 'q-ai-5.1-1',
            objectiveId: '5.1',
            course: 'practical-ai',
            question: 'Which South African statute regulates how personal information and customer data must be protected in the workplace?',
            options: [
              'The Basic Conditions of Employment Act (BCEA)',
              'The Protection of Personal Information Act (POPIA Act 4 of 2013)',
              'The Broad-Based Black Economic Empowerment Act (B-BBEE)',
              'The National Road Traffic Act'
            ],
            correctAnswer: 1,
            explanation: 'POPIA (Act 4 of 2013) is South Africa\'s primary data privacy law governing the lawful processing and safeguarding of personal information.'
          },
          {
            id: 'q-ai-5.1-2',
            objectiveId: '5.1',
            course: 'practical-ai',
            question: 'What is the safe method for drafting a customer letter using AI without violating POPIA?',
            options: [
              'Paste the customer\'s full ID number and residential address into the prompt',
              'Use data masking (placeholders like [CLIENT_NAME]) and fill in the real private details locally on your machine after generating',
              'Type the prompt in whispering font',
              'Ask the AI to promise not to tell anyone'
            ],
            correctAnswer: 1,
            explanation: 'Data masking replaces confidential identifiers with generic tokens, allowing the AI to generate the template without receiving private personal data.'
          },
          {
            id: 'q-ai-5.1-3',
            objectiveId: '5.1',
            course: 'practical-ai',
            question: 'Which account setting should every employee and student disable in public AI tools to help protect workplace confidentiality?',
            options: [
              'Dark Mode',
              'Model Training / Chat History Training on personal data',
              'Sound effects',
              'High-contrast mode'
            ],
            correctAnswer: 1,
            explanation: 'Disabling model training prevents public AI providers from using your prompt text to train future public versions of their foundation models.'
          }
        ]
      }
    ]
  }
];

export const COURSES = {
  'practical-ai': {
    id: 'practical-ai' as const,
    name: 'Beyond the Chatbot: Practical AI for Work & Business',
    shortLabel: 'Practical AI',
    badgeLabel: 'Workplace AI',
    accentColor: 'violet-600',
    accentHex: '#7c3aed',
    bgGlow: 'rgba(124, 58, 237, 0.3)',
    textColor: 'text-violet-500',
    description: 'A hands-on, action-first guide for matriculants, job seekers, and entrepreneurs in South Africa to master practical AI for workplace productivity, structured outputs, and POPIA safety.',
    tagline: 'Beyond the Chatbot: Practical AI for Work & Business',
    domains: PRACTICAL_AI_DOMAINS,
    games: PRACTICAL_AI_GAMES
  },

  'a-plus': {
    id: 'a-plus' as const,
    name: 'CompTIA A+',
    shortLabel: 'A+',
    badgeLabel: '220-1101 & 1102',
    accentColor: 'red-600',
    accentHex: '#dc2626',
    bgGlow: 'rgba(220,38,38,0.3)',
    textColor: 'text-red-600',
    description: 'Hardware, operating systems, cloud computing, virtualization, and operational procedures.',
    tagline: 'Hardware, Cloud & Mobile Mastery',
    domains: COMPTIA_DOMAINS,
    games: A_PLUS_GAMES
  },
  'network-plus': {
    id: 'network-plus' as const,
    name: 'CompTIA Network+',
    shortLabel: 'N+',
    badgeLabel: 'N10-008',
    accentColor: 'blue-600',
    accentHex: '#2563eb',
    bgGlow: 'rgba(37,99,235,0.3)',
    textColor: 'text-blue-500',
    description: 'Networking concepts, infrastructure, network operations, security, and network troubleshooting.',
    tagline: 'Networking Concepts, Infrastructure & Security Mastery',
    domains: NETWORK_PLUS_DOMAINS,
    games: NETWORK_PLUS_GAMES
  },
  'matric-to-money': {
    id: 'matric-to-money' as const,
    name: 'Matric to Money',
    shortLabel: 'Matric to Money',
    badgeLabel: 'Free Course',
    accentColor: 'emerald-600',
    accentHex: '#10b981',
    bgGlow: 'rgba(16,185,129,0.3)',
    textColor: 'text-emerald-500',
    description: 'Free career acceleration and workplace skills course for matriculants and job seekers.',
    tagline: 'CV, Interview & Workplace Readiness',
    domains: MATRIC_TO_MONEY_DOMAINS,
    games: MATRIC_TO_MONEY_GAMES
  }
};

export type { CourseId } from './types';

export const COURSE_LIST: CourseConfig[] = Object.values(COURSES);

let dynamicCoursesCache: Record<string, CourseConfig> = {};

/**
 * Updates the global in-memory course configuration cache with live Firestore course documents.
 */
export function updateCourseConfigsCache(configs: CourseConfig[] | Record<string, CourseConfig>) {
  if (Array.isArray(configs)) {
    const map: Record<string, CourseConfig> = {};
    configs.forEach(c => {
      map[c.id] = c;
    });
    dynamicCoursesCache = { ...dynamicCoursesCache, ...map };
  } else {
    dynamicCoursesCache = { ...dynamicCoursesCache, ...configs };
  }
}

/**
 * Resolves a domain's display title by checking ID first, then name/title as fallback.
 */
export function resolveDomainTitle(
  domainValue: string | undefined | null, 
  domains: Array<{ id: string; name?: string; title?: string }> = []
): string {
  if (!domainValue) return 'General';
  const found = domains.find(d => 
    d.id === domainValue || 
    (d.title && d.title.toLowerCase() === domainValue.toLowerCase()) || 
    (d.name && d.name.toLowerCase() === domainValue.toLowerCase())
  );
  return found?.title || found?.name || domainValue;
}

/**
 * Resolves a domain's stable ID by checking ID first, then name/title as fallback.
 */
export function resolveDomainId(
  domainValue: string | undefined | null, 
  domains: Array<{ id: string; name?: string; title?: string }> = []
): string {
  if (!domainValue) return '';
  const found = domains.find(d => 
    d.id === domainValue || 
    (d.title && d.title.toLowerCase() === domainValue.toLowerCase()) || 
    (d.name && d.name.toLowerCase() === domainValue.toLowerCase())
  );
  return found?.id || domainValue;
}

export const getCourseConfig = (courseId: CourseId = 'a-plus'): CourseConfig => {
  if (dynamicCoursesCache[courseId]) {
    return dynamicCoursesCache[courseId];
  }
  const found = (COURSES as Record<string, CourseConfig>)[courseId];
  if (found) return found;
  return {
    id: courseId,
    name: courseId,
    shortLabel: courseId.toUpperCase().slice(0, 4),
    badgeLabel: courseId.toUpperCase().slice(0, 4),
    accentColor: 'indigo-600',
    accentHex: '#6366f1',
    bgGlow: 'rgba(99, 102, 241, 0.3)',
    textColor: 'text-indigo-400',
    description: '',
    tagline: '',
    domains: [],
    games: []
  };
};

export const getCourseProgress = (
  stats: UserStats | null | undefined, 
  course: CourseId = 'a-plus'
): CourseProgress => {
  if (!stats) {
    return { examReadiness: 0, completedObjectives: [] };
  }

  if (course === 'a-plus') {
    return {
      examReadiness: stats.examReadiness ?? 0,
      completedObjectives: stats.completedObjectives ?? []
    };
  }

  const courseProg = stats.courseProgress?.[course];
  return {
    examReadiness: courseProg?.examReadiness ?? 0,
    completedObjectives: courseProg?.completedObjectives ?? []
  };
};

export const isCourseUnlocked = (
  stats: UserStats | null | undefined,
  course: CourseId,
  requiresCode?: boolean
): boolean => {
  if (course === 'a-plus') return true;
  if (requiresCode === false) return true;
  if (!stats) return false;
  if (stats.role === 'admin' || (stats as any).isAdmin) return true;
  const unlocked = stats.unlockedCourses ?? ['a-plus'];
  return unlocked.includes(course);
};

/**
 * Filter items by course. Treats missing/undefined course field as 'a-plus'.
 */
export function filterByCourse<T extends { course?: CourseId | string | null }>(
  items: T[], 
  course: CourseId = 'a-plus'
): T[] {
  if (!items || !Array.isArray(items)) return [];
  return items.filter(item => {
    const itemCourse = item?.course ? (item.course as CourseId) : 'a-plus';
    return itemCourse === course;
  });
}

/**
 * Adds the course field to data being written to Firestore or Storage metadata.
 */
export function withCourse<T extends Record<string, any>>(
  data: T, 
  course: CourseId = 'a-plus'
): T & { course: CourseId } {
  return {
    ...data,
    course
  };
}
