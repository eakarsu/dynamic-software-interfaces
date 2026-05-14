INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO ui_users (name, email, role, persona, interface_layout, theme, density, active_since, session_count, satisfaction_score) VALUES
('Alex Chen', 'alex.chen@company.com', 'Senior Engineer', 'power_user', 'dashboard', 'dark', 'compact', '2023-01-15', 342, 4.6),
('Maria Santos', 'maria.santos@company.com', 'Product Manager', 'executive', 'kanban', 'light', 'comfortable', '2023-03-20', 178, 4.2),
('Jake Williams', 'jake.w@startup.com', 'Student Intern', 'student', 'calendar', 'light', 'spacious', '2024-06-01', 45, 3.8),
('Priya Patel', 'priya.patel@design.co', 'UX Designer', 'designer', 'grid', 'dark', 'compact', '2023-09-10', 267, 4.7),
('Tom Fischer', 'tom.fischer@corp.com', 'Engineering Manager', 'manager', 'timeline', 'dark', 'comfortable', '2022-11-05', 512, 4.4),
('Sarah Kim', 'sarah.kim@tech.io', 'Full Stack Developer', 'developer', 'tasklist', 'dark', 'compact', '2023-05-14', 398, 4.5),
('David Lee', 'david.lee@finance.com', 'CFO', 'executive', 'dashboard', 'light', 'comfortable', '2022-08-30', 156, 4.1),
('Anika Müller', 'anika.muller@design.eu', 'UI Designer', 'designer', 'grid', 'dark', 'spacious', '2023-07-22', 201, 4.8),
('Carlos Rivera', 'carlos.r@startup.io', 'Founder', 'executive', 'dashboard', 'dark', 'compact', '2022-05-01', 634, 4.3),
('Emma Johnson', 'emma.j@university.edu', 'Graduate Student', 'student', 'calendar', 'light', 'spacious', '2024-01-15', 87, 4.0),
('Michael Park', 'm.park@enterprise.com', 'Solutions Architect', 'developer', 'timeline', 'dark', 'compact', '2023-02-08', 289, 4.6),
('Lisa Thompson', 'lisa.t@agency.com', 'Project Manager', 'manager', 'kanban', 'light', 'comfortable', '2023-04-17', 445, 4.2),
('Ryan O''Brien', 'ryan.o@saas.com', 'Sales Engineer', 'power_user', 'dashboard', 'dark', 'compact', '2022-12-01', 378, 4.4),
('Zara Ahmed', 'zara.a@consulting.com', 'Business Analyst', 'manager', 'grid', 'light', 'comfortable', '2023-08-25', 134, 3.9),
('Oliver Nguyen', 'oliver.n@fintech.com', 'Backend Developer', 'developer', 'tasklist', 'dark', 'compact', '2023-11-12', 223, 4.5)
ON CONFLICT DO NOTHING;

INSERT INTO templates (name, description, layout, target_persona, primary_color, density, widgets_json, usage_count, rating) VALUES
('Power User Dashboard', 'Dense, information-rich layout with quick keyboard navigation', 'dashboard', 'power_user', '#6366f1', 'compact', '["metrics","recent-activity","quick-actions","notifications"]', 1247, 4.7),
('Executive Overview', 'Clean, high-level KPI view with minimal detail', 'dashboard', 'executive', '#0ea5e9', 'comfortable', '["kpi-summary","trend-chart","alerts","team-status"]', 892, 4.5),
('Developer Tasklist', 'Code-centric task management with PR and issue tracking', 'tasklist', 'developer', '#22c55e', 'compact', '["todo","pull-requests","builds","deployments"]', 2034, 4.8),
('Student Calendar View', 'Event-focused calendar with assignment tracking', 'calendar', 'student', '#f59e0b', 'spacious', '["monthly-calendar","upcoming-events","assignments","study-timer"]', 456, 4.3),
('Designer Canvas Grid', 'Visual grid layout with asset management and project tracking', 'grid', 'designer', '#ec4899', 'spacious', '["asset-grid","project-gallery","color-palette","inspiration-feed"]', 678, 4.6),
('Manager Kanban', 'Team workload visualization with sprint planning', 'kanban', 'manager', '#8b5cf6', 'comfortable', '["sprint-board","team-capacity","blockers","retrospective"]', 934, 4.4),
('Timeline Project View', 'Gantt-style timeline for project managers', 'timeline', 'manager', '#10b981', 'comfortable', '["gantt-chart","milestones","dependencies","resource-map"]', 567, 4.2),
('Minimal Focus Mode', 'Distraction-free single-task interface', 'tasklist', 'student', '#94a3b8', 'spacious', '["current-task","timer","notes","progress"]', 345, 4.1),
('Analytics Dashboard Pro', 'Data visualization heavy dashboard for analysts', 'dashboard', 'power_user', '#f97316', 'compact', '["charts","data-table","filters","export"]', 1123, 4.6),
('Mobile-First Grid', 'Responsive grid optimized for tablet and mobile', 'grid', 'student', '#06b6d4', 'comfortable', '["quick-access","recent","notifications","search"]', 234, 3.9),
('Collaboration Hub', 'Team communication and coordination central view', 'kanban', 'manager', '#6366f1', 'comfortable', '["team-feed","shared-docs","meetings","decisions"]', 789, 4.3),
('DevOps Pipeline View', 'CI/CD pipeline monitoring and deployment tracking', 'timeline', 'developer', '#14b8a6', 'compact', '["pipeline-status","deployments","monitoring","alerts"]', 412, 4.5),
('Design System Browser', 'Component library and design token management', 'grid', 'designer', '#8b5cf6', 'comfortable', '["components","tokens","documentation","version-history"]', 298, 4.4),
('Executive Briefing', 'Morning briefing with AI-summarized daily digest', 'dashboard', 'executive', '#1e40af', 'comfortable', '["daily-digest","critical-metrics","calendar","ai-insights"]', 567, 4.7),
('Compact Code Review', 'Ultra-dense code review focused developer view', 'tasklist', 'developer', '#dc2626', 'compact', '["open-prs","code-changes","comments","test-results"]', 876, 4.6)
ON CONFLICT DO NOTHING;

