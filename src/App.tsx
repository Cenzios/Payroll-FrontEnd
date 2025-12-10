import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import VerifyInfo from './pages/VerifyInfo';
import VerifyEmail from './pages/VerifyEmail';
import SetPassword from './pages/SetPassword';
import SetCompany from './pages/SetCompany';
import GetPlan from './pages/GetPlan';
import BuyPlan from './pages/BuyPlan';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ConfirmationFail from './pages/ConfirmationFail';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-info" element={<VerifyInfo />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/set-company" element={<SetCompany />} />
        <Route path="/get-plan" element={<GetPlan />} />
        <Route path="/buy-plan" element={<BuyPlan />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/confirmation-fail" element={<ConfirmationFail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
