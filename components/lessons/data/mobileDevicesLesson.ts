import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_1_1_LESSON: LessonData = {
  objectiveId: '1.1',
  courseId: 'a-plus',
  title: 'Laptop Hardware & Internal Component Architecture',
  domainName: 'Domain 1.0: Mobile Devices',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master laptop hardware modularity, internal form factors, teardown safety, SODIMM memory replacement, copper heatpipe thermal dynamics, and diagnostic troubleshooting.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'sec-text-1',
      type: 'text',
      title: 'Technical Briefing: Laptop Architecture',
      subtitle: 'Form Factors, Teardown Protocols, & ESD Safeguards',
      estimatedMinutes: 6,
      content: {
        lead: 'Laptops require extreme spatial miniaturization and thermal discipline compared to standard desktop towers. Field technicians must master proprietary form factors, component accessibility tiers, and strict electrostatic discharge (ESD) teardown protocols.',
        sections: [
          {
            heading: 'Modular vs. Integrated Components',
            body: [
              'Modern laptops balance user serviceability with thin-and-light chassis designs. While earlier generations featured modular processors and swappable GPU cards, modern mobile systems solder the CPU and GPU directly to the motherboard via Ball Grid Array (BGA) packaging.',
              'Field Replaceable Units (FRUs) that frequently remain modular include: SODIMM RAM sticks, M.2 PCIe NVMe Solid-State Drives, Wi-Fi/Bluetooth WLAN cards, CMOS backup batteries, display panels, keyboards, and battery packs.'
            ],
            bulletPoints: [
              'SODIMM (Small Outline Dual In-Line Memory Module): 260-pin (DDR4) or 262-pin (DDR5) modules installed horizontally at a 45-degree angle.',
              'M.2 Storage: 2280 form factor (22mm wide by 80mm long) with M-key notch supporting high-speed PCIe x4 NVMe lanes.',
              'WLAN Mini-PCIe / M.2 2230: Micro-connector with two tiny coaxial antenna leads (Main and Aux) routed through the display bezel.',
              'Thermal Assembly: Compact copper heat pipe vacuum chambers linked to centrifugal blower fans.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Dual Channel SODIMM',
              content: 'If a laptop supports dual-channel memory, always install matched pairs of SODIMM modules (identical speed, timings, and capacity) to maximize memory bus throughput.'
            },
            expandedDetails: {
              summary: 'Deep Dive: Solder-Down vs. Socketed RAM (LPDDR)',
              details: 'LPDDR (Low-Power DDR) is virtually always soldered directly to the motherboard to reduce power consumption and motherboard thickness. Technicians cannot upgrade LPDDR without specialized BGA rework stations. Always verify system documentation before ordering replacement modules.'
            }
          },
          {
            heading: 'Teardown Safety & Electrostatic Discharge (ESD)',
            body: [
              'Laptops are acutely sensitive to ESD shocks. A human cannot perceive static shock below approximately 3,000 volts, yet CMOS semiconductor transistors can be ruined by as little as 100 volts.',
              'Before loosening a single internal screw, the laptop must be completely disconnected from AC mains power, and the internal lithium-ion battery cable must be unlatched from the motherboard.'
            ],
            callout: {
              type: 'warning',
              title: 'Mandatory Safety Rule: Battery Disconnect First',
              content: 'Never work on a laptop motherboard with the internal battery connected. Modern motherboards maintain live standby voltage rails (3.3V and 5V) across circuits even when powered off. Dropping a metal screw or tool will cause an instant short circuit.'
            }
          }
        ],
        technicalTerms: [
          { term: 'SODIMM', definition: 'Small Outline Dual In-Line Memory Module; standard miniaturized form factor for laptop RAM.' },
          { term: 'M.2 2280', definition: 'Storage drive form factor measuring 22mm in width by 80mm in length.' },
          { term: 'BGA', definition: 'Ball Grid Array; permanent surface-mount solder balls affixing high-density chips directly to PCB.' },
          { term: 'eDP', definition: 'Embedded DisplayPort; high-speed digital internal interface connecting motherboard to laptop LCD/OLED panel.' },
          { term: 'Centrifugal Fan', definition: 'Blower-style cooling fan that draws air from bottom/top and forces it laterally across heatsink fins.' }
        ],
        keyTakeaways: [
          'Always disconnect AC power and the battery connector before touching internal electronics.',
          'SODIMM RAM modules require a 45-degree angle insertion before pressing flat to latch clips.',
          'M.2 NVMe SSDs utilize an M-key edge connector running at PCIe speeds.',
          'Antenna wires (Main & Aux) must be carefully reconnected to the Wi-Fi card and routed around hinges.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'sec-diagram-1',
      type: 'diagram',
      title: 'Interactive Architecture: Laptop Mainboard',
      subtitle: 'Component Pinouts, Controllers, & Failure Symptoms',
      estimatedMinutes: 8,
      diagramId: 'laptop-motherboard',
      diagramTitle: 'Laptop Motherboard Component Topology',
      description: 'Explore the high-density layout of an enterprise laptop motherboard. Click nodes to inspect specifications, pinouts, and common field failures.',
      hotspots: [
        {
          id: 'ram',
          x: 58,
          y: 22,
          name: 'SODIMM DDR4/DDR5 Slots',
          category: 'System Memory',
          shortDescription: 'Dual horizontal slots with spring-loaded side retention clips.',
          fullSpecs: '260-Pin DDR4 (or 262-Pin DDR5), 1.2V/1.1V, Dual-Channel architecture, up to 64GB total capacity.',
          troubleshootingNote: 'Symptom: Continual POST beep codes, power light flashing code 3-2, or BSOD MEMORY_MANAGEMENT errors.',
          examRelevance: 'CompTIA requires knowing 45-degree angle insertion and dual retention clip operation.'
        },
        {
          id: 'nvme',
          x: 65,
          y: 45,
          name: 'M.2 NVMe PCIe SSD Slot (2280)',
          category: 'High-Speed Storage',
          shortDescription: 'Primary OS storage drive with M-key connector.',
          fullSpecs: 'PCIe 4.0 x4 Interface (up to 7,000 MB/s), 22mm x 80mm size, secured with single M2x3mm standoff screw.',
          troubleshootingNote: 'Symptom: "No Bootable Device Found" error in UEFI or intermittent drive dropouts due to thermal throttling.',
          examRelevance: 'Recognize M.2 M-key (NVMe) vs B-key (SATA) physical notches and standoff requirements.'
        },
        {
          id: 'cpu',
          x: 30,
          y: 30,
          name: 'CPU / APU & Copper Thermal Block',
          category: 'Processing Core',
          shortDescription: 'Multi-core SoC with sealed vapor chamber copper contact plate.',
          fullSpecs: 'BGA1744 socketed SoC, 45W TDP, integrated Iris Xe Graphics and memory controller.',
          troubleshootingNote: 'Symptom: Thermal throttling, sudden power-off under gaming/rendering load, loud sustained fan RPM.',
          examRelevance: 'Understand that CPU is soldered; dried thermal paste requires isopropyl alcohol cleaning and replacement.'
        },
        {
          id: 'fan',
          x: 12,
          y: 23,
          name: 'Centrifugal Blower Fan & Fin Stack',
          category: 'Cooling Assembly',
          shortDescription: 'PWM brushless exhaust fan paired with copper radiator fins.',
          fullSpecs: '5V DC Brushless motor, 4-pin PWM speed control (0 to 5200 RPM), side air exhaust ducting.',
          troubleshootingNote: 'Symptom: Grinding bearing noise, "CPU Fan Error" at boot, or clogged dust fleece blocking airflow.',
          examRelevance: 'Use compressed air holding fan blade stationary to avoid reverse voltage motor damage.'
        },
        {
          id: 'wifi',
          x: 34,
          y: 58,
          name: 'WLAN Wi-Fi 6E / Bluetooth Card',
          category: 'Wireless Comms',
          shortDescription: 'M.2 2230 card with dual U.FL coaxial antenna leads.',
          fullSpecs: 'Wi-Fi 6E (802.11ax) 2.4/5/6 GHz tri-band, Bluetooth 5.3, CNVi / PCIe interface.',
          troubleshootingNote: 'Symptom: Weak Wi-Fi range or Bluetooth drops caused by loose U.FL antenna snap connectors.',
          examRelevance: 'Exam questions frequently ask how to resolve poor wireless reception after a screen/hinge repair.'
        },
        {
          id: 'cmos',
          x: 16,
          y: 57,
          name: 'CMOS RTC Coin-Cell Battery (CR2032)',
          category: 'System State',
          shortDescription: 'Maintains system real-time clock and non-volatile BIOS settings.',
          fullSpecs: '3.0V Lithium coin cell, shrink-wrapped with 2-pin micro Molex harness or socketed.',
          troubleshootingNote: 'Symptom: System date/time resets to Jan 1 2000 every time the main battery drains completely.',
          examRelevance: 'Know that CMOS battery maintains firmware clock; depleting causes certificate and boot errors.'
        },
        {
          id: 'batt',
          x: 50,
          y: 83,
          name: 'Main Battery Connector & Harness',
          category: 'Power Delivery',
          shortDescription: 'High-current multi-pin connector delivering DC power from internal lithium pack.',
          fullSpecs: '15.4V Nominal, 4-cell Lithium-ion polymer pack, SMBus battery telemetry communication line.',
          troubleshootingNote: 'Symptom: Swollen battery touchpad pop-up, "Plugged in, not charging", or battery gauge miscalibration.',
          examRelevance: 'Safety hazard: Punctured or swollen lithium batteries can undergo catastrophic thermal runaway.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Locate the primary high-speed M.2 NVMe Solid-State Drive slot.',
          targetHotspotId: 'nvme',
          hint: 'Look for the 2280 form factor drive with a single standoff screw on the right side of the board.'
        },
        {
          prompt: 'Identify the component responsible for maintaining the BIOS real-time clock when unpowered.',
          targetHotspotId: 'cmos',
          hint: 'Look for the 3.0V circular coin-cell battery.'
        },
        {
          prompt: 'Identify the slot that holds 260-pin horizontal memory modules.',
          targetHotspotId: 'ram',
          hint: 'Look near the top center for the dual-channel horizontal slots with spring clips.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'sec-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Hardware Teardown',
      subtitle: 'Exploded View, Spatial Assembly, & Component Isolation',
      estimatedMinutes: 10,
      modelId: 'laptop-teardown',
      modelTitle: '3D Exploded Laptop Teardown',
      description: 'Interact with the 3D hardware assembly in real-time. Drag the Exploded View slider to separate the chassis layers and click any component to inspect its role.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'chassis-bottom',
          name: 'Bottom Chassis Enclosure',
          category: 'Structural Enclosure',
          color: '#334155',
          shape: 'box',
          dimensions: [10, 0.4, 7],
          defaultPosition: [0, -1.8, 0],
          explodedPosition: [0, -4.5, 0],
          description: 'Reinforced magnesium-aluminum alloy bottom cover with intake ventilation mesh and rubber non-slip footpads.',
          specs: 'M2x5mm Torx T5 and Phillips #00 captive fasteners. Features internal copper shielding for EMI dissipation.',
          failureSymptoms: 'Cracked hinge mounts, stripped screw standoffs, or blocked intake dust filters.'
        },
        {
          id: 'battery-pack',
          name: 'Lithium-Ion Battery Pack',
          category: 'Internal Power',
          color: '#1e293b',
          shape: 'box',
          dimensions: [8, 0.35, 2.5],
          defaultPosition: [0, -1.2, 2],
          explodedPosition: [0, -3.0, 3],
          description: 'Flat pouch cell 4-cell rechargeable lithium-polymer battery pack occupying the lower half of the chassis.',
          specs: '56 Watt-Hours (Wh), 15.4 Volts, Smart Battery System (SBS) 8-pin harness connector.',
          failureSymptoms: 'Swelling (bulging chassis/trackpad), fast battery drain, or refusal to charge past 1%.'
        },
        {
          id: 'motherboard',
          name: 'System Motherboard PCB',
          category: 'Core Logic Board',
          color: '#065f46',
          shape: 'board',
          dimensions: [9.5, 0.15, 4.5],
          defaultPosition: [0, -0.6, -1],
          explodedPosition: [0, -0.8, -1],
          description: 'Multi-layer high-density printed circuit board hosting system SoC, VRMs, controllers, and expansion slots.',
          specs: '10-layer FR-4 dielectric substrate, PCIe 4.0 traces, Thunderbolt 4 controller, embedded EC controller.',
          failureSymptoms: 'No power (dead board), burnt SMD capacitors, corrosion from liquid spills, or firmware corruption.'
        },
        {
          id: 'heatpipe',
          name: 'Copper Heat Pipe Assembly',
          category: 'Thermal System',
          color: '#d97706',
          shape: 'box',
          dimensions: [6.5, 0.25, 1.2],
          defaultPosition: [-1.2, -0.2, -1.5],
          explodedPosition: [-1.2, 1.2, -1.5],
          description: 'Sintered copper hollow tube filled with demineralized water in a partial vacuum for phase-change heat transfer.',
          specs: 'Direct contact copper cold plate with pre-applied phase-change thermal interface material (TIM).',
          failureSymptoms: 'Loss of vacuum pressure causing severe CPU overheating (instantly hits 100°C under light load).'
        },
        {
          id: 'fan-blower',
          name: 'Centrifugal Blower Fan',
          category: 'Active Cooling',
          color: '#0284c7',
          shape: 'cylinder',
          dimensions: [2, 0.6, 2],
          defaultPosition: [-3.8, -0.2, -1.8],
          explodedPosition: [-4.2, 1.5, -2],
          description: 'High-static-pressure centrifugal blower drawing air into its center and pushing it horizontally through the fin stack.',
          specs: '5V DC Brushless, 4-pin PWM connector with RPM tachometer feedback signal.',
          failureSymptoms: 'Bearing grinding noise, blade obstruction by dust hairballs, or dead tachometer line.'
        },
        {
          id: 'ram-module',
          name: 'SODIMM Memory Module',
          category: 'Primary Memory',
          color: '#10b981',
          shape: 'box',
          dimensions: [2.5, 0.1, 1.2],
          defaultPosition: [1.8, -0.3, -1.2],
          explodedPosition: [2.2, 2.0, -1.0],
          description: '260-pin DDR4 high-speed memory module installed in spring-retention horizontal socket.',
          specs: '16GB DDR4-3200MHz CL22, 1.2V, Non-ECC Unbuffered SODIMM.',
          failureSymptoms: 'Kernel panics, memory dump blue screens, random system freezes.'
        },
        {
          id: 'm2-ssd',
          name: 'M.2 NVMe SSD (2280)',
          category: 'Solid-State Storage',
          color: '#6366f1',
          shape: 'box',
          dimensions: [3, 0.1, 1],
          defaultPosition: [2.2, -0.3, 0.4],
          explodedPosition: [2.5, 2.4, 1.0],
          description: 'PCIe NVMe solid state drive with 3D NAND flash chips and silicon motion controller.',
          specs: '1TB PCIe 4.0 x4 (3D TLC NAND), sequential read up to 5,000 MB/s, protected by copper thermal pad.',
          failureSymptoms: 'Disk read errors, OS fails to load, SMART pre-failure warning alert in BIOS.'
        },
        {
          id: 'keyboard-palmrest',
          name: 'Top Keyboard & Palmrest Bezel',
          category: 'User Interface Upper Deck',
          color: '#475569',
          shape: 'box',
          dimensions: [10.2, 0.35, 7.2],
          defaultPosition: [0, 0.3, 0],
          explodedPosition: [0, 4.2, 0],
          description: 'Upper deck assembly integrating the backlit scissor-switch keyboard, glass precision trackpad, and power button.',
          specs: 'Ribbon cable (ZIF) connectors for keyboard backlight, matrix, and I2C touchpad bus.',
          failureSymptoms: 'Sticky or unresponsive keys from beverage spills, erratic touchpad pointer drift.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'sec-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: Heat Pipe Thermal Cycle',
      subtitle: 'Vapor-Liquid Phase Change & Dissipation Mechanics',
      estimatedMinutes: 5,
      animationType: 'heatpipe-dissipation',
      description: 'Laptops cannot fit bulky desktop tower heatsinks. Instead, they rely on sealed phase-change copper heatpipes to transfer thermal energy at near-sonic speeds.',
      steps: [
        {
          stepNumber: 1,
          label: 'Thermal Generation at CPU Die',
          description: 'Under heavy processing load, the silicon CPU die spikes to 80°C - 90°C. Thermal interface material (TIM) conducts this heat directly into the sealed copper vapor chamber base.',
          highlightedElement: 'CPU Die & Cold Plate',
          metrics: { label: 'CPU Temp', value: '86°C' }
        },
        {
          stepNumber: 2,
          label: 'Liquid Evaporation to High-Pressure Vapor',
          description: 'Inside the partial vacuum of the copper pipe, internal demineralized water boils at only 30°C. The water flash-evaporates into hot steam, expanding rapidly toward the cooler low-pressure radiator end.',
          highlightedElement: 'Evaporator Cavity',
          metrics: { label: 'Vapor Velocity', value: 'Mach 0.3' }
        },
        {
          stepNumber: 3,
          label: 'Condensation at Aluminum Fin Stack',
          description: 'The vapor arrives at the aluminum fin radiator, where the centrifugal blower fan pulls cooler ambient air across the fins. The heat escapes out the laptop vents, causing the vapor to condense back into liquid water.',
          highlightedElement: 'Radiator Fin Stack & Exhaust',
          metrics: { label: 'Fin Temp', value: '44°C' }
        },
        {
          stepNumber: 4,
          label: 'Capillary Wick Return to Heat Source',
          description: 'The condensed liquid is absorbed by the sintered copper porous wick lining the inner pipe wall. Surface tension and capillary action pull the cool liquid back to the CPU evaporator zone to repeat the continuous cycle.',
          highlightedElement: 'Sintered Copper Wick',
          metrics: { label: 'Cycle Rate', value: 'Continuous' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'sec-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: SODIMM RAM Upgrade',
      subtitle: 'Interactive Hands-On Procedure with Safety Verification',
      estimatedMinutes: 8,
      labTitle: 'Enterprise Laptop Memory Upgrade Procedure',
      goal: 'Safely replace a faulty 4GB SODIMM module with a high-density 16GB DDR4 module and verify POST detection.',
      hardwareSubject: '260-Pin DDR4 SODIMM Slot',
      prerequisites: [
        'Anti-Static ESD Wrist Strap connected to earth ground',
        'Phillips #00 precision screwdriver',
        'Non-marring plastic pry tool'
      ],
      steps: [
        {
          id: 'step-1',
          instruction: 'Disconnect AC Power and Unplug Internal Battery',
          detail: 'Never service internal memory while the battery harness is plugged into the motherboard. Latched standby voltage rails will short circuit if components touch.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Battery safely disconnected. The motherboard voltage rails are now completely de-energized.'
        },
        {
          id: 'step-2',
          instruction: 'Unscrew Memory Door & Attach ESD Grounding Strap',
          detail: 'Remove the 2x captive Phillips screws securing the bottom maintenance door and ensure your ESD wrist strap is grounded.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'Access door removed and ESD wrist strap bonded to ground. System is safe for semiconductor handling.'
        },
        {
          id: 'step-3',
          instruction: 'Align Notch & Insert 16GB SODIMM at 45° Angle',
          detail: 'Inspect the off-center key notch in the gold edge connector. Slide the module pins firmly into the slot at a 45-degree angle.',
          actionType: 'insert-ram',
          feedbackOnSuccess: 'Module seated into slot connector at 45 degrees. Gold fingers are fully seated.'
        },
        {
          id: 'step-4',
          instruction: 'Press Downward Until Dual Metal Clips Snap',
          detail: 'Apply gentle, even downward pressure on the top edge of the module until the side metal spring clips click outward and snap securely into the module side notches.',
          actionType: 'lock-clips',
          feedbackOnSuccess: 'Snap! Dual retention clips locked securely. Module is seated flat in dual-channel configuration.'
        },
        {
          id: 'step-5',
          instruction: 'Reassemble, Power On, and Verify in UEFI / BIOS',
          detail: 'Reconnect the battery, replace the maintenance door, and power on into UEFI setup to confirm total detected RAM is 16,384 MB.',
          actionType: 'verify-post',
          feedbackOnSuccess: 'UEFI System Information displays 16GB DDR4-3200 Dual Channel active! Lab completed successfully.'
        }
      ],
      successMessage: 'Outstanding work! You followed the exact CompTIA manufacturer procedure for laptop memory upgrades without risking ESD damage or short circuits.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'sec-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: The Overheating Executive Laptop',
      subtitle: 'CompTIA 6-Step Diagnostic Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Random Thermal Shutdowns Under Heavy Office Load',
      clientName: 'Sarah Jenkins, Financial Controller',
      deviceModel: 'Latitude 7420 Ultrabook',
      initialProblemDescription: 'Client reports that whenever she opens large quarterly spreadsheet models or runs video conference calls, the laptop underside becomes burning hot, the cooling fan screams at full speed, and the laptop abruptly shuts off without warning after 10-15 minutes.',
      startStepId: 'step-gather-info',
      steps: {
        'step-gather-info': {
          id: 'step-gather-info',
          title: 'Step 1: Identify the Problem & Gather Symptoms',
          scenarioText: 'You arrive at the executive office. The laptop is sitting on a soft plush desk tablecloth. What is your first diagnostic action?',
          customerStatement: 'It only happens when I am on the video conference with finance. The whole bottom feels like a stove burner.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'max-rpm',
            tempReading: '94°C (Thermal Throttling)',
            beepCodes: 'None'
          },
          diagnosticOptions: [
            {
              id: 'c-inspect-vents',
              label: 'Inspect Air Intake Vents & Event Viewer System Logs',
              actionDescription: 'Check physical bottom vents for lint accumulation and review Windows System Event Log for Event ID 41 (Kernel-Power) and ACPI thermal events.',
              nextStepId: 'step-thermal-analysis',
              feedback: 'Optimal! Event Viewer shows Event ID 37 (Kernel-Processor-Power: processor speed limited by system firmware) followed by Event ID 41 thermal shutdowns at 100°C. Inspection shows the intake vents were blocked by the plush tablecloth and dust buildup.'
            },
            {
              id: 'c-replace-ssd',
              label: 'Assume SSD corruption and wipe drive for clean OS install',
              actionDescription: 'Immediately format the drive and reinstall Windows 11.',
              isFatal: true,
              feedback: 'Hazardous / Wrong diagnosis: Formatting does not solve physical overheating, destroys executive financial spreadsheets, and wastes company time!'
            },
            {
              id: 'c-disable-fan',
              label: 'Use third-party utility to lock fan speed to 20% to reduce noise',
              actionDescription: 'Override fan PWM curve to silence the loud blower.',
              isFatal: true,
              feedback: 'Catastrophic failure! Quieting the fan when the CPU is already at 94°C will cause immediate thermal destruction of the silicon die.'
            }
          ]
        },

        'step-thermal-analysis': {
          id: 'step-thermal-analysis',
          title: 'Step 2: Establish a Theory of Probable Cause',
          scenarioText: 'You move the laptop to a hard, flat surface. The fan is running at 5000 RPM, but when you put your hand near the side exhaust vent, you feel almost NO warm air blowing out. What does this tell you?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'max-rpm',
            tempReading: '96°C',
            beepCodes: 'None'
          },
          diagnosticOptions: [
            {
              id: 'c-lint-clog',
              label: 'Theory: A dense "dust fleece" has clogged the inner copper fin stack',
              actionDescription: 'Formulate theory that dust has created an air barrier between the fan and exhaust radiator, trapping heat inside.',
              nextStepId: 'step-remediation',
              feedback: 'Exact theory! In laptops, dust forms a solid felt-like lint blanket directly on the inside of the fin radiator, preventing the fan from pushing air through.'
            },
            {
              id: 'c-bad-ram',
              label: 'Theory: The SODIMM RAM voltage is too high',
              actionDescription: 'Blame memory voltage for thermal shutdowns.',
              nextStepId: 'step-bad-theory',
              feedback: 'Incorrect: RAM dissipates very little wattage (under 3W) and cannot cause a CPU to hit 96°C or cause air blockage at the exhaust fins.'
            }
          ]
        },

        'step-bad-theory': {
          id: 'step-bad-theory',
          title: 'Step 3: Test Theory (RAM Verification)',
          scenarioText: 'You run Windows Memory Diagnostic. The test passes 100% with zero errors. The laptop is still boiling hot at 95°C.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'max-rpm',
            tempReading: '96°C'
          },
          diagnosticOptions: [
            {
              id: 'c-return-to-thermal',
              label: 'Pivot Theory: Disassemble bottom panel to inspect heatsink fins and fan',
              actionDescription: 'Return to thermal dissipation assembly inspection.',
              nextStepId: 'step-remediation',
              feedback: 'Good pivot. Return to the cooling system.'
            }
          ]
        },

        'step-remediation': {
          id: 'step-remediation',
          title: 'Step 4 & 5: Plan of Action, Resolution, & Verification',
          scenarioText: 'You safely power down, unplug the battery, and remove the bottom chassis. You discover a thick lint carpet trapped between the blower fan and copper fins. Dried, hardened thermal paste is also cracked on the CPU die. How do you resolve this?',
          systemState: {
            power: 'off',
            screen: 'blank',
            fan: 'silent',
            tempReading: 'Cooling down'
          },
          diagnosticOptions: [
            {
              id: 'c-clean-and-repaste',
              label: 'Clear fin dust, clean die with 99% isopropyl alcohol, apply fresh thermal paste, reassemble, and run FurMark stress test',
              actionDescription: 'Execute full thermal remediation protocol and verify with 30-minute stress load on hard surface.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! Under full 100% video conference load, CPU temperatures stabilize at 68°C with moderate fan RPM. The client is educated to keep the laptop on hard surfaces and avoid soft bedding/tablecloths.'
            },
            {
              id: 'c-blow-can-backward',
              label: 'Blow compressed air directly into exhaust vents while assembled without opening',
              actionDescription: 'Blast compressed air from the outside into the laptop.',
              isFatal: true,
              feedback: 'Dangerous shortcut: Blowing air from outside forces the dust blanket deeper into the fan blades, jamming the fan bearing and potentially spinning the fan fast enough to generate reverse electromagnetic voltage into the motherboard.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'sec-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Objective 1.1 Mastery Assessment',
      subtitle: 'CompTIA 220-1101 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 (220-1101) Objective 1.1 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'q1',
          question: 'A technician is replacing a SODIMM module in an enterprise laptop. At which physical angle should the module be inserted into the spring retention socket before locking?',
          options: [
            'Flat parallel to the motherboard (0 degrees)',
            'Approximately 45-degree angle',
            'Perpendicular (90 degrees)',
            'Reverse 180 degrees'
          ],
          correctAnswer: 1,
          explanation: 'Laptop SODIMM sockets are designed for modules to be inserted at an angle of approximately 45 degrees until the gold pins bottom out, then pressed downward flat until the side retention clips click into place.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 1.1'
        },
        {
          id: 'q2',
          question: 'Prior to opening a laptop chassis to replace internal components, which safety step is strictly mandatory to prevent component damage?',
          options: [
            'Update the UEFI/BIOS to the latest revision',
            'Disconnect the AC power adapter and unlatch the internal battery',
            'Run a full disk defragmentation',
            'Remove the display bezel'
          ],
          correctAnswer: 1,
          explanation: 'Always disconnect both AC power and the internal battery before touching internal components. Modern laptops maintain active standby voltages that will short circuit if metal tools or screws touch live traces.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 1.1'
        },
        {
          id: 'q3',
          question: 'An executive complains that their laptop system time and date resets to January 1, 2000 every time the main laptop battery is allowed to fully discharge. Which component has failed?',
          options: [
            'SODIMM RAM module',
            'M.2 NVMe SSD',
            'CMOS / RTC backup coin-cell battery (CR2032)',
            'Embedded DisplayPort (eDP) cable'
          ],
          correctAnswer: 2,
          explanation: 'The CMOS coin-cell battery powers the Real-Time Clock (RTC) chip when the system has no main battery or AC power. When this coin battery dies, clock time and hardware configuration settings reset upon power loss.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 1.1'
        },
        {
          id: 'q4',
          question: 'How does a laptop copper heatpipe dissipate processor heat without a massive desktop-style aluminum tower heatsink?',
          options: [
            'It pumps liquid nitrogen continuously using miniature electric gear pumps',
            'It utilizes a sealed vacuum phase-change cycle of boiling and condensing liquid',
            'It converts heat directly into electricity using the Peltier effect',
            'It vents steam out of the laptop speakers'
          ],
          correctAnswer: 1,
          explanation: 'Heatpipes are hollow copper tubes containing a partial vacuum and a minute amount of fluid. Heat from the CPU boils the fluid into vapor, which travels to cooling fins, condenses, and returns via a sintered copper wick.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 1.1'
        }
      ]
    }
  ]
};
