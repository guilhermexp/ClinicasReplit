import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { localStoragePersister, removeExpiredPersistedQueries } from "@/hooks/use-local-storage-persister";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PermissionsProvider } from "@/providers/permission-provider";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Componentes carregados imediatamente
import MainLayout from "@/components/layout/main-layout";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// Lazy loading para componentes de páginas menos críticas
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const Users = lazy(() => import("@/pages/users"));
const Clients = lazy(() => import("@/pages/clients"));
const Appointments = lazy(() => import("@/pages/appointments"));
const Financial = lazy(() => import("@/pages/financial/index"));
const FinanceiroPage = lazy(() => import("@/pages/financeiro"));
const AttendancePage = lazy(() => import("@/pages/attendance"));
const CrmPage = lazy(() => import("@/pages/crm/index"));
const Settings = lazy(() => import("@/pages/settings"));

// Componente para carregamento suspense
function PageLoader() {
  return (
    <div className="h-[80vh] w-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando página...</p>
      </div>
    </div>
  );
}

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
  
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}

function App() {
  // Limpar queries expiradas quando a aplicação iniciar
  useEffect(() => {
    // Remove queries expiradas do cache
    removeExpiredPersistedQueries(queryClient);
    
    // Log para debug
    console.log('Cache de persistência inicializado e queries expiradas removidas');
  }, []);
  
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: localStoragePersister }}
    >
      <AuthProvider>
        <PermissionsProvider>
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
        </PermissionsProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
