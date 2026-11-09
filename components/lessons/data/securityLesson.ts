import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_SECURITY_LESSON: LessonData = {
  objectiveId: 'c2d2',
  courseId: 'a-plus',
  title: 'Security Threats, Hardening, Encryption & Access Controls',
  domainName: 'Core 2 Domain 2.0: Security',
  badgeLabel: 'Core 2 (220-1102)',
  summary: 'Master defense-in-depth cybersecurity, BitLocker TPM encryption, social engineering prevention, Multi-Factor Authentication (MFA), WPA3 wireless, and malware mitigation.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'sec-text-1',
      type: 'text',
      title: 'Technical Briefing: Defense-in-Depth Cybersecurity',
      subtitle: 'Social Engineering, Cryptographic Hardening, & Multi-Factor Auth',
      estimatedMinutes: 6,
      content: {
        lead: 'Information security requires a layered "defense-in-depth" posture combining physical physical barriers, network perimeters, endpoint hardening, and user awareness. Technicians are the front line of defense against modern ransomware, credential theft, and social engineering attacks.',
        sections: [
          {
            heading: 'Social Engineering Attack Vectors',
            body: [
              'Social engineering targets the human element through psychological manipulation and deception rather than technical vulnerabilities.',
              'Phishing sends fraudulent mass emails imitating trusted institutions to harvest credentials. Spear Phishing targets specific high-value individuals with personalized reconnaissance. Whaling specifically targets C-suite executives (CEOs, CFOs).',
              'Vishing uses phone calls and voice spoofing (e.g. pretending to be the IT Helpdesk). Smishing uses SMS text messages. Tailgating occurs when an unauthorized person follows an authorized employee through a secure badge door.'
            ],
            bulletPoints: [
              'Phishing: Mass deceptive email campaigns.',
              'Spear Phishing: Tailored email targeting a specific organization or employee.',
              'Whaling: Spear phishing targeting executive leadership.',
              'Vishing / Smishing: Voice phone and SMS text attacks.',
              'Shoulder Surfing: Visually spying on passwords or screens in public areas (mitigated with privacy filters).'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Multi-Factor Authentication (MFA)',
              content: 'MFA requires two or more distinct authentication factors: Something you know (password, PIN); Something you have (smart card, authenticator app, FIDO2 token); Something you are (fingerprint, retina biometric); Somewhere you are (GPS geolocation); Something you do (typing rhythm).'
            }
          },
          {
            heading: 'Endpoint Hardening & BitLocker Full-Disk Encryption',
            body: [
              'BitLocker provides hardware-backed full-disk encryption (FDE) using AES-XTS 128 or 256-bit encryption. It relies on the motherboard’s Trusted Platform Module (TPM 2.0) chip to seal the cryptographic encryption keys.',
              'If a stolen laptop drive is removed and plugged into another computer, the drive remains unreadable ciphertext without the TPM key or 48-digit BitLocker Recovery Key.'
            ]
          }
        ],
        technicalTerms: [
          { term: 'MFA', definition: 'Multi-Factor Authentication requiring 2 or more distinct factor categories (Knowledge, Possession, Inherence).' },
          { term: 'BitLocker', definition: 'Native Windows full-disk encryption protecting data at rest using TPM cryptographic binding.' },
          { term: 'Ransomware', definition: 'Malware that encrypts client files and demands cryptocurrency payment for decryption keys.' },
          { term: 'Zero-Day', definition: 'An unpatched software vulnerability unknown to the software vendor with zero days of available fixes.' }
        ],
        keyTakeaways: [
          'MFA must combine different categories (e.g. Password + Authenticator App, not two passwords).',
          'BitLocker stores cryptographic keys in the motherboard TPM 2.0 chip.',
          'WPA3 replaces WPA2 and introduces Simultaneous Authentication of Equals (SAE) to stop offline dictionary attacks.',
          'Privacy screen filters prevent shoulder surfing in high-traffic areas.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'sec-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Defense-in-Depth Architecture',
      subtitle: 'Physical Barriers, Perimeter Firewalls, WPA3, & BitLocker',
      estimatedMinutes: 8,
      diagramId: 'security-perimeter',
      diagramTitle: 'Multi-Layered Enterprise Security Perimeter',
      description: 'Explore the 5 layers of cybersecurity defense from physical campus boundaries down to data-at-rest cryptographic encryption.',
      hotspots: [
        {
          id: 'phys-security',
          x: 20,
          y: 20,
          name: 'Physical Security & Mantrap Vestibule',
          category: 'Physical Layer 1',
          shortDescription: 'RFID badge readers, security guards, mantrap access vestibules, and CCTV cameras.',
          fullSpecs: 'Access control vestibule with interlocking doors preventing tailgating. Kensington cable locks on desks.',
          troubleshootingNote: 'Symptom: Tailgating breach where an unbadged visitor slips through an open door behind an employee.',
          examRelevance: 'CompTIA heavily tests physical controls: mantraps, bollards, biometric locks, and security guards.'
        },
        {
          id: 'nextgen-firewall',
          x: 50,
          y: 20,
          name: 'Next-Generation Firewall & DMZ',
          category: 'Perimeter Defense Layer 2',
          shortDescription: 'Stateful packet inspection, deep packet inspection (DPI), and Demilitarized Zone (DMZ).',
          fullSpecs: 'Isolates public-facing web servers in DMZ from sensitive internal corporate databases.',
          troubleshootingNote: 'Symptom: Inbound brute-force attacks blocked by intrusion prevention system (IPS) automated bans.',
          examRelevance: 'A DMZ hosts public servers so an external compromise does not give access to the internal network.'
        },
        {
          id: 'wpa3-wifi',
          x: 80,
          y: 20,
          name: 'WPA3-Enterprise 802.1X Wireless Security',
          category: 'Network Access Layer 3',
          shortDescription: 'Enterprise wireless encryption backed by RADIUS server authentication.',
          fullSpecs: '192-bit cryptographic suite, individual data encryption, protected management frames (PMF).',
          troubleshootingNote: 'Symptom: Rogue access point (Evil Twin) detected emitting duplicate corporate SSID.',
          examRelevance: 'WPA3 replaces Pre-Shared Keys with SAE (Simultaneous Authentication of Equals) to stop dictionary attacks.'
        },
        {
          id: 'edr-endpoint',
          x: 35,
          y: 70,
          name: 'Endpoint Detection & Response (EDR)',
          category: 'Host Security Layer 4',
          shortDescription: 'Next-gen behavioral antivirus monitoring process execution and memory injection.',
          fullSpecs: 'Monitors PowerShell execution, prevents unapproved script execution, automated isolation of infected nodes.',
          troubleshootingNote: 'Symptom: Immediate automated network quarantine of workstation exhibiting suspicious lateral movement.',
          examRelevance: 'Behavioral analysis detects zero-day malware before signature updates are published.'
        },
        {
          id: 'bitlocker-tpm',
          x: 65,
          y: 70,
          name: 'BitLocker Full-Disk Encryption & TPM 2.0',
          category: 'Data-at-Rest Layer 5',
          shortDescription: 'Hardware-sealed cryptographic storage protection.',
          fullSpecs: 'AES-XTS 256-bit encryption. Sealed to UEFI PCR measurements (detects firmware tampering).',
          troubleshootingNote: 'Symptom: Motherboard replacement prompts for 48-digit BitLocker recovery key.',
          examRelevance: 'Escrow BitLocker recovery keys in Microsoft Entra ID / Active Directory for automated fleet recovery.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the hardware-sealed encryption technology that protects data at rest if a laptop drive is stolen.',
          targetHotspotId: 'bitlocker-tpm',
          hint: 'Look in the lower right for BitLocker full-disk encryption.'
        },
        {
          prompt: 'Locate the physical access control mechanism with interlocking doors that prevents tailgating.',
          targetHotspotId: 'phys-security',
          hint: 'Look in the upper left for the physical security and mantrap vestibule.'
        },
        {
          prompt: 'Identify the isolated network buffer zone where public-facing web servers reside.',
          targetHotspotId: 'nextgen-firewall',
          hint: 'Look in the upper center for the next-gen firewall and DMZ.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'sec-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Hardware Token & Biometric Sensor',
      subtitle: 'FIDO2 Security Key, Capacitive Fingerprint Scanner, & Secure Element',
      estimatedMinutes: 8,
      modelId: 'fido2-token',
      modelTitle: 'FIDO2 USB-C Security Key & Biometric Authenticator',
      description: 'Inspect the physical anatomy of an enterprise FIDO2 cryptographic token. Drag the slider to explode the armored case and inspect the Secure Enclave chip and capacitive biometric sensor.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'token-chassis',
          name: 'Armored Glass-Reinforced Polymer Shell',
          category: 'Tamper-Resistant Casing',
          color: '#1e293b',
          shape: 'box',
          dimensions: [2.5, 0.4, 5.0],
          defaultPosition: [0, 0, 0],
          explodedPosition: [0, -2.5, 0],
          description: 'Hermetically sealed casing designed to physically destroy the silicon chips if chemically or mechanically breached.',
          specs: 'IP68 water/dust resistant, crush-proof, MIL-STD-810G military shock rated.',
          failureSymptoms: 'Physical USB connector deformation from improper angled insertion.'
        },
        {
          id: 'usbc-plug',
          name: 'Gold-Plated USB-C Connector',
          category: 'Hardware Interface',
          color: '#eab308',
          shape: 'box',
          dimensions: [1.4, 0.3, 1.8],
          defaultPosition: [0, 0, 3.2],
          explodedPosition: [0, 0, 5.2],
          description: 'Reversible USB-C interface communicating via HID protocol with zero driver installation required.',
          specs: 'FIDO2 / WebAuthn, U2F, Smart Card (CCID), OpenPGP protocol support.',
          failureSymptoms: 'Dirty gold contacts causing intermittent token recognition in Windows.'
        },
        {
          id: 'secure-element',
          name: 'Tamper-Proof Secure Enclave Microchip',
          category: 'Cryptographic Processor',
          color: '#10b981',
          shape: 'chip',
          dimensions: [1.2, 0.2, 1.2],
          defaultPosition: [0, 0.1, 0.5],
          explodedPosition: [0, 2.0, 0.5],
          description: 'Dedicated cryptographic co-processor storing private asymmetric encryption keys that cannot be extracted.',
          specs: 'Common Criteria EAL 6+ certified, on-chip true random number generator (TRNG), ECDSA P-256 / Ed25519.',
          failureSymptoms: 'Token lockout after 8 consecutive incorrect PIN entry attempts.'
        },
        {
          id: 'biometric-pad',
          name: 'Capacitive Fingerprint Sensor',
          category: 'Biometric Scanner',
          color: '#0284c7',
          shape: 'box',
          dimensions: [1.5, 0.2, 1.5],
          defaultPosition: [0, 0.2, -1.2],
          explodedPosition: [0, 3.2, -1.2],
          description: 'Sub-surface capacitive sensor scanning fingerprint epidermal ridges to unlock cryptographic credentials.',
          specs: 'False Acceptance Rate (FAR) under 0.001%, False Rejection Rate (FRR) under 1%.',
          failureSymptoms: 'Moisture or grease on sensor prevents biometric matching.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'sec-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: TLS 1.3 Asymmetric Handshake',
      subtitle: 'Diffie-Hellman Key Exchange vs Man-in-the-Middle (MitM) Attacks',
      estimatedMinutes: 6,
      animationType: 'tls-handshake',
      description: 'Observe how public-key cryptography allows a client and web server to generate a shared symmetric encryption key across an insecure public Wi-Fi network.',
      steps: [
        {
          stepNumber: 1,
          label: 'CLIENT HELLO & CIPHER SUITES',
          description: 'The browser initiates the connection by sending supported cipher suites (e.g. TLS_AES_256_GCM_SHA384) and a Diffie-Hellman public key share.',
          highlightedElement: 'Client Browser → Server',
          metrics: { label: 'TLS Protocol', value: 'TLS 1.3 (Single RTT)' }
        },
        {
          stepNumber: 2,
          label: 'SERVER HELLO & DIGITAL CERTIFICATE',
          description: 'The server responds with its public key share and presents its X.509 digital certificate signed by a trusted Public Certificate Authority (CA).',
          highlightedElement: 'Server Certificate & Public Key',
          metrics: { label: 'Certificate Status', value: 'VALID & TRUSTED' }
        },
        {
          stepNumber: 3,
          label: 'ASYMMETRIC KEY DERIVATION',
          description: 'Both client and server mathematically combine the public shares to independently compute the identical shared symmetric session key. An eavesdropper cannot derive this key.',
          highlightedElement: 'Ephemeral Diffie-Hellman Calculation',
          metrics: { label: 'Encryption Key', value: '256-Bit Symmetric AES' }
        },
        {
          stepNumber: 4,
          label: 'ENCRYPTED APPLICATION DATA STREAM',
          description: 'All passwords, banking transactions, and credit cards are encrypted end-to-end. Any attacker on the Wi-Fi sees only randomized ciphertext.',
          highlightedElement: 'Encrypted HTTPS Pipeline',
          metrics: { label: 'Payload Security', value: '100% CIPHERTEXT' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'sec-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: BitLocker Encryption & TPM Escrow',
      subtitle: 'Enabling TPM 2.0, Group Policy Configuration, & Key Escrow',
      estimatedMinutes: 8,
      labTitle: 'Enterprise Workstation BitLocker Disk Hardening',
      goal: 'Enable TPM in UEFI firmware, configure BitLocker full-disk encryption on drive C:, and back up the 48-digit recovery key to Microsoft Entra ID.',
      hardwareSubject: 'TPM 2.0 & BitLocker Drive Encryption',
      prerequisites: [
        'Motherboard TPM 2.0 chip active in UEFI',
        'Windows 11 Pro or Enterprise edition',
        'Administrator privileges on workstation'
      ],
      steps: [
        {
          id: 'step-verify-tpm',
          instruction: 'Run "tpm.msc" to verify TPM 2.0 Status is Ready for Use',
          detail: 'Open the Trusted Platform Module Management console and confirm TPM Specification 2.0 is active.',
          actionType: 'check-tpm',
          feedbackOnSuccess: 'TPM 2.0 confirmed active and ready for cryptographic key binding.'
        },
        {
          id: 'step-turn-on-bitlocker',
          instruction: 'Open BitLocker Drive Encryption and select "Turn on BitLocker"',
          detail: 'Initiate the BitLocker setup wizard on system drive C:.',
          actionType: 'init-bitlocker',
          feedbackOnSuccess: 'BitLocker wizard initiated. TPM hardware validation test passed.'
        },
        {
          id: 'step-escrow-key',
          instruction: 'Save 48-digit Recovery Key to Microsoft Cloud Account (Escrow)',
          detail: 'Select "Save to your cloud domain account" so the recovery key is safely stored off-device.',
          actionType: 'escrow-key',
          feedbackOnSuccess: '48-digit recovery key escrowed safely to cloud directory.'
        },
        {
          id: 'step-cipher-mode',
          instruction: 'Select "New encryption mode (XTS-AES 256-bit)" for fixed internal drives',
          detail: 'Choose XTS-AES mode designed specifically for modern high-performance SSD volumes.',
          actionType: 'select-cipher',
          feedbackOnSuccess: 'XTS-AES 256-bit encryption cipher selected.'
        },
        {
          id: 'step-run-check',
          instruction: 'Run BitLocker System Check and start background encryption',
          detail: 'Perform pre-boot authentication test and restart system to encrypt drive sectors in the background.',
          actionType: 'start-encryption',
          feedbackOnSuccess: 'System check successful! C: drive is 100% encrypted with hardware TPM binding.'
        }
      ],
      successMessage: 'BitLocker encryption successfully deployed! Drive C: is sealed with TPM 2.0 and the 48-digit recovery key is escrowed.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'sec-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: Spear Phishing & Malicious Macro',
      subtitle: 'CompTIA Security Incident Response Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Employee Clicked Invoice.docm with Suspicious PowerShell Outbound',
      clientName: 'Chloe Bennett, Accounts Payable Clerk',
      deviceModel: 'Corporate Laptop EliteBook 840',
      initialProblemDescription: 'Chloe states: "I received an urgent email from our vendor with an invoice attachment. When I opened it in Word, it asked me to click Enable Content for macros. Right after I clicked it, my laptop fans started spinning fast, and a command prompt box flashed on the screen for half a second."',
      startStepId: 'step-sec-isolate-host',
      steps: {
        'step-sec-isolate-host': {
          id: 'step-sec-isolate-host',
          title: 'Step 1: Immediate Containment & Incident Response',
          scenarioText: 'Chloe enabled a malicious macro on a corporate laptop. The attacker may be beaconing out to Command & Control (C2) servers. What is your immediate priority?',
          customerStatement: 'Should I shut down the laptop or keep working?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'max-rpm',
            tempReading: '55°C'
          },
          diagnosticOptions: [
            {
              id: 'c-disconnect-network',
              label: 'Immediately disconnect the network cable and disable Wi-Fi (Isolate Host)',
              actionDescription: 'Sever network connectivity to prevent lateral malware spread and data exfiltration while preserving volatile RAM.',
              nextStepId: 'step-sec-inspect-powershell',
              feedback: 'PERFECT FIRST RESPONSE! Isolating the host stops data exfiltration and prevents ransomware from spreading across the corporate network, while keeping the machine powered on preserves volatile RAM artifacts for forensic analysis.'
            },
            {
              id: 'c-ignore-email',
              label: 'Tell Chloe to close Word and continue processing invoices',
              actionDescription: 'Dismiss the security event.',
              isFatal: true,
              feedback: 'CATASTROPHIC FAILURE: Ignoring an active malicious macro allows the attacker to steal domain credentials, install ransomware, and compromise the entire company!'
            }
          ]
        },

        'step-sec-inspect-powershell': {
          id: 'step-sec-inspect-powershell',
          title: 'Step 2: Investigate Active Processes & Persistence',
          scenarioText: 'The laptop is isolated from all networks. You open Task Manager -> Details and PowerShell as Administrator. What do you inspect?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-inspect-powershell-cmd',
              label: 'Inspect running PowerShell processes and scheduled tasks for encoded Base64 commands',
              actionDescription: 'Identify the spawned payload and persistence registry keys.',
              nextStepId: 'step-sec-remediate',
              feedback: 'Spot on! You locate a hidden PowerShell process executing an encoded Base64 command that created a scheduled task in C:\\Users\\Chloe\\AppData\\Local\\Temp.'
            },
            {
              id: 'c-defrag-drive',
              label: 'Run Disk Defragmenter to clean temporary files',
              actionDescription: 'Run defrag.',
              isFatal: true,
              feedback: 'Incorrect: Defragmenting does not remove malware and risks overwriting forensic evidence.'
            }
          ]
        },

        'step-sec-remediate': {
          id: 'step-sec-remediate',
          title: 'Step 3 & 4: Remediate, Reimage, and Reset Credentials',
          scenarioText: 'You have documented the indicators of compromise (IoCs). The laptop attempted to contact a known malicious C2 IP address. How do you fully remediate this threat?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-reimage-and-reset-pwd',
              label: 'Immediately reset Chloe’s Active Directory password & revoke tokens, reimage laptop from clean gold master image, and block the malicious sender domain on the email gateway',
              actionDescription: 'Full corporate eradication: credential reset, clean OS reimage, and perimeter block.',
              isResolved: true,
              feedback: 'OUTSTANDING SECURITY REMEDIATION! You contained the threat with zero network lateral spread. Reimaging guaranteed complete malware eradication, credential resets protected cloud accounts, and gateway rules blocked the phishing campaign company-wide.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'sec-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Core 2 Security Assessment',
      subtitle: 'CompTIA 220-1102 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 2 Security Domain Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'sec-q1',
          question: 'An employee enters a secure datacenter by holding the badge-access door open for another person who does not have an ID badge. What security vulnerability occurred?',
          options: [
            'Phishing',
            'Tailgating (Piggybacking)',
            'Man-in-the-Middle',
            'DDoS attack'
          ],
          correctAnswer: 1,
          explanation: 'Tailgating (or piggybacking) is a physical social engineering breach where an unauthorized individual closely follows an authorized person through a secured door without scanning credentials.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.1'
        },
        {
          id: 'sec-q2',
          question: 'Which of the following represents a valid Multi-Factor Authentication (MFA) combination under CompTIA guidelines?',
          options: [
            'A complex password and a 4-digit PIN',
            'A password (knowledge) and a push notification on a registered smartphone (possession)',
            'Two security questions',
            'A fingerprint scan and a facial recognition scan'
          ],
          correctAnswer: 1,
          explanation: 'True MFA requires two or more DIFFERENT categories of authentication: Something you know (password) + Something you have (smartphone/token). Using two passwords or two biometrics is only single-factor authentication.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.4'
        },
        {
          id: 'sec-q3',
          question: 'Where does BitLocker store its cryptographic master encryption keys on modern enterprise laptops to ensure the drive cannot be read on another machine?',
          options: [
            'In the Windows Registry HKEY_CURRENT_USER hive',
            'On the motherboard TPM 2.0 (Trusted Platform Module) chip',
            'In the C:\\Windows\\Temp folder',
            'On the GPU video memory'
          ],
          correctAnswer: 1,
          explanation: 'BitLocker seals its volume master key in the motherboard’s Trusted Platform Module (TPM 2.0) chip, ensuring the drive can only be decrypted when booted on the authentic, untampered physical host.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.3'
        },
        {
          id: 'sec-q4',
          question: 'A targeted email specifically addressed to the Chief Financial Officer (CFO) requests an urgent wire transfer to a fraudulent vendor bank account. What type of social engineering attack is this?',
          options: [
            'Whaling',
            'Shoulder surfing',
            'Vishing',
            'DDoS'
          ],
          correctAnswer: 0,
          explanation: 'Whaling is a specialized spear-phishing attack specifically targeted at high-profile executive leadership (CEOs, CFOs, board members) to authorize financial transfers or surrender confidential corporate data.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 2.1'
        }
      ]
    }
  ]
};
