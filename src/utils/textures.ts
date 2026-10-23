/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export function createTireTreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base dark rubber
  ctx.fillStyle = '#181818';
  ctx.fillRect(0, 0, 1024, 1024);

  // Micro rubber grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Deep longitudinal grooves (classic wide fat-tire cruiser tread like Kontio Kruiser)
  ctx.fillStyle = '#060606';
  const grooveCount = 7;
  const grooveWidth = 14;
  for (let i = 0; i < grooveCount; i++) {
    const y = ((i + 1) * 1024) / (grooveCount + 1);
    ctx.fillRect(0, y - grooveWidth / 2, 1024, grooveWidth);

    // Subtle edge highlight
    ctx.fillStyle = '#262626';
    ctx.fillRect(0, y - grooveWidth / 2 - 2, 1024, 2);
    ctx.fillRect(0, y + grooveWidth / 2, 1024, 2);
    ctx.fillStyle = '#060606';
  }

  // Angled cross sipes for water evacuation
  ctx.strokeStyle = '#0a0a0a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const step = 64;
  for (let x = 0; x < 1024; x += step) {
    for (let i = 0; i < grooveCount - 1; i++) {
      const y1 = ((i + 1) * 1024) / (grooveCount + 1);
      const y2 = ((i + 2) * 1024) / (grooveCount + 1);
      const offset = (i % 2 === 0 ? 1 : -1) * 24;

      ctx.beginPath();
      ctx.moveTo(x, y1 + 10);
      ctx.lineTo(x + offset, y2 - 10);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTireSidewallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, 512, 512);

  // Concentric bead rings
  ctx.strokeStyle = '#282828';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#111111';
  ctx.beginPath();
  ctx.arc(256, 256, 212, 0, Math.PI * 2);
  ctx.stroke();

  // Curving embossed text on sidewall
  ctx.save();
  ctx.translate(256, 256);
  ctx.fillStyle = '#484848';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';

  // Top curve
  const textTop = 'KONTIO MOTORS • 18 x 9.50 - 8 • ROAD CRUISER';
  for (let i = 0; i < textTop.length; i++) {
    const angle = -Math.PI / 2 + (i - textTop.length / 2) * 0.055;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillText(textTop[i], 0, -225);
    ctx.restore();
  }

  // Bottom curve
  const textBottom = 'TUBELESS • 4 P.R. • MAX 22 PSI • MAX LOAD 180 KG';
  for (let i = 0; i < textBottom.length; i++) {
    const angle = Math.PI / 2 - (i - textBottom.length / 2) * 0.05;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillText(textBottom[i], 0, -225);
    ctx.restore();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBrakeDiscTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Stainless steel circular brushed background
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
  grad.addColorStop(0, '#555555');
  grad.addColorStop(0.4, '#a8a8a8');
  grad.addColorStop(0.7, '#8e8e8e');
  grad.addColorStop(0.9, '#b5b5b5');
  grad.addColorStop(1, '#666666');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric machining wear rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  for (let r = 80; r < 240; r += 5) {
    ctx.lineWidth = Math.random() > 0.5 ? 1 : 2;
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Perforated cross-drilled cooling holes
  const rings = [120, 150, 180, 210];
  rings.forEach((r, ringIdx) => {
    const count = 16 + ringIdx * 4;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (ringIdx % 2) * 0.15;
      const x = 256 + Math.cos(angle) * r;
      const y = 256 + Math.sin(angle) * r;

      // Hole depth
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Chamfer highlight
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDeckMatTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep matte black rubber deck
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(0, 0, 512, 1024);

  // Raised ribs for foot traction (as shown in the reference scooter photo)
  ctx.fillStyle = '#141414';
  const ribHeight = 12;
  const ribSpacing = 28;
  for (let y = 60; y < 960; y += ribSpacing) {
    ctx.fillStyle = '#121212';
    ctx.fillRect(40, y, 432, ribHeight);

    // Bevel highlights
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(40, y, 432, 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(40, y + ribHeight - 2, 432, 2);
  }

  // Center Kontio Cruiser decorative border
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 40, 452, 944);

  // Subtle center oval logo area
  ctx.fillStyle = '#171717';
  ctx.beginPath();
  ctx.ellipse(256, 512, 140, 60, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#555555';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KONTIO MOTORS', 256, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createKontioEmblemTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Transparent / black background
  ctx.clearRect(0, 0, 512, 512);

  // White crisp Kontio Motors Bear silhouette emblem + text (matches front & rear fenders in user photos!)
  ctx.fillStyle = '#ffffff';

  // Bear Head Silhouette
  ctx.beginPath();
  // Ears
  ctx.arc(170, 160, 40, 0, Math.PI * 2);
  ctx.arc(342, 160, 40, 0, Math.PI * 2);
  ctx.fill();

  // Head contour
  ctx.beginPath();
  ctx.moveTo(170, 190);
  ctx.quadraticCurveTo(256, 170, 342, 190);
  ctx.quadraticCurveTo(400, 260, 360, 340);
  ctx.quadraticCurveTo(256, 400, 152, 340);
  ctx.quadraticCurveTo(112, 260, 170, 190);
  ctx.closePath();
  ctx.fill();

  // Negative space for bear snout & eyes
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.ellipse(256, 310, 45, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(210, 250, 14, 0, Math.PI * 2);
  ctx.arc(302, 250, 14, 0, Math.PI * 2);
  ctx.fill();

  // Brand Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KONTIO', 256, 440);
  ctx.font = '700 32px sans-serif';
  ctx.fillText('MOTORS', 256, 485);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBatteryDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Textured matte black battery side casing
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, 512, 512);

  // Large debossed Lightning Bolt emblem (exact signature feature from user photo!)
  ctx.fillStyle = '#292929';
  ctx.beginPath();
  ctx.moveTo(270, 60);
  ctx.lineTo(170, 260);
  ctx.lineTo(250, 260);
  ctx.lineTo(210, 450);
  ctx.lineTo(340, 210);
  ctx.lineTo(260, 210);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Specification label plate (top left, as seen in real photo)
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(40, 40, 190, 90);
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 190, 90);

  ctx.fillStyle = '#e2b024';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('⚡ LITHIUM-ION', 52, 66);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '12px monospace';
  ctx.fillText('VOLTAGE: 60V DC', 52, 88);
  ctx.fillText('CAPACITY: 0.7 kWh (12Ah)', 52, 105);
  ctx.fillText('RANGE: UP TO 60 KM', 52, 120);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSpeedometerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Circular LCD display with high-contrast inverted digital readout
  ctx.fillStyle = '#05070a';
  ctx.beginPath();
  ctx.arc(128, 128, 124, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1a3348';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Cyan LCD glowing elements
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('0', 128, 130);

  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('KM / H', 128, 155);

  // Battery bar at bottom
  ctx.fillStyle = '#00ff88';
  ctx.font = '12px sans-serif';
  ctx.fillText('🔋 [■■■■■] 100%', 128, 195);

  // Ready icon
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('READY • ECO 1', 128, 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
