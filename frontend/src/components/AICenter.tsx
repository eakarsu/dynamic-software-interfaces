import { useState } from 'react';
import { Sparkles, Layout, User, BarChart2, PuzzleIcon, Code, Palette, ShieldCheck, Beaker, Type } from 'lucide-react';
import { apiFetch } from '../api';
import AIResponse from './AIResponse';

type Sample = { label: string; values: Record<string, string> };

type PlusSection = {
  key: string;
  title: string;
  endpoint: string;
  icon: any;
  color: string;
  fields: { name: string; placeholder: string; rows?: number }[];
  buildBody: (s: Record<string, string>) => any;
  samples?: Sample[];
};

const PLUS_SECTIONS: PlusSection[] = [
  {
    key: 'nl-to-spec',
    title: 'NL to Component Spec',
    endpoint: '/ai/nl-to-spec',
    icon: Code,
    color: 'indigo',
    fields: [
      { name: 'description', placeholder: 'Describe the component (e.g. a multi-select dropdown with search and clear)', rows: 4 },
      { name: 'framework', placeholder: 'Target framework (default: React + Tailwind)' }
    ],
    buildBody: s => ({ description: s.description, framework: s.framework }),
    samples: [
      { label: 'Analytics dashboard', values: { description: 'Atlas Analytics Dashboard with KPI tiles for MRR, churn and DAU, a time-range selector (7d/30d/90d), a stacked-area trend chart, and inline anomaly callouts that surface week-over-week regressions.', framework: 'React + Tailwind' } },
      { label: 'Command palette', values: { description: 'Halo Command Palette: keyboard-first overlay with fuzzy search, recent-actions list, scoped sections (Navigate, Run, Open), and Cmd+K trigger; supports up/down + enter and shows result counts.', framework: 'React + Tailwind' } },
      { label: 'Multi-select w/ search', values: { description: 'Multi-select dropdown with typeahead search, "Clear all" pill, async option loading, virtualized rows for 1k+ items, and selected-count badge on the trigger.', framework: 'React + Tailwind' } }
    ]
  },
  {
    key: 'palette',
    title: 'Brand to Color Palette',
    endpoint: '/ai/palette-from-brand',
    icon: Palette,
    color: 'pink',
    fields: [
      { name: 'brand', placeholder: 'Brand name (e.g. Northwind Health)' },
      { name: 'mood', placeholder: 'Mood / personality (e.g. trustworthy, playful)' },
      { name: 'baseColor', placeholder: 'Optional base color (e.g. #2563eb)' }
    ],
    buildBody: s => ({ brand: s.brand, mood: s.mood, baseColor: s.baseColor }),
    samples: [
      { label: 'Modern fintech', values: { brand: 'Lumen Pay', mood: 'modern fintech, minimalist, blue + amber, trustworthy', baseColor: '#2563eb' } },
      { label: 'Healthcare', values: { brand: 'Northwind Health', mood: 'calm, trustworthy, accessible (AA contrast), warm teal accent', baseColor: '#0f766e' } },
      { label: 'Playful B2C', values: { brand: 'Pixie Plants', mood: 'playful, friendly, organic, soft green + coral, slightly retro', baseColor: '#22c55e' } }
    ]
  },
  {
    key: 'a11y',
    title: 'Accessibility Audit',
    endpoint: '/ai/a11y-audit',
    icon: ShieldCheck,
    color: 'green',
    fields: [
      { name: 'spec', placeholder: 'Paste component JSX or spec to audit', rows: 8 }
    ],
    buildBody: s => ({ spec: s.spec }),
    samples: [
      { label: 'Login form', values: { spec: '<form onSubmit={submit}>\n  <div><input type="text" placeholder="Email" /></div>\n  <div><input type="password" placeholder="Password" /></div>\n  <div onClick={submit} className="btn btn-primary">Sign in</div>\n  <span style={{color:"#bbb"}}>Forgot password?</span>\n</form>' } },
      { label: 'Modal dialog', values: { spec: '<div className="modal-backdrop" onClick={close}>\n  <div className="modal" role="dialog">\n    <h3>Delete project</h3>\n    <p>This cannot be undone.</p>\n    <div className="actions">\n      <span onClick={close}>Cancel</span>\n      <span onClick={confirm} style={{background:"#f00",color:"#f99"}}>Delete</span>\n    </div>\n  </div>\n</div>' } },
      { label: 'Data table', values: { spec: '<table>\n  <tr><td>Name</td><td>Status</td><td>Actions</td></tr>\n  {rows.map(r => <tr><td>{r.name}</td><td><span style={{color:"#0f0"}}>OK</span></td><td><img src="/edit.png" onClick={()=>edit(r)} /></td></tr>)}\n</table>' } }
    ]
  },
  {
    key: 'ab',
    title: 'A/B Variant Generator',
    endpoint: '/ai/ab-variants',
    icon: Beaker,
    color: 'yellow',
    fields: [
      { name: 'component', placeholder: 'Component / element (e.g. signup CTA button on hero)', rows: 3 },
      { name: 'hypothesis', placeholder: 'Hypothesis to test (e.g. shorter copy increases click-through)' }
    ],
    buildBody: s => ({ component: s.component, hypothesis: s.hypothesis }),
    samples: [
      { label: 'Hero CTA', values: { component: 'Primary "Start free trial" CTA button on the marketing hero, currently solid indigo, 16px label, full width on mobile.', hypothesis: 'Shorter, action-led copy ("Start free") and a contrasting amber color increases hero click-through on mobile.' } },
      { label: 'Pricing card', values: { component: 'Pro pricing card on /pricing with 7 feature bullets, monthly/annual toggle, and "Choose Pro" CTA.', hypothesis: 'Highlighting the annual savings as a savings badge (vs. just a strike-through price) lifts conversion to annual plan.' } },
      { label: 'Empty-state', values: { component: 'Dashboard empty state shown to new users with no data, currently an illustration + paragraph + "Connect data" link.', hypothesis: 'Replacing the link with a prominent button and a 3-step checklist increases activation within 24h of signup.' } }
    ]
  },
  {
    key: 'tone',
    title: 'Copy Tone Rewriter',
    endpoint: '/ai/tone-rewrite',
    icon: Type,
    color: 'violet',
    fields: [
      { name: 'text', placeholder: 'Original UI copy', rows: 4 },
      { name: 'tone', placeholder: 'Target tone (e.g. friendly, formal, witty)' },
      { name: 'audience', placeholder: 'Audience (e.g. enterprise IT buyers)' }
    ],
    buildBody: s => ({ text: s.text, tone: s.tone, audience: s.audience }),
    samples: [
      { label: 'Error -> friendly', values: { text: 'Error: Request failed with status 500. Please retry the operation or contact your administrator if the problem persists.', tone: 'friendly, calm, reassuring', audience: 'non-technical end users on a SaaS dashboard' } },
      { label: 'Onboarding -> witty', values: { text: 'Welcome. To begin using the platform, please complete your profile and connect a data source.', tone: 'witty, conversational, lightly playful', audience: 'developers signing up for a design-tools beta' } },
      { label: 'Notice -> formal', values: { text: 'Heads up - we are pushing a big update tonight and things might get weird for a few minutes.', tone: 'formal, precise, enterprise', audience: 'enterprise IT buyers and compliance reviewers' } }
    ]
  }
];

