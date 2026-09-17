import { useCallback, useEffect, useRef, useState } from 'react'

type FanAudioGraph = {
  context: AudioContext
  master: GainNode
  airflow: GainNode
  motor: GainNode
  filter: BiquadFilterNode
  oscillator: OscillatorNode
  noise: AudioBufferSourceNode
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function createFanGraph() {
  const context = new AudioContext()
  const master = context.createGain()
  const airflow = context.createGain()
  const motor = context.createGain()
  const filter = context.createBiquadFilter()
  const highPass = context.createBiquadFilter()
  const oscillator = context.createOscillator()
  const noise = context.createBufferSource()
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const channel = buffer.getChannelData(0)
  let previous = 0
  for (let index = 0; index < channel.length; index += 1) {
    // Correlated noise is smoother than raw white noise and reads as moving air.
    previous = previous * .96 + (Math.random() * 2 - 1) * .14
    channel[index] = previous
  }
  noise.buffer = buffer
  noise.loop = true
  highPass.type = 'highpass'
  highPass.frequency.value = 105
  filter.type = 'lowpass'
  filter.frequency.value = 750
  filter.Q.value = .35
  oscillator.type = 'sine'
  oscillator.frequency.value = 48
  master.gain.value = 0
  airflow.gain.value = .01
  motor.gain.value = .002
  noise.connect(highPass).connect(filter).connect(airflow).connect(master)
  oscillator.connect(motor).connect(master)
  master.connect(context.destination)
  noise.start()
  oscillator.start()
  return { context, master, airflow, motor, filter, oscillator, noise }
}

export function useFanAudio(rpm: number) {
  const graph = useRef<FanAudioGraph | null>(null)
  const [enabled, setEnabled] = useState(false)

  const setLevels = useCallback((nextRpm: number, isEnabled: boolean) => {
    const active = graph.current
    if (!active) return
    const amount = clamp((nextRpm - 650) / 1250, 0, 1)
    const now = active.context.currentTime
    const ramp = (parameter: AudioParam, value: number) => {
      parameter.setTargetAtTime(value, now, .35)
    }
    ramp(active.master.gain, isEnabled && nextRpm > 20 ? .62 : 0)
    ramp(active.airflow.gain, .006 + amount * .045)
    ramp(active.motor.gain, .0012 + amount * .006)
    ramp(active.filter.frequency, 560 + amount * 900)
    ramp(active.oscillator.frequency, 43 + amount * 22)
  }, [])

  const toggle = useCallback(async () => {
    try {
      if (!graph.current) graph.current = createFanGraph()
      if (enabled) { setEnabled(false); return }
      await graph.current.context.resume()
      if (graph.current.context.state === 'running') setEnabled(true)
    } catch { setEnabled(false) }
  }, [enabled])

  useEffect(() => { setLevels(rpm, enabled) }, [rpm, enabled, setLevels])
  useEffect(() => () => {
    const active = graph.current
    if (!active) return
    active.noise.stop()
    active.oscillator.stop()
    graph.current = null
    void active.context.close().catch(() => {})
  }, [])

  return { fanSoundEnabled: enabled, toggleFanSound: toggle }
}
