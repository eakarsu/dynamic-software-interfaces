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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
