/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Wrench, Shield, CheckCircle, RotateCcw, Weight, Disc } from 'lucide-react';
import { PartId, SCOOTER_PARTS } from '../../types/scooter.ts';
import { playClick, playSnap, playRatchet } from '../../utils/audio.ts';

interface PartInspectionModalProps {
  partId: PartId | null;
  isAssembled: boolean;
  onClose: () => void;
  onToggleAssembly: (id: PartId) => void;
  onJumpToStep: (stepNumber: number) => void;
}

export const PartInspectionModal: React.FC<PartInspectionModalProps> = ({
  partId,
  isAssembled,
  onClose,
  onToggleAssembly,
  onJumpToStep,
}) => {
  if (!partId) return null;
  const part = SCOOTER_PARTS[partId];
  if (!part) return null;

  return (
    <div className="fixed top-18 right-4 z-30 max-w-sm w-full pointer-events-auto">
      <div className="bg-[#121622] border border-[#253246] rounded-2xl p-4 shadow-2xl text-slate-200 animate-in fade-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#202b3d] pb-2.5 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {part.category}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Step {part.assemblyStep} Component
              </span>
            </div>
            <h3 className="text-white font-bold text-sm sm:text-base leading-snug">
              {part.name}
            </h3>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1d2636] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 mb-3.5 leading-relaxed">
          {part.description}
        </p>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3.5">
          <div className="bg-[#171f2c] border border-[#232f42] p-2 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
              <Weight className="w-3 h-3 text-slate-400" />
              <span>Weight</span>
            </div>
            <div className="text-white font-bold">{part.weightKg} kg</div>
          </div>

          <div className="bg-[#171f2c] border border-[#232f42] p-2 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-slate-400" />
              <span>Sub-Parts</span>
            </div>
            <div className="text-white font-bold">{part.subPartsCount} components</div>
          </div>

          {part.torqueSpec && (
            <div className="col-span-2 bg-[#171f2c] border border-[#232f42] p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
                <Disc className="w-3 h-3 text-amber-400" />
                <span>Torque Specification</span>
              </div>
              <div className="text-amber-300 font-bold text-xs">{part.torqueSpec}</div>
            </div>
          )}

          <div className="col-span-2 bg-[#171f2c] border border-[#232f42] p-2 rounded-xl">
            <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-slate-400" />
              <span>Tools Required</span>
            </div>
            <div className="text-slate-200 font-medium text-xs">
              {part.toolsNeeded.join(', ')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAssembled ? (
            <button
              onClick={() => {
                playRatchet();
                onToggleAssembly(part.id);
              }}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-[#1d2638] hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Detach Part</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playSnap();
                onToggleAssembly(part.id);
              }}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Snap Into Position</span>
            </button>
          )}

          <button
            onClick={() => {
              playClick();
              onJumpToStep(part.assemblyStep - 1);
            }}
            className="py-2 px-3 rounded-xl text-xs font-semibold bg-[#1a2332] hover:bg-[#232f44] text-slate-200 border border-[#29384d] transition-colors cursor-pointer"
            title="Jump to this part's assembly step in the manual"
          >
            Go to Step
          </button>
        </div>
      </div>
    </div>
  );
};
