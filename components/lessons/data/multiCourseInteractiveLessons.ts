import { LessonData, LessonSection } from '../../../types';

// =========================================================================
// EXTRA INTERACTIVE STAGES FOR COMPTIA A+ 1.1 & 2.1
// =========================================================================
export const A_PLUS_1_1_EXTRA_STAGES: LessonSection[] = [
  {
    id: 'sec-matcher-1-1',
    type: 'matcher',
    title: 'Interactive Port & Connector Patch Matrix',
    subtitle: 'Snap Laptop Connectors & Storage Buses to Their Exact Specifications',
    estimatedMinutes: 5,
    matcherTitle: 'Laptop Interfaces, Storage Form Factors & Power Pinouts',
    description: 'Select each laptop component or interface on the left and snap it into its matching technical specification socket on the right.',
    mode: 'port-cable',
    xpReward: 120,
    pairs: [
      {
        id: 'pair-usbc',
        sourceLabel: 'USB-C / Thunderbolt 4',
        sourceCategory: 'Symmetrical I/O',
        targetLabel: '24-Pin Reversible Connector (Up to 40 Gbps & 100W PD)',
        targetSpec: 'Supports DisplayPort Alt Mode, PCIe tunneling, and bi-directional power delivery.',
        explanation: 'USB-C uses a 24-pin symmetrical connector that operates regardless of plug orientation.'
      },
      {
        id: 'pair-sodimm',
        sourceLabel: 'DDR4 / DDR5 SO-DIMM',
        sourceCategory: 'Laptop Memory',
        targetLabel: '260-Pin / 262-Pin Small Outline Memory Module',
        targetSpec: 'Inserted at a 45° angle into horizontal motherboard sockets and latched flat.',
        explanation: 'Laptops use compact SO-DIMM form factor modules rather than full-length desktop DIMMs.'
      },
      {
        id: 'pair-m2',
        sourceLabel: 'M.2 2280 NVMe SSD',
        sourceCategory: 'PCIe Flash Storage',
        targetLabel: '22mm Wide × 80mm Long M-Key Solid-State Drive',
        targetSpec: 'Bypasses legacy SATA 600 MB/s bottleneck via direct PCIe x4 lanes.',
        explanation: 'M.2 2280 drives mount flat against the motherboard with a single standoff screw.'
      },
      {
        id: 'pair-ufl',
        sourceLabel: 'Dual U.FL Coaxial Leads',
        sourceCategory: 'RF Wireless',
        targetLabel: 'Main & Aux Snap-On Antenna Connectors on M.2 WLAN NIC',
        targetSpec: 'Routed through the laptop display hinges up into the top screen bezel.',
        explanation: 'Wi-Fi antennas are positioned high in the display lid for unobstructed omnidirectional reception.'
      }
    ]
  },
  {
    id: 'sec-terminal-1-1',
    type: 'terminal',
    title: 'Live OS Battery & Hardware Diagnostic Shell',
    subtitle: 'Execute Real Windows Administrative CLI Commands',
    estimatedMinutes: 6,
    terminalTitle: 'Windows 11 Mobile Hardware & Battery Telemetry CLI',
    environmentLabel: 'Windows 11 Administrator PowerShell (x64)',
    promptPrefix: 'C:\\Windows\\System32>',
    briefing: 'A corporate laptop is experiencing rapid battery drain and intermittent Wi-Fi disconnects. Execute the exact Windows administrative commands below to inspect battery health, network interfaces, and NVMe disk status.',
    xpReward: 150,
    tasks: [
      {
        id: 't-bat-1',
        promptInstruction: 'Task 1: Generate an official Windows Lithium-Ion battery health & cycle report using powercfg.',
        expectedCommands: ['powercfg /batteryreport', 'powercfg -batteryreport'],
        commandOutput: `Battery life report saved to file path C:\\Windows\\System32\\battery-report.html.\nDesign Capacity: 56,000 mWh\nFull Charge Capacity: 38,420 mWh (68.6% Health)\nCycle Count: 612 cycles — Chemistry: LiP (Lithium-Polymer)`,
        explanation: 'powercfg /batteryreport queries the SMBus smart battery controller for design capacity vs. current full charge capacity.',
        hint: 'Type: powercfg /batteryreport'
      },
      {
        id: 't-bat-2',
        promptInstruction: 'Task 2: Display full TCP/IP and MAC address details for all wireless and Ethernet adapters.',
        expectedCommands: ['ipconfig /all', 'ipconfig -all'],
        commandOutput: `Wireless LAN adapter Wi-Fi:\n   Description . . . . . . . . . . . : Intel(R) Wi-Fi 6E AX211 160MHz\n   Physical Address. . . . . . . . . : A4-B1-C2-88-19-F0\n   DHCP Enabled. . . . . . . . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : 192.168.1.45(Preferred)`,
        explanation: 'ipconfig /all reveals the physical MAC address, DHCP lease status, DNS servers, and adapter chipset.',
        hint: 'Type: ipconfig /all'
      }
    ]
  }
];

