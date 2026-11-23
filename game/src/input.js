// Keyboard, mouse, and touch input for open-world crime gameplay in Vice Shores.
// Tracks continuous movement vectors, sprint state, vehicle entry/exit, combat actions,
// and screen-space aiming coordinates with resilient focus/blur handling.

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;
export const ACTION_VEHICLE = 1 << 2;  // Enter or exit nearest vehicle (F / E / Enter)
export const ACTION_ATTACK = 1 << 3;   // Melee attack or firearm shot (Space / Left Click)
export const ACTION_HANDBRAKE = 1 << 4;// Vehicle handbrake / drift (Space)
export const ACTION_WEAPON_NEXT = 1 << 5; // Cycle weapon (Tab / Q / Digit)
export const ACTION_RADIO = 1 << 6;    // Cycle radio station (R)
export const ACTION_HORN = 1 << 7;     // Vehicle horn / siren (H)

const KEY_UP = new Set(['KeyW', 'ArrowUp']);
const KEY_DOWN = new Set(['KeyS', 'ArrowDown']);
const KEY_LEFT = new Set(['KeyA', 'ArrowLeft']);
const KEY_RIGHT = new Set(['KeyD', 'ArrowRight']);
const KEY_SPRINT = new Set(['ShiftLeft', 'ShiftRight']);
const KEY_VEHICLE = new Set(['KeyF', 'KeyE', 'Enter']);
const KEY_CONFIRM = new Set(['Space', 'Enter']);
const KEY_PAUSE = new Set(['KeyP', 'Escape']);
const KEY_RADIO = new Set(['KeyR']);
const KEY_HORN = new Set(['KeyH']);
const KEY_WEAPON = new Set(['KeyQ', 'Tab']);

export function createInput(target) {
  let moveUp = false;
  let moveDown = false;
  let moveLeft = false;
  let moveRight = false;
  let sprint = false;
  let spaceHeld = false;
  let mouseDown = false;
  let actions = 0;

  const mouse = {
    x: 0,
    y: 0,
    down: false,
  };

  function updateMousePos(event) {
    const rect = target.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  }

  window.addEventListener('keydown', (event) => {
    // Avoid default browser scrolling on game keys
    if (
      event.code.startsWith('Arrow') ||
      event.code === 'Space' ||
      event.code === 'KeyW' ||
      event.code === 'KeyS' ||
      event.code === 'KeyA' ||
      event.code === 'KeyD'
    ) {
      event.preventDefault();
    }

    if (KEY_UP.has(event.code)) moveUp = true;
    else if (KEY_DOWN.has(event.code)) moveDown = true;
    else if (KEY_LEFT.has(event.code)) moveLeft = true;
    else if (KEY_RIGHT.has(event.code)) moveRight = true;
    else if (KEY_SPRINT.has(event.code)) sprint = true;

    if (event.code === 'Space') {
      spaceHeld = true;
      if (!event.repeat) {
        actions |= ACTION_ATTACK;
        actions |= ACTION_CONFIRM;
        actions |= ACTION_HANDBRAKE;
      }
    } else if (KEY_VEHICLE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_VEHICLE;
    } else if (KEY_CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (KEY_PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (KEY_RADIO.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RADIO;
    } else if (KEY_HORN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HORN;
    } else if (KEY_WEAPON.has(event.code)) {
      if (!event.repeat) actions |= ACTION_WEAPON_NEXT;
    } else if (event.code.startsWith('Digit') && !event.repeat) {
      actions |= ACTION_WEAPON_NEXT;
    }
  });

  window.addEventListener('keyup', (event) => {
    if (KEY_UP.has(event.code)) moveUp = false;
    else if (KEY_DOWN.has(event.code)) moveDown = false;
    else if (KEY_LEFT.has(event.code)) moveLeft = false;
    else if (KEY_RIGHT.has(event.code)) moveRight = false;
    else if (KEY_SPRINT.has(event.code)) sprint = false;
    else if (event.code === 'Space') spaceHeld = false;
  });

  window.addEventListener('blur', () => {
    moveUp = false;
    moveDown = false;
    moveLeft = false;
    moveRight = false;
    sprint = false;
    spaceHeld = false;
    mouseDown = false;
    mouse.down = false;
  });

  target.addEventListener('pointermove', (event) => {
    updateMousePos(event);
  });

  target.addEventListener('pointerdown', (event) => {
    updateMousePos(event);
    mouseDown = true;
    mouse.down = true;
    actions |= ACTION_CONFIRM;
    actions |= ACTION_ATTACK;
  });

  window.addEventListener('pointerup', () => {
    mouseDown = false;
    mouse.down = false;
  });

  return {
    /** 2D directional movement vector [-1..1, -1..1] */
    vector() {
      let dx = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
      let dy = (moveDown ? 1 : 0) - (moveUp ? 1 : 0);
      if (dx !== 0 && dy !== 0) {
        // Normalize diagonal movement
        const invLen = 1 / Math.SQRT2;
        dx *= invLen;
        dy *= invLen;
      }
      return { x: dx, y: dy };
    },

    /** 1D horizontal direction (-1, 0, 1) for compatibility */
    direction() {
      return (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
    },

    /** Whether sprint (Shift) is currently active */
    isSprinting() {
      return sprint;
    },

    /** Whether space/handbrake is currently held */
    isSpaceHeld() {
      return spaceHeld;
    },

    /** Current mouse screen coordinate and press state */
    getMouse() {
      return { x: mouse.x, y: mouse.y, down: mouse.down };
    },

    /** Consumes one-shot action flags */
    takeActions() {
      const current = actions;
      actions = 0;
      return current;
    },
  };
}
