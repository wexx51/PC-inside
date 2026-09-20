import type { ScreenState } from '../system/monitorState'

// Draw into the existing canvas; no textures or Three.js objects are allocated here.
export function paintMonitor(ctx: CanvasRenderingContext2D, state: ScreenState, detail: string, progress: number) {
  const { width: w, height: h } = ctx.canvas
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (state === 'OFF') return
  const text = (value: string, x: number, y: number, size = 28, color = '#d8f5ff') => {
    ctx.font = `${size}px monospace`
    ctx.fillStyle = color
    ctx.fillText(value, x, y)
  }
  if (state === 'FIRMWARE' || state === 'POST') {
    text('PC INSIDE UEFI', 80, 110, 48)
    text('EDUCATIONAL FIRMWARE', 80, 165, 24, '#78b9c9')
    if (state === 'FIRMWARE') {
      text('Starting platform firmware...', 80, 300)
      text('Preparing hardware checks', 80, 370)
    } else {
      detail.split('\n').forEach((line, index) => text(line, 80, 280 + index * 70, 30, index === 4 ? '#71e5d3' : '#d8f5ff'))
    }
    return
  }
  if (state === 'BOOTLOADER') {
    text('PC INSIDE / BOOT MANAGER', 80, 150, 42)
    text('BOOT DEVICE: NVME SSD', 80, 310, 32)
    text('LOADING OPERATING SYSTEM...', 80, 400, 32, '#71e5d3')
    return
  }
  if (state === 'OS_LOADING') {
    text('PC INSIDE OS', 240, 270, 64)
    text(detail, 240, 355, 30)
    ctx.fillStyle = '#254250'
    ctx.fillRect(240, 415, 800, 14)
    ctx.fillStyle = '#71e5d3'
    ctx.fillRect(240, 415, 800 * progress, 14)
    text(`${Math.round(progress * 100)}%`, 240, 490, 24, '#71e5d3')
    return
  }
  ctx.fillStyle = '#152c3c'
  ctx.fillRect(0, 0, w, h)
  text('PC INSIDE OS', 50, 65, 30)
  text('SYSTEM READY', 980, 65, 24, '#71e5d3')
  const labels = ['Browser', 'Files', 'Terminal']
  labels.forEach((label, index) => {
    const x = 80 + index * 260
    ctx.fillStyle = ['#497bba', '#408b89', '#3e536a'][index]
    ctx.fillRect(x, 180, 100, 85)
    text(['WWW', '[]', '>_'][index], x + 16, 235, 30)
    text(label, x, 310, 26)
  })
  text('Your computer is ready.', 80, 480, 32)
  ctx.fillStyle = '#091822'
  ctx.fillRect(0, h - 70, w, 70)
  text('PC INSIDE  /  WORKSPACE', 45, h - 26, 24)
}
