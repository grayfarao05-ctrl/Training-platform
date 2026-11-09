import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_HW_TROUBLESHOOTING_LESSON: LessonData = {
  objectiveId: '5.1',
  courseId: 'a-plus',
  title: 'Hardware & Network Troubleshooting Diagnostics',
  domainName: 'Domain 5.0: Hardware & Network Troubleshooting',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master the CompTIA 6-step troubleshooting methodology, digital multimeter power testing, POST card diagnostics, storage S.M.A.R.T. failures, and display artifact remediation.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'trouble-text-1',
      type: 'text',
      title: 'Technical Briefing: The CompTIA 6-Step Model',
      subtitle: 'Systematic Root-Cause Analysis vs Guesswork',
      estimatedMinutes: 6,
      content: {
        lead: 'CompTIA mandates a rigorous, industry-standard 6-step troubleshooting process. Effective field technicians do not guess or swap parts blindly; they follow an evidence-based diagnostic methodology to resolve complex hardware, power, storage, and connectivity defects.',
        sections: [
          {
            heading: 'The CompTIA 6-Step Troubleshooting Process',
            body: [
              'Step 1: Identify the Problem. Gather information, question users, identify user changes, perform backups before making changes, and inquire about environmental symptoms.',
              'Step 2: Establish a Theory of Probable Cause. Question the obvious, consider multiple approaches, and research knowledge base articles.',
              'Step 3: Test the Theory to Determine Cause. Once confirmed, determine next steps. If theory is not confirmed, establish a new theory or escalate.',
              'Step 4: Establish a Plan of Action and Implement the Solution. Resolve the problem while anticipating potential side effects.',
              'Step 5: Verify Full System Functionality and Implement Preventive Measures.',
              'Step 6: Document Findings, Actions, and Outcomes.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Step 1 Backup Rule',
              content: 'In Step 1 (Identify the Problem), always perform or verify a backup of the client’s data before altering system configuration, reformatting drives, or performing invasive repairs!'
            }
          },
          {
            heading: 'Diagnostic Tools: Multimeters, Loopback Plugs, & POST Cards',
            body: [
              'Digital Multimeters (DMM) measure AC/DC voltage, resistance (continuity), and current. When diagnosing a dead PC, probe the 24-pin ATX connector to verify +12V (Yellow wires), +5V (Red wires), and +3.3V (Orange wires).',
              'POST Diagnostic Cards read two-digit hexadecimal debug codes output by the motherboard BIOS during startup, identifying whether failure occurred at CPU initialization, memory detection, or GPU enumeration.',
              'Loopback plugs test the transmit and receive circuitry of RJ-45 Ethernet ports to verify physical NIC hardware integrity without needing an active network cable.'
            ]
          }
        ],
        technicalTerms: [
          { term: 'S.M.A.R.T.', definition: 'Self-Monitoring, Analysis and Reporting Technology; firmware monitoring hard drive predictive failure metrics.' },
          { term: 'POST', definition: 'Power-On Self-Test; initial diagnostic routine executed by UEFI/BIOS firmware on power up.' },
          { term: 'Continuity', definition: 'A complete unbroken path for electrical current flow measured in Ohms (0 Ω).' },
          { term: 'RAID 1 vs 5', definition: 'RAID 1 mirrors two disks (can survive 1 failure); RAID 5 stripes data and parity across 3+ disks (can survive 1 failure).' }
        ],
        keyTakeaways: [
          'Step 1 requires verifying a data backup before making system modifications.',
          'Always test the simple and obvious causes first (loose cables, power switches).',
          'A +12V rail measuring under +11.4V indicates power supply failure.',
          'Documentation (Step 6) creates organizational history and prevents repeat outages.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'trouble-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Diagnostic Toolkit & Multimeter',
      subtitle: 'ATX 24-Pin Pinout, POST Codes, & Loopback Testing',
      estimatedMinutes: 8,
      diagramId: 'multimeter-diagnostic',
      diagramTitle: 'Hardware Diagnostic Toolkit & Voltage Reference',
      description: 'Click each diagnostic probe and instrument to view nominal voltages, wire color codes, and failure thresholds.',
      hotspots: [
        {
          id: 'probe-12v',
          x: 25,
          y: 28,
          name: '+12V DC Rail (Yellow Wire)',
          category: 'High-Current Power Rail',
          shortDescription: 'Powers CPU VRM, PCIe graphics cards, cooling fans, and spindle drive motors.',
          fullSpecs: '+12.0V Nominal (Allowed range: +11.4V to +12.6V). Measured with Red probe on Yellow wire, Black probe on Black Ground (COM).',
          troubleshootingNote: 'Symptom: System powers off during 3D gaming or intense compilation if voltage drops under 11.4V.',
          examRelevance: 'CompTIA tests knowing Yellow wire = +12V DC on standard ATX power harnesses.'
        },
        {
          id: 'probe-5v',
          x: 45,
          y: 28,
          name: '+5V DC Rail (Red Wire)',
          category: 'Logic Power Rail',
          shortDescription: 'Powers legacy digital logic, SATA drive circuit boards, and standard USB ports.',
          fullSpecs: '+5.0V Nominal (Allowed range: +4.75V to +5.25V).',
          troubleshootingNote: 'Symptom: USB devices intermittently disconnect or internal SATA drives fail to enumerate.',
          examRelevance: 'Red wire = +5V DC.'
        },
        {
          id: 'probe-3v3',
          x: 65,
          y: 28,
          name: '+3.3V DC Rail (Orange Wire)',
          category: 'Semiconductor Logic Rail',
          shortDescription: 'Direct low-voltage power for M.2 NVMe SSDs, PCIe bus logic, and motherboard chipsets.',
          fullSpecs: '+3.3V Nominal (Allowed range: +3.135V to +3.465V).',
          troubleshootingNote: 'Symptom: High NVMe drive read errors or memory controller instabilities.',
          examRelevance: 'Orange wire = +3.3V DC.'
        },
        {
          id: 'ps-on',
          x: 82,
          y: 28,
          name: 'PS_ON# Power Switch Lead (Green Wire)',
          category: 'Control Signal',
          shortDescription: 'Active-low signal wire that tells the PSU to turn on main DC power outputs.',
          fullSpecs: 'Pin 16 on 24-pin ATX. Normally pulled up to +5V; shorting Pin 16 (Green) to any Ground (Black) manually starts the PSU.',
          troubleshootingNote: 'Symptom: Useful for paperclip test to verify if a power supply can spin its fan without being plugged into a motherboard.',
          examRelevance: 'Technicians use a PSU tester or paperclip jumper on PS_ON to isolate dead power supplies.'
        },
        {
          id: 'post-hex',
          x: 50,
          y: 75,
          name: 'POST Debug 2-Digit Hex Display',
          category: 'Motherboard Diagnostic Display',
          shortDescription: 'Displays real-time hardware initialization state during early boot.',
          fullSpecs: '7-Segment dual LED readout. Code 00 = CPU dead; Code 55 = Memory not detected; Code AA = Normal OS boot.',
          troubleshootingNote: 'Symptom: System stuck at Code 55 indicates reseating memory or bent socket pins.',
          examRelevance: 'Enables precise component isolation when the monitor remains blank with no video output.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the wire color and voltage rail responsible for powering discrete graphics cards and CPU VRMs.',
          targetHotspotId: 'probe-12v',
          hint: 'Look for the +12V DC rail with yellow wires.'
        },
        {
          prompt: 'Identify the active-low signal lead (Pin 16) used to turn on the power supply.',
          targetHotspotId: 'ps-on',
          hint: 'Look for the green PS_ON control wire on the right.'
        },
        {
          prompt: 'Locate the motherboard 2-digit LED debug display that pinpoints failed boot hardware when the screen is blank.',
          targetHotspotId: 'post-hex',
          hint: 'Look in the lower center for the hex readout.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'trouble-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Mechanical Hard Drive Anatomy',
      subtitle: 'Platters, Spindle Motor, Voice Coil Actuator, & Read/Write Heads',
      estimatedMinutes: 8,
      modelId: 'hard-drive-teardown',
      modelTitle: '3.5-Inch Mechanical Hard Drive (HDD) Teardown',
      description: 'Inspect the precision mechanical interior of a hard disk drive. Drag the slider to explode the top cast cover and observe the platter stack, actuator arm, and read/write heads.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'hdd-cover',
          name: 'Top Cast Aluminum Dust Cover',
          category: 'Hermetic Enclosure',
          color: '#64748b',
          shape: 'box',
          dimensions: [6.0, 0.4, 8.5],
          defaultPosition: [0, 1.4, 0],
          explodedPosition: [0, 4.5, 0],
          description: 'Sealed metal lid with breathable membrane filter keeping microscopic airborne dust out of the platter chamber.',
          specs: 'Secured by 6x Torx T8 screws. DANGER: Opening in non-cleanroom air ruins the drive within minutes.',
          failureSymptoms: 'Punctured breathe hole filter causing platter contamination and head crash.'
        },
        {
          id: 'platters',
          name: 'Magnetic Platter Stack (7,200 RPM)',
          category: 'Storage Media',
          color: '#38bdf8',
          shape: 'cylinder',
          dimensions: [5.2, 0.8, 5.2],
          defaultPosition: [0, 0.2, -1.2],
          explodedPosition: [0, 1.8, -1.2],
          description: 'Spun aluminum or glass disks coated with cobalt alloy thin-film magnetic storage layers.',
          specs: '7,200 Revolutions Per Minute, perpendicular magnetic recording (PMR), microscopic track pitch.',
          failureSymptoms: 'Scratched concentric ring grooves caused by physical head crash drops.'
        },
        {
          id: 'actuator-arm',
          name: 'Voice Coil Actuator & Read/Write Heads',
          category: 'Precision Mechanics',
          color: '#eab308',
          shape: 'box',
          dimensions: [1.2, 0.5, 4.0],
          defaultPosition: [1.8, 0.4, 1.5],
          explodedPosition: [3.2, 1.8, 2.5],
          description: 'Electromagnetic arm swinging giant magnetoresistive (GMR) read heads across the platters at high speed.',
          specs: 'Flies on a cushion of air only 5 nanometers above the spinning platter surface.',
          failureSymptoms: 'Audible repetitive mechanical "Click of Death" when the arm repeatedly slams against the limiter stop.'
        },
        {
          id: 'spindle-motor',
          name: 'Hydrodynamic Bearing Spindle Motor',
          category: 'Drive Mechanism',
          color: '#475569',
          shape: 'cylinder',
          dimensions: [2.0, 1.0, 2.0],
          defaultPosition: [0, -0.6, -1.2],
          explodedPosition: [0, -2.5, -1.2],
          description: 'Precision brushless 12V DC motor spinning the platter stack at continuous rotational velocity.',
          specs: 'Fluid dynamic bearing (FDB) reducing acoustic vibration and friction.',
          failureSymptoms: 'Seized motor bearing resulting in high-pitched whining or refusal to spin up.'
        },
        {
          id: 'logic-pcb',
          name: 'SATA Controller PCB & Cache RAM',
          category: 'Drive Electronics',
          color: '#10b981',
          shape: 'board',
          dimensions: [5.8, 0.2, 8.0],
          defaultPosition: [0, -1.2, 0],
          explodedPosition: [0, -4.5, 0],
          description: 'Underside circuit board containing motor controller, read channel DSP, and 256MB DRAM cache.',
          specs: 'SATA 6 Gbps interface (7-pin data + 15-pin power), S.M.A.R.T. monitoring engine.',
          failureSymptoms: 'TVS diode short circuit from power surge completely preventing the PC from turning on.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'trouble-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: S.M.A.R.T. Bad Sector Reallocation',
      subtitle: 'Predictive Disk Degradation & Spare Sector Mapping',
      estimatedMinutes: 6,
      animationType: 'smart-drive-sectors',
      description: 'Watch how hard drive microcode automatically detects unreadable sectors, marks them bad, and remaps user data to a reserved spare track.',
      steps: [
        {
          stepNumber: 1,
          label: 'READ ERROR DETECTION',
          description: 'The drive read head attempts to read Sector #48120. Error Correction Code (ECC) algorithm fails after 3 retries.',
          highlightedElement: 'Platter Track 48 & Read Head',
          metrics: { label: 'Sector Status', value: 'Current Pending Sector' }
        },
        {
          stepNumber: 2,
          label: 'SPARE TRACK REALLOCATION',
          description: 'The internal drive firmware flags Sector #48120 as defective and reallocates the logical block address (LBA) to a reserved spare sector on an inner track.',
          highlightedElement: 'Internal G-List Defect Table',
          metrics: { label: 'Reallocated Sectors', value: '+1 Count Added' }
        },
        {
          stepNumber: 3,
          label: 'S.M.A.R.T. ATTRIBUTE THRESHOLD EXCEEDED',
          description: 'As bad sectors accumulate, S.M.A.R.T. Attribute 05 (Reallocated Sector Count) passes the manufacturer critical threshold.',
          highlightedElement: 'S.M.A.R.T. Firmware Log',
          metrics: { label: 'Health Status', value: 'WARNING: IMMINENT FAILURE' }
        },
        {
          stepNumber: 4,
          label: 'BIOS PREDICTIVE WARNING ALERT',
          description: 'At system boot, the UEFI firmware queries S.M.A.R.T. state and halts with: "SMART Failure Predicted on Hard Disk. Back up your data and replace the drive. Press F1 to continue."',
          highlightedElement: 'UEFI BIOS Pre-Boot Display',
          metrics: { label: 'Technician Action', value: 'IMMEDIATE BACKUP' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'trouble-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Multimeter ATX Voltage Testing',
      subtitle: 'Probing +12V, +5V, +3.3V, & Power Good Signals',
      estimatedMinutes: 8,
      labTitle: 'Digital Multimeter Power Supply Rail Analysis',
      goal: 'Diagnose a suspected faulty power supply by measuring DC voltages across the 24-pin ATX connector under load.',
      hardwareSubject: 'Digital Multimeter & 24-Pin ATX Connector',
      prerequisites: [
        'Digital Multimeter set to DC Volts (20V range)',
        'ATX power load resistor / test jumper',
        'Insulated multimeter test probes'
      ],
      steps: [
        {
          id: 'step-dmm-set',
          instruction: 'Set Digital Multimeter selector dial to DC Voltage (20V range)',
          detail: 'Turn the rotary dial to DCV (symbol: V with a solid and dashed line). Do not select AC voltage.',
          actionType: 'configure-multimeter',
          feedbackOnSuccess: 'Multimeter configured to DC Volts 20V range. Display reads 0.00 V.'
        },
        {
          id: 'step-dmm-ground',
          instruction: 'Insert Black test probe into COM and Ground (Black wire Pin 17)',
          detail: 'Connect the negative reference probe to an electrical ground pin on the 24-pin connector.',
          actionType: 'connect-ground',
          feedbackOnSuccess: 'Ground reference established with COM port on Pin 17.'
        },
        {
          id: 'step-dmm-12v',
          instruction: 'Probe Pin 10 (+12V Yellow Wire) and verify voltage tolerance',
          detail: 'Touch the Red probe to Pin 10. The reading must be between +11.4V and +12.6V.',
          actionType: 'test-12v-rail',
          feedbackOnSuccess: 'Reading: +12.15 Volts! Within healthy ±5% tolerance.'
        },
        {
          id: 'step-dmm-5v',
          instruction: 'Probe Pin 4 (+5V Red Wire) and verify voltage tolerance',
          detail: 'Touch the Red probe to Pin 4. The reading must be between +4.75V and +5.25V.',
          actionType: 'test-5v-rail',
          feedbackOnSuccess: 'Reading: +5.04 Volts! Within healthy ±5% tolerance.'
        },
        {
          id: 'step-dmm-3v',
          instruction: 'Probe Pin 1 (+3.3V Orange Wire) and verify voltage tolerance',
          detail: 'Touch the Red probe to Pin 1. The reading must be between +3.14V and +3.47V.',
          actionType: 'test-3v-rail',
          feedbackOnSuccess: 'Reading: +3.32 Volts! Power supply rails verified 100% healthy under electrical testing.'
        }
      ],
      successMessage: 'All power supply rails verified within exact ±5% CompTIA tolerances! Zero voltage sags detected.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'trouble-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: The Clicking Drive of Death',
      subtitle: 'CompTIA Storage Troubleshooting Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Desktop Freezes with Loud Repetitive Clicking Noises',
      clientName: 'Elena Rostova, Chief Accountant',
      deviceModel: 'Accounting Desktop Workstation',
      initialProblemDescription: 'Elena reports: "My computer was freezing every time I saved our payroll spreadsheet. Now when I turn it on, it makes a rhythmic metallic clicking noise every 2 seconds, and the screen is stuck on a black screen saying Reboot and Select proper Boot device."',
      startStepId: 'step-storage-identify',
      steps: {
        'step-storage-identify': {
          id: 'step-storage-identify',
          title: 'Step 1: Identify the Problem & Sound Analysis',
          scenarioText: 'You listen closely to the computer. A distinct "click... click... click... whirrr" emanates from the internal 3.5-inch hard drive. What is your diagnosis?',
          customerStatement: 'Please tell me my payroll files are safe; they represent 3 months of audit data.',
          systemState: {
            power: 'on',
            screen: 'blank',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-click-of-death',
              label: 'Theory: The mechanical hard drive actuator arm has experienced head failure (Click of Death)',
              actionDescription: 'Recognize the classic acoustic symptom of read/write head assembly failure.',
              nextStepId: 'step-storage-backup-priority',
              feedback: 'Exact diagnosis! The repetitive clicking sound indicates the drive head is seeking track zero, failing to read the servo sector, hitting the mechanical limiter, and retrying.'
            },
            {
              id: 'c-run-chkdsk',
              label: 'Reboot with Windows USB and run intensive "chkdsk /r /f" scan on the clicking drive',
              actionDescription: 'Force the failing mechanical drive into a multi-hour stress test.',
              isFatal: true,
              feedback: 'CATASTROPHIC ACTION: Running chkdsk on a physically clicking drive forces failing heads across fragile platters, gouging magnetic media and permanently destroying unrecoverable payroll data!'
            }
          ]
        },

        'step-storage-backup-priority': {
          id: 'step-storage-backup-priority',
          title: 'Step 2 & 4: Plan of Action & Data Preservation',
          scenarioText: 'Since the drive is physically failing and has critical payroll data, what is your immediate plan of action?',
          systemState: {
            power: 'on',
            screen: 'blank',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-power-off-clone',
              label: 'Power down immediately, install new NVMe SSD, restore data from the overnight cloud backup, or send drive to cleanroom lab if needed',
              actionDescription: 'Stop platter spinning immediately to prevent further surface gouging.',
              isResolved: true,
              feedback: 'PERFECT PROFESSIONAL RESOLUTION! Powering off stopped platter damage. You verified the company NAS cloud backup from last night is 100% intact. You installed a fast NVMe SSD, restored Windows and payroll data, and had Elena back up and running within 45 minutes.'
            },
            {
              id: 'c-freeze-drive',
              label: 'Put the hard drive into the office breakroom freezer for 4 hours',
              actionDescription: 'Rely on internet myth of freezing drives.',
              isFatal: true,
              feedback: 'Unprofessional / Hazardous: Freezing causes internal condensation moisture on platters, causing instant head crashes and rust.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'trouble-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Domain 5.0 Troubleshooting Assessment',
      subtitle: 'CompTIA 220-1101 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Hardware Troubleshooting Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'tr-q1',
          question: 'According to the CompTIA 6-step troubleshooting methodology, which action is mandatory during Step 1 (Identify the Problem) before making any system changes?',
          options: [
            'Order replacement parts',
            'Perform or verify a backup of user data',
            'Reboot the system three times',
            'Flash the motherboard BIOS'
          ],
          correctAnswer: 1,
          explanation: 'Before making any system alterations or troubleshooting repairs in Step 1, technicians must verify or perform a backup of the client’s data to prevent accidental data loss.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.1'
        },
        {
          id: 'tr-q2',
          question: 'A computer boots to a black screen, but the motherboard displays hex code "55" on its internal two-digit debug display. What does this indicate?',
          options: [
            'Normal OS boot completed',
            'Memory (RAM) was not detected or failed initialization',
            'Power supply +12V rail is inverted',
            'Keyboard cable is disconnected'
          ],
          correctAnswer: 1,
          explanation: 'POST code 55 is the standard AMI debug code indicating that system memory was not detected, unseated, or failed initialization.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.2'
        },
        {
          id: 'tr-q3',
          question: 'A technician hears a loud, rhythmic metallic clicking sound from inside a desktop computer followed by a "No Bootable Device" error. What is the most probable cause?',
          options: [
            'CPU fan blade hitting a wire',
            'Mechanical hard drive head assembly failure (Click of Death)',
            'SATA cable is 1 inch too long',
            'Power supply is in eco mode'
          ],
          correctAnswer: 1,
          explanation: 'A rhythmic metallic clicking sound from a hard disk drive indicates that the read/write heads are failing to detect servo tracks and are resetting against the limiter stop, signaling imminent or complete mechanical failure.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.3'
        },
        {
          id: 'tr-q4',
          question: 'When measuring a standard ATX 24-pin power supply with a digital multimeter, what is the nominal voltage of the yellow wires?',
          options: [
            '+3.3V DC',
            '+5.0V DC',
            '+12.0V DC',
            '-12.0V DC'
          ],
          correctAnswer: 2,
          explanation: 'In the standard ATX color coding, Yellow wires are +12.0V DC, Red wires are +5.0V DC, and Orange wires are +3.3V DC.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.2'
        }
      ]
    }
  ]
};
