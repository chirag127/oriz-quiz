// Tiny canvas confetti — no dependency. Fires a burst; self-cleans.
export function confettiBurst(count = 120): void {
  if (typeof document === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const canvas = document.createElement('canvas')
  canvas.className = 'confetti-canvas'
  canvas.width = innerWidth
  canvas.height = innerHeight
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.remove()
  const colors = ['#f2d35b', '#e23b3b', '#7fc4e8', '#f29fb8', '#f4f1e8', '#4ade80']
  const parts = Array.from({ length: count }, () => ({
    x: innerWidth / 2,
    y: innerHeight / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 8 + 4,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    life: 1,
  }))
  let raf = 0
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = false
    for (const p of parts) {
      p.vy += 0.4
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life -= 0.008
      if (p.life > 0 && p.y < canvas.height) {
        alive = true
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
    }
    if (alive) raf = requestAnimationFrame(tick)
    else canvas.remove()
  }
  raf = requestAnimationFrame(tick)
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove() }, 4000)
}
