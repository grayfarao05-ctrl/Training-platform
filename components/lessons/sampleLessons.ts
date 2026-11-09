import { LessonData, LessonSection } from '../../types';
import { COMPTIA_A_PLUS_2_1_LESSON } from './data/networkingLessons';
import { COMPTIA_A_PLUS_3_4_LESSON } from './data/hardwareLessons';
import { COMPTIA_A_PLUS_5_1_LESSON } from './data/troubleshootingAndCloudLessons';
import { COMPTIA_A_PLUS_C2_2_4_LESSON } from './data/osAndSecurityLessons';
import {
  A_PLUS_1_1_EXTRA_STAGES,
  NETWORK_PLUS_1_1_LESSON,
  MATRIC_TO_MONEY_1_1_LESSON,
  BEYOND_CHATBOT_1_1_LESSON
} from './data/multiCourseInteractiveLessons';

// =========================================================================
// OBJECTIVE 1.1: LAPTOP HARDWARE & INTERNAL COMPONENT ARCHITECTURE
// =========================================================================
export const COMPTIA_A_PLUS_1_1_LESSON: LessonData = {
  objectiveId: '1.1',
  courseId: 'a-plus',
  title: 'Laptop Hardware, Internal Components & Accessories',
  domainName: 'Domain 1.0: Mobile Devices',
  badgeLabel: 'Core 1 (220-1101 / 1201)',
  summary: 'Master laptop hardware installation, battery chemistry rules, SODIMM memory pinouts, drive form factors, display hinge antenna routing, docking stations, USB connector types, and teardown safety protocols based on official CompTIA specifications.',
  sections: [
    {
      id: 'sec-text-1',
      type: 'text',
      title: 'Technical Briefing: Mobile Hardware & Disassembly',
      subtitle: 'Component Architectures, Safety Protocols & Port Specifications',
      estimatedMinutes: 8,
      content: {
        lead: 'Approximately 13% of questions on the CompTIA A+ Core Series exam pertain to mobile device concepts, with roughly 66% of these questions beginning with a diagnostic scenario. Technicians must be able to monitor, remove, install, and configure laptop components while adhering strictly to manufacturer documentation and ESD precautions.',
        sections: [
          {
            heading: '1. Battery Chemistries, Voltage & Replacement Protocols',
            body: [
              'Laptop battery chemistries most commonly include nickel-cadmium (NiCd), nickel-metal hydride (NiMH), lithium-ion (Li-ion), or lithium-polymer (Li-poly).',
              'Battery replacement compatibility depends strictly on device specifications: replacement batteries must have the identical battery chemistry (with the exception of Li-ion and Li-poly, which may be cross-compatible in specific instances) and identical voltage for proper compatibility.',
              'When replacing a battery, determine if it is external or internal first: external batteries release via a sliding mechanical latch; internal batteries require removing the bottom cover, disconnecting the harness from the motherboard, unfastening retaining screws, and replacing the pack.'
            ],
            bulletPoints: [
              'NiCd (Nickel-Cadmium): Older technology susceptible to memory effect.',
              'NiMH (Nickel-Metal Hydride): Higher capacity than NiCd but largely replaced by lithium cells.',
              'Li-ion (Lithium-Ion): Common modern standard, high energy density, no memory effect.',
              'Li-poly (Lithium-Polymer): Moldable flat pouch form factor ideal for ultra-thin laptops.',
              'Safety Rule: Replacement batteries must always match OEM voltage ratings.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Battery Compatibility',
              content: 'Never substitute different battery chemistries unless explicitly certified as cross-compatible between Li-ion and Li-poly by the manufacturer, and always ensure the replacement voltage exactly matches the original battery.'
            }
          },
          {
            heading: '2. Keyboard, Keycaps & Pointing Devices',
            body: [
              'Laptop keyboards are smaller than traditional desktop keyboards and are housed in the lower portion of the clamshell. Removal can be simple (top retention clips/bezel) or more involved (requiring removal of the bottom chassis and numerous internal components).',
              'Many laptops feature individually replaceable keycaps if the underlying scissor/membrane mechanism remains functional.',
              'Pointing accessories include the standard capacitive Trackpad (finger-responsive cursor control), the Drawing Pad (larger active digitizer with pressure response and programmable buttons), and the TrackPoint (small red analog pointing nub integrated into the keyboard between the G, H, and B keys allowing cursor manipulation without lifting hands from typing position).'
            ]
          },
          {
            heading: '3. System Memory (SODIMM) Form Factors',
            body: [
              'The industry-standard form factor for laptop RAM is the Small Outline Dual In-line Memory Module (SODIMM), located in the bottom of the clamshell.',
              'Technicians must recognize module pinouts: 204-pin for DDR3, 260-pin for DDR4, and 262-pin for DDR5. Modules can operate in 32-bit or 64-bit configurations and must be physically inserted at a 45-degree angle before locking flat into dual side spring retention clips.'
            ]
          },
          {
            heading: '4. Internal Drives: Form Factors & Cable Connections',
            body: [
              'Laptops store data internally using Hard Disk Drives (HDDs) or Solid-State Drives (SSDs) across three main form factors: 2.5", 1.8", or M.2 (2230, 2242, 2260, 2280).',
              'HDDs use rotating magnetic platters offering larger capacity at lower cost, but are slower and prone to physical damage from drops. SSDs use non-volatile flash memory chips, providing significantly higher speeds, smaller physical profiles, and superior shock resistance.',
              'Most 2.5" laptop drive bays use a single combination Serial Advanced Technology Attachment (SATA) cable that delivers both DC power and high-speed data to the drive.'
            ]
          },
          {
            heading: '5. Wireless NICs & Antenna Hinge Routing',
            body: [
              'The internal wireless Network Interface Card (NIC) is installed in an M.2 socket in the bottom clamshell. It allows 802.11 Wi-Fi and Bluetooth communication.',
              'The Wi-Fi antennas are generally positioned in the TOP of the clamshell case above the display to achieve maximum elevation and line-of-sight signal reception.',
              'Antenna wires (Main and Aux coaxial cables) run from the top bezel, through the display hinge channel, down into the bottom clamshell where they snap onto the M.2 NIC terminals. A pinched wire in the hinge will cause severe signal loss.'
            ]
          },
          {
            heading: '6. Connection Form Factors, Docking Stations & Styluses',
            body: [
              'Field technicians must identify common connection form factors by sight:',
              '• USB-A: Standard 4-pin (USB 1.1/2.0) or 9-pin (USB 3.0 blue connector with speeds up to 10 Gbps).',
              '• USB-C: 24 pins, symmetrical and reversible, offering high-speed data transfer and high-wattage USB Power Delivery.',
              '• Micro-USB: 5 pins, directionally dependent, offering speeds up to 5 Gbps.',
              '• Mini-USB: 4 or 5 pins, larger profile, up to 480 Mbps.',
              '• Lightning: 8-pin proprietary Apple connector used on mobile devices.',
              '• Docking Station vs. Port Replicator: A docking station connects via a proprietary multi-pin connector to supply an increased bank of expansion capabilities (full-sized drive bays, expansion bus slots, optical drives, memory card slots, additional display outputs). A port replicator simply duplicates the existing ports on the mobile device itself.'
            ],
            callout: {
              type: 'definition',
              title: 'Stylus Types: Active vs. Passive',
              content: 'A Passive Stylus has no electrical components and acts merely like a finger on any touch screen. An Active Stylus contains internal electronics and a battery that interact with a screen digitizer to enable pressure sensitivity, tilt angle detection, and palm rejection.'
            }
          }
        ],
        technicalTerms: [
          { term: 'SODIMM', definition: 'Small Outline Dual In-line Memory Module (204-pin DDR3, 260-pin DDR4, 262-pin DDR5).' },
          { term: 'TrackPoint', definition: 'Small red analog pointing nub integrated into a laptop keyboard between the G, H, and B keys.' },
          { term: 'Docking Station', definition: 'Laptop peripheral providing an increased bank of expansion capabilities including drive bays and bus slots.' },
          { term: 'Active Stylus', definition: 'Battery-powered stylus communicating with a digitizer for pressure sensitivity and palm rejection.' },
          { term: 'U.FL Antenna Snap', definition: 'Micro-coaxial antenna leads (Main and Aux) connecting the M.2 Wi-Fi card to top-bezel antennas.' }
        ],
        keyTakeaways: [
          'Replacement laptop batteries must match the exact voltage and chemistry (Li-ion & Li-poly can be cross-compatible).',
          'Wi-Fi antennas are located in the top of the display clamshell with cables routed through the hinges.',
          'Always disconnect the internal battery cable from the motherboard before servicing internal components.',
          'Docking stations provide expansion bus slots and drive bays, whereas port replicators only mirror ports.'
        ]
      }
    },
    {
      id: 'sec-diagram-1',
      type: 'diagram',
      title: 'Interactive Architecture: Laptop Hardware & Connectors',
      subtitle: 'Component Pinouts, Antenna Routing, & Interface Identification',
      estimatedMinutes: 8,
      diagramId: 'laptop-motherboard-ports',
      diagramTitle: 'Laptop Clamshell & Motherboard Hardware Map',
      description: 'Inspect internal motherboard sockets, display bezel antennas, and external connection ports. Click any node to review exact CompTIA specifications.',
      hotspots: [
        {
          id: 'ram',
          x: 58,
          y: 22,
          name: 'SODIMM RAM Sockets (204/260/262-Pin)',
          category: 'System Memory',
          shortDescription: 'Dual horizontal memory slots with spring-loaded side retention clips.',
          fullSpecs: 'SODIMM standard: 204-pin (DDR3), 260-pin (DDR4), 262-pin (DDR5). Supports 32-bit and 64-bit memory buses.',
          troubleshootingNote: 'Symptom: Continual POST beep codes or memory management BSOD. Insert at 45° angle before pressing flat.',
          examRelevance: 'CompTIA requires knowing SODIMM form factor and 45-degree angled insertion technique.'
        },
        {
          id: 'nvme',
          x: 65,
          y: 45,
          name: 'M.2 NVMe SSD Slot (2280/2242)',
          category: 'Solid-State Storage',
          shortDescription: 'Direct high-speed flash storage socket with M-key notch.',
          fullSpecs: 'Supports M.2 2280, 2260, 2242 form factors with PCIe NVMe lanes. Fast read/write and drop shock immunity.',
          troubleshootingNote: 'Symptom: "No Bootable Device" in UEFI if the single standoff screw becomes loose.',
          examRelevance: 'Identify M.2 solid-state drive form factors (2280 = 22mm wide by 80mm long).'
        },
        {
          id: 'sata',
          x: 75,
          y: 72,
          name: '2.5" SATA Drive Bay & Cable',
          category: 'Storage Bay',
          shortDescription: 'Accommodates 2.5" or 1.8" SATA SSDs and rotating magnetic HDDs.',
          fullSpecs: 'Single combination SATA cable delivering both 5V DC power and 6 Gbps Serial ATA data lines.',
          troubleshootingNote: 'Symptom: Clicking noise indicates failing HDD magnetic actuator arms or damaged spindle motor.',
          examRelevance: 'Know that laptops use 2.5" or 1.8" form factors connected via single combination SATA power/data cables.'
        },
        {
          id: 'batt',
          x: 48,
          y: 84,
          name: 'Lithium Battery Pack & Connector',
          category: 'DC Power System',
          shortDescription: 'Internal 4-cell pouch battery connected via multi-wire motherboard harness.',
          fullSpecs: 'Lithium-ion / Lithium-polymer pack. Replacement requires exact voltage and matching chemistry.',
          troubleshootingNote: 'Symptom: Swelling pack lifting trackpad or refusing to charge. Mandatory disconnect step during teardown.',
          examRelevance: 'Exam rule: Replacement batteries must match voltage and chemistry (Li-ion & Li-poly cross-compatible).'
        },
        {
          id: 'wifi',
          x: 34,
          y: 58,
          name: 'M.2 WLAN Wireless NIC',
          category: 'Wireless Comms',
          shortDescription: 'M.2 2230 card with dual Main and Aux coaxial antenna leads.',
          fullSpecs: '802.11ax Wi-Fi 6E + Bluetooth 5.3 transceiver module with dual micro U.FL snap connectors.',
          troubleshootingNote: 'Symptom: Extremely weak Wi-Fi range after a display repair indicates disconnected or pinched antenna leads.',
          examRelevance: 'Procedure: Disconnect 2 antenna wires, remove retaining screw, and pull straight out of M.2 socket.'
        },
        {
          id: 'antenna',
          x: 50,
          y: 8,
          name: 'Top Display Bezel Wi-Fi Antennas',
          category: 'RF Subsystem',
          shortDescription: 'Dual antenna wires routed through hinges up to the top clamshell bezel.',
          fullSpecs: 'Positioned at the highest point of the laptop for optimal elevation and 360-degree signal reception.',
          troubleshootingNote: 'Symptom: Wi-Fi signal drops to 1 bar when laptop screen lid is opened or adjusted.',
          examRelevance: 'CompTIA exam asks why Wi-Fi antennas are placed in the top of the clamshell case: for better signal reception.'
        },
        {
          id: 'cam',
          x: 50,
          y: 2,
          name: 'Webcam & Microphone Assembly',
          category: 'User Interface',
          shortDescription: 'Centered camera module with built-in illumination LED and dual microphones.',
          fullSpecs: 'Digital USB/MIPI interface centered above display. Includes hardware indicator light for privacy.',
          troubleshootingNote: 'Symptom: Grainy or flickering video caused by worn flex cable running through the display hinge.',
          examRelevance: 'Webcam and microphones are mounted in the top clamshell above the display.'
        },
        {
          id: 'trackpoint',
          x: 50,
          y: 35,
          name: 'TrackPoint Analog Pointing Stick',
          category: 'Input Hardware',
          shortDescription: 'Red rubber joystick located between the G, H, and B keyboard keys.',
          fullSpecs: 'Strain gauge analog pointing sensor allowing cursor control without removing fingers from home typing row.',
          troubleshootingNote: 'Symptom: Cursor drifting across screen can be recalibrated in Windows Mouse Properties.',
          examRelevance: 'Identify TrackPoint as an integrated analog pointing device on laptop keyboards.'
        },
        {
          id: 'usbc',
          x: 8,
          y: 52,
          name: 'USB-C (24-Pin Symmetrical Port)',
          category: 'High-Speed I/O',
          shortDescription: 'Reversible connector supporting data transfer and high-wattage Power Delivery.',
          fullSpecs: '24-pin symmetrical pinout. Eliminates directional orientation issues and supports alternate display modes.',
          troubleshootingNote: 'Symptom: Intermittent charging caused by lint compacted deep inside the Type-C port cavity.',
          examRelevance: 'USB-C features 24 pins, is symmetrical (reversible), and supports high data speeds and power delivery.'
        },
        {
          id: 'dock',
          x: 8,
          y: 75,
          name: 'Docking Station Interface',
          category: 'Expansion Bus',
          shortDescription: 'High-density proprietary connector linking laptop to expanded enterprise docks.',
          fullSpecs: 'Connects to a docking station to provide an increased bank of expansion capabilities: drive bays, PCIe bus, and displays.',
          troubleshootingNote: 'Symptom: Docking connector pins bent from improper mechanical alignment.',
          examRelevance: 'Distinguish Docking Station (drive bays, bus slots, expansion) from Port Replicator (port mirroring only).'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Where are laptop Wi-Fi antennas typically installed to achieve maximum signal reception?',
          targetHotspotId: 'antenna',
          hint: 'Look at the highest point of the laptop in the top clamshell bezel above the screen.'
        },
        {
          prompt: 'Identify the red analog pointing device integrated into the laptop keyboard between G, H, and B keys.',
          targetHotspotId: 'trackpoint',
          hint: 'Look at the center of the keyboard between the G, H, and B keys.'
        },
        {
          prompt: 'Locate the expansion interface that provides additional drive bays and bus slots rather than simple port mirroring.',
          targetHotspotId: 'dock',
          hint: 'Look for the docking station interface along the chassis connector bank.'
        },
        {
          prompt: 'Identify the 24-pin symmetrical, reversible connector used for modern high-speed data and power delivery.',
          targetHotspotId: 'usbc',
          hint: 'Look at the left edge I/O ports for the symmetrical USB-C connector.'
        }
      ]
    },
    {
      id: 'sec-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Hardware Teardown (CAD Blueprint)',
      subtitle: 'Exploded View, Spatial Assembly & Component Isolation',
      estimatedMinutes: 10,
      modelId: 'laptop-teardown-cad',
      modelTitle: '3D Exploded Laptop Teardown Blueprint',
      description: 'Interact with the technical CAD blueprint in real-time. Drag the Exploded View slider to separate the chassis layers and click any component to inspect its specifications.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'chassis-bottom',
          name: 'Bottom Clamshell Enclosure',
          category: 'Structural Enclosure',
          color: '#1e293b',
          shape: 'box',
          dimensions: [10, 0.4, 7],
          defaultPosition: [0, -2.0, 0],
          explodedPosition: [0, -4.5, 0],
          description: 'Magnesium-aluminum alloy bottom cover with intake ventilation grilles, rubber non-slip feet, and perimeter captive screw standoffs.',
          specs: 'Secured via Torx T5 or Phillips #00 screws. Must be removed first to access internal FRU modules.',
          failureSymptoms: 'Stripped screw standoffs, cracked hinge anchor mounts, or clogged intake dust filters.'
        },
        {
          id: 'battery-pack',
          name: 'Lithium-Ion / Polymer Battery Pack',
          category: 'Internal DC Power',
          color: '#0f172a',
          shape: 'box',
          dimensions: [7.5, 0.35, 2.8],
          defaultPosition: [0, -1.4, 1.8],
          explodedPosition: [0, -3.2, 3.2],
          description: 'Internal 4-cell lithium-polymer battery pack with SMBus telemetry harness. Mandatory first internal disconnect.',
          specs: '15.4V DC Nominal, 56 Wh. Replacement must match exact voltage and chemistry (Li-ion / Li-poly cross-compatible).',
          failureSymptoms: 'Pouch cell swelling causing trackpad to pop out, rapid discharge, or failure to charge past 1%.'
        },
        {
          id: 'drive-bay-25',
          name: '2.5" SATA Storage Drive Bay',
          category: 'Internal Storage',
          color: '#334155',
          shape: 'box',
          dimensions: [2.8, 0.3, 3.8],
          defaultPosition: [-2.8, -1.0, 1.4],
          explodedPosition: [-4.0, -1.5, 3.0],
          description: 'Internal 2.5" SATA drive bay housing either an HDD (magnetic spinning disc) or 2.5" SATA SSD with combo ribbon cable.',
          specs: 'Connected via single combination Serial ATA data and power cable (5V DC + 6 Gbps SATA III).',
          failureSymptoms: 'Clicking sounds from damaged magnetic heads (HDD) or unreadable sectors.'
        },
        {
          id: 'motherboard',
          name: 'System PCB Logic Motherboard',
          category: 'Core System Board',
          color: '#064e3b',
          shape: 'board',
          dimensions: [9.5, 0.15, 4.6],
          defaultPosition: [0, -0.6, -0.6],
          explodedPosition: [0, -0.8, -0.6],
          description: 'High-density multi-layer printed circuit board hosting system SoC, VRM circuitry, and expansion sockets.',
          specs: 'Integrated BGA CPU/GPU, eDP display connector, and dual-channel memory bus traces.',
          failureSymptoms: 'No power, burnt SMD power rail capacitors, or liquid spill oxidation.'
        },
        {
          id: 'heatpipe',
          name: 'Copper Heat Pipe Vacuum Assembly',
          category: 'Thermal Subsystem',
          color: '#d97706',
          shape: 'heatpipe',
          dimensions: [6.5, 0.22, 1.2],
          defaultPosition: [-1.2, -0.2, -1.2],
          explodedPosition: [-1.5, 1.2, -1.2],
          description: 'Sealed copper vacuum tube filled with demineralized water for high-speed phase-change heat transfer from CPU to radiator.',
          specs: 'Direct contact cold plate with thermal interface material (TIM) conducting heat to fin stack.',
          failureSymptoms: 'Micro-fractures causing loss of vacuum, resulting in instant CPU thermal throttling at 100°C.'
        },
        {
          id: 'fan-blower',
          name: 'Centrifugal Blower Cooling Fan',
          category: 'Active Cooling',
          color: '#0284c7',
          shape: 'fan',
          dimensions: [2.2, 0.55, 2.2],
          defaultPosition: [-3.6, -0.2, -1.5],
          explodedPosition: [-4.2, 1.4, -1.5],
          description: 'PWM brushless centrifugal blower pulling air from the center eye and forcing it horizontally through the fin stack.',
          specs: '5V DC Brushless motor with 4-pin PWM speed control and tachometer feedback.',
          failureSymptoms: 'Grinding sleeve bearing noise, lint felt clogging fins, or fan stall BIOS error.'
        },
        {
          id: 'ram-module',
          name: 'Dual SODIMM RAM Modules',
          category: 'System Memory',
          color: '#10b981',
          shape: 'box',
          dimensions: [2.6, 0.1, 1.3],
          defaultPosition: [1.8, -0.3, -1.0],
          explodedPosition: [2.2, 2.0, -1.0],
          description: 'Small Outline Dual In-line Memory Modules (204-pin DDR3, 260-pin DDR4, or 262-pin DDR5) in horizontal sockets.',
          specs: 'Inserted at a 45-degree angle before pressing downward until dual side metal spring clips latch.',
          failureSymptoms: 'Continuous POST beep codes, memory management kernel panics, or random reboots.'
        },
        {
          id: 'm2-ssd',
          name: 'M.2 NVMe PCIe SSD (2280)',
          category: 'Solid-State Storage',
          color: '#6366f1',
          shape: 'box',
          dimensions: [3.0, 0.1, 1.0],
          defaultPosition: [2.4, -0.3, 0.4],
          explodedPosition: [3.2, 2.2, 0.6],
          description: 'High-speed M.2 2280 solid-state drive with 3D NAND flash memory and single Phillips retention standoff screw.',
          specs: 'PCIe 4.0 x4 interface via M-key notch, offering fast boot speeds and shock resistance.',
          failureSymptoms: 'SMART error warnings, read-only drive lock, or UEFI missing boot drive.'
        },
        {
          id: 'wifi-nic',
          name: 'M.2 2230 WLAN Wireless NIC',
          category: 'Wireless Comms',
          color: '#0ea5e9',
          shape: 'box',
          dimensions: [1.2, 0.1, 1.2],
          defaultPosition: [-0.6, -0.3, -0.2],
          explodedPosition: [-0.8, 1.8, -0.2],
          description: 'M.2 2230 wireless network card with dual gold U.FL coaxial antenna snap terminals (Main and Aux).',
          specs: '802.11 Wi-Fi and Bluetooth. Disconnected by unsnapping antenna leads and removing retention screw.',
          failureSymptoms: 'Extremely poor wireless signal caused by unseated antenna snaps or pinched antenna wire in hinge.'
        },
        {
          id: 'trackpad',
          name: 'Precision Capacitive Trackpad',
          category: 'Pointing Device',
          color: '#475569',
          shape: 'box',
          dimensions: [3.4, 0.1, 2.2],
          defaultPosition: [0, 0.1, 2.4],
          explodedPosition: [0, 2.8, 3.2],
          description: 'Finger-responsive capacitive touch trackpad with integrated click switches and I2C flex ribbon cable.',
          specs: 'Provides basic cursor control and multi-finger gestures. Sits directly above internal battery.',
          failureSymptoms: 'Inability to click when underlying lithium battery swells and pushes upward against the sensor plate.'
        },
        {
          id: 'keyboard-trackpoint',
          name: 'Clamshell Keyboard & TrackPoint',
          category: 'Input Hardware',
          color: '#334155',
          shape: 'box',
          dimensions: [9.8, 0.25, 3.8],
          defaultPosition: [0, 0.2, 0],
          explodedPosition: [0, 4.0, 0],
          description: 'Clamshell keyboard featuring individually replaceable keycaps and the iconic red TrackPoint analog pointing stick.',
          specs: 'ZIF ribbon cable connecting keyboard matrix and TrackPoint strain gauge to motherboard controller.',
          failureSymptoms: 'Sticking keys from spills, missing keycaps, or cursor drifting from uncalibrated TrackPoint.'
        },
        {
          id: 'display-clamshell',
          name: 'Display Clamshell, Webcam & Antennas',
          category: 'Display & RF Assembly',
          color: '#0f172a',
          shape: 'box',
          dimensions: [10.2, 0.35, 7.2],
          defaultPosition: [0, 2.2, -3.2],
          explodedPosition: [0, 4.8, -4.0],
          rotation: [-0.7, 0, 0],
          description: 'Upper clamshell lid housing the LCD panel, top-mounted HD webcam, indicator LED, microphones, and Wi-Fi antennas routed through the hinges.',
          specs: 'eDP display cable and dual coaxial antenna leads routed through left/right display hinge channels.',
          failureSymptoms: 'Screen flickering when moving lid or complete Wi-Fi dropout due to pinched hinge wiring.'
        }
      ]
    },
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
    {
      id: 'sec-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Hardware Teardown & Upgrade',
      subtitle: 'Step-by-Step Interactive Field Procedure Following CompTIA Rules',
      estimatedMinutes: 10,
      labTitle: 'Enterprise Laptop Internal Component Replacement Protocol',
      goal: 'Safely execute the official CompTIA disassembly sequence: isolate power, disconnect internal battery, replace SODIMM memory at 45°, service M.2 storage, and disconnect Wi-Fi antenna snaps.',
      hardwareSubject: 'Laptop Clamshell Internal Architecture',
      prerequisites: [
        'Anti-Static ESD Wrist Strap bonded to earth ground',
        'Phillips #00 and Torx T5 precision screwdrivers',
        'Non-conductive plastic spudger / pry tool'
      ],
      steps: [
        {
          id: 'step-1',
          instruction: 'Step 1: Isolate AC Power & Don ESD Grounding Strap',
          detail: 'Unplug the external AC adapter. Fasten your ESD wrist strap to a grounded chassis point before handling any semiconductor hardware.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'AC mains isolated and ESD strap verified. Electrostatic discharge danger eliminated.'
        },
        {
          id: 'step-2',
          instruction: 'Step 2: Remove Bottom Clamshell Fasteners & Cover',
          detail: 'Loosen the perimeter captive Phillips/Torx screws holding the lower clamshell cover. Use a plastic spudger to release edge snaps and set cover aside.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'Bottom clamshell enclosure removed. Internal components and motherboard are now accessible.'
        },
        {
          id: 'step-3',
          instruction: 'Step 3: Mandatory First Action: Disconnect Internal Battery',
          detail: 'Before loosening any component screws or touching circuits, disconnect the multi-wire internal battery harness from the motherboard header.',
          actionType: 'disconnect-battery',
          safetyWarning: 'Working on a motherboard with live battery standby rails can cause catastrophic short circuits if metal tools contact traces.',
          feedbackOnSuccess: 'Battery harness disconnected! Motherboard power rails are completely de-energized.'
        },
        {
          id: 'step-4',
          instruction: 'Step 4: Upgrade SODIMM RAM (45-Degree Insertion)',
          detail: 'Spread the side spring retention clips to release the existing module. Insert the new 260-pin DDR4 SODIMM into the socket at a 45-degree angle, then press flat until both clips snap.',
          actionType: 'insert-ram',
          feedbackOnSuccess: 'Click! Dual metal spring retention clips locked securely with module seated flat.'
        },
        {
          id: 'step-5',
          instruction: 'Step 5: Replace M.2 Storage / 2.5" Drive',
          detail: 'Remove the single M2 standoff retention screw. Allow the M.2 SSD to tilt up at 30 degrees, slide it out of the M-key slot, and insert the replacement NVMe drive.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'M.2 NVMe SSD installed into slot and secured with standoff screw.'
        },
        {
          id: 'step-6',
          instruction: 'Step 6: Service Wireless NIC & Antenna Snap Leads',
          detail: 'Use a plastic spudger to gently pop off the Main and Aux micro-coaxial antenna snaps. Remove the retention screw and extract the M.2 2230 WLAN card.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Coaxial antenna snaps released without strain and WLAN card safely extracted.'
        },
        {
          id: 'step-7',
          instruction: 'Step 7: Reconnect Battery, Fasten Cover & Verify UEFI POST',
          detail: 'Reconnect the internal battery harness, snap the bottom enclosure back in place, tighten screws, and power on to verify total RAM and SSD in UEFI/BIOS.',
          actionType: 'verify-post',
          feedbackOnSuccess: 'UEFI System Information detects 16GB Dual Channel DDR4 and NVMe SSD active! All tests pass.'
        }
      ],
      successMessage: 'Outstanding work! You followed the exact CompTIA manufacturer procedure for laptop component replacement without risking ESD damage or short circuits.',
      xpReward: 300
    },
    {
      id: 'sec-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: Mobile Hardware Field Scenarios',
      subtitle: 'CompTIA 6-Step Diagnostic Methodology',
      estimatedMinutes: 8,
      caseTitle: 'The Bulging Trackpad & Erratic Battery Shutdowns',
      clientName: 'David Miller, Senior Analyst',
      deviceModel: 'Corporate Ultrabook 14',
      initialProblemDescription: 'User reports that the laptop trackpad has physically popped upward and will no longer click down. The laptop also turns off immediately whenever the AC power adapter is disconnected.',
      startStepId: 'step-gather-info',
      steps: {
        'step-gather-info': {
          id: 'step-gather-info',
          title: 'Step 1: Identify the Problem & Inspect Physical Symptoms',
          scenarioText: 'You inspect the laptop. The lower chassis deck and trackpad are pushed upward from underneath. What is the most probable cause?',
          customerStatement: 'I noticed the mouse button was getting harder to click last week, and now the trackpad is bulging out of the case.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: '42°C',
            beepCodes: 'None'
          },
          diagnosticOptions: [
            {
              id: 'c-swollen-battery',
              label: 'Diagnose a swollen internal Lithium-Polymer battery pack posing a safety risk',
              actionDescription: 'Recognize that pouch-style lithium battery packs swell with gas under internal short or overcharge, pushing against the trackpad above them.',
              nextStepId: 'step-battery-selection',
              feedback: 'Spot on! In thin laptops, the flat lithium-polymer battery sits directly beneath the trackpad. As cells degrade and generate gas, they swell and deform the trackpad.'
            },
            {
              id: 'c-tighten-trackpad',
              label: 'Force the trackpad back down and tighten trackpad screws from the top',
              actionDescription: 'Push down hard on the trackpad to snap it back into place.',
              isFatal: true,
              feedback: 'Hazardous action! Forcing a swollen battery can puncture the pouch, leading to catastrophic thermal runaway and fire!'
            },
            {
              id: 'c-reinstall-driver',
              label: 'Reinstall Windows Precision Touchpad drivers in Device Manager',
              actionDescription: 'Attempt a software fix for physical casing deformation.',
              isFatal: true,
              feedback: 'Incorrect: A physical casing bulge cannot be resolved with software drivers and leaves a severe fire hazard unaddressed.'
            }
          ]
        },
        'step-battery-selection': {
          id: 'step-battery-selection',
          title: 'Step 2: Select the Correct Replacement Battery',
          scenarioText: 'You power down the laptop, safely unseat the swollen battery, and dispose of it in a certified hazardous containment bin. You need to order a replacement. Which rule must you follow based on CompTIA guidelines?',
          systemState: {
            power: 'off',
            screen: 'blank',
            fan: 'silent'
          },
          diagnosticOptions: [
            {
              id: 'c-chemistry-voltage',
              label: 'Select a replacement with identical chemistry (or certified Li-ion/Li-poly cross-compatible) and exact matching voltage',
              actionDescription: 'Consult manufacturer specifications to ensure exact voltage rating and approved chemistry.',
              nextStepId: 'step-antenna-scenario',
              feedback: 'Exact! Replacement batteries must have the same battery chemistry (except Li-ion and Li-poly which can be cross-compatible in specific instances) and exact matching voltage.'
            },
            {
              id: 'c-higher-voltage',
              label: 'Order a higher-voltage battery to make the laptop run faster',
              actionDescription: 'Choose a 19V battery for a 15.4V motherboard.',
              isFatal: true,
              feedback: 'Fatal error! Excess voltage will fry motherboard voltage regulator modules (VRMs) instantly upon power-on.'
            }
          ]
        },
        'step-antenna-scenario': {
          id: 'step-antenna-scenario',
          title: 'Step 3: Secondary Case - Weak Wi-Fi After Hinge Repair',
          scenarioText: 'Another technician recently replaced the display hinges on a client laptop. The user now complains that Wi-Fi drops to 1 bar or disconnects completely when walking more than 3 meters from the access point. What is the root cause?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-pinched-antenna',
              label: 'The Wi-Fi antenna wires routed through the hinge were pinched, severed, or unseated from the M.2 card',
              actionDescription: 'Disassemble display hinge cover and inspect the Main and Aux coaxial antenna leads.',
              isResolved: true,
              feedback: 'RESOLUTION CONFIRMED! The Main antenna wire was pinched inside the metal hinge bracket during reassembly, breaking the RF shield. Re-routing the cable restores full 5-bar reception.'
            },
            {
              id: 'c-replace-router',
              label: 'Replace the corporate access point router with higher transmission power',
              actionDescription: 'Blame the corporate wireless network.',
              feedback: 'Incorrect: Other devices on the floor maintain full signal; the issue followed a physical hinge repair on this specific laptop.'
            }
          ]
        }
      }
    },
    {
      id: 'sec-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Objective 1.1 Mobile Devices Assessment',
      subtitle: 'CompTIA A+ Core 1 Official Exam Validation',
      estimatedMinutes: 8,
      quizTitle: 'CompTIA A+ Core 1 (220-1101 / 1201) Objective 1.1 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 350,
      questions: [
        {
          id: 'q1',
          question: 'A technician is replacing a laptop battery. According to official hardware specifications, which criteria must the replacement battery strictly meet?',
          options: [
            'It must have a higher voltage than the original to extend battery life',
            'It must have the same battery chemistry (or certified Li-ion/Li-poly cross-compatible) and identical voltage',
            'It must be a Nickel-Cadmium (NiCd) pack regardless of original model',
            'Any battery that physically fits into the slot is acceptable'
          ],
          correctAnswer: 1,
          explanation: 'Replacement batteries must have the same battery chemistry (with the exception of Li-ion and Li-poly, which may be cross-compatible in specific instances) and exact matching voltage for proper compatibility.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Battery'
        },
        {
          id: 'q2',
          question: 'Where are Wi-Fi antennas generally located in a modern clamshell laptop, and why?',
          options: [
            'Inside the battery pack to shield from electrical noise',
            'In the top of the clamshell case for better signal reception',
            'Under the trackpad to reduce wire length to the processor',
            'Directly soldered to the cooling fan housing'
          ],
          correctAnswer: 1,
          explanation: 'The Wi-Fi antenna is generally located in the top of the clamshell case to place the antenna higher up for better signal reception, with wires routed through the hinge down to the motherboard.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Wi-Fi Connector'
        },
        {
          id: 'q3',
          question: 'How does a docking station differ fundamentally from a standard port replicator?',
          options: [
            'A docking station only supports wireless Bluetooth peripherals',
            'A docking station provides an increased bank of expansion capabilities including drive bays and bus slots',
            'A port replicator contains a dedicated GPU while docking stations do not',
            'A port replicator requires AC mains power while docking stations are unpowered'
          ],
          correctAnswer: 1,
          explanation: 'A docking station is a laptop peripheral that allows for connection to an increased bank of expansion capabilities, including additional ports, full-sized drive bays, expansion bus slots, and optical drives. A port replicator only replicates existing ports.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Docking Station vs Port Replicator'
        },
        {
          id: 'q4',
          question: 'Which pin counts correspond to DDR4 and DDR5 SODIMM memory modules commonly utilized in modern laptops?',
          options: [
            '184-pin and 240-pin',
            '204-pin and 240-pin',
            '260-pin (DDR4) and 262-pin (DDR5)',
            '288-pin (DDR4) and 288-pin (DDR5)'
          ],
          correctAnswer: 2,
          explanation: 'Laptop SODIMMs utilize 204-pin for DDR3, 260-pin for DDR4, and 262-pin for DDR5. (288-pin is the full-sized desktop DIMM standard).',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Random Access Memory'
        },
        {
          id: 'q5',
          question: 'A user wants a pen accessory that supports pressure sensitivity, tilt detection, and palm rejection for digital art. Which device should the technician recommend?',
          options: [
            'A passive stylus',
            'An active stylus',
            'A capacitive rubber pointer',
            'A standard laser pointer'
          ],
          correctAnswer: 1,
          explanation: 'An active stylus contains electrical components and a power source that interact with a compatible digitizer, allowing for increased functionality including pressure sensitivity, tilt detection, and palm rejection.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Stylus'
        },
        {
          id: 'q6',
          question: 'What is the small red analog pointing device integrated into a laptop keyboard between the G, H, and B keys called?',
          options: [
            'Trackpad',
            'Digitizer',
            'TrackPoint',
            'Biometric scanner'
          ],
          correctAnswer: 2,
          explanation: 'A TrackPoint is a small analog pointing device integrated into a keyboard that allows the user to manipulate the cursor without moving their hands from the typing position.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Track Accessories'
        },
        {
          id: 'q7',
          question: 'Which USB connector standard features 24 pins, is symmetrical, and allows connection independent of orientation?',
          options: [
            'USB-A',
            'USB-C',
            'Micro-USB',
            'Mini-USB'
          ],
          correctAnswer: 1,
          explanation: 'USB-C has 24 pins and is symmetrical, allowing for connection not dependent on orientation, and supports increased data transfer speeds and power delivery.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Universal Serial Bus'
        },
        {
          id: 'q8',
          question: 'When removing an internal wireless Network Interface Card (NIC) from a laptop, what must be disconnected before pulling the card from the M.2 socket?',
          options: [
            'The CPU heat sink',
            'The two antenna wires (Main and Aux)',
            'The display panel backlight inverter',
            'The CMOS coin-cell battery'
          ],
          correctAnswer: 1,
          explanation: 'Removing the NIC requires removing the screw holding the NIC in place, disconnecting the two antenna wires, and pulling it straight out of the M.2 socket.',
          examObjectiveRef: 'CompTIA A+ Mobile Devices: Wireless Cards'
        }
      ]
    },
    ...A_PLUS_1_1_EXTRA_STAGES
  ]
};

