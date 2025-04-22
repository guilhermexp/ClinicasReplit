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
  
  // Get current user
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    onError: () => {
      // If not authenticated and not already on login page, redirect
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/register") {
        navigate("/login");
      }
    },
    retry: false, // Don't retry auth requests
  });
  
  // Get clinics for current user
  const { data: clinics = [] } = useQuery({
    queryKey: ["/api/clinics"],
    enabled: !!userData?.user,
  });
  
  // Set default selected clinic if not already set
  // Redirect behavior based on user's clinic association status
  useEffect(() => {
    if (userData?.user) {
      if (clinics?.length > 0) {
        // Usuário já tem clínicas associadas
        if (!selectedClinic) {
          setSelectedClinic(clinics[0]);
        }
        
        // Se estiver na página de onboarding, redirecionar para o dashboard
        const currentPath = window.location.pathname;
        if (currentPath === "/onboarding") {
          navigate("/dashboard");
        }
      } else {
        // Usuário está logado mas não tem clínicas - redirecionar para onboarding
        const currentPath = window.location.pathname;
        if (currentPath !== "/onboarding" && currentPath !== "/login" && currentPath !== "/register") {
          navigate("/onboarding");
        }
      }
    }
  }, [clinics, selectedClinic, userData, navigate]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Verificar se o usuário já está vinculado a alguma clínica
      const clinicsRes = await apiRequest("GET", "/api/clinics");
      const userClinics = await clinicsRes.json();
      
      if (userClinics && userClinics.length > 0) {
        // Usuário já está vinculado a pelo menos uma clínica, vai para o dashboard
        navigate("/dashboard");
      } else {
        // Usuário sem clínicas vinculadas, vai para o onboarding
        navigate("/onboarding");
      }
      
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${data.user.name}!`,
      });
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
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      navigate("/login");
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
    },
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
