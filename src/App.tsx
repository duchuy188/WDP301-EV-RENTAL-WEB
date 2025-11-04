import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import FindCar from './pages/FindCar';
import VehicleDetail from './pages/VehicleDetail';
import Booking from './pages/Booking';
import EditBooking from './pages/EditBooking';
import BookingSuccessPage from './components/Booking/BookingSuccessPage';
import VNPayPayment from './pages/VNPayPayment';
import VNPayCallback from './pages/VNPayCallback';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import CheckIn from './pages/CheckIn';
import ReturnCar from './pages/ReturnCar';
import History from './pages/History';
import Profile from './pages/Profile';
import Support from './pages/Support';
import ChatbotPage from './pages/ChatbotPage';
import ChatHistoryPage from './pages/ChatHistoryPage';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import StationPage from './pages/StationPage';
import StationDetail from './pages/StationDetail';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
            {/* Authentication routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/terms" element={<Terms />} />              {/* Main application routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="find-car" element={<FindCar />} />
                <Route path="/vehicle/:id" element={<VehicleDetail />} />
                <Route path="booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="booking/edit/:id" element={<ProtectedRoute><EditBooking /></ProtectedRoute>} />
                <Route path="payment" element={<ProtectedRoute><VNPayPayment /></ProtectedRoute>} />
                <Route path="payment/callback" element={<VNPayCallback />} />
                <Route path="payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="payment-failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
                <Route path="booking-failed" element={<ProtectedRoute><PaymentFailed /></ProtectedRoute>} />
                <Route path="booking-success" element={<ProtectedRoute><BookingSuccessPage /></ProtectedRoute>} />
                <Route path="checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
                <Route path="return" element={<ProtectedRoute><ReturnCar /></ProtectedRoute>} />
                <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="support" element={<Support />} />
                <Route path="chatbot" element={<ChatbotPage />} />
                <Route path="chat-history" element={<ProtectedRoute><ChatHistoryPage /></ProtectedRoute>} />
                <Route path="stations" element={<StationPage />} />
                <Route path="station/:id" element={<StationDetail />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;