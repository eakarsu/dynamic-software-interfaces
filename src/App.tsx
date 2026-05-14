import { useState } from 'react'
import type { PersonaKey } from './types'
import { PERSONAS } from './presets'
import PersonalizedInterface from './components/PersonalizedInterface'

export default function App() {
  const [selected, setSelected] = useState<PersonaKey>('powerUser')

  const activePersona = PERSONAS.find(p => p.key === selected)!

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="text-white px-6 py-4 shadow-md"
        style={{ background: activePersona.config.primaryColor }}
      >
        <h1 className="text-xl font-bold tracking-tight">Dynamic Software Interfaces</h1>
        <p className="text-sm opacity-80 mt-0.5">
          The same data, adapted to you — {activePersona.label} view
        </p>
      </header>

      {/* Persona selector */}
      <div className="bg-white border-b px-6 py-3 flex gap-3 flex-wrap">
        {PERSONAS.map(persona => (
          <button
            key={persona.key}
            onClick={() => setSelected(persona.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              selected === persona.key
                ? 'text-white border-transparent shadow'
                : 'text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
            style={
              selected === persona.key
                ? { background: persona.config.primaryColor, borderColor: persona.config.primaryColor }
                : {}
            }
          >
            {persona.label}
          </button>
        ))}
      </div>

      {/* Config summary */}
      <div className="bg-white border-b px-6 py-2 flex gap-6 text-xs text-gray-500">
        <span>Layout: <strong className="text-gray-700">{activePersona.config.layout}</strong></span>
        <span>Density: <strong className="text-gray-700">{activePersona.config.density}</strong></span>
        <span>Widgets: <strong className="text-gray-700">{activePersona.config.widgets.join(', ')}</strong></span>
        <span className="flex items-center gap-1">
          Color:
          <span
            className="inline-block w-3 h-3 rounded-full border border-gray-200"
            style={{ background: activePersona.config.primaryColor }}
          />
          <strong className="text-gray-700">{activePersona.config.primaryColor}</strong>
        </span>
      </div>

      {/* Description */}
      <div className="px-6 py-2 text-sm text-gray-500 italic">
        {activePersona.description}
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-4 max-w-5xl w-full mx-auto">
        <PersonalizedInterface config={activePersona.config} />
      </main>
    </div>
  )
}
