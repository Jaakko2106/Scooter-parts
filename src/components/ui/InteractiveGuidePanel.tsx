/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wrench,
  CheckCircle,
  Disc,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Zap,
  Shield,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PartId, SCOOTER_PARTS, ASSEMBLY_STEPS, ConnectionPoint } from '../../types/scooter.ts';
import { playClick, playSnap, playRatchet } from '../../utils/audio.ts';

interface InteractiveGuidePanelProps {
  currentStepIndex: number;
  totalSteps: number;
  assembledParts: Set<PartId>;
  activeConnectionPointId: string | null;
  isAnimating: boolean;
  onSelectConnectionPoint: (id: string) => void;
  onAnimateConnection: () => void;
  onTogglePartAssembly: (partId: PartId) => void;
  onAssembleCurrentStep: () => void;
  onDisassembleCurrentStep: () => void;
  onChangeStep: (index: number) => void;
  onSelectPart: (partId: PartId) => void;
}

export const InteractiveGuidePanel: React.FC<InteractiveGuidePanelProps> = ({
  currentStepIndex,
  totalSteps,
  assembledParts,
  activeConnectionPointId,
  isAnimating,
  onSelectConnectionPoint,
  onAnimateConnection,
  onTogglePartAssembly,
  onAssembleCurrentStep,
  onDisassembleCurrentStep,
  onChangeStep,
  onSelectPart,
}) => {
  const currentStep = ASSEMBLY_STEPS[currentStepIndex];
  const allCurrentStepPartsAssembled = currentStep.partIds.every((id) => assembledParts.has(id));

  // Determine active or first connection point
  const activeCp =
    currentStep.connectionPoints.find((c) => c.id === activeConnectionPointId) ||
    currentStep.connectionPoints[0];

  const getConnectionTypeBadge = (type: ConnectionPoint['type']) => {
    switch (type) {
      case 'axle':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Axle Joint</span>;
      case 'bolt':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Bolted Mount</span>;
      case 'clamp':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Clamp Collar</span>;
      case 'pivot':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Pivot Bushing</span>;
      case 'terminal':
        return <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Power Plug</span>;
      case 'latch':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Slam Latch</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Step Header & Title */}
      <div className="flex items-start justify-between gap-3 border-b border-[#1f2838] pb-2.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              Assembly Guide • Step {currentStep.stepNumber} of {totalSteps}
            </span>
            <span className="text-xs text-slate-400">
              {currentStep.partIds.map((p) => SCOOTER_PARTS[p].name).join(' + ')}
            </span>
          </div>
          <h2 className="text-white font-bold text-base sm:text-lg">
            {currentStep.title}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {currentStep.subtitle}
          </p>
        </div>

        {/* Big Action Button: Animate Connection / Snap */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {allCurrentStepPartsAssembled ? (
            <button
              onClick={() => {
                playRatchet();
                onDisassembleCurrentStep();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1e2736] hover:bg-[#283448] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Detach Part</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onAnimateConnection();
              }}
              disabled={isAnimating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-102 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{isAnimating ? 'Connecting...' : 'Animate Connection'}</span>
            </button>
          )}

          {/* Quick step pagination */}
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => {
                if (currentStepIndex > 0) {
                  playClick();
                  onChangeStep(currentStepIndex - 1);
                }
              }}
              disabled={currentStepIndex === 0}
              className="p-1.5 rounded-lg bg-[#1a2230] border border-[#273449] hover:bg-[#232c3e] disabled:opacity-30 transition-colors cursor-pointer"
              title="Previous Step"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-200" />
            </button>
            <span className="text-[11px] font-semibold text-slate-400 px-1">
              {currentStepIndex + 1}/{totalSteps}
            </span>
            <button
              onClick={() => {
                if (currentStepIndex < totalSteps - 1) {
                  playClick();
                  onChangeStep(currentStepIndex + 1);
                }
              }}
              disabled={currentStepIndex === totalSteps - 1}
              className="p-1.5 rounded-lg bg-[#1a2230] border border-[#273449] hover:bg-[#232c3e] disabled:opacity-30 transition-colors cursor-pointer"
              title="Next Step"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Points 3D Locator Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D Connection & Mounting Points</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Click connection point to focus 3D camera
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {currentStep.connectionPoints.map((cp) => {
            const isSelected = activeConnectionPointId === cp.id;
            return (
              <div
                key={cp.id}
                onClick={() => {
                  playClick();
                  onSelectConnectionPoint(cp.id);
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                    : 'bg-[#151c27] border-[#222e40] hover:bg-[#1a2332]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {getConnectionTypeBadge(cp.type)}
                  <span className="text-[10px] text-amber-400 font-bold">
                    {cp.spec.split('(')[1]?.replace(')', '') || cp.spec}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white truncate">
                  {cp.name}
                </div>
                <div className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                  {cp.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Connection Point Detail Banner */}
      {activeCp && (
        <div className="bg-[#17202d] border border-cyan-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/40">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase">
                Active Mating Joint • {activeCp.spec}
              </span>
              <p className="text-slate-200 text-xs font-medium">
                {activeCp.description}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#202c3e] text-slate-300 border border-slate-700">
              Coordinates: [{activeCp.position.map((n) => n.toFixed(2)).join(', ')}]
            </span>
          </div>
        </div>
      )}

      {/* Assembly Instructions Checklist */}
      <div className="bg-[#121722] border border-[#212b3c] rounded-xl p-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>Step Instructions Checklist</span>
        </h3>
        <ol className="space-y-1.5 text-xs text-slate-300">
          {currentStep.instructions.map((inst, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-[#1e2636] text-[10px] font-bold flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-snug">{inst}</span>
            </li>
          ))}
        </ol>

        {currentStep.cautionNote && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{currentStep.cautionNote}</span>
          </div>
        )}
      </div>
    </div>
  );
};
