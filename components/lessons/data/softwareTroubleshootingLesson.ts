import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_SW_TROUBLESHOOTING_LESSON: LessonData = {
  objectiveId: 'c2d3',
  courseId: 'a-plus',
  title: 'Software Troubleshooting & 7-Step Malware Remediation',
  domainName: 'Core 2 Domain 3.0: Software Troubleshooting',
  badgeLabel: 'Core 2 (220-1102)',
  summary: 'Master the CompTIA 7-step malware removal process, Windows Event Viewer crash log analysis, Blue Screen memory dump triage, and Safe Mode diagnostic boot.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'sw-text-1',
      type: 'text',
      title: 'Technical Briefing: Malware Remediation & Crash Analysis',
      subtitle: 'The CompTIA 7-Step Malware Protocol & Blue Screen Triage',
      estimatedMinutes: 6,
      content: {
        lead: 'Software failures, OS crashes, and malware infections represent the highest volume of enterprise help desk tickets. Technicians must strictly adhere to the CompTIA 7-step malware removal procedure and master Event Viewer diagnostic logs.',
        sections: [
          {
            heading: 'The CompTIA 7-Step Malware Removal Protocol',
            body: [
              'CompTIA requires technicians to memorize the exact sequential order of the 7-step malware remediation procedure:',
              '1. Investigate and verify malware symptoms (unusual popups, high CPU utilization, browser redirects).',
              '2. Quarantine the infected system (unplug Ethernet, turn off Wi-Fi to stop spreading).',
              '3. Disable System Restore (prevents malware from embedding into clean restore points).',
              '4. Remediate the infected systems: Update anti-malware signatures, scan and use removal techniques (Safe Mode, Pre-installation Environment).',
              '5. Schedule scans and run regular OS updates.',
              '6. Enable System Restore and create a fresh clean restore point.',
              '7. Educate the end user (explain how infection occurred, phishing awareness).'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Why Disable System Restore?',
              content: 'If you remove malware with System Restore enabled, the virus can remain saved inside older Windows restore points. If a user subsequently restores the PC, the virus is resurrected! Always disable System Restore in Step 3, clean the PC in Step 4, and re-enable it in Step 6.'
            }
          },
          {
            heading: 'Blue Screen of Death (BSOD) & Windows Event Viewer',
            body: [
              'When the Windows kernel encounters an unrecoverable exception in Ring 0, it halts to prevent filesystem corruption and writes an Event ID 1001 memory dump file (MEMORY.DMP).',
              'Event Viewer logs are organized into: System (hardware, driver failures, Event ID 41 power loss), Application (crash Event ID 1000, software exceptions), and Security (logon attempts, audit failures).'
            ],
            bulletPoints: [
              'IRQL_NOT_LESS_OR_EQUAL (0x0A): Driver tried to access pageable memory at a high interrupt request level; usually a faulty hardware driver.',
              'KERNEL_DATA_INPAGE_ERROR (0x77/0x7A): Windows tried to read pagefile data from disk, but storage I/O failed (bad sectors or dying drive).',
              'PAGE_FAULT_IN_NONPAGED_AREA (0x50): Damaged or defective physical RAM modules.'
            ]
          }
        ],
        technicalTerms: [
          { term: 'CompTIA 7-Step', definition: '1. Investigate, 2. Quarantine, 3. Disable Restore, 4. Remediate, 5. Schedule scans, 6. Enable Restore, 7. Educate user.' },
          { term: 'Safe Mode', definition: 'Minimal diagnostic boot environment loading only essential default drivers and services.' },
          { term: 'Event ID 1000', definition: 'Windows Application Error indicating a crashed user-mode executable.' },
          { term: 'Event ID 41', definition: 'Kernel-Power error logged when system rebooted without cleanly shutting down first.' }
        ],
        keyTakeaways: [
          'Quarantine the infected system (Step 2) BEFORE attempting scan and removal.',
          'Disable System Restore in Step 3 to prevent malware from hiding in snapshot archives.',
          'Always educate the end user in Step 7 to prevent recurring infections.',
          'Event ID 41 indicates unexpected power cuts; Event ID 1001 records kernel crash dumps.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'sw-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Windows Event Viewer Architecture',
      subtitle: 'System, Application, Security, & Diagnostic Event Logs',
      estimatedMinutes: 8,
      diagramId: 'software-troubleshooting',
      diagramTitle: 'Windows Event Viewer Diagnostic Logging Hierarchy',
      description: 'Explore how Windows logs hardware, application, and security exceptions to isolate software crashes and kernel faults.',
      hotspots: [
        {
          id: 'system-log',
          x: 25,
          y: 25,
          name: 'System Event Log (eventvwr.msc)',
          category: 'OS & Driver Telemetry',
          shortDescription: 'Logs events generated by Windows system components, drivers, and hardware controllers.',
          fullSpecs: 'Records Error, Warning, Information, and Critical levels. Stored in C:\\Windows\\System32\\winevt\\Logs\\System.evtx.',
          troubleshootingNote: 'Symptom: Filter by "Event ID 41" to locate instances where the PC shut down unexpectedly.',
          examRelevance: 'System log is the first place to check when diagnosing hardware driver crashes and spontaneous reboots.'
        },
        {
          id: 'app-log',
          x: 50,
          y: 25,
          name: 'Application Event Log',
          category: 'User Software Crashes',
          shortDescription: 'Logs software faults, crashed EXEs, and faulted DLL module names.',
          fullSpecs: 'Event ID 1000 identifies the crashing application binary, exception code (e.g. 0xc0000005 access violation), and offset.',
          troubleshootingNote: 'Symptom: Outlook or Word crashing upon launch can be pinpointed to a corrupted third-party plugin DLL.',
          examRelevance: 'Use Application log to verify if a software problem is a bug in the app vs an operating system fault.'
        },
        {
          id: 'sec-log',
          x: 75,
          y: 25,
          name: 'Security Audit Log',
          category: 'Authentication & Access',
          shortDescription: 'Tracks successful and failed logon attempts, privilege escalation, and file access.',
          fullSpecs: 'Event ID 4624 (Successful Logon), Event ID 4625 (Failed Logon - Brute force indicator).',
          troubleshootingNote: 'Symptom: Repeated Event ID 4625 entries from unknown usernames indicate an ongoing password spray attack.',
          examRelevance: 'Configured via Local Security Policy (secpol.msc) under Audit Policies.'
        },
        {
          id: 'proc-mon',
          x: 35,
          y: 75,
          name: 'Sysinternals Process Monitor (ProcMon)',
          category: 'Advanced Diagnostics',
          shortDescription: 'Real-time capture of all file system, registry, and process thread activities.',
          fullSpecs: 'Monitors exact registry keys queried and "ACCESS DENIED" file permission blocks.',
          troubleshootingNote: 'Symptom: Pinpoints exactly which registry key or DLL is missing when an installer fails silently.',
          examRelevance: 'Recognize ProcMon and Process Explorer as premier enterprise troubleshooting utilities.'
        },
        {
          id: 'bsod-dmp',
          x: 65,
          y: 75,
          name: 'Crash Dump Analysis (WinDbg / MEMORY.DMP)',
          category: 'Kernel Dump Triage',
          shortDescription: 'Analyzes the saved RAM state captured at the moment of a Blue Screen Bugcheck.',
          fullSpecs: 'Command "!analyze -v" automatically identifies the specific faulting driver (.sys file).',
          troubleshootingNote: 'Symptom: Stop code points to nvlddmkm.sys (NVIDIA graphics driver); fixed by clean driver reinstall with DDU.',
          examRelevance: 'Dump files live in C:\\Windows\\Minidump or C:\\Windows\\MEMORY.DMP.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the log where Windows records kernel-power unexpected shutdowns (Event ID 41) and hardware driver faults.',
          targetHotspotId: 'system-log',
          hint: 'Look in the upper left for the System Event Log.'
        },
        {
          prompt: 'Locate the crash dump analysis tool that reads MEMORY.DMP files to identify the specific faulting driver.',
          targetHotspotId: 'bsod-dmp',
          hint: 'Look in the lower right for WinDbg crash dump analysis.'
        },
        {
          prompt: 'Identify the security log that records failed logon attempts (Event ID 4625) to detect brute-force attacks.',
          targetHotspotId: 'sec-log',
          hint: 'Look in the upper right for the Security Audit Log.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'sw-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Virtual Memory & Pagefile Architecture',
      subtitle: 'Physical RAM, Pagefile.sys, Address Spaces, & Memory Dumps',
      estimatedMinutes: 8,
      modelId: 'virtual-memory-model',
      modelTitle: 'Windows 64-Bit Virtual Memory Hierarchy',
      description: 'Explore how Windows manages physical RAM and secondary swap storage (Pagefile.sys). Drag the slider to separate the address layers.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'physical-ram',
          name: 'Physical DDR5 RAM Address Space',
          category: 'High-Speed Physical Memory',
          color: '#10b981',
          shape: 'box',
          dimensions: [8.0, 0.8, 3.5],
          defaultPosition: [0, -1.0, 0],
          explodedPosition: [0, -3.2, 0],
          description: 'High-speed physical volatile memory holding active working sets for the kernel and running applications.',
          specs: '32GB Physical RAM, 64-byte cache lines, sub-60ns access latency.',
          failureSymptoms: 'Hardware bit-flips causing random blue screens with PAGE_FAULT_IN_NONPAGED_AREA.'
        },
        {
          id: 'pagefile-disk',
          name: 'Secondary Swap Storage (pagefile.sys)',
          category: 'Virtual Memory Paging File',
          color: '#0284c7',
          shape: 'box',
          dimensions: [8.0, 0.8, 3.5],
          defaultPosition: [0, 0.2, 0],
          explodedPosition: [0, 0.5, 0],
          description: 'Hidden system file on C: drive where the Memory Manager writes modified, inactive memory pages.',
          specs: 'Managed dynamically by Windows (typically 1.5x physical RAM size). Also captures crash dumps.',
          failureSymptoms: 'Disk space exhaustion on C: triggers "Your computer is low on memory" warnings.'
        },
        {
          id: 'user-app-space',
          name: '48-Bit Virtual Address Space Mapping',
          category: 'Process Memory Isolation',
          color: '#eab308',
          shape: 'box',
          dimensions: [8.0, 0.8, 3.5],
          defaultPosition: [0, 1.4, 0],
          explodedPosition: [0, 3.8, 0],
          description: 'Each 64-bit application receives a private 128 Terabyte virtual address space isolated from other processes.',
          specs: 'Virtual Memory Manager translates virtual addresses to physical pages using hardware Page Tables.',
          failureSymptoms: 'Memory leak where an application continuously allocates RAM without freeing it.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'sw-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: The 7-Step Malware Removal Flowchart',
      subtitle: 'Sequential Execution from Symptom Verification to User Education',
      estimatedMinutes: 6,
      animationType: 'malware-quarantine',
      description: 'Follow the exact CompTIA 7-step sequence to safely eradicate persistent spyware and ransomware without reinfecting the network.',
      steps: [
        {
          stepNumber: 1,
          label: '1. IDENTIFY & 2. QUARANTINE',
          description: 'Verify malicious activity and immediately isolate the computer: pull Ethernet cables and turn off Wi-Fi/Bluetooth to halt command-and-control beaconing.',
          highlightedElement: 'Network Card Disconnected (Quarantine)',
          metrics: { label: 'Network State', value: '100% ISOLATED' }
        },
        {
          stepNumber: 2,
          label: '3. DISABLE SYSTEM RESTORE',
          description: 'Open System Properties and turn off System Restore. This purges all shadow copies and prevents the rootkit from resurrecting after cleaning.',
          highlightedElement: 'System Restore Engine Disabled',
          metrics: { label: 'Restore Points', value: 'PURGED OF ROOTKITS' }
        },
        {
          stepNumber: 3,
          label: '4. REMEDIATE IN SAFE MODE',
          description: 'Boot into Safe Mode with Networking, update anti-malware definition signatures, and execute full offline heuristics and rootkit sweeps.',
          highlightedElement: 'Safe Mode Antivirus Engine Sweep',
          metrics: { label: 'Threats Removed', value: '14 Infection Files Cleared' }
        },
        {
          stepNumber: 4,
          label: '5. SCHEDULE SCANS, 6. RESTORE, 7. EDUCATE',
          description: 'Schedule automated nightly scans, re-enable System Restore with a fresh clean snapshot, and train the user on spotting fraudulent links.',
          highlightedElement: 'System Restore Active & User Trained',
          metrics: { label: 'Compliance', value: '100% REMEDIATED & SECURE' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'sw-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: CompTIA 7-Step Malware Remediation',
      subtitle: 'Quarantining, Disabling Restore, Safe Mode Cleaning, & Re-enabling',
      estimatedMinutes: 8,
      labTitle: 'Enterprise Workstation Spyware Eradication Protocol',
      goal: 'Execute the CompTIA 7-step malware removal procedure in strict sequence on an infected corporate workstation.',
      hardwareSubject: 'CompTIA 7-Step Malware Protocol',
      prerequisites: [
        'Infected workstation with active browser redirect Trojan',
        'Bootable offline rescue USB with updated definitions',
        'Local administrator credentials'
      ],
      steps: [
        {
          id: 'step-quarantine',
          instruction: 'Step 2: Quarantine infected workstation from corporate network',
          detail: 'Disconnect Ethernet cable and toggle Wi-Fi radio off to isolate the host from other network devices.',
          actionType: 'isolate-network',
          feedbackOnSuccess: 'Workstation successfully quarantined! Zero lateral network communication possible.'
        },
        {
          id: 'step-disable-restore',
          instruction: 'Step 3: Disable System Protection / System Restore',
          detail: 'Open sysdm.cpl -> System Protection -> Configure -> Disable system protection and delete existing restore points.',
          actionType: 'disable-restore',
          feedbackOnSuccess: 'System Restore disabled and contaminated restore points purged.'
        },
        {
          id: 'step-safe-mode-remediate',
          instruction: 'Step 4: Boot to Safe Mode and execute deep malware remediation',
          detail: 'Reboot into Safe Mode, run portable antimalware scanner, and delete malicious scheduled tasks and startup keys.',
          actionType: 'run-safe-mode-scan',
          feedbackOnSuccess: 'Malware scanner detected and quarantined 3 Trojan droppers and 1 rootkit!'
        },
        {
          id: 'step-enable-restore',
          instruction: 'Step 6: Re-enable System Restore and create clean snapshot',
          detail: 'Turn System Protection back on and create a fresh restore point labeled "Clean Baseline Post-Remediation".',
          actionType: 'create-restore-point',
          feedbackOnSuccess: 'Clean baseline restore point created.'
        },
        {
          id: 'step-educate',
          instruction: 'Step 7: Provide cybersecurity education to the end-user',
          detail: 'Explain how clicking unverified links in phishing emails infected the machine and provide corporate training documentation.',
          actionType: 'educate-user',
          feedbackOnSuccess: 'User education completed and incident documented in IT service management ticketing system.'
        }
      ],
      successMessage: 'CompTIA 7-Step Malware Remediation completed flawlessly in exact sequential compliance!',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'sw-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: Blue Screen IRQL_NOT_LESS_OR_EQUAL',
      subtitle: 'CompTIA Crash Dump Analysis Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Random BSOD Crashes When Launching Video Editing Software',
      clientName: 'Jordan Reed, Multimedia Producer',
      deviceModel: 'Studio Editing Workstation',
      initialProblemDescription: 'Jordan states: "Whenever I open Premiere Pro and start scrubbing 4K video clips, my screen freezes, a Blue Screen of Death flashes with code IRQL_NOT_LESS_OR_EQUAL, and the computer restarts. It happened 4 times today."',
      startStepId: 'step-sw-inspect-event-viewer',
      steps: {
        'step-sw-inspect-event-viewer': {
          id: 'step-sw-inspect-event-viewer',
          title: 'Step 1: Check Windows Event Viewer for Crash Telemetry',
          scenarioText: 'You log into the workstation and open Event Viewer (eventvwr.msc). Where do you look to find details on the crash?',
          customerStatement: 'I installed a new beta GPU driver last weekend to get faster export rendering.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-inspect-system-log',
              label: 'Open Windows Logs -> System and search for Event ID 1001 (BugCheck)',
              actionDescription: 'Inspect kernel crash logs to identify the faulting driver.',
              nextStepId: 'step-sw-identify-driver',
              feedback: 'Exact step! System Event ID 1001 records: "The computer has rebooted from a bugcheck: 0x0000000a (IRQL_NOT_LESS_OR_EQUAL). A dump was saved in: C:\\Windows\\MEMORY.DMP."'
            },
            {
              id: 'c-run-antivirus',
              label: 'Run a 6-hour full antivirus scan',
              actionDescription: 'Scan for viruses.',
              isFatal: true,
              feedback: 'Ineffective / Wasted time: IRQL_NOT_LESS_OR_EQUAL is an operating system driver memory exception, not a virus!'
            }
          ]
        },

        'step-sw-identify-driver': {
          id: 'step-sw-identify-driver',
          title: 'Step 2: Establish Theory of Probable Cause',
          scenarioText: 'Jordan installed a third-party beta GPU driver last weekend, and the crash specifically occurs when the GPU is stressed during 4K rendering. What is your theory?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-faulty-beta-gpu-driver',
              label: 'Theory: The unstable beta GPU graphics driver is attempting an illegal kernel memory access',
              actionDescription: 'Formulate theory that the recent beta driver installation is responsible.',
              nextStepId: 'step-sw-rollback-driver',
              feedback: 'Spot on! Beta graphics drivers frequently introduce memory leaks and illegal kernel pointer references leading directly to IRQL bugchecks.'
            },
            {
              id: 'c-replace-power-cord',
              label: 'Theory: The external wall AC power cord is loose',
              actionDescription: 'Blame the power cord.',
              isFatal: true,
              feedback: 'Incorrect: A loose power cord causes instant black screen power loss, NOT an IRQL Blue Screen crash dump!'
            }
          ]
        },

        'step-sw-rollback-driver': {
          id: 'step-sw-rollback-driver',
          title: 'Step 3 & 4: Test Theory & Implement Solution',
          scenarioText: 'You open Device Manager -> Display adapters -> Properties -> Driver tab. How do you resolve this driver defect?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-rollback-whql-driver',
              label: 'Click "Roll Back Driver" (or perform clean install of stable WHQL certified studio driver) and run FurMark/Premiere stress test',
              actionDescription: 'Restore verified WHQL certified driver and stress test stability.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! You rolled back to the certified WHQL driver. Jordan rendered 4K video for 45 minutes with zero crashes, smooth scrubbing, and rock-solid stability.'
            },
            {
              id: 'c-disable-display-adapter',
              label: 'Disable the display adapter completely in Device Manager and run on Microsoft Basic Display Driver',
              actionDescription: 'Disable GPU acceleration.',
              isFatal: true,
              feedback: 'Hazardous / Unacceptable: Basic display adapter disables all GPU rendering acceleration, making professional 4K video editing impossible.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'sw-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Core 2 Software Troubleshooting Assessment',
      subtitle: 'CompTIA 220-1102 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 2 Software Troubleshooting Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'sw-q1',
          question: 'According to the CompTIA 7-step malware removal procedure, which step must be executed immediately AFTER identifying malware symptoms and BEFORE disabling System Restore?',
          options: [
            'Educate the end user',
            'Quarantine the infected system (disconnect network)',
            'Reformat the hard drive',
            'Schedule nightly scans'
          ],
          correctAnswer: 1,
          explanation: 'Step 2 is to Quarantine the infected system (disconnect from the network) to prevent malware from spreading laterally across the LAN or communicating with Command and Control servers.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 3.1'
        },
        {
          id: 'sw-q2',
          question: 'Why does the CompTIA malware procedure specifically mandate disabling System Restore in Step 3 before cleaning the computer?',
          options: [
            'System Restore slows down the internet connection',
            'Malware and rootkits can embed copies of themselves into previous restore points and reinfect the PC later',
            'System Restore deletes the antivirus software',
            'System Restore changes the computer password'
          ],
          correctAnswer: 1,
          explanation: 'Disabling System Restore purges all existing system snapshots, ensuring that infected files or rootkits cannot be resurrected if a user performs a system restore in the future.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 3.1'
        },
        {
          id: 'sw-q3',
          question: 'A computer crashes with a Blue Screen of Death. Which Windows Event Log should the technician inspect to review the BugCheck Stop Code and memory dump information?',
          options: [
            'Security Log',
            'Setup Log',
            'System Log (Event ID 1001)',
            'DNS Client Log'
          ],
          correctAnswer: 2,
          explanation: 'The System Event Log records operating system kernel crashes, device driver failures, and BugCheck Stop Codes under Event ID 1001.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 3.2'
        },
        {
          id: 'sw-q4',
          question: 'What is the final step (Step 7) in the CompTIA 7-step malware removal methodology?',
          options: [
            'Reboot the system',
            'Enable System Restore',
            'Educate the end user on prevention',
            'Replace the power supply'
          ],
          correctAnswer: 2,
          explanation: 'Step 7 is to Educate the end user. Training employees on safe web browsing, spotting phishing emails, and security awareness prevents future reinfections.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 3.1'
        }
      ]
    }
  ]
};
