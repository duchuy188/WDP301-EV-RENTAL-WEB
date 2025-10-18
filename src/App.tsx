import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home';
import FindCar from './pages/FindCar';
import VehicleDetail from './pages/VehicleDetail';
import Booking from './pages/Booking';
import BookingSuccessPage from './components/Booking/BookingSuccessPage';
import CheckIn from './pages/CheckIn';
import ReturnCar from './pages/ReturnCar';
import History from './pages/History';
import Profile from './pages/Profile';
import Support from './pages/Support';
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
                <Route path="booking" element={<Booking />} />
                <Route path="booking-success" element={<BookingSuccessPage />} />
                <Route path="checkin" element={<CheckIn />} />
                <Route path="return" element={<ReturnCar />} />
                <Route path="history" element={<History />} />
                <Route path="profile" element={<Profile />} />
                <Route path="support" element={<Support />} />
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