// High-fidelity curriculum fallback generator for ITreal
// Ensures question and case drafting continues seamlessly even when Gemini API keys
// are not attached or during regional API capacity throttles.

import { ContractCase, CVClinicCase, QuestionType, AiQuestionDraft } from './types';

export interface FallbackQuestionParams {
  type?: QuestionType | 'cli';
  course?: string;
  courseName?: string;
  domainTitle?: string;
  difficulty?: string;
  objectiveTitle?: string;
  topic?: string;
  count?: number;
}

// -------------------------------------------------------------
// Type-aware Draft Question Catalog (SA English & ZAR Currency)
// -------------------------------------------------------------

const FALLBACK_CHOICE_DRAFTS = [
  {
    question: 'A Johannesburg medical clinic reports that an administrative workstation loses network connectivity every time the backup generator switches on during loadshedding. The technician inspects the rack and notes a surge suppressor power strip daisy-chained to a 650VA UPS. Which of the following is the BEST solution?',
    options: [
      'Connect the workstation and UPS directly to the dedicated surge-protected wall socket without daisy-chaining.',
      'Replace the UPS with an unshielded Cat 6 patch lead to prevent ground loop noise.',
      'Configure a static IP address on the workstation to avoid DHCP renegotiation.',
      'Increase the Windows power plan standby timeout to 60 minutes.'
    ],
    correctAnswer: 0,
    explanation: 'Daisy-chaining surge protectors or power strips to a UPS can overload internal circuit protection, violate SABS electrical safety codes, and introduce ground impedance issues during utility-to-generator transfer spikes.'
  },
  {
    question: 'A matriculant technician is dispatched to configure a new small-office network in Durban with a budget of R15,000. The client requires wireless coverage across two adjacent brick workshops separated by a 40-metre open courtyard. Which transmission medium is MOST resilient against lightning surges and ground differential?',
    options: [
      'Outdoor multimode fibre-optic cable run through PVC conduit',
      'Unshielded Twisted Pair (UTP) Cat 6 copper patch cable',
      'Powerline Ethernet adapter plugged into separate circuit breakers',
      'Coaxial RG-6 cable terminated with twist-on BNC connectors'
    ],
    correctAnswer: 0,
    explanation: 'Fibre-optic cabling uses light rather than electrical current, making it inherently immune to electromagnetic interference (EMI), high-voltage lightning strikes, and electrical ground differential between separate buildings.'
  },
  {
    question: 'An IT technician receives a phishing alert indicating that an employee received an invoice from an unfamiliar vendor requesting an urgent payment of R45,000 with altered banking details. Which social engineering tactic does this scenario represent?',
    options: [
      'Business Email Compromise (BEC) and Spear Phishing',
      'Watering Hole exploit with drive-by payload',
      'Shoulder surfing and password spraying',
      'Vishing using interactive voice response spoofing'
    ],
    correctAnswer: 0,
    explanation: 'Business Email Compromise (BEC) is a targeted spear phishing attack specifically designed to impersonate suppliers, executives, or finance staff to divert company funds into fraudulent accounts.'
  },
  {
    question: 'A desktop technician is troubleshooting a PC that shuts down abruptly after approximately 10 minutes of running diagnostic software. Upon reboot, the BIOS hardware health screen reports CPU temperature at 92°C. Which of the following is the MOST probable cause?',
    options: [
      'Degraded thermal paste between the CPU IHS and heatsink or detached cooler retaining clip',
      'The DDR4 RAM module timings are improperly overclocked in UEFI',
      'The SATA SSD firmware is corrupt and throttling system throughput',
      'The CMOS CR2032 battery voltage has dropped below 1.5 volts'
    ],
    correctAnswer: 0,
    explanation: 'High thermal readings (92°C) followed by thermal protection shutdowns consistently indicate ineffective heat dissipation due to dried thermal paste, mounting bracket failure, or cooler pump/fan failure.'
  },
  {
    question: 'A junior technician in Pretoria is configuring a departmental network. The department must be isolated from the rest of the campus LAN to satisfy POPIA privacy compliance for employee payroll files. Which technique provides logical network segmentation without purchasing additional physical switches?',
    options: [
      'Configuring an isolated Virtual Local Area Network (VLAN) with ACL rules',
      'Installing an unmanaged 8-port desktop switch under the administrator desk',
      'Assigning duplicate IPv4 default gateways to all client machines',
      'Splitting the single Cat 5e wall cable into two 100BASE-TX pinouts'
    ],
    correctAnswer: 0,
    explanation: 'VLANs allow network administrators to partition a physical switch into distinct logical broadcast domains, enforcing strict access control lists (ACLs) to safeguard private data.'
  }
];

