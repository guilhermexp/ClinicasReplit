import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Users from "@/pages/users";
import Clients from "@/pages/clients";
import Appointments from "@/pages/appointments";
import Financial from "@/pages/financial/index";
import FinanceiroPage from "@/pages/financeiro";
import AttendancePage from "@/pages/attendance";
import CrmPage from "@/pages/crm/index";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Componente para proteger rotas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            
            <Route path="/onboarding">
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            </Route>
            
            <Route path="/dashboard">
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/users">
              <ProtectedRoute>
                <MainLayout>
                  <Users />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/clients">
              <ProtectedRoute>
                <MainLayout>
                  <Clients />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/appointments">
              <ProtectedRoute>
                <MainLayout>
                  <Appointments />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/financial">
              <ProtectedRoute>
                <MainLayout>
                  <Financial />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/financeiro">
              <ProtectedRoute>
                <MainLayout>
                  <FinanceiroPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/financeiro/:clinicId">
              <ProtectedRoute>
                <MainLayout>
                  <FinanceiroPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/attendance">
              <ProtectedRoute>
                <MainLayout>
                  <AttendancePage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/crm">
              <ProtectedRoute>
                <MainLayout>
                  <CrmPage />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/settings">
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route path="/">
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            </Route>
            
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