// Re-order A+ 1.1 stages so the quiz is always the final stage
COMPTIA_A_PLUS_1_1_LESSON.sections = [
  ...COMPTIA_A_PLUS_1_1_LESSON.sections.filter(s => s.type !== 'quiz'),
  ...COMPTIA_A_PLUS_1_1_LESSON.sections.filter(s => s.type === 'quiz')
];

// Master Static Lessons Registry per course
const COURSE_LESSONS_REGISTRY: Record<string, Record<string, LessonData>> = {
  'a-plus': {
    '1.1': COMPTIA_A_PLUS_1_1_LESSON,
    '1.1_laptop_hardware': COMPTIA_A_PLUS_1_1_LESSON,
    '2.1': COMPTIA_A_PLUS_2_1_LESSON,
    '3.4': COMPTIA_A_PLUS_3_4_LESSON,
    '5.1': COMPTIA_A_PLUS_5_1_LESSON,
    'c2_2.4': COMPTIA_A_PLUS_C2_2_4_LESSON
  },
  'network-plus': {
    '1.1': NETWORK_PLUS_1_1_LESSON
  },
  'matric-to-money': {
    '1.1': MATRIC_TO_MONEY_1_1_LESSON
  },
  'beyond-the-chatbot': {
    '1.1': BEYOND_CHATBOT_1_1_LESSON
  }
};

/**
 * Resolves an interactive lesson for any course objective.
 * Returns built-in bespoke interactive modules when registered, or null so
 * objectives with an uploaded PDF fall back to PDFReader unless converted via the Admin AI Studio.
 */
export const getInteractiveLesson = (
  courseId: string,
  objectiveId: string,
  _objectiveDomainOrTitle?: string
): LessonData | null => {
  const courseMap = COURSE_LESSONS_REGISTRY[courseId];
  if (!courseMap) return null;

  const prefix = `${courseId}_`;
  const cleanId = objectiveId.startsWith(prefix)
    ? objectiveId.slice(prefix.length)
    : objectiveId;

  if (courseMap[cleanId]) {
    return courseMap[cleanId];
  }
  if (courseMap[objectiveId]) {
    return courseMap[objectiveId];
  }

  return null;
};