const FALLBACK_MULTI_DRAFTS = [
  {
    question: 'An IT support company is establishing a secure baseline workstation deployment for an accounting firm in Cape Town. Which THREE of the following settings should the technician verify to enforce endpoint security and POPIA compliance? (Select THREE).',
    options: [
      'Enable BitLocker full-disk encryption with TPM 2.0 validation.',
      'Configure automatic screen lock timeout set to 5 minutes or less.',
      'Enforce strong password complexity with multi-factor authentication (MFA).',
      'Assign all local office staff to the built-in Local Administrators group.',
      'Disable Windows Defender Firewall across public network profiles.'
    ],
    correctAnswers: [0, 1, 2],
    explanation: 'Full-disk encryption (BitLocker), automatic screen timeouts, and multi-factor authentication form the cornerstone of endpoint data security. Granting local admin privileges and disabling the firewall are dangerous practices.'
  },
  {
    question: 'A technician is troubleshooting a workstation that cannot communicate over the local network following a thunderstorm. The NIC link LED is unlit. Which TWO tools should the technician use FIRST to test the physical cable and port integrity? (Select TWO).',
    options: [
      'RJ45 cable continuity tester / wire mapper',
      'Loopback plug connected to the network interface card',
      'Wireshark packet capture utility',
      'Active Directory Users and Computers console',
      'Registry Editor (regedit.exe)'
    ],
    correctAnswers: [0, 1],
    explanation: 'A cable tester verifies pin-to-pin copper continuity and identifies crimp defects, while a hardware loopback plug allows the technician to test the NIC transceiver send/receive circuits without depending on external network switches.'
  },
  {
    question: 'When configuring an off-site backup strategy for a South African small business operating with intermittent loadshedding, which TWO practices ensure business continuity and ransomware resilience? (Select TWO).',
    options: [
      'Implement an immutable 3-2-1 backup strategy with an offline or air-gapped copy.',
      'Test monthly bare-metal restore procedures to verify data integrity.',
      'Store all backup archives solely on a mapped network drive without passwords.',
      'Disable backup encryption to increase transfer speed over fibre lines.',
      'Perform backups only once every six months during annual maintenance.'
    ],
    correctAnswers: [0, 1],
    explanation: 'The 3-2-1 rule (3 copies, 2 different media, 1 offsite/immutable) shields against ransomware encryption, while regular restore drills ensure backups can be recovered during critical downtime.'
  }
];

const FALLBACK_FILL_DRAFTS = [
  {
    question: 'A workstation configured for DHCP is unable to contact the local router and automatically assigns itself an IPv4 address starting with 169.254. What acronym represents this automatic Microsoft Windows addressing protocol?',
    acceptedAnswers: ['APIPA', 'Automatic Private IP Addressing', 'Automatic Private IP'],
    explanation: 'Automatic Private IP Addressing (APIPA) assigns IPv4 link-local addresses in the range 169.254.0.1 through 169.254.255.254 when a DHCP server fails to respond to a DHCPDISCOVER request.'
  },
  {
    question: 'What command-line utility in Windows is used to display the network adapter IP address, subnet mask, default gateway, and physical MAC address when executed with the /all switch?',
    acceptedAnswers: ['ipconfig', 'ipconfig.exe', 'ipconfig /all'],
    explanation: 'The "ipconfig /all" command provides a comprehensive readout of all active network adapters, including DNS servers, lease timestamps, DHCP servers, and MAC hardware addresses.'
  },
  {
    question: 'Which standard transport layer port number is used by secure HTTPS traffic encrypted with TLS?',
    acceptedAnswers: ['443', 'Port 443'],
    explanation: 'HTTPS uses TCP port 443 by default to transmit encrypted web traffic using Transport Layer Security (TLS).'
  },
  {
    question: 'In South Africa, which landmark data privacy legislation mandates how personal identifiable information (PII) must be gathered, stored, and protected by organisations?',
    acceptedAnswers: ['POPIA', 'Protection of Personal Information Act', 'POPI Act'],
    explanation: 'The Protection of Personal Information Act (POPIA) governs data privacy and sets statutory requirements for information officers, consent, and protection against unauthorized data disclosures.'
  }
];

