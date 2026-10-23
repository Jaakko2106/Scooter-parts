/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PartId } from '../../types/scooter.ts';
import { ScooterMaterials } from './materials.ts';

// Helper to create a smooth spring curve
function createHelicalSpringGeometry(
  radius: number,
  height: number,
  coils: number,
  wireRadius: number
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const segments = coils * 32;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * coils * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = (t - 0.5) * height;
    const z = Math.sin(angle) * radius;
    points.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, wireRadius, 8, false);
}

// Helper to create a rounded box geometry
function createChamferBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = Math.min(radius, w / 2, h / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: r * 0.5,
    bevelSize: r * 0.5,
    bevelOffset: 0,
    bevelSegments: 3,
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return new THREE.Mesh(geom, material);
}

export function buildScooterParts(materials: ScooterMaterials): Record<PartId, THREE.Group> {
  const parts: Partial<Record<PartId, THREE.Group>> = {};

  // ==========================================
  // 1. MAIN FRAME & FOOT DECK
  // ==========================================
  const frameGroup = new THREE.Group();
  frameGroup.name = 'frame';

  // Curved tubular lower cradle (left & right)
  const leftTubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.65, 0.55), // Headtube junction
    new THREE.Vector3(-0.18, 0.35, 0.35),
    new THREE.Vector3(-0.2, 0.14, 0.15), // Down to deck level
    new THREE.Vector3(-0.2, 0.14, -0.4), // Floorboard run
    new THREE.Vector3(-0.16, 0.28, -0.65), // Sweep up to rear pivot
  ]);
  const leftTubeGeom = new THREE.TubeGeometry(leftTubeCurve, 32, 0.024, 12, false);
  const leftTube = new THREE.Mesh(leftTubeGeom, materials.frame);
  leftTube.castShadow = true;
  frameGroup.add(leftTube);

  const rightTubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 0.65, 0.55),
    new THREE.Vector3(0.18, 0.35, 0.35),
    new THREE.Vector3(0.2, 0.14, 0.15),
    new THREE.Vector3(0.2, 0.14, -0.4),
    new THREE.Vector3(0.16, 0.28, -0.65),
  ]);
  const rightTubeGeom = new THREE.TubeGeometry(rightTubeCurve, 32, 0.024, 12, false);
  const rightTube = new THREE.Mesh(rightTubeGeom, materials.frame);
  rightTube.castShadow = true;
  frameGroup.add(rightTube);

  // Cross members
  const cross1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 12), materials.frame);
  cross1.rotation.z = Math.PI / 2;
  cross1.position.set(0, 0.14, 0.1);
  frameGroup.add(cross1);

  const cross2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 12), materials.frame);
  cross2.rotation.z = Math.PI / 2;
  cross2.position.set(0, 0.14, -0.35);
  frameGroup.add(cross2);

  // Foot deck platform base (wide cruiser floorboard)
  const deckBaseGeom = new THREE.BoxGeometry(0.42, 0.04, 0.6);
  const deckBase = new THREE.Mesh(deckBaseGeom, materials.darkMetal);
  deckBase.position.set(0, 0.15, -0.12);
  deckBase.receiveShadow = true;
  frameGroup.add(deckBase);

  // Textured rubber mat on deck
  const deckMatGeom = new THREE.PlaneGeometry(0.38, 0.56);
  const deckMat = new THREE.Mesh(deckMatGeom, materials.deckMat);
  deckMat.rotation.x = -Math.PI / 2;
  deckMat.position.set(0, 0.172, -0.12);
  deckMat.receiveShadow = true;
  frameGroup.add(deckMat);

  // Steering Headtube (angled at cruiser rake)
  const headtube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 16), materials.frame);
  headtube.rotation.x = 0.48; // ~27 degrees rake angle
  headtube.position.set(0, 0.65, 0.58);
  headtube.castShadow = true;
  frameGroup.add(headtube);

  // Gusset reinforcement plates near headtube
  const gussetGeom = new THREE.BoxGeometry(0.02, 0.18, 0.12);
  const gusset = new THREE.Mesh(gussetGeom, materials.frame);
  gusset.rotation.x = 0.48;
  gusset.position.set(0, 0.58, 0.52);
  frameGroup.add(gusset);

  // Vertical battery enclosure cradle and splash shield (behind deck)
  const batteryCradleGeom = new THREE.BoxGeometry(0.32, 0.42, 0.22);
  const batteryCradle = new THREE.Mesh(batteryCradleGeom, materials.frame);
  batteryCradle.position.set(0, 0.35, -0.38);
  frameGroup.add(batteryCradle);

  // Rear subframe supporting driver & passenger seats
  const subframeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.55), materials.frame);
  subframeLeft.position.set(-0.14, 0.55, -0.58);
  frameGroup.add(subframeLeft);

  const subframeRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.55), materials.frame);
  subframeRight.position.set(0.14, 0.55, -0.58);
  frameGroup.add(subframeRight);

  // Subframe rear cross arch
  const subframeCross = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.28, 12), materials.frame);
  subframeCross.rotation.z = Math.PI / 2;
  subframeCross.position.set(0, 0.55, -0.84);
  frameGroup.add(subframeCross);

  // Upper shock mount eyelet lugs on subframe
  const shockLugL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), materials.darkMetal);
  shockLugL.position.set(-0.16, 0.52, -0.55);
  frameGroup.add(shockLugL);

  const shockLugR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.04), materials.darkMetal);
  shockLugR.position.set(0.16, 0.52, -0.55);
  frameGroup.add(shockLugR);

  parts.frame = frameGroup;

  // ==========================================
  // 2. KICKSTAND
  // ==========================================
  const kickstandGroup = new THREE.Group();
  kickstandGroup.name = 'kickstand';

  // Stand arm
  const standArmCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.06, -0.16, -0.04),
    new THREE.Vector3(-0.12, -0.3, -0.08),
  ]);
  const standArmGeom = new THREE.TubeGeometry(standArmCurve, 16, 0.012, 10, false);
  const standArm = new THREE.Mesh(standArmGeom, materials.frame);
  standArm.castShadow = true;
  kickstandGroup.add(standArm);

  // Foot pad
  const standFootGeom = new THREE.BoxGeometry(0.05, 0.012, 0.06);
  const standFoot = new THREE.Mesh(standFootGeom, materials.frame);
  standFoot.position.set(-0.13, -0.3, -0.08);
  kickstandGroup.add(standFoot);

  // Pivot bolt boss
  const standPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 12), materials.chrome);
  standPivot.rotation.z = Math.PI / 2;
  kickstandGroup.add(standPivot);

  // Tension return coil spring
  const springGeom = createHelicalSpringGeometry(0.008, 0.09, 8, 0.002);
  const standSpring = new THREE.Mesh(springGeom, materials.chrome);
  standSpring.position.set(-0.02, -0.07, -0.02);
  standSpring.rotation.z = 0.3;
  kickstandGroup.add(standSpring);

  // Mount at lower-left frame
  kickstandGroup.position.set(-0.19, 0.3, -0.25);
  parts.kickstand = kickstandGroup;

  // ==========================================
  // 3. REAR SWINGARM
  // ==========================================
  const swingarmGroup = new THREE.Group();
  swingarmGroup.name = 'rearSwingarm';

  // Left & right arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.45), materials.frame);
  armL.position.set(-0.16, 0.22, -0.78);
  armL.rotation.x = 0.12;
  armL.castShadow = true;
  swingarmGroup.add(armL);

  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.45), materials.frame);
  armR.position.set(0.16, 0.22, -0.78);
  armR.rotation.x = 0.12;
  armR.castShadow = true;
  swingarmGroup.add(armR);

  // Swingarm front pivot sleeve
  const pivotSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.36, 16), materials.darkMetal);
  pivotSleeve.rotation.z = Math.PI / 2;
  pivotSleeve.position.set(0, 0.25, -0.6);
  swingarmGroup.add(pivotSleeve);

  // Lower shock mounts on swingarm
  const lowerLugL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.035), materials.darkMetal);
  lowerLugL.position.set(-0.165, 0.22, -0.75);
  swingarmGroup.add(lowerLugL);

  const lowerLugR = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.035), materials.darkMetal);
  lowerLugR.position.set(0.165, 0.22, -0.75);
  swingarmGroup.add(lowerLugR);

  // Rear axle slot dropouts
  const dropoutL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.06), materials.darkMetal);
  dropoutL.position.set(-0.16, 0.19, -0.98);
  swingarmGroup.add(dropoutL);

  const dropoutR = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.06), materials.darkMetal);
  dropoutR.position.set(0.16, 0.19, -0.98);
  swingarmGroup.add(dropoutR);

  parts.rearSwingarm = swingarmGroup;

  // ==========================================
  // 4. REAR SHOCKS (Dual Piggyback Shocks)
  // ==========================================
  const shocksGroup = new THREE.Group();
  shocksGroup.name = 'rearShocks';

  const buildSingleShock = (isLeft: boolean) => {
    const shock = new THREE.Group();
    const side = isLeft ? -1 : 1;

    // Main hydraulic damper body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 16), materials.darkMetal);
    shock.add(body);

    // Inner chrome shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 16), materials.chrome);
    shaft.position.y = -0.05;
    shock.add(shaft);

    // Heavy black coilover spring
    const springG = createHelicalSpringGeometry(0.025, 0.24, 7.5, 0.005);
    const spring = new THREE.Mesh(springG, materials.frame);
    spring.position.y = 0.01;
    shock.add(spring);

    // Gold Anodized Piggyback Gas Reservoir (Signature Kontio Cruiser detail!)
    const reservoir = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), materials.goldAnodized);
    reservoir.position.set(0, 0.08, 0.038);
    shock.add(reservoir);

    // Gold canister cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.015, 16), materials.goldAnodized);
    cap.position.set(0, 0.145, 0.038);
    shock.add(cap);

    // Reservoir connecting bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.028, 0.03), materials.darkMetal);
    bridge.position.set(0, 0.08, 0.02);
    shock.add(bridge);

    // Top & bottom mounting eyelets
    const eyeletTop = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 16), materials.darkMetal);
    eyeletTop.rotation.z = Math.PI / 2;
    eyeletTop.position.y = 0.17;
    shock.add(eyeletTop);

    const eyeletBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.024, 16), materials.darkMetal);
    eyeletBottom.rotation.z = Math.PI / 2;
    eyeletBottom.position.y = -0.17;
    shock.add(eyeletBottom);

    shock.position.set(side * 0.18, 0.38, -0.68);
    // Slight forward slant matching motorcycle twin-shock geometry
    shock.rotation.x = -0.42;
    shock.castShadow = true;
    return shock;
  };

  shocksGroup.add(buildSingleShock(true));
  shocksGroup.add(buildSingleShock(false));
  parts.rearShocks = shocksGroup;

  // ==========================================
  // 5. REAR FAT WHEEL & HUB MOTOR (18x9.50-8)
  // ==========================================
  const rearWheelGroup = new THREE.Group();
  rearWheelGroup.name = 'rearWheel';

  // Wide Cruiser Fat Tire (Torus/Cylinder hybrid)
  const tireWidth = 0.26;
  const tireOuterR = 0.24;
  const rimR = 0.11;

  // Tire outer tread cylinder
  const treadGeom = new THREE.CylinderGeometry(tireOuterR, tireOuterR, tireWidth - 0.04, 36, 1, true);
  const tread = new THREE.Mesh(treadGeom, materials.tireTread);
  tread.rotation.x = Math.PI / 2;
  rearWheelGroup.add(tread);

  // Curved sidewalls (ring donuts)
  const sidewallL = new THREE.Mesh(new THREE.TorusGeometry(tireOuterR - 0.035, 0.035, 16, 36), materials.tireSidewall);
  sidewallL.position.z = -tireWidth / 2 + 0.035;
  rearWheelGroup.add(sidewallL);

  const sidewallR = new THREE.Mesh(new THREE.TorusGeometry(tireOuterR - 0.035, 0.035, 16, 36), materials.tireSidewall);
  sidewallR.position.z = tireWidth / 2 - 0.035;
  rearWheelGroup.add(sidewallR);

  // Brushless Hub Motor Rim (satin black heavy hub)
  const motorHubGeom = new THREE.CylinderGeometry(rimR, rimR, tireWidth - 0.02, 32);
  const motorHub = new THREE.Mesh(motorHubGeom, materials.darkMetal);
  motorHub.rotation.x = Math.PI / 2;
  rearWheelGroup.add(motorHub);

  // Motor side cover with cooling ridges
  const sideCoverGeom = new THREE.CylinderGeometry(rimR - 0.01, rimR - 0.01, 0.02, 24);
  const sideCover = new THREE.Mesh(sideCoverGeom, materials.frame);
  sideCover.rotation.x = Math.PI / 2;
  sideCover.position.z = -tireWidth / 2;
  rearWheelGroup.add(sideCover);

  // Ventilated stainless steel brake rotor disc
  const discGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.004, 32);
  const disc = new THREE.Mesh(discGeom, materials.brakeDisc);
  disc.rotation.x = Math.PI / 2;
  disc.position.z = -tireWidth / 2 - 0.018;
  rearWheelGroup.add(disc);

  // Brake Caliper
  const caliperGeom = new THREE.BoxGeometry(0.06, 0.05, 0.035);
  const caliper = new THREE.Mesh(caliperGeom, materials.darkMetal);
  caliper.position.set(0, 0.075, -tireWidth / 2 - 0.018);
  rearWheelGroup.add(caliper);

  // Heavy Axle & Nuts
  const axleGeom = new THREE.CylinderGeometry(0.012, 0.012, tireWidth + 0.09, 16);
  const axle = new THREE.Mesh(axleGeom, materials.chrome);
  axle.rotation.x = Math.PI / 2;
  rearWheelGroup.add(axle);

  const nutL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 6), materials.fastener);
  nutL.rotation.x = Math.PI / 2;
  nutL.position.z = -tireWidth / 2 - 0.038;
  rearWheelGroup.add(nutL);

  const nutR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 6), materials.fastener);
  nutR.rotation.x = Math.PI / 2;
  nutR.position.z = tireWidth / 2 + 0.038;
  rearWheelGroup.add(nutR);

  // Position at rear axle dropouts
  rearWheelGroup.rotation.y = Math.PI / 2;
  rearWheelGroup.position.set(0, 0.24, -0.98);
  parts.rearWheel = rearWheelGroup;

  // ==========================================
  // 6. REAR HUGGER FENDER & TAILLIGHT
  // ==========================================
  const rearFenderGroup = new THREE.Group();
  rearFenderGroup.name = 'rearFender';

  // Curved gloss fender hugging the fat rear tire
  const fenderGeom = new THREE.CylinderGeometry(0.265, 0.265, 0.28, 32, 1, true, 0, Math.PI * 0.72);
  const fender = new THREE.Mesh(fenderGeom, materials.bodyPaint);
  fender.rotation.z = Math.PI / 2;
  fender.rotation.y = -Math.PI * 0.22;
  fender.castShadow = true;
  rearFenderGroup.add(fender);

  // Red LED Taillight strip on trailing lip
  const tailLightGeom = new THREE.BoxGeometry(0.18, 0.024, 0.02);
  const tailLight = new THREE.Mesh(tailLightGeom, materials.tailLens);
  tailLight.position.set(0, -0.16, -0.22);
  rearFenderGroup.add(tailLight);

  // Fender mounting struts (connecting to swingarm)
  const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10), materials.darkMetal);
  strutL.position.set(-0.145, -0.05, -0.05);
  strutL.rotation.x = -0.4;
  rearFenderGroup.add(strutL);

  const strutR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 10), materials.darkMetal);
  strutR.position.set(0.145, -0.05, -0.05);
  strutR.rotation.x = -0.4;
  rearFenderGroup.add(strutR);

  // Kontio Bear Logo Decal on rear fender
  const decalGeom = new THREE.PlaneGeometry(0.08, 0.08);
  const decal = new THREE.Mesh(decalGeom, materials.kontioDecal);
  decal.position.set(0, 0.12, -0.22);
  decal.rotation.x = -0.9;
  rearFenderGroup.add(decal);

  rearFenderGroup.position.set(0, 0.24, -0.98);
  parts.rearFender = rearFenderGroup;

  // ==========================================
  // CONTROLLER (60V 1000W Intelligent Sine-Wave)
  // ==========================================
  const controllerGroup = new THREE.Group();
  controllerGroup.name = 'controller';

  // Extruded aluminum alloy enclosure
  const ctrlCaseGeom = new THREE.BoxGeometry(0.18, 0.065, 0.085);
  const ctrlCase = new THREE.Mesh(ctrlCaseGeom, materials.controllerHeatsink);
  ctrlCase.castShadow = true;
  controllerGroup.add(ctrlCase);

  // Longitudinal cooling fins on top
  for (let f = -0.035; f <= 0.035; f += 0.012) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.012, 0.003), materials.controllerHeatsink);
    fin.position.set(0, 0.038, f);
    controllerGroup.add(fin);
  }

  // End plates & silicone wire gland
  const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 16), materials.connectorBlack);
  gland.rotation.z = Math.PI / 2;
  gland.position.set(-0.095, 0, 0);
  controllerGroup.add(gland);

  // Mounting flanges on left and right with M5 bolts
  const flangeF = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.1), materials.controllerHeatsink);
  flangeF.position.set(0.095, -0.028, 0);
  controllerGroup.add(flangeF);

  const flangeR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.1), materials.controllerHeatsink);
  flangeR.position.set(-0.095, -0.028, 0);
  controllerGroup.add(flangeR);

  // Output 3-Phase high-current motor wires (Yellow, Green, Blue)
  const phaseColors = [materials.wirePhaseYellow, materials.wirePhaseGreen, materials.wirePhaseBlue];
  phaseColors.forEach((mat, idx) => {
    const zOffset = (idx - 1) * 0.014;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0, zOffset),
      new THREE.Vector3(-0.16, -0.01, zOffset * 1.5),
      new THREE.Vector3(-0.22, 0.02, -0.04 + zOffset),
    ]);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.0045, 8, false), mat);
    controllerGroup.add(wire);

    // Gold bullet connector
    const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.018, 12), materials.goldAnodized);
    bullet.rotation.z = Math.PI / 2;
    bullet.position.set(-0.22, 0.02, -0.04 + zOffset);
    controllerGroup.add(bullet);
  });

  // DC 60V Battery Power input cables (Thick Red & Black)
  const redPwrCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0.015, -0.02),
    new THREE.Vector3(-0.14, 0.04, -0.03),
    new THREE.Vector3(-0.18, 0.08, -0.04),
  ]);
  const redPwr = new THREE.Mesh(new THREE.TubeGeometry(redPwrCurve, 10, 0.005, 8, false), materials.wirePowerRed);
  controllerGroup.add(redPwr);

  const blkPwrCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0.015, 0.02),
    new THREE.Vector3(-0.14, 0.04, 0.03),
    new THREE.Vector3(-0.18, 0.08, 0.04),
  ]);
  const blkPwr = new THREE.Mesh(new THREE.TubeGeometry(blkPwrCurve, 10, 0.005, 8, false), materials.wirePowerBlack);
  controllerGroup.add(blkPwr);

  // XT60 connector housing
  const xt60 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 0.024), materials.connectorYellow);
  xt60.position.set(-0.18, 0.08, 0);
  controllerGroup.add(xt60);

  // Hall sensor & control signal multi-wire harness lead
  const sigCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, -0.015, 0),
    new THREE.Vector3(-0.15, -0.03, 0.02),
    new THREE.Vector3(-0.2, -0.02, 0.04),
  ]);
  const sigHarness = new THREE.Mesh(new THREE.TubeGeometry(sigCurve, 10, 0.004, 8, false), materials.wiringLoom);
  controllerGroup.add(sigHarness);

  const sigPlug = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.02), materials.connectorBlack);
  sigPlug.position.set(-0.2, -0.02, 0.04);
  controllerGroup.add(sigPlug);

  controllerGroup.position.set(0, 0.16, -0.15);
  parts.controller = controllerGroup;

  // ==========================================
  // COMPLETE SCOOTER WIRING HARNESS
  // ==========================================
  const wiringGroup = new THREE.Group();
  wiringGroup.name = 'wiringHarness';

  // 1. Main backbone trunk: from steering headtube down frame tube to controller tray
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.65, 0.55),
    new THREE.Vector3(-0.06, 0.45, 0.42),
    new THREE.Vector3(-0.08, 0.22, 0.22),
    new THREE.Vector3(-0.06, 0.15, 0.0),
    new THREE.Vector3(0, 0.16, -0.12),
  ]);
  const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 32, 0.009, 10, false), materials.wiringLoom);
  wiringGroup.add(trunkMesh);

  // 2. Cockpit branch up to handlebars
  const cockpitCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.65, 0.55),
    new THREE.Vector3(0, 0.76, 0.52),
    new THREE.Vector3(0, 0.92, 0.46),
  ]);
  const cockpitMesh = new THREE.Mesh(new THREE.TubeGeometry(cockpitCurve, 16, 0.0075, 8, false), materials.wiringLoom);
  wiringGroup.add(cockpitMesh);

  // 4 Handlebar branch leads (Throttle, LCD speedo, Left e-brake, Right e-brake)
  const leftBrakeLead = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.92, 0.46),
      new THREE.Vector3(-0.15, 0.98, 0.44),
      new THREE.Vector3(-0.28, 1.02, 0.42),
    ]), 12, 0.004, 6, false),
    materials.wiringLoom
  );
  wiringGroup.add(leftBrakeLead);

  const rightBrakeLead = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.92, 0.46),
      new THREE.Vector3(0.15, 0.98, 0.44),
      new THREE.Vector3(0.28, 1.02, 0.42),
    ]), 12, 0.004, 6, false),
    materials.wiringLoom
  );
  wiringGroup.add(rightBrakeLead);

  // 3. Headlight branch forward
  const lightCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.72, 0.54),
    new THREE.Vector3(0, 0.76, 0.56),
    new THREE.Vector3(0, 0.78, 0.57),
  ]);
  const lightWire = new THREE.Mesh(new THREE.TubeGeometry(lightCurve, 8, 0.0035, 6, false), materials.wirePowerRed);
  wiringGroup.add(lightWire);

  // 4. Battery docking terminal connector
  const batDockCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.16, -0.15),
    new THREE.Vector3(0, 0.19, -0.28),
    new THREE.Vector3(0, 0.22, -0.36),
  ]);
  const batDockWire = new THREE.Mesh(new THREE.TubeGeometry(batDockCurve, 12, 0.008, 8, false), materials.wirePowerRed);
  wiringGroup.add(batDockWire);

  const batDockPlug = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.035), materials.connectorYellow);
  batDockPlug.position.set(0, 0.22, -0.36);
  wiringGroup.add(batDockPlug);

  // 5. Rear motor branch: 3-phase and Hall sensor bundle along swingarm
  const motorHarnessCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.16, -0.18),
    new THREE.Vector3(-0.06, 0.22, -0.45),
    new THREE.Vector3(-0.12, 0.24, -0.72),
    new THREE.Vector3(-0.16, 0.22, -0.95),
  ]);
  const motorHarness = new THREE.Mesh(new THREE.TubeGeometry(motorHarnessCurve, 24, 0.008, 8, false), materials.wiringLoom);
  wiringGroup.add(motorHarness);

  // Motor disconnect waterproof terminal block
  const motorPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 12), materials.connectorBlack);
  motorPlug.rotation.z = Math.PI / 2;
  motorPlug.position.set(-0.16, 0.22, -0.95);
  wiringGroup.add(motorPlug);

  // 6. Taillight / brake light harness running along rear subframe
  const tailHarnessCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.22, -0.38),
    new THREE.Vector3(0, 0.45, -0.6),
    new THREE.Vector3(0, 0.54, -0.8),
    new THREE.Vector3(0, 0.28, -0.96),
  ]);
  const tailHarness = new THREE.Mesh(new THREE.TubeGeometry(tailHarnessCurve, 20, 0.004, 6, false), materials.wiringLoom);
  wiringGroup.add(tailHarness);

  // Cable tie clips
  [
    [-0.07, 0.22, 0.22],
    [-0.1, 0.23, -0.55],
    [0, 0.48, -0.68],
    [0, 0.72, 0.53],
  ].forEach(([cx, cy, cz]) => {
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0025, 8, 16), materials.connectorBlack);
    tie.position.set(cx, cy, cz);
    wiringGroup.add(tie);
  });

  parts.wiringHarness = wiringGroup;

  // ==========================================
  // 7. BATTERY PACK WITH INTERNAL CELLS & BMS
  // ==========================================
  const batteryGroup = new THREE.Group();
  batteryGroup.name = 'battery';

  // Main battery outer protective box
  const batBox = createChamferBox(0.28, 0.38, 0.18, 0.02, materials.batteryCase);
  batBox.castShadow = true;
  batteryGroup.add(batBox);

  // Internal 16S 4P Lithium-Ion Cylindrical Cell Matrix
  const cellGeom = new THREE.CylinderGeometry(0.011, 0.011, 0.065, 16);
  const capGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.003, 12);
  const cellCoreGroup = new THREE.Group();
  cellCoreGroup.name = 'batteryCellMatrix';

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      const x = (c - 3.5) * 0.026;
      const y = (r - 1.5) * 0.075;
      const z = (r % 2 === 0 ? 0.012 : -0.012);

      const cell = new THREE.Mesh(cellGeom, materials.batteryCell);
      cell.position.set(x, y, z);
      cellCoreGroup.add(cell);

      // Positive nickel terminal cap
      const cap = new THREE.Mesh(capGeom, materials.nickelStrip);
      cap.position.set(x, y + 0.033, z);
      cellCoreGroup.add(cap);

      // Nickel spot-weld busbar strip linking pairs
      if (c % 2 === 0 && c < 7) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.002, 0.01), materials.nickelStrip);
        strip.position.set(x + 0.013, y + 0.034, z);
        cellCoreGroup.add(strip);
      }
    }
  }

  // Smart Battery Management System (BMS) circuit board
  const bms = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.01), materials.pcbGreen);
  bms.position.set(0, 0.14, 0.06);
  cellCoreGroup.add(bms);

  // BMS MOSFET aluminum heat sink strip
  const bmsSink = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.018, 0.008), materials.controllerHeatsink);
  bmsSink.position.set(0, 0.155, 0.068);
  cellCoreGroup.add(bmsSink);

  // Internal silicone discharge cables
  const intRed = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 8), materials.wirePowerRed);
  intRed.position.set(0.08, 0, 0.06);
  cellCoreGroup.add(intRed);

  const intBlk = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 8), materials.wirePowerBlack);
  intBlk.position.set(-0.08, 0, 0.06);
  cellCoreGroup.add(intBlk);

  batteryGroup.add(cellCoreGroup);

  // Top recessed carry handle
  const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.016, 0.02), materials.darkMetal);
  handleBar.position.set(0, 0.198, 0);
  batteryGroup.add(handleBar);

  // Key ignition lock cylinder
  const keyLock = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), materials.chrome);
  keyLock.position.set(0.09, 0.16, 0.092);
  keyLock.rotation.x = Math.PI / 2;
  batteryGroup.add(keyLock);

  // Charge port rubber cover
  const chargePort = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 16), materials.frame);
  chargePort.position.set(-0.09, 0.16, 0.092);
  chargePort.rotation.x = Math.PI / 2;
  batteryGroup.add(chargePort);

  batteryGroup.position.set(0, 0.36, -0.38);
  parts.battery = batteryGroup;

  // ==========================================
  // 8. FRONT FORK & TRIPLE TREE
  // ==========================================
  const frontForkGroup = new THREE.Group();
  frontForkGroup.name = 'frontFork';

  // Dual Telescopic Stanchions (Chrome)
  const stanchionL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 20), materials.chrome);
  stanchionL.position.set(-0.14, 0.42, 0);
  frontForkGroup.add(stanchionL);

  const stanchionR = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.58, 20), materials.chrome);
  stanchionR.position.set(0.14, 0.42, 0);
  frontForkGroup.add(stanchionR);

  // Lower Sliders (Matte Black)
  const sliderL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.34, 20), materials.frame);
  sliderL.position.set(-0.14, 0.12, 0);
  sliderL.castShadow = true;
  frontForkGroup.add(sliderL);

  const sliderR = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.34, 20), materials.frame);
  sliderR.position.set(0.14, 0.12, 0);
  sliderR.castShadow = true;
  frontForkGroup.add(sliderR);

  // Triple Tree - Lower Crown Clamp
  const lowerCrown = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.07), materials.darkMetal);
  lowerCrown.position.set(0, 0.46, 0);
  frontForkGroup.add(lowerCrown);

  // Triple Tree - Upper Crown Clamp
  const upperCrown = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.032, 0.07), materials.darkMetal);
  upperCrown.position.set(0, 0.68, 0);
  frontForkGroup.add(upperCrown);

  // Steering Stem Tube
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26, 16), materials.chrome);
  stem.position.set(0, 0.57, 0);
  frontForkGroup.add(stem);

  // Stem crown nut
  const crownNut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.018, 6), materials.chrome);
  crownNut.position.set(0, 0.705, 0);
  frontForkGroup.add(crownNut);

  // Fork arch brace (visible above front tire)
  const forkArch = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.04), materials.frame);
  forkArch.position.set(0, 0.28, 0);
  frontForkGroup.add(forkArch);

  // Caliper mount bracket on left slider
  const caliperTab = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.04), materials.darkMetal);
  caliperTab.position.set(-0.16, 0.08, -0.04);
  frontForkGroup.add(caliperTab);

  // Set fork angle and position relative to chassis
  frontForkGroup.rotation.x = -0.48; // match 27° rake
  frontForkGroup.position.set(0, 0.28, 0.72);
  parts.frontFork = frontForkGroup;

  // ==========================================
  // 9. FRONT GLOSS FENDER & BRACKETS
  // ==========================================
  const frontFenderGroup = new THREE.Group();
  frontFenderGroup.name = 'frontFender';

  // Front contoured gloss mudguard
  const frontFenderGeom = new THREE.CylinderGeometry(0.27, 0.27, 0.26, 32, 1, true, 0, Math.PI * 0.6);
  const frontFenderMesh = new THREE.Mesh(frontFenderGeom, materials.bodyPaint);
  frontFenderMesh.rotation.z = Math.PI / 2;
  frontFenderMesh.rotation.y = -Math.PI * 0.42;
  frontFenderMesh.castShadow = true;
  frontFenderGroup.add(frontFenderMesh);

  // Front fender chrome mounting stays
  const stayL = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 10), materials.chrome);
  stayL.position.set(-0.138, -0.08, 0.02);
  stayL.rotation.z = -0.2;
  frontFenderGroup.add(stayL);

  const stayR = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 10), materials.chrome);
  stayR.position.set(0.138, -0.08, 0.02);
  stayR.rotation.z = 0.2;
  frontFenderGroup.add(stayR);

  // Kontio Bear Logo on front fender (Prominent feature in user photo!)
  const frontDecalGeom = new THREE.PlaneGeometry(0.09, 0.09);
  const frontDecal = new THREE.Mesh(frontDecalGeom, materials.kontioDecal);
  frontDecal.position.set(0, 0.22, 0.16);
  frontDecal.rotation.x = -0.65;
  frontFenderGroup.add(frontDecal);

  frontFenderGroup.position.set(0, 0.24, 0.86);
  parts.frontFender = frontFenderGroup;

  // ==========================================
  // 10. FRONT FAT WHEEL & DISC BRAKE
  // ==========================================
  const frontWheelGroup = new THREE.Group();
  frontWheelGroup.name = 'frontWheel';

  // Tread
  const fTreadGeom = new THREE.CylinderGeometry(tireOuterR, tireOuterR, tireWidth - 0.04, 36, 1, true);
  const fTread = new THREE.Mesh(fTreadGeom, materials.tireTread);
  fTread.rotation.x = Math.PI / 2;
  frontWheelGroup.add(fTread);

  // Sidewalls
  const fSidewallL = new THREE.Mesh(new THREE.TorusGeometry(tireOuterR - 0.035, 0.035, 16, 36), materials.tireSidewall);
  fSidewallL.position.z = -tireWidth / 2 + 0.035;
  frontWheelGroup.add(fSidewallL);

  const fSidewallR = new THREE.Mesh(new THREE.TorusGeometry(tireOuterR - 0.035, 0.035, 16, 36), materials.tireSidewall);
  fSidewallR.position.z = tireWidth / 2 - 0.035;
  frontWheelGroup.add(fSidewallR);

  // 5-Spoke Styled Wheel Rim
  const fRimCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, tireWidth - 0.02, 20), materials.darkMetal);
  fRimCenter.rotation.x = Math.PI / 2;
  frontWheelGroup.add(fRimCenter);

  for (let s = 0; s < 5; s++) {
    const spokeAngle = (s * Math.PI * 2) / 5;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.14, 0.016), materials.darkMetal);
    spoke.position.set(Math.cos(spokeAngle) * 0.08, Math.sin(spokeAngle) * 0.08, 0);
    spoke.rotation.z = spokeAngle;
    frontWheelGroup.add(spoke);
  }

  // Drilled Stainless Brake Rotor
  const fDiscGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.004, 32);
  const fDisc = new THREE.Mesh(fDiscGeom, materials.brakeDisc);
  fDisc.rotation.x = Math.PI / 2;
  fDisc.position.z = -tireWidth / 2 - 0.018;
  frontWheelGroup.add(fDisc);

  // Caliper
  const fCaliperGeom = new THREE.BoxGeometry(0.06, 0.05, 0.035);
  const fCaliper = new THREE.Mesh(fCaliperGeom, materials.darkMetal);
  fCaliper.position.set(0, 0.075, -tireWidth / 2 - 0.018);
  frontWheelGroup.add(fCaliper);

  // Through-Axle Bolt
  const fAxleGeom = new THREE.CylinderGeometry(0.01, 0.01, tireWidth + 0.08, 16);
  const fAxle = new THREE.Mesh(fAxleGeom, materials.chrome);
  fAxle.rotation.x = Math.PI / 2;
  frontWheelGroup.add(fAxle);

  const fNut = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 6), materials.fastener);
  fNut.rotation.x = Math.PI / 2;
  fNut.position.z = tireWidth / 2 + 0.035;
  frontWheelGroup.add(fNut);

  frontWheelGroup.rotation.y = Math.PI / 2;
  frontWheelGroup.position.set(0, 0.24, 0.86);
  parts.frontWheel = frontWheelGroup;

  // ==========================================
  // 11. CRUISER APE-HANGER HANDLEBARS & CONTROLS
  // ==========================================
  const handlebarsGroup = new THREE.Group();
  handlebarsGroup.name = 'handlebars';

  // High-rise ape-hanger curved handlebar tubes
  const barCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.08, 0.04, 0),
    new THREE.Vector3(-0.14, 0.22, 0.04), // Upward rise
    new THREE.Vector3(-0.24, 0.38, 0.02),
    new THREE.Vector3(-0.36, 0.36, -0.06), // Grip sweep
  ]);
  const barL = new THREE.Mesh(new THREE.TubeGeometry(barCurveL, 24, 0.012, 12, false), materials.frame);
  handlebarsGroup.add(barL);

  const barCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0.04, 0),
    new THREE.Vector3(0.14, 0.22, 0.04),
    new THREE.Vector3(0.24, 0.38, 0.02),
    new THREE.Vector3(0.36, 0.36, -0.06),
  ]);
  const barR = new THREE.Mesh(new THREE.TubeGeometry(barCurveR, 24, 0.012, 12, false), materials.frame);
  handlebarsGroup.add(barR);

  // 4-bolt Billet Stem Clamps
  const clampL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.04), materials.darkMetal);
  clampL.position.set(-0.06, 0.02, 0);
  handlebarsGroup.add(clampL);

  const clampR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.04), materials.darkMetal);
  clampR.position.set(0.06, 0.02, 0);
  handlebarsGroup.add(clampR);

  // Rubber Hand Grips
  const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 16), materials.tireSidewall);
  gripL.rotation.z = 1.35;
  gripL.rotation.y = 0.35;
  gripL.position.set(-0.33, 0.365, -0.04);
  handlebarsGroup.add(gripL);

  const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 16), materials.tireSidewall);
  gripR.rotation.z = -1.35;
  gripR.rotation.y = -0.35;
  gripR.position.set(0.33, 0.365, -0.04);
  handlebarsGroup.add(gripR);

  // Brake Levers & Master Cylinders
  const leverL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.014, 0.1), materials.chrome);
  leverL.position.set(-0.3, 0.35, 0.04);
  leverL.rotation.y = 0.25;
  handlebarsGroup.add(leverL);

  const leverR = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.014, 0.1), materials.chrome);
  leverR.position.set(0.3, 0.35, 0.04);
  leverR.rotation.y = -0.25;
  handlebarsGroup.add(leverR);

  // Center Digital Speedometer LCD Display Pod
  const speedoPodGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.025, 24);
  const speedoPod = new THREE.Mesh(speedoPodGeom, materials.frame);
  speedoPod.rotation.x = -0.6;
  speedoPod.position.set(0, 0.12, 0.04);
  handlebarsGroup.add(speedoPod);

  const speedoScreenGeom = new THREE.CircleGeometry(0.036, 24);
  const speedoScreen = new THREE.Mesh(speedoScreenGeom, materials.speedometer);
  speedoScreen.rotation.x = -0.6;
  speedoScreen.position.set(0, 0.128, 0.048);
  handlebarsGroup.add(speedoScreen);

  // Wiring harness bundle running down stem
  const harnessCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.1, 0.02),
    new THREE.Vector3(-0.02, 0.0, 0.02),
    new THREE.Vector3(0.02, -0.12, 0.01),
  ]);
  const harness = new THREE.Mesh(new THREE.TubeGeometry(harnessCurve, 16, 0.009, 8, false), materials.frame);
  handlebarsGroup.add(harness);

  handlebarsGroup.position.set(0, 0.94, 0.44);
  parts.handlebars = handlebarsGroup;

  // ==========================================
  // 12. RETRO CHROME RING LED PROJECTOR HEADLIGHT
  // ==========================================
  const headlightGroup = new THREE.Group();
  headlightGroup.name = 'headlight';

  // Oval / teardrop headlight housing
  const lightHousingGeom = new THREE.SphereGeometry(0.075, 24, 16);
  lightHousingGeom.scale(1, 0.85, 0.7);
  const lightHousing = new THREE.Mesh(lightHousingGeom, materials.headlightBezel);
  lightHousing.castShadow = true;
  headlightGroup.add(lightHousing);

  // Polished chrome bezel ring
  const bezelRingGeom = new THREE.TorusGeometry(0.068, 0.008, 16, 32);
  const bezelRing = new THREE.Mesh(bezelRingGeom, materials.chrome);
  bezelRing.position.z = 0.04;
  headlightGroup.add(bezelRing);

  // Faceted front glass lens
  const lensGeom = new THREE.CircleGeometry(0.066, 32);
  const lens = new THREE.Mesh(lensGeom, materials.headlightLens);
  lens.position.z = 0.045;
  headlightGroup.add(lens);

  // High-power LED projector lamp emitter
  const ledGeom = new THREE.SphereGeometry(0.028, 16, 16);
  const led = new THREE.Mesh(ledGeom, materials.ledEmitter);
  led.position.z = 0.02;
  headlightGroup.add(led);

  // Lower secondary heart-shaped / triangular accent reflector pod (exact match from photo 1!)
  const lowerPodGeom = new THREE.ConeGeometry(0.04, 0.06, 16);
  const lowerPod = new THREE.Mesh(lowerPodGeom, materials.chrome);
  lowerPod.rotation.x = Math.PI;
  lowerPod.position.set(0, -0.16, 0.02);
  headlightGroup.add(lowerPod);

  const lowerLens = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), materials.headlightLens);
  lowerLens.position.set(0, -0.16, 0.04);
  headlightGroup.add(lowerLens);

  // Mounting bracket
  const lightBracket = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.05, 0.06), materials.darkMetal);
  lightBracket.position.set(0, 0, -0.05);
  headlightGroup.add(lightBracket);

  headlightGroup.position.set(0, 0.78, 0.58);
  parts.headlight = headlightGroup;

  // ==========================================
  // 13. DRIVER COMFORT SADDLE
  // ==========================================
  const driverSeatGroup = new THREE.Group();
  driverSeatGroup.name = 'driverSeat';

  // Ergonomic contoured solo driver saddle
  const driverSaddle = createChamferBox(0.28, 0.09, 0.32, 0.03, materials.leatherSeat);
  driverSaddle.castShadow = true;
  driverSeatGroup.add(driverSaddle);

  // Ribbed horizontal tuck-and-roll stitched pleating (exact match to photo!)
  for (let r = -0.1; r <= 0.1; r += 0.04) {
    const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25, 10), materials.frame);
    pleat.rotation.z = Math.PI / 2;
    pleat.position.set(0, 0.048, r);
    driverSeatGroup.add(pleat);
  }

  // Underside steel bracket
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.26), materials.darkMetal);
  seatBase.position.y = -0.045;
  driverSeatGroup.add(seatBase);

  driverSeatGroup.position.set(0, 0.62, -0.38);
  parts.driverSeat = driverSeatGroup;

  // ==========================================
  // 14. PASSENGER PILLION SEAT
  // ==========================================
  const passengerSeatGroup = new THREE.Group();
  passengerSeatGroup.name = 'passengerSeat';

  // Matching rear passenger seat block
  const pillionSaddle = createChamferBox(0.26, 0.08, 0.3, 0.025, materials.leatherSeat);
  pillionSaddle.castShadow = true;
  passengerSeatGroup.add(pillionSaddle);

  // Ribbed pleats on passenger cushion
  for (let r = -0.1; r <= 0.1; r += 0.04) {
    const pleat = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.23, 10), materials.frame);
    pleat.rotation.z = Math.PI / 2;
    pleat.position.set(0, 0.044, r);
    passengerSeatGroup.add(pleat);
  }

  // Steel subframe mounting plate
  const pillionPlate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.26), materials.darkMetal);
  pillionPlate.position.y = -0.042;
  passengerSeatGroup.add(pillionPlate);

  passengerSeatGroup.position.set(0, 0.61, -0.7);
  parts.passengerSeat = passengerSeatGroup;

  // ==========================================
  // 15. PASSENGER SISSY BAR & BACKREST
  // ==========================================
  const backrestGroup = new THREE.Group();
  backrestGroup.name = 'backrest';

  // Twin tubular sissy bar uprights
  const sissyCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, 0, 0),
    new THREE.Vector3(-0.1, 0.16, -0.04),
    new THREE.Vector3(-0.08, 0.3, -0.08),
  ]);
  const sissyL = new THREE.Mesh(new THREE.TubeGeometry(sissyCurveL, 20, 0.012, 10, false), materials.frame);
  sissyL.castShadow = true;
  backrestGroup.add(sissyL);

  const sissyCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0, 0),
    new THREE.Vector3(0.1, 0.16, -0.04),
    new THREE.Vector3(0.08, 0.3, -0.08),
  ]);
  const sissyR = new THREE.Mesh(new THREE.TubeGeometry(sissyCurveR, 20, 0.012, 10, false), materials.frame);
  sissyR.castShadow = true;
  backrestGroup.add(sissyR);

  // Cross connector
  const sissyCross = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 10), materials.frame);
  sissyCross.rotation.z = Math.PI / 2;
  sissyCross.position.set(0, 0.3, -0.08);
  backrestGroup.add(sissyCross);

  // Padded lumbar support backrest cushion
  const pad = createChamferBox(0.2, 0.12, 0.06, 0.02, materials.leatherSeat);
  pad.position.set(0, 0.32, -0.07);
  pad.castShadow = true;
  backrestGroup.add(pad);

  // Rear safety reflector
  const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.01), materials.tailLens);
  reflector.position.set(0, 0.32, -0.102);
  backrestGroup.add(reflector);

  backrestGroup.position.set(0, 0.55, -0.84);
  parts.backrest = backrestGroup;

  // Tag every group with its partId and cast shadows
  (Object.keys(parts) as PartId[]).forEach((id) => {
    const grp = parts[id]!;
    grp.userData = { partId: id };
    grp.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = { partId: id, origMaterial: child.material };
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  });

  return parts as Record<PartId, THREE.Group>;
}

// Generate animated fastener kit meshes for active assembly step
export function createStepFasteners(stepNumber: number, materials: ScooterMaterials): THREE.Group {
  const kit = new THREE.Group();
  kit.name = 'fastenersKit';

  const boltGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 12);
  const washerGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.003, 16);
  const nutGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 6);

  // Create 2-4 floating animated hardware pieces near the work area
  const count = stepNumber === 7 ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const hardware = new THREE.Group();
    const bolt = new THREE.Mesh(boltGeom, materials.chrome);
    const washer = new THREE.Mesh(washerGeom, materials.fastener);
    const nut = new THREE.Mesh(nutGeom, materials.chrome);

    washer.position.y = 0.016;
    nut.position.y = -0.016;
    hardware.add(bolt);
    hardware.add(washer);
    hardware.add(nut);

    hardware.position.set((i - (count - 1) / 2) * 0.08, 0, 0);
    kit.add(hardware);
  }

  return kit;
}
