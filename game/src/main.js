// Retro Horizon VI: Neon Shores - Core Game Loop & Gameplay Orchestrator.
// Integrates player on foot, high-speed vehicle driving, traffic & pedestrian AI,
// 1-5 star wanted police chase system, crime missions, weapon combat, and procedural audio.

import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_COIN, EVENT_HIT, EVENT_OVER } from './world.js';
import {
  ACTION_ATTACK,
  ACTION_CONFIRM,
  ACTION_HANDBRAKE,
  ACTION_HORN,
  ACTION_PAUSE,
  ACTION_RADIO,
  ACTION_VEHICLE,
  ACTION_WEAPON_NEXT,
  createInput,
} from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

// Available weapons in player arsenal
const WEAPONS = [
  { name: 'FISTS', damage: 25, range: 45, cooldown: 0.35, isGun: false },
  { name: 'PISTOL .50', damage: 45, range: 500, cooldown: 0.28, isGun: true },
  { name: 'UZI 9mm', damage: 30, range: 450, cooldown: 0.12, isGun: true },
  { name: 'M4 CARBINE', damage: 55, range: 600, cooldown: 0.18, isGun: true },
];

// Radio stations in Vice City vehicles
const RADIO_STATIONS = [
  'WAVE 103 (Synthwave & New Wave)',
  'FLASH FM (80s Pop Classics)',
  'FEVER 105 (Soul & Disco Grooves)',
  'VICE SHORES RADIO (Hip Hop & Trap)',
  'RADIO OFF',
];

