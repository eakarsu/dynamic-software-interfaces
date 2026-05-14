export type Layout = 'tasklist' | 'calendar' | 'kanban' | 'dashboard'
export type Density = 'compact' | 'comfortable' | 'spacious'

export interface InterfaceConfig {
  layout: Layout
  primaryColor: string
  widgets: string[]
  density: Density
}

export interface MockEmail {
  id: string
  subject: string
  from: string
  date: string        // ISO date string
  status: 'unread' | 'read' | 'replied' | 'archived'
  priority: 'high' | 'normal' | 'low'
  preview: string
}

export type PersonaKey = 'powerUser' | 'student' | 'developer' | 'executive'

export interface Persona {
  key: PersonaKey
  label: string
  description: string
  config: InterfaceConfig
}
