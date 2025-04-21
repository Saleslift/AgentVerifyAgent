import React, { lazy, Suspense, useEffect, memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserDataProvider } from './contexts/UserDataContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { useAuth } from './contexts/AuthContext';
import { useRoleAuth } from './hooks/useRoleAuth';
import { initPageVisibilityHandling, cleanupPageVisibilityHandling } from './utils/pageVisibility';

// Core components
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';

// Lazy-loaded components
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardRedirect = lazy(() => import('./pages/DashboardRedirect'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
const AgentProfilePage = lazy(() => import('./pages/AgentProfilePage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));
const AgencyDashboardPage = lazy(() => import('./pages/AgencyDashboardPage'));
const DeveloperDashboardPage = lazy(() => import('./pages/DeveloperDashboardPage'));
const DeveloperPublicPage = lazy(() => import('./pages/DeveloperPublicPage'));
const EditProfilePage = lazy(() => import('./pages/EditAgentProfilePage.tsx'));
const AddPropertyPage = lazy(() => import('./pages/AddPropertyPage'));
const PropertyPage = lazy(() => import('./pages/PropertyPage'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));
// CRM pages
const DealDetail = lazy(() => import('./components/crm/deals/DealDetail'));


// Optimized lightweight loader
const PageLoader = memo(() => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-300"></div>
    </div>
));

interface PrivateRouteProps {
    children: React.ReactNode;
    requiredRole?: 'agent' | 'agency' | 'developer' | 'any';
}

function PrivateRoute({ children, requiredRole = 'any' }: PrivateRouteProps) {
    const { user, loading } = useAuth();
    const { role, loading: roleLoading } = useRoleAuth();

    if (loading || roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <PageLoader />
            </div>
        );
    }

    if (!user) {
        sessionStorage.setItem('intentional_navigation', 'true');
        return <Navigate to="/signin" />;
    }

    if (requiredRole !== 'any' && role !== requiredRole) {
        return <Navigate to="/dashboard" />;
    }

    return <UserDataProvider>{children}</UserDataProvider>;
}

const App = memo(function App() {
    useEffect(() => {
        initPageVisibilityHandling();
        return () => cleanupPageVisibilityHandling();
    }, []);

    useEffect(() => {
        const prefetchRoutes = async () => {
            if ('connection' in navigator && navigator.connection.saveData) {
                return;
            }

            const path = window.location.pathname;

            if (path === '/') {
                import('./pages/SignInPage');
            } else if (path === '/signin') {
                import('./pages/SignUpPage');
                import('./pages/AgentDashboardPage');
                import('./pages/AgencyDashboardPage');
            }
        };

        const timer = setTimeout(prefetchRoutes, 2000);
        return () => clearTimeout(timer);
    }, []);

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
                                <Suspense fallback={<PageLoader />}>
                                    <SignUpPage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/reset-password"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <PasswordResetPage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/update-password"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <UpdatePasswordPage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/accept"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <AcceptInvitationPage />
                                </Suspense>
                            }
                        />
                        <Route
                            path="/property/:slug"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <PropertyPage />
                                </Suspense>
                            }
                        />

                        {/* Role-Specific Dashboard Routes */}
                        <Route
                            path="/agent-dashboard/*"
                            element={
                                <PrivateRoute requiredRole="agent">
                                    <Suspense fallback={<PageLoader />}>
                                        <AgentDashboardPage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/agency-dashboard/*"
                            element={
                                <PrivateRoute requiredRole="agency">
                                    <Suspense fallback={<PageLoader />}>
                                        <AgencyDashboardPage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/developer-dashboard/*"
                            element={
                                <PrivateRoute requiredRole="developer">
                                    <Suspense fallback={<PageLoader />}>
                                        <DeveloperDashboardPage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />

                        {/* Dashboard Redirect Route */}
                        <Route
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <Suspense fallback={<PageLoader />}>
                                        <DashboardRedirect />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/edit-profile"
                            element={
                                <PrivateRoute>
                                    <Suspense fallback={<PageLoader />}>
                                        <EditProfilePage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/add-property"
                            element={
                                <PrivateRoute>
                                    <Suspense fallback={<PageLoader />}>
                                        <AddPropertyPage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />

                        {/* Redirects */}
                        <Route
                            path="/dashboard/crm/*"
                            element={<Navigate to="/agency-dashboard" replace />}
                        />
                        <Route
                            path="/crm/deals/:id"
                            element={
                                <PrivateRoute requiredRole={'agent'}>
                                    <Suspense fallback={<PageLoader />}>
                                        <DealDetail />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/dashboard/add-property"
                            element={
                                <PrivateRoute requiredRole={'agent'}>
                                    <Suspense fallback={<PageLoader />}>
                                        <AddPropertyPage />
                                    </Suspense>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/agent/:slug"
                            element={
                                <Suspense fallback={<PageLoader />}>
                                    <AgentProfilePage />
                                </Suspense>
                            }
                        />
                        <Route path="/developers/:slug" element={
                            <Suspense fallback={<PageLoader />}>
                                <DeveloperPublicPage />
                            </Suspense>
                        } />

                        {/* Catch-All Route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </CurrencyProvider>
            </AuthProvider>
        </BrowserRouter>
    );
});

export default App;
