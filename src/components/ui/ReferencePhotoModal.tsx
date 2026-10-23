/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { playClick } from '../../utils/audio.ts';

interface ReferencePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferencePhotoModal: React.FC<ReferencePhotoModalProps> = ({ isOpen, onClose }) => {
  const [activePhoto, setActivePhoto] = useState<0 | 1>(0);

  if (!isOpen) return null;

  const photos = [
    {
      src: '/public/assets/aistudio/tuotesivu_kontiomotorskruiserlongrangeblack07kwhakuilla_499-146998_95b66199e405_1_047c61ef.webp',
      title: 'Front 3/4 Perspective Angle',
      subtitle: 'Shows high-rise handlebars, oval chrome headlight, front fat wheel, deck mat & Kontio emblem',
      features: [
        'Ape-hanger high-rise cruiser handlebars with dual hydraulic brake levers',
        'Iconic oval/teardrop projector headlight & chrome bezel',
        'Extra-wide 18x9.50-8 front road cruiser fat tire',
        'Kontio Motors bear silhouette emblem on front glossy mudguard',
        'Low-slung tubular steel frame with rubber traction floorboard',
      ],
    },
    {
      src: '/public/assets/aistudio/tuotesivu_kontiomotorskruiserlongrangeblack07kwhakuilla_499-146998_ed0e0ac8feb2_2_ef3f95aa.webp',
      title: 'Side Profile Angle',
      subtitle: 'Shows dual gold-canister piggyback shocks, 1000W rear hub motor, dual ribbed seats & sissy bar',
      features: [
        'Dual rear coilover suspension with gold-anodized piggyback reservoir canisters',
        'Heavy-duty direct-drive rear brushless hub motor and disc rotor',
        'Removable 0.7 kWh lithium-ion battery box with lightning decal',
        'Two-tier comfort saddle: driver saddle + passenger pillion seat with ribbed tuck-and-roll seams',
        'Passenger sissy bar upright with padded lumbar support backrest',
        'Sturdy spring-loaded side kickstand deployed',
      ],
    },
  ];

  const current = photos[activePhoto];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80">
      <div className="bg-[#111622] border border-[#273448] rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212b3c] bg-[#0c1018]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-white font-bold text-sm sm:text-base">
                Kontio Motors Kruiser • Product Reference Photos
              </h2>
              <p className="text-xs text-slate-400">
                Direct real-world reference matching our procedural 3D model parts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2637] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo View & Tabs */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col md:flex-row gap-5">
          {/* Main Photo Display */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full h-[320px] sm:h-[400px] bg-black/50 rounded-xl overflow-hidden border border-[#212b3c] flex items-center justify-center">
              <img
                src={current.src}
                alt={current.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Thumbnail switcher */}
            <div className="flex items-center gap-3 mt-3 w-full">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playClick();
                    setActivePhoto(idx as 0 | 1);
                  }}
                  className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    activePhoto === idx
                      ? 'bg-amber-500/15 border-amber-400 text-white'
                      : 'bg-[#151b26] border-slate-800 text-slate-400 hover:bg-[#1b2332]'
                  }`}
                >
                  <img
                    src={p.src}
                    alt={p.title}
                    className="w-12 h-12 object-contain bg-black/40 rounded-lg p-0.5"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{p.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">Angle {idx + 1}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Details & Matched 3D Components */}
          <div className="w-full md:w-80 flex flex-col justify-between bg-[#151c28] border border-[#243044] rounded-xl p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/20">
                Verified Spec
              </span>
              <h3 className="text-white font-bold text-base mt-1.5 mb-1">
                {current.title}
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {current.subtitle}
              </p>

              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modeled 3D Sub-Components</span>
              </h4>

              <ul className="space-y-2">
                {current.features.map((feat, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                playClick();
                onClose();
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              Return to 3D Assembly
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
