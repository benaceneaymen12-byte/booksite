import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import { Sidebar, MobileNav, TopBar, ComplianceBanner } from './components/Layout';
import Dashboard from './pages/Dashboard';
import AnalysesList from './pages/AnalysesList';
import AnalysisForm from './pages/AnalysisForm';
import PersonnelList from './pages/PersonnelList';
import PersonnelForm from './pages/PersonnelForm';
import WaterList from './pages/WaterList';
import WaterForm from './pages/WaterForm';
import MediaList from './pages/MediaList';
import MediaForm from './pages/MediaForm';
import MicroList from './pages/MicroList';
import MicroForm from './pages/MicroForm';
import Calculator from './pages/Calculator';
import ReportsList from './pages/ReportsList';
import ReportForm from './pages/ReportForm';
import ReportPreview from './pages/ReportPreview';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AuditPage from './pages/AuditPage';
import LoginPage from './pages/LoginPage';
import './i18n';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex">
      <Sidebar />
      <div className="flex-1 lg:pl-60 pb-20 lg:pb-0 flex flex-col">
        <TopBar />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <ComplianceBanner />
          <div className="mt-4">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AnalysesList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AnalysisForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyses/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AnalysisForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PersonnelList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PersonnelForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personnel/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <PersonnelForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/water"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <WaterList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/water/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <WaterForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/water/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <WaterForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MediaList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MediaForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MediaForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/microorganisms"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MicroList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/microorganisms/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MicroForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/microorganisms/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <MicroForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/calculator"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Calculator />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ReportsList />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/new"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ReportForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ReportForm />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/:id/preview"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ReportPreview />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SearchPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AuditPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