const FALLBACK_MATCH_DRAFTS = [
  {
    question: 'Match each standard network protocol to its default transport layer port number:',
    pairs: [
      { left: 'SSH (Secure Shell)', right: 'TCP 22' },
      { left: 'DNS (Domain Name System)', right: 'UDP/TCP 53' },
      { left: 'HTTPS (Hypertext Transfer Protocol Secure)', right: 'TCP 443' },
      { left: 'RDP (Remote Desktop Protocol)', right: 'TCP 3389' }
    ],
    explanation: 'Standard IANA well-known ports are essential for firewall configuration: SSH runs on 22, DNS queries resolve on 53, HTTPS communicates on 443, and Windows Remote Desktop listens on 3389.'
  },
  {
    question: 'Match each motherboard storage interface or form factor to its primary technical characteristic:',
    pairs: [
      { left: 'SATA III 2.5-inch', right: 'Max 6 Gbps bandwidth using AHCI protocol' },
      { left: 'M.2 NVMe PCIe 4.0', right: 'High-speed storage communicating directly via PCIe lanes' },
      { left: 'USB-C 3.2 Gen 2x2', right: 'External connection delivering up to 20 Gbps throughput' },
      { left: 'DIMM 288-pin', right: 'High-bandwidth system volatile memory socket' }
    ],
    explanation: 'SATA III caps at 6 Gbps (approx 550 MB/s), NVMe leverages high-speed PCIe lanes for gigabytes-per-second transfers, USB-C 3.2 Gen 2x2 supports 20 Gbps, and 288-pin DIMM sockets hold DDR4/DDR5 system RAM.'
  },
  {
    question: 'Match each security attack classification to its real-world manifestation:',
    pairs: [
      { left: 'Phishing', right: 'Fraudulent email with malicious link requesting login confirmation' },
      { left: 'Ransomware', right: 'Malicious payload that encrypts master file tables demanding Rands or crypto' },
      { left: 'Shoulder Surfing', right: 'Direct visual observation of a user entering access credentials or PIN' },
      { left: 'Brute Force', right: 'Automated trial-and-error password guessing attempts' }
    ],
    explanation: 'Phishing uses deceptive messaging, ransomware locks user data behind encryption keys, shoulder surfing exploits direct visual line of sight, and brute force relies on automated credential attempts.'
  }
];

const FALLBACK_ORDER_DRAFTS = [
  {
    question: 'Arrange the CompTIA 6-step troubleshooting methodology in the correct chronological order from first to last:',
    steps: [
      'Identify the problem (gather information, question user, identify system changes).',
      'Establish a theory of probable cause (question the obvious, consider multiple approaches).',
      'Test the theory to determine cause (confirm theory or formulate new theory).',
      'Establish a plan of action to resolve the problem and implement the solution.',
      'Verify full system functionality and implement preventive measures.',
      'Document findings, actions, and outcomes.'
    ],
    explanation: 'The CompTIA 6-step framework is an industry standard: 1. Identify Problem, 2. Establish Theory, 3. Test Theory, 4. Plan and Resolve, 5. Verify & Prevent, 6. Document.'
  },
  {
    question: 'Arrange the sequential steps a technician must take when safely replacing a desktop power supply unit (PSU):',
    steps: [
      'Shut down the PC and unplug the main AC power cord from the wall outlet.',
      'Press and hold the PC power button for 10 seconds to drain residual capacitor charge.',
      'Attach an anti-static wrist strap to unpainted metal on the PC chassis.',
      'Disconnect all internal ATX power cables from motherboard, GPU, and drives.',
      'Unscrew mounting screws, swap the PSU, reconnect cables, and verify before powering on.'
    ],
    explanation: 'Safety protocols require cutting external power, discharging stored capacitive energy, equalising electrostatic potential with ESD grounding, and methodically managing internal cabling.'
  },
  {
    question: 'Arrange the standard four-way handshake DHCP process (DORA) in the correct operational sequence:',
    steps: [
      'DHCPDISCOVER: Client broadcasts on UDP port 67 seeking an available DHCP server.',
      'DHCPOFFER: DHCP server broadcasts an available IP address configuration lease to client.',
      'DHCPREQUEST: Client formally requests the offered IP lease from the chosen server.',
      'DHCPACK: Server acknowledges the lease and transmits final subnet mask and gateway settings.'
    ],
    explanation: 'The standard DHCP protocol handshake acronym is DORA: Discover, Offer, Request, and Acknowledge.'
  }
];

