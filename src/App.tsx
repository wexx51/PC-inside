import { useCallback, useEffect, useState } from 'react'
import { Activity, Box, CircuitBoard, Cpu, Crosshair, Database, Gauge, Layers3, Power, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react'
import { PCScene, type ProcessMode } from './components/PCScene'
import { componentData, type ComponentId } from './data/components'
import { localizeComponent, localizePhase, ui, type Locale, type UiKey } from './i18n'
import { useFanAudio } from './hooks/useFanAudio'
import { useSimulation, workloads, type LoadMode } from './hooks/useSimulation'
import { bootPhases, useBootController, type PhaseDefinition } from './system/bootMachine'
import './App.css'
import './Boot.css'

const processModes: ProcessMode[] = ['OVERVIEW', 'POWER', 'CPU TASK', 'MEMORY', 'GRAPHICS', 'STORAGE', 'COOLING']
const processLabelsRu: Record<ProcessMode,string> = {OVERVIEW:'ОБЗОР',POWER:'ПИТАНИЕ','CPU TASK':'ЗАДАЧА CPU',MEMORY:'ПАМЯТЬ',GRAPHICS:'ГРАФИКА',STORAGE:'НАКОПИТЕЛЬ',COOLING:'ОХЛАЖДЕНИЕ'}

export default function App() {
  const [selected, setSelected] = useState<ComponentId | null>(null)
  const [internal, setInternal] = useState(true)
  const [architecture, setArchitecture] = useState(false)
  const [dataFlow, setDataFlow] = useState(true)
  const [powerFlow, setPowerFlow] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [loadMode, setLoadMode] = useState<LoadMode>('NORMAL LOAD')
  const [processMode, setProcessMode] = useState<ProcessMode>('OVERVIEW')
  const [resetToken, setResetToken] = useState(0)
  const [focusToken, setFocusToken] = useState(0)
  const [autoTour, setAutoTour] = useState(false)
  const [explainMode, setExplainMode] = useState(true)
  const [explanationClosed, setExplanationClosed] = useState(false)
  const [presentation, setPresentation] = useState(false)
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('pc-inside-locale') === 'ru' ? 'ru' : 'en')
  const boot = useBootController()
  const { metrics, fanRpm } = useSimulation(loadMode, boot.phase)
  const { fanSoundEnabled, toggleFanSound } = useFanAudio(fanRpm)
  const isOff = boot.phase === 'poweredOff'
  const isRunning = boot.phase === 'running'
  const isShuttingDown = boot.phase === 'shuttingDown'
  const d = selected ? localizeComponent(componentData[selected], locale) : null
  const definition = localizePhase(boot.definition, locale)
  const t = (key: UiKey) => ui[locale][key]

  useEffect(() => {
    document.documentElement.lang = locale
    localStorage.setItem('pc-inside-locale', locale)
  }, [locale])

  const stopTour = useCallback(() => setAutoTour(false), [])
  const toggleTour = () => {
    if (autoTour) {
      setAutoTour(false)
      setSelected(null)
      setExploded(false)
      setResetToken(n => n + 1)
    } else {
      setExplanationClosed(false)
      setAutoTour(true)
    }
  }
  const choose = useCallback((id: ComponentId) => {
    setAutoTour(false)
    setSelected(id)
    setFocusToken(n => n + 1)
    if (id !== 'case') setInternal(true)
    setArchitecture(false)
    setExploded(false)
  }, [])

  useEffect(() => {
    if (!autoTour || isOff || isShuttingDown) return
    const cue = boot.definition.cameraCue
    if (!cue) return
    // Phase changes intentionally coordinate the existing camera director.
    // eslint-disable-next-line react/set-state-in-effect
    setInternal(true)
    setSelected(cue === 'hero' ? null : cue)
    setFocusToken(n => n + 1)
  }, [autoTour, boot.phase, boot.definition.cameraCue, isOff, isShuttingDown])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!presentation) return
      if (event.code === 'Space') { event.preventDefault(); boot.togglePlay() }
      if (event.key === 'ArrowRight') boot.next()
      if (event.key === 'ArrowLeft') boot.previous()
      if (event.key.toLowerCase() === 'r') boot.repeat()
      if (event.key === 'Escape') {
        setPresentation(false)
        if (document.fullscreenElement) void document.exitFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentation, boot])

  const powerAction = () => {
    setArchitecture(false)
    setAutoTour(false)
    if (isOff) boot.powerOn()
    else if (!isShuttingDown) boot.shutdown()
  }
  const guidedTour = () => {
    setArchitecture(false)
    setInternal(true)
    setAutoTour(true)
    setExploded(false)
    setExplanationClosed(false)
    boot.restart()
  }
  const selectProcess = (mode: ProcessMode) => {
    setProcessMode(mode)
    if (mode === 'POWER') setPowerFlow(true)
    else if (mode !== 'COOLING') setDataFlow(true)
  }
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }

  const status = isOff ? t('systemOff') : isShuttingDown ? t('shuttingDown') : isRunning ? t('systemReady') : boot.playing ? t('bootSequence') : t('bootPaused')
  return <main className={`app-shell ${presentation ? 'presentation-mode' : ''}`} data-system-phase={boot.phase} data-phase-progress={boot.progress.toFixed(3)} data-playing={boot.playing} data-camera-tour={autoTour ? 'active' : 'manual'}>
    <div className="atmosphere" />
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><CircuitBoard size={17} /></span><div>PC <b>INSIDE</b><small>{t('subtitle')}</small></div></div>
      <nav><button className={!architecture ? 'active' : ''} onClick={() => setArchitecture(false)}>{t('lab')}</button><button onClick={() => { setArchitecture(false); document.querySelector('.telemetry')?.scrollIntoView() }}>{t('system')}</button><button onClick={() => document.getElementById('explorer')?.scrollIntoView()}>{t('components')}</button><button onClick={() => setArchitecture(v => !v)} className={architecture ? 'active' : ''}>{t('architecture')}</button></nav>
      <div className="language-switch" aria-label="Language"><button className={locale==='ru'?'active':''} onClick={()=>setLocale('ru')}>RU</button><button className={locale==='en'?'active':''} onClick={()=>setLocale('en')}>EN</button></div>
      <div className={`ready ${isOff ? 'off' : ''}`}><i className={!isRunning ? 'amber' : ''} />{status}</div>
    </header>

    {architecture ? <Architecture close={() => setArchitecture(false)} locale={locale} /> : <>
      <section className="viewport">
        <div className="viewport-label"><span>{t('liveModel')}</span><b>{internal ? t('internalOpen') : t('externalSealed')}</b></div>
        <PCScene selected={selected} onSelect={choose} internal={internal} dataFlow={dataFlow} powerFlow={powerFlow} exploded={exploded} load={metrics[1]} fanRpm={fanRpm} cpuTemp={metrics[2]} gpuTemp={metrics[3]} systemPhase={boot.phase} systemProgress={boot.progress} processMode={processMode} resetToken={resetToken} focusToken={focusToken} guidedTour={autoTour} cameraPaused={!boot.playing && !isRunning} onManualCamera={stopTour} />
        <div className="scene-hint"><Crosshair size={13} /> {t('drag')} <span /> {t('zoom')}</div>
        <div className="view-switch"><button className={!internal ? 'selected' : ''} onClick={() => setInternal(false)}>{t('external')}</button><button className={internal ? 'selected' : ''} onClick={() => setInternal(true)}>{t('internal')}</button></div>
        {!isOff && !explanationClosed && <ProcessCard definition={definition} progress={boot.progress} explain={explainMode} presentation={presentation} locale={locale} onClose={() => { setExplanationClosed(true); setExplainMode(false) }} />}
        {explainMode && !isOff && <div className="component-callouts" aria-label="Active components">{boot.definition.components.map(component => <span key={component}>{component}</span>)}</div>}
        <ColorLegend />
      </section>

      <aside className="telemetry panel"><div className="panel-kicker"><Activity size={14} /> {t('telemetry')} <span>{isOff ? t('off') : isRunning ? t('live') : t('startup')}</span></div><Metric active={!isOff} icon={<Cpu />} name="CPU / RYZEN CORE" value={metrics[0]} temp={metrics[2]} color="#32d7cf" /><Metric active={!isOff} icon={<Gauge />} name="GPU / VECTOR 4080" value={metrics[1]} temp={metrics[3]} color="#a78bfa" /><Metric active={!isOff} icon={<Database />} name={t('memory')} value={metrics[4]} temp={null} color="#50e3a4" /><div className="io-row"><span>{t('storageActivity')}</span><b>{isOff ? t('off') : `${Math.max(0, Math.round(metrics[0] * .86))} MB/s`}</b></div><div className="io-row"><span>{t('cooling')}</span><b>{Math.round(fanRpm)} RPM</b></div></aside>

      <section id="explorer" className="explorer panel"><div className="panel-kicker"><Layers3 size={14} /> {t('componentExplorer')}</div>{Object.values(componentData).map((baseItem, i) => {const item=localizeComponent(baseItem,locale);return <button key={item.id} onClick={() => choose(item.id)} className={selected === item.id ? 'component active' : 'component'}><span>0{i + 1}</span><i style={{ background: item.color }} /><b>{item.short}</b><em>{item.category}</em></button>})}</section>

      <aside className={'info-panel panel ' + (d ? 'visible' : '')}>{d ? <><div className="info-top"><div><span className="eyebrow">{d.category}</span><h1>{d.name}</h1></div><button aria-label="Close details" onClick={() => setSelected(null)}>×</button></div><div className="status"><i /> {isOff ? t('offline') : t('online')} <span>{selected === 'cpu' ? `${metrics[2]}°C · 4.8 GHz` : selected === 'gpu' ? `${metrics[3]}°C · ${metrics[1]}% ${t('load')}` : selected === 'cooling' ? `${Math.round(fanRpm)} RPM` : d.stat}</span></div><p>{d.description}</p><div className="data-route"><span>{t('dataPath')}</span><strong>{d.route}</strong></div><div className="parts"><span>{t('primarySystems')}</span>{d.parts.map(part => <b key={part}>{part}</b>)}</div>{(['gpu', 'cpu', 'motherboard'] as ComponentId[]).includes(selected!) && <button className={'explode ' + (exploded ? 'on' : '')} onClick={() => setExploded(v => !v)}><Box size={15} />{exploded ? t('assemble') : t('explode')}</button>}</> : <Empty locale={locale} />}</aside>

      <section className="boot-console panel" aria-label="Boot sequence controls">
        <div className="boot-status"><span>{t('bootController')}</span><b>{definition.number} / {definition.title}</b></div>
        <div className="boot-progress"><i style={{ width: `${isRunning ? 100 : Math.round(((Math.max(1, boot.index) - 1 + boot.progress) / bootPhases.length) * 100)}%` }} /></div>
        <div className="boot-buttons"><button onClick={boot.togglePlay}>{boot.playing ? t('pause') : t('play')}</button><button onClick={boot.previous}>{t('previous')}</button><button onClick={boot.next}>{t('next')}</button><button onClick={boot.restart}>{t('restart')}</button><button onClick={boot.skipToRunning}>{t('skip')}</button></div>
        <div className="tour-controls"><button className={autoTour ? 'on' : ''} onClick={toggleTour}>{t('autoTour')} {autoTour ? t('on') : t('off')}</button><button onClick={guidedTour}>{t('guidedTour')}</button><button className={explainMode ? 'on' : ''} onClick={() => { setExplanationClosed(false); setExplainMode(v => !v) }}>{t('explainMode')}</button><button className={presentation ? 'on' : ''} onClick={() => setPresentation(v => !v)}>{t('presentationMode')}</button>{presentation && <button onClick={() => void toggleFullscreen()}>{t('fullscreen')}</button>}</div>
      </section>

      {isRunning && <section className="process-selector panel"><span>{t('processVisualization')}</span>{processModes.map(mode => <button key={mode} className={processMode === mode ? 'active' : ''} onClick={() => selectProcess(mode)}>{locale==='ru'?processLabelsRu[mode]:mode}</button>)}</section>}

      <footer className="controls"><button className={`power ${!isOff ? 'shutdown' : ''}`} disabled={isShuttingDown} onClick={powerAction}><Power size={16} /> {isOff ? t('powerOn') : isShuttingDown ? t('shuttingDown') : t('shutDown')}</button><button onClick={() => { setSelected(null); setResetToken(x => x + 1); setAutoTour(false) }}><RotateCcw size={15} /> {t('resetView')}</button><button className={dataFlow ? 'toggle on' : 'toggle'} onClick={() => setDataFlow(v => !v)}><Sparkles size={15} /> {t('dataFlow')}</button><button className={powerFlow ? 'toggle power-on' : 'toggle'} onClick={() => setPowerFlow(v => !v)}><Zap size={15} /> {t('powerFlow')}</button><button className={fanSoundEnabled ? 'toggle on' : 'toggle'} onClick={() => void toggleFanSound()} aria-pressed={fanSoundEnabled}>{fanSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} {fanSoundEnabled ? t('soundOn') : t('soundOff')}</button><div className="load"><span>{t('workload')}</span>{(Object.keys(workloads) as LoadMode[]).map(mode => <button disabled={!isRunning} onClick={() => setLoadMode(mode)} className={loadMode === mode ? 'selected' : ''} key={mode}>{mode==='IDLE'?t('idle'):mode==='NORMAL LOAD'?t('normal'):t('high')}</button>)}</div></footer>
    </>}
    <p className="disclaimer">{t('disclaimer')}</p>
  </main>
}

