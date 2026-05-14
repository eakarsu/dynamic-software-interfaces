export interface UIUser {
  id: number;
  name: string;
  email: string;
  role: string;
  persona: string;
  interface_layout: string;
  theme: string;
  density: string;
  active_since: string;
  session_count: number;
  satisfaction_score: number;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  layout: string;
  target_persona: string;
  primary_color: string;
  density: string;
  widgets_json: string;
  usage_count: number;
  rating: number;
  created_at: string;
}

export interface Widget {
  id: number;
  name: string;
  type: string;
  description: string;
  data_source: string;
  config_schema: string;
  preview_url: string;
  category: string;
  popularity: number;
}

export interface UISession {
  id: number;
  ui_user_id: number;
  started_at: string;
  ended_at: string;
  duration_mins: number;
  layout_used: string;
  actions_count: number;
  satisfaction_rating: number;
  device_type: string;
  user_name?: string;
}

export interface Customization {
  id: number;
  ui_user_id: number;
  config_name: string;
  config_json: string;
  is_active: boolean;
  created_at: string;
  last_used: string;
  description: string;
  user_name?: string;
}

export interface Feedback {
  id: number;
  ui_user_id: number;
  template_id: number;
  rating: number;
  category: string;
  comments: string;
  submitted_at: string;
  status: string;
  user_name?: string;
  template_name?: string;
}