INSERT INTO widgets (name, type, description, data_source, config_schema, category, popularity) VALUES
('Revenue Chart', 'chart', 'Real-time revenue trend visualization with forecasting', 'billing-api', '{"timeRange":"30d","currency":"USD","forecast":true}', 'analytics', 892),
('Task Board', 'kanban', 'Drag-and-drop kanban board for task management', 'tasks-api', '{"columns":["todo","in-progress","done"],"swimlanes":false}', 'productivity', 1234),
('Team Calendar', 'calendar', 'Shared calendar with meeting and deadline overlay', 'calendar-api', '{"view":"month","showWeekNumbers":true}', 'collaboration', 678),
('Deployment Timeline', 'timeline', 'CI/CD deployment history and upcoming releases', 'devops-api', '{"environments":["staging","prod"],"lookback":"7d"}', 'devops', 445),
('KPI Metric Card', 'metric', 'Single metric display with trend indicator', 'metrics-api', '{"metric":"","comparison":"prev_period","format":"number"}', 'analytics', 2103),
('User Feedback Form', 'form', 'Embedded feedback collection with NPS scoring', 'feedback-api', '{"fields":["nps","comment","category"],"trigger":"manual"}', 'engagement', 234),
('Activity Feed', 'feed', 'Real-time team activity stream with filtering', 'activity-api', '{"limit":50,"filters":["user","action","resource"]}', 'collaboration', 567),
('Data Table', 'table', 'Sortable, filterable data table with export', 'data-api', '{"columns":[],"pageSize":25,"exportFormats":["csv","xlsx"]}', 'data', 1567),
('Burndown Chart', 'chart', 'Sprint burndown visualization for agile teams', 'sprints-api', '{"sprintId":null,"showIdeal":true}', 'agile', 389),
('Quick Notes', 'form', 'Sticky note widget for quick capture', 'notes-api', '{"maxLength":500,"colors":["yellow","blue","green"]}', 'productivity', 876),
('PR Review Queue', 'table', 'Open pull requests with review status', 'github-api', '{"repo":"","assignedToMe":true,"draft":false}', 'devops', 723),
('Meeting Scheduler', 'calendar', 'Smart meeting scheduler with availability detection', 'calendar-api', '{"duration":30,"buffer":5,"timezone":"auto"}', 'collaboration', 312),
('Color Palette Picker', 'chart', 'Design token color palette management and preview', 'design-api', '{"tokens":[],"format":"hex"}', 'design', 198),
('Project Progress', 'metric', 'Multi-milestone project completion tracker', 'projects-api', '{"showMilestones":true,"completionMetric":"tasks"}', 'productivity', 634),
('Error Monitoring', 'feed', 'Real-time application error stream with severity levels', 'monitoring-api', '{"severity":["error","critical"],"groupSimilar":true}', 'devops', 456)
ON CONFLICT DO NOTHING;