function Metric({ icon, name, value, temp, color, active }: { icon: React.ReactNode; name: string; value: number; temp: number | null; color: string; active: boolean }) { return <div className={`metric ${active ? '' : 'metric-off'}`}><div className="metric-name">{icon}<span>{name}</span><b>{active ? `${value}%` : 'OFF'}</b></div><div className="meter"><i style={{ width: active ? value + '%' : '0%', background: color }} /></div><small>{active ? temp === null ? '13.1 / 32 GB' : temp + '°C' : 'STANDBY'}<em>{temp === null ? 'USAGE' : 'THERMAL'}</em></small></div> }
function Empty({locale}:{locale:Locale}) { const t=(key:UiKey)=>ui[locale][key];return <div className="empty-info"><div className="orb"><Cpu size={35} /></div><span>{t('inspector')}</span><h2>{t('selectComponent')}</h2><p>{t('selectHelp')}</p></div> }
function ProcessCard({ definition, progress, explain, presentation, locale, onClose }: { definition: PhaseDefinition; progress: number; explain: boolean; presentation: boolean;locale:Locale; onClose: () => void }) { const t=(key:UiKey)=>ui[locale][key];return <article className={`process-card panel ${presentation ? 'large' : ''}`} data-testid="phase-card"><header><span>{definition.number} / {definition.title}</span><b>{Math.round(progress * 100)}%</b><button className="close-explanation" aria-label={locale === 'ru' ? 'Закрыть пояснение' : 'Close explanation'} onClick={onClose}>×</button></header><div className="phase-meter"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div><p>{definition.description}</p>{explain && <><small>{t('why')}</small><p>{definition.purpose}</p><dl><div><dt>{t('involved')}</dt><dd>{definition.components.join(' · ')}</dd></div><div><dt>{t('route')}</dt><dd>{definition.route}</dd></div></dl></>}</article> }
function ColorLegend() { return <div className="color-legend"><span><i className="power-color" />POWER</span><span><i className="data-color" />DATA</span><span><i className="cpu-color" />CPU</span><span><i className="memory-color" />MEMORY</span><span><i className="gpu-color" />GPU</span><span><i className="heat-color" />HEAT</span><span><i className="cooling-color" />COOLING</span></div> }
function Architecture({ close,locale }: { close: () => void;locale:Locale }) { const t=(key:UiKey)=>ui[locale][key];return <section className="architecture"><div className="architecture-heading"><span>{t('architecture')}</span><h1>{t('architectureTitle')}</h1><p>{t('architectureText')}</p><button onClick={close}>{t('returnLab')}</button></div><div className="arch-diagram"><div className="arch-node cpu">CPU<small>CORES · CACHE</small></div><div className="arch-node ram">RAM<small>32 GB DDR5</small></div><div className="arch-node board">MOTHERBOARD<small>CHIPSET · PCIe</small></div><div className="arch-node ssd">SSD<small>NVMe STORAGE</small></div><div className="arch-node gpu">GPU<small>VRAM · RENDER</small></div><div className="arch-node io">I / O<small>NETWORK · USB</small></div><svg viewBox="0 0 800 460"><path d="M260 115L540 115M400 150L400 230M400 280L180 370M400 280L630 370M440 270L720 300" /></svg></div></section> }
