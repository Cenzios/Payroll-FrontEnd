import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import VerifyInfo from './pages/VerifyInfo';
import VerifyEmail from './pages/VerifyEmail';
import SetPassword from './pages/SetPassword';
import SetCompany from './pages/SetCompany';
import GetPlan from './pages/GetPlan';
import TermsAndConditions from './pages/TermsAndConditions';
import BuyPlan from './pages/BuyPlan';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Employees from './pages/Employees';
import Salary from './pages/Salary'; // Import Salary
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import CFormReport from './pages/CFormReport';
import ProtectedRoute from './components/ProtectedRoute';
import ConfirmationFail from './pages/ConfirmationFail';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import RenewPlanModal from './components/RenewPlanModal';
import SettleInvoice from './pages/SettleInvoice';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAccessStatus } from './store/slices/authSlice';

function App() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(checkAccessStatus());
    }
  }, [token, dispatch]);

  return (
    <Router>
      <RenewPlanModal />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-info" element={<VerifyInfo />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/set-company" element={<SetCompany />} />
        <Route path="/get-plan" element={<GetPlan />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/buy-plan" element={<BuyPlan />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/confirmation-fail" element={<ConfirmationFail />} />
        <Route path="/payment/success" element={<Confirmation />} />
        <Route path="/payment/cancel" element={<ConfirmationFail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/google-auth-success" element={<GoogleAuthSuccess />} />
        <Route path="/settle-invoice" element={<SettleInvoice />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <Companies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salary"
          element={
            <ProtectedRoute>
              <Salary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <Loans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/c-form"
          element={
            <ProtectedRoute>
              <CFormReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

//12/11/2025  1:50PM
export default App;