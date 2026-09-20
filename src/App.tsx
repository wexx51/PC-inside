import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, Box, CircuitBoard, Cpu, Crosshair, Database, Gauge, GraduationCap, Layers3, Power, RotateCcw, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react'
import { PCScene } from './components/PCScene'
import { componentData, componentList, componentNames, type ComponentId } from './data/components'
import { architectureConcepts, assignment, assignmentRussian, motherboardConnections, executionLessons, executionModes, requiredConceptIds, storageComparison, type ExecutionMode } from './data/education'
import { localizeComponent, localizePhase, ui, type Locale, type UiKey } from './i18n'
import { useFanAudio } from './hooks/useFanAudio'
import { useSimulation, workloads, type LoadMode } from './hooks/useSimulation'
import { bootPhases, useBootController, type PhaseDefinition, type SystemPhase } from './system/bootMachine'
import { useExecutionController } from './system/executionMachine'
import { ExecutionPanel } from './components/ExecutionPanel'
import { PresentationDeck } from './components/PresentationDeck'
import { presentationSteps } from './data/presentation'
import { bootConsoleLines } from './system/bootConsole'
import './App.css'
import './Boot.css'
import './Academic.css'

const processLabelsRu: Record<ExecutionMode,string> = {OVERVIEW:'ОБЗОР',POWER:'ПИТАНИЕ','CPU TASK':'ЦИКЛ CPU',MEMORY:'ПАМЯТЬ',GRAPHICS:'ГРАФИКА',STORAGE:'НАКОПИТЕЛЬ','I/O':'ВВОД / ВЫВОД',NETWORK:'СЕТЬ',APPLICATION:'ПРИЛОЖЕНИЕ',COOLING:'ОХЛАЖДЕНИЕ'}

