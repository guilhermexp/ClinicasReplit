import { createContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 
  | "SUPER_ADMIN" 
  | "CLINIC_OWNER" 
  | "CLINIC_MANAGER" 
  | "DOCTOR" 
  | "RECEPTIONIST" 
  | "FINANCIAL" 
  | "MARKETING" 
  | "STAFF";

export type ClinicRole = 
  | "OWNER" 
  | "MANAGER" 
  | "PROFESSIONAL" 
  | "RECEPTIONIST" 
  | "FINANCIAL" 
  | "MARKETING" 
  | "STAFF";

export interface Clinic {
  id: number;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  openingHours?: string;
}

export interface ClinicUser {
  id: number;
  clinicId: number;
  userId: number;
  role: ClinicRole;
  invitedBy?: number;
  invitedAt: string;
  acceptedAt?: string;
  clinic?: Clinic;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdBy?: number;
  clinicUsers?: ClinicUser[];
}

interface AuthContextType {
  user: User | null;
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  activeClinicUser: ClinicUser | null;
  setSelectedClinic: (clinic: Clinic) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  clinics: [],
  selectedClinic: null,
  activeClinicUser: null,
  setSelectedClinic: () => {},
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ id: 0 } as User),
  logout: async () => {},
  register: async () => ({ id: 0 } as User),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  
  // Get current user com caching melhorado
  const { 
    data: userData, 
    isLoading,
    isError: isAuthError 
  } = useQuery<{user: User}>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      console.log("Verificando autenticação...");
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          headers: {
            "Accept": "application/json",
            "Cache-Control": "no-cache"
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("Usuário não autenticado");
            return { user: null };
          }
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Usuário autenticado:", data);
        return data;
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        return { user: null };
      }
    },
    retry: false, // Don't retry auth requests
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado para melhorar performance)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false, // Só recarregar quando necessário
    refetchOnMount: "always", // Sempre verificar ao montar para garantir autenticação
    refetchInterval: false, // Desativar refetch automático
    refetchIntervalInBackground: false, // Não atualizar em background
  });
  
  // Get clinics for current user com caching melhorado
  const { data: clinics = [] } = useQuery<Clinic[]>({
    queryKey: ["/api/clinics"],
    enabled: !!userData?.user,
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
  
  // Get current clinic user relationship for permission checking
  const { data: activeClinicUser = null } = useQuery<ClinicUser | null>({
    queryKey: ["/api/clinics", selectedClinic?.id, "user"],
    enabled: !!userData?.user && !!selectedClinic?.id,
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
  
  // Set default selected clinic if not already set
  // Redirect behavior based on user's clinic association status
  useEffect(() => {
    const currentPath = window.location.pathname;
    
    // Redirecionar para login se não estiver autenticado
    if (isAuthError && currentPath !== "/login" && currentPath !== "/register") {
      const redirectUrl = currentPath !== "/" ? currentPath : "/dashboard";
      localStorage.setItem("redirectAfterLogin", redirectUrl);
      navigate("/login");
      return;
    }
    
    if (userData?.user) {
      if (clinics?.length > 0) {
        // Usuário já tem clínicas associadas
        if (!selectedClinic) {
          setSelectedClinic(clinics[0]);
        }
        
        // Se estiver na página de onboarding, redirecionar para o dashboard
        if (currentPath === "/onboarding") {
          navigate("/dashboard");
        }
        
        // Se estiver na página de login, redirecionar para a página salva ou dashboard
        if (currentPath === "/login" || currentPath === "/register") {
          const savedRedirect = localStorage.getItem("redirectAfterLogin");
          if (savedRedirect) {
            localStorage.removeItem("redirectAfterLogin");
            navigate(savedRedirect);
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        // Usuário está logado mas não tem clínicas - redirecionar para onboarding
        if (currentPath !== "/onboarding" && currentPath !== "/login" && currentPath !== "/register") {
          navigate("/onboarding");
        }
      }
    }
  }, [clinics, selectedClinic, userData, navigate, isAuthError]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log("Tentando login com:", credentials.email);
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include"
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Erro durante login:", error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      console.log("Login bem-sucedido:", data);
      
      // Atualizar os dados do usuário no cache
      queryClient.setQueryData(["/api/auth/me"], data);
      
      try {
        // Verificar se o usuário já está vinculado a alguma clínica
        console.log("Buscando clínicas do usuário...");
        const clinicsRes = await fetch("/api/clinics", {
          credentials: "include",
          headers: {
            "Accept": "application/json"
          }
        });
        
        if (!clinicsRes.ok) {
          throw new Error(`Erro ao buscar clínicas: ${clinicsRes.status}`);
        }
        
        const userClinics = await clinicsRes.json();
        console.log("Clínicas do usuário:", userClinics);
        
        // Agora redirecionar baseado no resultado
        if (userClinics && userClinics.length > 0) {
          console.log("Redirecionando para dashboard");
          // Usuário já está vinculado a pelo menos uma clínica, vai para o dashboard
          setTimeout(() => navigate("/dashboard"), 100);
        } else {
          console.log("Redirecionando para onboarding");
          // Usuário sem clínicas vinculadas, vai para o onboarding
          setTimeout(() => navigate("/onboarding"), 100);
        }
        
        toast({
          title: "Login bem-sucedido",
          description: `Bem-vindo, ${data.user.name}!`,
        });
      } catch (error) {
        console.error("Erro após login:", error);
        // Em caso de erro, ainda redirecionamos para dashboard
        setTimeout(() => navigate("/dashboard"), 100);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Limpar o cache do React Query antes da requisição
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.clear();
        
        const response = await apiRequest("POST", "/api/auth/logout", {});
        return response;
      } catch (error) {
        console.error("Erro durante logout:", error);
        // Se ocorrer um erro, ainda precisamos garantir que o usuário seja deslogado no cliente
        queryClient.clear();
        return null;
      }
    },
    onSuccess: () => {
      navigate("/login");
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
    },
    onError: () => {
      // Mesmo com erro, enviamos o usuário para a tela de login
      navigate("/login");
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema.",
      });
    }
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Novos usuários registrados vão para o onboarding
      // porque ainda não tem clínica vinculada
      navigate("/onboarding");
      
      toast({
        title: "Registro bem-sucedido",
        description: `Bem-vindo, ${data.user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    return result.user;
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const register = async (name: string, email: string, password: string) => {
    const result = await registerMutation.mutateAsync({ name, email, password });
    return result.user;
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: userData?.user || null,
        clinics: clinics || [],
        selectedClinic,
        activeClinicUser,
        setSelectedClinic,
        isLoading,
        isAuthenticated: !!userData?.user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
