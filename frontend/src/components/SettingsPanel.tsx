import type { Settings, ColorTheme, Density } from '../App'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
}

const themes: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: 'indigo', label: 'Indigo', swatch: 'bg-indigo-600' },
  { id: 'rose', label: 'Rose', swatch: 'bg-rose-500' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-600' },
  { id: 'amber', label: 'Amber', swatch: 'bg-amber-500' },
]

const densities: { id: Density; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: 'More content, less padding' },
  { id: 'comfortable', label: 'Comfortable', desc: 'Balanced spacing' },
  { id: 'spacious', label: 'Spacious', desc: 'More breathing room' },
]

export default function SettingsPanel({ settings, onChange }: Props) {
  const set = (partial: Partial<Settings>) => onChange({ ...settings, ...partial })

  return (
    <div className="h-full overflow-auto">
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900">Interface Settings</h2>
        <p className="text-xs text-gray-500 mt-0.5">Changes apply live</p>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Color Theme */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-3">Color Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => set({ theme: t.id })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  settings.theme === t.id
                    ? 'border-gray-900 bg-gray-50 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${t.swatch}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Density */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-3">Density</label>
          <div className="space-y-1.5">
            {densities.map(d => (
              <button
                key={d.id}
                onClick={() => set({ density: d.id })}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  settings.density === d.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm ${settings.density === d.id ? 'font-semibold' : 'font-medium'} text-gray-700`}>{d.label}</div>
                <div className="text-xs text-gray-400">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Widget toggles */}
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-3">Widgets</label>
          <div className="space-y-3">
            {[
              { key: 'showPreview' as const, label: 'Email Preview', desc: 'Show body preview text' },
              { key: 'showLabels' as const, label: 'Labels', desc: 'Show category labels' },
              { key: 'showAttachments' as const, label: 'Attachment Icons', desc: 'Show attachment indicator' },
            ].map(widget => (
              <div key={widget.key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">{widget.label}</div>
                  <div className="text-xs text-gray-400">{widget.desc}</div>
                </div>
                <button
                  onClick={() => set({ [widget.key]: !settings[widget.key] })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${settings[widget.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[widget.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
