/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  Sliders,
  ListFilter,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PartId, SCOOTER_PARTS, ASSEMBLY_STEPS } from '../../types/scooter.ts';
import { playClick, playSnap } from '../../utils/audio.ts';
import { InteractiveGuidePanel } from './InteractiveGuidePanel.tsx';
import { ExplodedViewOverlay } from './ExplodedViewOverlay.tsx';
import { ScreenPartCallout } from '../3d/ScooterScene.tsx';

interface AssemblyDockProps {
  currentStepIndex: number;
  totalSteps: number;
  assembledParts: Set<PartId>;
  selectedPartId: PartId | null;
  activeConnectionPointId: string | null;
  explodedProgress: number;
  autoOrbit: boolean;
  isAnimating: boolean;
  callouts: ScreenPartCallout[];
  onChangeStep: (index: number) => void;
  onTogglePartAssembly: (partId: PartId) => void;
  onAssembleCurrentStep: () => void;
  onDisassembleCurrentStep: () => void;
  onChangeExploded: (val: number) => void;
  onToggleAutoOrbit: () => void;
  onSelectPart: (partId: PartId) => void;
  onSelectConnectionPoint: (id: string) => void;
  onAnimateConnection: () => void;
  onResetExploded: () => void;
}

type TabType = 'step' | 'explode' | 'parts';

