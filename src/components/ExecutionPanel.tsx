import { executionDefinition, executionStages, type ExecutionSnapshot } from '../system/executionMachine'
import './ExecutionPanel.css'

export function ExecutionPanel({ snapshot, ready, launch, loadWebsite }: { snapshot: ExecutionSnapshot; ready: boolean; launch: () => void; loadWebsite: () => void }) {
  const [state, title, description, route] = executionDefinition(snapshot.state)
  const network = executionStages.findIndex(stage => stage[0] === state) >= 10
  const stages = network ? executionStages.slice(10) : executionStages.slice(1, 10)
  return <section className={`execution-panel panel ${state === 'IDLE' ? 'idle' : ''}`} aria-label="Program execution" data-execution-state={state}>
    <div className="execution-actions"><button disabled={!ready || state !== 'IDLE'} onClick={launch}>LAUNCH BROWSER</button><button disabled={!ready || state === 'IDLE'} onClick={launch}>RESTART DEMO</button><button disabled={!ready || !['APP_READY', 'PAGE_READY'].includes(state)} onClick={loadWebsite}>LOAD WEBSITE</button></div>
    {state === 'IDLE' ? <small>{ready ? 'Launch a browser and follow the hardware. Local simulation only.' : 'Available when SYSTEM READY.'}</small> : <>
      <ol>{stages.map((stage, index) => <li key={stage[0]} aria-current={stage[0] === state || (state === 'PROCESS_CREATION' && stage[0] === 'OS_REQUEST') ? 'step' : undefined}>{index + 1} {stage[1]}</li>)}</ol>
      <strong>{title}</strong><p>{description}</p><small>{route}</small>
    </>}
  </section>
}
