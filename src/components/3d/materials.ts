/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  createTireTreadTexture,
  createTireSidewallTexture,
  createBrakeDiscTexture,
  createDeckMatTexture,
  createBatteryDecalTexture,
  createKontioEmblemTexture,
  createSpeedometerTexture,
} from '../../utils/textures.ts';

export interface ScooterMaterials {
  frame: THREE.MeshStandardMaterial;
  bodyPaint: THREE.MeshPhysicalMaterial;
  chrome: THREE.MeshPhysicalMaterial;
  goldAnodized: THREE.MeshStandardMaterial;
  darkMetal: THREE.MeshStandardMaterial;
  tireTread: THREE.MeshStandardMaterial;
  tireSidewall: THREE.MeshStandardMaterial;
  deckMat: THREE.MeshStandardMaterial;
  brakeDisc: THREE.MeshStandardMaterial;
  leatherSeat: THREE.MeshStandardMaterial;
  headlightLens: THREE.MeshPhysicalMaterial;
  headlightBezel: THREE.MeshStandardMaterial;
  ledEmitter: THREE.MeshStandardMaterial;
  tailLens: THREE.MeshPhysicalMaterial;
  batteryCase: THREE.MeshStandardMaterial;
  speedometer: THREE.MeshBasicMaterial;
  kontioDecal: THREE.MeshStandardMaterial;
  fastener: THREE.MeshStandardMaterial;
  highlight: THREE.MeshStandardMaterial;
  ghostFrame: THREE.MeshStandardMaterial;
  controllerHeatsink: THREE.MeshStandardMaterial;
  pcbGreen: THREE.MeshStandardMaterial;
  batteryCell: THREE.MeshPhysicalMaterial;
  nickelStrip: THREE.MeshStandardMaterial;
  wirePhaseYellow: THREE.MeshStandardMaterial;
  wirePhaseGreen: THREE.MeshStandardMaterial;
  wirePhaseBlue: THREE.MeshStandardMaterial;
  wirePowerRed: THREE.MeshStandardMaterial;
  wirePowerBlack: THREE.MeshStandardMaterial;
  wiringLoom: THREE.MeshStandardMaterial;
  connectorYellow: THREE.MeshStandardMaterial;
  connectorBlack: THREE.MeshStandardMaterial;
}

