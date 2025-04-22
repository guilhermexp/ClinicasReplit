import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Users from "@/pages/users";
import Clients from "@/pages/clients";
import Appointments from "@/pages/appointments";
import Financial from "@/pages/financial";
import CrmPage from "@/pages/crm";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/dashboard">
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </Route>
            <Route path="/users">
              <MainLayout>
                <Users />
              </MainLayout>
            </Route>
            <Route path="/clients">
              <MainLayout>
                <Clients />
              </MainLayout>
            </Route>
            <Route path="/appointments">
              <MainLayout>
                <Appointments />
              </MainLayout>
            </Route>
            <Route path="/financial">
              <MainLayout>
                <Financial />
              </MainLayout>
            </Route>
            <Route path="/crm">
              <MainLayout>
                <CrmPage />
              </MainLayout>
            </Route>
            <Route path="/settings">
              <MainLayout>
                <Settings />
              </MainLayout>
            </Route>
            <Route path="/">
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
