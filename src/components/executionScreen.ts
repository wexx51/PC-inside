import { executionDefinition, executionStages, type ExecutionSnapshot } from '../system/executionMachine'

// Composites the application onto the existing desktop canvas and texture.
export function paintExecution(ctx: CanvasRenderingContext2D, execution: ExecutionSnapshot) {
  const { state, progress } = execution
  if (state === 'IDLE') return
  const index = executionStages.findIndex(stage => stage[0] === state)
  const text = (value: string, x: number, y: number, size = 26) => { ctx.fillStyle = '#d8f5ff'; ctx.font = `${size}px monospace`; ctx.fillText(value, x, y) }
  if (state === 'USER_INPUT') {
    const t = Math.min(1, progress / .7), x = 700 + (128 - 700) * t, y = 540 + (225 - 540) * t
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+9,y+31); ctx.lineTo(x+17,y+20); ctx.lineTo(x+30,y+18); ctx.closePath(); ctx.fill()
    if (progress >= .7) { ctx.strokeStyle = '#71e5d3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(130,225,30 + (progress-.7)*60,0,Math.PI*2); ctx.stroke(); text('CLICK',190,240) }
    return
  }
  if (index < 6) { ctx.fillStyle = '#091822'; ctx.fillRect(55,370,1160,190); text('Starting Browser...',80,425,34); text(executionDefinition(state)[1],80,495); return }
  ctx.fillStyle = '#203b4e'; ctx.fillRect(55,100,1170,535)
  text('PC INSIDE BROWSER',80,145,30); text('−  □  ×',1050,145)
  if (state === 'CPU_EXECUTION') { text(['FETCH','DECODE','EXECUTE'][Math.min(2,Math.floor(progress*3))],100,290,40); text('Constructing application window...',100,380); return }
  ctx.fillStyle = '#0c1c29'; ctx.fillRect(75,175,1130,55); text('‹  ›  ↻',90,212)
  text(index >= 10 ? 'example.com' : 'inside://new-tab',260,212)
  ctx.fillStyle = '#142c39'; ctx.fillRect(75,245,1130,365)
  if (state === 'PAGE_READY' || (state === 'PAGE_RENDER' && progress >= .6)) {
    text('PC INSIDE NETWORK DEMO',110,330,42)
    text('Connection established',110,420,30)
    text('Page loaded successfully',110,475,30)
    text('Local educational simulation · no real request',110,560,23)
  } else if (index >= 10) {
    text('Loading example.com...',110,325,36); text(executionDefinition(state)[1],110,405)
    ctx.fillStyle = '#71e5d3'; ctx.fillRect(110,460,1020*((index-10+progress)/5),8)
  } else { text('New tab',110,325,44); text(state === 'GPU_RENDER' ? 'Rendering browser interface...' : 'Ready to explore.',110,420,30) }
}
