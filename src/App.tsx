import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import HabitsPage from "./pages/HabitsPage";
import LettersPage from "./pages/LettersPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import WeeklySummaryPage from "./pages/WeeklySummaryPage";
import BottomNav from "./components/BottomNav";
import MissYouButton from "./components/MissYouButton";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }
  
  if (!isLoggedIn) return <Navigate to="/" replace />;
  
  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return (
    <>
      {children}
      <BottomNav />
      <MissYouButton />
    </>
  );
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }
  
  if (!isLoggedIn) return <Navigate to="/" replace />;
  
  // If onboarding already completed and not explicitly re-opened, go home
  if (profile?.onboarding_completed) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? (profile?.onboarding_completed ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />) : <Login />} />
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
      <Route path="/letters" element={<ProtectedRoute><LettersPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/summary" element={<ProtectedRoute><WeeklySummaryPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="max-w-lg mx-auto min-h-screen bg-background">
            <AppRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
