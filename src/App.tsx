import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataProvider } from './contexts/UserDataContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useAuth } from './contexts/AuthContext';
import { useRoleAuth } from './hooks/useRoleAuth';

// Core components
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded components
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const AgentProfilePage = lazy(() => import('./pages/AgentProfilePage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const AddPropertyPage = lazy(() => import('./pages/AddPropertyPage'));
const PropertyPage = lazy(() => import('./pages/PropertyPage'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));

// CRM pages
const DealsPage = lazy(() => import('./pages/crm/DealsPage'));
const DealDetail = lazy(() => import('./components/crm/deals/DealDetail'));

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'agent' | 'any';
}

function PrivateRoute({ children, requiredRole = 'any' }: PrivateRouteProps) {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useRoleAuth();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  if (requiredRole !== 'any' && role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  return <UserDataProvider>{children}</UserDataProvider>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route
              path="/signup"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <SignUpPage />
                </Suspense>
              }
            />
            <Route
              path="/reset-password"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <PasswordResetPage />
                </Suspense>
              }
            />
            <Route
              path="/update-password"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <UpdatePasswordPage />
                </Suspense>
              }
            />
            <Route
              path="/accept"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <AcceptInvitationPage />
                </Suspense>
              }
            />
            <Route
              path="/agent/:slug"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <AgentProfilePage />
                </Suspense>
              }
            />
            <Route
              path="/property/:slug"
              element={
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                  <PropertyPage />
                </Suspense>
              }
            />

            {/* Agent Dashboard Routes */}
            <Route
              path="/agent-dashboard/*"
              element={
                <PrivateRoute requiredRole="agent">
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                    <AgentDashboardPage />
                  </Suspense>
                </PrivateRoute>
              }
            />

            {/* CRM Routes */}
            <Route
              path="/crm/deals"
              element={
                <PrivateRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                    <DealsPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
            <Route
              path="/crm/deals/:id"
              element={
                <PrivateRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                    <DealDetail />
                  </Suspense>
                </PrivateRoute>
              }
            />

            {/* Dashboard Redirect Route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                    <DashboardRedirect />
                  </Suspense>
                </PrivateRoute>
              }
            />

            {/* Protected Shared Routes */}
            <Route
              path="/dashboard/add-property"
              element={
                <PrivateRoute>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
                    <AddPropertyPage />
                  </Suspense>
                </PrivateRoute>
              }
            />
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;