export function createScooterMaterials(
  bodyColorHex = '#111215',
  finish: 'gloss' | 'matte' | 'metallic' = 'gloss',
  isSoftwareGl = false
): ScooterMaterials {
  // Procedural textures
  const treadTex = createTireTreadTexture();
  const sidewallTex = createTireSidewallTexture();
  const brakeTex = createBrakeDiscTexture();
  const deckTex = createDeckMatTexture();
  const batteryTex = createBatteryDecalTexture();
  const emblemTex = createKontioEmblemTexture();
  const speedoTex = createSpeedometerTexture();

  // Powder-coated satin black chassis
  const frame = new THREE.MeshStandardMaterial({
    color: 0x1b1c1e,
    roughness: 0.55,
    metalness: 0.7,
  });

  // Body Paint (fenders, covers)
  const bodyPaint = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: finish === 'matte' ? 0.6 : 0.18,
    metalness: finish === 'metallic' ? 0.85 : 0.25,
    clearcoat: finish === 'gloss' ? 1.0 : 0.0,
    clearcoatRoughness: 0.1,
  });

  // Polished chrome (fork stanchions, headlight rim, hardware)
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.98,
    clearcoat: 1.0,
  });

  // Gold anodized shock reservoirs (signature Kontio detail)
  const goldAnodized = new THREE.MeshStandardMaterial({
    color: 0xdfa028,
    roughness: 0.28,
    metalness: 0.88,
  });

  // Dark cast iron / aluminum brackets
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x222428,
    roughness: 0.65,
    metalness: 0.85,
  });

  // Tire rubber with tread pattern
  const tireTread = new THREE.MeshStandardMaterial({
    map: treadTex,
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.05,
  });

  // Tire sidewall
  const tireSidewall = new THREE.MeshStandardMaterial({
    map: sidewallTex,
    color: 0x242424,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Non-slip rubber footboard
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckTex,
    roughness: 0.8,
    metalness: 0.1,
  });

  // Drilled stainless brake discs
  const brakeDisc = new THREE.MeshStandardMaterial({
    map: brakeTex,
    roughness: 0.25,
    metalness: 0.95,
  });

  // Pleated marine-grade black leather seats
  const leatherSeat = new THREE.MeshStandardMaterial({
    color: 0x1c1c1f,
    roughness: 0.6,
    metalness: 0.1,
  });

  // Optical headlight lens
  const headlightLens = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.4 : 0.95,
    ior: 1.52,
    depthWrite: false,
  });

  const headlightBezel = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.15,
    metalness: 0.95,
  });

  const ledEmitter = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xd4ecff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const tailLens = new THREE.MeshPhysicalMaterial({
    color: 0xee1111,
    emissive: 0xaa0000,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9,
  });

  const batteryCase = new THREE.MeshStandardMaterial({
    map: batteryTex,
    color: 0x18191a,
    roughness: 0.45,
    metalness: 0.4,
  });

  const kontioDecal = new THREE.MeshStandardMaterial({
    map: emblemTex,
    transparent: true,
    opacity: 0.95,
    roughness: 0.2,
    metalness: 0.1,
  });

  const speedometer = new THREE.MeshBasicMaterial({
    map: speedoTex,
  });

  const fastener = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.9,
  });

  const highlight = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x0088cc,
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.5,
    transparent: true,
    opacity: 0.85,
  });

  const ghostFrame = new THREE.MeshStandardMaterial({
    color: 0x4a6070,
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.25,
    wireframe: true,
  });

  // Brushless Motor Controller extruded aluminum heatsink
  const controllerHeatsink = new THREE.MeshStandardMaterial({
    color: 0x9aa2ad,
    roughness: 0.28,
    metalness: 0.88,
  });

  // Green electronic PCB substrate
  const pcbGreen = new THREE.MeshStandardMaterial({
    color: 0x0e5c2f,
    roughness: 0.5,
    metalness: 0.2,
  });

  // High-density 18650 / 21700 lithium-ion cylindrical cells with metallic jacket
  const batteryCell = new THREE.MeshPhysicalMaterial({
    color: 0x00c49f,
    roughness: 0.2,
    metalness: 0.75,
    clearcoat: 0.8,
  });

  // Nickel spot-welded connection busbars
  const nickelStrip = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.15,
    metalness: 0.95,
  });

  // 3-Phase high-current motor wires
  const wirePhaseYellow = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.65,
    metalness: 0.1,
  });

  const wirePhaseGreen = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.65,
    metalness: 0.1,
  });

  const wirePhaseBlue = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.65,
    metalness: 0.1,
  });

  const wirePowerRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.65,
    metalness: 0.1,
  });

  const wirePowerBlack = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.65,
    metalness: 0.1,
  });

  // Braided nylon cable loom sheath
  const wiringLoom = new THREE.MeshStandardMaterial({
    color: 0x15181e,
    roughness: 0.75,
    metalness: 0.15,
  });

  const connectorYellow = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.4,
    metalness: 0.1,
  });

  const connectorBlack = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.45,
    metalness: 0.3,
  });

  return {
    frame,
    bodyPaint,
    chrome,
    goldAnodized,
    darkMetal,
    tireTread,
    tireSidewall,
    deckMat,
    brakeDisc,
    leatherSeat,
    headlightLens,
    headlightBezel,
    ledEmitter,
    tailLens,
    batteryCase,
    speedometer,
    kontioDecal,
    fastener,
    highlight,
    ghostFrame,
    controllerHeatsink,
    pcbGreen,
    batteryCell,
    nickelStrip,
    wirePhaseYellow,
    wirePhaseGreen,
    wirePhaseBlue,
    wirePowerRed,
    wirePowerBlack,
    wiringLoom,
    connectorYellow,
    connectorBlack,
  };
}
