import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_VIRTUALIZATION_LESSON: LessonData = {
  objectiveId: '4.1',
  courseId: 'a-plus',
  title: 'Virtualization Architecture & Cloud Computing Models',
  domainName: 'Domain 4.0: Virtualization & Cloud Computing',
  badgeLabel: 'Core 1 (220-1101)',
  summary: 'Master Type 1 bare-metal vs Type 2 hosted hypervisors, vCPU/vRAM resource pooling, virtual switches, IaaS/PaaS/SaaS cloud service tiers, and rapid elasticity.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'virt-text-1',
      type: 'text',
      title: 'Technical Briefing: Hypervisors & Cloud Delivery',
      subtitle: 'Type 1 vs Type 2, Resource Allocation, & Shared Responsibility',
      estimatedMinutes: 6,
      content: {
        lead: 'Virtualization abstracts physical computing hardware from the operating system, allowing multiple isolated virtual machines (VMs) to run concurrently on a single physical host. Cloud computing builds upon this virtualization foundation to provide on-demand, metered computing resources.',
        sections: [
          {
            heading: 'Type 1 (Bare-Metal) vs. Type 2 (Hosted) Hypervisors',
            body: [
              'A hypervisor (or Virtual Machine Monitor - VMM) manages CPU time slices, memory paging, and hardware I/O between the physical hardware and guest operating systems.',
              'Type 1 Hypervisors (Bare-Metal) install directly onto the physical server hardware without any underlying host operating system. Examples include VMware ESXi, Microsoft Hyper-V Server, and Proxmox VE. They provide maximum performance, ultra-low overhead, and enterprise-grade reliability.',
              'Type 2 Hypervisors (Hosted) install as an application inside an existing host operating system (such as Windows, macOS, or Linux). Examples include VMware Workstation, Oracle VirtualBox, and Parallels. They incur an extra virtualization layer penalty but are ideal for desktop software testing and development.'
            ],
            bulletPoints: [
              'Hardware Support: Physical CPU must support virtualization extensions (Intel VT-x or AMD-V) and Second Level Address Translation (SLAT / EPT / NPT) enabled in BIOS/UEFI.',
              'Resource Emulation: Hypervisors allocate Virtual CPUs (vCPUs), Virtual RAM (vRAM), and virtual storage disks (VHD/VMDK).',
              'Virtual Switch (vSwitch): Software Layer 2 switch forwarding packets between VMs and physical network interface cards (NICs).'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Cloud Service Models',
              content: 'Remember the Cloud Pyramid: IaaS (Infrastructure as a Service: you manage OS, middleware, and apps; vendor manages hardware/networking); PaaS (Platform as a Service: you manage app code and data; vendor manages OS and runtime); SaaS (Software as a Service: vendor manages entire application stack e.g. Microsoft 365, Google Workspace).'
            }
          },
          {
            heading: 'Key Characteristics of Cloud Computing (NIST)',
            body: [
              'The National Institute of Standards and Technology (NIST) defines five fundamental cloud characteristics: On-demand self-service, Broad network access, Resource pooling (multi-tenancy), Rapid elasticity (scaling up or down dynamically based on workload), and Measured service (pay-per-use metering).'
            ],
            callout: {
              type: 'definition',
              title: 'Definition: Rapid Elasticity vs Scalability',
              content: 'Rapid Elasticity is the ability of cloud computing systems to automatically scale resource capacity up or down in real-time as traffic demands fluctuate, preventing paying for idle compute.'
            }
          }
        ],
        technicalTerms: [
          { term: 'Hypervisor', definition: 'Software or firmware layer that creates and runs virtual machines.' },
          { term: 'Intel VT-x / AMD-V', definition: 'Hardware-assisted virtualization CPU instruction extensions that must be enabled in UEFI.' },
          { term: 'IaaS', definition: 'Infrastructure as a Service; cloud provider rents raw virtual servers, storage, and networking (e.g. AWS EC2, Azure VMs).' },
          { term: 'SaaS', definition: 'Software as a Service; turnkey software accessed over the web (e.g. Gmail, Salesforce).' }
        ],
        keyTakeaways: [
          'Type 1 runs directly on hardware (bare-metal); Type 2 runs on top of a host OS.',
          'Intel VT-x or AMD-V must be enabled in the BIOS/UEFI firmware to run 64-bit hypervisors.',
          'Cloud service models: IaaS (hardware provided), PaaS (environment provided), SaaS (finished app provided).',
          'Rapid elasticity allows instances to automatically expand or contract based on real-time traffic.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'virt-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Cloud Architecture Stack',
      subtitle: 'Shared Responsibility Model & Virtualization Layers',
      estimatedMinutes: 8,
      diagramId: 'cloud-architecture',
      diagramTitle: 'Multi-Tenant Cloud Virtualization Stack',
      description: 'Explore the shared responsibility boundaries between client management and cloud provider infrastructure across IaaS, PaaS, and SaaS.',
      hotspots: [
        {
          id: 'bare-metal',
          x: 50,
          y: 85,
          name: 'Physical Server Hardware & SAN Storage',
          category: 'Physical Infrastructure',
          shortDescription: 'Enterprise dual-socket servers, ECC RAM, and Storage Area Network (SAN) fiber arrays.',
          fullSpecs: 'Dual Intel Xeon Platinum processors, 1TB ECC DDR5 memory, redundant 100GbE QSFP28 network fabrics.',
          troubleshootingNote: 'Symptom: Physical hardware failure triggers automated high-availability (HA) migration of VMs to healthy nodes.',
          examRelevance: 'In all cloud models (IaaS, PaaS, SaaS), the physical datacenter hardware is 100% managed by the cloud provider.'
        },
        {
          id: 'hypervisor',
          x: 50,
          y: 65,
          name: 'Type 1 Bare-Metal Hypervisor Layer',
          category: 'Virtual Machine Monitor',
          shortDescription: 'Kernel hypervisor scheduling vCPUs, virtual memory pages, and virtual storage LUNs.',
          fullSpecs: 'Microkernel architecture with direct hardware memory management unit (MMU) mapping.',
          troubleshootingNote: 'Symptom: Memory ballooning driver issues causing guest VMs to freeze when host RAM is overcommitted.',
          examRelevance: 'Type 1 hypervisors do NOT run on an OS; they ARE the operating system for the physical server.'
        },
        {
          id: 'vswitch',
          x: 20,
          y: 45,
          name: 'Virtual Distributed Switch (vSwitch)',
          category: 'Virtual Networking',
          shortDescription: 'Software network switch routing traffic between virtual machines and physical trunk NICs.',
          fullSpecs: '802.1Q VLAN tagging, Private VLANs, traffic shaping, distributed port groups.',
          troubleshootingNote: 'Symptom: VM cannot communicate with gateway due to incorrect VLAN tag ID on virtual port group.',
          examRelevance: 'Bridged mode gives VM its own physical subnet IP; NAT mode hides VM behind host IP.'
        },
        {
          id: 'guest-vm',
          x: 75,
          y: 35,
          name: 'Guest Virtual Machines (Windows & Linux)',
          category: 'Virtual Compute Instances',
          shortDescription: 'Isolated operating systems running applications within provisioned vCPU and vRAM boundaries.',
          fullSpecs: 'Independent kernel, virtual disks (VHDX/VMDK), virtual network adapters with unique virtual MACs.',
          troubleshootingNote: 'Symptom: "Blue screen" or OS crash inside VM is completely contained and does not crash the host or other VMs.',
          examRelevance: 'In IaaS, the customer is responsible for guest OS patching, antivirus, and firewall configuration.'
        },
        {
          id: 'saas-tier',
          x: 50,
          y: 15,
          name: 'Software as a Service (SaaS) Applications',
          category: 'End-User Application Tier',
          shortDescription: 'Turnkey cloud services accessed via web browser or mobile client.',
          fullSpecs: 'Multi-tenant database clustering, automated backup, zero client installation required.',
          troubleshootingNote: 'Symptom: User unable to log in due to expired cloud identity or single sign-on (SSO) SAML certificate mismatch.',
          examRelevance: 'Customer only manages user accounts and data; vendor manages 100% of the underlying stack.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the cloud computing layer where turnkey web-based applications require zero client maintenance.',
          targetHotspotId: 'saas-tier',
          hint: 'Look at the top of the stack for consumer-facing cloud software.'
        },
        {
          prompt: 'Locate the bare-metal software engine that directly manages and provisions virtual machines on hardware.',
          targetHotspotId: 'hypervisor',
          hint: 'Look directly above the physical hardware layer for the Type 1 hypervisor.'
        },
        {
          prompt: 'Identify the virtual networking component that routes packets between VMs using VLAN tags.',
          targetHotspotId: 'vswitch',
          hint: 'Look for the virtual switch on the left side of the diagram.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'virt-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Cloud Blade Server Sled',
      subtitle: 'Hot-Swap Sleds, Dual CPU Sockets, & High-Density RAM Banks',
      estimatedMinutes: 8,
      modelId: 'blade-server',
      modelTitle: 'Enterprise Hypervisor Blade Server Node',
      description: 'Examine a hot-swappable enterprise blade server sled designed for high-density hypervisor virtualization. Drag the slider to separate the heat sinks and memory banks.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'blade-sled',
          name: 'Hot-Swap Blade Server Chassis Tray',
          category: 'Server Sled Enclosure',
          color: '#334155',
          shape: 'box',
          dimensions: [9.0, 1.2, 5.0],
          defaultPosition: [0, -0.6, 0],
          explodedPosition: [0, -3.0, 0],
          description: 'Hot-pluggable server node tray that slides into a high-density 10U blade enclosure backplane.',
          specs: 'Blind-mate midplane connectors for power, 100GbE networking, and PCIe fabric interconnects.',
          failureSymptoms: 'Backplane pin damage from forced misaligned insertion into server rack.'
        },
        {
          id: 'cpu-socket-1',
          name: 'Primary CPU & Copper Vapor Chamber',
          category: 'Compute Core 1',
          color: '#d97706',
          shape: 'box',
          dimensions: [2.2, 1.2, 2.2],
          defaultPosition: [-2.2, 0.4, -0.8],
          explodedPosition: [-3.5, 2.2, -1.2],
          description: '64-Core enterprise server processor running high-concurrency virtual machine threads.',
          specs: 'Intel Xeon Scalable / AMD EPYC, 128 virtual execution threads, 256MB L3 cache.',
          failureSymptoms: 'Thermal throttling causing VM scheduling latency spikes across all guest instances.'
        },
        {
          id: 'cpu-socket-2',
          name: 'Secondary CPU & Copper Vapor Chamber',
          category: 'Compute Core 2',
          color: '#d97706',
          shape: 'box',
          dimensions: [2.2, 1.2, 2.2],
          defaultPosition: [2.2, 0.4, -0.8],
          explodedPosition: [3.5, 2.2, -1.2],
          description: 'Second 64-Core processor connected via high-speed UPI / Infinity Fabric inter-socket coherent bus.',
          specs: 'Non-Uniform Memory Access (NUMA) node 1 memory controller.',
          failureSymptoms: 'NUMA memory latency bottlenecks if VM vCPUs span across both physical sockets.'
        },
        {
          id: 'ram-banks',
          name: '16x Registered ECC DDR5 Memory Sockets',
          category: 'System vRAM Pool',
          color: '#10b981',
          shape: 'box',
          dimensions: [7.5, 0.8, 1.5],
          defaultPosition: [0, 0.2, 1.4],
          explodedPosition: [0, 2.5, 2.8],
          description: 'Error-Correcting Code (ECC) multi-channel memory bank pooled for virtual machine allocation.',
          specs: '512GB Total Registered ECC DDR5-4800, detects and corrects multi-bit memory errors in flight.',
          failureSymptoms: 'Uncorrectable ECC memory error triggers automated hypervisor purple-screen crash.'
        },
        {
          id: 'nvme-boot',
          name: 'Dual M.2 NVMe Hypervisor Boot Drive Sled',
          category: 'Hypervisor OS Storage',
          color: '#6366f1',
          shape: 'box',
          dimensions: [1.8, 0.2, 1.0],
          defaultPosition: [-3.2, 0.1, 1.8],
          explodedPosition: [-4.8, 1.4, 2.6],
          description: 'Hardware RAID-1 mirrored solid-state drives holding the bare-metal hypervisor microkernel.',
          specs: '2x 480GB M.2 SATA/NVMe SSDs in hardware mirrored array for 99.999% boot uptime.',
          failureSymptoms: 'Degraded mirror alert in Out-of-Band Management (iDRAC / iLO).'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'virt-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: Type 1 Hypervisor vCPU Scheduling',
      subtitle: 'Physical Core Time-Slicing & Memory Ballooning',
      estimatedMinutes: 6,
      animationType: 'hypervisor-scheduling',
      description: 'Observe how a Type 1 bare-metal hypervisor distributes 8 physical CPU cores among 16 virtual machines using microsecond time-slice scheduling.',
      steps: [
        {
          stepNumber: 1,
          label: 'PHYSICAL HARDWARE POOLING',
          description: 'The hypervisor catalogs all physical CPU cores, NUMA memory nodes, and PCIe virtual functions into a consolidated compute resource pool.',
          highlightedElement: 'Bare-Metal CPU Cores & Memory Pool',
          metrics: { label: 'Physical Cores', value: '16 Cores / 32 Threads' }
        },
        {
          stepNumber: 2,
          label: 'vCPU ALLOCATION & CONCURRENCY',
          description: 'Guest VM 1 requests 4 vCPUs. The hypervisor CPU scheduler assigns physical execution cycles without allowing any single guest to monopolize the bus.',
          highlightedElement: 'Hypervisor CPU Scheduler',
          metrics: { label: 'vCPU to pCPU Ratio', value: '2:1 (Overcommitted)' }
        },
        {
          stepNumber: 3,
          label: 'HARDWARE-ASSISTED SLAT TRANSLATION',
          description: 'When VM 2 writes to virtual memory, the CPU hardware MMU (Extended Page Tables / EPT) maps guest physical addresses to actual host physical addresses with zero software latency.',
          highlightedElement: 'SLAT / EPT Translation Hardware',
          metrics: { label: 'Translation Speed', value: 'Sub-Nanosecond' }
        },
        {
          stepNumber: 4,
          label: 'ISOLATION & HARDWARE FAULT CONTAINMENT',
          description: 'If VM 3 suffers a critical kernel panic or crash, the hypervisor isolates the fault. Physical cores immediately switch execution contexts to healthy VMs with zero disruption.',
          highlightedElement: 'Fault Boundary & VM Containment',
          metrics: { label: 'Host Uptime', value: '100% Unaffected' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'virt-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: VM Provisioning & Network Bridging',
      subtitle: 'Configuring vCPU, Dynamic vRAM, Virtual Hard Disks, & vSwitch',
      estimatedMinutes: 8,
      labTitle: 'Enterprise Virtual Machine Deployment & Hardening',
      goal: 'Provision a production-grade virtual machine on a Type 1 hypervisor, configure dynamic memory, and bridge its virtual NIC to the physical corporate LAN.',
      hardwareSubject: 'Type 1 Hypervisor & Virtual Switch',
      prerequisites: [
        'Hardware-Assisted Virtualization (Intel VT-x) enabled in host UEFI',
        'ISO installation media on shared storage LUN',
        'Virtual Switch connected to corporate trunk port'
      ],
      steps: [
        {
          id: 'step-verify-hw',
          instruction: 'Verify Intel VT-x and SLAT support in host hypervisor console',
          detail: 'Confirm hardware virtualization extensions are enabled and ready to support 64-bit nested workloads.',
          actionType: 'verify-hardware',
          feedbackOnSuccess: 'Hardware virtualization verified! Intel VT-x and EPT are active and operational.'
        },
        {
          id: 'step-alloc-cpu',
          instruction: 'Allocate 4 Virtual CPUs (vCPUs) with core affinity',
          detail: 'Assign 4 virtual processing cores from the physical CPU pool with standard execution priority.',
          actionType: 'allocate-vcpu',
          feedbackOnSuccess: '4 vCPUs provisioned with balanced multi-threading scheduler profiles.'
        },
        {
          id: 'step-alloc-ram',
          instruction: 'Configure 8GB Dynamic Memory with 4GB Startup baseline',
          detail: 'Enable dynamic memory allocation so the hypervisor can reclaim unused vRAM when the guest is idle.',
          actionType: 'configure-vram',
          feedbackOnSuccess: 'Dynamic Memory enabled: 4096 MB startup, scaling dynamically to 8192 MB under load.'
        },
        {
          id: 'step-create-vhd',
          instruction: 'Create 120GB Dynamically Expanding Virtual Hard Disk (VHDX)',
          detail: 'Provision a thin-provisioned virtual disk file on high-speed NVMe storage.',
          actionType: 'create-vhd',
          feedbackOnSuccess: '120GB VHDX disk allocated with thin provisioning to save storage array space.'
        },
        {
          id: 'step-bind-vswitch',
          instruction: 'Attach virtual NIC to Bridged Virtual Switch (VLAN 10)',
          detail: 'Connect the virtual Ethernet adapter to the external vSwitch so the VM receives its own DHCP IP on the corporate subnet.',
          actionType: 'bind-vswitch',
          feedbackOnSuccess: 'Virtual NIC bridged to physical LAN! The VM successfully receives its own IP address and is ready for OS boot.'
        }
      ],
      successMessage: 'Virtual Machine successfully provisioned! You demonstrated proper hypervisor resource allocation, dynamic memory sizing, and bridged virtual switch configuration.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'virt-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: The 64-Bit VM Refusal Mystery',
      subtitle: 'CompTIA Virtualization Troubleshooting',
      estimatedMinutes: 8,
      caseTitle: 'Hypervisor Refuses to Launch 64-Bit Guest Virtual Machines',
      clientName: 'Alex Rivera, Lead Developer',
      deviceModel: 'Workstation ThinkStation P620',
      initialProblemDescription: 'Alex states: "I installed VirtualBox on my new workstation to test our Linux 64-bit server image, but VirtualBox only gives me options for 32-bit operating systems. When I try to start the 64-bit VM, an error dialog displays: VT-x is not available (VERR_VMX_NO_VMX)."',
      startStepId: 'step-virt-check-error',
      steps: {
        'step-virt-check-error': {
          id: 'step-virt-check-error',
          title: 'Step 1: Analyze Error & Hardware Prerequisites',
          scenarioText: 'The error specifically states "VT-x is not available (VERR_VMX_NO_VMX)". What does this error signify in PC hardware architecture?',
          customerStatement: 'This computer has a 16-core modern processor, so I know the hardware supports it.',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-check-bios-vtx',
              label: 'Theory: Intel VT-x / AMD-V is disabled in the motherboard UEFI/BIOS firmware settings',
              actionDescription: 'Recognize that modern processors support virtualization, but OEM motherboards frequently ship with it disabled.',
              nextStepId: 'step-virt-reboot-bios',
              feedback: 'Exact deduction! OEM manufacturers often disable Intel Virtualization Technology (VT-x) or AMD SVM Mode in BIOS by default for security.'
            },
            {
              id: 'c-reinstall-windows',
              label: 'Reinstall Windows 11 using 32-bit architecture',
              actionDescription: 'Downgrade operating system to 32-bit.',
              isFatal: true,
              feedback: 'Fatal error: Modern 64-bit processors and VMs cannot be fixed by installing an obsolete 32-bit OS.'
            }
          ]
        },

        'step-virt-reboot-bios': {
          id: 'step-virt-reboot-bios',
          title: 'Step 2 & 3: Test Theory in Firmware Setup',
          scenarioText: 'You reboot the workstation and press F1/Delete to enter UEFI/BIOS setup. You navigate to the Advanced CPU Configuration tab. What setting do you modify?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-enable-vtx',
              label: 'Change "Intel (VMX) Virtualization Technology" from Disabled to Enabled',
              actionDescription: 'Enable hardware CPU virtualization extensions in firmware.',
              nextStepId: 'step-virt-verify',
              feedback: 'Spot on! You toggle Intel Virtualization Technology to Enabled, save changes, and reboot.'
            },
            {
              id: 'c-disable-hyperthreading',
              label: 'Disable CPU Hyper-Threading to reduce core counts',
              actionDescription: 'Disable multi-threading.',
              isFatal: true,
              feedback: 'Incorrect: Disabling hyperthreading cuts compute performance in half and does NOT enable VT-x.'
            }
          ]
        },

        'step-virt-verify': {
          id: 'step-virt-verify',
          title: 'Step 4 & 5: Verify Full System Functionality',
          scenarioText: 'Windows boots. You open Task Manager -> Performance -> CPU. "Virtualization: Enabled" is now displayed. You launch VirtualBox. What is the outcome?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-launch-vm-success',
              label: 'Launch the 64-bit Linux guest VM and verify smooth multi-core execution',
              actionDescription: 'Verify guest OS boots and client tests development workflow.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The 64-bit Linux server VM boots smoothly. Alex can now run all Docker containers and testing environments. You document the solution in the corporate IT knowledgebase.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'virt-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Domain 4.0 Virtualization Assessment',
      subtitle: 'CompTIA 220-1101 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 1 Virtualization & Cloud Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'virt-q1',
          question: 'What is the primary difference between a Type 1 and a Type 2 hypervisor?',
          options: [
            'Type 1 runs directly on bare-metal hardware without an OS; Type 2 runs on top of a host operating system',
            'Type 1 only supports Linux; Type 2 only supports Windows',
            'Type 1 cannot connect to virtual switches',
            'Type 2 does not require RAM or storage'
          ],
          correctAnswer: 0,
          explanation: 'Type 1 hypervisors (bare-metal) run directly on the physical server hardware. Type 2 hypervisors (hosted) run as an application within an existing host operating system.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 4.1'
        },
        {
          id: 'virt-q2',
          question: 'In which cloud computing service model is the client responsible for managing the guest operating system, runtime libraries, and installed applications while the provider manages physical hardware?',
          options: [
            'SaaS (Software as a Service)',
            'IaaS (Infrastructure as a Service)',
            'PaaS (Platform as a Service)',
            'DaaS (Desktop as a Service)'
          ],
          correctAnswer: 1,
          explanation: 'In Infrastructure as a Service (IaaS), the cloud provider supplies virtualized compute, storage, and networking, while the customer maintains the OS, patches, middleware, and applications.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 4.2'
        },
        {
          id: 'virt-q3',
          question: 'Which CPU firmware feature must be enabled in the BIOS/UEFI settings before a technician can run 64-bit virtual machines?',
          options: [
            'Intel VT-x or AMD-V',
            'S.M.A.R.T. Drive Monitoring',
            'Wake-on-LAN (WoL)',
            'Secure Boot Key Management'
          ],
          correctAnswer: 0,
          explanation: 'Hardware-assisted virtualization extensions (Intel VT-x or AMD-V / SVM) must be enabled in the BIOS/UEFI settings for hypervisors to execute 64-bit guest instructions.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 4.1'
        },
        {
          id: 'virt-q4',
          question: 'An e-commerce business experiences massive web traffic spikes during Black Friday. The cloud infrastructure automatically provisions additional virtual servers to handle the traffic without manual intervention. Which cloud feature is this?',
          options: [
            'Resource pooling',
            'Rapid elasticity',
            'Broad network access',
            'Local storage caching'
          ],
          correctAnswer: 1,
          explanation: 'Rapid elasticity is the cloud capability allowing systems to automatically scale resource capacity up or down on demand in response to real-time workload fluctuations.',
          examObjectiveRef: 'CompTIA A+ 220-1101: 4.2'
        }
      ]
    }
  ]
};
