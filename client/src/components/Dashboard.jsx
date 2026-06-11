import { useStore } from '../store.js'
import ExportBar from './ExportBar.jsx'

export default function Dashboard() {
  const dayState = useStore((s) => s.dayState)
  const togglePanel = useStore((s) => s.togglePanel)
  const { members, items, confirmedCount, activeCount, total } = dayState
  const withOrders = members.filter((m) => m.active || items.some((i) => i.memberId === m.id))
  const pct = activeCount ? Math.round((confirmedCount / activeCount) * 100) : 0

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          🍽️ {confirmedCount}/{activeCount} ont choisi
        </h2>
        <span className="spacer" />
        <button className="icon-btn" onClick={togglePanel}>
          ✕
        </button>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="panel-body">
        {withOrders.map((m) => {
          const mine = items.filter((i) => i.memberId === m.id)
          return (
            <div key={m.id} className="member-row">
              <div className="member-head">
                <span className="avatar" style={{ background: m.color }}>
                  {m.name[0]?.toUpperCase()}
                </span>
                {m.name}
                <span className="spacer" />
                {m.confirmed ? '✅' : '⏳'}
              </div>
              {mine.length > 0 && (
                <ul className="member-items">
                  {mine.map((i) => (
                    <li key={i.id}>
                      {i.quantity > 1 ? `${i.quantity}× ` : ''}
                      {i.name}
                      {i.pastaType ? ` (${i.pastaType})` : ''}
                      {i.note ? ` — ${i.note}` : ''} · <b>{i.lineTotal} dh</b>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <ExportBar />

      <div className="panel-foot">
        <span>Total</span>
        <span>{total} dh</span>
      </div>
    </div>
  )
}
