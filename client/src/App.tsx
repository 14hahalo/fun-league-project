import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { AdminRoute } from './components/auth/AdminRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { VisitorPage } from './pages/VisitorPage';
import { MatchesPage } from './pages/MatchesPage';
import { AdminPage } from './pages/AdminPage';
import { GameStatsPage } from './pages/GameStatsPage';
import { MatchDetailsPage } from './pages/MatchDetailsPage';
import { PlayersPage } from './pages/PlayersPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LoginPage } from './pages/LoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { PlayerStatsManagementPage } from './pages/PlayerStatsManagementPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<VisitorPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/game/:gameId/stats" element={<GameStatsPage />} />
            <Route path="/match/:gameId" element={<MatchDetailsPage />} />

            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/player-stats"
              element={
                <AdminRoute>
                  <PlayerStatsManagementPage />
                </AdminRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;