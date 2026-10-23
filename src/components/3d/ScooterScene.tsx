/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PartId, SCOOTER_PARTS, ASSEMBLY_STEPS, ConnectionPoint } from '../../types/scooter.ts';
import { createScooterMaterials, ScooterMaterials } from './materials.ts';
import { buildScooterParts, createStepFasteners } from './ScooterGeometryBuilder.ts';
import { playSnap, playRatchet, playClick } from '../../utils/audio.ts';

export interface ScreenPartCallout {
  id: PartId;
  name: string;
  stepNumber: number;
  x: number;
  y: number;
  isAssembled: boolean;
  subPartsCount: number;
}

interface ScooterSceneProps {
  assembledParts: Set<PartId>;
  selectedPartId: PartId | null;
  activeConnectionPointId: string | null;
  currentStepIndex: number;
  explodedProgress: number; // 0 to 1
  bodyColor: string;
  bodyFinish: 'gloss' | 'matte' | 'metallic';
  xrayMode: boolean;
  autoOrbit: boolean;
  animatingPartId: PartId | null;
  animatingProgress: number; // 0 to 1
  onSelectPart: (partId: PartId) => void;
  onSnapPart: (partId: PartId) => void;
  onSelectConnectionPoint?: (cpId: string) => void;
  onUpdateCallouts?: (callouts: ScreenPartCallout[]) => void;
}

