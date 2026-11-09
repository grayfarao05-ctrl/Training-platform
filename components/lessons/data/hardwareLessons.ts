import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_3_4_LESSON: LessonData = {
  objectiveId: '3.4',
  courseId: 'a-plus',
  title: 'Storage Drives, SSDs & RAID Array Architectures',
  domainName: 'Domain 3.0: Hardware',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Compare mechanical HDDs, SATA SSDs, M.2 PCIe NVMe drives, and master RAID 0, 1, 5, and 10 configurations for speed and fault tolerance.',
  sections: [
    {
      id: 'sec-text-3-4',
      type: 'text',
      title: 'Technical Briefing: Storage Technologies & RAID',
      subtitle: 'Flash NAND, Bus Latency, Redundancy, and Parity Calculations',
      estimatedMinutes: 6,
      content: {
        lead: 'Modern storage architectures span rotating magnetic platters, legacy SATA bus interconnects, and direct PCIe NVMe storage. Understanding speed bottlenecks, drive endurance, and RAID fault tolerance is a cornerstone of CompTIA A+ certification.',
        sections: [
          {
            heading: 'HDD vs. SATA SSD vs. M.2 NVMe PCIe',
            body: [
              'Mechanical Hard Disk Drives (HDDs) use spinning platters (5400 or 7200 RPM) with read/write magnetic heads. They provide low cost-per-gigabyte but suffer from seek-time latency (10-15ms) and mechanical vulnerability to drops.',
              'SATA Solid State Drives (SSDs) use flash NAND chips with zero moving parts, but are throttled by the legacy SATA III controller bus limit of 600 MB/s (6 Gbps).',
              'M.2 NVMe (Non-Volatile Memory Express) SSDs communicate directly over PCIe lanes (Gen 4 x4 reaches 7,500 MB/s; Gen 5 x4 reaches 14,000 MB/s), reducing latency to microseconds and handling over 64,000 command queues.'
            ],
            bulletPoints: [
              'RAID 0 (Striping): Data spread across 2+ drives. Highest read/write speed. ZERO fault tolerance; if one drive fails, ALL data is destroyed.',
              'RAID 1 (Mirroring): Exact replica written to 2 drives. High redundancy; half of total capacity is usable.',
              'RAID 5 (Striping with Parity): Minimum 3 drives. Data and parity blocks striped across all drives. Can survive the loss of 1 drive without data loss.',
              'RAID 10 (1+0 Striped Mirrors): Minimum 4 drives. Combines RAID 0 speed with RAID 1 mirroring. Can survive losing one drive per mirrored pair.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: RAID Drive Requirements',
              content: 'Memorize drive minimums for the exam: RAID 0 = 2 drives (0 fault tolerance). RAID 1 = 2 drives (1 drive failure tolerance). RAID 5 = 3 drives (1 drive failure tolerance). RAID 10 = 4 drives (fault tolerant).'
            }
          }
        ],
        technicalTerms: [
          { term: 'NVMe', definition: 'Non-Volatile Memory Express; high-speed host controller interface designed specifically for solid-state PCIe storage.' },
          { term: 'Parity', definition: 'Mathematical XOR error-checking data used in RAID 5 to reconstruct missing data when a drive fails.' },
          { term: 'Hot-Swappable', definition: 'The ability to replace a storage drive while the computer or server remains powered on and running.' },
          { term: 'IOPS', definition: 'Input/Output Operations Per Second; the standard benchmark metric for storage responsiveness under random read/write workloads.' }
        ],
        keyTakeaways: [
          'NVMe drives utilize PCIe lanes directly, surpassing SATA III 600 MB/s bottlenecks.',
          'RAID 0 provides pure performance with zero fault tolerance.',
          'RAID 5 requires a minimum of 3 drives and can tolerate 1 failed drive using distributed parity.'
        ]
      }
    },
    {
      id: 'sec-diagram-3-4',
      type: 'diagram',
      title: 'Interactive Diagram: Storage Controllers & RAID Topology',
      subtitle: 'Data Striping, Mirroring, and Parity Stripe Distribution',
      estimatedMinutes: 8,
      diagramId: 'laptop-motherboard',
      diagramTitle: 'RAID Array Data Striping & Storage Controller',
      description: 'Click storage nodes to inspect how RAID controllers distribute data blocks and parity bytes across physical drives.',
      hotspots: [
        {
          id: 'raid-ctrl',
          x: 25,
          y: 30,
          name: 'Hardware RAID Controller / HBA',
          category: 'Storage Processor',
          shortDescription: 'Dedicated PCIe card with onboard XOR processor and battery-backed cache.',
          fullSpecs: 'PCIe 4.0 x8 interface, 4GB DDR4 write-back cache, SAS/SATA 12Gbps support.',
          troubleshootingNote: 'Symptom: Write cache disabled and degraded write performance if the backup battery (BBU) fails.',
          examRelevance: 'CompTIA tests hardware RAID (dedicated card with BIOS) vs software RAID (handled by OS CPU).'
        },
        {
          id: 'drive-1',
          x: 55,
          y: 20,
          name: 'Drive 0 (Data Stripe A1, B1, Parity Cp)',
          category: 'RAID Member Disk',
          shortDescription: 'First enterprise SAS/SATA member disk.',
          fullSpecs: '2TB Enterprise 7200 RPM SAS, 128MB cache, 2.5 million hours MTBF.',
          troubleshootingNote: 'Symptom: SMART attribute 05 (Reallocated Sectors Count) increasing indicates imminent platter failure.',
          examRelevance: 'Know that replacing a failed drive triggers automatic volume rebuilding.'
        },
        {
          id: 'drive-2',
          x: 55,
          y: 50,
          name: 'Drive 1 (Data Stripe A2, Parity Bp, Data C1)',
          category: 'RAID Member Disk',
          shortDescription: 'Second enterprise member disk carrying interleaved parity.',
          fullSpecs: '2TB Enterprise SAS, dual-port full-duplex data path.',
          troubleshootingNote: 'Symptom: Amber blinking drive caddy light indicates "Degraded Array" state.',
          examRelevance: 'A degraded RAID 5 volume continues serving files, but performance drops drastically until rebuilt.'
        },
        {
          id: 'drive-3',
          x: 55,
          y: 80,
          name: 'Drive 2 (Parity Ap, Data B2, Data C2)',
          category: 'RAID Member Disk',
          shortDescription: 'Third member disk completing minimum RAID 5 quorum.',
          fullSpecs: '2TB Enterprise SAS member completing 4TB usable capacity.',
          troubleshootingNote: 'Symptom: If a second drive fails during RAID 5 rebuild, the entire volume is permanently destroyed.',
          examRelevance: 'Why RAID 6 (dual parity) is preferred for massive multi-terabyte arrays.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the minimum number of drives required to construct a functional RAID 5 array.',
          targetHotspotId: 'drive-3',
          hint: 'RAID 5 requires at least 3 drives to distribute data and parity.'
        },
        {
          prompt: 'Select the component responsible for processing XOR parity calculations without burdening the system CPU.',
          targetHotspotId: 'raid-ctrl',
          hint: 'Look for the dedicated hardware RAID controller card.'
        }
      ]
    },
    {
      id: 'sec-3d-3-4',
      type: '3d-model',
      title: 'Interactive 3D Hardware: 3.5" Enterprise HDD Platter & Head Teardown',
      subtitle: 'Spindle Motor, Voice Coil Actuator, & Magnetic Read/Write Heads',
      estimatedMinutes: 8,
      modelId: 'laptop-teardown',
      modelTitle: '3D Mechanical Hard Drive Anatomy',
      description: 'Explore the internal mechanical components of a spinning platter magnetic storage drive.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'drive-top-cover',
          name: 'Cast Aluminum Sealed Top Cover',
          category: 'Enclosure',
          color: '#475569',
          shape: 'box',
          dimensions: [7, 0.2, 5],
          defaultPosition: [0, 1.2, 0],
          explodedPosition: [0, 3.5, 0],
          description: 'Airtight enclosure lid with breather hole filter to balance internal atmospheric pressure.',
          specs: 'Secured with Torx T8 screws. Opening outside a Class 100 cleanroom destroys the drive via dust.',
          failureSymptoms: 'Punctured breather filter causing dust contamination on platters.'
        },
        {
          id: 'platters',
          name: 'Ferromagnetic Glass Platters',
          category: 'Magnetic Media',
          color: '#38bdf8',
          shape: 'cylinder',
          dimensions: [4, 0.4, 4],
          defaultPosition: [-1.2, 0.3, 0],
          explodedPosition: [-1.2, 1.6, 0],
          description: 'Spindle-mounted glass-ceramic disks coated with a microscopic magnetic recording layer.',
          specs: 'Spins at 7,200 RPM (or 10,000/15,000 RPM enterprise). Track pitch is under 50 nanometers.',
          failureSymptoms: 'Head crash: Read/write head touches platter surface, scraping away magnetic coating and data.'
        },
        {
          id: 'voice-coil',
          name: 'Voice Coil Actuator & Rare-Earth Magnets',
          category: 'Electromagnetic Positioning',
          color: '#f59e0b',
          shape: 'box',
          dimensions: [2.5, 0.6, 2],
          defaultPosition: [1.8, 0.3, 0],
          explodedPosition: [3.2, 1.6, 0],
          description: 'Neodymium permanent magnets and copper voice coil swinging the read/write heads rapidly across tracks.',
          specs: 'Moves heads from track to track in under 4 milliseconds.',
          failureSymptoms: '"Click of death" - head repeatedly slams against physical limiter when unable to find servo tracks.'
        },
        {
          id: 'pcb-board',
          name: 'Drive Logic Controller PCB',
          category: 'Electronic Control',
          color: '#065f46',
          shape: 'board',
          dimensions: [6.8, 0.15, 4.8],
          defaultPosition: [0, -0.6, 0],
          explodedPosition: [0, -2.2, 0],
          description: 'Printed circuit board mounted to the drive underside hosting the motor controller and SATA interface.',
          specs: 'SATA III 6 Gbps, 256MB DRAM cache, motor spindle driver IC.',
          failureSymptoms: 'Blown TVS protective diode from PSU power surge; drive does not spin up at all.'
        }
      ]
    },
    {
      id: 'sec-anim-3-4',
      type: 'animation',
      title: 'Dynamic Demonstration: RAID 5 Distributed Parity Striping',
      subtitle: 'XOR Math & Single-Drive Reconstruction',
      estimatedMinutes: 5,
      animationType: 'bus-speed-pcie',
      description: 'See how RAID 5 distributes data blocks and parity across disks, allowing instant reconstruction when a disk fails.',
      steps: [
        {
          stepNumber: 1,
          label: 'Writing Data Stripe Block A',
          description: 'Block A1 is written to Disk 1, Block A2 is written to Disk 2, and Parity Block Ap (A1 XOR A2) is written to Disk 3.',
          highlightedElement: 'Stripe A Distribution (Disks 1, 2, 3)',
          metrics: { label: 'Stripe', value: 'Block A' }
        },
        {
          stepNumber: 2,
          label: 'Interleaving Parity Stripe Block B',
          description: 'To avoid a bottleneck on one disk, Parity Block Bp shifts to Disk 2, while Block B1 writes to Disk 1 and B2 writes to Disk 3.',
          highlightedElement: 'Distributed Parity Rotation',
          metrics: { label: 'Parity Location', value: 'Disk 2' }
        },
        {
          stepNumber: 3,
          label: 'Disk 2 Catastrophic Failure',
          description: 'Disk 2 suffers motor failure and goes offline. The volume enters DEGRADED mode. Files remain readable using Disk 1 and Disk 3 parity.',
          highlightedElement: 'Degraded Array State',
          metrics: { label: 'Status', value: 'DEGRADED' }
        },
        {
          stepNumber: 4,
          label: 'Rebuilding onto Replacement Drive',
          description: 'A new drive is inserted. The RAID controller calculates missing data: (A2 = A1 XOR Ap) and reconstructs Disk 2 without downtime.',
          highlightedElement: 'XOR Data Reconstruction',
          metrics: { label: 'Array Health', value: 'OPTIMAL' }
        }
      ]
    },
    {
      id: 'sec-lab-3-4',
      type: 'lab',
      title: 'Virtual Practical Lab: M.2 NVMe SSD Installation & RAID Setup',
      subtitle: 'Physical Standoff, Thermal Pad & BIOS RAID Mode',
      estimatedMinutes: 8,
      labTitle: 'PCIe NVMe Drive Installation & Array Configuration',
      goal: 'Install an M.2 2280 NVMe SSD with heatsink pad and configure dual drives into a RAID 1 mirrored volume.',
      hardwareSubject: 'M.2 PCIe Gen 4 x4 Slot',
      prerequisites: [
        'Anti-static ESD wrist strap attached',
        'M2 standoff screw & magnetic #0 screwdriver',
        'Thermal conduction silicone pad'
      ],
      steps: [
        {
          id: 's-step-1',
          instruction: 'De-energize System & Discharge Capacitors',
          detail: 'Switch off PSU rocker switch and press case power button for 5 seconds to drain motherboard capacitors.',
          actionType: 'disconnect-battery',
          feedbackOnSuccess: 'Motherboard completely discharged. Safe for PCIe expansion.'
        },
        {
          id: 's-step-2',
          instruction: 'Remove Motherboard M.2 Thermal Shield',
          detail: 'Unscrew the integrated aluminum motherboard heatsink covering the primary M.2 slot.',
          actionType: 'remove-screw',
          feedbackOnSuccess: 'M.2 thermal shield removed. Slot exposed.'
        },
        {
          id: 's-step-3',
          instruction: 'Insert M.2 2280 NVMe SSD at 30° Angle',
          detail: 'Align the M-key notch and slide the drive into the slot until fully seated at a 30-degree incline.',
          actionType: 'insert-ram',
          feedbackOnSuccess: 'Drive pins seated. Drive rests on standoff.'
        },
        {
          id: 's-step-4',
          instruction: 'Fasten Standoff Screw & Apply Thermal Pad',
          detail: 'Fasten the M2 screw to hold the drive horizontal and replace the thermal shield to prevent thermal throttling.',
          actionType: 'lock-clips',
          feedbackOnSuccess: 'Drive secured and thermal pad compressed. Thermal dissipation active.'
        },
        {
          id: 's-step-5',
          instruction: 'Enter UEFI Setup and Configure RAID 1 Mirror',
          detail: 'Boot to UEFI firmware, set SATA/PCIe mode to RAID, and create a 2-disk Mirroring array.',
          actionType: 'verify-post',
          feedbackOnSuccess: 'RAID 1 array initialized! Dual drives are now fully redundant and bootable.'
        }
      ],
      successMessage: 'Outstanding installation! You configured the M.2 NVMe drive and verified RAID redundancy.',
      xpReward: 250
    },
    {
      id: 'sec-scenario-3-4',
      type: 'scenario',
      title: 'Troubleshooting Simulation: RAID 5 Degraded Volume Alert',
      subtitle: 'CompTIA Storage Diagnostics Methodology',
      estimatedMinutes: 8,
      caseTitle: 'Accounting Server Degraded RAID Alert',
      clientName: 'Financial Department Database Server',
      deviceModel: 'PowerEdge R750 Rack Server',
      initialProblemDescription: 'The enterprise monitoring console generates a Critical Alert: "Virtual Disk 0 (RAID 5, 4 Disks) Status: DEGRADED. Physical Disk 0:2 Failed (Offline)". The server is currently hosting active payroll databases.',
      startStepId: 'step-raid-triage',
      steps: {
        'step-raid-triage': {
          id: 'step-raid-triage',
          title: 'Step 1: Evaluate Array Status & Business Impact',
          scenarioText: 'The RAID 5 volume is degraded. Users are still entering payroll. What is your immediate diagnostic step?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'max-rpm',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-verify-backup-hot-swap',
              label: 'Verify recent system backup exists, then hot-swap the failed Disk 0:2 with a matched spare',
              actionDescription: 'Safely replace the failed disk while server is online, relying on hot-swap backplane.',
              nextStepId: 'step-rebuild-verify',
              feedback: 'Best practice! In a hot-swappable server, RAID 5 allows replacing the dead drive while live. Verifying the backup first protects against a second drive failing during the rebuild stress.'
            },
            {
              id: 'c-pull-power',
              label: 'Instantly yank the main server power cables to prevent data corruption',
              actionDescription: 'Hard kill the power immediately.',
              isFatal: true,
              feedback: 'Disastrous! Hard powering off an active database causes uncommitted write transactions to corrupt the database files.'
            }
          ]
        },
        'step-rebuild-verify': {
          id: 'step-rebuild-verify',
          title: 'Step 2: Monitor Array Rebuilding',
          scenarioText: 'You slide in the replacement drive. The drive status LED blinks green rapidly indicating active XOR reconstruction. How do you finish the incident?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal',
            tempReading: 'Normal'
          },
          diagnosticOptions: [
            {
              id: 'c-confirm-optimal',
              label: 'Monitor controller rebuild to 100%, verify volume status returns to "Optimal", and log the failed disk serial number',
              actionDescription: 'Complete documentation and verify array health.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The rebuild finishes successfully. The RAID 5 volume is back to full fault tolerance, and the hardware RMA ticket is closed.'
            }
          ]
        }
      }
    },
    {
      id: 'sec-quiz-3-4',
      type: 'quiz',
      title: 'Knowledge Check: Storage Technologies & RAID',
      subtitle: 'CompTIA 220-1101 Domain 3.0 Exam Drill',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Objective 3.4 Knowledge Check',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'q-3-4-1',
          question: 'Which of the following RAID levels provides maximum read/write performance by striping data across drives, but provides ZERO fault tolerance if a single disk fails?',
          options: [
            'RAID 0',
            'RAID 1',
            'RAID 5',
            'RAID 10'
          ],
          correctAnswer: 0,
          explanation: 'RAID 0 stripes data across two or more drives without parity or mirroring. If any drive in a RAID 0 array fails, all data on the volume is lost.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'q-3-4-2',
          question: 'What is the minimum number of physical drives required to configure a functional RAID 5 array with distributed parity?',
          options: [
            '1 drive',
            '2 drives',
            '3 drives',
            '4 drives'
          ],
          correctAnswer: 2,
          explanation: 'RAID 5 requires a minimum of 3 drives to distribute both data and XOR parity across the array.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'q-3-4-3',
          question: 'Why do M.2 NVMe SSDs provide significantly faster sequential and random throughput compared to traditional SATA III 2.5" SSDs?',
          options: [
            'NVMe drives communicate directly across PCIe bus lanes instead of the 600 MB/s SATA controller',
            'NVMe drives contain rotating platters spinning at 15,000 RPM',
            'NVMe drives do not require electrical power',
            'NVMe drives can only store plain text'
          ],
          correctAnswer: 0,
          explanation: 'NVMe SSDs connect directly over high-speed PCIe lanes (bypassing the SATA III 600 MB/s bus bottleneck), delivering multiple gigabytes per second and thousands of command queues.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        },
        {
          id: 'q-3-4-4',
          question: 'A technician receives a predictive failure warning on a server hard drive: "S.M.A.R.T. Threshold Exceeded: Reallocated Sector Count". What does this alert indicate?',
          options: [
            'The drive firmware was updated successfully',
            'The drive is experiencing physical sector damage and is likely to fail soon',
            'The SATA cable is plugged in backwards',
            'The drive needs to be formatted with FAT32'
          ],
          correctAnswer: 1,
          explanation: 'Self-Monitoring, Analysis and Reporting Technology (S.M.A.R.T.) monitors internal drive health. An increasing reallocated sector count means the drive is remapping damaged magnetic sectors to spare sectors, indicating imminent physical drive death.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 3.4'
        }
      ]
    }
  ]
};