const FALLBACK_IMAGE_DRAFTS = [
  {
    question: 'A field technician in Durban is inspecting the rear I/O panel of a customer desktop PC shown in the diagram. Which connector indicated by the arrow provides legacy analog video output to older CRT or LCD monitors?',
    options: [
      '15-pin D-sub blue VGA connector',
      'High-Definition Multimedia Interface (HDMI) port',
      'DisplayPort with latching retention clip',
      'USB-C DisplayPort Alternate Mode port'
    ],
    correctAnswer: 0,
    altText: 'Diagram of a desktop computer rear I/O panel displaying USB ports, HDMI, DisplayPort, audio jacks, and a 15-pin blue VGA D-sub connector highlighted with a red arrow.',
    imageIdea: 'A clear technical diagram of a computer motherboard rear I/O shield illustrating USB ports, RJ-45 LAN, audio jacks, DisplayPort, HDMI, and a prominent blue 15-pin VGA connector with an arrow pointer.',
    explanation: 'The blue 15-pin DE-15 / D-sub connector transmits analog RGB video signals (VGA) and is widely found on legacy office equipment throughout South Africa.'
  },
  {
    question: 'The technician is examining the motherboard layout shown in the illustration. Which expansion slot highlighted by the callout is designed for high-performance discrete graphics cards?',
    options: [
      'PCIe x16 full-length slot with retention latch',
      'PCIe x1 short peripheral slot for sound cards',
      'Legacy 32-bit PCI slot operating at 33 MHz',
      'M.2 Key-M socket for solid state drives'
    ],
    correctAnswer: 0,
    altText: 'Motherboard schematic highlighting the primary PCIe x16 slot located directly beneath the CPU socket.',
    imageIdea: 'Technical schematic of an ATX motherboard showing CPU socket, RAM slots, M.2 bays, and a highlighted PCIe 3.0/4.0 x16 slot with locking latch.',
    explanation: 'PCI Express x16 slots feature 16 serial communication lanes and provide up to 75W of onboard slot power, making them the standard interface for graphics cards.'
  }
];

const FALLBACK_CLI_DRAFTS = [
  {
    question: 'A desktop support specialist needs to test round-trip network latency and packet loss between a local Windows workstation and the default gateway located at 192.168.1.1. Which command should the technician execute in Command Prompt?',
    acceptedCommands: ['ping 192.168.1.1', 'ping -t 192.168.1.1', 'ping 192.168.1.1 -n 4'],
    simulatedOutput: 'Pinging 192.168.1.1 with 32 bytes of data:\nReply from 192.168.1.1: bytes=32 time=1ms TTL=64\nReply from 192.168.1.1: bytes=32 time=2ms TTL=64\nReply from 192.168.1.1: bytes=32 time=1ms TTL=64\nReply from 192.168.1.1: bytes=32 time=1ms TTL=64\n\nPing statistics for 192.168.1.1:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms',
    hint: 'Use the standard ICMP echo utility followed by the target IPv4 address.',
    explanation: 'The "ping" command sends ICMP Echo Request packets to a target IP address and evaluates Echo Reply response times to assess physical layer and IP layer reachability.'
  },
  {
    question: 'A technician suspecting DNS resolution errors needs to query the authoritative name server records for the domain "itreal.co.za". Which standard Windows CLI tool should be used?',
    acceptedCommands: ['nslookup itreal.co.za', 'nslookup -type=any itreal.co.za', 'nslookup'],
    simulatedOutput: 'Server:  dns.google\nAddress:  8.8.8.8\n\nNon-authoritative answer:\nName:    itreal.co.za\nAddresses:  104.21.58.12, 172.67.182.95',
    hint: 'Use the standard name server lookup diagnostic command.',
    explanation: 'The "nslookup" utility allows administrators to query DNS servers directly to inspect record mapping (A, CNAME, MX) and diagnose domain resolution failures.'
  },
  {
    question: 'A workstation in Port Elizabeth is experiencing intermittent packet routing loops. Which Windows command traces the layer 3 intermediate routers and reports hop latency to 8.8.8.8?',
    acceptedCommands: ['tracert 8.8.8.8', 'tracert -d 8.8.8.8'],
    simulatedOutput: 'Tracing route to dns.google [8.8.8.8]\nover a maximum of 30 hops:\n\n  1     1 ms     1 ms     1 ms  192.168.1.1\n  2     8 ms     7 ms     8 ms  10.12.0.1\n  3    14 ms    15 ms    14 ms  jhb-core-1.is.co.za [196.25.1.1]\n  4    16 ms    16 ms    15 ms  dns.google [8.8.8.8]\n\nTrace complete.',
    hint: 'Use the Windows traceroute command (spelled with 7 letters).',
    explanation: 'The "tracert" command in Windows uses ICMP with incrementing TTL values to map every router hop between the source workstation and destination IP.'
  }
];

