
import { Domain, Rank, Badge } from './types';

export const RANKS: Rank[] = [
  { title: 'Tech Beginner', minXp: 0, reward: 'Basic Access', color: 'text-gray-400' },
  { title: 'Tech Level 1', minXp: 1000, reward: 'Practice Pack Alpha', color: 'text-blue-400' },
  { title: 'Tech Level 2', minXp: 2500, reward: 'Hardware Lab Access', color: 'text-green-400' },
  { title: 'Tech Level 3', minXp: 5000, reward: 'Advanced Scenarios', color: 'text-purple-400' },
  { title: 'Junior Technician', minXp: 10000, reward: 'Simulation Mode', color: 'text-yellow-400' },
  { title: 'IT Specialist', minXp: 20000, reward: 'Bonus Test Bank', color: 'text-orange-500' },
  { title: 'A+ Ready', minXp: 40000, reward: 'Printable Certificate', color: 'text-red-600' },
];

export const calculateLevel = (xp: number): number => {
  const index = RANKS.findIndex((r, idx) => 
    xp >= r.minXp && (idx === RANKS.length - 1 || xp < RANKS[idx + 1].minXp)
  );
  return index >= 0 ? index : 0;
};

export const BADGES: Badge[] = [
  { id: 'hw_guru', name: 'Hardware Guru', icon: 'Cpu', description: 'Complete all Core 1 Hardware objectives.', unlocked: false },
  { id: 'net_ninja', name: 'Network Ninja', icon: 'Globe', description: 'Score 90%+ on a Networking Domain drill.', unlocked: false },
  { id: 'streak_7', name: 'Week Warrior', icon: 'Flame', description: 'Maintain a 7-day study streak.', unlocked: false },
  { id: 'boss_slayer', name: 'Boss Slayer', icon: 'Sword', description: 'Pass a Boss Battle simulation.', unlocked: false },
];