export default function App() {
  const [selected, setSelected] = useState<ComponentId | null>(null)
  const [internal, setInternal] = useState(true)
  const [architecture, setArchitecture] = useState(false)
  const [about, setAbout] = useState(false)
  const [dataFlow, setDataFlow] = useState(true)
  const [powerFlow, setPowerFlow] = useState(false)
  const [exploded, setExploded] = useState(false)
  const [loadMode, setLoadMode] = useState<LoadMode>('NORMAL LOAD')
  const [processMode, setProcessMode] = useState<ExecutionMode>('OVERVIEW')
  const [resetToken, setResetToken] = useState(0)
  const [deskToken, setDeskToken] = useState(0)
  const [focusToken, setFocusToken] = useState(0)
  const [autoTour, setAutoTour] = useState(false)
  const [explainMode, setExplainMode] = useState(true)
  const [explanationClosed, setExplanationClosed] = useState(false)
  const [presentation, setPresentation] = useState(false)
  const [presentationStep, setPresentationStep] = useState(0)
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('pc-inside-locale') === 'ru' ? 'ru' : 'en')
  const boot = useBootController()
  const { metrics, fanRpm } = useSimulation(loadMode, boot.phase)
  const { fanSoundEnabled, toggleFanSound } = useFanAudio(fanRpm)
  const isOff = boot.phase === 'poweredOff'
  const isRunning = boot.phase === 'running'
  const execution = useExecutionController(isRunning)
  const launchBrowser = () => {
    if (!isRunning) return
    setAutoTour(false)
    setSelected('monitor')
    setFocusToken(value => value + 1)
    setInternal(true)
    setExploded(false)
    setDataFlow(true)
    setExplanationClosed(true)
    execution.launch()
  }
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
    setAbout(false)
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
      if (event.key === 'ArrowRight' || event.code === 'Space') { event.preventDefault(); document.querySelector<HTMLButtonElement>('.presentation-next')?.click() }
      if (event.key === 'ArrowLeft') document.querySelector<HTMLButtonElement>('.presentation-back')?.click()
      if (event.key === 'Escape') document.querySelector<HTMLButtonElement>('.presentation-exit')?.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentation])

  const powerAction = () => {
    setArchitecture(false)
    setAbout(false)
    if (isOff) {
      setInternal(true)
      setAutoTour(true)
      setExploded(false)
      setExplainMode(true)
      setExplanationClosed(false)
      boot.powerOn()
    } else if (!isShuttingDown) {
      setAutoTour(false)
      boot.shutdown()
    }
  }
  const guidedTour = () => {
    setArchitecture(false)
    setAbout(false)
    setInternal(true)
    setAutoTour(true)
    setExploded(false)
    setExplainMode(true)
    setExplanationClosed(false)
    boot.restart()
  }
  const selectProcess = (mode: ExecutionMode) => {
    setProcessMode(mode)
    if (mode === 'POWER') setPowerFlow(true)
    else if (mode !== 'COOLING') setDataFlow(true)
  }
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  }
  const showPresentationStep = (requested: number) => {
    const next = Math.max(0, Math.min(presentationSteps[locale].length - 1, requested))
    setPresentationStep(next)
    setAutoTour(false)
    setAbout(false)
    setArchitecture(false)
    setExploded(false)
    setExplanationClosed(true)
    setExplainMode(false)
    setDataFlow(true)
    setPowerFlow(next === 3)
    const focus = (id: ComponentId | null) => {
      setSelected(id)
      if (id) setFocusToken(value => value + 1)
      else setDeskToken(value => value + 1)
    }
    if (next <= 2) {
      boot.goTo('poweredOff')
      execution.reset()
      setInternal(true)
      if (next === 0) { setAbout(true); setSelected(null) }
      else focus(next === 2 ? 'motherboard' : null)
      return
    }
    if (next === 3) { boot.goTo('psuStarting', .75); execution.reset(); focus('psu'); return }
    if (next === 4) { boot.goTo('post', .65); execution.reset(); focus('motherboard'); return }
    if (next === 5) { boot.goTo('bootloader', .45); execution.reset(); focus('ssd'); return }
    if (next === 6) { boot.goTo('osLoading', .45); execution.reset(); focus(null); return }
    boot.goTo('running', 1)
    if (next === 7) execution.reset()
    if (next === 8) execution.show('LOAD_TO_RAM', .45)
    if (next === 9) execution.show('DISPLAY_OUTPUT', .55)
    if (next === 10) execution.show('NETWORK_OUTBOUND', .45)
    if (next === 11) execution.show('NETWORK_RESPONSE', .45)
    if (next === 12) execution.show('PAGE_READY', 1)
    if (next === 13) setArchitecture(true)
    focus(null)
  }
  const enterPresentation = () => { setPresentation(true); showPresentationStep(0) }
  const exitPresentation = () => {
    setPresentation(false)
    setAbout(false)
    setArchitecture(false)
    setAutoTour(false)
    setSelected(null)
    setPowerFlow(false)
    setDeskToken(value => value + 1)
    if (document.fullscreenElement) void document.exitFullscreen()
  }
  const nextPresentation = () => presentationStep === presentationSteps[locale].length - 1 ? exitPresentation() : showPresentationStep(presentationStep + 1)

  const status = isOff ? t('systemOff') : isShuttingDown ? t('shuttingDown') : isRunning ? t('systemReady') : boot.playing ? t('bootSequence') : t('bootPaused')
  return <main className={`app-shell ${presentation ? 'presentation-mode' : ''}`} data-system-phase={boot.phase} data-phase-progress={boot.progress.toFixed(3)} data-playing={boot.playing} data-camera-tour={autoTour ? 'active' : 'manual'} data-presentation-step={presentation ? presentationStep : undefined}>
    <div className="atmosphere" />
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><CircuitBoard size={17} /></span><div>PC <b>INSIDE</b><small>{t('subtitle')}</small></div></div>
      <nav><button className={!architecture && !about ? 'active' : ''} onClick={() => { setArchitecture(false); setAbout(false) }}>{t('lab')}</button><button onClick={() => { setAbout(false); setArchitecture(v => !v) }} className={architecture ? 'active' : ''}>{t('architecture')}</button><button onClick={() => { setArchitecture(false); setAbout(v => !v) }} className={about ? 'active' : ''}>{t('about')}</button></nav>
      <div className="language-switch" aria-label="Language"><button className={locale==='ru'?'active':''} onClick={()=>setLocale('ru')}>RU</button><button className={locale==='en'?'active':''} onClick={()=>setLocale('en')}>EN</button></div>
      <div className={`ready ${isOff ? 'off' : ''}`}><i className={!isRunning ? 'amber' : ''} />{status}</div>
    </header>

    {about ? <About close={() => setAbout(false)} locale={locale} /> : architecture ? <Architecture close={() => setArchitecture(false)} locale={locale} /> : <>
      <section className="viewport">
        <div className="viewport-label"><span>{t('liveModel')}</span><b>{internal ? t('internalOpen') : t('externalSealed')}</b></div>
        <PCScene execution={execution.snapshot} selected={selected} deskToken={deskToken} onSelect={choose} internal={internal} dataFlow={dataFlow} powerFlow={powerFlow} exploded={exploded} load={metrics[1]} fanRpm={fanRpm} cpuTemp={metrics[2]} gpuTemp={metrics[3]} systemPhase={boot.phase} systemProgress={boot.progress} processMode={processMode} resetToken={resetToken} focusToken={focusToken} guidedTour={autoTour} cameraPaused={!presentation && !boot.playing && !isRunning} onManualCamera={stopTour} />
        <div className="scene-hint"><Crosshair size={13} /> {t('drag')} <span /> {t('zoom')}</div>
        <div className="view-switch"><button onClick={() => { setAutoTour(false); setSelected(null); setDeskToken(n => n + 1) }}>SYSTEM / DESK</button><button className={!internal ? 'selected' : ''} onClick={() => setInternal(false)}>{t('external')}</button><button className={internal ? 'selected' : ''} onClick={() => setInternal(true)}>{t('internal')}</button></div>
        {!presentation && !isOff && !explanationClosed && <ProcessCard definition={definition} progress={boot.progress} explain={explainMode} presentation={presentation} locale={locale} onClose={() => { setExplanationClosed(true); setExplainMode(false) }} />}
        {explainMode && !isOff && <div className="component-callouts" aria-label="Active components">{componentNames(boot.definition.componentIds).map(component => <span key={component}>{component}</span>)}</div>}
        <ColorLegend />
      </section>

      <aside className="telemetry panel"><div className="panel-kicker"><Activity size={14} /> {t('telemetry')} <span>{isOff ? t('off') : isRunning ? t('live') : t('startup')}</span></div><Metric active={!isOff} icon={<Cpu />} name="CPU / 8-CORE EXAMPLE" value={metrics[0]} temp={metrics[2]} color="#32d7cf" /><Metric active={!isOff} icon={<Gauge />} name="GPU / PARALLEL EXAMPLE" value={metrics[1]} temp={metrics[3]} color="#a78bfa" /><Metric active={!isOff} icon={<Database />} name={t('memory')} value={metrics[4]} temp={null} color="#50e3a4" /><div className="io-row"><span>{t('storageActivity')}</span><b>{isOff ? t('off') : `${Math.max(0, Math.round(metrics[0] * .86))} MB/s`}</b></div><div className="io-row"><span>{t('cooling')}</span><b>{Math.round(fanRpm)} RPM</b></div></aside>

      <section id="explorer" className="explorer panel"><div className="panel-kicker"><Layers3 size={14} /> {t('componentExplorer')}</div>{componentList.map((baseItem, i) => {const item=localizeComponent(baseItem,locale);return <button key={item.id} onClick={() => choose(item.id)} className={selected === item.id ? 'component active' : 'component'}><span>0{i + 1}</span><i style={{ background: item.color }} /><b>{item.short}</b><em>{item.category}</em></button>})}</section>

      <aside className={'info-panel panel ' + (d ? 'visible' : '')}>{d ? <><div className="info-top"><div><span className="eyebrow">{d.category}</span><h1>{d.name}</h1></div><button aria-label="Close details" onClick={() => setSelected(null)}>×</button></div><div className="status"><i /> {isOff ? t('offline') : t('online')} <span>{selected === 'cpu' ? `${metrics[2]}°C · 4.8 GHz` : selected === 'gpu' ? `${metrics[3]}°C · ${metrics[1]}% ${t('load')}` : selected === 'cooling' ? `${Math.round(fanRpm)} RPM` : d.stat}</span></div><p>{d.description}</p><section className="component-function"><span>{t('function')}</span><p>{d.function}</p></section><div className="data-route"><span>{t('dataPath')}</span><strong>{d.dataPath}</strong></div><div className="parts"><span>{t('specifications')}</span>{d.specifications.map(spec => <b key={spec}>{spec}</b>)}</div><div className="architecture-role"><span>{t('architectureRole')}</span><p>{d.architectureRole}</p><small>{t('related')}: {componentNames(d.relatedComponents).join(' · ')}</small></div>{(['gpu', 'cpu', 'motherboard'] as ComponentId[]).includes(selected!) && <button className={'explode ' + (exploded ? 'on' : '')} onClick={() => setExploded(v => !v)}><Box size={15} />{exploded ? t('assemble') : t('explode')}</button>}</> : <Empty locale={locale} />}</aside>

      <section className="boot-console panel" aria-label="Boot sequence controls">
        <div className="boot-status"><span>{t('bootController')}</span><b>{definition.number} / {definition.title}</b></div>
        <div className="boot-progress"><i style={{ width: `${isRunning ? 100 : Math.round(((Math.max(1, boot.index) - 1 + boot.progress) / bootPhases.length) * 100)}%` }} /></div>
        <BootConsole phase={boot.phase} progress={boot.progress} locale={locale} />
        <div className="boot-buttons"><button onClick={boot.togglePlay}>{boot.playing ? t('pause') : t('play')}</button><button onClick={boot.previous}>{t('previous')}</button><button onClick={boot.next}>{t('next')}</button><button onClick={boot.restart}>{t('restart')}</button><button onClick={boot.skipToRunning}>{t('skip')}</button></div>
        <div className="tour-controls"><button className={autoTour ? 'on' : ''} onClick={toggleTour}>{t('autoTour')} {autoTour ? t('on') : t('off')}</button><button onClick={guidedTour}>{t('guidedTour')}</button><button className={explainMode ? 'on' : ''} onClick={() => { setExplanationClosed(false); setExplainMode(v => !v) }}>{t('explainMode')}</button><button onClick={enterPresentation}>{t('presentationMode')}</button></div>
      </section>

      {isRunning && <><section className="process-selector panel"><span>{t('processVisualization')}</span>{executionModes.map(mode => <button key={mode} className={processMode === mode ? 'active' : ''} onClick={() => selectProcess(mode)}>{locale==='ru'?processLabelsRu[mode]:mode}</button>)}</section>{execution.snapshot.state === 'IDLE' && executionLessons[processMode] && <ExecutionLesson mode={processMode} locale={locale} />}</>}

      <ExecutionPanel snapshot={execution.snapshot} ready={isRunning} launch={launchBrowser} loadWebsite={execution.loadWebsite} />
      <footer className="controls"><button className={`power ${!isOff ? 'shutdown' : ''}`} disabled={isShuttingDown} onClick={powerAction}><Power size={16} /> {isOff ? t('powerOn') : isShuttingDown ? t('shuttingDown') : t('shutDown')}</button><button onClick={() => { setSelected(null); setResetToken(x => x + 1); setAutoTour(false) }}><RotateCcw size={15} /> {t('resetView')}</button><button className={dataFlow ? 'toggle on' : 'toggle'} onClick={() => setDataFlow(v => !v)}><Sparkles size={15} /> {t('dataFlow')}</button><button className={powerFlow ? 'toggle power-on' : 'toggle'} onClick={() => setPowerFlow(v => !v)}><Zap size={15} /> {t('powerFlow')}</button><button className={fanSoundEnabled ? 'toggle on' : 'toggle'} onClick={() => void toggleFanSound()} aria-pressed={fanSoundEnabled}>{fanSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />} {fanSoundEnabled ? t('soundOn') : t('soundOff')}</button><div className="load"><span>{t('workload')}</span>{(Object.keys(workloads) as LoadMode[]).map(mode => <button disabled={!isRunning} onClick={() => setLoadMode(mode)} className={loadMode === mode ? 'selected' : ''} key={mode}>{mode==='IDLE'?t('idle'):mode==='NORMAL LOAD'?t('normal'):t('high')}</button>)}</div></footer>
    </>}
    {presentation && <PresentationDeck step={presentationStep} locale={locale} back={() => showPresentationStep(presentationStep - 1)} next={nextPresentation} exit={exitPresentation} fullscreen={() => void toggleFullscreen()} />}
    <p className="disclaimer">{t('disclaimer')}</p>
  </main>
}

