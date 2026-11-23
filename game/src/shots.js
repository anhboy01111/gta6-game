// Screenshot scene staging for GTA 6 Vice Shores.
// Stages authentic high-action scenes for make.fun evaluation:
// 1-start: Title scene / dusk promenade with luxury sports car
// 2-play: High-speed 3-star VCPD police chase with flashing sirens, tire smoke & mission HUD
// 3-end: Intense tactical SWAT standoff / WASTED state at Downtown Citadel Tower

import { FIELD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { VEHICLE_DEFS } from './world.js';

export function stageShot(name, world) {
  world.reset();
  const state = world.state;

  if (name === 'start') {
    // Scene 1: Ocean Drive strip at twilight
    state.player.x = 2140;
    state.player.y = 520;
    state.player.angle = Math.PI / 2;
    state.camera.x = state.player.x;
    state.camera.y = state.player.y;
    state.worldTime = 12.5;

    // Advance 60 frames to settle any physics
    for (let i = 0; i < 60; i += 1) {
      world.step(STEP, { left: false, right: false, up: false, down: false }, true);
    }
    return { screen: SCREEN_TITLE, best: 45000 };
  }

  if (name === 'play') {
    // Scene 2: High-octane 3-Star Police Pursuit down Ocean Drive
    state.worldTime = 48.0;

    // Put player in the high-speed Cheetah sports car
    let playerCar = state.vehicles.find((v) => v.model === 'cheetah') || state.vehicles[0];
    if (playerCar) {
      playerCar.x = 2140;
      playerCar.y = 950;
      playerCar.angle = Math.PI / 2; // Driving south along Ocean Drive
      playerCar.speed = 360; // Near top speed
      playerCar.occupied = true;
      state.player.inVehicle = playerCar;
      state.player.x = playerCar.x;
      state.player.y = playerCar.y;
      state.player.angle = playerCar.angle;
    }

    // Set wanted level to 3 stars
    state.player.wantedStars = 3;
    state.player.health = 85;
    state.player.armor = 65;
    state.player.cash = 18500;
    state.score = 18500;

    // Stage 2 VCPD Cruisers chasing directly behind with sirens blazing
    const copCruisers = state.vehicles.filter((v) => v.isPolice);
    if (copCruisers.length >= 1) {
      copCruisers[0].x = 2140;
      copCruisers[0].y = 810;
      copCruisers[0].angle = Math.PI / 2;
      copCruisers[0].speed = 340;
      copCruisers[0].siren = true;
      copCruisers[0].occupied = true;
    }
    if (copCruisers.length >= 2) {
      copCruisers[1].x = 2175;
      copCruisers[1].y = 740;
      copCruisers[1].angle = Math.PI / 2 + 0.08;
      copCruisers[1].speed = 350;
      copCruisers[1].siren = true;
      copCruisers[1].occupied = true;
    }

    // Active Mission
    state.activeMissionIdx = 1; // "Grand Theft Exotic"
    if (state.missions && state.missions[1]) {
      state.missions[1].completed = false;
    }

    // Add high-speed drift tire smoke and sparks
    for (let s = 0; s < 18; s += 1) {
      const sx = 2140 + (Math.random() - 0.5) * 16;
      const sy = 910 - s * 10;
      state.particles.push({
        x: sx,
        y: sy,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 20,
        color: 'rgba(230, 230, 240, 0.5)',
        size: 8 + Math.random() * 8,
        life: 0.8,
        maxLife: 0.8,
      });
    }

    // Position camera dynamically ahead of vehicle
    state.camera.x = state.player.x;
    state.camera.y = state.player.y + 70;

    return { screen: SCREEN_PLAY, best: 25000 };
  }

  // Scene 3: 'end' - Epic Showdown / WASTED in Downtown Vice City
  state.worldTime = 95.0;
  state.player.x = 1350;
  state.player.y = 880;
  state.player.angle = -Math.PI / 4;
  state.player.health = 0; // Wasted!
  state.player.armor = 0;
  state.player.wantedStars = 5;
  state.player.cash = 64200;
  state.score = 64200;
  state.lives = 0;

  state.camera.x = state.player.x;
  state.camera.y = state.player.y;

  // Add surrounding police cruisers in tactical blockade
  const cruisers = state.vehicles.filter((v) => v.isPolice);
  if (cruisers.length >= 1) {
    cruisers[0].x = 1300;
    cruisers[0].y = 800;
    cruisers[0].angle = Math.PI / 3;
    cruisers[0].siren = true;
  }
  if (cruisers.length >= 2) {
    cruisers[1].x = 1420;
    cruisers[1].y = 810;
    cruisers[1].angle = (2 * Math.PI) / 3;
    cruisers[1].siren = true;
  }

  // Combat smoke and sparks
  for (let s = 0; s < 24; s += 1) {
    state.particles.push({
      x: 1350 + (Math.random() - 0.5) * 60,
      y: 880 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      color: Math.random() < 0.5 ? '#f59e0b' : '#ef4444',
      size: 4 + Math.random() * 8,
      life: 0.6,
      maxLife: 0.6,
    });
  }

  return { screen: SCREEN_OVER, best: 64200 };
}
