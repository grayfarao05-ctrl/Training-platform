import { LessonData } from '../../../types';

export const COMPTIA_A_PLUS_OS_LESSON: LessonData = {
  objectiveId: 'c2d1',
  courseId: 'a-plus',
  title: 'Operating Systems Architecture, CLI Tools & Filesystems',
  domainName: 'Core 2 Domain 1.0: Operating Systems',
  badgeLabel: 'Core 2 (220-1102)',
  summary: 'Master Windows 10/11 operating system architecture, GPT vs MBR partition styles, NTFS permissions, CLI repair commands (sfc, DISM, chkdsk), and registry hives.',
  sections: [
    // 1. TEXT LESSON
    {
      id: 'os-text-1',
      type: 'text',
      title: 'Technical Briefing: Operating System Foundations',
      subtitle: 'Kernel Architecture, GPT vs MBR, & Modern Windows Requirements',
      estimatedMinutes: 6,
      content: {
        lead: 'An operating system manages computer hardware resources and provides common services for application programs. CompTIA A+ Core 2 requires mastery of the Windows internal architecture, filesystem security permissions, command-line repair utilities, and Windows 11 hardware security requirements.',
        sections: [
          {
            heading: 'Disk Partitioning Schemes: GPT vs. MBR',
            body: [
              'Storage drives must be initialized with a partitioning table scheme before formatting filesystems.',
              'Master Boot Record (MBR) is the legacy partition style limited to a maximum disk size of 2 Terabytes (TB) and up to 4 primary partitions. It stores partition data in the first sector (LBA 0).',
              'GUID Partition Table (GPT) is the modern UEFI-mandated standard supporting drives up to 9.4 Zettabytes (ZB) and up to 128 primary partitions in Windows. GPT includes a backup partition table at the end of the disk for automatic self-healing resilience.'
            ],
            bulletPoints: [
              'MBR: Max 2TB drive capacity, max 4 primary partitions, boots legacy BIOS.',
              'GPT: Max 9.4 ZB capacity, 128 partitions, boots modern UEFI with Secure Boot.',
              'Windows 11 Prerequisites: TPM 2.0 (Trusted Platform Module), UEFI with Secure Boot enabled, 64-bit compatible CPU (1GHz dual-core), 4GB RAM, 64GB storage.'
            ],
            callout: {
              type: 'exam-tip',
              title: 'CompTIA Exam Watch: Essential Command Line Tools',
              content: 'Memorize these core repair commands: "sfc /scannow" (System File Checker: scans and replaces corrupted Windows OS files using cached copies); "DISM /Online /Cleanup-Image /RestoreHealth" (repairs the underlying Windows component store using Windows Update); "chkdsk /f /r" (locates bad sectors and recovers readable information).'
            }
          },
          {
            heading: 'Filesystem Comparison: NTFS, FAT32, and exFAT',
            body: [
              'NTFS (New Technology File System) is the default Windows OS filesystem supporting file-level security permissions (ACLs), transparent file compression, BitLocker encryption, disk quotas, and journaling for crash recovery.',
              'FAT32 is universally compatible with Windows, macOS, Linux, and gaming consoles, but is limited to a maximum single file size of 4GB and a partition volume limit of 32GB in native Windows formatting tools.',
              'exFAT (Extended File Allocation Table) was designed by Microsoft for flash memory drives (SD cards, external USB drives), eliminating the 4GB file size limit while retaining cross-platform compatibility without NTFS overhead.'
            ]
          }
        ],
        technicalTerms: [
          { term: 'GPT', definition: 'GUID Partition Table; modern UEFI partition standard supporting drives over 2TB and 128 partitions.' },
          { term: 'NTFS Permissions', definition: 'Access Control Lists (ACLs) governing read, write, modify, and full control rights at the folder and file level.' },
          { term: 'SFC', definition: 'System File Checker (sfc.exe); verifies and repairs the digital integrity of protected Windows system DLLs and EXEs.' },
          { term: 'DISM', definition: 'Deployment Image Servicing and Management; services and repairs the local Windows Component Store (WinSxS).' }
        ],
        keyTakeaways: [
          'Windows 11 strictly requires TPM 2.0, UEFI with Secure Boot, and a 64-bit CPU.',
          'FAT32 has a 4GB maximum file size limit; use exFAT or NTFS for large video files.',
          'Always run DISM /RestoreHealth before sfc /scannow if system corruption is severe.',
          'GPT is required to boot Windows on UEFI systems and drives larger than 2TB.'
        ]
      }
    },

    // 2. INTERACTIVE DIAGRAM
    {
      id: 'os-diag-1',
      type: 'diagram',
      title: 'Interactive Diagram: Windows OS Kernel & Registry',
      subtitle: 'Ring 0 vs Ring 3 Architecture, Registry Hives, & Subsystems',
      estimatedMinutes: 8,
      diagramId: 'os-architecture',
      diagramTitle: 'Windows Internal Operating System Architecture',
      description: 'Explore the separation between User Mode (Ring 3) and Kernel Mode (Ring 0), the Hardware Abstraction Layer (HAL), and the 5 Windows Registry hives.',
      hotspots: [
        {
          id: 'ring0-kernel',
          x: 50,
          y: 75,
          name: 'Kernel Mode (Ring 0) & ntoskrnl.exe',
          category: 'Privileged Execution Space',
          shortDescription: 'Core executive services managing memory, process scheduling, and hardware drivers.',
          fullSpecs: 'Direct unrestricted access to CPU instructions and physical hardware memory spaces. A crash here results in a Blue Screen of Death (BSOD).',
          troubleshootingNote: 'Symptom: Bugcheck Stop Code caused by third-party buggy kernel-mode device drivers.',
          examRelevance: 'CompTIA tests knowing that user-mode application crashes do not bring down the OS, but kernel-mode driver errors cause BSODs.'
        },
        {
          id: 'hal-layer',
          x: 50,
          y: 90,
          name: 'Hardware Abstraction Layer (HAL.dll)',
          category: 'Hardware Interface',
          shortDescription: 'Hides hardware architecture differences between motherboards from the OS kernel.',
          fullSpecs: 'Dynamic link library bridging CPU architecture, APIC timer interrupts, and motherboard chipset communication.',
          troubleshootingNote: 'Symptom: Stop code 0x0000007B (INACCESSIBLE_BOOT_DEVICE) if storage controller HAL driver is missing.',
          examRelevance: 'Allows the same Windows kernel to run on diverse hardware motherboards without re-compilation.'
        },
        {
          id: 'user-mode',
          x: 50,
          y: 35,
          name: 'User Mode (Ring 3) & Win32 Subsystem',
          category: 'Unprivileged User Space',
          shortDescription: 'Isolated sandbox where user applications, web browsers, and services execute safely.',
          fullSpecs: 'No direct hardware access; all I/O must pass through system calls to the executive kernel.',
          troubleshootingNote: 'Symptom: "Application Not Responding" can be terminated in Task Manager without crashing Windows.',
          examRelevance: 'Applications crash cleanly in Ring 3 without damaging system stability.'
        },
        {
          id: 'hklm-hive',
          x: 20,
          y: 18,
          name: 'HKEY_LOCAL_MACHINE (HKLM)',
          category: 'Core Windows Registry Hive',
          shortDescription: 'Contains configuration settings for the local computer hardware, drivers, and installed software.',
          fullSpecs: 'Consists of BCD, HARDWARE, SAM, SECURITY, SOFTWARE, and SYSTEM database files stored in C:\\Windows\\System32\\config.',
          troubleshootingNote: 'Symptom: Corrupted SYSTEM hive prevents Windows from booting into user mode.',
          examRelevance: 'HKLM applies to all users on the machine; HKCU applies only to the currently logged in profile.'
        },
        {
          id: 'hkcu-hive',
          x: 80,
          y: 18,
          name: 'HKEY_CURRENT_USER (HKCU)',
          category: 'User Profile Registry Hive',
          shortDescription: 'Stores personal preferences, desktop wallpaper, mapped network drives, and application settings for the active user.',
          fullSpecs: 'Backed up physically by the NTUSER.DAT file located inside C:\\Users\\<Username>.',
          troubleshootingNote: 'Symptom: Corrupt NTUSER.DAT logs user in with a temporary Windows profile ("You have been logged on with a temporary profile").',
          examRelevance: 'Know that NTUSER.DAT holds user-specific registry configuration.'
        }
      ],
      quizQuestions: [
        {
          prompt: 'Identify the privileged execution tier (Ring 0) where core OS services and kernel drivers execute.',
          targetHotspotId: 'ring0-kernel',
          hint: 'Look in the lower-middle tier for the Kernel Mode space.'
        },
        {
          prompt: 'Locate the primary registry hive that stores machine-wide hardware, software, and driver settings for all users.',
          targetHotspotId: 'hklm-hive',
          hint: 'Look in the upper left for HKEY_LOCAL_MACHINE.'
        },
        {
          prompt: 'Identify the hardware abstraction layer (HAL) that sits directly on top of the physical motherboard hardware.',
          targetHotspotId: 'hal-layer',
          hint: 'Look at the very bottom foundation of the diagram.'
        }
      ]
    },

    // 3. 3D MODEL VIEWER
    {
      id: 'os-3d-1',
      type: '3d-model',
      title: 'Interactive 3D Storage Partition Volume Structure',
      subtitle: 'GPT Disk Layout: ESP, MSR, Windows OS NTFS, & WinRE',
      estimatedMinutes: 8,
      modelId: 'disk-partition-layout',
      modelTitle: 'GPT UEFI Multi-Partition Storage Architecture',
      description: 'Inspect the standardized partition layout of a modern Windows 11 boot SSD. Drag the slider to explode the partition volumes and examine their internal roles.',
      explodedViewAvailable: true,
      parts: [
        {
          id: 'protective-mbr',
          name: 'Protective MBR (LBA 0)',
          category: 'Disk Header',
          color: '#334155',
          shape: 'box',
          dimensions: [1.2, 0.4, 4.0],
          defaultPosition: [-4.2, 0, 0],
          explodedPosition: [-6.5, 0, 0],
          description: 'Single legacy sector at LBA 0 preventing older MBR partition utilities from overwriting the GPT disk.',
          specs: '512 bytes, defines a single partition of type 0xEE spanning the entire disk size.',
          failureSymptoms: 'Older legacy utilities misidentify the disk as unpartitioned free space.'
        },
        {
          id: 'efi-partition',
          name: 'EFI System Partition (ESP - 100MB FAT32)',
          category: 'UEFI Boot Volume',
          color: '#eab308',
          shape: 'box',
          dimensions: [1.8, 0.6, 4.0],
          defaultPosition: [-2.4, 0, 0],
          explodedPosition: [-3.5, 1.2, 0],
          description: 'Special FAT32 partition holding the UEFI bootloaders and firmware device drivers.',
          specs: 'Holds \\EFI\\Microsoft\\Boot\\bootmgfw.efi and the Boot Configuration Data (BCD) store.',
          failureSymptoms: 'Corrupted BCD or missing ESP partition results in "0xc000000f - The Boot Configuration Data is missing".'
        },
        {
          id: 'msr-partition',
          name: 'Microsoft Reserved Partition (MSR - 16MB)',
          category: 'System Reserved',
          color: '#64748b',
          shape: 'box',
          dimensions: [0.8, 0.4, 4.0],
          defaultPosition: [-0.8, 0, 0],
          explodedPosition: [-1.2, -1.2, 0],
          description: 'Reserved hidden partition used by Windows for internal drive management metadata.',
          specs: '16MB size, contains no filesystem, used when converting basic disks to dynamic volumes.',
          failureSymptoms: 'Accidentally deleting MSR can cause BitLocker or dynamic disk operations to fail.'
        },
        {
          id: 'windows-ntfs',
          name: 'Primary Windows OS Volume (C: NTFS)',
          category: 'Main OS & Data Partition',
          color: '#0284c7',
          shape: 'box',
          dimensions: [5.0, 1.2, 4.0],
          defaultPosition: [2.2, 0, 0],
          explodedPosition: [2.8, 2.2, 0],
          description: 'Main partition formatted with NTFS hosting Windows system folders, Program Files, and User profiles.',
          specs: 'NTFS with 4KB cluster sizing, USN Journaling, BitLocker AES-XTS encryption support.',
          failureSymptoms: 'Corrupted filesystem metadata causes Windows to boot into Automatic Startup Repair loop.'
        },
        {
          id: 'winre-partition',
          name: 'Windows Recovery Environment (WinRE - 650MB)',
          category: 'Disaster Recovery Volume',
          color: '#10b981',
          shape: 'box',
          dimensions: [1.4, 0.5, 4.0],
          defaultPosition: [5.6, 0, 0],
          explodedPosition: [7.2, -1.2, 0],
          description: 'Hidden recovery partition containing WinRE.wim for Startup Repair, System Restore, and Safe Mode.',
          specs: 'Boots specialized Windows PE environment with DISM, SFC, and Command Prompt repair tools.',
          failureSymptoms: 'Inability to access Advanced Startup Options when Windows crashes.'
        }
      ]
    },

    // 4. ANIMATED LESSON
    {
      id: 'os-anim-1',
      type: 'animation',
      title: 'Dynamic Demonstration: Windows UEFI Boot Sequence',
      subtitle: 'From Power-On to User Login Screen Execution',
      estimatedMinutes: 6,
      animationType: 'windows-boot',
      description: 'Trace the exact technical handoff sequence that occurs between UEFI motherboard firmware and the Windows 11 kernel during startup.',
      steps: [
        {
          stepNumber: 1,
          label: 'POST & UEFI FIRMWARE INITIALIZATION',
          description: 'UEFI executes Power-On Self-Test (POST), initializes CPU, RAM, and PCIe hardware, and verifies digital Secure Boot signatures.',
          highlightedElement: 'Motherboard UEFI ROM & Secure Boot Keys',
          metrics: { label: 'Firmware Stage', value: 'SEC / PEI / DXE Phase' }
        },
        {
          stepNumber: 2,
          label: 'EFI BOOT MANAGER (bootmgfw.efi)',
          description: 'UEFI reads the Boot Configuration Data (BCD) from the EFI System Partition (ESP) and loads the Windows Boot Manager.',
          highlightedElement: 'ESP Partition → bootmgfw.efi',
          metrics: { label: 'Executed Binary', value: 'bootmgfw.efi' }
        },
        {
          stepNumber: 3,
          label: 'OS LOADER EXECUTION (winload.efi)',
          description: 'The Windows Boot Loader (winload.efi) loads the Hardware Abstraction Layer (HAL.dll), the kernel (ntoskrnl.exe), and BOOT_START hardware device drivers.',
          highlightedElement: 'winload.efi → ntoskrnl.exe',
          metrics: { label: 'Loaded Drivers', value: 'BOOT_START Drivers' }
        },
        {
          stepNumber: 4,
          label: 'KERNEL INITIALIZATION & USER LOGIN',
          description: 'ntoskrnl.exe takes full control of physical memory, starts Session Manager (smss.exe), initializes Win32 (csrss.exe), and displays the user login screen (winlogon.exe).',
          highlightedElement: 'Kernel Mode → winlogon.exe',
          metrics: { label: 'System State', value: 'READY FOR USER LOGIN' }
        }
      ]
    },

    // 5. VIRTUAL LAB
    {
      id: 'os-lab-1',
      type: 'lab',
      title: 'Virtual Practical Lab: Command-Line OS Repair',
      subtitle: 'Executing DISM, SFC Scannow, and Bootrec in Recovery Terminal',
      estimatedMinutes: 8,
      labTitle: 'Windows Recovery Command-Line System Integrity Repair',
      goal: 'Repair a corrupted Windows installation that fails to boot using the Windows Recovery Environment command prompt.',
      hardwareSubject: 'Windows RE Command Prompt & System32',
      prerequisites: [
        'Booted into Windows RE Command Prompt as Administrator',
        'System drive identified as C:',
        'Network access to Windows Update or mounted install ISO'
      ],
      steps: [
        {
          id: 'step-dism',
          instruction: 'Execute DISM to repair the Windows Component Store image',
          detail: 'Run "DISM /Online /Cleanup-Image /RestoreHealth" to download fresh binary copies of damaged Windows component packages.',
          actionType: 'run-dism',
          feedbackOnSuccess: 'DISM 100% complete! The component store corruption was successfully repaired.'
        },
        {
          id: 'step-sfc',
          instruction: 'Execute SFC to scan and repair protected system files',
          detail: 'Run "sfc /scannow" to compare all protected system files against the newly repaired component store and restore corrupted files.',
          actionType: 'run-sfc',
          feedbackOnSuccess: 'Windows Resource Protection found corrupt files and successfully repaired them!'
        },
        {
          id: 'step-chkdsk',
          instruction: 'Execute Check Disk to locate and fix filesystem allocation errors',
          detail: 'Run "chkdsk C: /f" to inspect the Master File Table (MFT) and correct index entry inconsistencies.',
          actionType: 'run-chkdsk',
          feedbackOnSuccess: 'chkdsk verified volume C:. Zero bad clusters and all NTFS file record segments fixed.'
        },
        {
          id: 'step-bootrec',
          instruction: 'Rebuild the Boot Configuration Data store with Bootrec',
          detail: 'Run "bootrec /rebuildbcd" to scan all storage drives for Windows installations and add the OS back to the BCD boot list.',
          actionType: 'run-bootrec',
          feedbackOnSuccess: 'Successfully scanned Windows installations: [1] C:\\Windows. Added to boot configuration.'
        },
        {
          id: 'step-reboot',
          instruction: 'Exit recovery terminal and restart into Windows 11 desktop',
          detail: 'Type "exit" and click Continue to Windows 11.',
          actionType: 'reboot-system',
          feedbackOnSuccess: 'Windows boots cleanly into desktop! Startup repair resolved all system corruptions.'
        }
      ],
      successMessage: 'Command-line system repair complete! You demonstrated the exact professional sequence of DISM, SFC, CHKDSK, and BCD restoration.',
      xpReward: 250
    },

    // 6. SCENARIO TROUBLESHOOTING
    {
      id: 'os-scenario-1',
      type: 'scenario',
      title: 'Troubleshooting Simulation: INACCESSIBLE_BOOT_DEVICE After Update',
      subtitle: 'CompTIA Operating System Crash Diagnostics',
      estimatedMinutes: 8,
      caseTitle: 'Blue Screen 0x0000007B Loop Following Motherboard Firmware Flash',
      clientName: 'Dr. Rebecca Chen, Medical Research Lab',
      deviceModel: 'Precision Workstation T5820',
      initialProblemDescription: 'Dr. Chen states: "Our IT department pushed a mandatory firmware update last night. This morning, whenever the computer starts, the Windows spinning dots freeze, a Blue Screen appears with stop code INACCESSIBLE_BOOT_DEVICE, and it restarts continuously."',
      startStepId: 'step-os-decode-stopcode',
      steps: {
        'step-os-decode-stopcode': {
          id: 'step-os-decode-stopcode',
          title: 'Step 1: Decode Bugcheck Stop Code & Review Recent Changes',
          scenarioText: 'The Blue Screen stop code is INACCESSIBLE_BOOT_DEVICE (Bug Check 0x7B). A firmware BIOS update was performed last night. What does this indicate?',
          customerStatement: 'Everything worked yesterday before the BIOS update was applied.',
          systemState: {
            power: 'post-error',
            screen: 'flickering',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-check-sata-mode',
              label: 'Theory: The BIOS update reset the SATA/NVMe Controller Mode from AHCI/NVMe to RAID (or vice versa)',
              actionDescription: 'Recognize that BIOS flashes frequently reset storage controller mode registers back to factory defaults.',
              nextStepId: 'step-os-bios-sata-fix',
              feedback: 'Brilliant deduction! When a storage controller mode toggles between AHCI and RAID/Intel RST, Windows boots with the wrong storage driver, cannot mount the C: drive, and crashes with INACCESSIBLE_BOOT_DEVICE.'
            },
            {
              id: 'c-wipe-and-reinstall',
              label: 'Reformat the SSD and reinstall Windows from scratch',
              actionDescription: 'Destroy research data and perform clean reinstall.',
              isFatal: true,
              feedback: 'Hazardous / Destructive: Reformatting destroys irreplaceable medical research data and fails to solve the underlying BIOS controller mismatch!'
            }
          ]
        },

        'step-os-bios-sata-fix': {
          id: 'step-os-bios-sata-fix',
          title: 'Step 2 & 3: Test Theory in UEFI Setup',
          scenarioText: 'You enter UEFI BIOS setup and inspect System Configuration -> SATA/NVMe Operation. It is currently set to "RAID On". Windows was originally installed under "AHCI". How do you test your theory?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-toggle-ahci',
              label: 'Change SATA/NVMe Operation from "RAID On" to "AHCI/NVMe", save changes, and reboot',
              actionDescription: 'Restore the exact storage controller mode matching the Windows driver stack.',
              nextStepId: 'step-os-verify-boot',
              feedback: 'Spot on! You switch the controller back to AHCI mode to match the installed Windows AHCI storage driver.'
            },
            {
              id: 'c-overclock-cpu',
              label: 'Increase CPU core voltage to force the drive to detect',
              actionDescription: 'Apply excessive voltage to processor.',
              isFatal: true,
              feedback: 'Hazardous: Voltage adjustments have zero connection to storage controller driver matching.'
            }
          ]
        },

        'step-os-verify-boot': {
          id: 'step-os-verify-boot',
          title: 'Step 4 & 5: Verify Full System Functionality',
          scenarioText: 'The computer reboots. The Windows spinning circle appears. What happens next?',
          systemState: {
            power: 'on',
            screen: 'normal',
            fan: 'normal'
          },
          diagnosticOptions: [
            {
              id: 'c-verify-login',
              label: 'Windows 11 desktop loads in 6 seconds with all medical data intact',
              actionDescription: 'Verify login, confirm stability, and document BIOS storage mode in IT asset management.',
              isResolved: true,
              feedback: 'PERFECT RESOLUTION! The system booted cleanly into Windows with 100% of Dr. Chen’s research files intact. You document the required AHCI setting in the departmental knowledge base.'
            }
          ]
        }
      }
    },

    // 7. KNOWLEDGE CHECK
    {
      id: 'os-quiz-1',
      type: 'quiz',
      title: 'Knowledge Check: Core 2 Operating Systems Assessment',
      subtitle: 'CompTIA 220-1102 Exam Validation',
      estimatedMinutes: 6,
      quizTitle: 'CompTIA A+ Core 2 Operating Systems Mastery Quiz',
      passThresholdPercent: 75,
      xpReward: 300,
      questions: [
        {
          id: 'os-q1',
          question: 'What is the maximum single file size supported by the FAT32 filesystem?',
          options: [
            '2 Gigabytes (GB)',
            '4 Gigabytes (GB)',
            '16 Terabytes (TB)',
            'There is no limit'
          ],
          correctAnswer: 1,
          explanation: 'The FAT32 filesystem has a strict individual file size limitation of 4GB (minus 1 byte). Files larger than 4GB cannot be saved on FAT32 volumes without formatting as NTFS or exFAT.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 1.1'
        },
        {
          id: 'os-q2',
          question: 'Which Windows command-line utility should a technician execute to repair the Windows Component Store image using Windows Update before running System File Checker?',
          options: [
            'chkdsk /f',
            'DISM /Online /Cleanup-Image /RestoreHealth',
            'bootrec /fixboot',
            'netstat -ano'
          ],
          correctAnswer: 1,
          explanation: 'DISM (Deployment Image Servicing and Management) with the /RestoreHealth switch downloads clean system image files to repair the local component store, providing fresh files for SFC to draw upon.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 1.4'
        },
        {
          id: 'os-q3',
          question: 'Which hardware security feature is strictly required on the motherboard to support an official installation of Windows 11?',
          options: [
            'Parallel printer port',
            'TPM 2.0 (Trusted Platform Module) and Secure Boot',
            'VGA video output',
            'Floppy disk controller'
          ],
          correctAnswer: 1,
          explanation: 'Windows 11 requires a compatible 64-bit processor, UEFI firmware with Secure Boot enabled, and TPM 2.0 (Trusted Platform Module) hardware security.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 1.2'
        },
        {
          id: 'os-q4',
          question: 'A user reports that personalized desktop settings, bookmarks, and wallpaper are missing. When logging in, Windows displays: "You have been logged on with a temporary profile." Which file in the user profile directory is corrupted?',
          options: [
            'bootmgr.efi',
            'NTUSER.DAT',
            'pagefile.sys',
            'hal.dll'
          ],
          correctAnswer: 1,
          explanation: 'NTUSER.DAT contains the user-specific registry settings for HKEY_CURRENT_USER. If this file is locked or corrupted, Windows cannot load the user profile and generates a temporary profile.',
          examObjectiveRef: 'CompTIA A+ 220-1102: 1.5'
        }
      ]
    }
  ]
};