// =========================================================================
// COURSE 2: COMPTIA NETWORK+ (N10-008 / N10-009) INTERACTIVE MODULE
// =========================================================================
export const NETWORK_PLUS_1_1_LESSON: LessonData = {
  objectiveId: '1.1',
  courseId: 'network-plus',
  title: 'OSI Model Layers, Encapsulation & Switch/VLAN Architecture',
  domainName: 'Domain 1.0: Networking Fundamentals',
  badgeLabel: 'CompTIA Network+',
  summary: 'Master the 7-layer OSI model, Protocol Data Units (PDUs), 802.1Q VLAN trunking, and hands-on CLI switch/routing diagnostics.',
  sections: [
    {
      id: 'net-text-1',
      type: 'text',
      title: 'Technical Briefing: OSI Encapsulation & Enterprise Switching',
      subtitle: 'Layers 1–7, PDUs, MAC vs. IP Addressing & 802.1Q Trunking',
      estimatedMinutes: 7,
      content: {
        lead: 'Every network engineer troubleshoots from the ground up using the 7-Layer Open Systems Interconnection (OSI) reference model. Understanding how data is encapsulated from Application payload down to physical bits is critical for isolating network outages.',
        sections: [
          {
            heading: '1. The 7 OSI Layers & Protocol Data Units (PDUs)',
            body: [
              'As data travels down the OSI stack, each layer wraps the payload with its own header (and at Layer 2, a Frame Check Sequence trailer). This process is called encapsulation.',
              'Layer 2 switches forward Ethernet frames using hardware MAC addresses stored in a Content Addressable Memory (CAM) table, whereas Layer 3 routers route IP packets across distinct subnets using routing tables.'
            ],
            bulletPoints: [
              'Layer 1 (Physical): Bits — Cables, fiber optics, RJ-45 patch panels, transceivers, and hubs.',
              'Layer 2 (Data Link): Frames — MAC addresses, EUI-48, 802.1Q VLAN tags, STP, and L2 Switches.',
              'Layer 3 (Network): Packets — Logical IPv4/IPv6 addressing, ICMP, OSPF/BGP routing, and L3 Routers.',
              'Layer 4 (Transport): Segments (TCP) / Datagrams (UDP) — Port numbers, three-way handshake, flow control.',
              'Layers 5–7 (Session, Presentation, Application): Data/Payload — TLS encryption, sessions, HTTP/DNS/SSH.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'Network+ Exam Watch: PDU Memorization',
              content: 'Remember the exact PDU order from Layer 1 to Layer 4: Bits (L1) -> Frames (L2) -> Packets (L3) -> Segments for TCP / Datagrams for UDP (L4).'
            }
          }
        ],
        keyTakeaways: [
          'Layer 2 broadcast domains are segmented using 802.1Q Virtual LANs (VLANs); inter-VLAN traffic requires a Layer 3 router or SVI.',
          'Always verify Layer 1 physical link lights and cable integrity before troubleshooting Layer 3 IP routing or firewall rules.'
        ],
        technicalTerms: [
          { term: '802.1Q Trunking', definition: 'IEEE standard that inserts a 4-byte VLAN tag into Ethernet frames so multiple VLANs can traverse a single switch-to-switch uplink.' },
          { term: 'MTU (Maximum Transmission Unit)', definition: 'Largest IP packet size (standard 1500 bytes; Jumbo Frames up to 9000 bytes) transmitted without fragmentation.' }
        ]
      }
    },
    {
      id: 'net-diagram-1',
      type: 'diagram',
      title: 'Interactive Enterprise Rack & VLAN Topology Blueprint',
      subtitle: 'Inspect Firewall Uplinks, Managed L3 Switches, and Segmented Subnets',
      estimatedMinutes: 6,
      diagramId: 'network-rack-vlan-1',
      diagramTitle: 'Enterprise Network Rack & 802.1Q VLAN Segmentation',
      description: 'Click each numbered pin on the network blueprint to inspect its OSI layer role, trunking configuration, and failure symptoms.',
      hotspots: [
        {
          id: 'hs-utm',
          x: 50,
          y: 13,
          name: 'Edge Next-Gen Firewall (NGFW / UTM)',
          category: 'Layer 3–7 Security Gateway',
          shortDescription: 'Performs WAN NAT translation, stateful packet inspection, and inter-VLAN ACL filtering.',
          fullSpecs: 'Dual SFP+ 10GbE WAN uplinks, IPSec VPN termination, deep packet inspection.',
          troubleshootingNote: 'Implicit Deny at the end of an ACL will drop all traffic not explicitly permitted.',
          examRelevance: 'Network+ tests placement of NGFW between untrusted WAN and internal core switch.'
        },
        {
          id: 'hs-switch',
          x: 45,
          y: 42,
          name: '48-Port Managed Layer 3 PoE+ Switch',
          category: 'Layer 2 / Layer 3 Core Switching',
          shortDescription: 'Provides 802.3at PoE+ power to APs/VoIP phones and tags VLANs across trunk ports.',
          fullSpecs: 'IEEE 802.1Q VLAN trunking, 802.1D/802.1w Rapid Spanning Tree Protocol (RSTP), LACP port-channel.',
          troubleshootingNote: 'Native VLAN mismatch across a trunk link causes CDP/LLDP errors and traffic leakage.',
          examRelevance: 'Know 802.3af (PoE 15.4W), 802.3at (PoE+ 30W), and 802.3bt (PoE++ 60W–100W).'
        },
        {
          id: 'hs-vlan10',
          x: 22,
          y: 76,
          name: 'VLAN 10: Corporate Workstations (10.10.10.0/24)',
          category: 'Access Layer Subnet',
          shortDescription: 'Isolated broadcast domain for staff desktops with 802.1X port authentication.',
          fullSpecs: 'Subnet Mask: 255.255.255.0 (/24) • 254 usable host IPs • Default Gateway: 10.10.10.1.',
          troubleshootingNote: 'An APIPA address (169.254.x.x) indicates the workstation could not reach the DHCP server.',
          examRelevance: 'Calculate usable hosts with 2^(32-CIDR) - 2.'
        },
        {
          id: 'hs-vlan20',
          x: 50,
          y: 76,
          name: 'VLAN 20: VoIP & Wi-Fi 6E APs (QoS Priority)',
          category: 'Voice & Wireless Subnet',
          shortDescription: 'Dedicated voice VLAN with DSCP EF (Expedited Forwarding) QoS prioritization.',
          fullSpecs: 'UDP RTP voice streams prioritized to keep latency < 150ms and jitter < 30ms.',
          troubleshootingNote: 'High jitter causes choppy, robotic audio during VoIP calls.',
          examRelevance: 'Voice VLANs use UDP and require QoS traffic shaping.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Click the core rack component responsible for 802.1Q VLAN tagging and PoE+ power delivery.',
          targetHotspotId: 'hs-switch',
          hint: 'Look at the central 1U rack switch connecting the gateway to the VLAN subnets.'
        }
      ]
    },
    {
      id: 'net-matcher-1',
      type: 'matcher',
      title: 'Interactive IEEE Standards & Port Protocol Matcher',
      subtitle: 'Connect Network+ IEEE 802 Standards and Critical Ports',
      estimatedMinutes: 5,
      matcherTitle: 'IEEE 802 Standards & Core Network Protocols',
      description: 'Equip each IEEE standard or protocol on the left and snap it to its matching specification on the right.',
      mode: 'port-cable',
      xpReward: 125,
      pairs: [
        {
          id: 'net-p1',
          sourceLabel: 'IEEE 802.1Q',
          sourceCategory: 'Switching Standard',
          targetLabel: 'Virtual LAN (VLAN) Trunk Tagging Across Switch Uplinks',
          targetSpec: 'Inserts a 4-byte tag into the Layer 2 Ethernet frame header to identify VLAN ID (1–4094).',
          explanation: '802.1Q is the universal standard for trunking multiple VLANs over a single physical link.'
        },
        {
          id: 'net-p2',
          sourceLabel: 'IEEE 802.1X',
          sourceCategory: 'Network Access Control',
          targetLabel: 'Port-Based Network Access Control (NAC) with RADIUS/TACACS+',
          targetSpec: 'Blocks switch port or enterprise Wi-Fi access until the supplicant authenticates.',
          explanation: '802.1X prevents rogue devices from plugging into wall jacks and accessing the LAN.'
        },
        {
          id: 'net-p3',
          sourceLabel: 'IEEE 802.3at (PoE+)',
          sourceCategory: 'Power over Ethernet',
          targetLabel: 'Delivers up to 30W DC Power Over Cat6 Twisted-Pair Cabling',
          targetSpec: 'Powers pan-tilt-zoom IP cameras, dual-band Wi-Fi 6 APs, and video VoIP phones.',
          explanation: 'PoE+ (802.3at) doubles the 15.4W budget of standard 802.3af PoE.'
        },
        {
          id: 'net-p4',
          sourceLabel: 'UDP Port 53 & Port 67/68',
          sourceCategory: 'Core Infrastructure',
          targetLabel: 'DNS Name Resolution (53) & DHCP IP Leasing DORA (67/68)',
          targetSpec: 'Essential connectionless services required for automatic IP configuration and web lookups.',
          explanation: 'Without DHCP (67/68) and DNS (53), clients fail to obtain IP leases or resolve domain names.'
        }
      ]
    },
    {
      id: 'net-terminal-1',
      type: 'terminal',
      title: 'Live Network CLI Diagnostic Sandbox',
      subtitle: 'Execute Exact Network+ Diagnostic Commands to Isolate a VLAN Outage',
      estimatedMinutes: 7,
      terminalTitle: 'Enterprise Network Operations Center (NOC) Diagnostic Shell',
      environmentLabel: 'ITreal NetOps CLI Shell (Windows / IOS Hybrid)',
      promptPrefix: 'netops@core-rtr-01>',
      briefing: 'Users in the Accounting department report they cannot reach the internal ERP server at 10.20.30.50. Type the exact commands below to verify local IP configuration, test gateway reachability, and trace the routing path.',
      xpReward: 150,
      tasks: [
        {
          id: 'nt-1',
          promptInstruction: 'Task 1: Display the workstation IP address, subnet mask, and default gateway using ipconfig.',
          expectedCommands: ['ipconfig', 'ipconfig /all'],
          commandOutput: `Ethernet adapter VLAN10_LAN:\n   IPv4 Address. . . . . . . . . . . : 10.10.10.42\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 10.10.10.1`,
          explanation: 'Confirming valid IP and Default Gateway rules out local DHCP exhaustion (169.254.x.x APIPA).',
          hint: 'Type: ipconfig'
        },
        {
          id: 'nt-2',
          promptInstruction: 'Task 2: Test Layer 3 ICMP reachability to the Default Gateway at 10.10.10.1.',
          expectedCommands: ['ping 10.10.10.1'],
          commandOutput: `Pinging 10.10.10.1 with 32 bytes of data:\nReply from 10.10.10.1: bytes=32 time=1ms TTL=255\nReply from 10.10.10.1: bytes=32 time=1ms TTL=255\nPackets: Sent = 2, Received = 2, Lost = 0 (0% loss)`,
          explanation: 'A 1ms reply from the default gateway confirms Layer 1–3 local subnet connectivity is healthy.',
          hint: 'Type: ping 10.10.10.1'
        },
        {
          id: 'nt-3',
          promptInstruction: 'Task 3: Trace the hop-by-hop routing path to the ERP server at 10.20.30.50 using tracert.',
          expectedCommands: ['tracert 10.20.30.50', 'traceroute 10.20.30.50'],
          commandOutput: `Tracing route to erp-prod.itreal.local [10.20.30.50]:\n  1    1 ms    1 ms    1 ms  10.10.10.1 (Core-L3-SVI)\n  2    2 ms    2 ms    2 ms  10.20.30.1 (VLAN30-Gateway)\n  3    3 ms    2 ms    2 ms  10.20.30.50 (ERP-Server-Prod)\nTrace complete.`,
          explanation: 'tracert uses ICMP Time Exceeded messages to reveal every Layer 3 router hop along the path.',
          hint: 'Type: tracert 10.20.30.50'
        }
      ]
    },
    {
      id: 'net-quiz-1',
      type: 'quiz',
      title: 'Network+ Mastery Verification',
      subtitle: 'Validate Your OSI, VLAN & CLI Diagnostic Skills',
      estimatedMinutes: 4,
      quizTitle: 'Domain 1.0 Networking Fundamentals Assessment',
      passThresholdPercent: 75,
      xpReward: 250,
      questions: [
        {
          id: 'nq-1',
          question: 'A workstation configures itself with the IPv4 address 169.254.88.12. Which service has failed on the local network segment?',
          options: [
            'DNS (UDP Port 53)',
            'DHCP (UDP Ports 67/68)',
            'SNMP (UDP Port 161)',
            'NTP (UDP Port 123)'
          ],
          correctAnswer: 1,
          explanation: 'The 169.254.0.0/16 range is reserved for APIPA (Automatic Private IP Addressing), assigned when a client cannot reach a DHCP server.',
          examObjectiveRef: 'Network+ 1.4 IPv4 Addressing'
        },
        {
          id: 'nq-2',
          question: 'Which IEEE standard enables a single physical Ethernet uplink between two switches to carry traffic for multiple isolated VLANs?',
          options: [
            '802.1X',
            '802.1Q',
            '802.3at',
            '802.11ax'
          ],
          correctAnswer: 1,
          explanation: 'IEEE 802.1Q inserts a 4-byte VLAN tag into Ethernet frames to trunk multiple VLANs across switch uplinks.',
          examObjectiveRef: 'Network+ 2.3 Switching & VLANs'
        }
      ]
    }
  ]
};

