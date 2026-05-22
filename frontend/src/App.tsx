import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UIUsersPage from './pages/UIUsersPage';
import TemplatesPage from './pages/TemplatesPage';
import WidgetsPage from './pages/WidgetsPage';
import SessionsPage from './pages/SessionsPage';
import CustomizationsPage from './pages/CustomizationsPage';
import FeedbackPage from './pages/FeedbackPage';
import AICenter from './components/AICenter';
import UtilityPage from './pages/UtilityPage';
import SampleDataPage from './pages/SampleDataPage';
import IntentGraphPage from './pages/IntentGraphPage';
import ComponentRegistryPage from './pages/ComponentRegistryPage';
import LayoutVariantsPage from './pages/LayoutVariantsPage';
import UIGenerationRunsPage from './pages/UIGenerationRunsPage';
import IntentClassifierPage from './pages/IntentClassifierPage';
import DesignTokensPage from './pages/DesignTokensPage';
import CustomViewsPage from './pages/CustomViewsPage';

import GapFeedbackClustering from './pages/GapFeedbackClustering';
import GapSessionReplaySummarizer from './pages/GapSessionReplaySummarizer';
import GapAgentCustomizer from './pages/GapAgentCustomizer';
import GapScreenshotExtractor from './pages/GapScreenshotExtractor';
import GapI18nTranslator from './pages/GapI18nTranslator';
import GapMultiAppWorkspace from './pages/GapMultiAppWorkspace';
import GapWidgetMarketplace from './pages/GapWidgetMarketplace';
import GapCustomizationVersioning from './pages/GapCustomizationVersioning';
import GapRenderEndpoint from './pages/GapRenderEndpoint';
import GapAnalyticsEvents from './pages/GapAnalyticsEvents';
import GapThemeToggle from './pages/GapThemeToggle';
import CfFdaLoop from './pages/CfFdaLoop';
import CfPrimitivesMarketplace from './pages/CfPrimitivesMarketplace';
import CfCrossAppPortable from './pages/CfCrossAppPortable';
import CfLiveSpecCompile from './pages/CfLiveSpecCompile';
import CfA11yByConstruction from './pages/CfA11yByConstruction';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';
import AdaptationConflictPage from './pages/AdaptationConflictPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ui-users" element={<UIUsersPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/widgets" element={<WidgetsPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/customizations" element={<CustomizationsPage />} />
                <Route path="/feedback" element={<FeedbackPage />} />
                <Route path="/ai" element={<AICenter />} />
                <Route path="/ai-plus" element={<Navigate to="/ai" replace />} />
                <Route path="/utility" element={<UtilityPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
                <Route path="/intent-graph" element={<IntentGraphPage />} />
                <Route path="/component-registry" element={<ComponentRegistryPage />} />
                <Route path="/layout-variants" element={<LayoutVariantsPage />} />
                <Route path="/ui-generation-runs" element={<UIGenerationRunsPage />} />
                <Route path="/intent-classifier" element={<IntentClassifierPage />} />
                <Route path="/design-tokens" element={<DesignTokensPage />} />
                <Route path="/custom-views" element={<CustomViewsPage />} />
                <Route path="/gap/feedback-clustering" element={<GapFeedbackClustering />} />
                <Route path="/gap/session-replay-summarizer" element={<GapSessionReplaySummarizer />} />
                <Route path="/gap/agent-customizer" element={<GapAgentCustomizer />} />
                <Route path="/gap/screenshot-extractor" element={<GapScreenshotExtractor />} />
                <Route path="/gap/i18n-translator" element={<GapI18nTranslator />} />
                <Route path="/gap/multi-app-workspace" element={<GapMultiAppWorkspace />} />
                <Route path="/gap/widget-marketplace" element={<GapWidgetMarketplace />} />
                <Route path="/gap/customization-versioning" element={<GapCustomizationVersioning />} />
                <Route path="/gap/render-endpoint" element={<GapRenderEndpoint />} />
                <Route path="/gap/analytics-events" element={<GapAnalyticsEvents />} />
                <Route path="/gap/theme-toggle" element={<GapThemeToggle />} />
                <Route path="/cf/fda-loop" element={<CfFdaLoop />} />
                <Route path="/cf/primitives-marketplace" element={<CfPrimitivesMarketplace />} />
                <Route path="/cf/cross-app-portable" element={<CfCrossAppPortable />} />
                <Route path="/cf/live-spec-compile" element={<CfLiveSpecCompile />} />
                <Route path="/cf/a11y-by-construction" element={<CfA11yByConstruction />} />
                <Route path="/adaptation-conflict" element={<AdaptationConflictPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
