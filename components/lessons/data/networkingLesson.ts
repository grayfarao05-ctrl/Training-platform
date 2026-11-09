import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_NETWORKING_LESSON: LessonData = {
  objectiveId: '2.1',
  courseId: 'a-plus',
  title: 'Network Topologies, Hardware & RJ-45 Cabling',
  domainName: 'Domain 2.0: Networking',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master enterprise network architectures, OSI layers, T568A/T568B copper termination, patch panel distribution, managed switches, and DHCP/DNS troubleshooting.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'net-text-1',
      type: 'text',
      title: 'Technical Briefing: Network Infrastructure',
      subtitle: 'Twisted Pair Standards, OSI Architecture, & Hardware Roles',
      estimatedMinutes: 6,
      content: {
        lead: 'Modern enterprise networks rely on structured cabling, managed switching, and routing protocols. Technicians must differentiate Layer 2 switching from Layer 3 routing, master T568B pinout color codes, and identify common port/protocol configurations.',
        sections: [
          {
            heading: 'Ethernet Twisted-Pair Standards & Pinouts',
            body: [
              'Unshielded Twisted Pair (UTP) and Shielded Twisted Pair (STP) cables minimize electromagnetic interference (EMI) and crosstalk through differential signaling across tightly wound wire pairs.',
              'CompTIA exams heavily test the TIA/EIA 568A and 568B color codes. A straight-through patch cable uses identical standards at both ends (e.g. 568B to 568B) to connect different device types (PC to Switch). A crossover cable uses 568A at one end and 568B at the other to connect identical device types (Switch to Switch), although modern Auto-MDI/MDIX ports automate this detection.'
            ],
            bulletPoints: [
              'Cat 5e: 1 Gbps up to 100 meters (100 MHz bandwidth).',
              'Cat 6: 10 Gbps up to 55 meters; 1 Gbps up to 100 meters (250 MHz bandwidth).',
              'Cat 6a: 10 Gbps up to 100 meters with enhanced foil shielding (500 MHz bandwidth).',
              'T568B Color Order: Pin 1 (White/Orange), 2 (Orange), 3 (White/Green), 4 (Blue), 5 (White/Blue), 6 (Green), 7 (White/Brown), 8 (Brown).'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: T568B Standard',
              content: 'Memorize the T568B pinout: Pins 1 & 2 are Orange, Pins 3 & 6 are Green (split around Blue on 4 & 5), and Pins 7 & 8 are Brown. Pins 1, 2, 3, and 6 are the transmit/receive pins for 10/100Base-T.'
            }
          },
          {
            heading: 'Core Network Devices: Switches, Routers, and PoE',
            body: [
              'Switches operate primarily at Layer 2 (Data Link), keeping a MAC address table to forward frames directly to target ports without collision.',
              'Power over Ethernet (PoE - 802.3af 15.4W / 802.3at PoE+ 30W) delivers DC power alongside gigabit data over twisted-pair copper to run VoIP phones, PTZ security cameras, and Wireless Access Points without dedicated wall outlets.'
            ],
            callout: {
              type: 'pro-tip',
              title: 'Tech Pro-Tip: Patch Panel Best Practice',
              content: 'Never terminate solid-core horizontal riser cables directly into modular RJ-45 plugs. Punch down solid-core cables to 110-blocks on a patch panel, and use flexible stranded patch cables to connect from the panel to the switch.'
            }
          }
        ],
        technicalTerms: [
          { term: 'T568B', definition: 'The dominant telecommunications commercial wiring standard for RJ-45 8P8C modular connectors.' },
          { term: 'PoE (802.3at)', definition: 'Power over Ethernet Plus; injects up to 30 Watts of DC power over Ethernet pairs.' },
          { term: 'VLAN', definition: 'Virtual Local Area Network; logically isolates broadcast domains on Layer 2 switches.' },
          { term: 'APIPA', definition: 'Automatic Private IP Addressing (169.254.x.x); assigned by OS when DHCP server is unreachable.' }
        ],
        keyTakeaways: [
          'T568B pinout order: W-O, O, W-G, Bl, W-Bl, G, W-Br, Br.',
          'Switches use MAC addresses (Layer 2); Routers use IP addresses (Layer 3).',
          'PoE+ (802.3at) supplies up to 30W for access points and PTZ security cameras.',
          'An APIPA address (169.254.0.1 to 169.254.255.254) indicates failure to obtain a DHCP lease.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'net-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Enterprise Network Architecture',
      subtitle: 'Cabling Traces, Hardware Nodes, & Demarcation Boundaries',
      estimatedMinutes: 8,
      diagramId: 'network-topology',
      diagramTitle: 'Enterprise Structured Network Topology',
      description: 'Click each network node to inspect its Layer 1-3 functions, bandwidth capabilities, and common field failure indicators.',
      hotspots: [
        {
          id: 'router',
          x: 20,
          y: 25,
          name: 'Edge Router & Next-Gen Firewall',
          category: 'Layer 3 Gateway',
          shortDescription: 'Performs NAT translation, routing between subnets, and stateful packet inspection.',
          fullSpecs: 'Dual 10GbE SFP+ WAN uplinks, BGP/OSPF routing, DHCP Server pool, IPsec VPN tunnel endpoint.',
          troubleshootingNote: 'Symptom: All clients lose internet access simultaneously while internal file sharing continues working.',
          examRelevance: 'CompTIA tests default gateway misconfigurations and NAT translation failures.'
        },
        {
          id: 'switch',
          x: 50,
          y: 25,
          name: 'Core 48-Port PoE+ Managed Switch',
          category: 'Layer 2/3 Switching',
          shortDescription: 'High-density switchboard providing VLAN segregation and PoE power.',
          fullSpecs: '48x 1GbE RJ-45 ports with 802.3at PoE+, 740W power budget, 802.1Q VLAN trunking.',
          troubleshootingNote: 'Symptom: Excessive collisions or broadcast storms caused by spanning tree protocol (STP) loops.',
          examRelevance: 'Understand that unmanaged switches cannot configure VLANs or rate limiting.'
        },
        {
          id: 'patch',
          x: 80,
          y: 25,
          name: '110-Punchdown Patch Panel',
          category: 'Layer 1 Physical Layer',
          shortDescription: 'Passive termination block receiving solid-core copper runs from office wall jacks.',
          fullSpecs: 'Cat 6 certified, 110-style insulation displacement connectors (IDC), color-coded T568A/B wire guides.',
          troubleshootingNote: 'Symptom: Intermittent packet loss or fallback from 1Gbps to 100Mbps caused by split pairs or loose punchdown pins.',
          examRelevance: 'Always use a calibrated punchdown tool with the cutoff blade facing outward.'
        },
        {
          id: 'ap',
          x: 35,
          y: 75,
          name: 'Wi-Fi 6E Wireless Access Point',
          category: 'Wireless LAN (802.11ax)',
          shortDescription: 'Ceiling-mounted access point powered by PoE+ cable.',
          fullSpecs: 'Tri-band 2.4/5/6 GHz, 4x4 MU-MIMO, WPA3-Enterprise 802.1X authentication.',
          troubleshootingNote: 'Symptom: Users report "Connected, no internet" due to channel overlap or exceeding client association capacity.',
          examRelevance: 'Know difference between 2.4 GHz (longer range, more interference) and 5/6 GHz (higher speed, shorter range).'
        },
        {
          id: 'server',
          x: 75,
          y: 75,
          name: 'Corporate DHCP & DNS Server',
          category: 'Network Infrastructure Services',
          shortDescription: 'Issues IP leases (DHCP) and resolves hostnames to IP addresses (DNS).',
          fullSpecs: 'Windows Server 2022 Active Directory Domain Controller, Port 67/68 UDP (DHCP), Port 53 UDP/TCP (DNS).',
          troubleshootingNote: 'Symptom: Clients can ping external IPs (8.8.8.8) but cannot open websites (DNS failure).',
          examRelevance: 'Exam tests diagnosing DNS failure vs Gateway failure using ipconfig /all and nslookup.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the device responsible for issuing dynamic IP addresses and DNS configuration leases to clients.',
          targetHotspotId: 'server',
          hint: 'Look for the infrastructure server running ports 67/68 and 53.'
        },
        {
          prompt: 'Locate the Layer 1 hardware block where solid-core horizontal riser cables are terminated using a punchdown tool.',
          targetHotspotId: 'patch',
          hint: 'Look on the upper right for the passive 110-block termination panel.'
        },
        {
          prompt: 'Identify the edge gateway that connects the internal local area network to the ISP WAN.',
          targetHotspotId: 'router',
          hint: 'Look on the upper left for the boundary security router.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'net-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Network Switch Anatomy',
      subtitle: 'Port Arrays, SFP+ Uplinks, & Internal Redundant Power',
      estimatedMinutes: 8,
      modelId: 'network-switch',
      modelTitle: 'Rackmount 24-Port Managed Gigabit Switch',
      description: 'Inspect the physical anatomy of an enterprise rackmount switch. Drag the slider to explode the chassis cover and examine internal ASIC heat sinks, PSU modules, and port clusters.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'switch-chassis',
          name: '1U Steel Rack Chassis',
          category: 'Enclosure',
          color: '#334155',
          shape: 'box',
          dimensions: [10, 1.2, 7],
          defaultPosition: [0, -0.6, 0],
          explodedPosition: [0, -2.5, 0],
          description: 'Standard 19-inch 1U steel enclosure with integrated grounding screw and ear mounting brackets.',
          specs: 'Standard EIA-310 19-inch rack width, 1.75-inch height (1U), internal ESD shielding.',
          failureSymptoms: 'Bent rack ears or physical damage from improper rack screw mounting.'
        },
        {
          id: 'port-bank-1',
          name: 'RJ-45 Port Cluster (Ports 1-12)',
          category: 'Ethernet Physical Layer',
          color: '#0284c7',
          shape: 'box',
          dimensions: [4, 0.5, 1.2],
          defaultPosition: [-2.2, 0.2, 2.6],
          explodedPosition: [-3.0, 1.2, 3.2],
          description: 'High-cycle shielded 8P8C modular jacks with integrated green/amber link and activity LEDs.',
          specs: '10/100/1000Base-T Auto-MDIX, 802.3at PoE+ (up to 30W per port), gold-plated contacts.',
          failureSymptoms: 'Bent internal copper contact pins caused by forced or damaged cable boots.'
        },
        {
          id: 'port-bank-2',
          name: 'RJ-45 Port Cluster (Ports 13-24)',
          category: 'Ethernet Physical Layer',
          color: '#0284c7',
          shape: 'box',
          dimensions: [4, 0.5, 1.2],
          defaultPosition: [2.2, 0.2, 2.6],
          explodedPosition: [3.0, 1.2, 3.2],
          description: 'Second bank of 12 gigabit Ethernet ports with independent surge protection transformers.',
          specs: '10/100/1000Base-T with individual port isolation and port security MAC filtering.',
          failureSymptoms: 'Port shuts down automatically due to Port Security violation.'
        },
        {
          id: 'sfp-cages',
          name: 'SFP+ 10Gbps Fiber Uplink Cages',
          category: 'Optical Uplink',
          color: '#eab308',
          shape: 'box',
          dimensions: [1.8, 0.5, 1.2],
          defaultPosition: [4.4, 0.2, 2.6],
          explodedPosition: [5.2, 1.2, 3.2],
          description: 'Dual Small Form-factor Pluggable (SFP+) transceiver bays for high-speed fiber backbone connections.',
          specs: 'Supports 10GBASE-SR (Multi-Mode 850nm) and 10GBASE-LR (Single-Mode 1310nm) transceivers.',
          failureSymptoms: 'Dirty optical fiber LC connector ferrule causing high optical dB loss.'
        },
        {
          id: 'switch-asic',
          name: 'Switching Fabric ASIC & Heat Sink',
          category: 'Packet Processing',
          color: '#10b981',
          shape: 'box',
          dimensions: [2.5, 0.6, 2.5],
          defaultPosition: [0, 0.1, -0.5],
          explodedPosition: [0, 1.8, -0.5],
          description: 'Application-Specific Integrated Circuit delivering non-blocking wire-speed Layer 2 frame forwarding.',
          specs: '56 Gbps switching capacity, 41.6 Mpps forwarding rate, 16K MAC address table memory.',
          failureSymptoms: 'Thermal throttling of switch fabric during peak backup hours.'
        },
        {
          id: 'redundant-psu',
          name: 'Internal Switched-Mode Power Supply',
          category: 'Power Delivery',
          color: '#64748b',
          shape: 'box',
          dimensions: [3, 0.8, 4],
          defaultPosition: [-3.2, 0.1, -1.2],
          explodedPosition: [-4.5, 1.5, -1.2],
          description: 'AC to DC power supply converting 100-240V AC to 12V DC system logic and 54V DC PoE power.',
          specs: '250W total output, active PFC, 80 PLUS Bronze efficiency certification.',
          failureSymptoms: 'Complete switch power outage or blown internal fuse from lightning power surge.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'net-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: DHCP DORA & ARP Discovery',
      subtitle: 'The 4-Step IP Allocation Lifecycle',
      estimatedMinutes: 6,
      animationType: 'dhcp-dora',
      description: 'When a new workstation connects to an Ethernet port, it has no IP address. Watch how DHCP DORA packets negotiate network parameters across the broadcast domain.',
      steps: [
        {
          stepNumber: 1,
          label: 'DISCOVER (Broadcast UDP 67)',
          description: 'The client broadcasts a DHCPDISCOVER packet to 255.255.255.255 looking for any active DHCP server on the local subnet.',
          highlightedElement: 'Client NIC → Broadcast Domain',
          metrics: { label: 'Source / Dest IP', value: '0.0.0.0 → 255.255.255.255' }
        },
        {
          stepNumber: 2,
          label: 'OFFER (Unicast/Broadcast UDP 68)',
          description: 'The DHCP server reserves an available IP (e.g. 192.168.1.105) and responds with a DHCPOFFER containing IP, subnet mask, default gateway, and lease duration.',
          highlightedElement: 'DHCP Server → Client MAC',
          metrics: { label: 'Offered IP', value: '192.168.1.105 /24' }
        },
        {
          stepNumber: 3,
          label: 'REQUEST (Client Confirmation)',
          description: 'The client formally sends a DHCPREQUEST confirming acceptance of the offered address and acknowledging the specific server.',
          highlightedElement: 'Client NIC → DHCP Server',
          metrics: { label: 'Requested Lease', value: '8 Days (Default)' }
        },
        {
          stepNumber: 4,
          label: 'ACKNOWLEDGE (Binding Complete)',
          description: 'The server sends a DHCPACK packet confirming the lease binding. The client now binds the IP and performs an ARP check to verify no IP conflict exists.',
          highlightedElement: 'DHCP Server → Client Bound',
          metrics: { label: 'Lease Status', value: 'ACTIVE & BOUND' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'net-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: T568B RJ-45 Cable Termination',
      subtitle: 'Stripping, Color Ordering, Trimming, Crimping, & Cable Testing',
      estimatedMinutes: 8,
      labTitle: 'Cat 6 Ethernet Cable Fabrication & Continuity Verification',
      goal: 'Fabricate an exam-standard T568B straight-through patch cable and verify 8-pin continuity on a wire tester.',
      hardwareSubject: 'Cat 6 UTP Cable & Modular 8P8C Plugs',
      prerequisites: [
        'Rotary cable jacket stripper',
        'Flush wire cutters',
        'RJ-45 ratcheting crimp tool',
        'Digital cable pinout tester'
      ],
      steps: [
        {
          id: 'step-strip',
          instruction: 'Strip 1.5 inches of outer PVC jacket',
          detail: 'Score and remove the outer jacket without nicking the individual copper conductor insulation.',
          actionType: 'strip-jacket',
          feedbackOnSuccess: 'Outer jacket stripped clean. The 4 twisted pairs and nylon ripcord are exposed intact.'
        },
        {
          id: 'step-untwist',
          instruction: 'Untwist pairs and arrange in T568B color order',
          detail: 'Align conductors: White/Orange, Orange, White/Green, Blue, White/Blue, Green, White/Brown, Brown.',
          actionType: 'order-colors',
          feedbackOnSuccess: 'T568B sequence aligned correctly. Pins 1 through 8 are in exact industry standard order.'
        },
        {
          id: 'step-trim',
          instruction: 'Flatten and flush-trim wires to 0.5 inches (12mm)',
          detail: 'Cut conductors in a straight horizontal line so they seat evenly against the front wall of the RJ-45 plug.',
          actionType: 'trim-conductors',
          feedbackOnSuccess: 'Conductors trimmed flush and parallel at exactly 12mm length.'
        },
        {
          id: 'step-crimp',
          instruction: 'Insert wires into RJ-45 plug and compress ratcheting crimper',
          detail: 'Slide wires into the plug until copper is visible against front plastic wall. Crimp until ratchet releases.',
          actionType: 'crimp-connector',
          feedbackOnSuccess: 'Click! Golden contact prongs pierced conductors, and the outer jacket strain relief clip is anchored.'
        },
        {
          id: 'step-test',
          instruction: 'Connect cable to Digital Cable Tester and run continuity sweep',
          detail: 'Plug ends into Main and Remote units and verify green LEDs light sequentially 1 through 8.',
          actionType: 'test-continuity',
          feedbackOnSuccess: 'Pins 1 through 8 light in perfect sequential order with zero open, short, or crossed pin faults!'
        }
      ],
      successMessage: 'Cable test passed 100%! You demonstrated correct T568B ordering, proper strain relief clamping, and flawless continuity verification.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'net-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: The APIPA 169.254 Conundrum',
      subtitle: 'CompTIA 6-Step Network Troubleshooting',
      estimatedMinutes: 8,
      caseTitle: 'Workstation Relegated to 169.254.12.89 With No Local Access',
      clientName: 'David Miller, Logistics Coordinator',
      deviceModel: 'Warehouse Workstation WS-04',
      initialProblemDescription: 'Client states: "I turned on my workstation this morning and none of the shipping portals or local file servers work. Windows shows a yellow exclamation mark over the network icon saying No Internet Access."',
      startStepId: 'step-net-ipconfig',
      steps: {
        'step-net-ipconfig': {
          id: 'step-net-ipconfig',
          title: 'Step 1: Check IP Configuration & Gather Symptoms',
          scenarioText: 'You sit down at the workstation and open Windows Command Prompt. What command do you execute first to gather IP configuration details?',
          customerStatement: 'All other computers in the warehouse are working fine; only my computer is broken.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: '38°C (Normal)'
          },
          diagnosticOptions: [
            {
              id: 'c-ipconfig-all',
              label: 'Run "ipconfig /all" to inspect IP, Subnet, and DHCP lease status',
              actionDescription: 'Review assigned IP, DHCP Server address, and physical MAC.',
              nextStepId: 'step-net-apipa-diagnosis',
              feedback: 'Exact choice! ipconfig /all reveals: IPv4 Address is 169.254.144.22 with Subnet Mask 255.255.0.0, Default Gateway is blank, and DHCP Enabled is Yes.'
            },
            {
              id: 'c-reboot-router',
              label: 'Power cycle the main building gateway router',
              actionDescription: 'Reboot the central warehouse router during active business hours.',
              isFatal: true,
              feedback: 'Hazardous action: David said all other warehouse PCs are working normally. Rebooting the core router will disconnect all warehouse shipping operations and violates Change Management!'
            }
          ]
        },

        'step-net-apipa-diagnosis': {
          id: 'step-net-apipa-diagnosis',
          title: 'Step 2: Establish a Theory of Probable Cause',
          scenarioText: 'The IP address is 169.254.144.22 (APIPA). What does this symptom tell you about the workstation connection?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-dhcp-unreachable',
              label: 'Theory: The workstation cannot communicate with the DHCP server to receive an IP lease',
              actionDescription: 'Identify APIPA as an operating system self-assigned fallback caused by DHCP communication failure.',
              nextStepId: 'step-net-physical-inspection',
              feedback: 'Spot on! When Windows sends DHCPDISCOVER broadcasts and receives no DHCPOFFER within the timeout window, APIPA assigns a 169.254.x.x link-local address.'
            },
            {
              id: 'c-dns-issue',
              label: 'Theory: The corporate DNS server hostname table is corrupted',
              actionDescription: 'Blame DNS resolution for the 169.254 address.',
              isFatal: true,
              feedback: 'Incorrect: DNS resolves names to IP addresses (e.g. google.com to IP). It has nothing to do with assigning an IP address to a network card.'
            }
          ]
        },

        'step-net-physical-inspection': {
          id: 'step-net-physical-inspection',
          title: 'Step 3 & 4: Test Theory & Implement Solution',
          scenarioText: 'You look at the back of the computer. The Ethernet RJ-45 link light is completely OFF. You trace the patch cable under the desk and notice a heavy warehouse forklift pallet was pushed against the wall jack, severing the cable jacket. How do you resolve this?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-swap-patch-cable',
              label: 'Replace damaged patch cable with a known-good Cat 6 cable and run "ipconfig /renew"',
              actionDescription: 'Install fresh patch cable, verify link lights, and renew DHCP lease.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The RJ-45 link lights immediately illuminate solid green with amber activity flashes. ipconfig /renew successfully leases 192.168.10.45 from the DHCP server with full gateway and DNS connectivity.'
            },
            {
              id: 'c-tape-cable',
              label: 'Wrap electrical tape around the crushed severed cable and reboot PC',
              actionDescription: 'Attempt to reuse damaged severed twisted pair.',
              isFatal: true,
              feedback: 'Hazardous / Unprofessional: Crushed twisted-pair copper exhibits high crosstalk, broken continuity, and impedance mismatch. Damaged patch cables must always be replaced.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'net-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Domain 2.0 Networking Assessment',
      subtitle: 'CompTIA 220-1101 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Networking Domain Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'net-q1',
          question: 'In the TIA/EIA 568B standard, which color conductor connects to Pin 1 of the modular RJ-45 connector?',
          options: [
            'White/Green',
            'White/Orange',
            'Solid Orange',
            'Solid Blue'
          ],
          correctAnswer: 1,
          explanation: 'T568B starts with White/Orange on Pin 1 and Solid Orange on Pin 2. (T568A starts with White/Green on Pin 1).',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.1'
        },
        {
          id: 'net-q2',
          question: 'A computer displays an IP address of 169.254.78.102 with a subnet mask of 255.255.0.0. What has occurred?',
          options: [
            'The computer successfully received a static address from Active Directory',
            'The computer failed to obtain a DHCP lease and assigned an APIPA link-local address',
            'The network interface card is operating in promiscuous mode',
            'The DNS server is offline'
          ],
          correctAnswer: 1,
          explanation: 'Addresses in the 169.254.0.1 to 169.254.255.254 range are Automatic Private IP Addressing (APIPA) assignments generated by the OS when a DHCP server does not respond.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.3'
        },
        {
          id: 'net-q3',
          question: 'Which standard Power over Ethernet specification provides up to 30 Watts of power per port for high-demand devices like PTZ cameras?',
          options: [
            '802.11ax',
            '802.3af (PoE)',
            '802.3at (PoE+)',
            '802.1Q'
          ],
          correctAnswer: 2,
          explanation: '802.3at (PoE+) delivers up to 30W of DC power per port, whereas earlier 802.3af (PoE) only supplies up to 15.4W.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.2'
        },
        {
          id: 'net-q4',
          question: 'Which network port and protocol is utilized to automatically translate human-readable domain names into numerical IP addresses?',
          options: [
            'DHCP on Port 67/68',
            'SSH on Port 22',
            'DNS on Port 53',
            'RDP on Port 3389'
          ],
          correctAnswer: 2,
          explanation: 'Domain Name System (DNS) operates on Port 53 (UDP for queries, TCP for zone transfers) to resolve hostnames to IP addresses.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.4'
        }
      ]
    }
  ]
};