export const AssemblyDock: React.FC<AssemblyDockProps> = ({
  currentStepIndex,
  totalSteps,
  assembledParts,
  selectedPartId,
  activeConnectionPointId,
  explodedProgress,
  autoOrbit,
  isAnimating,
  callouts,
  onChangeStep,
  onTogglePartAssembly,
  onAssembleCurrentStep,
  onDisassembleCurrentStep,
  onChangeExploded,
  onToggleAutoOrbit,
  onSelectPart,
  onSelectConnectionPoint,
  onAnimateConnection,
  onResetExploded,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('step');
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* 3D Floating Bill of Materials Callout Badges (only when in explode mode) */}
      <ExplodedViewOverlay
        callouts={callouts}
        explodedProgress={explodedProgress}
        autoOrbit={autoOrbit}
        selectedPartId={selectedPartId}
        onToggleAutoOrbit={onToggleAutoOrbit}
        onChangeExploded={onChangeExploded}
        onSelectPart={onSelectPart}
      />

      <div
        className="fixed z-30 transition-transform duration-300 pointer-events-auto"
        style={{
          bottom: '16px',
          left: '50%',
          transform: `translateX(-50%) ${isCollapsed ? 'translateY(calc(100% - 38px))' : 'translateY(0)'}`,
          width: 'min(940px, 95vw)',
        }}
      >
        {/* Collapse / Expand Tab Bar Button */}
        <div className="flex justify-center -mb-[1px]">
          <button
            onClick={() => {
              playClick();
              setIsCollapsed(!isCollapsed);
            }}
            className="bg-[#131720] hover:bg-[#1c2230] text-slate-300 hover:text-white border border-[#252f3f] border-b-0 rounded-t-lg px-4 py-1 text-xs font-medium flex items-center gap-1.5 shadow-lg transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Show Assembly Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Hide Controls (Zen Mode)</span>
              </>
            )}
          </button>
        </div>

        {/* Main Solid Dock Card */}
        <div className="bg-[#131720] border border-[#252f3f] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
          {/* Navigation Tabs Header */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-[#1f2838] bg-[#0e121a]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  playClick();
                  setActiveTab('step');
                  if (explodedProgress > 0) onChangeExploded(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'step'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#181f2c]'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Interactive Assembly Guide</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setActiveTab('explode');
                  if (explodedProgress === 0) onChangeExploded(0.5);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'explode'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#181f2c]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>3D Exploded View</span>
                {explodedProgress > 0 && (
                  <span className="text-[10px] bg-blue-500/40 text-blue-200 px-1.5 py-0.2 rounded-full">
                    {Math.round(explodedProgress * 100)}%
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  playClick();
                  setActiveTab('parts');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'parts'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#181f2c]'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>All 17 Parts</span>
              </button>
            </div>

            {/* Step Pill Indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {ASSEMBLY_STEPS.map((st, idx) => {
                const isDone = st.partIds.every((pid) => assembledParts.has(pid));
                const isCurrent = idx === currentStepIndex;
                return (
                  <button
                    key={st.stepNumber}
                    onClick={() => {
                      playClick();
                      onChangeStep(idx);
                      if (activeTab !== 'step') setActiveTab('step');
                    }}
                    title={st.title}
                    className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 ring-1 ring-white/50'
                        : isDone
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
                        : 'bg-[#1b2230] text-slate-400 hover:bg-[#232c3e]'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : st.stepNumber}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-3 sm:p-4 max-h-[300px] overflow-y-auto">
            {/* TAB 1: STEP-BY-STEP INTERACTIVE GUIDE */}
            {activeTab === 'step' && (
              <InteractiveGuidePanel
                currentStepIndex={currentStepIndex}
                totalSteps={totalSteps}
                assembledParts={assembledParts}
                activeConnectionPointId={activeConnectionPointId}
                isAnimating={isAnimating}
                onSelectConnectionPoint={onSelectConnectionPoint}
                onAnimateConnection={onAnimateConnection}
                onTogglePartAssembly={onTogglePartAssembly}
                onAssembleCurrentStep={onAssembleCurrentStep}
                onDisassembleCurrentStep={onDisassembleCurrentStep}
                onChangeStep={onChangeStep}
                onSelectPart={onSelectPart}
              />
            )}

            {/* TAB 2: EXPLODED VIEW CONTROLS */}
            {activeTab === 'explode' && (
              <div className="py-1">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>Explosion Separation Distance</span>
                      </span>
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        {Math.round(explodedProgress * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={explodedProgress}
                      onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 h-2 bg-[#20293a] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Preset buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {[0, 0.35, 0.7, 1.0].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          playClick();
                          onChangeExploded(preset);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          Math.abs(explodedProgress - preset) < 0.05
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#1b2332] text-slate-300 hover:bg-[#242f44]'
                        }`}
                      >
                        {preset === 0 ? 'Assembled' : `${Math.round(preset * 100)}%`}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        playClick();
                        onToggleAutoOrbit();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        autoOrbit
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#1b2332] text-slate-300 hover:bg-[#242f44]'
                      }`}
                    >
                      <span>360° Turntable</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#121722] border border-[#212b3c] rounded-xl p-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 mb-1 text-cyan-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Modular Exploded View Diagram</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Blue dashed trajectory leader lines indicate the mechanical insertion axis for each component into the chassis. Hover or click on the floating 3D callout badges above the model to inspect each part’s weight, torque spec, and assembly step.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: ALL 15 PARTS CATALOG */}
            {activeTab === 'parts' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {Object.values(SCOOTER_PARTS).map((part) => {
                  const isAssembled = assembledParts.has(part.id);
                  const isSelected = selectedPartId === part.id;
                  return (
                    <div
                      key={part.id}
                      onClick={() => {
                        playClick();
                        onSelectPart(part.id);
                      }}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                          : isAssembled
                          ? 'bg-[#171f2b] border-[#253245] hover:bg-[#1d2737]'
                          : 'bg-[#141822] border-slate-800 text-slate-400 hover:bg-[#1b2130]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {part.category}
                        </span>
                        {isAssembled ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Mounted" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Detached" />
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {part.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                        <span>{part.weightKg} kg</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSnap();
                            onTogglePartAssembly(part.id);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            isAssembled
                              ? 'bg-slate-700 hover:bg-rose-900/60 text-slate-300'
                              : 'bg-amber-500 hover:bg-amber-400 text-black'
                          }`}
                        >
                          {isAssembled ? 'Unsnap' : 'Snap'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
