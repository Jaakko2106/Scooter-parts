/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  CheckCircle,
} from 'lucide-react';
import { PartId, SCOOTER_PARTS } from '../../types/scooter.ts';
import { ScreenPartCallout } from '../3d/ScooterScene.tsx';
import { playClick } from '../../utils/audio.ts';

interface ExplodedViewOverlayProps {
  callouts: ScreenPartCallout[];
  explodedProgress: number;
  autoOrbit: boolean;
  selectedPartId: PartId | null;
  onToggleAutoOrbit: () => void;
  onChangeExploded: (val: number) => void;
  onSelectPart: (partId: PartId) => void;
}

export const ExplodedViewOverlay: React.FC<ExplodedViewOverlayProps> = ({
  callouts,
  explodedProgress,
  autoOrbit,
  selectedPartId,
  onToggleAutoOrbit,
  onChangeExploded,
  onSelectPart,
}) => {
  return (
    <>
      {/* 1. Floating 3D Bill-of-Materials (BOM) Callout Badges */}
      {explodedProgress > 0.15 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {callouts.map((c) => {
            const isSelected = selectedPartId === c.id;
            return (
              <div
                key={c.id}
                style={{
                  position: 'absolute',
                  left: `${c.x}px`,
                  top: `${c.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="pointer-events-auto transition-transform duration-75 hover:scale-105"
              >
                <button
                  onClick={() => {
                    playClick();
                    onSelectPart(c.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xl border cursor-pointer backdrop-blur-none transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-black border-white ring-2 ring-cyan-300'
                      : c.isAssembled
                      ? 'bg-[#121824] text-slate-100 border-cyan-500/50 hover:border-cyan-400'
                      : 'bg-[#181d28] text-amber-300 border-amber-500/50 hover:border-amber-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="truncate max-w-[140px]">{c.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300 font-mono">
                    #{c.stepNumber}
                  </span>
                </button>
                {/* Pointer indicator line downwards */}
                <div className="w-[1px] h-3 bg-cyan-400/80 mx-auto" />
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Exploded Controls Bar (rendered inside Dock tab or overlay) */}
      <div className="flex flex-col gap-3">
        {/* Slider & Presets */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Exploded View Separation Distance</span>
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

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {[0, 0.35, 0.7, 1.0].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  playClick();
                  onChangeExploded(preset);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  Math.abs(explodedProgress - preset) < 0.05
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1b2332] text-slate-300 hover:bg-[#242f44]'
                }`}
              >
                {preset === 0 ? 'Closed' : `${Math.round(preset * 100)}%`}
              </button>
            ))}

            {/* 360 Auto-Orbit Toggle */}
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
              title="Toggle automatic 360 cinematic turntable rotation"
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoOrbit ? 'animate-spin' : ''}`} />
              <span>360° Orbit</span>
            </button>
          </div>
        </div>

        {/* Exploded View Diagram Features Info */}
        <div className="bg-[#121722] border border-[#212b3c] rounded-xl p-2.5 text-xs text-slate-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>
              <strong>Dashed Trajectory Lines:</strong> Show the exact mechanical alignment axis from each part to its chassis mounting position.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            Hover or click any part to inspect
          </span>
        </div>
      </div>
    </>
  );
};