// -------------------------------------------------------------
// Type-aware Fallback Generator
// -------------------------------------------------------------

export function getFallbackQuestions(params: FallbackQuestionParams = {}): AiQuestionDraft[] {
  const rawType = params.type || 'choice';
  const normalizedType: QuestionType = rawType === 'cli' ? 'terminal' : rawType;
  const count = Math.max(1, Math.min(5, params.count || 3));
  const course = (params.course || 'a-plus') as any;
  const domain = params.domainTitle || 'General Objectives';
  const difficulty = (params.difficulty || 'Medium') as any;
  const objectiveTitle = params.objectiveTitle || '';

  let pool: any[] = [];
  if (normalizedType === 'choice') pool = FALLBACK_CHOICE_DRAFTS;
  else if (normalizedType === 'multi') pool = FALLBACK_MULTI_DRAFTS;
  else if (normalizedType === 'fill') pool = FALLBACK_FILL_DRAFTS;
  else if (normalizedType === 'match') pool = FALLBACK_MATCH_DRAFTS;
  else if (normalizedType === 'order') pool = FALLBACK_ORDER_DRAFTS;
  else if (normalizedType === 'image') pool = FALLBACK_IMAGE_DRAFTS;
  else if (normalizedType === 'terminal') pool = FALLBACK_CLI_DRAFTS;
  else pool = FALLBACK_CHOICE_DRAFTS;

  const results: AiQuestionDraft[] = [];
  for (let i = 0; i < count; i++) {
    const item = pool[i % pool.length];
    const draft: any = {
      ...item,
      type: normalizedType,
      course,
      domain,
      difficulty,
      objectiveTitle,
      aiDrafted: true
    };
    results.push(draft as AiQuestionDraft);
  }

  return results;
}

// Backwards-compatible single question helper
export function getFallbackQuestion(course = 'a-plus', domainTitle = 'Security', topic = 'Security') {
  const drafts = getFallbackQuestions({
    type: 'choice',
    course,
    domainTitle,
    topic,
    count: 1
  });
  const first: any = drafts[0] || FALLBACK_CHOICE_DRAFTS[0];
  return {
    text: first.question,
    options: first.options,
    correctAnswer: first.correctAnswer,
    explanation: first.explanation
  };
}