// Pure Web Audio API procedural sound synthesizer (100% offline, zero network requests)
let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) audioCtx = new AudioCtor();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudio();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'gunshot') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'hit') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'mission_pass') {
      const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.25, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === 'siren') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.25);
      osc.frequency.linearRampToValueAtTime(650, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'car_door') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'horn') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(370, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {
    // Audio context may be unavailable or blocked before user interaction
  }
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows)
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  let activeWeaponIdx = 2; // Default to UZI 9mm
  let activeRadioIdx = 0;
  let shootCooldown = 0;
  let wantedEvadeTimer = 0;
  let toastMessage = 'Welcome to Vice Shores. Steal cars, complete missions, survive VCPD.';
  let toastTimer = 6.0;

  function announce(message) {
    if (status) status.textContent = message;
    toastMessage = message;
    toastTimer = 4.0;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    activeWeaponIdx = 2;
    shootCooldown = 0;
    wantedEvadeTimer = 0;
    announce('Vice Shores: WASD to walk/drive, SHIFT to sprint, F to enter/exit car.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    playSound('hit');
    announce(`Wasted! Final Score: $${world.state.score.toLocaleString()}. Best: $${best.toLocaleString()}.`);
  }

  function cycleWeapon() {
    activeWeaponIdx = (activeWeaponIdx + 1) % WEAPONS.length;
    const w = WEAPONS[activeWeaponIdx];
    world.state.player.weapon = w.name;
    announce(`Equipped: ${w.name}`);
  }

  function cycleRadio() {
    activeRadioIdx = (activeRadioIdx + 1) % RADIO_STATIONS.length;
    announce(`Radio: ${RADIO_STATIONS[activeRadioIdx]}`);
  }

  function handleShooting() {
    const player = world.state.player;
    if (shootCooldown > 0) return;
    const weapon = WEAPONS[activeWeaponIdx];
    shootCooldown = weapon.cooldown;

    playSound(weapon.isGun ? 'gunshot' : 'hit');

    // Muzzle flash / punch particles
    const tipX = player.x + Math.cos(player.angle) * 24;
    const tipY = player.y + Math.sin(player.angle) * 24;
    world.state.particles.push({
      x: tipX,
      y: tipY,
      vx: Math.cos(player.angle) * 40,
      vy: Math.sin(player.angle) * 40,
      color: '#fbbf24',
      size: weapon.isGun ? 5 : 8,
      life: 0.12,
      maxLife: 0.12,
    });

    // Bullet trace
    if (weapon.isGun) {
      const spread = (Math.random() - 0.5) * 0.1;
      const bulletAngle = player.angle + spread;
      const bx = tipX;
      const by = tipY;
      const bulletSpeed = 1200;

      world.state.bullets.push({
        x: bx,
        y: by,
        vx: Math.cos(bulletAngle) * bulletSpeed,
        vy: Math.sin(bulletAngle) * bulletSpeed,
        damage: weapon.damage,
        life: 0.5,
      });

      // Gunfire attracts police attention
      if (player.wantedStars === 0) {
        player.wantedStars = 1;
        announce('Wanted Level 1 Star: Discharging firearm in city limits!');
      }
    } else {
      // Melee punch check
      for (const ped of world.state.pedestrians) {
        const dist = Math.hypot(ped.x - player.x, ped.y - player.y);
        if (dist < weapon.range) {
          ped.health = (ped.health || 100) - weapon.damage;
          playSound('hit');
          if (ped.health <= 0) {
            world.state.score += 150;
            player.cash = (player.cash || 0) + 150;
            if (player.wantedStars < 2) {
              player.wantedStars = 2;
              announce('Wanted Level 2 Stars: Assault and battery!');
            }
          }
          break;
        }
      }
    }
  }

  function updateCombat(dt) {
    if (shootCooldown > 0) shootCooldown -= dt;
    if (toastTimer > 0) toastTimer -= dt;

    const player = world.state.player;
    const bullets = world.state.bullets;

    // Advance bullets
    for (let index = bullets.length - 1; index >= 0; index -= 1) {
      const b = bullets[index];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Hit pedestrians
      for (const ped of world.state.pedestrians) {
        if (Math.hypot(ped.x - b.x, ped.y - b.y) < 18) {
          ped.health = (ped.health || 100) - b.damage;
          b.life = 0;
          playSound('hit');
          if (ped.health <= 0) {
            world.state.score += 250;
            player.cash = (player.cash || 0) + 250;
            if (player.wantedStars < 2) {
              player.wantedStars = 2;
              announce('Wanted Level 2 Stars: Murder in Vice Shores!');
            }
          }
          break;
        }
      }

      // Hit vehicles
      for (const car of world.state.vehicles) {
        if (car === player.inVehicle) continue;
        if (Math.hypot(car.x - b.x, car.y - b.y) < 26) {
          car.health = (car.health || 200) - b.damage;
          b.life = 0;
          playSound('hit');
          // Smoke & sparks
          world.state.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            color: '#f97316',
            size: 4,
            life: 0.3,
            maxLife: 0.3,
          });

          if (car.isPolice && player.wantedStars < 3) {
            player.wantedStars = 3;
            announce('Wanted Level 3 Stars: Assaulting VCPD Patrol!');
          }
          break;
        }
      }

      if (b.life <= 0) {
        bullets.splice(index, 1);
      }
    }

    // Wanted Level Police Evade Mechanics
    if (player.wantedStars > 0) {
      let nearestCopDist = Infinity;
      for (const car of world.state.vehicles) {
        if (car.isPolice) {
          const d = Math.hypot(car.x - player.x, car.y - player.y);
          if (d < nearestCopDist) nearestCopDist = d;
        }
      }

      // If player is far from police (line of sight lost)
      if (nearestCopDist > 550) {
        wantedEvadeTimer += dt;
        if (wantedEvadeTimer >= 10.0) {
          // Successfully cooled down!
          player.wantedStars = Math.max(0, player.wantedStars - 1);
          wantedEvadeTimer = 0;
          if (player.wantedStars === 0) {
            world.state.score += 1500;
            player.cash = (player.cash || 0) + 1500;
            playSound('mission_pass');
            announce('Cops Evaded! +$1,500 Evade Bonus.');
          } else {
            announce(`Heat Reduced! Wanted Level: ${player.wantedStars} Stars.`);
          }
        }
      } else {
        wantedEvadeTimer = 0;
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();

    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }

    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }

    if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Resumed.');
      return;
    }

    if (screen === SCREEN_PLAY) {
      if (actions & ACTION_WEAPON_NEXT) {
        cycleWeapon();
      }
      if (actions & ACTION_RADIO) {
        cycleRadio();
      }
      if (actions & ACTION_HORN) {
        playSound('horn');
      }
      if (actions & ACTION_ATTACK) {
        handleShooting();
      }
    }

    return actions;
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, true);
      return;
    }

    const vec = input.vector();
    const isSprinting = input.isSprinting();
    const isBraking = input.isSpaceHeld();
    const actionVehicle = Boolean(actions & ACTION_VEHICLE);

    const inputData = {
      left: vec.x < -0.2,
      right: vec.x > 0.2,
      up: vec.y < -0.2,
      down: vec.y > 0.2,
      sprint: isSprinting,
      action: actionVehicle,
      brake: isBraking,
    };

    if (actionVehicle) {
      playSound('car_door');
      if (world.state.player.inVehicle) {
        announce('Exited vehicle.');
      } else {
        announce('Entered vehicle. Drive with WASD, drift with SPACE.');
      }
    }

    const events = world.step(STEP, inputData, false);
    updateCombat(STEP);

    if (events & EVENT_OVER || world.state.player.health <= 0) {
      endGame();
    } else if (events & EVENT_HIT) {
      playSound('hit');
    } else if (events & EVENT_COIN) {
      playSound('mission_pass');
      announce(`Mission Completed! +$${world.state.missions[world.state.activeMissionIdx - 1]?.reward || 2500}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    const actions = handleActions();

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(actions);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Retro Horizon VI: Neon Shores. Press Space or Click to Start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
