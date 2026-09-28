import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { I18nProvider } from './i18n.jsx';
import Layout from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewComplaint from './pages/NewComplaint.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';
import Profile from './pages/Profile.jsx';
import AuthorityLogin from './pages/Authority/Login.jsx';
import AuthorityDashboard from './pages/Authority/Dashboard.jsx';
import AuthorityComplaint from './pages/Authority/Complaint.jsx';

function RequireUser({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAuthority({ children }) {
  const { authority } = useAuth();
  return authority ? children : <Navigate to="/authority/login" replace />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout>
              <Routes>
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="new" element={<RequireUser><NewComplaint /></RequireUser>} />
                <Route path="complaints" element={<RequireUser><Dashboard /></RequireUser>} />
                <Route path="complaints/:id" element={<RequireUser><ComplaintDetail /></RequireUser>} />
                <Route path="profile" element={<RequireUser><Profile /></RequireUser>} />

                {/* Authority portal (separate auth) */}
                <Route path="authority/login" element={<AuthorityLogin />} />
                <Route path="authority" element={<RequireAuthority><AuthorityDashboard /></RequireAuthority>} />
                <Route path="authority/:id" element={<RequireAuthority><AuthorityComplaint /></RequireAuthority>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
