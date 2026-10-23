/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PartId, SCOOTER_PARTS, ASSEMBLY_STEPS } from './types/scooter.ts';
import { ScooterScene, ScreenPartCallout } from './components/3d/ScooterScene.tsx';
import { TopNav } from './components/ui/TopNav.tsx';
import { AssemblyDock } from './components/ui/AssemblyDock.tsx';
import { ReferencePhotoModal } from './components/ui/ReferencePhotoModal.tsx';
import { PartInspectionModal } from './components/ui/PartInspectionModal.tsx';
import {
  playClick,
  playSnap,
  playRatchet,
  playSuccess,
  playCelebration,
  setSoundEnabled,
} from './utils/audio.ts';
import { Trophy } from 'lucide-react';

const ALL_PART_IDS = Object.keys(SCOOTER_PARTS) as PartId[];

export default function App() {
  // Assembly State: Start with chassis grounded in Step 1
  const [assembledParts, setAssembledParts] = useState<Set<PartId>>(
    new Set<PartId>(['frame', 'kickstand'])
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [explodedProgress, setExplodedProgress] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState<PartId | null>(null);
  const [activeConnectionPointId, setActiveConnectionPointId] = useState<string | null>(
    ASSEMBLY_STEPS[0].connectionPoints[0]?.id || null
  );

  // Customization & View States
  const [bodyColor, setBodyColor] = useState('#111215');
  const [bodyFinish, setBodyFinish] = useState<'gloss' | 'matte' | 'metallic'>('gloss');
  const [xrayMode, setXrayMode] = useState(false);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(true);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [callouts, setCallouts] = useState<ScreenPartCallout[]>([]);

  // Smooth Connection Trajectory Animation State
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingPartId, setAnimatingPartId] = useState<PartId | null>(null);
  const [animatingProgress, setAnimatingProgress] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  // Update active connection point when step index changes
  useEffect(() => {
    const step = ASSEMBLY_STEPS[currentStepIndex];
    if (step && step.connectionPoints.length > 0) {
      setActiveConnectionPointId(step.connectionPoints[0].id);
    }
  }, [currentStepIndex]);

  // Sound toggle handler
  const handleToggleSound = useCallback(() => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
  }, [soundActive]);

  // Check for 100% assembly completion
  useEffect(() => {
    if (assembledParts.size === ALL_PART_IDS.length && !showCompletionCelebration) {
      setShowCompletionCelebration(true);
      playCelebration();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if canvas is not attached
      }
    }
  }, [assembledParts.size, showCompletionCelebration]);

  // Toggle single part assembly
  const handleTogglePartAssembly = useCallback((partId: PartId) => {
    setAssembledParts((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  }, []);

  // Animate connection along leader line
  const handleAnimateConnection = useCallback(() => {
    if (isAnimating) return;
    const step = ASSEMBLY_STEPS[currentStepIndex];
    if (!step) return;

    // Find the first unmounted part in this step
    const targetPartId = step.partIds.find((pid) => !assembledParts.has(pid)) || step.partIds[0];
    if (!targetPartId) return;

    setIsAnimating(true);
    setAnimatingPartId(targetPartId);
    setAnimatingProgress(0);
    playRatchet();

    const duration = 750; // ms
    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatingProgress(eased);

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        // Finished: Mount all step parts
        setAssembledParts((prev) => {
          const next = new Set(prev);
          step.partIds.forEach((pid) => next.add(pid));
          return next;
        });
        playSnap();
        playSuccess();
        setIsAnimating(false);
        setAnimatingPartId(null);
        setAnimatingProgress(0);

        // Auto advance to next step after brief delay if not on last step
        if (currentStepIndex < ASSEMBLY_STEPS.length - 1) {
          setTimeout(() => {
            setCurrentStepIndex((cur) => cur + 1);
          }, 450);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(frame);
  }, [currentStepIndex, assembledParts, isAnimating]);

  // Assemble all parts for current active step instantly
  const handleAssembleCurrentStep = useCallback(() => {
    const step = ASSEMBLY_STEPS[currentStepIndex];
    if (!step) return;

    setAssembledParts((prev) => {
      const next = new Set(prev);
      step.partIds.forEach((pid) => next.add(pid));
      return next;
    });

    playSuccess();

    if (currentStepIndex < ASSEMBLY_STEPS.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex((cur) => cur + 1);
      }, 400);
    }
  }, [currentStepIndex]);

  // Disassemble parts for current step
  const handleDisassembleCurrentStep = useCallback(() => {
    const step = ASSEMBLY_STEPS[currentStepIndex];
    if (!step) return;

    setAssembledParts((prev) => {
      const next = new Set(prev);
      step.partIds.forEach((pid) => next.delete(pid));
      return next;
    });
  }, [currentStepIndex]);

  // Snap a part into place from 3D click
  const handleSnapPart = useCallback((partId: PartId) => {
    setAssembledParts((prev) => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });
  }, []);

  // Assemble all at once
  const handleAssembleAll = useCallback(() => {
    setAssembledParts(new Set(ALL_PART_IDS));
    playSuccess();
  }, []);

  // Reset to initial stage
  const handleResetAssembly = useCallback(() => {
    setAssembledParts(new Set<PartId>(['frame', 'kickstand']));
    setCurrentStepIndex(0);
    setExplodedProgress(0);
    setShowCompletionCelebration(false);
  }, []);

  // Keyboard navigation shortcuts (← / → for step navigation, Space for animate connection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'n') {
        setCurrentStepIndex((idx) => Math.min(ASSEMBLY_STEPS.length - 1, idx + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'p') {
        setCurrentStepIndex((idx) => Math.max(0, idx - 1));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAnimateConnection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnimateConnection]);

  return (
    <div className="relative w-screen h-screen bg-[#0e1117] overflow-hidden select-none font-sans text-slate-100">
      {/* 1. Main 3D Interactive Viewport */}
      <div className="absolute inset-0">
        <ScooterScene
          assembledParts={assembledParts}
          selectedPartId={selectedPartId}
          activeConnectionPointId={activeConnectionPointId}
          currentStepIndex={currentStepIndex}
          explodedProgress={explodedProgress}
          bodyColor={bodyColor}
          bodyFinish={bodyFinish}
          xrayMode={xrayMode}
          autoOrbit={autoOrbit}
          animatingPartId={animatingPartId}
          animatingProgress={animatingProgress}
          onSelectPart={setSelectedPartId}
          onSnapPart={handleSnapPart}
          onSelectConnectionPoint={(cpId) => setActiveConnectionPointId(cpId)}
          onUpdateCallouts={setCallouts}
        />
      </div>

      {/* 2. Top Navigation Bar */}
      <TopNav
        assembledCount={assembledParts.size}
        totalPartsCount={ALL_PART_IDS.length}
        currentStepIndex={currentStepIndex}
        totalSteps={ASSEMBLY_STEPS.length}
        xrayMode={xrayMode}
        onToggleXray={() => setXrayMode(!xrayMode)}
        onOpenPhotos={() => setPhotosModalOpen(true)}
        onResetAssembly={handleResetAssembly}
        onAssembleAll={handleAssembleAll}
        activeColor={bodyColor}
        onChangeColor={setBodyColor}
        soundActive={soundActive}
        onToggleSound={handleToggleSound}
      />

      {/* 3. Unified Bottom Assembly & Exploded View Dock */}
      <AssemblyDock
        currentStepIndex={currentStepIndex}
        totalSteps={ASSEMBLY_STEPS.length}
        assembledParts={assembledParts}
        selectedPartId={selectedPartId}
        activeConnectionPointId={activeConnectionPointId}
        explodedProgress={explodedProgress}
        autoOrbit={autoOrbit}
        isAnimating={isAnimating}
        callouts={callouts}
        onChangeStep={setCurrentStepIndex}
        onTogglePartAssembly={handleTogglePartAssembly}
        onAssembleCurrentStep={handleAssembleCurrentStep}
        onDisassembleCurrentStep={handleDisassembleCurrentStep}
        onChangeExploded={setExplodedProgress}
        onToggleAutoOrbit={() => setAutoOrbit(!autoOrbit)}
        onSelectPart={setSelectedPartId}
        onSelectConnectionPoint={(id) => setActiveConnectionPointId(id)}
        onAnimateConnection={handleAnimateConnection}
        onResetExploded={() => setExplodedProgress(0)}
      />

      {/* 4. Part Detail Inspection Modal (when part is clicked or selected) */}
      <PartInspectionModal
        partId={selectedPartId}
        isAssembled={selectedPartId ? assembledParts.has(selectedPartId) : false}
        onClose={() => setSelectedPartId(null)}
        onToggleAssembly={handleTogglePartAssembly}
        onJumpToStep={(stepIdx) => {
          setCurrentStepIndex(stepIdx);
          setSelectedPartId(null);
        }}
      />

      {/* 5. Product Reference Photos Modal */}
      <ReferencePhotoModal
        isOpen={photosModalOpen}
        onClose={() => setPhotosModalOpen(false)}
      />

      {/* 6. Celebratory Banner on 100% Assembly Completion */}
      {showCompletionCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-[#121927] border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-3.5 max-w-md w-[92vw] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">
              Assembly Complete! Ready to Ride!
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              All 17 modular components torqued and connected according to factory specs.
            </p>
          </div>
          <button
            onClick={() => setShowCompletionCelebration(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2334] text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
