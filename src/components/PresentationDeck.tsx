import { presentationSteps } from '../data/presentation'
import type { Locale } from '../i18n'
import './PresentationDeck.css'

export function PresentationDeck({ step, locale, back, next, exit, fullscreen }: { step: number; locale: Locale; back: () => void; next: () => void; exit: () => void; fullscreen: () => void }) {
  const steps = presentationSteps[locale]
  const item = steps[step]
  const last = step === steps.length - 1
  return <aside className="presentation-deck panel" role="region" aria-label={locale === 'ru' ? 'Шаг презентации' : 'Presentation step'}>
    <header><span>{item.kicker}</span><b>{String(step + 1).padStart(2,'0')} / {String(steps.length).padStart(2,'0')}</b></header>
    <h2>{item.title}</h2><p>{item.description}</p>
    {item.points && <div className="presentation-points">{item.points.map(point => <span key={point}>{point}</span>)}</div>}
    {item.route && <strong>{item.route}</strong>}
    <footer><button className="presentation-back" disabled={step === 0} onClick={back}>{locale === 'ru' ? 'НАЗАД' : 'BACK'}</button><button className="presentation-next" onClick={next}>{last ? (locale === 'ru' ? 'ЗАВЕРШИТЬ' : 'FINISH') : (locale === 'ru' ? 'ДАЛЕЕ' : 'NEXT')}</button><button onClick={fullscreen}>{locale === 'ru' ? 'ПОЛНЫЙ ЭКРАН' : 'FULLSCREEN'}</button><button className="presentation-exit" onClick={exit}>{locale === 'ru' ? 'ВЫЙТИ' : 'EXIT PRESENTATION'}</button></footer>
  </aside>
}
