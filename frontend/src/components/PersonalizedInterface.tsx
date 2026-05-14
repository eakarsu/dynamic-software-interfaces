import { useState } from 'react'
import { mockEmails, Email } from '../data/mockEmails'
import type { Persona, Settings } from '../App'

interface Props {
  persona: Persona
  settings: Settings
}

const priorityDot: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  normal: 'bg-blue-400',
  low: 'bg-gray-300',
}

// ============ POWER USER VIEW ============
function PowerUserView({ settings }: { settings: Settings }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const padding = settings.density === 'compact' ? 'py-1' : settings.density === 'spacious' ? 'py-3' : 'py-2'

  const toggleAll = () => {
    if (checked.size === mockEmails.length) setChecked(new Set())
    else setChecked(new Set(mockEmails.map(e => e.id)))
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs">
          <input type="checkbox" onChange={toggleAll} checked={checked.size === mockEmails.length} className="rounded" />
          {checked.size > 0 ? (
            <div className="flex gap-2">
              <button className="bg-gray-700 text-white px-2 py-0.5 rounded font-medium">{checked.size} selected</button>
              <button className="text-gray-600 hover:text-gray-800">Archive</button>
              <button className="text-gray-600 hover:text-gray-800">Mark read</button>
              <button className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          ) : (
            <div className="flex gap-3 text-gray-500">
              <span>⌘A select all</span>
              <span>⌘K quick action</span>
              <span>E archive</span>
              <span>R reply</span>
              <span>/search</span>
            </div>
          )}
          <div className="ml-auto text-gray-400">{mockEmails.filter(e => e.status === 'unread').length} unread</div>
        </div>

        {/* Email rows */}
        {mockEmails.map(email => (
          <div
            key={email.id}
            className={`flex items-center gap-3 px-3 border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors ${padding} ${email.status === 'unread' ? 'bg-white' : 'bg-gray-50/50'}`}
          >
            <input
              type="checkbox"
              checked={checked.has(email.id)}
              onChange={() => {
                const n = new Set(checked)
                n.has(email.id) ? n.delete(email.id) : n.add(email.id)
                setChecked(n)
              }}
              className="rounded flex-shrink-0"
            />
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[email.priority]}`} />
            <div className={`w-32 flex-shrink-0 text-xs truncate ${email.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              {email.from}
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className={`text-xs truncate ${email.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                {email.subject}
              </span>
              {settings.showPreview && (
                <span className="text-xs text-gray-400 truncate hidden lg:block">— {email.bodyPreview.slice(0, 60)}...</span>
              )}
            </div>
            {settings.showLabels && email.labels.slice(0, 1).map(l => (
              <span key={l} className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded hidden sm:block shrink-0">{l}</span>
            ))}
            {settings.showAttachments && email.hasAttachment && <span className="text-gray-400 text-xs shrink-0">📎</span>}
            <span className="text-xs text-gray-400 w-20 text-right shrink-0">{email.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ STUDENT VIEW ============
function StudentView({ settings }: { settings: Settings }) {
  const byDay: Record<string, Email[]> = {}
  const dayOrder: string[] = []
  mockEmails.forEach(e => {
    if (!byDay[e.date]) { byDay[e.date] = []; dayOrder.push(e.date) }
    byDay[e.date].push(e)
  })
  const uniqueDays = [...new Set(dayOrder)]

  const cardPad = settings.density === 'compact' ? 'p-2' : settings.density === 'spacious' ? 'p-5' : 'p-3'

  const categoryColors: Record<string, string> = {
    academic: 'border-l-purple-500 bg-purple-50',
    work: 'border-l-blue-500 bg-blue-50',
    personal: 'border-l-green-500 bg-green-50',
    newsletter: 'border-l-gray-400 bg-gray-50',
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {uniqueDays.slice(0, 4).map(day => (
        <div key={day}>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-200" />
            {day}
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="space-y-2">
            {byDay[day].map(email => (
              <div
                key={email.id}
                className={`rounded-xl border-l-4 border border-gray-200 ${categoryColors[email.category] || 'bg-white'} ${cardPad} hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {email.priority === 'urgent' && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold animate-pulse">DUE SOON</span>
                    )}
                    <span className="text-xs bg-white/70 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded capitalize">{email.category}</span>
                  </div>
                  {email.status === 'unread' && <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-1" />}
                </div>
                <div className={`font-semibold mt-1 ${settings.density === 'compact' ? 'text-xs' : 'text-sm'} text-gray-900`}>{email.subject}</div>
                <div className="text-xs text-gray-500 mt-0.5">from {email.from}</div>
                {settings.showPreview && (
                  <div className="text-xs text-gray-600 mt-1.5 line-clamp-2">{email.bodyPreview}</div>
                )}
                {settings.showLabels && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {email.labels.map(l => (
                      <span key={l} className="text-xs bg-white/80 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{l}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============ DEVELOPER VIEW ============
function DeveloperView({ settings }: { settings: Settings }) {
  const columns = [
    { id: 'unread', label: 'Inbox', color: 'bg-blue-600', emails: mockEmails.filter(e => e.status === 'unread') },
    { id: 'read', label: 'Review', color: 'bg-yellow-500', emails: mockEmails.filter(e => e.status === 'read') },
    { id: 'replied', label: 'Respond', color: 'bg-green-500', emails: mockEmails.filter(e => e.status === 'replied') },
    { id: 'archived', label: 'Archive', color: 'bg-gray-400', emails: mockEmails.filter(e => e.status === 'archived') },
  ]

  const cardPad = settings.density === 'compact' ? 'p-2' : settings.density === 'spacious' ? 'p-4' : 'p-3'

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {columns.map(col => (
          <div key={col.id} className="w-72 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-sm font-bold text-gray-800">{col.label}</span>
              <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-mono">{col.emails.length}</span>
            </div>
            <div className="space-y-1.5">
              {col.emails.map(email => (
                <div
                  key={email.id}
                  className={`bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer ${cardPad}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[email.priority]}`} />
                    <span className="text-xs text-gray-500 truncate">{email.from}</span>
                    {email.hasAttachment && <span className="ml-auto text-gray-400 text-xs">📎</span>}
                  </div>
                  <div className="text-xs font-semibold text-gray-800 leading-tight mb-1">{email.subject}</div>
                  {settings.showLabels && email.labels.slice(0, 2).map(l => (
                    <span key={l} className="inline-block text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded mr-1 font-mono">{l}</span>
                  ))}
                  <div className="text-xs text-gray-400 mt-1 text-right">{email.date}</div>
                </div>
              ))}
              {col.emails.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ EXECUTIVE VIEW ============
function ExecutiveView({ settings: _settings }: { settings: Settings }) {
  const unread = mockEmails.filter(e => e.status === 'unread')
  const urgent = mockEmails.filter(e => e.priority === 'urgent')
  const needsReply = mockEmails.filter(e => e.status === 'unread' && (e.priority === 'urgent' || e.priority === 'high'))

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Unread', value: unread.length, color: 'text-blue-600' },
          { label: 'Urgent', value: urgent.length, color: 'text-red-600' },
          { label: 'Need Reply', value: needsReply.length, color: 'text-orange-500' },
          { label: 'Avg Response', value: '2.4h', color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Priority items */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-800">Top Priority</span>
          </div>
          <div className="divide-y divide-gray-100">
            {urgent.concat(needsReply.slice(0, 2)).slice(0, 5).map(email => (
              <div key={email.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={`w-2 h-2 rounded-full ${priorityDot[email.priority]}`} />
                  <span className="text-xs font-semibold text-gray-700">{email.from}</span>
                  <span className="ml-auto text-xs text-gray-400">{email.date}</span>
                </div>
                <div className="text-sm text-gray-800 font-medium truncate">{email.subject}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Delegation suggestions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-800">Delegation Suggestions</span>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { email: mockEmails[3], delegate: 'Engineering Lead', reason: 'PR review request' },
              { email: mockEmails[6], delegate: 'Finance Team', reason: 'Invoice processing' },
              { email: mockEmails[11], delegate: 'Engineering Lead', reason: 'Technical assignment' },
              { email: mockEmails[4], delegate: 'Team Member', reason: 'Study group coordination' },
            ].map(({ email, delegate, reason }) => (
              <div key={email.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{email.subject}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{reason}</div>
                  </div>
                  <button className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded whitespace-nowrap hover:bg-blue-100 transition-colors shrink-0">
                    → {delegate}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PersonalizedInterface({ persona, settings }: Props) {
  return (
    <div className="min-h-[calc(100vh-56px)]">
      {persona === 'power' && <PowerUserView settings={settings} />}
      {persona === 'student' && <StudentView settings={settings} />}
      {persona === 'developer' && <DeveloperView settings={settings} />}
      {persona === 'executive' && <ExecutiveView settings={settings} />}
    </div>
  )
}