export const COMPTIA_DOMAINS: Domain[] = [
  {
    id: 'c1d1',
    title: 'Mobile Devices',
    name: 'Mobile Devices',
    color: 'text-blue-500',
    exam: 'Core 1',
    course: 'a-plus',
    objectivesCount: 4,
    objectives: [
      {
        id: '1.1',
        title: '1.1 Laptop Hardware & Internal Component Architecture',
        domain: 'c1d1',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Install and configure laptop hardware components, SODIMM memory, M.2 NVMe storage, and cooling systems.'
      },
      {
        id: '1.2',
        title: '1.2 Mobile Device Displays, Inverters & Touch Digitizers',
        domain: 'c1d1',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Compare and contrast OLED, LCD, digitizers, inverters, backlights, and display cable routing.'
      },
      {
        id: '1.3',
        title: '1.3 Mobile Device Ports, Charging & Accessories',
        domain: 'c1d1',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Set up and configure accessories, USB-C, Lightning, docking stations, and port replicators.'
      },
      {
        id: '1.4',
        title: '1.4 Mobile Device Wireless Connectivity & Synchronization',
        domain: 'c1d1',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Configure 5G cellular, Wi-Fi 6, Bluetooth PAN, NFC, mobile hotspot tethering, and MDM profiles.'
      }
    ]
  },
  {
    id: 'c1d2',
    title: 'Networking',
    name: 'Networking',
    color: 'text-green-500',
    exam: 'Core 1',
    course: 'a-plus',
    objectivesCount: 5,
    objectives: [
      {
        id: '2.1',
        title: '2.1 TCP & UDP Protocols and Common Port Numbers',
        domain: 'c1d2',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Master essential network ports including SSH (22), DNS (53), HTTP (80), HTTPS (443), RDP (3389), and DHCP (67/68).'
      },
      {
        id: '2.2',
        title: '2.2 Networking Hardware Devices & Infrastructure',
        domain: 'c1d2',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Compare and contrast routers, managed switches, access points, patch panels, firewalls, and PoE switches.'
      },
      {
        id: '2.3',
        title: '2.3 Wireless Networking Standards & Frequencies',
        domain: 'c1d2',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Compare 802.11a/b/g/n/ac/ax/be standards, 2.4GHz / 5GHz / 6GHz bands, and non-overlapping channels.'
      },
      {
        id: '2.6',
        title: '2.6 IP Addressing, Subnetting & Network Services',
        domain: 'c1d2',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Configure IPv4 classes, CIDR subnet masks, RFC 1918 private IPs, APIPA (169.254.x.x), DNS, and default gateways.'
      },
      {
        id: '2.8',
        title: '2.8 Network Technician Diagnostic & Cabling Tools',
        domain: 'c1d2',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Operate cable crimpers, punch-down tools, tone generators, wiremap testers, and loopback plugs.'
      }
    ]
  },
  {
    id: 'c1d3',
    title: 'Hardware',
    name: 'Hardware',
    color: 'text-orange-500',
    exam: 'Core 1',
    course: 'a-plus',
    objectivesCount: 6,
    objectives: [
      {
        id: '3.1',
        title: '3.1 Copper, Fiber & Coaxial Cable Standards',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Analyze Cat 5e/6/6a UTP/STP, T568A/T568B pinouts, single-mode vs multi-mode fiber, and RG-6 coaxial.'
      },
      {
        id: '3.2',
        title: '3.2 Peripheral & Display Connector Interfaces',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Identify HDMI, DisplayPort, USB 3.2, USB4, Thunderbolt 4, and legacy interface specifications.'
      },
      {
        id: '3.3',
        title: '3.3 RAM Memory Technologies & Multi-Channel Setup',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Install and configure DDR4/DDR5 DIMMs, SODIMMs, dual-channel pairing, and ECC unbuffered memory.'
      },
      {
        id: '3.4',
        title: '3.4 Storage Drives, SSDs & RAID Arrays',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Compare SATA SSDs, M.2 NVMe PCIe x4, and configure RAID 0, 1, 5, and 10 arrays.'
      },
      {
        id: '3.5',
        title: '3.5 Motherboard Form Factors, Chipsets & CPU Sockets',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Identify ATX, Micro-ATX, Mini-ITX form factors, PCIe expansion slots, Intel LGA vs AMD AM5, and TPM 2.0.'
      },
      {
        id: '3.7',
        title: '3.7 Power Supply Units (PSU) & Power Distribution',
        domain: 'c1d3',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Calculate wattage demands, pinouts (24-pin ATX, 8-pin EPS, PCIe), and 80 Plus efficiency ratings.'
      }
    ]
  },
  {
    id: 'c1d4',
    title: 'Virtualization & Cloud',
    name: 'Virtualization & Cloud',
    color: 'text-purple-500',
    exam: 'Core 1',
    course: 'a-plus',
    objectivesCount: 2,
    objectives: [
      {
        id: '4.1',
        title: '4.1 Cloud Computing Concepts & Delivery Models',
        domain: 'c1d4',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Differentiate IaaS, PaaS, SaaS, public/private/hybrid clouds, rapid elasticity, and measured service.'
      },
      {
        id: '4.2',
        title: '4.2 Client-Side Virtualization & Hypervisors',
        domain: 'c1d4',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Deploy Type 1 bare-metal and Type 2 hosted hypervisors, allocate vCPUs/vRAM, and configure virtual networking.'
      }
    ]
  },
  {
    id: 'c1d5',
    title: 'Hardware & Network Troubleshooting',
    name: 'Hardware & Network Troubleshooting',
    color: 'text-red-500',
    exam: 'Core 1',
    course: 'a-plus',
    objectivesCount: 3,
    objectives: [
      {
        id: '5.1',
        title: '5.1 Motherboard, RAM, CPU & Power Diagnostics',
        domain: 'c1d5',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Apply the CompTIA 6-step troubleshooting methodology to diagnose POST beep codes, power failures, and thermal shutdowns.'
      },
      {
        id: '5.2',
        title: '5.2 Storage Drive Failures & RAID Troubleshooting',
        domain: 'c1d5',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Troubleshoot clicking mechanical drives, SMART predictive warnings, degraded RAID volumes, and boot errors.'
      },
      {
        id: '5.6',
        title: '5.6 Wired & Wireless Network Troubleshooting',
        domain: 'c1d5',
        exam: 'Core 1',
        course: 'a-plus',
        description: 'Use ipconfig, ping, tracert, nslookup, and netstat to troubleshoot connectivity and duplicate IP conflicts.'
      }
    ]
  },
  {
    id: 'c2d1',
    title: 'Operating Systems',
    name: 'Operating Systems',
    color: 'text-cyan-500',
    exam: 'Core 2',
    course: 'a-plus',
    objectivesCount: 3,
    objectives: [
      {
        id: 'c2_1.1',
        title: '1.1 Windows OS Features, Filesystems & Architecture',
        domain: 'c2d1',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Master NTFS permissions, BitLocker drive encryption, Task Manager, Event Viewer, and Windows 10/11 system tools.'
      },
      {
        id: 'c2_1.2',
        title: '1.2 Essential Command-Line Utilities (CLI)',
        domain: 'c2d1',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Execute system maintenance commands including sfc /scannow, DISM, chkdsk, gpupdate /force, and taskkill.'
      },
      {
        id: 'c2_1.8',
        title: '1.8 macOS & Linux Operating System Environments',
        domain: 'c2d1',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Navigate Unix directory structures, permissions (chmod/chown), package managers (apt), Time Machine, and cron.'
      }
    ]
  },
  {
    id: 'c2d2',
    title: 'Security',
    name: 'Security',
    color: 'text-yellow-500',
    exam: 'Core 2',
    course: 'a-plus',
    objectivesCount: 4,
    objectives: [
      {
        id: 'c2_2.1',
        title: '2.1 Physical Security Controls & Facility Hardening',
        domain: 'c2d2',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Implement mantraps, biometric scanners, key fobs, privacy filters, and Kensington physical cable locks.'
      },
      {
        id: 'c2_2.3',
        title: '2.3 Wireless Security Protocols & Authentication',
        domain: 'c2d2',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Configure WPA2/WPA3 Personal (SAE), Enterprise 802.1X RADIUS authentication, and mitigate rogue APs.'
      },
      {
        id: 'c2_2.4',
        title: '2.4 Malware Analysis & 7-Step Remediation',
        domain: 'c2d2',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Execute the CompTIA 7-step malware removal process from quarantine through system restore reactivation.'
      },
      {
        id: 'c2_2.5',
        title: '2.5 Social Engineering & Deception Attack Vectors',
        domain: 'c2d2',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Recognize phishing, spear phishing, vishing, smishing, shoulder surfing, tailgating, and dumpster diving.'
      }
    ]
  },
  {
    id: 'c2d3',
    title: 'Software Troubleshooting',
    name: 'Software Troubleshooting',
    color: 'text-emerald-500',
    exam: 'Core 2',
    course: 'a-plus',
    objectivesCount: 1,
    objectives: [
      {
        id: 'c2_3.1',
        title: '3.1 Windows OS Crash, BSOD & Boot Troubleshooting',
        domain: 'c2d3',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Diagnose Windows Stop Errors (BSOD), corrupt BCD records, missing DLLs, and Safe Mode diagnostic environments.'
      }
    ]
  },
  {
    id: 'c2d4',
    title: 'Operational Procedures',
    name: 'Operational Procedures',
    color: 'text-zinc-500',
    exam: 'Core 2',
    course: 'a-plus',
    objectivesCount: 3,
    objectives: [
      {
        id: 'c2_4.1',
        title: '4.1 IT Documentation, Asset Management & Change Control',
        domain: 'c2d4',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Maintain network topology maps, standard operating procedures, asset tags, and formal change requests.'
      },
      {
        id: 'c2_4.4',
        title: '4.4 Environmental Safety, Chemical Handling & ESD',
        domain: 'c2d4',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Apply ESD grounding, use Safety Data Sheets (SDS), handle lithium battery disposal, and Class C fire extinguishers.'
      },
      {
        id: 'c2_4.7',
        title: '4.7 Fundamentals of Scripting & IT Automation',
        domain: 'c2d4',
        exam: 'Core 2',
        course: 'a-plus',
        description: 'Identify syntax patterns in PowerShell (.ps1), Bash (.sh), Batch (.bat), variables, loops, and script execution.'
      }
    ]
  }
];