// =========================================================================
// COURSE 3: MATRIC TO MONEY (SOUTH AFRICAN WORK READINESS & FINANCE)
// =========================================================================
export const MATRIC_TO_MONEY_1_1_LESSON: LessonData = {
  objectiveId: '1.1',
  courseId: 'matric-to-money',
  title: 'South African Payslips, BCEA Rights, UIF/PAYE Tax & First Salary Budgeting',
  domainName: 'Domain 1: Financial Literacy & Employment Contracts',
  badgeLabel: 'Matric to Money (SA)',
  summary: 'Decode a real South African payslip in ZAR (R), verify statutory UIF and SARS PAYE deductions under the BCEA, and build a 50/30/20 first-salary budget.',
  sections: [
    {
      id: 'm2m-text-1',
      type: 'text',
      title: 'Briefing: Decoding Your First South African Salary & Payslip',
      subtitle: 'Gross CTC vs. Net Pay, SARS PAYE, UIF 1% & The Basic Conditions of Employment Act',
      estimatedMinutes: 6,
      content: {
        lead: 'Landing your first entry-level IT job or learnership in South Africa is a major milestone—but many young professionals are shocked when their bank deposit (Net Pay) is lower than the salary in their offer letter (Gross Pay / Cost to Company). Mastering South African payslip rules protects you from unlawful deductions and sets up your financial freedom.',
        sections: [
          {
            heading: '1. Statutory vs. Voluntary Deductions Under the BCEA',
            body: [
              'Under Section 34 of the Basic Conditions of Employment Act (BCEA), an employer in South Africa may ONLY deduct money from your salary if it is required by law (SARS PAYE tax, UIF, court garnishee order) OR if you have signed a written agreement consenting to the deduction (such as Medical Aid or Retirement Annuity).',
              'Furthermore, an employer cannot unilaterally deduct money for damaged equipment unless a fair hearing proves malicious or negligent fault, and the deduction may never exceed 25% of your remuneration in a single month.'
            ],
            bulletPoints: [
              'Gross Salary: Your total earnings before any tax or deductions are subtracted.',
              'PAYE (Pay-As-You-Earn): Income tax collected monthly by your employer and paid directly to SARS.',
              'UIF (Unemployment Insurance Fund): Mandatory 1% deducted from your gross pay + 1% contributed by your employer (2% total).',
              'SDL (Skills Development Levy): 1% paid by the employer (NEVER deducted from the employee!).',
              'Net Take-Home Pay: The actual amount in Rands (R) paid into your bank account on payday.'
            ],
            callout: {
              type: 'warning',
              title: 'BCEA Red Flag: Skills Development Levy (SDL)',
              content: 'SDL (1%) is an employer-only levy under South African law. If an employer deducts SDL from your salary, that deduction is unlawful!'
            }
          }
        ],
        keyTakeaways: [
          'Always verify that UIF is exactly 1% of your remuneration (up to the statutory ceiling) and that you receive a written payslip every payday.',
          'Apply the 50/30/20 rule to your Net Take-Home Pay in Rands: ≤50% Essential Needs, ≤30% Personal Wants, and ≥20% Emergency Fund & Savings.'
        ],
        technicalTerms: [
          { term: 'BCEA (Basic Conditions of Employment Act)', definition: 'South African labour legislation governing working hours, leave, overtime, notice periods, and lawful salary deductions.' },
          { term: 'UIF (Unemployment Insurance Fund)', definition: 'Short-term social insurance funded by 1% employee + 1% employer contributions for unemployment, maternity, or illness.' }
        ]
      }
    },
    {
      id: 'm2m-finance-sim-1',
      type: 'finance-sim',
      title: 'Interactive SA Payslip & 50/30/20 ZAR Budget Simulator',
      subtitle: 'Audit an Entry-Level IT Support Payslip and Balance Your Monthly Rands',
      estimatedMinutes: 8,
      simTitle: 'Junior IT Support Technician Payslip & ZAR Budget Lab',
      employeeName: 'Thabo Nkosi',
      roleTitle: 'Junior IT Service Desk Analyst (Johannesburg)',
      grossMonthlyZar: 16000,
      xpReward: 200,
      payslipItems: [
        {
          id: 'ps-basic',
          label: 'Basic Monthly Salary',
          amountZar: 14500,
          category: 'earnings',
          explanation: 'Your guaranteed base monthly salary for 40–45 ordinary working hours per week.',
          bceaOrSarsRule: 'BCEA Section 32 requires payment in South African Rand (ZAR) no later than 7 days after the pay period ends.'
        },
        {
          id: 'ps-standby',
          label: 'Weekend Standby & Shift Allowance',
          amountZar: 1500,
          category: 'earnings',
          explanation: 'Taxable allowance for being on-call for remote ticket escalations.',
          bceaOrSarsRule: 'Overtime in SA must be paid at 1.5x normal wage on weekdays/Saturdays and 2.0x on Sundays/Public Holidays.'
        },
        {
          id: 'ps-paye',
          label: 'SARS PAYE Income Tax',
          amountZar: 1380,
          category: 'deduction',
          explanation: 'Monthly income tax calculated using SARS progressive tax brackets minus the Primary Rebate.',
          bceaOrSarsRule: 'Your employer must issue an IRP5 tax certificate at the end of the tax year for SARS eFiling.'
        },
        {
          id: 'ps-uif',
          label: 'UIF Contribution (1% Employee)',
          amountZar: 160,
          category: 'deduction',
          explanation: '1% of your R 16,000 gross salary (R 160) deducted for the Unemployment Insurance Fund.',
          bceaOrSarsRule: 'Your employer must match this with an additional R 160 (1%) paid directly to the UIF Commissioner.'
        },
        {
          id: 'ps-net',
          label: 'Net Take-Home Pay (Bank Deposit)',
          amountZar: 14460,
          category: 'net',
          explanation: 'R 16,000 Gross minus R 1,380 PAYE and R 160 UIF = R 14,460.00 deposited into your bank account.',
          bceaOrSarsRule: 'All personal budgeting (50/30/20 rule) must be calculated from your Net Pay (R 14,460), not your Gross Pay!'
        }
      ],
      budgetTargetPercent: {
        needsMax: 50,
        wantsMax: 30,
        savingsMin: 20
      },
      auditQuestion: {
        question: 'If Thabo’s employer tries to deduct R 160 (1%) from his salary for the Skills Development Levy (SDL), what does South African law say?',
        options: [
          'It is lawful because all employees must pay 1% SDL to SARS.',
          'It is UNLAWFUL — SDL is a 1% employer-only levy and may never be deducted from an employee’s wages.',
          'It is lawful during the first 3 months of probation.',
          'It is lawful if the employee works in the IT sector.'
        ],
        correctAnswer: 1,
        explanation: 'Correct! Under the Skills Development Levies Act, SDL (1%) is paid strictly by the employer. Only UIF (1%) and PAYE are statutory employee deductions.'
      }
    },
    {
      id: 'm2m-matcher-1',
      type: 'matcher',
      title: 'Interactive South African BCEA Workplace Rights Matcher',
      subtitle: 'Connect Statutory Employment Rules to Exact BCEA Protections',
      estimatedMinutes: 5,
      matcherTitle: 'BCEA Statutory Employment Conditions Matrix',
      description: 'Select each workplace right on the left and snap it to its statutory BCEA requirement on the right.',
      mode: 'concept-match',
      xpReward: 120,
      pairs: [
        {
          id: 'm2m-p1',
          sourceLabel: 'Annual Paid Leave (BCEA Sec 20)',
          sourceCategory: 'Statutory Leave',
          targetLabel: '21 Consecutive Days (15 Working Days) Paid Leave Per Year',
          targetSpec: 'Accrues at 1 day for every 17 days worked; cannot be forfeited or replaced with cash except on termination.',
          explanation: 'Full-time 5-day-a-week employees are entitled to at least 15 paid working days of annual leave per year.'
        },
        {
          id: 'm2m-p2',
          sourceLabel: 'Maximum Ordinary Working Hours',
          sourceCategory: 'Working Time',
          targetLabel: '45 Hours Per Week Maximum (9h/day for 5-day week)',
          targetSpec: 'Hours worked beyond 45 hours/week are voluntary overtime paid at 1.5x normal rate.',
          explanation: 'The BCEA caps ordinary working hours at 45 hours per week.'
        },
        {
          id: 'm2m-p3',
          sourceLabel: 'Paid Sick Leave Cycle (BCEA Sec 22)',
          sourceCategory: 'Health Protection',
          targetLabel: '30 Days Paid Sick Leave Over a 36-Month (3-Year) Cycle',
          targetSpec: 'During the first 6 months of employment, 1 paid sick day accrues for every 26 days worked.',
          explanation: 'A medical certificate is required if absent for more than 2 consecutive days or on more than 2 occasions in 8 weeks.'
        }
      ]
    },
    {
      id: 'm2m-quiz-1',
      type: 'quiz',
      title: 'Matric to Money Mastery Check',
      subtitle: 'Verify Your South African Payslip & BCEA Knowledge',
      estimatedMinutes: 4,
      quizTitle: 'Payslips, Tax & Workplace Rights Assessment',
      passThresholdPercent: 75,
      xpReward: 200,
      questions: [
        {
          id: 'm2m-q1',
          question: 'What percentage of an employee’s gross remuneration is deducted for the Unemployment Insurance Fund (UIF) in South Africa?',
          options: [
            '1% from the employee (matched by 1% from the employer)',
            '5% from the employee',
            '15% VAT deduction',
            '0% during the first year of work'
          ],
          correctAnswer: 0,
          explanation: 'UIF is 2% in total: 1% is deducted from the employee’s salary and 1% is contributed directly by the employer.',
          examObjectiveRef: 'Matric to Money: Statutory Deductions'
        },
        {
          id: 'm2m-q2',
          question: 'Under Section 34 of the BCEA, what is the maximum percentage of an employee’s monthly remuneration that can be deducted for proven negligent damage to company equipment?',
          options: [
            '100% of the monthly salary',
            '25% of the monthly remuneration (after a fair procedure)',
            '50% without a hearing',
            '75% of Net Pay'
          ],
          correctAnswer: 1,
          explanation: 'Even when an employee is found responsible after a fair procedure, deductions for loss/damage may never exceed 25% of remuneration in any single pay period.',
          examObjectiveRef: 'Matric to Money: BCEA Section 34'
        }
      ]
    }
  ]
};