function BootConsole({phase,progress,locale}:{phase:SystemPhase;progress:number;locale:Locale}) {
  const output=useRef<HTMLDivElement>(null)
  const visible=bootConsoleLines(phase,progress,locale)
  useEffect(()=>{if(output.current)output.current.scrollTop=output.current.scrollHeight},[phase,visible.length])
  return <div className="boot-log" ref={output} role="log" aria-label={locale==='ru'?'Журнал загрузки':'Boot console output'}>{visible.map((line,index)=><div key={`${line.phase}-${line.label}`} className={index===visible.length-1?'current':''}><span>{line.label}</span><i aria-hidden="true"/><b>{line.status}</b></div>)}</div>
}

function Metric({ icon, name, value, temp, color, active }: { icon: React.ReactNode; name: string; value: number; temp: number | null; color: string; active: boolean }) { return <div className={`metric ${active ? '' : 'metric-off'}`}><div className="metric-name">{icon}<span>{name}</span><b>{active ? `${value}%` : 'OFF'}</b></div><div className="meter"><i style={{ width: active ? value + '%' : '0%', background: color }} /></div><small>{active ? temp === null ? '13.1 / 32 GB' : temp + '°C' : 'STANDBY'}<em>{temp === null ? 'USAGE' : 'THERMAL'}</em></small></div> }
function Empty({locale}:{locale:Locale}) { const t=(key:UiKey)=>ui[locale][key];return <div className="empty-info"><div className="orb"><Cpu size={35} /></div><span>{t('inspector')}</span><h2>{t('selectComponent')}</h2><p>{t('selectHelp')}</p></div> }
function ProcessCard({ definition, progress, explain, presentation, locale, onClose }: { definition: PhaseDefinition; progress: number; explain: boolean; presentation: boolean;locale:Locale; onClose: () => void }) { const t=(key:UiKey)=>ui[locale][key];return <article className={`process-card panel ${presentation ? 'large' : ''}`} data-testid="phase-card"><header><span>{definition.number} / {definition.title}</span><b>{Math.round(progress * 100)}%</b><button className="close-explanation" aria-label={locale === 'ru' ? 'Закрыть пояснение' : 'Close explanation'} onClick={onClose}>×</button></header><div className="phase-meter"><i style={{ width: `${Math.round(progress * 100)}%` }} /></div><p>{definition.description}</p>{explain && <><small>{t('why')}</small><p>{definition.purpose}</p><dl><div><dt>{t('involved')}</dt><dd>{componentNames(definition.componentIds).join(' · ')}</dd></div><div><dt>{t('route')}</dt><dd>{definition.route}</dd></div></dl></>}</article> }
function ColorLegend() { return <div className="color-legend"><span><i className="power-color" />POWER</span><span><i className="data-color" />DATA</span><span><i className="cpu-color" />CPU</span><span><i className="memory-color" />MEMORY</span><span><i className="gpu-color" />GPU</span><span><i className="heat-color" />HEAT</span><span><i className="cooling-color" />COOLING</span></div> }
function Architecture({ close,locale }: { close: () => void;locale:Locale }) {
  const t=(key:UiKey)=>ui[locale][key]
  const node=(id:ComponentId,className:string)=>{const item=localizeComponent(componentData[id],locale);return <div className={`arch-node ${className}`} title={item.function}>{item.short}<small>{item.architectureRole}</small></div>}
  const io=architectureConcepts['input-output']
  return <section className="architecture">
    <div className="architecture-overview">
      <div className="architecture-heading"><span>{t('architecture')}</span><h1>{t('architectureTitle')}</h1><p>{t('architectureText')}</p><button onClick={close}>{t('returnLab')}</button></div>
      <div className="arch-diagram">{node('cpu','cpu')}{node('ram','ram')}{node('motherboard','board')}{node('ssd','ssd')}{node('gpu','gpu')}<div className="arch-node io" title={io.function}>I / O + NIC<small>{io.dataPath}</small></div><svg viewBox="0 0 800 460" aria-hidden="true"><path d="M260 115L540 115M400 150L400 230M400 280L180 370M400 280L630 370M440 270L720 300" /></svg></div>
    </div>
    <div className="software-stack" aria-label="Software architecture">{(['firmware','bootloader','operating-system','drivers','application'] as const).map(id=><article key={id}><span>{architectureConcepts[id].category}</span><b>{architectureConcepts[id].name}</b><p>{architectureConcepts[id].architectureRole}</p></article>)}</div>
    <AcademicReference locale={locale}/>
  </section>
}

