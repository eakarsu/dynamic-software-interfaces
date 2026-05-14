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
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