// =========================================================================
// COURSE 4: BEYOND THE CHATBOT (APPLIED AI, PROMPT ENGINEERING & POPIA)
// =========================================================================
export const BEYOND_CHATBOT_1_1_LESSON: LessonData = {
  objectiveId: '1.1',
  courseId: 'beyond-the-chatbot',
  title: 'Production Prompt Architecture, RAG Grounding & POPIA AI Safety',
  domainName: 'Domain 1: Prompt Engineering & Workplace AI Governance',
  badgeLabel: 'Beyond the Chatbot',
  summary: 'Transform vague chatbot prompts into deterministic business workflows, enforce South African POPIA privacy guardrails, and catch LLM hallucinations.',
  sections: [
    {
      id: 'ai-text-1',
      type: 'text',
      title: 'Technical Briefing: The 4-Pillar Prompt Architecture & POPIA Compliance',
      subtitle: 'Role, Context, Constraints, Verification & Protecting South African PII',
      estimatedMinutes: 6,
      content: {
        lead: 'Most users treat Large Language Models (LLMs) like casual search engines—typing a one-line question and accepting unverified output. In a professional South African workplace, ungrounded prompts lead to fabricated legal citations ("hallucinations") and severe Protection of Personal Information Act (POPIA) violations.',
        sections: [
          {
            heading: '1. The 4 Pillars of a Production-Grade Prompt',
            body: [
              'LLMs are probabilistic next-token predictors, not databases of truth. When given vague instructions, the model fills in gaps with plausible-sounding fiction.',
              'To achieve reliable output, structure every workplace prompt with four explicit blocks: (1) System Role/Persona, (2) Anonymized Domain Context, (3) Strict Output Constraints, and (4) Grounded Verification Rules.'
            ],
            bulletPoints: [
              'Pillar 1 — Role: Define the exact specialist perspective (e.g., "Act as a Senior South African IT Service Desk Manager").',
              'Pillar 2 — POPIA-Safe Context: Redact client names, 13-digit SA ID numbers, bank accounts, and phone numbers before pasting into public LLMs.',
              'Pillar 3 — Output Format & Constraints: Specify markdown tables, word limits, tone, and ZAR currency formatting.',
              'Pillar 4 — Anti-Hallucination Guardrail: Instruct the model to state "UNVERIFIED — REQUIRES MANUAL CHECK" if data is missing from the provided context.'
            ],
            callout: {
              type: 'warning',
              title: 'POPIA Compliance Rule: Never Paste Raw SA ID Numbers',
              content: 'Pasting customer 13-digit South African ID numbers, medical records, or raw payroll sheets into unapproved cloud AI tools violates POPIA Section 19 security safeguards.'
            }
          }
        ],
        keyTakeaways: [
          'Always anonymize Personal Information (PI) using placeholders like [CLIENT_A] or [REDACTED_ID] before prompting.',
          'Never copy-paste AI legal, financial, or technical output to a client without Human-in-the-Loop (HITL) verification.'
        ],
        technicalTerms: [
          { term: 'Hallucination', definition: 'When an LLM generates confident, grammatically fluent statements, statistics, or case law that are completely fabricated.' },
          { term: 'RAG (Retrieval-Augmented Generation)', definition: 'Architecture that grounds an LLM in your company’s verified PDFs/policies before generating an answer.' }
        ]
      }
    },
    {
      id: 'ai-prompt-lab-1',
      type: 'prompt-lab',
      title: 'Interactive Prompt Engineering & Hallucination Inspector',
      subtitle: 'Build a POPIA-Safe Prompt and Flag Fabricated AI Claims',
      estimatedMinutes: 8,
      labTitle: 'IT Incident Report Prompt Builder & Output Auditor',
      scenarioBrief: 'Your manager asked you to use AI to draft a post-incident summary for a Johannesburg fibre outage. First, toggle the right prompt guardrails to reach ≥85% precision (while avoiding the POPIA breach trap!). Then click any hallucinated or non-compliant sentences in the AI draft below.',
      baseWeakPrompt: 'Write an email to the client explaining why their internet was down today.',
      weakOutputPreview: 'Hi there, sorry your internet went down today! We fixed the router and everything should be working fine now. According to the South African Telecommunications Act of 2029 Section 99, you get a R 50,000 refund automatically.',
      optimalOutputPreview: 'SUBJECT: Root Cause Analysis (RCA) — Fibre Link Restoration [Ticket #INC-4092]\n\n1. Executive Summary: Layer 1 optical attenuation on the Rosebank metro ring caused a 42-minute failover between 10:15 and 10:57 SAST.\n2. Remediation: Traffic was rerouted via the secondary BGP uplink; faulty SFP+ transceiver replaced.\n3. SLA Note: [UNVERIFIED — CHECK CLIENT SLA CONTRACT FOR CREDIT ELIGIBILITY].',
      xpReward: 200,
      toggles: [
        {
          id: 'tog-role',
          category: 'role',
          label: 'Assign Senior NOC Engineer Role & Tone',
          promptSnippet: 'ROLE: Act as a Senior South African Network Operations Center (NOC) Engineer writing a concise Root Cause Analysis (RCA).',
          qualityBoost: 25,
          isOptimal: true,
          feedback: '✓ Great! Defining a technical role eliminates casual, apologetic filler.'
        },
        {
          id: 'tog-context',
          category: 'context',
          label: 'Provide Anonymized Technical Telemetry',
          promptSnippet: 'CONTEXT: Ticket #INC-4092. Rosebank metro fibre ring experienced Layer 1 SFP+ transceiver failure (10:15–10:57 SAST). Failover to backup BGP link succeeded.',
          qualityBoost: 25,
          isOptimal: true,
          feedback: '✓ Excellent! Supplying concrete telemetry prevents the AI from guessing the root cause.'
        },
        {
          id: 'tog-popia-trap',
          category: 'popia-safety',
          label: 'Paste Raw Client SA ID & Banking Details (TRAP)',
          promptSnippet: 'CLIENT DATA: CEO Sipho Dlamini, SA ID 8904125182084, FNB Account 6209918271, Cell +27 82 555 0192.',
          qualityBoost: -40,
          isOptimal: false,
          feedback: '✗ POPIA VIOLATION! Never paste raw 13-digit SA ID numbers or banking details into an LLM prompt. Deselect this block!'
        },
        {
          id: 'tog-constraints',
          category: 'constraints',
          label: 'Enforce Anti-Hallucination & SLA Placeholder Rule',
          promptSnippet: 'CONSTRAINTS: Use 3 numbered bullet points. Do NOT invent legislation or SLA refund amounts; insert [UNVERIFIED — CHECK SLA] where contract data is not provided.',
          qualityBoost: 25,
          isOptimal: true,
          feedback: '✓ Spot on! Explicit negative constraints stop the model from inventing fake laws or refund promises.'
        }
      ],
      outputAuditSegments: [
        {
          id: 'seg-1',
          text: '1. Incident Window: Rosebank fibre link experienced packet loss between 10:15 and 10:57 SAST due to a degraded SFP+ module.',
          isRedFlag: false,
          explanation: 'This line is factual and grounded directly in the provided NOC ticket telemetry.'
        },
        {
          id: 'seg-2',
          text: '2. Statutory Citation: Under the South African Cyber Fibre Refund Act 88 of 2028, ICASA mandates an automatic R 25,000 penalty payout.',
          isRedFlag: true,
          flagType: 'hallucination',
          explanation: '✓ Caught Hallucination! "South African Cyber Fibre Refund Act 88 of 2028" is completely fabricated by the LLM.'
        },
        {
          id: 'seg-3',
          text: '3. Affected Account Holder: Verified via Director SA ID 8904125182084 and home address 14 Rivonia Road, Sandton.',
          isRedFlag: true,
          flagType: 'popia-breach',
          explanation: '✓ Caught POPIA Breach! Exposing a person’s 13-digit SA ID number and residential address in an incident distribution email violates POPIA.'
        }
      ]
    },
    {
      id: 'ai-quiz-1',
      type: 'quiz',
      title: 'Beyond the Chatbot Mastery Check',
      subtitle: 'Validate Your Prompt Engineering & POPIA Governance Skills',
      estimatedMinutes: 4,
      quizTitle: 'Applied AI & Workplace Governance Assessment',
      passThresholdPercent: 75,
      xpReward: 200,
      questions: [
        {
          id: 'ai-q1',
          question: 'Why do Large Language Models (LLMs) sometimes invent non-existent South African court cases or technical specifications ("hallucinations")?',
          options: [
            'Because they predict the most statistically probable next tokens rather than querying a verified fact database by default',
            'Because their CPU heatsink is overheating',
            'Because the internet connection is using UDP instead of TCP',
            'Because POPIA requires models to invent placeholder laws'
          ],
          correctAnswer: 0,
          explanation: 'LLMs are probabilistic token predictors. Without grounded context (RAG) and explicit negative constraints, they generate plausible-sounding fiction when uncertain.',
          examObjectiveRef: 'Beyond the Chatbot: LLM Mechanics'
        },
        {
          id: 'ai-q2',
          question: 'Before using an external AI assistant to summarize a client’s HR dispute in South Africa, what must you do to comply with POPIA?',
          options: [
            'Include the employee’s full 13-digit SA ID number so the AI is accurate',
            'Anonymize and redact all Personal Information (names, ID numbers, contact details, bank accounts) using placeholders',
            'Use capital letters in the prompt',
            'Nothing, POPIA does not apply to digital text'
          ],
          correctAnswer: 1,
          explanation: 'De-identifying and redacting Personal Information (PI) before sending text to external processors is essential for POPIA compliance.',
          examObjectiveRef: 'Beyond the Chatbot: POPIA & Data Privacy'
        }
      ]
    }
  ]
};