export function getFallbackCvCase(candidateRole = 'Entry-level IT Support Technician', difficulty = 'medium', course: any = 'matric-to-money'): CVClinicCase {
  return {
    course: (course || 'matric-to-money'),
    title: `${candidateRole} - Sample Training CV`,
    brief: 'Draft CV prepared for entry-level technician role with common South African job-seeking compliance mistakes.',
    difficulty: (difficulty as any) || 'medium',
    timeLimitSeconds: 60,
    status: 'draft',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    sections: [
      {
        heading: '# File',
        lines: [
          {
            id: 'line_file',
            text: 'Thabo_CV_Final_version2_latest(1).docx',
            mistake: {
              category: 'format',
              reason: 'CVs should be saved as a clean PDF formatted as Firstname_Surname_CV.pdf rather than an unfinalized .docx file.'
            }
          }
        ]
      },
      {
        heading: '# Personal Information',
        lines: [
          { id: 'line_pi_1', text: 'Full Name: Thabo Mokoena' },
          {
            id: 'line_pi_2',
            text: 'National ID: 030514 5298 089',
            mistake: {
              category: 'privacy',
              reason: 'Under POPIA and modern security practices, never share your full 13-digit SA ID number on an initial CV to prevent identity theft.'
            }
          },
          {
            id: 'line_pi_3',
            text: 'Physical Address: 42 Protea Glen Ext 12, Soweto, Johannesburg, 1818',
            mistake: {
              category: 'privacy',
              reason: 'Listing your full street address is a security risk. City and Province (e.g. Soweto, Gauteng) is sufficient.'
            }
          },
          {
            id: 'line_pi_4',
            text: 'Email: thabo_the_great_boss2003@yahoo.com',
            mistake: {
              category: 'contact',
              reason: 'Use a professional email address containing your first and last name (e.g. thabo.mokoena@email.com).'
            }
          },
          { id: 'line_pi_5', text: 'Mobile: +27 72 555 1234' }
        ]
      },
      {
        heading: '# Professional Summary',
        lines: [
          { id: 'line_ps_1', text: 'Passionate and energetic matriculant seeking an entry-level Desktop Support or Junior Technician role.' },
          { id: 'line_ps_2', text: 'Hands-on experience assembling PCs, troubleshooting Windows 11 systems, and configuring home LAN networks.' }
        ]
      },
      {
        heading: '# Certifications & Skills',
        lines: [
          {
            id: 'line_cert_1',
            text: 'CompTIA A+ Certified Technician (Exam scheduled for next month)',
            mistake: {
              category: 'honesty',
              reason: 'Claiming you are "Certified" when the exam is only scheduled or pending is misleading. Label it "In Progress - Expected [Date]".'
            }
          },
          { id: 'line_cert_2', text: 'Network Fundamentals: TCP/IP, DNS, DHCP, IPv4 Subnetting, Wi-Fi 6' },
          { id: 'line_cert_3', text: 'Operating Systems: Windows 10/11, Ubuntu Linux desktop, basic Active Directory' }
        ]
      }
    ]
  };
}

export function getFallbackContractCase(topic = 'Junior IT Support Tech', difficulty = 'medium', minWage = 27.58, course: any = 'matric-to-money'): ContractCase {
  return {
    course: (course || 'matric-to-money'),
    title: `${topic} - Employment Agreement Draft`,
    brief: 'Employment offer agreement containing common Basic Conditions of Employment Act (BCEA) compliance issues.',
    difficulty: (difficulty as any) || 'medium',
    timeLimitSeconds: 90,
    status: 'draft',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    clauses: [
      {
        id: 'c_commence',
        heading: '1. Commencement & Job Title',
        text: 'The Employer agrees to employ the Employee as Junior IT Support Technician commencing on the 1st of next month.'
      },
      {
        id: 'c_duties',
        heading: '2. Duties and Responsibilities',
        text: 'The Employee shall perform desktop troubleshooting, ticket resolution, and any additional operational directives assigned from time to time without restriction.'
      },
      {
        id: 'c_remun',
        heading: '3. Remuneration & Deductions',
        text: `The Employee shall be remunerated at a rate of R${(minWage - 5).toFixed(2)} per hour. The Employer shall deduct R350 monthly for mandatory company tool maintenance.`,
        flag: {
          category: 'pay',
          reason: `The stipulated rate is below South Africa's statutory National Minimum Wage (R${minWage}/hr), and unauthorized wage deductions for company equipment violate BCEA Section 34.`
        }
      },
      {
        id: 'c_hours',
        heading: '4. Working Hours & Overtime',
        text: 'Standard hours of work shall be 45 hours per week. The Employee agrees to work up to 15 mandatory hours of unpaid overtime whenever operational targets require.',
        flag: {
          category: 'hours',
          reason: 'BCEA limits overtime to 10 hours per week, and overtime must be compensated at a minimum of 1.5 times normal wage or given equivalent paid time off.'
        }
      },
      {
        id: 'c_probation',
        heading: '5. Probationary Period',
        text: 'The Employee shall serve a probation period of three (3) months, during which performance evaluations shall be conducted monthly.'
      },
      {
        id: 'c_leave',
        heading: '6. Annual and Sick Leave',
        text: 'The Employee shall be entitled to 21 consecutive days (or 15 working days) paid annual leave per 12-month cycle. Paid sick leave shall only accrue after 24 continuous months of service.',
        flag: {
          category: 'leave',
          reason: 'BCEA Section 22 mandates that during the first 6 months, an employee is entitled to 1 day paid sick leave for every 26 days worked, not a 24-month waiting period.'
        }
      },
      {
        id: 'c_notice',
        heading: '7. Notice of Termination',
        text: 'During the first six months of employment, either party may terminate the agreement on one (1) week written notice.'
      }
    ],
    missingItems: ['uif'],
    correctVerdict: 'dont-sign'
  };
}
