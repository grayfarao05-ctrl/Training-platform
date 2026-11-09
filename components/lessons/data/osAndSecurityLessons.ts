import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_C2_2_4_LESSON: LessonData = {
  objectiveId: 'c2_2.4',
  courseId: 'a-plus',
  title: 'Malware Analysis & CompTIA 7-Step Remediation Protocol',
  domainName: 'Domain 2.0: Security (Core 2)',
  badgeLabel: 'Core 2 (220-1102)',
  summary: 'Master the mandatory CompTIA 7-step malware removal process from immediate network quarantine through system restore reactivation and end-user education.',
  sections: [
    {
      id: 'sec-text-c2-2-4',
      type: 'text',
      title: 'Technical Briefing: The CompTIA 7-Step Malware Removal Procedure',
      subtitle: 'Ordered Remediation Steps, Safe Mode, and Restore Point Sanitization',
      estimatedMinutes: 6,
      content: {
        lead: 'When responding to malware infections (ransomware, trojans, rootkits, or cryptominers), technicians must execute the CompTIA 7-step remediation process in exact chronological sequence to prevent reinfection.',
        sections: [
          {
            heading: 'The 7 Mandatory Malware Removal Steps',
            body: [
              '1. Identify and research malware symptoms (unwanted pop-ups, encrypted files, redirected DNS, disabled security services).',
              '2. Quarantine the infected systems: Immediately disconnect physical Ethernet cables and disable Wi-Fi/Bluetooth to prevent lateral spread across the network.',
              '3. Disable System Restore (in Windows): Prevents the operating system from creating backup restore points containing active malware code, and clears existing infected restore snapshots.',
              '4. Remediate the infected systems: Update anti-malware signatures, boot into Safe Mode with Networking or WinPE recovery environments, scan, and remove the threat.',
              '5. Schedule scans and run regular updates: Set automated daily anti-malware scans and verify Windows Update is functioning.',
              '6. Enable System Restore and create a fresh clean restore point.',
              '7. Educate the end user: Explain social engineering, phishing email red flags, and safe browsing habits to prevent recurrence.'
            ],
            bulletPoints: [
              'Quarantine Priority: The absolute first remediation action is network isolation (pull the network cable).',
              'System Restore Risk: If you do not disable System Restore before scanning, malware can hide in the System Volume Information directory and restore itself later.',
              'Rootkits: Low-level malware residing in the Master Boot Record (MBR) or UEFI firmware require bootable offline media or Secure Boot verification.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Step Order Questions',
              content: 'CompTIA test questions will ask: "What should the technician do NEXT after identifying a malware infection?" -> The answer is ALWAYS: "Quarantine the system (disconnect from network)".'
            }
          }
        ],
        technicalTerms: [
          { term: 'Quarantine', definition: 'Isolating a device or file to prevent malicious code from transmitting across the LAN or executing.' },
          { term: 'Ransomware', definition: 'Malware that uses asymmetric encryption (e.g. RSA-4096) to lock user files and demand cryptocurrency payment for the private decryption key.' },
          { term: 'Rootkit', definition: 'Malicious software designed to inject itself into kernel memory or UEFI firmware below the operating system.' },
          { term: 'Safe Mode', definition: 'A minimal Windows diagnostic boot mode loading only essential kernel drivers without startup applications or non-essential network services.' }
        ],
        keyTakeaways: [
          'Step 2 is Quarantine: Disconnect the network immediately.',
          'Step 3 is Disable System Restore to purge infected restore snapshots.',
          'Step 6 is Re-enable System Restore and create a verified clean baseline.',
          'Step 7 is Educate the user to prevent repeat attacks.'
        ]
      }
    },
    {
      id: 'sec-diagram-c2-2-4',
      type: 'diagram',
      title: 'Interactive Diagram: Enterprise Network Isolation & Quarantine Zone',
      subtitle: 'VLAN Segmentation, Endpoint Threat Isolation & Containment',
      estimatedMinutes: 8,
      diagramId: 'network-topology',
      diagramTitle: 'Malware Containment Architecture & Lateral Movement Prevention',
      description: 'Click network zones to inspect quarantine protocols, rogue lateral movement attempts, and clean remediation baselines.',
      hotspots: [
        {
          id: 'infected-node',
          x: 20,
          y: 40,
          name: 'Compromised Workstation (Patient Zero)',
          category: 'Infected Endpoint',
          shortDescription: 'Infected with trojan downloader trying to scan subnet.',
          fullSpecs: 'Attempting SMB Port 445 lateral scanning across the local /24 subnet.',
          troubleshootingNote: 'Symptom: High network broadcast traffic and sudden locked files.',
          examRelevance: 'Quarantine immediately by unplugging Ethernet or placing in isolated remediation VLAN.'
        },
        {
          id: 'quarantine-vlan',
          x: 50,
          y: 35,
          name: 'Isolated Quarantine Network (VLAN 999)',
          category: 'Containment Zone',
          shortDescription: 'Non-routable remediation network with zero access to file servers.',
          fullSpecs: 'Only allowed outbound access to verified antivirus signature definition servers.',
          troubleshootingNote: 'Symptom: Blocked from internal domain controllers and accounting databases.',
          examRelevance: 'Understand network segmentation as an enterprise containment strategy.'
        },
        {
          id: 'backup-server',
          x: 80,
          y: 35,
          name: 'Immutable Air-Gapped Backup Vault',
          category: 'Disaster Recovery',
          shortDescription: 'Write-once read-many (WORM) offline backup storage.',
          fullSpecs: 'Protected against ransomware encryption with multi-factor authentication and physical air-gap.',
          troubleshootingNote: 'Symptom: Critical safe haven when ransomware strikes corporate shares.',
          examRelevance: 'CompTIA tests air-gapped and cloud immutable backups for ransomware recovery.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the first node that must be severed from the network during an active malware outbreak.',
          targetHotspotId: 'infected-node',
          hint: 'Patient zero workstation.'
        },
        {
          prompt: 'Select the secure containment zone that prevents lateral infection while permitting virus signature updates.',
          targetHotspotId: 'quarantine-vlan',
          hint: 'VLAN 999 isolation network.'
        }
      ]
    },
    {
      id: 'sec-3d-c2-2-4',
      type: '3d-model',
      title: 'Interactive 3D Hardware: Security Operations Workstation',
      subtitle: 'Hardware Write-Blockers, Faraday Bags, & Recovery Drives',
      estimatedMinutes: 8,
      modelId: 'laptop-teardown',
      modelTitle: '3D Forensic Triage Hardware',
      description: 'Inspect the technician hardware tools used to isolate, sanitize, and image infected systems without contaminating forensic evidence.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'forensic-laptop',
          name: 'Hardened Incident Response Laptop',
          category: 'Technician Terminal',
          color: '#1e293b',
          shape: 'box',
          dimensions: [8, 0.4, 6],
          defaultPosition: [0, -1, 0],
          explodedPosition: [0, -2.5, 0],
          description: 'Air-gapped Linux forensic workstation equipped with live boot analysis distros and static analysis disassemblers.',
          specs: 'Physical Wi-Fi hardware kill-switch engaged. Tamper-evident seals on ports.',
          failureSymptoms: 'Never connect directly to production corporate network.'
        },
        {
          id: 'write-blocker',
          name: 'Hardware Forensic Write-Blocker',
          category: 'Data Integrity',
          color: '#f59e0b',
          shape: 'box',
          dimensions: [3, 0.6, 2],
          defaultPosition: [-2.5, 0.2, 1],
          explodedPosition: [-3.8, 1.4, 1],
          description: 'Hardware bridge connecting suspect drive to forensic PC. Allows read commands while physically preventing write commands.',
          specs: 'SATA and NVMe PCIe hardware write protection. Certified for legal chain of custody.',
          failureSymptoms: 'Prevents malware from modifying timestamps or deleting forensic log files.'
        },
        {
          id: 'faraday-bag',
          name: 'RF Shielding Faraday Bag',
          category: 'Wireless Isolation',
          color: '#0284c7',
          shape: 'box',
          dimensions: [4, 0.2, 3],
          defaultPosition: [2.5, 0.2, 1],
          explodedPosition: [3.8, 1.4, 1],
          description: 'Metallic mesh envelope that completely blocks all RF signals (Cellular 5G, Wi-Fi, Bluetooth, GPS).',
          specs: 'Attenuates signals by >90 dB. Prevents remote wipe commands sent to compromised smartphones.',
          failureSymptoms: 'Compromised devices inside cannot receive remote command-and-control instructions.'
        }
      ]
    },
    {
      id: 'sec-anim-c2-2-4',
      type: 'animation',
      title: 'Dynamic Demonstration: The 7-Step Removal Flowchart',
      subtitle: 'Chronological Progression from Triage to End-User Training',
      estimatedMinutes: 5,
      animationType: 'wifi-signal',
      description: 'Follow the strict chronological sequence of the CompTIA 7-step malware removal process.',
      steps: [
        {
          stepNumber: 1,
          label: 'Step 1 & 2: Identify Symptoms & Quarantine',
          description: 'Identify suspicious behavior and instantly unplug the Ethernet cable and toggle Airplane Mode. The infection is contained.',
          highlightedElement: 'Quarantine Isolation Line',
          metrics: { label: 'Network State', value: 'ISOLATED' }
        },
        {
          stepNumber: 2,
          label: 'Step 3: Disable System Restore',
          description: 'Open System Protection and turn off System Restore. This permanently purges all shadow copies where malware could be archived.',
          highlightedElement: 'System Restore Purge',
          metrics: { label: 'Shadow Copies', value: 'PURGED' }
        },
        {
          stepNumber: 3,
          label: 'Step 4 & 5: Remediate in Safe Mode & Schedule Scans',
          description: 'Reboot into Safe Mode, run an updated anti-malware scan, delete infected files, and configure automated daily scheduled scans.',
          highlightedElement: 'Safe Mode Remediation Scan',
          metrics: { label: 'Threats Removed', value: 'CLEAN' }
        },
        {
          stepNumber: 4,
          label: 'Step 6 & 7: Re-enable System Restore & Educate User',
          description: 'Turn System Restore back on and create a fresh baseline point. Train the user on recognizing fake email invoices and phishing.',
          highlightedElement: 'Clean Baseline & User Education',
          metrics: { label: 'Ticket Status', value: 'RESOLVED' }
        }
      ]
    },
    {
      id: 'sec-lab-c2-2-4',
      type: 'lab',
      title: 'Virtual Practical Lab: Executing the 7-Step Protocol in Windows',
      subtitle: 'Hands-on Threat Isolation & Safe Mode Disinfection',
      estimatedMinutes: 8,
      labTitle: 'Incident Response & Malware Disinfection Lab',
      goal: 'Execute the CompTIA 7-step malware remediation process in the correct sequence on an infected Windows endpoint.',
      hardwareSubject: 'Compromised Accounting Workstation',
      prerequisites: [
        'Local Administrator credentials',
        'Updated USB rescue environment'
      ],
      steps: [
        {
          id: 'm-step-1',
          instruction: 'Step 2: Physically Disconnect Ethernet Cable',
          detail: 'Immediately quarantine the workstation by unplugging the RJ45 cable to stop lateral spreading.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Ethernet cable disconnected! Workstation successfully quarantined from the LAN.'
        },
        {
          id: 'm-step-2',
          instruction: 'Step 3: Disable Windows System Restore',
          detail: 'Navigate to System Properties -> System Protection -> Configure -> Disable System Protection to purge infected shadow copies.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'System Restore disabled and shadow copies purged. Malware cannot restore itself.'
        },
        {
          id: 'm-step-3',
          instruction: 'Step 4a: Boot into Safe Mode with Networking',
          detail: 'Run msconfig, configure Boot options for Safe Boot (Minimal), and reboot into clean diagnostic mode.',
          actionType: 'insert-ram',
          feedbackOnSuccess: 'System booted in Safe Mode. Third-party malware startup persistence mechanisms bypassed.'
        },
        {
          id: 'm-step-4',
          instruction: 'Step 4b: Update Signatures & Run Full Deep Scan',
          detail: 'Execute signature update from offline rescue media and remove all detected Trojan files and registry hooks.',
          actionType: 'lock-clips',
          feedbackOnSuccess: 'Scan complete! 3 malicious Trojans and registry run keys successfully eradicated.'
        },
        {
          id: 'm-step-5',
          instruction: 'Step 6 & 7: Re-enable System Restore & Deliver User Training',
          detail: 'Turn System Restore back on, create a fresh restore point, and guide user through phishing identification.',
          actionType: 'verify-post',
          feedbackOnSuccess: 'Clean restore point created and user educated on phishing links! 7-step protocol completed.'
        }
      ],
      successMessage: 'Flawless execution! You performed all 7 steps of the CompTIA malware removal protocol in exact textbook order.',
      xpReward: 250
    },
    {
      id: 'sec-scenario-c2-2-4',
      type: 'scenario',
      title: 'Troubleshooting Simulation: Ransomware Pop-up on CFO Workstation',
      subtitle: 'CompTIA Security Incident Response Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Ransomware Outbreak & Threat Containment',
      clientName: 'Chief Financial Officer Workstation',
      deviceModel: 'Corporate Desktop',
      initialProblemDescription: 'The CFO clicks an email attachment titled "Urgent_Invoice_Overdue.exe". Immediately, a red full-screen banner appears: "ALL YOUR PERSONAL AND FINANCIAL FILES HAVE BEEN ENCRYPTED WITH RSA-4096. SEND 2 BITCOIN WITHIN 48 HOURS".',
      startStepId: 'step-sec-triage',
      steps: {
        'step-sec-triage': {
          id: 'step-sec-triage',
          title: 'Step 1: Emergency Response Action',
          scenarioText: 'You arrive at the CFO desk. The ransomware banner is active, and the hard drive activity light is blinking furiously as it begins encrypting network shares. What is your immediate action?',
          systemState: {
            power: 'on',
            screen: 'flickering',
            fan: 'max-rpm',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-quarantine-pull-cable',
              label: 'Instantly yank the Ethernet cable and disable Wi-Fi to quarantine the machine',
              actionDescription: 'Step 2: Quarantine the infected system immediately.',
              nextStepId: 'step-disable-restore',
              feedback: 'PERFECT FIRST RESPONSE! By pulling the network cable immediately, you halt the ransomware from encrypting the company-wide mapped network drives and database servers.'
            },
            {
              id: 'c-pay-ransom',
              label: 'Open a web browser and follow the link to pay the 2 Bitcoin ransom',
              actionDescription: 'Pay the attacker immediately.',
              isFatal: true,
              feedback: 'Hazardous / Unacceptable! Paying ransoms funds criminal syndicates, provides zero guarantee of decryption keys, and violates corporate security policy.'
            },
            {
              id: 'c-run-word',
              label: 'Try to open Microsoft Word to test if documents are still working',
              actionDescription: 'Test files while infection runs.',
              isFatal: true,
              feedback: 'Disastrous delay! While you browse around, the ransomware finishes encrypting the remaining files.'
            }
          ]
        },
        'step-disable-restore': {
          id: 'step-disable-restore',
          title: 'Step 2: Remediate and Restore from Backup',
          scenarioText: 'The machine is isolated. The local drive was partially encrypted. What is the approved enterprise recovery procedure?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-reimage-restore',
              label: 'Wipe the storage drive, re-image from standard corporate golden image, restore data from immutable air-gapped backup, and provide phishing education',
              actionDescription: 'Full sanitization, re-image, restore from verified clean backup, and educate user.',
              isResolved: true,
              feedback: 'EXCELLENT RESOLUTION! In an enterprise ransomware incident, complete disk sanitization and reimaging is the only guaranteed way to remove persistent rootkits. Restoring from air-gapped backups recovered 100% of data.'
            }
          ]
        }
      }
    },
    {
      id: 'sec-quiz-c2-2-4',
      type: 'quiz',
      title: 'Knowledge Check: Malware Removal & Security Protocols',
      subtitle: 'CompTIA 220-1102 Domain 2.0 Exam Drill',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 2 Objective 2.4 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'q-c2-2-4-1',
          question: 'Immediately after identifying that a corporate workstation is infected with active malware, what is the NEXT action a technician should take according to the CompTIA 7-step removal process?',
          options: [
            'Quarantine the infected system by disconnecting it from the network',
            'Run a full system backup',
            'Re-enable System Restore',
            'Educate the end user'
          ],
          correctAnswer: 0,
          explanation: 'Step 2 of the CompTIA process is "Quarantine infected system". Disconnecting the network prevents lateral spread across the company and stops remote command-and-control communication.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.4'
        },
        {
          id: 'q-c2-2-4-2',
          question: 'Why does Step 3 of the malware removal protocol require disabling Windows System Restore prior to cleaning the computer?',
          options: [
            'To free up RAM for the antivirus scanner',
            'To purge infected system restore points that could otherwise harbor and re-inject malware',
            'Because Windows cannot boot into Safe Mode with System Restore enabled',
            'To update the network adapter drivers'
          ],
          correctAnswer: 1,
          explanation: 'Malware often infects System Restore snapshots. Disabling System Restore purges all restore points, preventing malware from re-infecting the machine if a user later restores the system.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.4'
        },
        {
          id: 'q-c2-2-4-3',
          question: 'What is the FINAL step (Step 7) in the official CompTIA 7-step malware removal process?',
          options: [
            'Re-enable System Restore and create a restore point',
            'Schedule automatic daily scans and updates',
            'Educate the end user',
            'Replace the motherboard'
          ],
          correctAnswer: 2,
          explanation: 'The 7th and final step is "Educate the end user" to prevent future infections through safe email, web, and password practices.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.4'
        },
        {
          id: 'q-c2-2-4-4',
          question: 'An employee receives an email appearing to come from the CEO asking them to immediately purchase gift cards and email the redemption PINs. What specific social engineering attack is this?',
          options: [
            'Whaling / Spear Phishing',
            'Dumpster Diving',
            'Shoulder Surfing',
            'Tailgating'
          ],
          correctAnswer: 0,
          explanation: 'Targeted phishing attacks targeting high-value executives or impersonating executives to deceive staff are known as Spear Phishing / Whaling.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.5'
        }
      ]
    }
  ]
};
