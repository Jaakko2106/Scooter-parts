/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Wrench,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Camera,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClick } from '../../utils/audio.ts';

interface TopNavProps {
  assembledCount: number;
  totalPartsCount: number;
  currentStepIndex: number;
  totalSteps: number;
  xrayMode: boolean;
  onToggleXray: () => void;
  onOpenPhotos: () => void;
  onResetAssembly: () => void;
  onAssembleAll: () => void;
  activeColor: string;
  onChangeColor: (color: string) => void;
  soundActive: boolean;
  onToggleSound: () => void;
}

const COLOR_SWATCHES = [
  { name: 'Midnight Gloss Black', hex: '#111215' },
  { name: 'Matte Stealth Carbon', hex: '#262628' },
  { name: 'Polar White', hex: '#e8edf2' },
  { name: 'Nordic Blue', hex: '#1b3b5f' },
  { name: 'Candy Red', hex: '#8a1818' },
];

export const TopNav: React.FC<TopNavProps> = ({
  assembledCount,
  totalPartsCount,
  currentStepIndex,
  totalSteps,
  xrayMode,
  onToggleXray,
  onOpenPhotos,
  onResetAssembly,
  onAssembleAll,
  activeColor,
  onChangeColor,
  soundActive,
  onToggleSound,
}) => {
  const percent = Math.round((assembledCount / totalPartsCount) * 100);

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Brand & Progress Badge */}
      <div className="pointer-events-auto bg-[#131720] border border-[#252f3f] rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-white text-sm font-bold tracking-wide">
              KONTIO MOTORS KRUISER
            </h1>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              3D Assembly
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 h-2 bg-[#202736] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-300">
              {assembledCount}/{totalPartsCount} Parts ({percent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Action Tools & Swatches */}
      <div className="pointer-events-auto flex items-center flex-wrap gap-2 bg-[#131720] border border-[#252f3f] rounded-xl p-1.5 shadow-xl">
        {/* Color customizer */}
        <div className="flex items-center gap-1.5 px-2 border-r border-[#232b38]">
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              onClick={() => {
                playClick();
                onChangeColor(swatch.hex);
              }}
              title={swatch.name}
              className={`w-5 h-5 rounded-full border transition-all ${
                activeColor === swatch.hex
                  ? 'ring-2 ring-amber-400 scale-110 border-white'
                  : 'border-slate-600 hover:scale-105'
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>

        {/* X-Ray Mode Toggle */}
        <button
          onClick={() => {
            playClick();
            onToggleXray();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            xrayMode
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400 shadow-sm'
              : 'text-slate-300 hover:bg-[#1f2636]'
          }`}
          title="Toggle X-Ray chassis & casing transparency to reveal internal battery cells, motor controller & full wiring loom"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Inner Parts X-Ray</span>
        </button>

        {/* Photo Match Modal */}
        <button
          onClick={() => {
            playClick();
            onOpenPhotos();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-colors"
          title="Compare with real Kontio Kruiser product photos"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Photos</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            onToggleSound();
            playClick();
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            soundActive
              ? 'text-slate-300 hover:bg-[#1f2636]'
              : 'text-slate-500 hover:bg-[#1f2636]'
          }`}
          title={soundActive ? 'Mute mechanical sound effects' : 'Enable sound effects'}
        >
          {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Quick Assemble / Reset */}
        {assembledCount < totalPartsCount ? (
          <button
            onClick={() => {
              playClick();
              onAssembleAll();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
            title="Assemble all components at once"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Instant Assemble</span>
          </button>
        ) : (
          <button
            onClick={() => {
              playClick();
              onResetAssembly();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white shadow-sm transition-colors"
            title="Reset assembly to start from unboxing"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Disassemble</span>
          </button>
        )}
      </div>
    </header>
  );
};
