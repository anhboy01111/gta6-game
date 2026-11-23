// High-end Vice City renderer for GTA 6.
// Features 2.5D building height extrusion, neon signs with multi-pass bloom,
// ocean waves, beachside promenade, dynamic vehicle headlights & police sirens,
// streetlamp lighting pools, and a sleek GTA 6 minimap HUD.

import { FIELD } from './config.js';
import { DISTRICTS, WORLD_HEIGHT, WORLD_WIDTH } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  // Helper for drawing rounded rectangles
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Draw Ground Terrain (Water, Beach, Grass, Sidewalks, Roads)
  function drawTerrain(state) {
    const time = state.worldTime || 0;

    // Base Land / Grass
    context.fillStyle = '#1e293b'; // Dark twilight city ground
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // 1. Water Bodies (Atlantic Ocean & Canals)
    for (let index = 0; index < state.waterZones.length; index += 1) {
      const wz = state.waterZones[index];
      if (wz.type === 'ocean') {
        // Deep ocean to turquoise gradient
        const oceanGrad = context.createLinearGradient(wz.x, 0, wz.x + wz.w, 0);
        oceanGrad.addColorStop(0, '#0284c7'); // Turquoise shallows
        oceanGrad.addColorStop(0.3, '#0369a1');
        oceanGrad.addColorStop(1, '#0c4a6e'); // Deep ocean navy
        context.fillStyle = oceanGrad;
        context.fillRect(wz.x, wz.y, wz.w, wz.h);

        // Animated ocean waves & foam shorelines
        context.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let wy = 0; wy < WORLD_HEIGHT; wy += 40) {
          const waveOffset = Math.sin(time * 2 + wy * 0.05) * 12;
          context.beginPath();
          context.ellipse(wz.x + 15 + waveOffset, wy, 8, 20, 0, 0, Math.PI * 2);
          context.fill();

          // Outer swell ripples
          context.fillStyle = 'rgba(255, 255, 255, 0.15)';
          const swellX = wz.x + 80 + Math.cos(time * 1.5 + wy * 0.04) * 25;
          context.fillRect(swellX, wy, 45, 3);
          context.fillStyle = 'rgba(255, 255, 255, 0.35)';
        }
      } else {
        // Canal water
        context.fillStyle = '#0f172a';
        context.fillRect(wz.x, wz.y, wz.w, wz.h);
        context.fillStyle = 'rgba(56, 189, 248, 0.15)';
        for (let cy = wz.y; cy < wz.y + wz.h; cy += 60) {
          const cx = wz.x + Math.sin(time * 1.8 + cy * 0.08) * 10;
          context.fillRect(cx, cy, wz.w * 0.7, 2);
        }
      }
    }

    // 2. Sandy Beach
    for (let index = 0; index < state.beachZones.length; index += 1) {
      const bz = state.beachZones[index];
      const beachGrad = context.createLinearGradient(bz.x, 0, bz.x + bz.w, 0);
      beachGrad.addColorStop(0, '#fef08a'); // Warm golden sand
      beachGrad.addColorStop(0.85, '#fde047');
      beachGrad.addColorStop(1, '#eab308'); // Wet sand near tide
      context.fillStyle = beachGrad;
      context.fillRect(bz.x, bz.y, bz.w, bz.h);
    }

    // 3. Ocean Drive Promenade (Tiled Walkway along the beach)
    if (state.promenade) {
      const p = state.promenade;
      context.fillStyle = '#e2e8f0'; // Clean terracotta / light stone
      context.fillRect(p.x, p.y, p.w, p.h);
      // Pavement tile pattern
      context.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      context.lineWidth = 1;
      for (let py = 0; py < p.h; py += 24) {
        context.beginPath();
        context.moveTo(p.x, py);
        context.lineTo(p.x + p.w, py);
        context.stroke();
      }
    }

    // 4. Roads Network
    for (let index = 0; index < state.roads.length; index += 1) {
      const road = state.roads[index];
      // Dark asphalt
      context.fillStyle = '#1e2026';
      context.fillRect(road.x, road.y, road.w, road.h);

      // Sidewalk Curbs
      context.fillStyle = '#475569';
      if (road.isH) {
        context.fillRect(road.x, road.y - 8, road.w, 8);
        context.fillRect(road.x, road.y + road.h, road.w, 8);
      } else {
        context.fillRect(road.x - 8, road.y, 8, road.h);
        context.fillRect(road.x + road.w, road.y, 8, road.h);
      }

      // Road markings (yellow center line, white dashed lane markers)
      context.save();
      if (road.isH) {
        const midY = road.y + road.h / 2;
        // Double yellow divider
        context.strokeStyle = '#facc15';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(road.x, midY - 2);
        context.lineTo(road.x + road.w, midY - 2);
        context.moveTo(road.x, midY + 2);
        context.lineTo(road.x + road.w, midY + 2);
        context.stroke();

        // White dashes if 4 lanes
        if (road.lanes === 4) {
          context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          context.lineWidth = 2;
          context.setLineDash([16, 16]);
          context.beginPath();
          context.moveTo(road.x, road.y + road.h * 0.25);
          context.lineTo(road.x + road.w, road.y + road.h * 0.25);
          context.moveTo(road.x, road.y + road.h * 0.75);
          context.lineTo(road.x + road.w, road.y + road.h * 0.75);
          context.stroke();
        }
      } else {
        const midX = road.x + road.w / 2;
        // Double yellow divider
        context.strokeStyle = '#facc15';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(midX - 2, road.y);
        context.lineTo(midX - 2, road.y + road.h);
        context.moveTo(midX + 2, road.y);
        context.lineTo(midX + 2, road.y + road.h);
        context.stroke();

        // White dashes if 4 lanes
        if (road.lanes === 4) {
          context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          context.lineWidth = 2;
          context.setLineDash([16, 16]);
          context.beginPath();
          context.moveTo(road.x + road.w * 0.25, road.y);
          context.lineTo(road.x + road.w * 0.25, road.y + road.h);
          context.moveTo(road.x + road.w * 0.75, road.y);
          context.lineTo(road.x + road.w * 0.75, road.y + road.h);
          context.stroke();
        }
      }
      context.restore();
    }

    // 5. Bridges over Water
    for (let index = 0; index < state.bridges.length; index += 1) {
      const br = state.bridges[index];
      // Bridge base & concrete edges
      context.fillStyle = '#334155';
      context.fillRect(br.x, br.y, br.w, br.h);
      context.fillStyle = '#1e293b';
      context.fillRect(br.x, br.y + 10, br.w, br.h - 20);

      // Bridge guard rails
      context.fillStyle = '#94a3b8';
      context.fillRect(br.x, br.y, br.w, 4);
      context.fillRect(br.x, br.y + br.h - 4, br.w, 4);
    }

    // 6. Marina Wooden Piers & Moored Boats
    for (let index = 0; index < state.piers.length; index += 1) {
      const pier = state.piers[index];
      context.fillStyle = '#78350f'; // Dark wood
      context.fillRect(pier.x, pier.y, pier.w, pier.h);
      // Planks
      context.strokeStyle = '#451a03';
      context.lineWidth = 1;
      for (let px = pier.x; px < pier.x + pier.w; px += 8) {
        context.beginPath();
        context.moveTo(px, pier.y);
        context.lineTo(px, pier.y + pier.h);
        context.stroke();
      }
    }

    // Moored Yachts and Speedboats
    for (let index = 0; index < state.boats.length; index += 1) {
      const boat = state.boats[index];
      context.save();
      context.translate(boat.x, boat.y);
      // Boat Hull
      context.fillStyle = boat.color;
      roundRect(context, -boat.w / 2, -boat.h / 2, boat.w, boat.h, 8);
      context.fill();
      // Deck Trim
      context.fillStyle = boat.trim;
      roundRect(context, -boat.w * 0.35, -boat.h * 0.35, boat.w * 0.7, boat.h * 0.7, 4);
      context.fill();
      // Windshield
      context.fillStyle = '#38bdf8';
      context.fillRect(boat.w * 0.1, -boat.h * 0.3, 4, boat.h * 0.6);
      context.restore();
    }

    // 7. Shipping Containers at Port of Vice City
    for (let index = 0; index < state.containers.length; index += 1) {
      const c = state.containers[index];
      context.fillStyle = c.color;
      context.fillRect(c.x, c.y, c.w, c.h);
      context.strokeStyle = 'rgba(0,0,0,0.4)';
      context.lineWidth = 1;
      context.strokeRect(c.x, c.y, c.w, c.h);
      // Container corrugated ridges
      for (let rx = c.x + 6; rx < c.x + c.w; rx += 8) {
        context.beginPath();
        context.moveTo(rx, c.y);
        context.lineTo(rx, c.y + c.h);
        context.stroke();
      }
    }

    // 8. Beach Props (Umbrellas, Lifeguard Towers, Volleyball)
    for (let index = 0; index < state.beachProps.length; index += 1) {
      const prop = state.beachProps[index];
      if (prop.type === 'umbrella') {
        // Striped umbrella canopy
        context.beginPath();
        context.arc(prop.x, prop.y, prop.r, 0, Math.PI * 2);
        context.fillStyle = prop.color;
        context.fill();
        context.beginPath();
        context.arc(prop.x, prop.y, prop.r * 0.5, 0, Math.PI * 2);
        context.fillStyle = '#ffffff';
        context.fill();
      } else if (prop.type === 'lifeguard_tower') {
        // Pastel Art Deco Lifeguard Station
        context.fillStyle = prop.color;
        context.fillRect(prop.x - 14, prop.y - 14, 28, 28);
        context.fillStyle = '#ffffff';
        context.fillRect(prop.x - 10, prop.y - 10, 20, 20);
        context.fillStyle = prop.color;
        context.beginPath();
        context.arc(prop.x, prop.y, 6, 0, Math.PI * 2);
        context.fill();
      } else if (prop.type === 'volleyball_net') {
        context.fillStyle = '#fef08a';
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.strokeRect(prop.x, prop.y, prop.w, prop.h);
        context.fillStyle = '#ffffff';
        context.fillRect(prop.x, prop.y + prop.h / 2 - 2, prop.w, 4);
      }
    }
  }

  // Draw 2.5D Buildings with Height Extrusions & Roof Props
  function drawBuildings(state) {
    const time = state.worldTime || 0;

    for (let index = 0; index < state.buildings.length; index += 1) {
      const b = state.buildings[index];
      const stories = b.stories || 3;
      // 2.5D height extrusion offset
      const zOffset = stories * 4.5;

      // 1. Building Ground Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.45)';
      context.fillRect(b.x + 8, b.y + 8, b.w, b.h);

      // 2. 2.5D Vertical Extrusion Walls
      context.fillStyle = b.wallColor;
      context.beginPath();
      // Bottom face
      context.moveTo(b.x, b.y + b.h);
      context.lineTo(b.x + b.w, b.y + b.h);
      // Top face offset by zOffset
      context.lineTo(b.x + b.w, b.y + b.h - zOffset);
      context.lineTo(b.x, b.y + b.h - zOffset);
      context.closePath();
      context.fill();

      // Side wall
      context.fillStyle = 'rgba(0, 0, 0, 0.2)';
      context.beginPath();
      context.moveTo(b.x + b.w, b.y);
      context.lineTo(b.x + b.w, b.y - zOffset);
      context.lineTo(b.x + b.w, b.y + b.h - zOffset);
      context.lineTo(b.x + b.w, b.y + b.h);
      context.closePath();
      context.fill();

      // Lit Window Grids on Building Facade
      const windowRows = Math.min(8, stories);
      const windowCols = Math.floor(b.w / 24);
      for (let r = 0; r < windowRows; r += 1) {
        for (let c = 0; c < windowCols; c += 1) {
          const wx = b.x + 12 + c * 22;
          const wy = b.y + b.h - zOffset + 6 + r * 6;
          // Vary lit vs unlit windows
          const isLit = (index * 7 + r * 3 + c * 5) % 3 !== 0;
          context.fillStyle = isLit ? 'rgba(254, 240, 138, 0.85)' : 'rgba(30, 41, 59, 0.8)';
          context.fillRect(wx, wy, 10, 4);
        }
      }

      // 3. Building Rooftop
      const roofY = b.y - zOffset;
      context.fillStyle = b.roofColor;
      context.fillRect(b.x, roofY, b.w, b.h);

      // Rooftop Parapet Border Trim
      context.strokeStyle = b.trimColor || '#f43f5e';
      context.lineWidth = 3;
      context.strokeRect(b.x, roofY, b.w, b.h);

      // 4. Rooftop Details: Helipads, AC Units, Antennas
      if (b.helipad) {
        const hx = b.x + b.w / 2;
        const hy = roofY + b.h / 2;
        // Helipad Yellow Circle
        context.strokeStyle = '#facc15';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(hx, hy, 32, 0, Math.PI * 2);
        context.stroke();

        // Helipad 'H'
        context.fillStyle = '#facc15';
        context.font = 'bold 28px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('H', hx, hy);
      } else {
        // Standard AC Chiller Units & Roof vents
        context.fillStyle = '#475569';
        context.fillRect(b.x + 16, roofY + 16, 28, 20);
        context.fillRect(b.x + b.w - 44, roofY + 16, 28, 20);
      }

      // Communication Antenna with Blinking Red Light
      if (b.antenna) {
        const ax = b.x + 30;
        const ay = roofY - 25;
        context.strokeStyle = '#94a3b8';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(ax, roofY);
        context.lineTo(ax, ay);
        context.stroke();

        // Blinking aviation safety light
        const blink = Math.sin(time * 6) > 0;
        context.fillStyle = blink ? '#ef4444' : '#7f1d1d';
        context.beginPath();
        context.arc(ax, ay, 4, 0, Math.PI * 2);
        context.fill();
        if (blink) {
          context.fillStyle = 'rgba(239, 68, 68, 0.4)';
          context.beginPath();
          context.arc(ax, ay, 10, 0, Math.PI * 2);
          context.fill();
        }
      }

      // Swimming Pool on Mansion grounds
      if (b.pool) {
        const pool = b.pool;
        context.fillStyle = '#e2e8f0'; // Marble deck
        context.fillRect(pool.x - 6, pool.y - 6, pool.w + 12, pool.h + 12);
        // Sparkling turquoise pool water
        context.fillStyle = '#06b6d4';
        context.fillRect(pool.x, pool.y, pool.w, pool.h);
        context.fillStyle = 'rgba(255, 255, 255, 0.3)';
        context.fillRect(pool.x + 8, pool.y + 8, pool.w * 0.4, 4);
      }
    }
  }

  // Draw Vibrant Vice City Neon Signs with Glowing Canvas Multi-Pass Bloom
  function drawNeonSigns(state) {
    const time = state.worldTime || 0;

    for (let index = 0; index < state.buildings.length; index += 1) {
      const b = state.buildings[index];
      if (!b.neon) continue;

      const neon = b.neon;
      const zOffset = (b.stories || 3) * 4.5;
      const signX = b.x + b.w / 2;
      const signY = b.y - zOffset + b.h - 16;

      // Pulse / Flicker Animation
      let alpha = 1.0;
      if (neon.type === 'pulse') {
        alpha = 0.75 + Math.sin(time * 4 + index) * 0.25;
      } else if (neon.type === 'flicker') {
        alpha = (Math.sin(time * 15 + index) > 0.85) ? 0.4 : 1.0;
      }

      context.save();
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `900 ${neon.size || 14}px system-ui, -apple-system, sans-serif`;

      // Neon Backing Plaque
      const textMetrics = context.measureText(neon.text);
      const plaqueW = textMetrics.width + 20;
      const plaqueH = (neon.size || 14) + 12;
      context.fillStyle = 'rgba(15, 23, 42, 0.85)';
      roundRect(context, signX - plaqueW / 2, signY - plaqueH / 2, plaqueW, plaqueH, 4);
      context.fill();

      // Pass 1: Wide Outer Neon Aura
      context.shadowColor = neon.glow;
      context.shadowBlur = 18;
      context.fillStyle = neon.color;
      context.globalAlpha = alpha * 0.7;
      context.fillText(neon.text, signX, signY);

      // Pass 2: Tight Core Glow
      context.shadowBlur = 8;
      context.globalAlpha = alpha;
      context.fillText(neon.text, signX, signY);

      // Pass 3: White-Hot Neon Center Tube
      context.shadowBlur = 0;
      context.fillStyle = '#ffffff';
      context.globalAlpha = alpha * 0.85;
      context.fillText(neon.text, signX, signY);

      context.restore();
    }
  }

  // Draw Props: Royal Palm Trees and Street Lamps
  function drawProps(state) {
    const time = state.worldTime || 0;

    // 1. Street Lamps (Poles & Heads)
    for (let index = 0; index < state.streetLamps.length; index += 1) {
      const lamp = state.streetLamps[index];
      // Post
      context.fillStyle = '#64748b';
      context.beginPath();
      context.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      context.fill();
      // Arm & Lamp Head
      context.fillStyle = '#f8fafc';
      context.beginPath();
      context.arc(lamp.x + 3, lamp.y, 3, 0, Math.PI * 2);
      context.fill();
    }

    // 2. Royal Palm Trees (Realistic Vice City Fan Palms with Sway)
    for (let index = 0; index < state.palmTrees.length; index += 1) {
      const palm = state.palmTrees[index];
      const swayOffset = Math.sin(time * 1.5 + palm.sway) * 4;

      context.save();
      context.translate(palm.x, palm.y);

      // Palm Tree Trunk
      context.fillStyle = '#78350f';
      context.beginPath();
      context.arc(0, 0, 5, 0, Math.PI * 2);
      context.fill();

      // Swaying Fan Fronds (7 lush tropical palm fronds)
      context.fillStyle = '#15803d'; // Tropical palm green
      const numFronds = 7;
      for (let i = 0; i < numFronds; i += 1) {
        const frondAngle = (i / numFronds) * Math.PI * 2 + swayOffset * 0.05;
        const fx = Math.cos(frondAngle) * (palm.size || 26);
        const fy = Math.sin(frondAngle) * (palm.size || 26);

        context.beginPath();
        context.moveTo(0, 0);
        context.quadraticCurveTo(fx * 0.5 + swayOffset, fy * 0.5, fx, fy);
        context.lineWidth = 5;
        context.strokeStyle = (i % 2 === 0) ? '#16a34a' : '#22c55e';
        context.stroke();
      }

      // Palm Crown center
      context.fillStyle = '#14532d';
      context.beginPath();
      context.arc(0, 0, 6, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }
  }

  // Dynamic Lighting Pass: Streetlamp Pools, Vehicle Headlights, Police Strobes
  function drawLighting(state) {
    const time = state.worldTime || 0;

    // 1. Streetlamp Radial Light Pools
    for (let index = 0; index < state.streetLamps.length; index += 1) {
      const lamp = state.streetLamps[index];
      const lampGrad = context.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, lamp.radius || 140);
      lampGrad.addColorStop(0, lamp.color || 'rgba(255, 230, 160, 0.4)');
      lampGrad.addColorStop(0.5, 'rgba(255, 220, 140, 0.15)');
      lampGrad.addColorStop(1, 'rgba(255, 220, 140, 0)');
      context.fillStyle = lampGrad;
      context.beginPath();
      context.arc(lamp.x, lamp.y, lamp.radius || 140, 0, Math.PI * 2);
      context.fill();
    }

    // 2. Vehicle Headlights & Taillights
    for (let index = 0; index < state.vehicles.length; index += 1) {
      const car = state.vehicles[index];
      // Front headlights
      const frontX = car.x + Math.cos(car.angle) * (car.w / 2);
      const frontY = car.y + Math.sin(car.angle) * (car.w / 2);

      context.save();
      context.translate(frontX, frontY);
      context.rotate(car.angle);

      // Dual Headlight Cones
      const coneGrad = context.createRadialGradient(0, 0, 0, 160, 0, 180);
      coneGrad.addColorStop(0, 'rgba(254, 240, 138, 0.6)');
      coneGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
      coneGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

      context.fillStyle = coneGrad;
      context.beginPath();
      context.moveTo(0, -car.h * 0.35);
      context.lineTo(180, -70);
      context.lineTo(180, 70);
      context.lineTo(0, car.h * 0.35);
      context.closePath();
      context.fill();

      context.restore();

      // Police Sirens: Alternating Red & Blue Strobe Lighting
      if (car.siren || (car.isPolice && (state.player.wantedStars > 0 || Math.floor(time * 4) % 2 === 0))) {
        const strobeBlue = Math.sin(time * 16) > 0;
        const sirenColor = strobeBlue ? 'rgba(59, 130, 246, 0.55)' : 'rgba(239, 68, 68, 0.55)';
        const sirenGrad = context.createRadialGradient(car.x, car.y, 0, car.x, car.y, 160);
        sirenGrad.addColorStop(0, sirenColor);
        sirenGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = sirenGrad;
        context.beginPath();
        context.arc(car.x, car.y, 160, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  // Draw Vehicles
  function drawVehicles(state) {
    const time = state.worldTime || 0;

    for (let index = 0; index < state.vehicles.length; index += 1) {
      const car = state.vehicles[index];

      context.save();
      context.translate(car.x, car.y);
      context.rotate(car.angle);

      // Car Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.4)';
      roundRect(context, -car.w / 2 + 3, -car.h / 2 + 4, car.w, car.h, 6);
      context.fill();

      // Wheels
      context.fillStyle = '#0f172a';
      context.fillRect(-car.w * 0.35, -car.h / 2 - 2, 10, 4);
      context.fillRect(car.w * 0.2, -car.h / 2 - 2, 10, 4);
      context.fillRect(-car.w * 0.35, car.h / 2 - 2, 10, 4);
      context.fillRect(car.w * 0.2, car.h / 2 - 2, 10, 4);

      // Body
      context.fillStyle = car.color;
      roundRect(context, -car.w / 2, -car.h / 2, car.w, car.h, 5);
      context.fill();

      // Accent Racing Stripe / Trim
      context.fillStyle = car.accent || '#ffffff';
      context.fillRect(-car.w * 0.4, -car.h * 0.2, car.w * 0.8, car.h * 0.4);

      // Cabin / Roof
      context.fillStyle = '#0f172a';
      roundRect(context, -car.w * 0.15, -car.h * 0.35, car.w * 0.5, car.h * 0.7, 3);
      context.fill();

      // Windshield Glass (Cyan tint reflection)
      context.fillStyle = '#38bdf8';
      context.fillRect(car.w * 0.15, -car.h * 0.3, 4, car.h * 0.6);
      // Rear Window
      context.fillStyle = '#0284c7';
      context.fillRect(-car.w * 0.15, -car.h * 0.3, 3, car.h * 0.6);

      // Headlight fixtures
      context.fillStyle = '#fef08a';
      context.fillRect(car.w / 2 - 2, -car.h * 0.4, 3, 5);
      context.fillRect(car.w / 2 - 2, car.h * 0.4 - 5, 3, 5);

      // Taillight fixtures
      context.fillStyle = '#ef4444';
      context.fillRect(-car.w / 2 - 1, -car.h * 0.4, 2, 4);
      context.fillRect(-car.w / 2 - 1, car.h * 0.4 - 4, 2, 4);

      // Police Roof Lightbar
      if (car.isPolice) {
        const strobe = Math.sin(time * 16) > 0;
        context.fillStyle = strobe ? '#ef4444' : '#3b82f6';
        context.fillRect(-2, -car.h * 0.3, 6, car.h * 0.6);
      }

      // Taxi Roof Sign
      if (car.style === 'taxi') {
        context.fillStyle = '#facc15';
        context.fillRect(-4, -car.h * 0.25, 8, car.h * 0.5);
      }

      context.restore();
    }
  }

  // Draw Pedestrians & On-Foot Characters
  function drawPedestrians(state) {
    for (let index = 0; index < state.pedestrians.length; index += 1) {
      const ped = state.pedestrians[index];

      context.save();
      context.translate(ped.x, ped.y);
      context.rotate(ped.angle);

      // Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.3)';
      context.beginPath();
      context.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      context.fill();

      // Walking arm/leg animation
      const swing = Math.sin(ped.animPhase || 0) * 4;

      // Legs / Pants
      context.fillStyle = ped.pants;
      context.fillRect(-4, -6 + swing, 3, 5);
      context.fillRect(-4, 1 - swing, 3, 5);

      // Torso / Shirt
      context.fillStyle = ped.shirt;
      roundRect(context, -5, -6, 10, 12, 3);
      context.fill();

      // Head
      context.fillStyle = '#fed7aa'; // Skin tone
      context.beginPath();
      context.arc(0, 0, 4, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }

    // Draw Player Character (if on foot)
    const player = state.player;
    if (!player.inVehicle) {
      context.save();
      context.translate(player.x, player.y);
      context.rotate(player.angle);

      // Player Shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.4)';
      context.beginPath();
      context.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      context.fill();

      // Hawaiian Shirt (Cyan & Pink Miami Style)
      context.fillStyle = '#06b6d4'; // Cyan shirt
      roundRect(context, -7, -8, 14, 16, 4);
      context.fill();

      // Jeans
      context.fillStyle = '#1e3a8a';
      context.fillRect(-6, -7, 4, 6);
      context.fillRect(-6, 1, 4, 6);

      // Head & Hair
      context.fillStyle = '#fed7aa';
      context.beginPath();
      context.arc(0, 0, 5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#451a03'; // Brown hair
      context.beginPath();
      context.arc(-1, 0, 4.5, Math.PI * 0.5, Math.PI * 1.5);
      context.fill();

      // UZI Weapon in hands
      context.fillStyle = '#18181b';
      context.fillRect(5, 3, 8, 3);

      context.restore();
    }
  }

  // Draw Particles (Smoke, Sparks, Splashes)
  function drawParticles(state) {
    for (let index = 0; index < state.particles.length; index += 1) {
      const p = state.particles[index];
      const alpha = p.life / p.maxLife;
      context.fillStyle = p.color;
      context.globalAlpha = Math.max(0, alpha);
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1.0;
    }
  }

  // Draw GTA 6 Style HUD (Minimap, Wanted Stars, Health/Armor, Cash, Mission Tracker)
  function drawHud(state) {
    const time = state.worldTime || 0;
    const player = state.player;

    // 1. Sleek GTA 6 Circular Radar / Minimap (Bottom-Left)
    const radarX = 110;
    const radarY = FIELD.height - 110;
    const radarR = 80;

    context.save();
    // Radar Outer Ring & Border
    context.fillStyle = 'rgba(15, 23, 42, 0.85)';
    context.strokeStyle = '#00f0ff'; // Neon Cyan border
    context.lineWidth = 3;
    context.beginPath();
    context.arc(radarX, radarY, radarR, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // Clip to radar circle for local map rendering
    context.save();
    context.beginPath();
    context.arc(radarX, radarY, radarR - 2, 0, Math.PI * 2);
    context.clip();

    // Radar Map Zoom & Center on Player
    context.translate(radarX, radarY);
    const radarScale = 0.12;
    context.scale(radarScale, radarScale);
    context.translate(-player.x, -player.y);

    // Mini Roads
    context.fillStyle = '#475569';
    for (let i = 0; i < state.roads.length; i += 1) {
      const r = state.roads[i];
      context.fillRect(r.x, r.y, r.w, r.h);
    }
    // Mini Water
    context.fillStyle = '#0284c7';
    for (let i = 0; i < state.waterZones.length; i += 1) {
      const w = state.waterZones[i];
      context.fillRect(w.x, w.y, w.w, w.h);
    }
    // Mini Buildings
    context.fillStyle = 'rgba(255, 0, 127, 0.35)';
    for (let i = 0; i < state.buildings.length; i += 1) {
      const b = state.buildings[i];
      context.fillRect(b.x, b.y, b.w, b.h);
    }

    // Mini Police Blips (flashing red)
    for (let i = 0; i < state.vehicles.length; i += 1) {
      const v = state.vehicles[i];
      if (v.isPolice) {
        context.fillStyle = '#ef4444';
        context.beginPath();
        context.arc(v.x, v.y, 25, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Mission Objective Waypoint (Golden Star / Marker)
    const curMission = state.missions[state.activeMissionIdx];
    if (curMission && !curMission.completed) {
      context.fillStyle = '#facc15';
      context.beginPath();
      context.arc(curMission.targetX, curMission.targetY, 40, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();

    // Player Direction Arrow on Radar (Center)
    context.save();
    context.translate(radarX, radarY);
    context.rotate(player.angle);
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.moveTo(10, 0);
    context.lineTo(-8, -6);
    context.lineTo(-4, 0);
    context.lineTo(-8, 6);
    context.closePath();
    context.fill();
    context.restore();

    // North Indicator 'N'
    context.fillStyle = '#00f0ff';
    context.font = 'bold 12px sans-serif';
    context.textAlign = 'center';
    context.fillText('N', radarX, radarY - radarR + 14);

    context.restore();

    // 2. Health & Armor Bars (Under Minimap)
    const barX = 35;
    const barY = FIELD.height - 24;
    const barW = 70;
    const barH = 7;

    // Health Bar (Neon Green)
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(barX, barY, barW, barH);
    context.fillStyle = '#22c55e';
    context.fillRect(barX, barY, (player.health / 100) * barW, barH);

    // Armor Bar (Neon Cyan)
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(barX + barW + 10, barY, barW, barH);
    context.fillStyle = '#06b6d4';
    context.fillRect(barX + barW + 10, barY, (player.armor / 100) * barW, barH);

    // 3. Wanted Level Stars (Top-Right)
    const starCount = 5;
    const starStartX = FIELD.width - 160;
    const starY = 30;
    const isFlashing = (player.wantedStars > 0 && Math.sin(time * 12) > 0);

    for (let s = 1; s <= starCount; s += 1) {
      const sx = starStartX + (s - 1) * 24;
      const isFilled = s <= player.wantedStars;

      context.save();
      context.font = '20px sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      if (isFilled) {
        context.fillStyle = isFlashing ? '#ef4444' : '#facc15';
        context.shadowColor = isFlashing ? '#ef4444' : '#facc15';
        context.shadowBlur = 8;
        context.fillText('★', sx, starY);
      } else {
        context.fillStyle = 'rgba(100, 116, 139, 0.4)';
        context.fillText('☆', sx, starY);
      }
      context.restore();
    }

    // 4. Cash & Weapon HUD (Top-Right under stars)
    context.save();
    context.textAlign = 'right';
    context.textBaseline = 'top';

    // Cash in Vintage Vice Green
    context.font = '900 28px "Courier New", monospace';
    context.fillStyle = '#22c55e';
    context.shadowColor = '#15803d';
    context.shadowBlur = 4;
    const cashStr = `$${(player.cash || 2500).toLocaleString()}`;
    context.fillText(cashStr, FIELD.width - 32, 60);

    // Weapon & Ammo
    context.font = 'bold 16px system-ui, sans-serif';
    context.fillStyle = '#f8fafc';
    context.shadowBlur = 0;
    context.fillText(`${player.weapon || 'UZI 9mm'} • ${player.ammo || 240}`, FIELD.width - 32, 96);
    context.restore();

    // 5. Active Crime Mission Objective Banner (Top-Left)
    if (curMission && !curMission.completed) {
      context.save();
      const bannerW = 460;
      const bannerH = 50;
      context.fillStyle = 'rgba(15, 23, 42, 0.88)';
      roundRect(context, 24, 20, bannerW, bannerH, 6);
      context.fill();

      // Pink accent bar
      context.fillStyle = '#ff007f';
      context.fillRect(24, 20, 5, bannerH);

      // Mission title & description
      context.font = 'bold 13px system-ui, sans-serif';
      context.fillStyle = '#ff007f';
      context.textAlign = 'left';
      context.textBaseline = 'top';
      context.fillText(`✦ MISSION: ${curMission.title}`, 38, 26);

      context.font = '12px system-ui, sans-serif';
      context.fillStyle = '#cbd5e1';
      context.fillText(curMission.desc, 38, 44);
      context.restore();
    }

    // 6. Current Vehicle Nameplate & Speedometer (Bottom-Right when in vehicle)
    if (player.inVehicle) {
      const car = player.inVehicle;
      const speedMph = Math.round(Math.abs(car.speed) * 0.28);
      context.save();
      context.textAlign = 'right';
      context.font = 'bold 18px system-ui, sans-serif';
      context.fillStyle = '#00f0ff';
      context.shadowColor = '#0284c7';
      context.shadowBlur = 6;
      context.fillText(car.name.toUpperCase(), FIELD.width - 32, FIELD.height - 45);

      context.font = 'bold 24px monospace';
      context.fillStyle = '#f8fafc';
      context.fillText(`${speedMph} MPH`, FIELD.width - 32, FIELD.height - 20);
      context.restore();
    }

    // 7. District Name Banner
    context.save();
    context.font = 'italic bold 14px system-ui, sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.textAlign = 'left';
    context.fillText('OCEAN DRIVE • VICE CITY', 24, FIELD.height - 18);
    context.restore();
  }

  // Draw Title Screen
  function drawTitleScreen(state, best) {
    const time = state.worldTime || 0;

    // Gorgeous Sunset Sky Gradient
    const skyGrad = context.createLinearGradient(0, 0, 0, FIELD.height);
    skyGrad.addColorStop(0, '#1a0b2e'); // Deep indigo night
    skyGrad.addColorStop(0.35, '#5b1250'); // Vice magenta
    skyGrad.addColorStop(0.65, '#b83b5e'); // Sunset red
    skyGrad.addColorStop(0.85, '#f08a5d'); // Golden orange
    skyGrad.addColorStop(1, '#1b1b2f');
    context.fillStyle = skyGrad;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // City Skyline Silhouette
    context.fillStyle = '#0f0c29';
    for (let i = 0; i < 20; i += 1) {
      const bx = i * 68;
      const bh = 140 + Math.sin(i * 1.7) * 80;
      context.fillRect(bx, FIELD.height - 180 - bh, 64, bh + 180);
    }

    // Palm Tree Silhouettes
    context.fillStyle = '#090a0f';
    for (let px of [80, 240, 1040, 1200]) {
      // Trunk
      context.fillRect(px - 4, FIELD.height - 260, 8, 260);
      // Fronds
      for (let a = 0; a < Math.PI * 2; a += 0.8) {
        context.beginPath();
        context.moveTo(px, FIELD.height - 260);
        context.lineTo(px + Math.cos(a) * 45, FIELD.height - 260 + Math.sin(a) * 35);
        context.lineWidth = 4;
        context.strokeStyle = '#090a0f';
        context.stroke();
      }
    }

    // Ground Road
    context.fillStyle = '#111827';
    context.fillRect(0, FIELD.height - 100, FIELD.width, 100);
    context.fillStyle = '#facc15';
    context.fillRect(0, FIELD.height - 52, FIELD.width, 4);

    // Main Title Logo: "VICE CITY" / "GTA VI"
    context.save();
    context.textAlign = 'center';

    // Subtitle: COASTAL SYNDICATE
    context.font = '900 24px system-ui, sans-serif';
    context.fillStyle = '#ffffff';
    context.letterSpacing = '6px';
    context.fillText('COASTAL SYNDICATE', FIELD.width / 2, FIELD.height / 2 - 140);

    // VICE CITY Glowing Neon Logo
    context.font = 'italic 900 78px system-ui, -apple-system, sans-serif';
    context.shadowColor = '#ff007f';
    context.shadowBlur = 32;
    context.fillStyle = '#ff007f';
    context.fillText('VICE CITY', FIELD.width / 2, FIELD.height / 2 - 60);

    context.shadowBlur = 12;
    context.fillStyle = '#ffffff';
    context.fillText('VICE CITY', FIELD.width / 2, FIELD.height / 2 - 60);

    // VI numeral in Electric Cyan
    context.font = 'italic 900 48px system-ui, sans-serif';
    context.shadowColor = '#00f0ff';
    context.shadowBlur = 24;
    context.fillStyle = '#00f0ff';
    context.fillText('RETRO HORIZON VI', FIELD.width / 2, FIELD.height / 2);

    // Instructions Box
    context.shadowBlur = 0;
    const boxW = 580;
    const boxH = 90;
    context.fillStyle = 'rgba(15, 23, 42, 0.75)';
    roundRect(context, (FIELD.width - boxW) / 2, FIELD.height / 2 + 40, boxW, boxH, 8);
    context.fill();

    context.font = '15px system-ui, sans-serif';
    context.fillStyle = '#cbd5e1';
    context.fillText('WASD: Drive & Walk   |   SHIFT: Sprint   |   ENTER / F: Enter/Exit Vehicle', FIELD.width / 2, FIELD.height / 2 + 70);
    context.fillText('SPACE: Brake / Shoot   |   1-5 Star Wanted Police System   |   Open-World Missions', FIELD.width / 2, FIELD.height / 2 + 100);

    // Pulsing "PRESS SPACE TO START"
    const pulse = 0.6 + Math.sin(time * 5) * 0.4;
    context.font = 'bold 22px system-ui, sans-serif';
    context.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    context.fillText('PRESS SPACE OR CLICK TO START', FIELD.width / 2, FIELD.height / 2 + 170);

    context.restore();
  }

  // Draw Game Over Screen (WASTED / BUSTED)
  function drawGameOver(state, best) {
    context.save();
    // Dramatic blood-red / dark vignette overlay
    context.fillStyle = 'rgba(69, 10, 10, 0.85)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    context.textAlign = 'center';
    context.font = 'italic 900 84px system-ui, sans-serif';
    context.fillStyle = '#ef4444';
    context.shadowColor = '#b91c1c';
    context.shadowBlur = 28;
    context.fillText('WASTED', FIELD.width / 2, FIELD.height / 2 - 40);

    context.shadowBlur = 0;
    context.font = 'bold 22px system-ui, sans-serif';
    context.fillStyle = '#f8fafc';
    context.fillText(`Final Bounty Score: $${(state.score || 0).toLocaleString()}`, FIELD.width / 2, FIELD.height / 2 + 40);

    context.font = 'bold 20px system-ui, sans-serif';
    context.fillStyle = '#facc15';
    context.fillText('Press Space or click to respawn at VCPD Hospital', FIELD.width / 2, FIELD.height / 2 + 90);
    context.restore();
  }

  // Draw Paused Screen
  function drawPaused() {
    context.save();
    context.fillStyle = 'rgba(15, 23, 42, 0.8)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    context.textAlign = 'center';
    context.font = '900 54px system-ui, sans-serif';
    context.fillStyle = '#00f0ff';
    context.shadowColor = '#0284c7';
    context.shadowBlur = 18;
    context.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 20);

    context.shadowBlur = 0;
    context.font = '18px system-ui, sans-serif';
    context.fillStyle = '#f8fafc';
    context.fillText('Press P or Space to resume Vice City', FIELD.width / 2, FIELD.height / 2 + 40);
    context.restore();
  }

  /**
   * Main Draw Function: paints one complete frame.
   */
  function draw(state, screen, best) {
    // Reset canvas transform
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#090a0f';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Apply logical playfield scaling and centering
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    if (screen === SCREEN_TITLE) {
      drawTitleScreen(state, best);
      return;
    }

    // World Space Camera Transform
    context.save();
    const camX = state.camera ? state.camera.x : state.player.x;
    const camY = state.camera ? state.camera.y : state.player.y;
    context.translate(FIELD.width / 2 - camX, FIELD.height / 2 - camY);

    // Layer 1: Ground terrain, water, sand beach, promenade, roads, bridges, piers
    drawTerrain(state);

    // Layer 2: 2.5D Buildings with diverse height extrusion, window grids, helipads
    drawBuildings(state);

    // Layer 3: Vibrant Glowing Neon Signs
    drawNeonSigns(state);

    // Layer 4: Props (Palm trees, streetlamps)
    drawProps(state);

    // Layer 5: Dynamic Lighting (Headlights, Streetlamps, Sirens)
    drawLighting(state);

    // Layer 6: Vehicles & Pedestrians
    drawVehicles(state);
    drawPedestrians(state);

    // Layer 7: Particles (Smoke, Sparks, Splashes)
    drawParticles(state);

    context.restore();

    // Layer 8: Screen-space HUD & Overlays
    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPaused();
    } else if (screen === SCREEN_OVER) {
      drawGameOver(state, best);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
