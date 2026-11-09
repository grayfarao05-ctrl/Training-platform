import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeDViewerSection, Hardware3DPart } from '../../types';
import { 
  RotateCw, 
  Layers, 
  Maximize2, 
  Info, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Sliders, 
  RefreshCw,
  Box,
  Compass,
  Cpu,
  AlertTriangle
} from 'lucide-react';

interface ThreeDViewerProps {
  section: ThreeDViewerSection;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ section }) => {
  const { parts, modelTitle, description, explodedViewAvailable } = section;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || '');
  const [explosionFactor, setExplosionFactor] = useState<number>(0.25);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hiddenParts, setHiddenParts] = useState<Record<string, boolean>>({});

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const outlinesRef = useRef<Map<string, THREE.LineSegments>>(new Map());
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotationRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.8,
    phi: 1.1,
    radius: 14
  });

  const selectedPart = parts.find(p => p.id === selectedPartId) || parts[0];

  // Helper to construct geometry based on part shape with technical CAD proportions
  const createPartGeometry = (part: Hardware3DPart): THREE.BufferGeometry => {
    const [w, h, d] = part.dimensions;
    if (part.id === 'fan-blower' || part.shape === 'fan') {
      return new THREE.CylinderGeometry(w / 2, w / 2, h, 28, 2);
    }
    if (part.id === 'heatpipe' || part.shape === 'heatpipe') {
      return new THREE.CylinderGeometry(0.18, 0.18, w, 20);
    }
    if (part.id === 'battery-pack') {
      return new THREE.BoxGeometry(w, h, d, 4, 1, 2);
    }
    if (part.id === 'drive-bay-25') {
      return new THREE.BoxGeometry(w, h, d, 3, 1, 3);
    }
    if (part.id === 'ram-module' || part.id === 'sodimm-ram') {
      return new THREE.BoxGeometry(w, h, d, 4, 1, 2);
    }
    if (part.id === 'm2-ssd') {
      return new THREE.BoxGeometry(w, h, d, 4, 1, 2);
    }
    if (part.id === 'wifi-nic') {
      return new THREE.BoxGeometry(w, h, d, 2, 1, 2);
    }
    if (part.id === 'keyboard-trackpoint' || part.id === 'keyboard-palmrest') {
      return new THREE.BoxGeometry(w, h, d, 8, 1, 5);
    }
    if (part.id === 'display-clamshell') {
      return new THREE.BoxGeometry(w, h, d, 6, 1, 6);
    }
    if (part.id === 'chassis-bottom') {
      return new THREE.BoxGeometry(w, h, d, 6, 1, 4);
    }
    if (part.id === 'motherboard') {
      return new THREE.BoxGeometry(w, h, d, 6, 1, 5);
    }
    switch (part.shape) {
      case 'cylinder':
        return new THREE.CylinderGeometry(w / 2, w / 2, h, 24);
      case 'board':
      case 'box':
      case 'chip':
      default:
        return new THREE.BoxGeometry(w, h, d, 2, 1, 2);
    }
  };

  // Update camera position from spherical coordinates
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraRotationRef.current;
    
    // Clamp phi to avoid flipping
    const clampedPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    cameraRotationRef.current.phi = clampedPhi;

    const x = radius * Math.sin(clampedPhi) * Math.sin(theta);
    const y = radius * Math.cos(clampedPhi);
    const z = radius * Math.sin(clampedPhi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Update part positions based on explosionFactor
  useEffect(() => {
    parts.forEach(part => {
      const mesh = meshesRef.current.get(part.id);
      const outline = outlinesRef.current.get(part.id);
      if (!mesh) return;

      const [dx, dy, dz] = part.defaultPosition;
      const [ex, ey, ez] = part.explodedPosition;

      // Linear interpolation between default and exploded
      const curX = dx + (ex - dx) * explosionFactor;
      const curY = dy + (ey - dy) * explosionFactor;
      const curZ = dz + (ez - dz) * explosionFactor;

      mesh.position.set(curX, curY, curZ);
      if (outline) {
        outline.position.set(curX, curY, curZ);
      }
    });
  }, [explosionFactor, parts]);

  // Update wireframe mode
  useEffect(() => {
    meshesRef.current.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.wireframe = isWireframe;
      }
    });
  }, [isWireframe]);

  // Update selection highlight with technical CAD blueprint accents
  useEffect(() => {
    parts.forEach(part => {
      const mesh = meshesRef.current.get(part.id);
      const outline = outlinesRef.current.get(part.id);
      if (!mesh) return;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isSelected = part.id === selectedPartId;

      if (isSelected) {
        mat.emissive.setHex(0x06b6d4);
        mat.emissiveIntensity = 0.45;
        mat.opacity = 0.95;
        if (outline) {
          (outline.material as THREE.LineBasicMaterial).color.setHex(0x22d3ee);
          (outline.material as THREE.LineBasicMaterial).opacity = 1.0;
        }
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
        mat.opacity = 0.84;
        if (outline) {
          (outline.material as THREE.LineBasicMaterial).color.setHex(0x64748b);
          (outline.material as THREE.LineBasicMaterial).opacity = 0.65;
        }
      }
    });
  }, [selectedPartId, parts]);

  // Update part visibility (hidden parts)
  useEffect(() => {
    parts.forEach(part => {
      const mesh = meshesRef.current.get(part.id);
      const outline = outlinesRef.current.get(part.id);
      const isHidden = Boolean(hiddenParts[part.id]);
      if (mesh) mesh.visible = !isHidden;
      if (outline) outline.visible = !isHidden && part.id === selectedPartId;
    });
  }, [hiddenParts, parts, selectedPartId]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    sceneRef.current = scene;

    // Grid Floor
    const grid = new THREE.GridHelper(16, 24, 0x1e293b, 0x0f172a);
    grid.position.y = -2.5;
    scene.add(grid);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    keyLight.position.set(10, 15, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x818cf8, 0.8);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, -10, 0);
    scene.add(rimLight);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Build parts
    meshesRef.current.clear();
    outlinesRef.current.clear();

    parts.forEach(part => {
      const geom = createPartGeometry(part);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(part.color),
        roughness: 0.35,
        metalness: 0.35,
        transparent: true,
        opacity: part.id === selectedPartId ? 0.95 : 0.84,
        wireframe: isWireframe
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = part.id;
      mesh.userData = { partId: part.id };

      if (part.rotation) {
        mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2]);
      }

      // Initial positioning with current explosionFactor
      const [dx, dy, dz] = part.defaultPosition;
      const [ex, ey, ez] = part.explodedPosition;
      mesh.position.set(
        dx + (ex - dx) * explosionFactor,
        dy + (ey - dy) * explosionFactor,
        dz + (ez - dz) * explosionFactor
      );

      scene.add(mesh);
      meshesRef.current.set(part.id, mesh);

      // Technical CAD architectural sketch lines on all components
      const edges = new THREE.EdgesGeometry(geom, 25);
      const isSelected = part.id === selectedPartId;
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ 
          color: isSelected ? 0x22d3ee : 0x64748b, 
          linewidth: isSelected ? 2.5 : 1,
          transparent: true,
          opacity: isSelected ? 1 : 0.65
        })
      );
      line.position.copy(mesh.position);
      line.rotation.copy(mesh.rotation);
      line.visible = true;
      scene.add(line);
      outlinesRef.current.set(part.id, line);

      // Authentic architectural details matching CompTIA A+ hardware reference
      if (part.id === 'keyboard-trackpoint' || part.id === 'keyboard-palmrest') {
        // Red rubber TrackPoint analog pointing stick between G, H, B
        const nubGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.22, 16);
        const nubMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          roughness: 0.25,
          emissive: 0xdc2626,
          emissiveIntensity: 0.35
        });
        const nub = new THREE.Mesh(nubGeom, nubMat);
        nub.position.set(0, (part.dimensions[1] / 2) + 0.1, 0.2);
        nub.userData = { partId: part.id };
        mesh.add(nub);
      }

      if (part.id === 'display-clamshell') {
        // Center top webcam lens
        const camGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
        camGeom.rotateX(Math.PI / 2);
        const camMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.7
        });
        const cam = new THREE.Mesh(camGeom, camMat);
        cam.position.set(0, (part.dimensions[1] / 2) + 0.04, -(part.dimensions[2] / 2) + 0.4);
        cam.userData = { partId: part.id };
        mesh.add(cam);

        // Green activity indicator LED
        const ledGeom = new THREE.SphereGeometry(0.04, 8, 8);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
        const led = new THREE.Mesh(ledGeom, ledMat);
        led.position.set(0.28, (part.dimensions[1] / 2) + 0.04, -(part.dimensions[2] / 2) + 0.4);
        mesh.add(led);
      }

      if (part.id === 'wifi-nic') {
        // Main & Aux U.FL coaxial antenna snap connectors (Gold)
        const snapGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
        const snapMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
        const snap1 = new THREE.Mesh(snapGeom, snapMat);
        snap1.position.set(-0.35, 0.12, 0.3);
        snap1.userData = { partId: part.id };
        mesh.add(snap1);

        const snap2 = new THREE.Mesh(snapGeom, snapMat);
        snap2.position.set(0.35, 0.12, 0.3);
        snap2.userData = { partId: part.id };
        mesh.add(snap2);
      }

      if (part.id === 'drive-bay-25') {
        // SATA Data & Power combination connector header (Orange)
        const sataGeom = new THREE.BoxGeometry(0.9, 0.12, 0.25);
        const sataMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
        const sata = new THREE.Mesh(sataGeom, sataMat);
        sata.position.set(0, 0.14, 1.25);
        sata.userData = { partId: part.id };
        mesh.add(sata);
      }

      if (part.id === 'battery-pack') {
        // Multi-pin motherboard power harness
        const harnessGeom = new THREE.BoxGeometry(0.6, 0.15, 0.3);
        const harnessMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
        const harness = new THREE.Mesh(harnessGeom, harnessMat);
        harness.position.set(1.5, 0.15, -1.0);
        harness.userData = { partId: part.id };
        mesh.add(harness);
      }
    });

    // Raycaster for click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.theta -= deltaX * 0.008;
      cameraRotationRef.current.phi -= deltaY * 0.008;

      updateCameraPosition();
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = Math.abs(e.clientX - previousMousePositionRef.current.x);
        const deltaY = Math.abs(e.clientY - previousMousePositionRef.current.y);

        // If mouse barely moved, treat as a click to select 3D part
        if (deltaX < 3 && deltaY < 3 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          if (cameraRef.current) {
            raycaster.setFromCamera(mouse, cameraRef.current);
            const visibleMeshes = Array.from(meshesRef.current.values()).filter(m => m.visible);
            const intersects = raycaster.intersectObjects(visibleMeshes, true);

            if (intersects.length > 0) {
              let hit: THREE.Object3D | null = intersects[0].object;
              while (hit && !hit.userData.partId && hit.parent) {
                hit = hit.parent;
              }
              const hitPartId = hit?.userData?.partId;
              if (hitPartId) {
                setSelectedPartId(hitPartId);
              }
            }
          }
        }
      }
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.005;
      cameraRotationRef.current.radius += e.deltaY * zoomSpeed;
      cameraRotationRef.current.radius = Math.max(5, Math.min(26, cameraRotationRef.current.radius));
      updateCameraPosition();
    };

    // Touch support for mobile/tablets
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;
        cameraRotationRef.current.theta -= deltaX * 0.008;
        cameraRotationRef.current.phi -= deltaY * 0.008;
        updateCameraPosition();
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        cameraRotationRef.current.radius += diff * 0.02;
        cameraRotationRef.current.radius = Math.max(5, Math.min(26, cameraRotationRef.current.radius));
        updateCameraPosition();
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && !isDraggingRef.current) {
        cameraRotationRef.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 500;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      // Clean up geometries & materials
      meshesRef.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      outlinesRef.current.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [parts, updateCameraPosition]);

  const resetView = () => {
    cameraRotationRef.current = { theta: 0.8, phi: 1.1, radius: 14 };
    updateCameraPosition();
    setExplosionFactor(0.25);
  };

  const toggleHidePart = (partId: string) => {
    setHiddenParts(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Box size={12} />
              Interactive 3D Hardware Anatomy
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Three.js WebGL Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight mt-1">
            {modelTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle automated rotation"
          >
            <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} />
            <span>Orbit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWireframe(!isWireframe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isWireframe
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Inspect mesh wireframe topology"
          >
            <Layers size={14} />
            <span>Wireframe</span>
          </button>

          <button
            type="button"
            onClick={resetView}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset camera and explosion"
          >
            <RefreshCw size={14} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Exploded View Slider Bar */}
      {explodedViewAvailable && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-200">
                Hardware Teardown & Exploded View Slider
              </div>
              <div className="text-[11px] text-slate-400">
                Drag to separate chassis layers and inspect internal mounting geometry
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-80">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Assembled</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explosionFactor}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">Exploded</span>
          </div>
        </div>
      )}

      {/* Main Viewport + Specification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Three.js 3D Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col">
          {/* Canvas Viewport */}
          <div 
            ref={containerRef} 
            className="w-full h-[450px] md:h-[520px] cursor-grab active:cursor-grabbing relative"
          />

          {/* Canvas Watermark / Hint */}
          <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <Compass size={14} className="text-cyan-400" />
            <span>Click part to inspect • Drag to rotate • Scroll to zoom</span>
          </div>

          {/* Component Quick List Bar along Bottom */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold px-2 shrink-0">
              Layers:
            </span>
            {parts.map(part => {
              const isSelected = part.id === selectedPartId;
              const isHidden = hiddenParts[part.id];
              return (
                <div key={part.id} className="flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedPartId(part.id)}
                    className={`px-2.5 py-1 rounded-l-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80'
                    }`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: part.color }} 
                    />
                    <span>{part.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHidePart(part.id)}
                    className={`px-1.5 py-1 rounded-r-lg border-l border-slate-900/60 transition-colors ${
                      isSelected
                        ? 'bg-cyan-600 text-slate-950'
                        : isHidden 
                        ? 'bg-rose-950 text-rose-400' 
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                    title={isHidden ? 'Show component' : 'Hide component'}
                  >
                    {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Data Drawer (Right Side) */}
        <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          {selectedPart ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedPart.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    3D Model Node
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mt-2 leading-tight flex items-center gap-2">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0" 
                    style={{ backgroundColor: selectedPart.color }} 
                  />
                  {selectedPart.name}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedPart.description}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" />
                  Hardware Architecture & Specs:
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed">
                  {selectedPart.specs}
                </p>
              </div>

              {/* Failure Symptoms */}
              {selectedPart.failureSymptoms && (
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Field Failure Symptoms:
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    {selectedPart.failureSymptoms}
                  </p>
                </div>
              )}

              {/* CompTIA Exam Tip */}
              {selectedPart.examTip && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    CompTIA Exam Objective Focus:
                  </div>
                  <p className="text-xs text-amber-200 leading-relaxed">
                    {selectedPart.examTip}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Box size={32} className="animate-pulse text-indigo-500/40 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider">
                Select a 3D part to inspect hardware details
              </p>
            </div>
          )}

          {/* Bottom helper tip */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Hardware Model ID: {section.modelId}</span>
            <button
              type="button"
              onClick={() => toggleHidePart(selectedPart.id)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              {hiddenParts[selectedPart.id] ? 'Unhide Component' : 'Isolate Component'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