INSERT INTO ui_sessions (ui_user_id, started_at, ended_at, duration_mins, layout_used, actions_count, satisfaction_rating, device_type) VALUES
(1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 120, 'dashboard', 156, 5, 'desktop'),
(2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', 45, 'kanban', 43, 4, 'laptop'),
(3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', 30, 'calendar', 28, 4, 'tablet'),
(4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '90 minutes', 90, 'grid', 89, 5, 'desktop'),
(5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', 180, 'timeline', 234, 4, 'desktop'),
(6, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '2 hours', 120, 'tasklist', 178, 5, 'desktop'),
(7, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '25 minutes', 25, 'dashboard', 18, 3, 'laptop'),
(8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', 60, 'grid', 67, 5, 'desktop'),
(9, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '4 hours', 240, 'dashboard', 312, 4, 'desktop'),
(10, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 60, 'calendar', 45, 4, 'tablet'),
(11, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '2 hours', 120, 'timeline', 145, 5, 'desktop'),
(12, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 hours', 180, 'kanban', 267, 4, 'laptop'),
(13, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '90 minutes', 90, 'dashboard', 123, 4, 'desktop'),
(1, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '2 hours', 120, 'dashboard', 189, 5, 'desktop'),
(6, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', 60, 'tasklist', 98, 5, 'desktop')
ON CONFLICT DO NOTHING;

INSERT INTO customizations (ui_user_id, config_name, config_json, is_active, description, last_used) VALUES
(1, 'Morning Dashboard', '{"widgets":["kpi-summary","pr-queue","deployment-status"],"theme":"dark","density":"compact"}', true, 'Optimized morning startup view', NOW() - INTERVAL '1 day'),
(2, 'Sprint Planning Mode', '{"widgets":["kanban","burndown","team-capacity"],"density":"comfortable"}', true, 'Weekly sprint planning setup', NOW() - INTERVAL '3 days'),
(3, 'Study Session', '{"widgets":["calendar","timer","notes"],"theme":"light","density":"spacious"}', true, 'Distraction-free study mode', NOW() - INTERVAL '2 days'),
(4, 'Design Review', '{"widgets":["asset-grid","component-browser","color-palette"],"theme":"dark"}', true, 'Design review and critique mode', NOW() - INTERVAL '4 days'),
(5, 'Team Standup', '{"widgets":["team-status","blockers","sprint-progress"],"density":"compact"}', true, 'Daily standup view', NOW() - INTERVAL '1 day'),
(6, 'Deep Work Mode', '{"widgets":["current-task","timer","code-review"],"hideNav":true}', true, 'Focused development sessions', NOW() - INTERVAL '2 days'),
(7, 'Executive Briefing', '{"widgets":["daily-digest","financial-kpi","risk-alerts"],"theme":"light"}', false, 'Deprecated morning briefing', NOW() - INTERVAL '30 days'),
(8, 'Component Audit', '{"widgets":["design-system","accessibility-checker","usage-stats"]}', true, 'Monthly design system audit', NOW() - INTERVAL '7 days'),
(9, 'Board Meeting Prep', '{"widgets":["financial-summary","growth-metrics","investor-kpis"],"density":"comfortable"}', true, 'Quarterly board preparation', NOW() - INTERVAL '5 days'),
(11, 'Architecture Review', '{"widgets":["system-diagram","performance-metrics","dependency-graph"],"density":"compact"}', true, 'Weekly architecture review', NOW() - INTERVAL '6 days'),
(12, 'Project Tracking', '{"widgets":["gantt","milestones","resource-allocation"],"theme":"light"}', true, 'Cross-team project tracking', NOW() - INTERVAL '1 day'),
(1, 'Incident Response', '{"widgets":["alerts","error-feed","deployment-rollback"],"density":"compact","alerts":true}', false, 'On-call incident response mode', NOW() - INTERVAL '15 days'),
(6, 'Code Review Focus', '{"widgets":["open-prs","diff-view","test-results"],"compact":true}', true, 'Efficient code review flow', NOW() - INTERVAL '1 day'),
(4, 'Client Presentation', '{"widgets":["design-showcase","brand-guidelines","portfolio"],"theme":"light","density":"spacious"}', true, 'Client presentation mode', NOW() - INTERVAL '10 days'),
(13, 'Demo Mode', '{"widgets":["feature-showcase","metrics","customer-success"],"theme":"dark"}', true, 'Sales demo configuration', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO feedback (ui_user_id, template_id, rating, category, comments, status) VALUES
(1, 1, 5, 'usability', 'The compact dashboard is exactly what I need. Keyboard shortcuts work perfectly.', 'reviewed'),
(2, 6, 4, 'functionality', 'Good kanban view. Would love better sprint velocity tracking built in.', 'reviewed'),
(3, 4, 4, 'design', 'Calendar view is intuitive. Could use better mobile support.', 'new'),
(4, 5, 5, 'design', 'Best template for design work. The asset grid is exceptional.', 'reviewed'),
(5, 7, 3, 'functionality', 'Timeline needs more Gantt features. Dependencies are hard to visualize.', 'new'),
(6, 3, 5, 'usability', 'Developer tasklist is a game changer. PR integration is seamless.', 'reviewed'),
(7, 2, 4, 'design', 'Clean executive view. Sometimes too minimal - need more context.', 'reviewed'),
(8, 5, 5, 'design', 'Incredible canvas grid for design work. Would add more design tokens.', 'new'),
(9, 14, 5, 'functionality', 'Executive briefing template saves me 30 minutes every morning.', 'reviewed'),
(10, 4, 4, 'usability', 'Calendar view is perfect for students. Assignment integration would be great.', 'new'),
(11, 12, 4, 'functionality', 'DevOps pipeline view is solid. Needs better alert configuration.', 'reviewed'),
(12, 6, 4, 'design', 'Great kanban layout for managing multiple teams.', 'reviewed'),
(1, 9, 5, 'functionality', 'Analytics dashboard pro is incredible. Best data viz template available.', 'reviewed'),
(6, 15, 5, 'usability', 'Compact code review template boosted my review speed by 40%.', 'new'),
(13, 1, 4, 'functionality', 'Power user dashboard is great for demos. Would add more customization options.', 'new')
ON CONFLICT DO NOTHING;
