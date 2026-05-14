import type { Persona } from '../App'

interface Props {
  active: Persona
  onChange: (p: Persona) => void
}

const personas: {
  id: Persona
  icon: string
  name: string
  description: string
  needs: string[]
  color: string
}[] = [
  {
    id: 'power',
    icon: '⚡',
    name: 'Power User',
    description: 'Heavy email user, needs speed and keyboard control',
    needs: ['Bulk actions', 'Keyboard shortcuts', 'Dense information', 'Quick filtering'],
    color: 'border-indigo-400 bg-indigo-50',
  },
  {
    id: 'student',
    icon: '🎓',
    name: 'Student',
    description: 'Academic schedule focus, deadline awareness',
    needs: ['Calendar grouping', 'Deadline highlights', 'Colorful categorization', 'Assignment tracking'],
    color: 'border-purple-400 bg-purple-50',
  },
  {
    id: 'developer',
    icon: '💻',
    name: 'Developer',
    description: 'Structured workflow, kanban-style triage',
    needs: ['Status columns', 'Compact metadata', 'Source info', 'Pipeline view'],
    color: 'border-green-400 bg-green-50',
  },
  {
    id: 'executive',
    icon: '📊',
    name: 'Executive',
    description: 'High-level summary, delegation suggestions',
    needs: ['Summary stats', 'Priority queue', 'Response time', 'Delegation'],
    color: 'border-amber-400 bg-amber-50',
  },
]

export default function PersonaSelector({ active, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 max-w-3xl mx-auto">
      {personas.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`text-left rounded-xl border-2 p-4 transition-all ${
            active === p.id ? `${p.color} shadow-md` : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{p.icon}</span>
            <div>
              <div className="text-sm font-bold text-gray-900">{p.name}</div>
              {active === p.id && (
                <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2">{p.description}</p>
          <div className="flex flex-wrap gap-1">
            {p.needs.map(n => (
              <span key={n} className="text-xs bg-white/80 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{n}</span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
