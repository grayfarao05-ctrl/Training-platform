import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_2_1_LESSON: LessonData = {
  objectiveId: '2.1',
  courseId: 'a-plus',
  title: 'TCP & UDP Protocols and Common Port Numbers',
  domainName: 'Domain 2.0: Networking',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master standard networking ports, connection-oriented TCP vs connectionless UDP, secure encrypted alternatives, and firewall port filtering.',
  sections: [
    {
      id: 'sec-text-2-1',
      type: 'text',
      title: 'Technical Briefing: Transport Layer Ports & Protocols',
      subtitle: 'TCP vs. UDP, Socket Addressing, and Service Mapping',
      estimatedMinutes: 6,
      content: {
        lead: 'Network communication relies on standardized port numbers (Layer 4) to multiplex multiple network services over a single IP address. CompTIA A+ technicians must memorize critical well-known ports and understand when TCP or UDP is utilized.',
        sections: [
          {
            heading: 'TCP (Transmission Control Protocol) vs. UDP (User Datagram Protocol)',
            body: [
              'TCP is a connection-oriented protocol that establishes a reliable communication session using a 3-way handshake (SYN, SYN-ACK, ACK). It guarantees in-order packet delivery, sequence numbers, and packet retransmission upon error.',
              'UDP is a lightweight, connectionless "best-effort" protocol with no handshake or delivery guarantees. It is essential for latency-sensitive traffic such as real-time VoIP, streaming video, and DNS lookups where speed outweighs packet retransmissions.'
            ],
            bulletPoints: [
              'Port 20/21: FTP (File Transfer Protocol) - Unencrypted cleartext data and command transfer.',
              'Port 22: SSH (Secure Shell) & SFTP - Encrypted remote terminal administration.',
              'Port 25: SMTP (Simple Mail Transfer Protocol) - Server-to-server email forwarding.',
              'Port 53: DNS (Domain Name System) - Translates human domain names to IP addresses (UDP for queries, TCP for zone transfers).',
              'Port 80 (HTTP) vs. Port 443 (HTTPS) - Cleartext web browsing vs. TLS/SSL encrypted web traffic.',
              'Port 110 (POP3) vs. Port 143 (IMAP) - Local email download vs. synchronized server-side folder mail.',
              'Port 3389: RDP (Remote Desktop Protocol) - Microsoft graphical remote desktop administration.',
              'Port 445: SMB (Server Message Block) - Windows file and printer sharing over LAN.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Encrypted Alternatives',
              content: 'Whenever CompTIA asks how to secure an unencrypted protocol, choose: SSH (22) over Telnet (23), HTTPS (443) over HTTP (80), SFTP (22) or FTPS (990) over FTP (21), and SMTPS (465/587) over SMTP (25).'
            }
          }
        ],
        technicalTerms: [
          { term: 'Socket', definition: 'The combination of an IP address and a Port number (e.g. 192.168.1.50:443) identifying a unique connection endpoint.' },
          { term: 'Ephemeral Ports', definition: 'Temporary high-range port numbers (49152–65535) assigned dynamically by client operating systems for outbound connections.' },
          { term: 'SYN-ACK', definition: 'The second segment in the TCP 3-way handshake, synchronizing sequence numbers and acknowledging client request.' },
          { term: 'DHCP', definition: 'Dynamic Host Configuration Protocol; automatically leases IP, subnet mask, gateway, and DNS on ports 67 (server) and 68 (client).' }
        ],
        keyTakeaways: [
          'TCP guarantees delivery via 3-way handshake; UDP prioritizes low-latency streaming without acknowledgments.',
          'Port 53 handles DNS; Port 443 encrypts web traffic with TLS.',
          'Port 3389 is Microsoft RDP; Port 445 is SMB network sharing.'
        ]
      }
    },
    {
      id: 'sec-diagram-2-1',
      type: 'diagram',
      title: 'Interactive Network Topology & Port Gateway',
      subtitle: 'Firewall Port Filtering & Service Routing',
      estimatedMinutes: 8,
      diagramId: 'network-topology',
      diagramTitle: 'Enterprise Perimeter Firewall & Service Ports',
      description: 'Click network service nodes to inspect default port assignments, transport protocols, and firewall rules.',
      hotspots: [
        {
          id: 'ssh',
          x: 20,
          y: 25,
          name: 'SSH Terminal Gateway (Port 22)',
          category: 'Remote Administration',
          shortDescription: 'Secure Shell encrypted console access.',
          fullSpecs: 'TCP Port 22, asymmetric key cryptography, replaces legacy Telnet (Port 23).',
          troubleshootingNote: 'Symptom: Connection refused if SSH daemon is stopped or corporate firewall blocks Port 22.',
          examRelevance: 'CompTIA emphasizes SSH for secure Linux and network switch command-line management.'
        },
        {
          id: 'dns',
          x: 45,
          y: 20,
          name: 'DNS Resolver Host (Port 53)',
          category: 'Name Resolution',
          shortDescription: 'Translates domain hostnames into IPv4/IPv6 addresses.',
          fullSpecs: 'UDP Port 53 for standard queries; TCP Port 53 for zone transfers exceeding 512 bytes.',
          troubleshootingNote: 'Symptom: Users can ping external IP addresses (8.8.8.8) but cannot open websites by URL.',
          examRelevance: 'Classic CompTIA scenario: "Can ping by IP but not by name" = DNS server failure.'
        },
        {
          id: 'https',
          x: 75,
          y: 35,
          name: 'HTTPS Secure Web Server (Port 443)',
          category: 'Encrypted Web Traffic',
          shortDescription: 'Hypertext Transfer Protocol Secure over TLS/SSL.',
          fullSpecs: 'TCP Port 443, X.509 digital certificates, AES encryption.',
          troubleshootingNote: 'Symptom: Certificate expired warning or security protocol cipher mismatch.',
          examRelevance: 'Recognize Port 443 as mandatory for e-commerce, banking, and secure enterprise web apps.'
        },
        {
          id: 'rdp',
          x: 50,
          y: 65,
          name: 'RDP Remote Desktop Server (Port 3389)',
          category: 'Desktop Virtualization',
          shortDescription: 'Microsoft Remote Desktop graphical session.',
          fullSpecs: 'TCP Port 3389 (can also use UDP 3389 for enhanced streaming latency), Network Level Authentication (NLA).',
          troubleshootingNote: 'Symptom: "Remote Desktop can\'t connect to the remote computer" when Windows Remote Desktop is disabled in System Properties.',
          examRelevance: 'Required port for remote Windows administration and technician support.'
        },
        {
          id: 'dhcp',
          x: 25,
          y: 75,
          name: 'DHCP Scope Server (Ports 67 / 68)',
          category: 'Automatic Addressing',
          shortDescription: 'Dynamic Host Configuration Protocol server and client.',
          fullSpecs: 'UDP Port 67 (Server listening), UDP Port 68 (Client broadcast), 4-step DORA process.',
          troubleshootingNote: 'Symptom: Client assigned 169.254.x.x (APIPA) indicates failure to reach DHCP server.',
          examRelevance: 'Knowing DORA (Discover, Offer, Request, Acknowledge) and APIPA fallback is tested heavily.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Locate the port responsible for secure command-line shell administration.',
          targetHotspotId: 'ssh',
          hint: 'Look for Port 22.'
        },
        {
          prompt: 'Identify the service node that resolves web addresses to IP addresses.',
          targetHotspotId: 'dns',
          hint: 'Operates on Port 53.'
        },
        {
          prompt: 'Select the graphical desktop management service port.',
          targetHotspotId: 'rdp',
          hint: 'Microsoft RDP operates on Port 3389.'
        }
      ]
    },
    {
      id: 'sec-3d-2-1',
      type: '3d-model',
      title: 'Interactive 3D Hardware: Enterprise Switch & Router Stack',
      subtitle: 'Rackmount Form Factors, RJ45 Modular Ports, & Fiber SFPs',
      estimatedMinutes: 8,
      modelId: 'laptop-teardown',
      modelTitle: '3D Network Rack Appliance Anatomy',
      description: 'Inspect the hardware layout of an enterprise 1U Layer 3 switch and edge router.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'switch-chassis',
          name: '1U Steel Rackmount Chassis',
          category: 'Infrastructure Frame',
          color: '#1e293b',
          shape: 'box',
          dimensions: [10, 0.8, 6],
          defaultPosition: [0, -1, 0],
          explodedPosition: [0, -2.5, 0],
          description: 'Standard 19-inch rack-width enclosure with dual redundant hot-swappable power supply bays.',
          specs: '1.75 inch (1U) vertical height, EIA-310 19" standard, grounding lug terminal.',
          failureSymptoms: 'Power supply amber fault LED, thermal overtemperature warning in syslog.'
        },
        {
          id: 'rj45-bank',
          name: '24-Port Gigabit RJ45 Patch Bank',
          category: 'Copper Port Array',
          color: '#0284c7',
          shape: 'box',
          dimensions: [7, 0.4, 1.2],
          defaultPosition: [-1, -0.6, 2.2],
          explodedPosition: [-1, 1.2, 2.2],
          description: '10/100/1000Base-T Ethernet ports with integrated magnetics and link/activity LEDs.',
          specs: '802.3at PoE+ (up to 30W per port), auto-MDI/MDIX crossover detection.',
          failureSymptoms: 'Bent copper contact pins, intermittent link flap from damaged modular clips.'
        },
        {
          id: 'sfp-modules',
          name: '10G SFP+ Optical Transceiver Cage',
          category: 'Fiber Uplinks',
          color: '#f59e0b',
          shape: 'box',
          dimensions: [2, 0.4, 1.2],
          defaultPosition: [3.5, -0.6, 2.2],
          explodedPosition: [3.5, 1.8, 2.2],
          description: 'Small Form-factor Pluggable (SFP+) cages accommodating 10-Gigabit fiber optical transceivers.',
          specs: 'LC duplex connector interface, 850nm Multi-Mode Fiber (10GBASE-SR) or 1310nm Single-Mode (10GBASE-LR).',
          failureSymptoms: 'Dirty optical ferrule causing high dB optical signal loss or SFP module incompatibility.'
        },
        {
          id: 'asic-mainboard',
          name: 'Packet Switching ASIC & CPU Mainboard',
          category: 'Logic Engine',
          color: '#065f46',
          shape: 'board',
          dimensions: [9, 0.15, 4.5],
          defaultPosition: [0, -0.7, -0.5],
          explodedPosition: [0, 0.2, -0.5],
          description: 'High-bandwidth packet processing Application-Specific Integrated Circuit (ASIC) with non-blocking switching fabric.',
          specs: '128 Gbps switching capacity, 95 Mpps forwarding rate, 16,000 MAC address table.',
          failureSymptoms: 'Kernel panic, MAC address table overflow, switch loop broadcast storm.'
        }
      ]
    },
    {
      id: 'sec-anim-2-1',
      type: 'animation',
      title: 'Dynamic Demonstration: TCP 3-Way Handshake vs UDP',
      subtitle: 'Session Establishment, Sequence Sync & Acknowledgments',
      estimatedMinutes: 5,
      animationType: 'bus-speed-pcie',
      description: 'Observe how client and server negotiate sequence numbers and verify connectivity before exchanging application payload data.',
      steps: [
        {
          stepNumber: 1,
          label: 'Client Sends SYN (Synchronize)',
          description: 'The client initiates connection by sending a TCP packet with the SYN flag set and an initial sequence number (e.g. Seq=1000).',
          highlightedElement: 'SYN Flag Packet (Client -> Server)',
          metrics: { label: 'Flag', value: 'SYN=1' }
        },
        {
          stepNumber: 2,
          label: 'Server Responds with SYN-ACK',
          description: 'The server acknowledges receipt by setting ACK=1001, and sends its own synchronize sequence number (Seq=5000).',
          highlightedElement: 'SYN-ACK Response (Server -> Client)',
          metrics: { label: 'Flags', value: 'SYN=1, ACK=1' }
        },
        {
          stepNumber: 3,
          label: 'Client Sends Final ACK',
          description: 'The client acknowledges the server sequence number (ACK=5001). The connection is now ESTABLISHED and data transmission begins.',
          highlightedElement: 'Connection Established',
          metrics: { label: 'State', value: 'ESTABLISHED' }
        },
        {
          stepNumber: 4,
          label: 'Contrast: UDP Connectionless Stream',
          description: 'By contrast, UDP sends datagrams immediately without handshake or ACK. Dropped packets are not retransmitted, preserving low latency.',
          highlightedElement: 'UDP Best-Effort Stream',
          metrics: { label: 'Overhead', value: '8 Bytes Header' }
        }
      ]
    },
    {
      id: 'sec-lab-2-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Firewall Port Rule Configuration',
      subtitle: 'Securing Web and Terminal Services',
      estimatedMinutes: 8,
      labTitle: 'Enterprise Firewall Security Configuration Lab',
      goal: 'Block insecure cleartext protocols (Telnet, HTTP) and open verified encrypted services (SSH, HTTPS, DNS).',
      hardwareSubject: 'Perimeter Statefull Firewall',
      prerequisites: [
        'Firewall Admin console session authenticated',
        'Company Security Baseline Protocol review'
      ],
      steps: [
        {
          id: 'p-step-1',
          instruction: 'Disable Insecure Cleartext Telnet (Port 23)',
          detail: 'Telnet transmits usernames and passwords across the network in unencrypted plaintext, vulnerable to packet sniffing.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Port 23 (Telnet) successfully closed and blocked across all external interfaces.'
        },
        {
          id: 'p-step-2',
          instruction: 'Allow Secure Shell SSH Management (Port 22)',
          detail: 'Permit encrypted administrative terminal access restricted to the management subnet.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'Port 22 (SSH) rule enabled for authorized administrative bastions.'
        },
        {
          id: 'p-step-3',
          instruction: 'Open Outbound DNS Resolver Queries (Port 53 UDP)',
          detail: 'Allow internal clients to send domain name lookup queries to external corporate DNS servers.',
          actionType: 'insert-ram',
          feedbackOnSuccess: 'Port 53 UDP outbound permitted. Name resolution active.'
        },
        {
          id: 'p-step-4',
          instruction: 'Permit Inbound HTTPS Web Traffic (Port 443 TCP)',
          detail: 'Enable encrypted TLS web traffic to the corporate web server.',
          actionType: 'lock-clips',
          feedbackOnSuccess: 'Port 443 TCP allowed through NAT gateway. SSL/TLS sessions active.'
        },
        {
          id: 'p-step-5',
          instruction: 'Apply Security Policy & Verify Active State',
          detail: 'Commit the firewall rule changes and run a port verification scan.',
          actionType: 'verify-post',
          feedbackOnSuccess: 'Firewall rules committed! Insecure ports blocked, encrypted services operational.'
        }
      ],
      successMessage: 'Great job! You correctly applied firewall port discipline according to CompTIA network security standards.',
      xpReward: 250
    },
    {
      id: 'sec-scenario-2-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: "Internet Is Down, But I Can Ping 8.8.8.8"',
      subtitle: 'CompTIA Network Diagnostics Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Workstation Website Unreachable Incident',
      clientName: 'David Miller, Operations Analyst',
      deviceModel: 'Corporate Desktop (Wired Ethernet)',
      initialProblemDescription: 'User reports that "the Internet is completely broken" because no websites will load in the browser. However, when the technician pings public IP address 8.8.8.8, the response returns in 12ms with 0% packet loss.',
      startStepId: 'step-net-diag',
      steps: {
        'step-net-diag': {
          id: 'step-net-diag',
          title: 'Step 1: Analyze Diagnostic Clues',
          scenarioText: 'Pinging 8.8.8.8 succeeds with 12ms round-trip, but navigating to https://www.google.com fails with "Server Not Found". What does this diagnostic contrast prove?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-dns-issue',
              label: 'Establish Theory: Physical connectivity & gateway routing work; DNS (Port 53) is failing',
              actionDescription: 'Recognize that IP routing is functional, but name-to-address resolution is broken.',
              nextStepId: 'step-fix-dns',
              feedback: 'Exact diagnosis! Because raw IP pinging succeeds, the network cable, switch port, and default gateway are fine. The issue is strictly DNS resolution (Port 53).'
            },
            {
              id: 'c-swap-cable',
              label: 'Replace the Cat 6 Ethernet patch cable at the wall jack',
              actionDescription: 'Blame physical layer cabling.',
              isFatal: true,
              feedback: 'Incorrect! If the cable were damaged, pinging 8.8.8.8 would fail with "General failure" or "Request timed out".'
            }
          ]
        },
        'step-fix-dns': {
          id: 'step-fix-dns',
          title: 'Step 2: Inspect IP Configuration & Remediate',
          scenarioText: 'You run "ipconfig /all". The DNS server is set to a static obsolete IP address (192.168.100.254) from a decommissioned domain controller. How do you resolve this?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-dhcp-dns',
              label: 'Set IPv4 properties to "Obtain DNS server address automatically" via DHCP and run "ipconfig /flushdns"',
              actionDescription: 'Allow corporate DHCP to supply the active primary and secondary DNS servers.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The client receives the active corporate DNS server. All web pages load instantly, and the local resolver cache is flushed.'
            },
            {
              id: 'c-reboot-router',
              label: 'Power cycle the building core edge router',
              actionDescription: 'Reboot the entire office gateway.',
              isFatal: true,
              feedback: 'Hazardous! Rebooting the building core router disconnects 400 other employees to fix a single misconfigured workstation.'
            }
          ]
        }
      }
    },
    {
      id: 'sec-quiz-2-1',
      type: 'quiz',
      title: 'Knowledge Check: Networking Ports & Protocols',
      subtitle: 'CompTIA 220-1101 Domain 2.0 Exam Drill',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Objective 2.1 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'q-2-1-1',
          question: 'Which of the following ports should be open on a firewall to allow secure, encrypted remote command-line administration of an edge router?',
          options: [
            'Port 21 (FTP)',
            'Port 22 (SSH)',
            'Port 23 (Telnet)',
            'Port 80 (HTTP)'
          ],
          correctAnswer: 1,
          explanation: 'Port 22 is used by Secure Shell (SSH) for encrypted command-line management. Telnet (Port 23) is insecure cleartext.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.1'
        },
        {
          id: 'q-2-1-2',
          question: 'A user can successfully ping internal and external servers by IP address, but cannot browse to any website using a domain name. Which protocol is failing?',
          options: [
            'DHCP (Port 67)',
            'DNS (Port 53)',
            'SNMP (Port 161)',
            'NTP (Port 123)'
          ],
          correctAnswer: 1,
          explanation: 'The Domain Name System (DNS) operates on Port 53 and resolves hostnames to IP addresses. When DNS fails, pinging by IP still works.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.1'
        },
        {
          id: 'q-2-1-3',
          question: 'Which default port is utilized by Microsoft Remote Desktop Protocol (RDP) for graphical remote control of a workstation?',
          options: [
            'Port 443',
            'Port 445',
            'Port 3389',
            'Port 8080'
          ],
          correctAnswer: 2,
          explanation: 'Remote Desktop Protocol (RDP) communicates over TCP/UDP Port 3389.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.1'
        },
        {
          id: 'q-2-1-4',
          question: 'What is the primary operational difference between TCP and UDP at the Transport Layer?',
          options: [
            'TCP is connection-oriented with guaranteed delivery; UDP is connectionless without acknowledgments',
            'TCP operates on Layer 3 while UDP operates on Layer 4',
            'TCP cannot transmit web traffic',
            'UDP is encrypted by default while TCP is always plaintext'
          ],
          correctAnswer: 0,
          explanation: 'TCP uses a 3-way handshake and sequence numbers to guarantee delivery. UDP sends packets with zero session overhead, ideal for real-time media.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 2.1'
        }
      ]
    }
  ]
};