const requiredHardware: readonly ComponentId[] = ['psu','motherboard','cpu','ram','ssd','gpu']

function AcademicReference({locale}:{locale:Locale}) {
  const hardware=requiredHardware.map(id=>localizeComponent(componentData[id],locale))
  return <section className="academic-reference" aria-label="Computer components academic reference">
    <header><span>ACADEMIC COMPLETENESS</span><h2>Core computer components and concepts</h2><p>Each entry identifies what it is, what it does, its important characteristics, and the systems it communicates with.</p></header>
    <div className="reference-grid">
      {hardware.map(item=><article className="reference-card" key={item.id} data-reference={item.id}>
        <header><i style={{background:item.color}}/><span>{item.category}</span><h3>{item.short}</h3></header>
        <dl><div><dt>WHAT IS IT?</dt><dd>{item.description}</dd></div><div><dt>WHAT DOES IT DO?</dt><dd>{item.function}</dd></div><div><dt>IMPORTANT CHARACTERISTICS</dt><dd>{item.specifications.join(' · ')}</dd></div><div><dt>COMMUNICATES WITH</dt><dd>{componentNames(item.relatedComponents).join(' · ')}</dd></div></dl>
      </article>)}
      {requiredConceptIds.map(id=>{const item=architectureConcepts[id];return <article className="reference-card concept" key={id} data-reference={id}>
        <header><i/><span>{item.category}</span><h3>{item.name}</h3></header>
        <dl><div><dt>WHAT IS IT?</dt><dd>{item.description}</dd></div><div><dt>WHAT DOES IT DO?</dt><dd>{item.function}</dd></div><div><dt>IMPORTANT CHARACTERISTICS</dt><dd>{item.specifications.join(' · ')}</dd></div><div><dt>COMMUNICATES WITH</dt><dd>{item.dataPath}</dd></div></dl>
      </article>})}
    </div>
    <section className="motherboard-map" aria-label="Motherboard connection map"><header><span>MOTHERBOARD ANATOMY</span><h2>Connection map</h2><p>The existing 3D mainboard models these functional areas; exploded view separates its installed CPU, RAM, and M.2 drive for closer inspection.</p></header><div>{motherboardConnections.map(item=><span key={item}>{item}</span>)}</div></section>
    <section className="storage-comparison" aria-label="Storage comparison"><header><span>STORAGE COMPARISON</span><h2>HDD, SATA SSD, and NVMe SSD</h2><p>Values are illustrative typical ranges. Actual speed varies by model, workload, capacity, interface generation, cache, and system.</p></header><div className="comparison-table" role="table"><div className="comparison-row comparison-head" role="row"><b>TYPE</b><b>TECHNOLOGY</b><b>INTERFACE</b><b>CAPACITY EXAMPLES</b><b>TYPICAL SEQUENTIAL READ / WRITE</b><b>LATENCY / RESPONSE</b></div>{storageComparison.map(row=><div className="comparison-row" role="row" key={row.name}><strong>{row.name}</strong><span>{row.technology}</span><span>{row.interface}</span><span>{row.capacity}</span><span>Read: {row.read}<br/>Write: {row.write}</span><span>{row.responsiveness}</span></div>)}</div><p className="virtual-pc-storage"><b>EXAMPLE VIRTUAL PC</b> {componentData.ssd.specifications.slice(0,4).join(' · ')}</p></section>
    <p className="academic-disclaimer">{ui[locale].disclaimer}</p>
  </section>
}