const COLOR_BTN: Record<string, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  pink: 'bg-pink-600 hover:bg-pink-700',
  green: 'bg-green-600 hover:bg-green-700',
  yellow: 'bg-yellow-600 hover:bg-yellow-700',
  violet: 'bg-violet-600 hover:bg-violet-700'
};

const COLOR_ICON: Record<string, string> = {
  indigo: 'text-indigo-400',
  pink: 'text-pink-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  violet: 'text-violet-400'
};

type TabKey = 'core' | 'design';

export default function AICenter() {
  const [tab, setTab] = useState<TabKey>('core');

  // Core tools state
  const [layoutRole, setLayoutRole] = useState('');
  const [layoutBehavior, setLayoutBehavior] = useState('');
  const [layoutCurrent, setLayoutCurrent] = useState('dashboard');
  const [layoutResult, setLayoutResult] = useState('');
  const [layoutLoading, setLayoutLoading] = useState(false);

  const [personUserId, setPersonUserId] = useState('');
  const [personPatterns, setPersonPatterns] = useState('');
  const [personResult, setPersonResult] = useState('');
  const [personLoading, setPersonLoading] = useState(false);

  const [uxData, setUxData] = useState('');
  const [uxResult, setUxResult] = useState('');
  const [uxLoading, setUxLoading] = useState(false);

  const [widgetSource, setWidgetSource] = useState('');
  const [widgetUseCase, setWidgetUseCase] = useState('');
  const [widgetResult, setWidgetResult] = useState('');
  const [widgetLoading, setWidgetLoading] = useState(false);

  // Design tools state (from AIToolsPlus)
  const [plusState, setPlusState] = useState<Record<string, Record<string, string>>>({});
  const [plusResults, setPlusResults] = useState<Record<string, string>>({});
  const [plusLoading, setPlusLoading] = useState<Record<string, boolean>>({});
  const [plusErrors, setPlusErrors] = useState<Record<string, string>>({});

  async function runLayout() {
    setLayoutLoading(true); setLayoutResult('');
    try { const d = await apiFetch('/ai/suggest-layout', { method: 'POST', body: JSON.stringify({ user_role: layoutRole, user_behavior: layoutBehavior, current_layout: layoutCurrent }) }); setLayoutResult(d.result); }
    catch { setLayoutResult('Failed'); } finally { setLayoutLoading(false); }
  }

  async function runPerson() {
    setPersonLoading(true); setPersonResult('');
    try { const d = await apiFetch('/ai/personalize', { method: 'POST', body: JSON.stringify({ user_id: personUserId, usage_patterns: personPatterns }) }); setPersonResult(d.result); }
    catch { setPersonResult('Failed'); } finally { setPersonLoading(false); }
  }

  async function runUX() {
    setUxLoading(true); setUxResult('');
    try { const d = await apiFetch('/ai/ux-analysis', { method: 'POST', body: JSON.stringify({ session_data: uxData }) }); setUxResult(d.result); }
    catch { setUxResult('Failed'); } finally { setUxLoading(false); }
  }

  async function runWidget() {
    setWidgetLoading(true); setWidgetResult('');
    try { const d = await apiFetch('/ai/generate-widget', { method: 'POST', body: JSON.stringify({ data_source: widgetSource, use_case: widgetUseCase }) }); setWidgetResult(d.result); }
    catch { setWidgetResult('Failed'); } finally { setWidgetLoading(false); }
  }

  function setPlusField(sec: string, field: string, value: string) {
    setPlusState(prev => ({ ...prev, [sec]: { ...(prev[sec] || {}), [field]: value } }));
  }

  function applyPlusSample(secKey: string, values: Record<string, string>) {
    setPlusState(prev => ({ ...prev, [secKey]: { ...(prev[secKey] || {}), ...values } }));
  }

  async function runPlus(sec: PlusSection) {
    const body = sec.buildBody(plusState[sec.key] || {});
    const required = sec.fields[0].name;
    if (!body[required] || !String(body[required]).trim()) return;
    setPlusLoading(p => ({ ...p, [sec.key]: true }));
    setPlusResults(p => ({ ...p, [sec.key]: '' }));
    setPlusErrors(p => ({ ...p, [sec.key]: '' }));
    try {
      const d = await apiFetch(sec.endpoint, { method: 'POST', body: JSON.stringify(body) });
      setPlusResults(p => ({ ...p, [sec.key]: d.result }));
    } catch (e: any) {
      const msg = e.message || 'Failed';
      setPlusErrors(p => ({ ...p, [sec.key]: msg.includes('unavailable') || msg.includes('503') ? 'AI service is currently unavailable. Try again shortly.' : msg }));
    } finally {
      setPlusLoading(p => ({ ...p, [sec.key]: false }));
    }
  }

  const layoutSamples = [
    { label: 'Senior engineer', apply: () => { setLayoutRole('Senior Backend Engineer'); setLayoutBehavior('Heavy keyboard user, reviews 8-12 PRs/day, lives in terminal + IDE, opens dashboards mainly to check CI/CD failures and on-call alerts.'); setLayoutCurrent('dashboard'); } },
    { label: 'PM', apply: () => { setLayoutRole('Product Manager'); setLayoutBehavior('Spends most time in roadmap and feedback views; daily standup ritual; pulls weekly KPI snapshots; rarely uses keyboard shortcuts.'); setLayoutCurrent('kanban'); } },
    { label: 'Sales lead', apply: () => { setLayoutRole('Sales Team Lead'); setLayoutBehavior('Lives in pipeline timeline; reviews deals every morning, exports to CSV weekly, prefers visual cards over dense tables.'); setLayoutCurrent('timeline'); } }
  ];
  const personSamples = [
    { label: 'Power user', apply: () => { setPersonUserId('u_8821 (power user)'); setPersonPatterns('Logs in 5x/day, uses command palette ~40 times/session, customizes shortcuts, exports CSV weekly, ignores onboarding tooltips.'); } },
    { label: 'New trial', apply: () => { setPersonUserId('u_4410 (trial, day 2)'); setPersonPatterns('Logged in twice, viewed dashboard then bounced, has not connected a data source, opened the Templates page but did not pick one.'); } },
    { label: 'Admin', apply: () => { setPersonUserId('u_0007 (workspace admin)'); setPersonPatterns('Manages 32 seats, frequents Users + Audit Log, never opens widgets, runs reports monthly, mostly desktop Safari.'); } }
  ];
  const uxSamples = [
    { label: 'High-bounce funnel', apply: () => setUxData('Session 12m, 84 actions. Funnel: Landing (100%) -> Signup (62%) -> Connect data (28%) -> First widget (9%). Top dropoff: "Connect data" step (avg 41s, 3 retries on OAuth modal). 14 console errors on /widgets/new.') },
    { label: 'Power-user flow', apply: () => setUxData('Session 47m, 612 actions. Heavy command-palette usage (Cmd+K x38). Zero errors. Flow: dashboard -> templates -> widgets -> sessions, repeated 4x. Avg time-on-task 22s, well below median.') },
    { label: 'Confused new user', apply: () => setUxData('Session 6m, 19 actions. User clicked logo 4x, opened Settings then back-button immediately, hovered nav items for 11s without clicking, closed onboarding tour at step 1. No completed flows.') }
  ];
  const widgetSamples = [
    { label: 'GitHub PR tile', apply: () => { setWidgetSource('github-api'); setWidgetUseCase('A KPI tile showing open PRs assigned to me, color-coded by review state (red = changes requested, amber = waiting), with a sparkline of merge cadence over the last 14 days.'); } },
    { label: 'Stripe MRR', apply: () => { setWidgetSource('stripe-api'); setWidgetUseCase('MRR & churn dashboard widget: current MRR, MoM delta, top 5 expansion accounts, and a stacked-area chart of new vs. churned MRR for the last 90 days.'); } },
    { label: 'On-call alerts', apply: () => { setWidgetSource('pagerduty-api'); setWidgetUseCase('On-call summary widget: current incident count by severity, who is paged, and a 24h heatmap of alerts per service to spot noisy services.'); } }
  ];

  function SampleRow({ items }: { items: { label: string; apply: () => void }[] }) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Samples:</span>
        {items.map(s => (
          <button key={s.label} type="button" onClick={s.apply}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-2.5 py-1 rounded-md">
            {s.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-6"><Sparkles size={28} className="text-violet-400" /><h1 className="text-2xl font-bold text-white">AI Center</h1></div>

      <div className="flex gap-2 border-b border-gray-800 mb-2">
        <button type="button" onClick={() => setTab('core')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'core' ? 'border-violet-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
          Core Tools
        </button>
        <button type="button" onClick={() => setTab('design')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'design' ? 'border-violet-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}>
          Design Tools <span className="text-xs text-gray-500">(5)</span>
        </button>
      </div>

      {tab === 'core' && (
        <>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4"><Layout size={20} className="text-indigo-400" /><h2 className="text-lg font-semibold text-white">Suggest Layout</h2></div>
            <SampleRow items={layoutSamples} />
            <div className="space-y-3 mb-3">
              <input value={layoutRole} onChange={e => setLayoutRole(e.target.value)} placeholder="User role (e.g. Senior Engineer)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={layoutBehavior} onChange={e => setLayoutBehavior(e.target.value)} placeholder="Behavior patterns (e.g. heavy keyboard user, reviews code daily)"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
              <select value={layoutCurrent} onChange={e => setLayoutCurrent(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {['dashboard','tasklist','kanban','grid','timeline','calendar'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button onClick={runLayout} disabled={layoutLoading || !layoutRole.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} />{layoutLoading ? 'Analyzing...' : 'Suggest Layout'}
            </button>
            <div className="mt-4"><AIResponse title="Layout Suggestion" content={layoutResult} loading={layoutLoading} /></div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4"><User size={20} className="text-green-400" /><h2 className="text-lg font-semibold text-white">Personalize Interface</h2></div>
            <SampleRow items={personSamples} />
            <div className="space-y-3 mb-3">
              <input value={personUserId} onChange={e => setPersonUserId(e.target.value)} placeholder="User ID or description"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={personPatterns} onChange={e => setPersonPatterns(e.target.value)} placeholder="Usage patterns (actions taken, time spent, features used)"
                rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            </div>
            <button onClick={runPerson} disabled={personLoading || !personUserId.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} />{personLoading ? 'Personalizing...' : 'Generate Personalization'}
            </button>
            <div className="mt-4"><AIResponse title="Personalization Recommendations" content={personResult} loading={personLoading} /></div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4"><BarChart2 size={20} className="text-yellow-400" /><h2 className="text-lg font-semibold text-white">UX Analysis</h2></div>
            <SampleRow items={uxSamples} />
            <textarea value={uxData} onChange={e => setUxData(e.target.value)} placeholder="Paste session data: duration, actions, dropoffs, errors, flows..."
              rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none mb-3" />
            <button onClick={runUX} disabled={uxLoading || !uxData.trim()}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} />{uxLoading ? 'Analyzing...' : 'Analyze UX'}
            </button>
            <div className="mt-4"><AIResponse title="UX Analysis" content={uxResult} loading={uxLoading} /></div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center gap-2 mb-4"><PuzzleIcon size={20} className="text-pink-400" /><h2 className="text-lg font-semibold text-white">Generate Widget</h2></div>
            <SampleRow items={widgetSamples} />
            <div className="space-y-3 mb-3">
              <input value={widgetSource} onChange={e => setWidgetSource(e.target.value)} placeholder="Data source (e.g. github-api, billing-api)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
              <textarea value={widgetUseCase} onChange={e => setWidgetUseCase(e.target.value)} placeholder="Use case description"
                rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
            </div>
            <button onClick={runWidget} disabled={widgetLoading || !widgetSource.trim()}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} />{widgetLoading ? 'Generating...' : 'Generate Widget'}
            </button>
            <div className="mt-4"><AIResponse title="Widget Configuration" content={widgetResult} loading={widgetLoading} /></div>
          </div>
        </>
      )}

      {tab === 'design' && (
        <>
          {PLUS_SECTIONS.map(sec => {
            const Icon = sec.icon;
            const data = plusState[sec.key] || {};
            const required = sec.fields[0].name;
            return (
              <div key={sec.key} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <div className="flex items-center gap-2 mb-4"><Icon size={20} className={COLOR_ICON[sec.color]} /><h2 className="text-lg font-semibold text-white">{sec.title}</h2></div>
                {sec.samples && sec.samples.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Samples:</span>
                    {sec.samples.map(sm => (
                      <button key={sm.label} type="button" onClick={() => applyPlusSample(sec.key, sm.values)}
                        className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-2.5 py-1 rounded-md">
                        {sm.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="space-y-3 mb-3">
                  {sec.fields.map(f => f.rows && f.rows > 1 ? (
                    <textarea key={f.name} value={data[f.name] || ''} onChange={e => setPlusField(sec.key, f.name, e.target.value)}
                      placeholder={f.placeholder} rows={f.rows}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none" />
                  ) : (
                    <input key={f.name} value={data[f.name] || ''} onChange={e => setPlusField(sec.key, f.name, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
                  ))}
                </div>
                <button onClick={() => runPlus(sec)} disabled={plusLoading[sec.key] || !((data[required] || '').trim())}
                  className={`${COLOR_BTN[sec.color]} disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2`}>
                  <Sparkles size={16} />{plusLoading[sec.key] ? 'Working...' : `Run ${sec.title}`}
                </button>
                {plusErrors[sec.key] && <div className="mt-3 text-sm text-red-300 bg-red-900/30 border border-red-800 rounded-lg p-3">{plusErrors[sec.key]}</div>}
                <div className="mt-4"><AIResponse title={sec.title} content={plusResults[sec.key] || ''} loading={plusLoading[sec.key]} /></div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
