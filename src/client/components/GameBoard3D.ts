/**
 * GameBoard3D.ts
 * Real-time WebGL 3D Mansion View Engine built with Three.js.
 *
 * Implements isometric camera views, orbit controls, custom 3D chess-like pawns,
 * 3D raycasting coordinates mapping, 3D chandelier falling physics, and camera shaking.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GameState } from '../../types/game-state.js';
import type { CellId, CharacterId } from '../../types/enums.js';
import { CELL_COORDINATES } from './GameBoard.js';

// Scale factor to map grid dimensions to 3D units
const GRID_SCALE = 2.5;

export class GameBoard3D {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  // 3D Meshes registry
  private tilesMap: Map<CellId, THREE.Mesh> = new Map();
  private pawnsMap: Map<CharacterId, THREE.Group> = new Map();
  private chandelierMesh!: THREE.Group;

  // Animation & Camera shake factors
  private currentGameState: GameState | null = null;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private originalCameraPos = new THREE.Vector3(12, 10, 16);

  // Active Trap Falling state
  private fallingChandelier = false;
  private chandelierStartY = 6.0;
  private chandelierTargetY = 0.6;
  private chandelierY = 6.0;
  private chandelierVelocity = 0;
  private gravity = 18.0;

  // Selection callback hook
  private onTileSelected: (cellId: CellId, charId: CharacterId | null) => void;

  constructor(container: HTMLDivElement, onTileSelected: (cellId: CellId, charId: CharacterId | null) => void) {
    this.container = container;
    this.onTileSelected = onTileSelected;
    this.initScene();
    this.initLights();
    this.buildBoard();
    this.animate();
    
    // Wire click listener
    this.container.addEventListener('click', this.onClick.bind(this));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Core Three.js Setup
  // ──────────────────────────────────────────────────────────────────────────
  private initScene(): void {
    this.scene = new THREE.Scene();
    // Deep HSL gradient matching index.css styles
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.03);

    // Dynamic isometric perspective camera
    this.camera = new THREE.PerspectiveCamera(
      40,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.copy(this.originalCameraPos);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Clear inner contents, append canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Mouse Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1; // Restrict camera below floor level
    this.controls.minDistance = 8;
    this.controls.maxDistance = 30;
    this.controls.target.set(10, 0, 5);
    this.controls.update();
  }

  private initLights(): void {
    // Soft overall ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambientLight);

    // Premium glowing spot lights casting dynamic soft shadows
    const spotlight = new THREE.SpotLight(0xffffff, 15.0);
    spotlight.position.set(10, 18, 5);
    spotlight.angle = Math.PI / 3;
    spotlight.penumbra = 0.8;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    spotlight.shadow.camera.near = 10;
    spotlight.shadow.camera.far = 30;
    spotlight.shadow.bias = -0.001;
    this.scene.add(spotlight);

    // Subtle colored point light highlights
    const neonBlue = new THREE.PointLight(0x00a0ff, 3.0, 15);
    neonBlue.position.set(2, 2, 5);
    this.scene.add(neonBlue);

    const neonPurple = new THREE.PointLight(0xa050ff, 3.0, 15);
    neonPurple.position.set(15, 2, 5);
    this.scene.add(neonPurple);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Build 3D Game Board Layout
  // ──────────────────────────────────────────────────────────────────────────
  private buildBoard(): void {
    // Add a dark luxurious wooden floor base plate
    const floorGeo = new THREE.BoxGeometry(25, 0.2, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x07080a,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(10, -0.11, 5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Create paths connecting cells
    for (const [cellId, gridPos] of Object.entries(CELL_COORDINATES)) {
      const cell = cellId as CellId;
      
      const x = gridPos.x * GRID_SCALE;
      const z = gridPos.y * GRID_SCALE;

      // Premium slate-colored floor tiles
      const tileGeo = new THREE.BoxGeometry(1.8, 0.15, 1.8);
      const isTrap = cell === 'B4' || cell === 'C5';
      const tileColor = isTrap ? 0x221010 : 0x141822;

      const tileMat = new THREE.MeshStandardMaterial({
        color: tileColor,
        roughness: 0.5,
        metalness: 0.3
      });
      const tileMesh = new THREE.Mesh(tileGeo, tileMat);
      tileMesh.position.set(x, 0, z);
      tileMesh.receiveShadow = true;
      tileMesh.castShadow = true;
      
      // Store Cell ID on userData for Raycasting
      tileMesh.userData = { cellId: cell };
      
      this.scene.add(tileMesh);
      this.tilesMap.set(cell, tileMesh);

      // Add a thin neon glowing border highlight ring on each tile
      const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.8, 1.8));
      const borderMat = new THREE.LineBasicMaterial({
        color: isTrap ? 0xff3333 : 0x0080ff,
        linewidth: 2
      });
      const wire = new THREE.LineSegments(borderGeo, borderMat);
      wire.rotation.x = -Math.PI / 2;
      wire.position.set(x, 0.08, z);
      this.scene.add(wire);
    }

    // Build the 3D Chandelier Mesh hanging over B4 cell!
    const chandelierGroup = new THREE.Group();
    
    // Golden frame rod
    const chainGeo = new THREE.CylinderGeometry(0.04, 0.04, 5.0);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });
    const chain = new THREE.Mesh(chainGeo, goldMat);
    chain.position.y = 2.5;
    chandelierGroup.add(chain);

    // Golden frame tier
    const tierGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 8);
    const tier = new THREE.Mesh(tierGeo, goldMat);
    tier.position.y = 0.3;
    chandelierGroup.add(tier);

    // Glowing red crystal center
    const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const bulb = new THREE.Mesh(bulbGeo, glowMat);
    bulb.position.y = 0.05;
    chandelierGroup.add(bulb);

    const b4Pos = CELL_COORDINATES['B4'];
    if (b4Pos) {
      this.chandelierY = this.chandelierStartY;
      chandelierGroup.position.set(b4Pos.x * GRID_SCALE, this.chandelierY, b4Pos.y * GRID_SCALE);
    }
    this.scene.add(chandelierGroup);
    this.chandelierMesh = chandelierGroup;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. State Synchronization (3D Pawn updates)
  // ──────────────────────────────────────────────────────────────────────────
  public updateState(nextState: GameState): void {
    const prevState = this.currentGameState;
    this.currentGameState = nextState;

    // 1. Redraw/Move 3D Pawns based on coordinates
    for (const [charId, char] of Object.entries(nextState.characters)) {
      const id = charId as CharacterId;
      const coord = CELL_COORDINATES[char.position];
      if (!coord) continue;

      const targetX = coord.x * GRID_SCALE;
      const targetZ = coord.y * GRID_SCALE;

      let pawnGroup = this.pawnsMap.get(id);

      if (!pawnGroup) {
        // Create a new elegant 3D pawn mesh shape: Cylinder base + Cone body + Sphere head
        pawnGroup = new THREE.Group();
        
        // Base plate
        const baseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const color = char.pawnColor ? parseInt(char.pawnColor.replace('#', '0x')) : 0xffffff;
        const pawnMat = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.2
        });
        const base = new THREE.Mesh(baseGeo, pawnMat);
        base.castShadow = true;
        pawnGroup.add(base);

        // Body cone
        const bodyGeo = new THREE.ConeGeometry(0.38, 0.9, 16);
        const body = new THREE.Mesh(bodyGeo, pawnMat);
        body.position.y = 0.5;
        body.castShadow = true;
        pawnGroup.add(body);

        // Head sphere
        const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const head = new THREE.Mesh(headGeo, pawnMat);
        head.position.y = 1.05;
        head.castShadow = true;
        pawnGroup.add(head);

        // Subtly save character data for Raycasting clicks
        base.userData = { characterId: id, cellId: char.position };
        body.userData = { characterId: id, cellId: char.position };
        head.userData = { characterId: id, cellId: char.position };

        this.scene.add(pawnGroup);
        this.pawnsMap.set(id, pawnGroup);
        pawnGroup.position.set(targetX, 0.05, targetZ);
      }

      // Smoothly animate pawn position if they moved, or snap them
      const isAlive = char.status === 'ALIVE';
      
      if (isAlive) {
        // Move towards target coordinate
        pawnGroup.position.set(targetX, 0.05, targetZ);
        pawnGroup.rotation.set(0, 0, 0); // Stand upright
        
        // Restore materials if they were greyed out previously
        pawnGroup.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            const color = char.pawnColor ? parseInt(char.pawnColor.replace('#', '0x')) : 0xffffff;
            (node.material as THREE.MeshStandardMaterial).color.setHex(color);
            node.userData = { characterId: id, cellId: char.position };
          }
        });
      } else {
        // ELIMINATED: Knock the pawn flat on its side and grey it out!
        pawnGroup.position.set(targetX, 0.1, targetZ);
        pawnGroup.rotation.z = Math.PI / 2; // Lie flat
        
        pawnGroup.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            // Dark gray slate color for dead pawns
            (node.material as THREE.MeshStandardMaterial).color.setHex(0x3e4045);
          }
        });
      }
    }

    // 2. Diff check: detect trap triggers to launch WebGL physics dropdown
    if (prevState && nextState) {
      for (const trapId of Object.keys(nextState.traps) as import('../../types/enums.js').TrapId[]) {
        const prev = prevState.traps[trapId];
        const next = nextState.traps[trapId];
        if (prev?.state === 'READY' && next?.state === 'SPENT') {
          this.triggerChandelierTrapFall();
          break;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Trap Animation & Screenshake
  // ──────────────────────────────────────────────────────────────────────────
  private triggerChandelierTrapFall(): void {
    this.fallingChandelier = true;
    this.chandelierY = this.chandelierStartY;
    this.chandelierVelocity = 0;
  }

  private triggerCameraShake(): void {
    this.shakeTimer = 0.5; // Shake for 500ms
    this.shakeIntensity = 0.4;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Interactive Raycaster Clicks
  // ──────────────────────────────────────────────────────────────────────────
  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    // Get intersections across all objects in scene
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      // Find the first intersected object that has cellId or characterId
      for (const hit of intersects) {
        const data = hit.object.userData;
        if (data && data.cellId) {
          // Clicked a tile or a pawn!
          const cellId = data.cellId as CellId;
          const charId = data.characterId as CharacterId | null;
          
          this.onTileSelected(cellId, charId);
          break;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Interactive Redraw & Animation Loop
  // ──────────────────────────────────────────────────────────────────────────
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    // 1. Process 3D Chandelier falling simulation
    if (this.fallingChandelier) {
      // Delta time step (approx 60fps frame delta: 0.016s)
      const dt = 0.016;
      this.chandelierVelocity += this.gravity * dt;
      this.chandelierY -= this.chandelierVelocity * dt;

      if (this.chandelierY <= this.chandelierTargetY) {
        // Impact collision! Set floor constraints, trigger shake, stop fall
        this.chandelierY = this.chandelierTargetY;
        this.fallingChandelier = false;
        this.triggerCameraShake();
      }
      const b4Pos = CELL_COORDINATES['B4'];
      this.chandelierMesh.position.y = this.chandelierY;
    } else {
      // Reset chandelier position slowly if rearmed
      if (this.currentGameState && this.currentGameState.traps.CHANDELIER.state === 'READY') {
        if (this.chandelierMesh.position.y < this.chandelierStartY) {
          this.chandelierMesh.position.y = THREE.MathUtils.lerp(this.chandelierMesh.position.y, this.chandelierStartY, 0.1);
        }
      }
    }

    // 2. Process Camera Screenshake displacements
    if (this.shakeTimer > 0) {
      this.shakeTimer -= 0.016;
      
      const randX = (Math.random() - 0.5) * this.shakeIntensity;
      const randY = (Math.random() - 0.5) * this.shakeIntensity;
      const randZ = (Math.random() - 0.5) * this.shakeIntensity;

      this.camera.position.set(
        this.originalCameraPos.x + randX,
        this.originalCameraPos.y + randY,
        this.originalCameraPos.z + randZ
      );
      
      this.shakeIntensity = Math.max(0, this.shakeIntensity - 0.012);
    } else {
      // Return camera smoothly to default isometric angle
      this.camera.position.lerp(this.originalCameraPos, 0.08);
    }

    // Gentle floating anim for alive pawns
    if (this.currentGameState) {
      const time = Date.now() * 0.003;
      for (const [charId, pawnGroup] of this.pawnsMap.entries()) {
        const char = this.currentGameState.characters[charId];
        if (char && char.status === 'ALIVE') {
          // Bob pawns slightly
          pawnGroup.position.y = 0.05 + Math.sin(time + charId.charCodeAt(0)) * 0.04;
        }
      }
    }

    // 3. Render frame
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public handleResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}