function ExecutionLesson({mode,locale}:{mode:ExecutionMode;locale:Locale}) {
  const lesson=executionLessons[mode]!
  const concept=architectureConcepts[lesson.concept]
  return <article className="execution-lesson panel" data-testid="execution-lesson"><header><span>{concept.category}</span><h2>{lesson.title}</h2><p>{lesson.summary}</p></header><ol>{lesson.steps.map((step,index)=><li key={step}><i>{index+1}</i><span>{step}</span></li>)}</ol><footer><b>{locale==='ru'?'ПУТЬ ДАННЫХ':'DATA PATH'}</b><span>{concept.dataPath}</span></footer></article>
}

function About({close,locale}:{close:()=>void;locale:Locale}) {
  const russian=locale==='ru'
  const content=russian?assignmentRussian:assignment
  return <section className="about-assignment"><div className="about-card panel"><span className="panel-kicker"><GraduationCap size={15}/>{russian?'УЧЕБНОЕ ЗАДАНИЕ':'ABOUT / ASSIGNMENT'}</span><h1>{content.title}</h1><h2>{content.subtitle}</h2><div className="assignment-goal"><b>{russian?'ЦЕЛЬ':'GOAL'}</b><p>{content.goal}</p></div><div className="learning-objectives"><b>{russian?'РЕЗУЛЬТАТЫ ОБУЧЕНИЯ':'LEARNING OBJECTIVES'}</b><ul>{content.learningObjectives.map(item=><li key={item}>{item}</li>)}</ul></div><button onClick={close}>{ui[locale].returnLab}</button></div></section>
}
