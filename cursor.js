// Glowing cursor trail: a soft halo that follows the pointer plus pixel sparks.
(() => {
  const canvas = document.getElementById('cursor-glow');
  if (!canvas) return;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduceMotion) { canvas.remove(); return; }

  const ctx = canvas.getContext('2d');
  const palette = ['#2f6bff', '#6aa8ff', '#ffd23f', '#ff8a3d', '#b48cff'];
  const sparks = [];
  let dpr = 1, w = 0, h = 0;
  let mouse = null, halo = null, last = null, running = false, hue = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    mouse = { x: e.clientX, y: e.clientY };
    if (!halo) halo = { ...mouse };
    if (last) {
      const dx = mouse.x - last.x, dy = mouse.y - last.y;
      const dist = Math.hypot(dx, dy);
      const count = Math.min(6, Math.floor(dist / 7) + 1);
      for (let i = 0; i < count; i++) {
        const t = i / count;
        sparks.push({
          x: last.x + dx * t + (Math.random() - .5) * 6,
          y: last.y + dy * t + (Math.random() - .5) * 6,
          vx: (Math.random() - .5) * .8,
          vy: (Math.random() - .5) * .8 - .25,
          size: 3 + Math.floor(Math.random() * 3) * 2,
          life: 1,
          decay: .018 + Math.random() * .02,
          color: palette[(hue + i) % palette.length]
        });
      }
      hue = (hue + 1) % palette.length;
      if (sparks.length > 260) sparks.splice(0, sparks.length - 260);
    }
    last = { ...mouse };
    if (!running) { running = true; requestAnimationFrame(frame); }
  });
  document.addEventListener('mouseleave', () => { mouse = null; last = null; });

  function frame() {
    ctx.clearRect(0, 0, w, h);

    if (mouse && halo) {
      halo.x += (mouse.x - halo.x) * .22;
      halo.y += (mouse.y - halo.y) * .22;
      const g = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, 70);
      g.addColorStop(0, 'rgba(120,170,255,.32)');
      g.addColorStop(.45, 'rgba(255,210,80,.12)');
      g.addColorStop(1, 'rgba(255,210,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(halo.x - 70, halo.y - 70, 140, 140);
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const px = Math.round(s.x), py = Math.round(s.y), sz = s.size;
      ctx.globalAlpha = s.life * .35;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = s.color;
      ctx.fillRect(px - sz, py - sz, sz * 2, sz * 2);
      ctx.globalAlpha = s.life;
      ctx.shadowBlur = 8;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (sparks.length || mouse) requestAnimationFrame(frame);
    else running = false;
  }
})();
