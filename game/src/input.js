// Keyboard + mouse input state.
export const keys = {};
export function bindInput(canvas, onFire, onKey) {
  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key.toLowerCase()] = true; if (onKey) onKey(e.key.toLowerCase());
  });
  addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('mousedown', () => { if (onFire) onFire(); });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
}
export const axis = () => ({
  f: (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0),
  s: (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0),
  run: !!keys['shift'],
});
