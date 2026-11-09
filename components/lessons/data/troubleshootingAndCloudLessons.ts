import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_5_1_LESSON: LessonData = {
  objectiveId: '5.1',
  courseId: 'a-plus',
  title: 'Motherboard, RAM, CPU & Power Diagnostic Protocols',
  domainName: 'Domain 5.0: Hardware & Network Troubleshooting',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Apply the official CompTIA 6-step troubleshooting methodology to diagnose motherboard failures, POST beep codes, power supply rails, and thermal shutdowns.',
  sections: [
    {
      id: 'sec-text-5-1',
      type: 'text',
      title: 'Technical Briefing: CompTIA 6-Step Troubleshooting Methodology',
      subtitle: 'Systematic Hardware Triage, Multimeter Testing, and Root Cause Analysis',
      estimatedMinutes: 6,
      content: {
        lead: 'CompTIA requires technicians to follow a strict, repeatable 6-step troubleshooting process. Random guessing or replacing parts indiscriminately wastes time and risks introducing secondary defects.',
        sections: [
          {
            heading: 'The CompTIA 6-Step Troubleshooting Process',
            body: [
              '1. Identify the problem: Question the user, identify recent changes, perform environmental backups, and review system logs.',
              '2. Establish a theory of probable cause: Question the obvious. If necessary, conduct internal or external research based on symptoms.',
              '3. Test the theory to determine cause: Once confirmed, determine the next steps to resolve the problem. If the theory is not confirmed, re-establish a new theory or escalate.',
              '4. Establish a plan of action to resolve the problem and implement the solution.',
              '5. Verify full system functionality and, if applicable, implement preventive measures.',
              '6. Document findings, actions, and outcomes: Record the root cause, parts replaced, and preventive advice in the ticketing system.'
            ],
            bulletPoints: [
              'Continuous Beeping / Repeating Short Beeps: Power Supply Unit (PSU) or memory (RAM) failure preventing POST completion.',
              'One Long Beep followed by Two or Three Short Beeps: Video / GPU failure or unseated display card.',
              'Distended / Bulging Capacitors ("Capacitor Plague"): Electrolytic capacitors leaking electrolyte on the motherboard; requires motherboard replacement.',
              'Multimeter Pinout Standard: Yellow wire = +12V DC, Red wire = +5V DC, Orange wire = +3.3V DC, Black wire = Ground.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Step 1 Backup Requirement',
              content: 'In Step 1 (Identify the Problem), always perform a backup of user data before making any software or hardware changes that could jeopardize the storage drive!'
            }
          }
        ],
        technicalTerms: [
          { term: 'POST', definition: 'Power-On Self-Test; initial diagnostic firmware routine executed by the BIOS/UEFI immediately after power is applied.' },
          { term: 'BSOD', definition: 'Blue Screen of Death; Windows kernel stop error triggered by hardware failure or faulty device drivers.' },
          { term: 'Multimeter', definition: 'Diagnostic electrical meter used to measure AC/DC voltage, resistance (continuity), and electrical shorts.' },
          { term: 'CMOS Jumper', definition: 'Physical 3-pin motherboard header used to clear BIOS settings and password by shorting pins 2-3.' }
        ],
        keyTakeaways: [
          'Step 1 requires questioning the user and verifying a data backup exists.',
          'Step 5 requires verifying full system functionality before closing the ticket.',
          'Step 6 requires comprehensive documentation of findings and solutions.'
        ]
      }
    },
    {
      id: 'sec-diagram-5-1',
      type: 'diagram',
      title: 'Interactive Diagram: 24-Pin ATX Power Supply Connector Pinout',
      subtitle: 'Voltage Rails (+12V, +5V, +3.3V) & Multimeter Testing Points',
      estimatedMinutes: 8,
      diagramId: 'laptop-motherboard',
      diagramTitle: 'ATX 24-Pin Power Supply Voltage Rail Diagnostics',
      description: 'Click power supply pin nodes to inspect expected DC voltages, color codes, and failure tolerances (±5%).',
      hotspots: [
        {
          id: 'pin-12v',
          x: 35,
          y: 25,
          name: '+12V Rail (Yellow Wires)',
          category: 'Primary High-Current Rail',
          shortDescription: 'Powers CPU VRMs, GPU PCIe slots, and motor fans.',
          fullSpecs: '+12.0V DC (acceptable range: +11.4V to +12.6V). Tested across yellow wire and black ground.',
          troubleshootingNote: 'Symptom: If multimeter reads below +11.4V under load, system experiences random reboots and GPU driver crashes.',
          examRelevance: 'CompTIA tests knowing Yellow = +12V for motor spindles and processor power.'
        },
        {
          id: 'pin-5v',
          x: 50,
          y: 25,
          name: '+5V Rail (Red Wires)',
          category: 'Logic Power Rail',
          shortDescription: 'Powers USB ports, SATA controller logic, and optical drives.',
          fullSpecs: '+5.0V DC (acceptable range: +4.75V to +5.25V).',
          troubleshootingNote: 'Symptom: USB devices intermittently disconnect or external hard drives fail to initialize.',
          examRelevance: 'Red wire corresponds to +5V logic voltage.'
        },
        {
          id: 'pin-3v3',
          x: 65,
          y: 25,
          name: '+3.3V Rail (Orange Wires)',
          category: 'Semiconductor Rail',
          shortDescription: 'Powers memory modules, PCIe auxiliary slots, and motherboard chipsets.',
          fullSpecs: '+3.3V DC (acceptable range: +3.13V to +3.47V).',
          troubleshootingNote: 'Symptom: Memory parity errors and PCIe bus initialization freezes.',
          examRelevance: 'Orange wire corresponds to +3.3V low-voltage semiconductor rails.'
        },
        {
          id: 'pin-pwr-on',
          x: 45,
          y: 60,
          name: 'PS_ON# Power Switch Pin (Green Wire)',
          category: 'Control Line',
          shortDescription: 'Active-low signal pulled to ground to start the power supply.',
          fullSpecs: 'Connect green wire (Pin 16) to any black ground wire with a paperclip to test PSU without a motherboard (the "Paperclip Test").',
          troubleshootingNote: 'Symptom: If fan does not spin when PS_ON is grounded, the power supply unit is dead.',
          examRelevance: 'Standard bench test procedure for diagnosing dead power supplies.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Select the color wire that carries +12V DC power to the processor and cooling motors.',
          targetHotspotId: 'pin-12v',
          hint: 'Yellow wires carry +12V.'
        },
        {
          prompt: 'Identify the control pin that allows a technician to test a power supply by bridging it to ground.',
          targetHotspotId: 'pin-pwr-on',
          hint: 'Green wire (PS_ON).'
        }
      ]
    },
    {
      id: 'sec-3d-5-1',
      type: '3d-model',
      title: 'Interactive 3D Hardware: ATX Motherboard Diagnostic Inspection',
      subtitle: 'Capacitors, VRMs, CPU Socket, and Debug 7-Segment Display',
      estimatedMinutes: 8,
      modelId: 'laptop-teardown',
      modelTitle: '3D Motherboard Inspection View',
      description: 'Inspect physical defect indicators including bulging capacitors, bent CPU pins, and loose 24-pin harnesses.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'atx-pcb',
          name: 'Full ATX Motherboard PCB',
          category: 'Motherboard Base',
          color: '#0f172a',
          shape: 'board',
          dimensions: [10, 0.2, 8],
          defaultPosition: [0, -1, 0],
          explodedPosition: [0, -2, 0],
          description: '12x9.6 inch ATX printed circuit board with multi-layer copper ground planes and power traces.',
          specs: 'Standard 9 standoff mounting holes. Failure to use standoffs causes direct short circuit to metal case tray.',
          failureSymptoms: 'Board completely dead; shorted to case chassis.'
        },
        {
          id: 'vrm-heatsink',
          name: 'Voltage Regulator Module (VRM) Heatsinks',
          category: 'Power Conversion',
          color: '#38bdf8',
          shape: 'box',
          dimensions: [3, 0.8, 1.2],
          defaultPosition: [-2, 0, -2.5],
          explodedPosition: [-2, 1.5, -2.5],
          description: 'Aluminum finned heatsinks cooling MOSFETs that step +12V down to ~1.2V core voltage for the CPU.',
          specs: 'Operates up to 105°C. Degradation causes thermal throttling under heavy CPU computation.',
          failureSymptoms: 'CPU drops to 800 MHz and stays locked at low multiplier.'
        },
        {
          id: 'capacitors',
          name: 'Solid-State & Electrolytic Capacitors',
          category: 'Voltage Smoothing',
          color: '#d97706',
          shape: 'cylinder',
          dimensions: [0.8, 1, 0.8],
          defaultPosition: [-2.5, 0.2, 0],
          explodedPosition: [-3.8, 1.5, 0],
          description: 'Cylindrical capacitors smoothing out voltage ripple from the power supply.',
          specs: 'Electrolytic capacitors can bulge or leak brown crusty residue at the top score marks (Capacitor Plague).',
          failureSymptoms: 'Spontaneous reboot under load; failure to complete POST.'
        },
        {
          id: 'debug-led',
          name: '2-Digit Hex POST Diagnostic Display',
          category: 'Firmware Telemetry',
          color: '#ef4444',
          shape: 'box',
          dimensions: [1.2, 0.3, 0.8],
          defaultPosition: [3.5, 0.2, 3],
          explodedPosition: [3.5, 1.8, 3],
          description: '7-segment LED display showing real-time hexadecimal POST codes as motherboard initializes.',
          specs: 'Outputs port 80h diagnostic codes (e.g. Code 55 = Memory not detected; Code 00 = CPU not initialized).',
          failureSymptoms: 'Stops at Code 55 when RAM stick is improperly seated.'
        }
      ]
    },
    {
      id: 'sec-anim-5-1',
      type: 'animation',
      title: 'Dynamic Demonstration: POST (Power-On Self-Test) Execution Flow',
      subtitle: 'Firmware Verification Sequence from Cold Boot to OS Handoff',
      estimatedMinutes: 5,
      animationType: 'power-delivery',
      description: 'Watch the step-by-step firmware validation process as the BIOS/UEFI checks hardware components before booting Windows.',
      steps: [
        {
          stepNumber: 1,
          label: 'Power Good Signal & CPU Reset',
          description: 'The PSU verifies internal voltages are stable and sends the "Power Good" (+5V) signal. The CPU releases its reset line and executes the first instruction at FFFF0h.',
          highlightedElement: 'PSU Power Good -> CPU Reset',
          metrics: { label: 'Signal', value: 'PWR_OK (+5V)' }
        },
        {
          stepNumber: 2,
          label: 'System Memory (RAM) Sizing & Verification',
          description: 'The UEFI initializes the memory controller and queries SPD EEPROM chips on each DIMM. If RAM is unseated, continuous beep codes sound.',
          highlightedElement: 'Memory Controller & DIMM Check',
          metrics: { label: 'RAM Status', value: 'VERIFIED' }
        },
        {
          stepNumber: 3,
          label: 'Video Adapter Initialization',
          description: 'The firmware initializes the PCIe graphics adapter and displays the motherboard splash screen. If video fails, one long and two short beeps sound.',
          highlightedElement: 'PCIe GPU / VRAM Check',
          metrics: { label: 'Display Output', value: 'INITIALIZED' }
        },
        {
          stepNumber: 4,
          label: 'Storage Enumeration & Boot Handoff',
          description: 'The UEFI scans NVMe and SATA drives for the EFI System Partition (ESP), loads the Windows Boot Manager, and hands execution to the operating system.',
          highlightedElement: 'Bootloader Handoff',
          metrics: { label: 'OS State', value: 'LOADING' }
        }
      ]
    },
    {
      id: 'sec-lab-5-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Multimeter Power Supply Rail Testing',
      subtitle: 'Diagnosing Suspect Power Supplies',
      estimatedMinutes: 8,
      labTitle: 'Bench Multimeter Power Supply Verification Lab',
      goal: 'Use a digital multimeter to test DC voltages on the 24-pin ATX harness and identify a failing voltage rail.',
      hardwareSubject: 'ATX 650W Power Supply',
      prerequisites: [
        'Digital Multimeter set to DC Volts (20V range)',
        'Paperclip / jumper bridge wire'
      ],
      steps: [
        {
          id: 't-step-1',
          instruction: 'Disconnect All Internal Motherboard & Drive Cables',
          detail: 'Isolate the power supply completely from the motherboard to avoid false readings or component damage.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Power supply completely isolated from PC components.'
        },
        {
          id: 't-step-2',
          instruction: 'Bridge PS_ON (Pin 16 Green) to Ground (Pin 17 Black)',
          detail: 'Insert jumper into the harness to trigger the power supply to turn on.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'PSU fan spins up! The internal switching circuitry is powered.'
        },
        {
          id: 't-step-3',
          instruction: 'Test Yellow Wire Pin for +12V DC Rail',
          detail: 'Insert black probe into ground and red probe into yellow pin. Multimeter reads: 12.15V DC (PASS).',
          actionType: 'insert-ram',
          feedbackOnSuccess: '+12V rail is healthy within tolerance (12.15V).'
        },
        {
          id: 't-step-4',
          instruction: 'Test Red Wire Pin for +5V DC Rail',
          detail: 'Probe the red wire pin. Multimeter reads: 5.05V DC (PASS).',
          actionType: 'lock-clips',
          feedbackOnSuccess: '+5V rail is healthy within tolerance (5.05V).'
        },
        {
          id: 't-step-5',
          instruction: 'Test Orange Wire Pin for +3.3V DC Rail',
          detail: 'Probe the orange wire pin. Multimeter reads: 2.70V DC (FAIL - Voltage drop detected!).',
          actionType: 'verify-post',
          feedbackOnSuccess: 'Root cause identified! The +3.3V rail has dropped to 2.70V, causing memory bus crashes. PSU must be replaced.'
        }
      ],
      successMessage: 'Superb diagnostic work! You used a digital multimeter to pinpoint the exact degraded voltage rail.',
      xpReward: 250
    },
    {
      id: 'sec-scenario-5-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: Continuous POST Beep Loop & Black Screen',
      subtitle: 'CompTIA 6-Step Hardware Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Workstation Refuses to Boot After Upgrade',
      clientName: 'Alex Carter, Graphic Designer',
      deviceModel: 'Tower Workstation',
      initialProblemDescription: 'User attempted to install extra memory. When powering on, the screen remains pitch black, fans spin at maximum speed, and the system emits a continuous repeating pattern of short beeps without booting.',
      startStepId: 'step-post-triage',
      steps: {
        'step-post-triage': {
          id: 'step-post-triage',
          title: 'Step 1: Identify Problem & Decode Beep Pattern',
          scenarioText: 'The computer emits continuous repeating short beeps. Fans spin, but no display appears. What does this standard AMI/Award BIOS beep code signify?',
          systemState: {
            power: 'post-error',
            screen: 'blank',
            fan: 'max-rpm',
            beepCodes: 'Continuous Repeating Short Beeps'
          },
          diagnosticOptions: [
            {
              id: 'c-ram-unseated',
              label: 'Establish Theory: The newly installed RAM module is unseated or incompatible',
              actionDescription: 'Attribute continuous repeating short beeps to memory failure.',
              nextStepId: 'step-ram-reseat',
              feedback: 'Exact diagnosis! Continuous repeating beeps during POST indicate that system memory was not detected or failed initialization.'
            },
            {
              id: 'c-gpu-replace',
              label: 'Theory: The monitor cable or graphics card is blown',
              actionDescription: 'Blame video card.',
              isFatal: true,
              feedback: 'Incorrect! Video failure produces 1 long and 2-3 short beeps, not continuous beeping. Blaming video wastes time.'
            }
          ]
        },
        'step-ram-reseat': {
          id: 'step-ram-reseat',
          title: 'Step 2: Inspect Hardware & Implement Plan of Action',
          scenarioText: 'You safely unplug power and examine the motherboard. One RAM stick has only one side clip engaged; the other clip is popped open at an angle. How do you resolve this?',
          systemState: {
            power: 'off',
            screen: 'blank',
            fan: 'silent'
          },
          diagnosticOptions: [
            {
              id: 'c-reseat-dual-click',
              label: 'Remove the module, inspect pins for debris, reinstall firmly until BOTH side retention clips snap into place, and reboot',
              actionDescription: 'Reseat memory module with proper physical latching.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! Upon powering on, the motherboard emits a single short beep (POST OK). The BIOS displays 32GB total memory, and Windows boots smoothly.'
            }
          ]
        }
      }
    },
    {
      id: 'sec-quiz-5-1',
      type: 'quiz',
      title: 'Knowledge Check: Hardware Diagnostics & Methodology',
      subtitle: 'CompTIA 220-1101 Domain 5.0 Exam Drill',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Objective 5.1 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'q-5-1-1',
          question: 'According to the official CompTIA 6-step troubleshooting methodology, what is the VERY FIRST action a technician must take when identifying a problem?',
          options: [
            'Question the user, identify symptoms, and determine if changes occurred',
            'Establish a plan of action and order replacement parts',
            'Document findings and outcomes in the ticketing system',
            'Verify full system functionality'
          ],
          correctAnswer: 0,
          explanation: 'Step 1 is "Identify the problem", which requires questioning the user, identifying symptoms, asking about recent changes, and verifying a data backup exists.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.1'
        },
        {
          id: 'q-5-1-2',
          question: 'A computer powers on, the fans spin, but the screen remains black and the motherboard emits a continuous loop of repeating short beeps. Which component is the most likely cause?',
          options: [
            'System Memory (RAM)',
            'Display Cable',
            'Optical CD Drive',
            'Sound Card'
          ],
          correctAnswer: 0,
          explanation: 'Continuous repeating short beeps during the Power-On Self-Test (POST) indicate a memory initialization failure (RAM unseated, damaged, or incompatible).',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.1'
        },
        {
          id: 'q-5-1-3',
          question: 'When using a multimeter to test a power supply 24-pin ATX connector, what voltage should be measured on the YELLOW wires relative to ground?',
          options: [
            '+12V DC',
            '+5V DC',
            '+3.3V DC',
            '-12V DC'
          ],
          correctAnswer: 0,
          explanation: 'Yellow wires carry +12V DC. Red carries +5V DC, and orange carries +3.3V DC.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.1'
        },
        {
          id: 'q-5-1-4',
          question: 'A technician notices several electrolytic capacitors on an older motherboard have bulging tops with dried amber crust. What is this condition called and how is it repaired?',
          options: [
            'Capacitor plague; replace the motherboard',
            'Normal operation; wipe off with alcohol',
            'Overclocking residue; update the BIOS',
            'Thermal expansion; add another case fan'
          ],
          correctAnswer: 0,
          explanation: 'Bulging or leaking capacitors ("capacitor plague") indicate physical hardware failure that causes intermittent crashes. In field environments, the standard solution is replacing the motherboard.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 5.1'
        }
      ]
    }
  ]
};
