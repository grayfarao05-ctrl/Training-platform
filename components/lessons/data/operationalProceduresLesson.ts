import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_OPERATIONAL_PROCEDURES_LESSON: LessonData = {
  objectiveId: 'c2d4',
  courseId: 'a-plus',
  title: 'Operational Procedures, Change Management & Forensics',
  domainName: 'Core 2 Domain 4.0: Operational Procedures',
  badgeLabel: 'Core 2 (220-1102)',
  summary: 'Master enterprise Change Management (RFC, CAB, rollback plan), digital forensics chain-of-custody, ESD workspace safety, Safety Data Sheets (SDS), and professional client communication.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'op-text-1',
      type: 'text',
      title: 'Technical Briefing: IT Governance & Best Practices',
      subtitle: 'Change Control, Forensic Evidence Preservation, & ESD Safety',
      estimatedMinutes: 6,
      content: {
        lead: 'Technical expertise must be supported by structured operational governance, environmental safety compliance, and disciplined change control. In enterprise IT, unapproved changes or mishandled forensic evidence can lead to catastrophic business downtime or ruined legal proceedings.',
        sections: [
          {
            heading: 'Enterprise Change Management Lifecycle',
            body: [
              'Change Management prevents unintended outages by subjecting all infrastructure modifications to formal review and approval.',
              'The standard change process requires: 1. Request for Change (RFC) submission detailing scope and business justification; 2. Risk and Impact Analysis; 3. Creation of a documented Rollback / Backout Plan; 4. Review and approval by the Change Advisory Board (CAB); 5. Maintenance window execution; 6. Post-Implementation Testing and documentation.'
            ],
            bulletPoints: [
              'Rollback Plan: Mandatory step-by-step instructions to return the system to its pre-change operational state if the deployment fails.',
              'CAB (Change Advisory Board): Cross-functional committee that evaluates risk, scheduling conflicts, and business impact before authorizing changes.',
              'Maintenance Window: Scheduled off-peak hours (e.g. Sunday 2:00 AM) reserved for executing approved changes with minimal business disruption.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Digital Forensics & Chain of Custody',
              content: 'If illegal activity or corporate espionage is discovered on a machine: 1. First Response: Stop touching the keyboard, preserve volatile state (do not shut down unless instructed), isolate from the network; 2. Chain of Custody: Track chronological documentation showing who collected, handled, transferred, analyzed, and secured the evidence.'
            }
          },
          {
            heading: 'Environmental Safety & Regulated Disposal',
            body: [
              'Safety Data Sheets (SDS - formerly MSDS) provide crucial handling, chemical toxicity, flammability, and first-aid instructions for substances like battery electrolyte, compressed air refrigerants, and printer toner.',
              'Regulated Disposal: Alkaline batteries can often be disposed of in standard trash, but Lithium-Ion batteries, lead-acid UPS batteries, and laser printer toner cartridges MUST be recycled through specialized certified hazardous e-waste facilities.'
            ]
          }
        ],
        technicalTerms: [
          { term: 'CAB', definition: 'Change Advisory Board; committee responsible for reviewing and approving high-risk changes.' },
          { term: 'Chain of Custody', definition: 'Chronological legal documentation recording the seizure, custody, transfer, and analysis of physical or digital evidence.' },
          { term: 'SDS', definition: 'Safety Data Sheet; standardized document detailing chemical properties, hazards, and emergency response procedures.' },
          { term: 'Degaussing', definition: 'Using a high-powered magnetic coil to scramble magnetic domains on hard drive platters, permanently destroying data.' }
        ],
        keyTakeaways: [
          'Every enterprise change MUST have a documented rollback plan and CAB approval.',
          'Chain of custody documentation must be unbroken for forensic evidence to be admissible in court.',
          'Never use a standard vacuum on laser printer toner; use an ESD-safe toner vacuum with HEPA filtration.',
          'Degaussing renders mechanical hard drives completely unreadable and un-reusable.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'op-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Change Advisory Board Workflow',
      subtitle: 'RFC Submission, Risk Assessment, CAB Approval, & Rollback',
      estimatedMinutes: 8,
      diagramId: 'operational-procedures',
      diagramTitle: 'ITIL Change Management & Approval Lifecycle',
      description: 'Explore the 6 stages of enterprise change management from initial request through Change Advisory Board approval and post-implementation review.',
      hotspots: [
        {
          id: 'step-rfc',
          x: 15,
          y: 35,
          name: '1. Request for Change (RFC) Submission',
          category: 'Initiation Stage',
          shortDescription: 'Technician documents proposed upgrade, business justification, and affected assets.',
          fullSpecs: 'Includes target server hostnames, configuration changes, software versions, and requested execution timeframe.',
          troubleshootingNote: 'Symptom: Unapproved "cowboy" changes executed without an RFC are the leading cause of enterprise network outages.',
          examRelevance: 'CompTIA requires all non-emergency modifications to begin with a formal RFC submission.'
        },
        {
          id: 'step-risk',
          x: 35,
          y: 35,
          name: '2. Risk & Impact Analysis',
          category: 'Evaluation Stage',
          shortDescription: 'Technical teams evaluate dependency risks, user downtime, and potential revenue loss.',
          fullSpecs: 'Classifies change severity: Standard (pre-approved low risk), Normal (requires CAB review), Emergency (fast-tracked).',
          troubleshootingNote: 'Symptom: Failure to identify shared database dependencies leads to cascade failure of secondary apps.',
          examRelevance: 'Risk analysis determines if the change requires executive signoff or special maintenance windows.'
        },
        {
          id: 'step-cab',
          x: 60,
          y: 35,
          name: '3. Change Advisory Board (CAB) Review',
          category: 'Governance & Authorization',
          shortDescription: 'Cross-functional committee of IT managers, security leads, and business stakeholders.',
          fullSpecs: 'Votes to Approve, Reject, or Request More Information based on risk vs business value.',
          troubleshootingNote: 'Symptom: Scheduling conflicts (e.g. attempting payroll server patching during active payroll processing).',
          examRelevance: 'Understand the role of the CAB in preventing conflicting simultaneous changes.'
        },
        {
          id: 'step-rollback',
          x: 85,
          y: 35,
          name: '4. Rollback & Backout Plan Verification',
          category: 'Contingency Planning',
          shortDescription: 'Explicit instructions to revert systems to original working state if unforeseen errors occur.',
          fullSpecs: 'Defines rollback threshold (e.g. "if deployment takes over 90 minutes, initiate rollback immediately").',
          troubleshootingNote: 'Symptom: Deployment fails at 3:00 AM with no rollback plan, causing company-wide morning outage.',
          examRelevance: 'A change request will be automatically rejected by the CAB if it lacks a verified rollback plan.'
        },
        {
          id: 'step-review',
          x: 50,
          y: 75,
          name: '5. Post-Implementation Review (PIR)',
          category: 'Closure & Documentation',
          shortDescription: 'Verification that change met objectives and updating asset documentation.',
          fullSpecs: 'Confirms monitoring alerts are green, documents lessons learned, and closes IT service ticket.',
          troubleshootingNote: 'Symptom: Undocumented changes leave future technicians unaware of modified port numbers or credentials.',
          examRelevance: 'Closing documentation ensures institutional knowledge is preserved.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Locate the cross-functional governance committee that reviews and approves changes based on risk.',
          targetHotspotId: 'step-cab',
          hint: 'Look for the Change Advisory Board (CAB) node in the middle.'
        },
        {
          prompt: 'Identify the mandatory contingency plan that details how to restore systems if a change fails.',
          targetHotspotId: 'step-rollback',
          hint: 'Look on the upper right for the Rollback and Backout plan.'
        },
        {
          prompt: 'Identify the formal initiation document submitted by a technician to propose a system modification.',
          targetHotspotId: 'step-rfc',
          hint: 'Look on the far left for the Request for Change (RFC).'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'op-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Datacenter Environmental Rack',
      subtitle: 'Hot/Cold Aisle Containment, Clean Agent Gas Nozzle, & Humidity Sensors',
      estimatedMinutes: 8,
      modelId: 'server-rack-environment',
      modelTitle: 'Server Rack Environmental & Fire Suppression',
      description: 'Inspect the environmental and fire safety systems inside an enterprise server room. Drag the slider to explode the rack containment door and fire suppression manifold.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'rack-frame',
          name: '42U Perforated Server Rack Frame',
          category: 'Structural Enclosure',
          color: '#1e293b',
          shape: 'box',
          dimensions: [4.0, 9.0, 5.0],
          defaultPosition: [0, 0, 0],
          explodedPosition: [0, -2.5, 0],
          description: 'Heavy-duty steel 42U rack with 80% perforation for optimized front-to-back airflow.',
          specs: 'Standard 19-inch mounting rails, bonded to common datacenter grounding copper busbar.',
          failureSymptoms: 'Improper grounding allowing static buildup and potential ground loop hum.'
        },
        {
          id: 'containment-door',
          name: 'Plexiglass Cold Aisle Containment Door',
          category: 'Thermal Containment',
          color: '#0284c7',
          shape: 'box',
          dimensions: [3.8, 8.8, 0.4],
          defaultPosition: [0, 0, 2.6],
          explodedPosition: [0, 0, 4.8],
          description: 'Aisle containment baffle preventing cold intake air from mixing with hot exhaust air.',
          specs: 'Increases CRAC cooling efficiency by up to 35%, maintains constant 20°C - 24°C intake.',
          failureSymptoms: 'Hot/cold air mixing resulting in hotspot thermal throttling in top rack units.'
        },
        {
          id: 'gas-nozzle',
          name: 'FM-200 / Novec Clean Agent Fire Nozzle',
          category: 'Fire Suppression',
          color: '#dc2626',
          shape: 'cylinder',
          dimensions: [1.2, 0.8, 1.2],
          defaultPosition: [0, 4.8, 0],
          explodedPosition: [0, 6.5, 0],
          description: 'Gas fire suppression nozzle discharging non-conductive clean agent gas that extinguishes fire without water.',
          specs: 'Leaves zero residue, does not damage electronics, safe for occupied spaces when evacuated.',
          failureSymptoms: 'Accidental discharge caused by faulty optical smoke detector sensor.'
        },
        {
          id: 'sensor-probe',
          name: 'IoT Temperature & Humidity Sensor',
          category: 'Environmental Telemetry',
          color: '#10b981',
          shape: 'box',
          dimensions: [1.0, 0.6, 0.8],
          defaultPosition: [1.6, 2.0, 2.4],
          explodedPosition: [2.8, 3.2, 3.5],
          description: 'Environmental probe reporting real-time ambient temperature and relative humidity to SNMP monitors.',
          specs: 'Ideal datacenter humidity range: 40% to 60%. (Under 30% increases ESD risks; over 60% causes condensation).',
          failureSymptoms: 'High temperature alert triggers automated emergency fan spinup.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'op-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: ESD Grounding & Common Point Bus',
      subtitle: 'Static Dissipative Mats, 1-Megohm Resistors, & Earth Ground',
      estimatedMinutes: 6,
      animationType: 'esd-grounding',
      description: 'Observe how an anti-static wrist strap and dissipative mat safely bleed electrostatic voltage to ground through a built-in 1-megohm current-limiting safety resistor.',
      steps: [
        {
          stepNumber: 1,
          label: 'TRIBOELECTRIC CHARGE ACCUMULATION',
          description: 'Walking across carpet builds up an unseen 15,000 Volt static charge on the technician’s body through friction.',
          highlightedElement: 'Technician Body & Clothing',
          metrics: { label: 'Static Voltage', value: '15,000 Volts' }
        },
        {
          stepNumber: 2,
          label: 'WRIST STRAP BONDING & 1-MEGOHM RESISTOR',
          description: 'The technician attaches their ESD wrist strap. The conductive band touches the skin and connects to a 1-Megohm safety resistor in the coiled cord.',
          highlightedElement: '1-Megohm Safety Resistor in Cord',
          metrics: { label: 'Safety Resistor', value: '1,000,000 Ω (Prevents Mains Shock)' }
        },
        {
          stepNumber: 3,
          label: 'CONTROLLED CHARGE DISSIPATION',
          description: 'The static charge slowly and safely bleeds across the dissipative mat into the building’s common earth ground bus over 0.2 seconds.',
          highlightedElement: 'Common Point Earth Ground Bus',
          metrics: { label: 'Dissipation Time', value: '0.2 Seconds (Safe Drain)' }
        },
        {
          stepNumber: 4,
          label: 'ZERO VOLT SAFE COMPONENT HANDLING',
          description: 'The technician and the workstation chassis are at equipotential zero volts. Sensitive CMOS semiconductors can now be handled with zero risk of dielectric breakdown.',
          highlightedElement: 'Equipotential Workstation Plane',
          metrics: { label: 'Potential Difference', value: '0.00 Volts (SAFE)' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'op-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Digital Forensics Chain-of-Custody',
      subtitle: 'Preserving Volatile RAM, Packaging in Antistatic Bag, & Evidence Logging',
      estimatedMinutes: 8,
      labTitle: 'Forensic Evidence Seizure & Chain of Custody Documentation',
      goal: 'Securely seize a laptop involved in corporate espionage, record its cryptographic SHA-256 hash, and execute an unbroken chain of custody transfer.',
      hardwareSubject: 'Digital Forensics Evidence Protocol',
      prerequisites: [
        'Tamper-evident antistatic evidence bag',
        'Hardware write-blocker',
        'Official Chain of Custody form'
      ],
      steps: [
        {
          id: 'step-forensics-isolate',
          instruction: 'Isolate laptop from wireless and wired networks immediately',
          detail: 'Place laptop into airplane mode or insert into an RF Faraday bag to prevent remote wipe commands.',
          actionType: 'isolate-rf',
          feedbackOnSuccess: 'Device placed into Faraday shielded enclosure. Remote wipe signals blocked.'
        },
        {
          id: 'step-dump-ram',
          instruction: 'Capture volatile RAM memory image to external encrypted media',
          detail: 'Preserve volatile memory (active encryption keys, open chat sessions) before turning off the system.',
          actionType: 'dump-ram',
          feedbackOnSuccess: 'Volatile RAM image captured with verified SHA-256 integrity hash.'
        },
        {
          id: 'step-hash-drive',
          instruction: 'Connect drive to hardware write-blocker and compute SHA-256 image hash',
          detail: 'Use a hardware write-blocker to guarantee zero bits are modified on the original drive during imaging.',
          actionType: 'write-block-image',
          feedbackOnSuccess: 'Bit-for-bit forensic clone created! Original and cloned SHA-256 hashes match perfectly.'
        },
        {
          id: 'step-seal-evidence',
          instruction: 'Seal original drive inside tamper-evident antistatic evidence bag',
          detail: 'Sign and date across the tamper-evident adhesive tape seal with permanent marker.',
          actionType: 'seal-evidence-bag',
          feedbackOnSuccess: 'Evidence sealed in tamper-evident bag with serialized barcode #EV-8902.'
        },
        {
          id: 'step-log-custody',
          instruction: 'Complete Chain of Custody form and secure in evidence locker',
          detail: 'Log date, time, reason for seizure, model, serial number, and transfer signatures.',
          actionType: 'sign-chain-of-custody',
          feedbackOnSuccess: 'Chain of Custody completed and verified! Evidence is fully admissible in legal proceedings.'
        }
      ],
      successMessage: 'Forensic integrity maintained! You demonstrated the exact legal protocol for digital evidence preservation and unbroken chain of custody logging.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'op-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: The Unauthorized Midday Server Reboot',
      subtitle: 'CompTIA Change Management & Professional Incident Triage',
      estimatedMinutes: 8,
      caseTitle: 'Company CRM Outage Caused by Unapproved Midday Patching',
      clientName: 'Victor Cruz, VP of Global Sales',
      deviceModel: 'Production Database Server DB-PROD-01',
      initialProblemDescription: 'Victor bursts into the IT department shouting: "All 120 of our sales agents across the country just lost their client CRM connections in the middle of closing quarterly deals! We are losing tens of thousands of dollars every minute! What is going on?"',
      startStepId: 'step-op-calm-client',
      steps: {
        'step-op-calm-client': {
          id: 'step-op-calm-client',
          title: 'Step 1: Professional Communication & Customer De-escalation',
          scenarioText: 'The executive is furious. How do you respond professionally according to CompTIA customer service standards?',
          customerStatement: 'Who authorized this? Our agents cannot enter contract signatures!',
          systemState: {
            power: 'post-error',
            screen: 'blank',
            fan: 'max-rpm'
          },
          diagnosticOptions: [
            {
              id: 'c-empathy-and-action',
              label: 'Maintain calm, professional composure, acknowledge the severity with empathy, and assure Victor you are investigating immediately',
              actionDescription: 'De-escalate the situation, avoid defensive arguments, and commit to immediate resolution updates.',
              nextStepId: 'step-op-investigate-change',
              feedback: 'Exemplary professional communication! You de-escalated Victor’s anger, maintained eye contact, acknowledged the business impact, and focused on resolution.'
            },
            {
              id: 'c-argue-and-blame',
              label: 'Tell Victor that sales reps should be more patient and blame the junior intern',
              actionDescription: 'Argue and shift blame.',
              isFatal: true,
              feedback: 'UNACCEPTABLE PROFESSIONAL CONDUCT: Arguing with upset clients, displaying defensive hostility, and shifting blame violates CompTIA professional standards!'
            }
          ]
        },

        'step-op-investigate-change': {
          id: 'step-op-investigate-change',
          title: 'Step 2: Investigate System State & Unauthorized Changes',
          scenarioText: 'You check the server room console. DB-PROD-01 is displaying: "Working on updates 22% - Don\'t turn off your PC". A junior technician admits they manually clicked "Install Updates" at 11:30 AM without an RFC. What principle was violated?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-change-management-breach',
              label: 'Violation: Circumventing Change Management and applying unapproved updates outside maintenance windows',
              actionDescription: 'Identify the root cause as a failure of Change Control governance.',
              nextStepId: 'step-op-manage-recovery',
              feedback: 'Spot on! Production servers must NEVER have manual updates applied during active business hours without an approved RFC, CAB review, and maintenance window.'
            },
            {
              id: 'c-pull-power-plug',
              label: 'Immediately pull the server power cord out of the wall to stop the update',
              actionDescription: 'Cut power during active database update.',
              isFatal: true,
              feedback: 'CATASTROPHIC FAILURE: Cutting power during an active database and OS kernel update permanently corrupts the database filesystem and brick the server OS!'
            }
          ]
        },

        'step-op-manage-recovery': {
          id: 'step-op-manage-recovery',
          title: 'Step 3 & 4: Monitor Completion, Verify, and Enforce Policy',
          scenarioText: 'You let the update finish gracefully (6 minutes remaining), verify the SQL database services start, confirm CRM connectivity for sales reps, and give Victor an updated report. How do you prevent recurrence?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-post-incident-cab-policy',
              label: 'Lock down server update permissions via Group Policy, conduct a Post-Incident Review (PIR), and reinforce mandatory CAB approval training',
              actionDescription: 'Implement preventive technical controls and governance retraining.',
              isResolved: true,
              feedback: 'OUTSTANDING PROFESSIONAL REMEDIATION! The CRM resumed in 6 minutes. You locked down production server patching to automated SCCM maintenance windows, filed the post-incident documentation, and restored executive trust.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'op-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Core 2 Operational Procedures Assessment',
      subtitle: 'CompTIA 220-1102 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 2 Operational Procedures Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'op-q1',
          question: 'What is the purpose of a Change Advisory Board (CAB) in enterprise IT operations?',
          options: [
            'To write software code for open-source applications',
            'To evaluate proposed changes for risk, business impact, and scheduling conflicts before approving execution',
            'To order physical desktop hardware from vendors',
            'To interview prospective new hires'
          ],
          correctAnswer: 1,
          explanation: 'The Change Advisory Board (CAB) is a committee that reviews proposed Requests for Change (RFCs) to assess potential risks, prevent scheduling conflicts, ensure rollback plans exist, and approve or reject changes.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 4.2'
        },
        {
          id: 'op-q2',
          question: 'Why is establishing an unbroken Chain of Custody critical when seizing a computer involved in corporate fraud or illegal activity?',
          options: [
            'It allows the technician to sell the computer at auction',
            'It ensures the digital evidence remains legally admissible and untampered in a court of law',
            'It speeds up the computer processor clock speed',
            'It bypasses BitLocker passwords automatically'
          ],
          correctAnswer: 1,
          explanation: 'A Chain of Custody tracks who possessed, handled, analyzed, and stored digital evidence. Any gap or undocumented transfer can result in evidence being ruled inadmissible in court due to potential tampering.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 4.3'
        },
        {
          id: 'op-q3',
          question: 'Which standardized document provides crucial information regarding chemical toxicity, proper disposal methods, fire hazard ratings, and first-aid response for substances like printer toner or battery acid?',
          options: [
            'Request for Change (RFC)',
            'Safety Data Sheet (SDS / MSDS)',
            'Service Level Agreement (SLA)',
            'Non-Disclosure Agreement (NDA)'
          ],
          correctAnswer: 1,
          explanation: 'Safety Data Sheets (SDS), formerly known as MSDS, provide comprehensive physical, health, environmental, and chemical hazard guidelines, safe handling practices, and emergency first-aid protocols.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 4.4'
        },
        {
          id: 'op-q4',
          question: 'Which method guarantees permanent, irreversible data sanitization on mechanical magnetic hard disk drives by destroying magnetic domains?',
          options: [
            'Quick formatting with NTFS',
            'Degaussing with a high-intensity magnetic field',
            'Deleting the partition in Disk Management',
            'Emptying the Windows Recycle Bin'
          ],
          correctAnswer: 1,
          explanation: 'Degaussing subjects magnetic media (HDDs, tapes) to an extremely powerful electromagnetic field, neutralizing the magnetic polarity and rendering data permanently unrecoverable.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 4.5'
        }
      ]
    }
  ]
};
