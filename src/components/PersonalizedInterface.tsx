import type { InterfaceConfig, MockEmail } from '../types'
import { MOCK_EMAILS } from '../presets'

interface Props {
  config: InterfaceConfig
}

// ── helpers ────────────────────────────────────────────────────────────────

const priorityBadge = (p: MockEmail['priority'], primary: string) => {
  if (p === 'high') return <span style={{ color: '#dc2626' }} className="font-semibold text-xs">HIGH</span>
  if (p === 'low') return <span className="text-gray-400 text-xs">low</span>
  return <span className="text-gray-500 text-xs">–</span>
}

const statusIcon = (s: MockEmail['status']) => {
  const map = { unread: '●', read: '○', replied: '↩', archived: '▽' }
  return map[s]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(emails: MockEmail[]): Record<string, MockEmail[]> {
  return emails.reduce<Record<string, MockEmail[]>>((acc, e) => {
    const key = formatDate(e.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})
}

function groupByStatus(emails: MockEmail[]): Record<string, MockEmail[]> {
  const cols: Record<string, MockEmail[]> = { unread: [], read: [], replied: [], archived: [] }
  emails.forEach(e => cols[e.status].push(e))
  return cols
}

// ── density helpers ─────────────────────────────────────────────────────────

function densityPadding(density: InterfaceConfig['density']) {
  return { compact: 'p-1', comfortable: 'p-3', spacious: 'p-5' }[density]
}

function densityGap(density: InterfaceConfig['density']) {
  return { compact: 'gap-1', comfortable: 'gap-3', spacious: 'gap-5' }[density]
}

// ── layouts ─────────────────────────────────────────────────────────────────

function TasklistLayout({ config }: { config: InterfaceConfig }) {
  const pad = densityPadding(config.density)
  return (
    <div className={`flex flex-col ${densityGap(config.density)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wider">
          {MOCK_EMAILS.length} messages
        </span>
        <div className="flex gap-2 text-xs">
          {config.widgets.map(w => (
            <button
              key={w}
              style={{ borderColor: config.primaryColor, color: config.primaryColor }}
              className="border rounded px-2 py-0.5 hover:opacity-80"
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      {MOCK_EMAILS.map(email => (
        <div
          key={email.id}
          className={`flex items-start ${pad} rounded border border-gray-100 hover:bg-gray-50 cursor-pointer`}
        >
          <input
            type="checkbox"
            className="mt-0.5 mr-2 shrink-0"
            defaultChecked={email.status === 'archived'}
            readOnly
          />
          <span className="mr-2 text-gray-400 text-xs mt-0.5 select-none">
            {statusIcon(email.status)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className={`font-medium text-sm truncate ${email.status === 'unread' ? 'text-gray-900' : 'text-gray-500'}`}>
                {email.subject}
              </span>
              {priorityBadge(email.priority, config.primaryColor)}
            </div>
            {config.density !== 'compact' && (
              <p className="text-xs text-gray-400 truncate">{email.preview}</p>
            )}
          </div>
          <span className="text-xs text-gray-300 ml-2 shrink-0">{email.from.split('@')[0]}</span>
          <span className="text-xs text-gray-300 ml-2 shrink-0">{formatDate(email.date)}</span>
        </div>
      ))}
    </div>
  )
}

function CalendarLayout({ config }: { config: InterfaceConfig }) {
  const grouped = groupByDate(MOCK_EMAILS)
  const pad = densityPadding(config.density)
  return (
    <div className={`flex flex-col ${densityGap(config.density)}`}>
      {Object.entries(grouped).map(([date, emails]) => (
        <div key={date}>
          <div
            className="text-sm font-semibold mb-1 pb-1 border-b"
            style={{ color: config.primaryColor, borderColor: config.primaryColor + '40' }}
          >
            {date}
          </div>
          <div className={`flex flex-col ${densityGap(config.density)}`}>
            {emails.map(email => (
              <div
                key={email.id}
                className={`${pad} rounded-lg border border-gray-100 hover:shadow-sm cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium text-sm ${email.status === 'unread' ? 'text-gray-900' : 'text-gray-500'}`}>
                    {email.subject}
                  </span>
                  <div className="flex gap-2 items-center">
                    {priorityBadge(email.priority, config.primaryColor)}
                    <span className="text-xs text-gray-400">
                      {new Date(email.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{email.from}</p>
                {config.density === 'spacious' && (
                  <p className="text-xs text-gray-400 mt-1">{email.preview}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanbanLayout({ config }: { config: InterfaceConfig }) {
  const columns = groupByStatus(MOCK_EMAILS)
  const colLabels: Record<string, string> = {
    unread: 'Unread',
    read: 'Read',
    replied: 'Replied',
    archived: 'Archived',
  }
  const pad = densityPadding(config.density)
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Object.entries(columns).map(([status, emails]) => (
        <div key={status} className="flex-1 min-w-[180px]">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: config.primaryColor }}
          >
            {colLabels[status]} ({emails.length})
          </div>
          <div className={`flex flex-col ${densityGap(config.density)}`}>
            {emails.map(email => (
              <div
                key={email.id}
                className={`${pad} rounded border border-gray-200 bg-white shadow-sm hover:shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-xs font-medium text-gray-800 leading-tight">{email.subject}</span>
                  {email.priority === 'high' && (
                    <span
                      className="text-xs rounded px-1 shrink-0"
                      style={{ background: config.primaryColor + '20', color: config.primaryColor }}
                    >
                      !
                    </span>
                  )}
                </div>
                {config.density !== 'compact' && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{email.from}</p>
                )}
                <p className="text-xs text-gray-300 mt-1">{formatDate(email.date)}</p>
              </div>
            ))}
            {emails.length === 0 && (
              <div className="text-xs text-gray-300 text-center py-4 border border-dashed rounded">
                empty
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardLayout({ config }: { config: InterfaceConfig }) {
  const unread = MOCK_EMAILS.filter(e => e.status === 'unread').length
  const highPriority = MOCK_EMAILS.filter(e => e.priority === 'high')
  const recent = MOCK_EMAILS.slice(0, 3)
  const pad = densityPadding(config.density)

  return (
    <div className={`flex flex-col ${densityGap(config.density)}`}>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: MOCK_EMAILS.length },
          { label: 'Unread', value: unread },
          { label: 'High Priority', value: highPriority.length },
          { label: 'Replied', value: MOCK_EMAILS.filter(e => e.status === 'replied').length },
        ].map(stat => (
          <div
            key={stat.label}
            className={`${pad} rounded-lg text-center`}
            style={{ background: config.primaryColor + '10', border: `1px solid ${config.primaryColor}30` }}
          >
            <div className="text-2xl font-bold" style={{ color: config.primaryColor }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* High priority */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">High Priority</h3>
        {highPriority.map(email => (
          <div
            key={email.id}
            className={`${pad} rounded border-l-4 mb-2 bg-red-50`}
            style={{ borderLeftColor: '#dc2626' }}
          >
            <div className="text-sm font-medium text-gray-800">{email.subject}</div>
            <div className="text-xs text-gray-500">{email.from} · {formatDate(email.date)}</div>
            <div className="text-xs text-gray-400 mt-1">{email.preview}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent</h3>
        {recent.map(email => (
          <div
            key={email.id}
            className={`${pad} rounded border border-gray-100 mb-2 hover:bg-gray-50 cursor-pointer`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-700">{email.subject}</span>
              <span className="text-xs text-gray-400">{formatDate(email.date)}</span>
            </div>
            <div className="text-xs text-gray-500">{email.from}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── main export ──────────────────────────────────────────────────────────────

export default function PersonalizedInterface({ config }: Props) {
  return (
    <div className="w-full">
      {config.layout === 'tasklist' && <TasklistLayout config={config} />}
      {config.layout === 'calendar' && <CalendarLayout config={config} />}
      {config.layout === 'kanban' && <KanbanLayout config={config} />}
      {config.layout === 'dashboard' && <DashboardLayout config={config} />}
    </div>
  )
}
