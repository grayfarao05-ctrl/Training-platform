import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_HARDWARE_LESSON: LessonData = {
  objectiveId: '3.1',
  courseId: 'a-plus',
  title: 'Motherboard Architecture, CPU Sockets & ATX Power',
  domainName: 'Domain 3.0: Hardware',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master desktop ATX/Micro-ATX motherboards, LGA vs PGA processor sockets, thermal paste application, PCIe 5.0 expansion lanes, and multi-rail power supplies.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'hw-text-1',
      type: 'text',
      title: 'Technical Briefing: Desktop Motherboard Anatomy',
      subtitle: 'Sockets, Chipsets, Bus Lanes, & Power Delivery Rails',
      estimatedMinutes: 6,
      content: {
        lead: 'The motherboard is the printed circuit board foundation connecting the CPU, system memory, high-speed graphics expansion, and storage controllers. Understanding form factors, socket architectures, and voltage regulation modules is essential for CompTIA A+ certification.',
        sections: [
          {
            heading: 'Processor Socket Architectures: LGA vs. PGA',
            body: [
              'Modern desktop processors connect to the motherboard via one of two primary mechanical socket mechanisms: Land Grid Array (LGA) or Pin Grid Array (PGA).',
              'In an LGA socket (predominantly Intel and modern AMD AM5), the fragile spring-loaded contact pins reside on the motherboard socket itself, while the underside of the processor features flat gold contact pads (lands). In a PGA socket (such as legacy AMD AM4), the pins are on the CPU package and insert into tiny socket holes locked by a zero insertion force (ZIF) lever.'
            ],
            bulletPoints: [
              'LGA (Land Grid Array): Pins are in the motherboard socket. Dropping a CPU or tool onto an LGA socket bends motherboard pins.',
              'PGA (Pin Grid Array): Pins are on the CPU substrate. Uses a Zero Insertion Force (ZIF) cam lever to lock.',
              'Form Factors: ATX (12 x 9.6 inches / up to 7 expansion slots), Micro-ATX (9.6 x 9.6 inches / up to 4 slots), Mini-ITX (6.7 x 6.7 inches / 1 slot for small form factor builds).'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: ATX Main Power',
              content: 'The standard modern ATX motherboard power connector is 24 pins (often arranged as 20+4 pins for backward compatibility). The auxiliary 4-pin or 8-pin connector provides dedicated +12V power directly to the CPU VRM circuitry.'
            }
          },
          {
            heading: 'Power Supply Rails & Voltage Tolerances',
            body: [
              'Switched-Mode Power Supplies (SMPS) convert 120V/240V AC mains into three primary DC voltage rails: +12V (motors, fans, GPU, CPU VRM), +5V (legacy logic, SATA drives, USB ports), and +3.3V (M.2 slots, PCI logic, memory controllers).',
              'CompTIA standards dictate a ±5% voltage tolerance on all active positive rails. A +12V rail measuring below +11.4V or above +12.6V under load indicates a failing PSU capacitor bank and must be replaced immediately.'
            ],
            callout: {
              type: 'warning',
              title: 'Safety Warning: PSU Disassembly Prohibited',
              content: 'Technicians must NEVER disassemble the interior casing of a computer power supply. High-voltage electrolytic capacitors store lethal electrical charges for hours or days after AC disconnection.'
            }
          }
        ],
        technicalTerms: [
          { term: 'LGA', definition: 'Land Grid Array; socket where contact pins are on the motherboard.' },
          { term: 'VRM', definition: 'Voltage Regulator Module; steps down +12V to precision low voltage (~1.1V - 1.4V) for the CPU.' },
          { term: 'PCIe 5.0 x16', definition: 'High-speed expansion slot delivering up to 64 GB/s bi-directional throughput for GPUs.' },
          { term: 'ZIF', definition: 'Zero Insertion Force; mechanical lever locking CPU pins without requiring downward pressure.' }
        ],
        keyTakeaways: [
          'LGA has pins on the motherboard; PGA has pins on the CPU chip.',
          'ATX uses a 24-pin main connector and an 8-pin EPS 12V CPU power connector.',
          'Standard voltage rails are +12V, +5V, and +3.3V with a ±5% operational tolerance.',
          'Never open or service the interior of a Power Supply Unit due to lethal capacitor charge.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'hw-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Desktop ATX Motherboard',
      subtitle: 'Component Architecture, VRMs, PCIe Slots, & Headers',
      estimatedMinutes: 8,
      diagramId: 'desktop-motherboard',
      diagramTitle: 'Full ATX Desktop Motherboard Architecture',
      description: 'Click each component area to inspect bus bandwidths, socket orientations, pinouts, and field troubleshooting indicators.',
      hotspots: [
        {
          id: 'lga-socket',
          x: 40,
          y: 25,
          name: 'LGA 1700 Processor Socket',
          category: 'CPU Socket',
          shortDescription: 'Zero Insertion Force socket with metal retention load plate and lever.',
          fullSpecs: '1,700 spring pins on socket, direct DMI 4.0 bus links to chipset, 16x PCIe 5.0 lanes directly to primary x16 slot.',
          troubleshootingNote: 'Symptom: Bent socket pin causes single memory channel failure or immediate boot loop error code 00.',
          examRelevance: 'Align triangle mark on CPU corner with socket index mark; never apply force when placing CPU into socket.'
        },
        {
          id: 'vrm-heatsink',
          x: 22,
          y: 22,
          name: 'VRM MOSFETs & Choke Array',
          category: 'Power Regulation',
          shortDescription: 'Multi-phase power stage stepping 12V down to clean core Vcore voltages.',
          fullSpecs: '16+1+1 DrMOS power stages, aluminum finned heatsinks with thermal pads, 8-pin EPS connector.',
          troubleshootingNote: 'Symptom: CPU thermal throttling under sustained rendering despite cold liquid CPU cooler.',
          examRelevance: 'VRMs require ambient case airflow; fan failure in water-cooled systems often cooks VRMs.'
        },
        {
          id: 'pcie-x16',
          x: 45,
          y: 60,
          name: 'PCIe 5.0 x16 Steel-Reinforced Slot',
          category: 'High-Speed Expansion',
          shortDescription: 'Primary expansion slot dedicated to discrete graphics cards.',
          fullSpecs: '16x Gen 5 lanes, 64 GB/s theoretical bi-directional bandwidth, up to 75 Watts delivered directly through slot.',
          troubleshootingNote: 'Symptom: GPU sagging can break solder joints or cause PCIe fallback to x4 speeds.',
          examRelevance: 'Understand that GPUs drawing over 75W require auxiliary 6-pin or 8-pin PCIe power cables from the PSU.'
        },
        {
          id: 'atx-24pin',
          x: 88,
          y: 35,
          name: 'Main 24-Pin ATX Power Header',
          category: 'System Power Delivery',
          shortDescription: 'Primary power interface from power supply delivering +12V, +5V, +3.3V, and +5VSB.',
          fullSpecs: 'Standard Molex Mini-Fit Jr. 24-pin key notched receptacle, includes PS_ON# (Green wire Pin 16) and PWR_OK.',
          troubleshootingNote: 'Symptom: System does not power on when power button is pressed; check PS_ON signal.',
          examRelevance: 'Shorting PS_ON (Pin 16) to Ground (Pin 17) manually forces a power supply to spin up for paperclip testing.'
        },
        {
          id: 'front-panel',
          x: 85,
          y: 85,
          name: 'Front Panel Header (F_PANEL)',
          category: 'Case Controls & LEDs',
          shortDescription: 'Pin bank connecting chassis power switch, reset switch, power LED, and HDD activity LED.',
          fullSpecs: '2.54mm pitch pin header. Switches (PWR/RESET) are non-polar momentary contacts; LEDs require correct +/- polarity.',
          troubleshootingNote: 'Symptom: Pressing case power button does nothing because the 2-pin connector slipped off the header pins.',
          examRelevance: 'Know that LEDs are polarized (anode/cathode) while momentary power/reset switches work in either orientation.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Locate the primary expansion slot that provides up to 16 lanes of PCIe bandwidth directly to the CPU.',
          targetHotspotId: 'pcie-x16',
          hint: 'Look for the reinforced long expansion slot in the middle of the board.'
        },
        {
          prompt: 'Identify the main 24-pin power receptacle on the right edge of the motherboard.',
          targetHotspotId: 'atx-24pin',
          hint: 'Look on the far right perimeter for the high-pin-count power connector.'
        },
        {
          prompt: 'Identify the CPU socket mechanism where the contact pins reside on the motherboard.',
          targetHotspotId: 'lga-socket',
          hint: 'Look in the upper center for the LGA socket with the metal retention lever.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'hw-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Modular Power Supply Unit (PSU)',
      subtitle: 'Modular Harness, Rails, Capacitor Bank, & 120mm Fan',
      estimatedMinutes: 8,
      modelId: 'atx-power-supply',
      modelTitle: '850W Fully Modular ATX Power Supply',
      description: 'Inspect the architecture of an 80-Plus Gold power supply unit. Drag the Exploded View slider to separate the steel shell and inspect the modular backplane and cooling fan.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'psu-casing',
          name: 'Steel Enclosure & Hex Mesh',
          category: 'Structural Shielding',
          color: '#1e293b',
          shape: 'box',
          dimensions: [6.5, 4.0, 6.0],
          defaultPosition: [0, 0, 0],
          explodedPosition: [0, -3.5, 0],
          description: 'Heavy-gauge steel chassis protecting external components from electromagnetic interference (EMI).',
          specs: 'Standard ATX form factor (150mm W x 86mm H x 160mm D), IEC C14 power inlet, rocker power switch.',
          failureSymptoms: 'Physical dents or rattle from dropped screws inside case.'
        },
        {
          id: 'cooling-fan',
          name: '135mm Fluid Dynamic Bearing Fan',
          category: 'Active Thermal Management',
          color: '#0284c7',
          shape: 'cylinder',
          dimensions: [4.5, 0.6, 4.5],
          defaultPosition: [0, 1.8, 0],
          explodedPosition: [0, 4.2, 0],
          description: 'Intake cooling fan drawing ambient case air and exhausting it through the rear honeycombed mesh.',
          specs: 'Zero-RPM hybrid silent mode under 40% load, 12V DC PWM variable speed control.',
          failureSymptoms: 'Loud bearing squeal or fan stopping under high gaming load, triggering thermal shutdown.'
        },
        {
          id: 'modular-board',
          name: 'Modular Cable Interface Backplane',
          category: 'Power Distribution',
          color: '#10b981',
          shape: 'board',
          dimensions: [5.8, 3.2, 0.4],
          defaultPosition: [0, 0, 2.8],
          explodedPosition: [0, 0, 5.0],
          description: 'Internal daughterboard hosting keyed receptacles for 24-pin ATX, 8-pin EPS, PCIe 8-pin, and SATA modular cables.',
          specs: 'Gold-plated high-amperage terminals, solid-state filtering capacitors for ultra-low electrical ripple.',
          failureSymptoms: 'Loose modular cable connector creating high resistance and charred melted plastic pins.'
        },
        {
          id: 'primary-caps',
          name: 'High-Voltage Primary Filter Capacitors',
          category: 'Energy Storage & Rectification',
          color: '#eab308',
          shape: 'cylinder',
          dimensions: [1.4, 2.2, 1.4],
          defaultPosition: [-1.8, -0.6, -1.2],
          explodedPosition: [-3.2, 0.5, -1.8],
          description: 'Japanese electrolytic capacitors rated for 450V and 105°C smoothing rectified DC voltage.',
          specs: 'Dual 450V 470uF capacitors. DANGER: Stores high voltage for hours after AC cord is disconnected.',
          failureSymptoms: 'Bulging or leaking brown electrolyte causing sudden PC reboots under graphics load.'
        },
        {
          id: 'transformer',
          name: 'Main Switch-Mode Transformer',
          category: 'Voltage Step-Down',
          color: '#d97706',
          shape: 'box',
          dimensions: [2.2, 2.0, 2.0],
          defaultPosition: [1.2, -0.6, -0.8],
          explodedPosition: [2.5, 0.5, -1.2],
          description: 'High-frequency ferrite core transformer stepping down chopped high voltage to +12V DC.',
          specs: 'Active Clamp Forward topology, capable of delivering 70.8 Amps on the single +12V rail.',
          failureSymptoms: 'Coil whine (audible high-pitched screeching under load).'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'hw-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: CPU Instruction Cycle & Cache',
      subtitle: 'Fetch, Decode, Execute, & Cache Hierarchy Latency',
      estimatedMinutes: 6,
      animationType: 'cpu-pipeline',
      description: 'Explore how a CPU fetches instructions from ultra-fast L1/L2/L3 on-die cache compared to the much slower system RAM bus.',
      steps: [
        {
          stepNumber: 1,
          label: 'INSTRUCTION FETCH (L1 Cache Hit)',
          description: 'The instruction pointer requests the next operation. The CPU checks L1 Cache (1 nanosecond latency / 0.5ns access). Cache Hit! Instruction retrieved instantly.',
          highlightedElement: 'CPU Core ↔ L1 Instruction Cache',
          metrics: { label: 'L1 Latency', value: '0.8 ns (Cache Hit)' }
        },
        {
          stepNumber: 2,
          label: 'INSTRUCTION DECODE (Control Unit)',
          description: 'The CPU Control Unit decodes the binary machine opcode into micro-operations, configuring the internal arithmetic registers and data paths.',
          highlightedElement: 'Control Unit & Decode Matrix',
          metrics: { label: 'Decoded Ops', value: '4 μOps / Cycle' }
        },
        {
          stepNumber: 3,
          label: 'EXECUTE (Arithmetic Logic Unit - ALU)',
          description: 'The ALU executes mathematical addition and logic comparisons at the 4.8 GHz clock speed cycle.',
          highlightedElement: 'Arithmetic Logic Unit (ALU)',
          metrics: { label: 'Clock Speed', value: '4.8 GHz Boost' }
        },
        {
          stepNumber: 4,
          label: 'CACHE MISS & RAM BUS RETRIEVAL',
          description: 'When data is not in L1/L2/L3 cache (Cache Miss), the memory controller sends an address request out to system DDR5 RAM across the memory bus, taking 60 nanoseconds.',
          highlightedElement: 'Memory Controller → DDR5 RAM',
          metrics: { label: 'RAM Latency', value: '62 ns (Cache Miss)' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'hw-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: CPU Installation & Thermal Paste',
      subtitle: 'Pin Alignment, ZIF Lever Operation, & Heatsink Seating',
      estimatedMinutes: 8,
      labTitle: 'Desktop Processor Seating & Thermal Interface Application',
      goal: 'Install an LGA processor into the motherboard socket, apply the correct pea-sized thermal paste amount, and latch the CPU cooler.',
      hardwareSubject: 'LGA Socket & Desktop CPU',
      prerequisites: [
        'ESD Grounding Wrist Strap',
        'Thermal Interface Material (Silver/Ceramic compound)',
        'Isopropyl Alcohol (99%) and lint-free wipes'
      ],
      steps: [
        {
          id: 'step-open-lever',
          instruction: 'Release and lift the socket load lever and metal load plate',
          detail: 'Push the steel lever downward, slide it outward from the retention hook, and swing the load plate open.',
          actionType: 'open-socket',
          feedbackOnSuccess: 'Socket load plate opened. The 1,700 gold spring contact pins are exposed.'
        },
        {
          id: 'step-align-cpu',
          instruction: 'Align gold corner triangle and drop CPU into socket without force',
          detail: 'Match the printed gold triangle on the processor PCB corner with the indicator mark on the socket corner. Never drop or force the chip.',
          actionType: 'insert-cpu',
          feedbackOnSuccess: 'CPU placed flat into socket. Keyed alignment notches prevent improper rotation.'
        },
        {
          id: 'step-lock-plate',
          instruction: 'Lower load plate and press lever down under retention hook',
          detail: 'Lower the metal plate over the CPU heat spreader and lock the lever. Significant mechanical resistance is normal.',
          actionType: 'lock-lever',
          feedbackOnSuccess: 'Click! Load lever locked into retention hook. Equal contact pressure applied across all pins.'
        },
        {
          id: 'step-paste',
          instruction: 'Apply a pea-sized dot of thermal paste to the center of the IHS',
          detail: 'Place a 4-5mm drop in the direct center of the integrated heat spreader. Do not smear manually; cooler mounting pressure will spread it evenly.',
          actionType: 'apply-paste',
          feedbackOnSuccess: 'Exact thermal paste volume applied. Pea-sized dot will spread across the die without spilling over the PCB edge.'
        },
        {
          id: 'step-cooler',
          instruction: 'Mount CPU cooler, torque fasteners, and connect 4-Pin CPU_FAN header',
          detail: 'Seat the cooler flat and tighten retention screws in an X-pattern. Plug 4-pin PWM fan harness into the CPU_FAN header.',
          actionType: 'mount-cooler',
          feedbackOnSuccess: 'Cooler securely mounted and 4-pin PWM tachometer header connected! System is thermally ready for initial boot.'
        }
      ],
      successMessage: 'CPU installation verified! Zero bent pins, exact thermal compound application, and correct PWM cooling harness connection.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'hw-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: 2-Second Boot Loop & Beep Codes',
      subtitle: 'CompTIA Hardware Troubleshooting Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Computer Powers on for 2 Seconds, Shuts Off, and Repeats',
      clientName: 'Marcus Vance, Architect',
      deviceModel: 'Custom Workstation Tower',
      initialProblemDescription: 'Client states: "I tried turning on my CAD workstation this morning. The fans spin for about 2 seconds, the lights flash, it beeps 3 short times, and then it turns off immediately. After 3 seconds, it tries to power on again in an infinite loop."',
      startStepId: 'step-hw-listen-beeps',
      steps: {
        'step-hw-listen-beeps': {
          id: 'step-hw-listen-beeps',
          title: 'Step 1: Identify Beep Codes & Inspect POST State',
          scenarioText: 'The workstation motherboard emits 3 short beep codes before restarting. What documentation do you consult to decode this signal?',
          customerStatement: 'I bumped the computer tower yesterday while vacuuming under the desk.',
          systemState: {
            power: 'post-error',
            screen: 'blank',
            fan: 'max-rpm',
            beepCodes: '3 Short Beeps (AMI BIOS)'
          },
          diagnosticOptions: [
            {
              id: 'c-motherboard-manual',
              label: 'Consult the motherboard manufacturer POST beep code table',
              actionDescription: 'Decode 3 short beeps for this AMI UEFI/BIOS model.',
              nextStepId: 'step-hw-ram-failure',
              feedback: 'Correct step! The motherboard technical reference manual specifies that 3 short beeps indicates a "Base 64K RAM Read/Write Memory Failure".'
            },
            {
              id: 'c-replace-gpu',
              label: 'Immediately replace the expensive discrete graphics card',
              actionDescription: 'Blame the graphics card and order a new replacement.',
              isFatal: true,
              feedback: 'Hazardous / Costly mistake: 3 short beeps indicates a memory failure, not video. Replacing the GPU will not fix the boot loop and wastes hundreds of dollars.'
            }
          ]
        },

        'step-hw-ram-failure': {
          id: 'step-hw-ram-failure',
          title: 'Step 2: Establish Theory & Physical Inspection',
          scenarioText: 'Since the vacuum cleaner bumped the case and the BIOS reports a memory failure, what is your theory of probable cause?',
          systemState: {
            power: 'off',
            screen: 'blank',
            fan: 'silent'
          },
          diagnosticOptions: [
            {
              id: 'c-reseat-ram',
              label: 'Theory: The impact dislodged a DDR5 RAM stick from its socket slot',
              actionDescription: 'Formulate theory that memory module is unseated and requires reseating.',
              nextStepId: 'step-hw-resolution',
              feedback: 'Spot on! Physical impacts can easily cause heavy RAM modules with tall aluminum heatsinks to unseat from one side of a retention clip.'
            },
            {
              id: 'c-replace-cpu',
              label: 'Theory: The CPU silicon memory controller has permanently burned out',
              actionDescription: 'Assume catastrophic CPU failure.',
              isFatal: true,
              feedback: 'Incorrect: Always check simple physical connections and reseating before condemning expensive core silicon processors.'
            }
          ]
        },

        'step-hw-resolution': {
          id: 'step-hw-resolution',
          title: 'Step 3 & 4: Test Theory & Verify System',
          scenarioText: 'You ground yourself with an ESD strap, remove the side panel, and inspect the RAM slots. RAM Slot 2 has a retention clip sitting slightly open at an angle. How do you resolve this?',
          systemState: {
            power: 'off',
            screen: 'blank',
            fan: 'silent'
          },
          diagnosticOptions: [
            {
              id: 'c-reseat-and-test',
              label: 'Remove RAM, inspect gold fingers, firmly reseat into Slot 2 until clips click, power on, and run MemTest86',
              actionDescription: 'Reseat module, verify dual clips latch, and run full memory diagnostic.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The retention clip clicks firmly shut. The workstation boots cleanly on the first try with 1 short beep (POST Successful). MemTest86 completes 4 passes with 0 errors.'
            },
            {
              id: 'c-glue-clip',
              label: 'Use hot glue to hold the loose retention clip in place without removing the stick',
              actionDescription: 'Apply adhesive to hardware socket.',
              isFatal: true,
              feedback: 'Hazardous / Unprofessional: Adhesives damage motherboard sockets, void warranties, and melt under VRM operating heat.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'hw-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Domain 3.0 Hardware Assessment',
      subtitle: 'CompTIA 220-1101 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Hardware Domain Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'hw-q1',
          question: 'What is the key physical distinction between an LGA (Land Grid Array) socket and a PGA (Pin Grid Array) socket?',
          options: [
            'LGA has pins on the motherboard socket; PGA has pins on the CPU processor chip',
            'LGA only supports water cooling; PGA only supports air cooling',
            'PGA is soldered permanently; LGA is socketed',
            'LGA uses DDR4 memory; PGA only supports DDR3'
          ],
          correctAnswer: 0,
          explanation: 'In LGA (Land Grid Array), the delicate pins are located in the motherboard socket itself. In PGA (Pin Grid Array), the pins are on the underside of the processor chip.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'hw-q2',
          question: 'A technician tests a computer power supply using a digital multimeter. The +12V rail measures +11.2 Volts. What should the technician conclude?',
          options: [
            'The reading is normal because it is within the allowed ±10% margin',
            'The voltage is out of the required ±5% tolerance (+11.4V to +12.6V) and the PSU must be replaced',
            'The power supply is operating in eco mode',
            'The multimeter battery is low'
          ],
          correctAnswer: 1,
          explanation: 'CompTIA standards require standard ATX voltage rails (+12V, +5V, +3.3V) to remain within ±5% tolerance. For a +12V rail, the minimum allowed voltage is 11.4V. A reading of 11.2V indicates inadequate power delivery.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'hw-q3',
          question: 'Which motherboard form factor measures approximately 6.7 x 6.7 inches and includes only a single expansion slot for compact builds?',
          options: [
            'Standard ATX',
            'Micro-ATX',
            'Mini-ITX',
            'Extended ATX (E-ATX)'
          ],
          correctAnswer: 2,
          explanation: 'Mini-ITX measures 6.7 x 6.7 inches (170 x 170 mm) and includes a single PCIe expansion slot for small form factor (SFF) computers.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'hw-q4',
          question: 'Why must a technician NEVER open or disassemble the internal metal housing of a computer power supply?',
          options: [
            'The screws use reverse left-hand threads',
            'High-voltage electrolytic capacitors store lethal electrical charges even when unplugged',
            'Opening it triggers an irreversible software firmware lockout',
            'The internal fan will detach from its axle'
          ],
          correctAnswer: 1,
          explanation: 'Power supply units contain large internal filter capacitors that store hundreds of volts of electricity long after the unit is disconnected from AC power. Servicing internal PSU components poses a fatal electrical shock hazard.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        }
      ]
    }
  ]
};