export const ScooterScene: React.FC<ScooterSceneProps> = ({
  assembledParts,
  selectedPartId,
  activeConnectionPointId,
  currentStepIndex,
  explodedProgress,
  bodyColor,
  bodyFinish,
  xrayMode,
  autoOrbit,
  animatingPartId,
  animatingProgress,
  onSelectPart,
  onSnapPart,
  onSelectConnectionPoint,
  onUpdateCallouts,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable refs to prevent React state changes from re-instantiating the WebGL context
  const stateRef = useRef({
    assembledParts,
    selectedPartId,
    activeConnectionPointId,
    currentStepIndex,
    explodedProgress,
    bodyColor,
    bodyFinish,
    xrayMode,
    autoOrbit,
    animatingPartId,
    animatingProgress,
  });

  stateRef.current = {
    assembledParts,
    selectedPartId,
    activeConnectionPointId,
    currentStepIndex,
    explodedProgress,
    bodyColor,
    bodyFinish,
    xrayMode,
    autoOrbit,
    animatingPartId,
    animatingProgress,
  };

  const sceneRef = useRef<THREE.Scene | null>(null);
  const partsMapRef = useRef<Record<PartId, THREE.Group> | null>(null);
  const materialsRef = useRef<ScooterMaterials | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const basePositionsRef = useRef<Record<PartId, THREE.Vector3>>({} as Record<PartId, THREE.Vector3>);
  const fastenersGroupRef = useRef<THREE.Group | null>(null);
  const connectionNodesGroupRef = useRef<THREE.Group | null>(null);
  const trajectoryLinesRef = useRef<THREE.LineSegments | null>(null);
  const isSoftwareGlRef = useRef(false);

  // Smooth camera target positions
  const camTargetPos = useRef(new THREE.Vector3(-2.2, 1.2, 1.5));
  const camLookAtPos = useRef(new THREE.Vector3(0, 0.4, 0));

  // Update camera target when step changes
  useEffect(() => {
    const step = ASSEMBLY_STEPS[currentStepIndex];
    if (step) {
      camTargetPos.current.set(...step.cameraPreset.position);
      camLookAtPos.current.set(...step.cameraPreset.target);
    }
  }, [currentStepIndex]);

  // Focus camera when active connection point changes
  useEffect(() => {
    if (activeConnectionPointId) {
      for (const step of ASSEMBLY_STEPS) {
        const cp = step.connectionPoints.find((c) => c.id === activeConnectionPointId);
        if (cp) {
          const [cx, cy, cz] = cp.position;
          camLookAtPos.current.set(cx, cy, cz);
          camTargetPos.current.set(cx - 0.7, cy + 0.4, cz + 0.7);
          break;
        }
      }
    }
  }, [activeConnectionPointId]);

  // Update materials when color or finish changes
  useEffect(() => {
    if (materialsRef.current) {
      materialsRef.current.bodyPaint.color.set(bodyColor);
      materialsRef.current.bodyPaint.roughness = bodyFinish === 'matte' ? 0.6 : 0.18;
      materialsRef.current.bodyPaint.metalness = bodyFinish === 'metallic' ? 0.85 : 0.25;
      materialsRef.current.bodyPaint.clearcoat = bodyFinish === 'gloss' ? 1.0 : 0.0;
      materialsRef.current.bodyPaint.needsUpdate = true;
    }
  }, [bodyColor, bodyFinish]);

  // Update xray mode
  useEffect(() => {
    if (partsMapRef.current && materialsRef.current) {
      const frameGroup = partsMapRef.current.frame;
      if (frameGroup) {
        frameGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = xrayMode ? materialsRef.current!.ghostFrame : (child.userData.origMaterial || materialsRef.current!.frame);
          }
        });
      }
      const batteryGroup = partsMapRef.current.battery;
      if (batteryGroup) {
        const outerBox = batteryGroup.children[0];
        if (outerBox instanceof THREE.Mesh) {
          outerBox.material = xrayMode ? materialsRef.current!.ghostFrame : (outerBox.userData.origMaterial || materialsRef.current!.batteryCase);
        }
      }
    }
  }, [xrayMode]);

  // Main WebGL Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    isSoftwareGlRef.current = isSoftwareGl;

    // 2. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0e1117);
    scene.fog = new THREE.Fog(0x0e1117, 6, 20);

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 40);
    camera.position.set(-2.2, 1.2, 1.5);
    cameraRef.current = camera;

    // 4. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 5. Studio Environment Map (PMREM)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.7;
    controls.maxDistance = 7.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.target.set(0, 0.4, 0);

    let isUserDragging = false;
    controls.addEventListener('start', () => {
      isUserDragging = true;
    });
    controls.addEventListener('end', () => {
      isUserDragging = false;
    });

    // 7. Lighting
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x111122, 1.3);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.0);
    keyLight.position.set(3.5, 4.5, 3.0);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2.2;
      keyLight.shadow.camera.right = 2.2;
      keyLight.shadow.camera.top = 2.2;
      keyLight.shadow.camera.bottom = -2.2;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88bbff, 1.1);
    fillLight.position.set(-3.5, 2.5, -2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.6);
    rimLight.position.set(0, 3.5, -4.0);
    scene.add(rimLight);

    // 8. Ground Floor & Contact Shadow Plane
    const gridHelper = new THREE.GridHelper(12, 36, 0x223040, 0x141a24);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(256, 256, 40, 256, 256, 250);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 1.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, 0.002, 0);
    scene.add(shadowPlane);

    // 9. Build Scooter Parts
    const materials = createScooterMaterials(
      stateRef.current.bodyColor,
      stateRef.current.bodyFinish,
      isSoftwareGl
    );
    materialsRef.current = materials;

    const partsMap = buildScooterParts(materials);
    partsMapRef.current = partsMap;

    const scooterRoot = new THREE.Group();
    scooterRoot.name = 'scooterRoot';
    scene.add(scooterRoot);

    (Object.keys(partsMap) as PartId[]).forEach((id) => {
      const partGroup = partsMap[id]!;
      basePositionsRef.current[id] = partGroup.position.clone();
      scooterRoot.add(partGroup);
    });

    // 10. Hardware Fasteners Kit Group
    const fastenersRoot = new THREE.Group();
    scene.add(fastenersRoot);
    fastenersGroupRef.current = fastenersRoot;

    // 11. Connection Point Visual Markers Group
    const connectionNodesRoot = new THREE.Group();
    connectionNodesRoot.name = 'connectionNodes';
    scene.add(connectionNodesRoot);
    connectionNodesGroupRef.current = connectionNodesRoot;

    // 12. Exploded View Trajectory Leader Lines
    // Allocate LineSegments with dynamic buffer geometry
    const linePositions = new Float32Array(Object.keys(partsMap).length * 6);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.04,
      gapSize: 0.02,
      transparent: true,
      opacity: 0.85,
    });
    const trajectoryLines = new THREE.LineSegments(lineGeom, lineMat);
    trajectoryLines.computeLineDistances();
    scene.add(trajectoryLines);
    trajectoryLinesRef.current = trajectoryLines;

    // 13. Raycasting for Click & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check connection nodes first
      const cpIntersects = raycaster.intersectObjects(connectionNodesRoot.children, true);
      if (cpIntersects.length > 0) {
        let node: THREE.Object3D | null = cpIntersects[0].object;
        while (node && node !== connectionNodesRoot) {
          if (node.userData?.connectionPointId) {
            onSelectConnectionPoint?.(node.userData.connectionPointId);
            playClick();
            return;
          }
          node = node.parent;
        }
      }

      // Check scooter parts
      const intersects = raycaster.intersectObjects(scooterRoot.children, true);
      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        let foundPartId: PartId | null = null;
        while (hitObj && hitObj !== scooterRoot) {
          if (hitObj.userData?.partId) {
            foundPartId = hitObj.userData.partId as PartId;
            break;
          }
          hitObj = hitObj.parent;
        }

        if (foundPartId) {
          onSelectPart(foundPartId);
          if (!stateRef.current.assembledParts.has(foundPartId)) {
            onSnapPart(foundPartId);
            playSnap();
          } else {
            playRatchet();
          }
        }
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);

    // 14. Resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 15. Animation Render Loop with Kinematics & Projection
    let animFrameId = 0;
    const clock = new THREE.Clock();
    let lastCalloutUpdate = 0;

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();
      const {
        assembledParts: curAssembled,
        selectedPartId: curSelected,
        explodedProgress: curExploded,
        autoOrbit: isAutoOrbit,
        animatingPartId: curAnimPart,
        animatingProgress: curAnimProgress,
      } = stateRef.current;

      // Auto Orbit in exploded or overview mode
      if (isAutoOrbit && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 1.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      // Smooth camera position damping towards active preset
      if (!isUserDragging) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetPos.current.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetPos.current.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetPos.current.z, 3.5, delta);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, camLookAtPos.current.x, 3.5, delta);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, camLookAtPos.current.y, 3.5, delta);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, camLookAtPos.current.z, 3.5, delta);
      }

      controls.update();

      // Kinematic interpolation of part positions & trajectory lines update
      const posAttr = trajectoryLines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      let lineIdx = 0;

      const partIds = Object.keys(partsMap) as PartId[];
      partIds.forEach((id) => {
        const group = partsMap[id]!;
        const basePos = basePositionsRef.current[id];
        const partInfo = SCOOTER_PARTS[id];
        if (!basePos || !partInfo) return;

        const isAssembled = curAssembled.has(id);
        const [exX, exY, exZ] = partInfo.explodedOffset;

        let targetX = basePos.x;
        let targetY = basePos.y;
        let targetZ = basePos.z;

        // If part is currently undergoing guided connection animation
        if (curAnimPart === id) {
          // interpolate from detached offset to basePos based on animatingProgress
          const progress = curAnimProgress;
          targetX = basePos.x + exX * 0.9 * (1 - progress);
          targetY = basePos.y + (exY * 0.9 + 0.15) * (1 - progress);
          targetZ = basePos.z + exZ * 0.9 * (1 - progress);
        } else if (curExploded > 0) {
          targetX += exX * curExploded * 1.5;
          targetY += exY * curExploded * 1.5;
          targetZ += exZ * curExploded * 1.5;
        } else if (!isAssembled) {
          targetX += exX * 0.9;
          targetY += exY * 0.9 + 0.15;
          targetZ += exZ * 0.9;
        }

        group.position.x = THREE.MathUtils.damp(group.position.x, targetX, 7.0, delta);
        group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 7.0, delta);
        group.position.z = THREE.MathUtils.damp(group.position.z, targetZ, 7.0, delta);

        // Exploded Trajectory Line updates
        if (curExploded > 0.05 && (exX !== 0 || exY !== 0 || exZ !== 0)) {
          // Point A: Base home position on chassis
          posArray[lineIdx * 6] = basePos.x;
          posArray[lineIdx * 6 + 1] = basePos.y;
          posArray[lineIdx * 6 + 2] = basePos.z;

          // Point B: Current exploded position
          posArray[lineIdx * 6 + 3] = group.position.x;
          posArray[lineIdx * 6 + 4] = group.position.y;
          posArray[lineIdx * 6 + 5] = group.position.z;
        } else {
          // Zero out line segment
          for (let k = 0; k < 6; k++) posArray[lineIdx * 6 + k] = 0;
        }
        lineIdx++;

        // Visual selection/active highlight
        const isSelected = curSelected === id;
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (isSelected) {
              child.material = materials.highlight;
            } else if (child.material === materials.highlight) {
              if (child.userData.partId === 'frame' && stateRef.current.xrayMode) {
                child.material = materials.ghostFrame;
              } else {
                child.material = child.userData.origMaterial || materials.frame;
              }
            }
          }
        });
      });

      posAttr.needsUpdate = true;
      trajectoryLines.computeLineDistances();
      trajectoryLines.visible = curExploded > 0.05;

      // Animate connection nodes (pulsing ring reticles)
      if (connectionNodesRoot.children.length > 0) {
        connectionNodesRoot.children.forEach((node) => {
          const ringMesh = node.getObjectByName('reticleRing');
          if (ringMesh) {
            const scale = 1.0 + Math.sin(elapsedTime * 4.5) * 0.18;
            ringMesh.scale.set(scale, scale, scale);
          }
        });
      }

      // Animate fasteners
      if (fastenersRoot.children.length > 0) {
        fastenersRoot.children.forEach((hw, idx) => {
          hw.rotation.y += delta * 1.4;
          hw.position.y = Math.sin(elapsedTime * 3 + idx) * 0.02;
        });
      }

      // Project 3D Part callout coordinates for 2D UI tags (throttled to ~20fps for performance)
      if (curExploded > 0.25 && onUpdateCallouts && elapsedTime - lastCalloutUpdate > 0.05) {
        lastCalloutUpdate = elapsedTime;
        const rect = renderer.domElement.getBoundingClientRect();
        const callouts: ScreenPartCallout[] = [];
        const v = new THREE.Vector3();

        partIds.forEach((id) => {
          const grp = partsMap[id]!;
          const info = SCOOTER_PARTS[id];
          grp.getWorldPosition(v);
          v.y += 0.12; // elevate slightly above part
          v.project(camera);

          // Check if within view frustum
          if (v.z < 1.0) {
            const x = ((v.x + 1) * rect.width) / 2;
            const y = ((-v.y + 1) * rect.height) / 2;
            callouts.push({
              id,
              name: info.name,
              stepNumber: info.assemblyStep,
              x,
              y,
              isAssembled: curAssembled.has(id),
              subPartsCount: info.subPartsCount,
            });
          }
        });
        onUpdateCallouts(callouts);
      } else if (curExploded <= 0.25 && onUpdateCallouts && lastCalloutUpdate !== 0) {
        lastCalloutUpdate = 0;
        onUpdateCallouts([]);
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    }

    animFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onSelectPart, onSnapPart, onSelectConnectionPoint, onUpdateCallouts]);

  // Update floating fasteners & 3D Connection Point Reticles when step or active connection point changes
  useEffect(() => {
    if (!connectionNodesGroupRef.current || !materialsRef.current) return;
    const nodesRoot = connectionNodesGroupRef.current;

    // Clear existing connection point markers
    while (nodesRoot.children.length > 0) {
      nodesRoot.remove(nodesRoot.children[0]);
    }

    const currentStep = ASSEMBLY_STEPS[currentStepIndex];
    if (currentStep) {
      // Build 3D glowing reticles for every connection point in the active step
      currentStep.connectionPoints.forEach((cp) => {
        const node = new THREE.Group();
        node.name = `cp_node_${cp.id}`;
        node.userData = { connectionPointId: cp.id };
        node.position.set(...cp.position);

        const isActive = cp.id === activeConnectionPointId;

        // Base metallic collar
        const collar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.024, 0.015, 16),
          materialsRef.current!.darkMetal
        );
        collar.userData = { connectionPointId: cp.id };
        node.add(collar);

        // Glowing outer reticle ring
        const ringGeom = new THREE.RingGeometry(0.035, 0.048, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isActive ? 0xffcc00 : 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const reticleRing = new THREE.Mesh(ringGeom, ringMat);
        reticleRing.name = 'reticleRing';
        reticleRing.rotation.x = Math.PI / 2;
        reticleRing.userData = { connectionPointId: cp.id };
        node.add(reticleRing);

        // Alignment direction indicator pin
        const [nx, ny, nz] = cp.normal;
        const normalVec = new THREE.Vector3(nx, ny, nz).normalize();
        const pinGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.08, 8);
        const pinMat = new THREE.MeshStandardMaterial({
          color: isActive ? 0xffea00 : 0x38bdf8,
          emissive: isActive ? 0xffaa00 : 0x0088cc,
          emissiveIntensity: 0.8,
        });
        const pin = new THREE.Mesh(pinGeom, pinMat);
        pin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalVec);
        pin.position.copy(normalVec.clone().multiplyScalar(0.04));
        pin.userData = { connectionPointId: cp.id };
        node.add(pin);

        // Center glowing node sphere
        const centerSphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 12, 12),
          new THREE.MeshBasicMaterial({ color: isActive ? 0xffffff : 0x00ffff })
        );
        centerSphere.userData = { connectionPointId: cp.id };
        node.add(centerSphere);

        nodesRoot.add(node);
      });
    }
  }, [currentStepIndex, activeConnectionPointId]);

  // Update floating fasteners kit
  useEffect(() => {
    if (!fastenersGroupRef.current || !materialsRef.current) return;
    const kitRoot = fastenersGroupRef.current;
    while (kitRoot.children.length > 0) {
      kitRoot.remove(kitRoot.children[0]);
    }

    const currentStep = ASSEMBLY_STEPS[currentStepIndex];
    if (currentStep) {
      const kit = createStepFasteners(currentStep.stepNumber, materialsRef.current);
      const [tx, ty, tz] = currentStep.cameraPreset.target;
      kit.position.set(tx, ty + 0.35, tz);
      kitRoot.add(kit);
    }
  }, [currentStepIndex]);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full select-none cursor-grab active:cursor-grabbing overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
