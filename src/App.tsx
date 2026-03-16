import { Router, Route } from '@solidjs/router';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import Landing from './pages/Landing';
import SearchPage from './pages/SearchPage';
import CapstoneDetail from './pages/CapstoneDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Logout from './pages/Logout';
import SubmitCapstone from './pages/SubmitCapstone';
import MySubmissions from './pages/MySubmissions';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import CapstoneApproval from './pages/faculty/CapstoneApproval';
import UserManagement from './pages/admin/UserManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import CapstoneManagement from './pages/admin/CapstoneManagement';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <Router root={Layout}>
      <Route path="/" component={Landing} />
      <Route
        path="/search"
        component={() => (
          <ProtectedRoute roles={['student', 'faculty', 'admin']}>
            <SearchPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/capstone/:id"
        component={() => (
          <ProtectedRoute roles={['student', 'faculty', 'admin']}>
            <CapstoneDetail />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/login"
        component={() => (
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/forgot-password"
        component={() => (
          <PublicOnlyRoute>
            <ForgotPassword />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/register"
        component={() => (
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/verify-email"
        component={() => (
          <PublicOnlyRoute>
            <VerifyEmail />
          </PublicOnlyRoute>
        )}
      />
      <Route path="/logout" component={Logout} />

      <Route
        path="/submit"
        component={() => (
          <ProtectedRoute roles={['student']}>
            <SubmitCapstone />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/my-submissions"
        component={() => (
          <ProtectedRoute roles={['student']}>
            <MySubmissions />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/faculty/dashboard"
        component={() => (
          <ProtectedRoute roles={['faculty', 'admin']}>
            <FacultyDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/faculty/approvals"
        component={() => (
          <ProtectedRoute roles={['faculty', 'admin']}>
            <CapstoneApproval />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/users"
        component={() => (
          <ProtectedRoute roles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/departments"
        component={() => (
          <ProtectedRoute roles={['admin']}>
            <DepartmentManagement />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/capstones"
        component={() => (
          <ProtectedRoute roles={['admin']}>
            <CapstoneManagement />
          </ProtectedRoute>
        )}
      />
      <Route path="*all" component={NotFound} />
    </Router>
  );
};

export default App;