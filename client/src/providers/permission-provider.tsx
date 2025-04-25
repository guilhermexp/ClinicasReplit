import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Permission, 
  PermissionModule, 
  PermissionAction, 
  UserRole, 
  defaultPermissions, 
  checkPermission, 
  isSuperUserOrOwner 
} from "@/hooks/use-permissions-helper";

// Definição do contexto
type PermissionsContextType = {
  permissions: Permission[];
  userRole: UserRole | null;
  defaultPermissions: Record<UserRole, Permission[]>;
  checkPermission: (module: PermissionModule, action: PermissionAction) => boolean;
  isSuperUserOrOwner: (role: UserRole | null) => boolean;
  isLoading: boolean;
  error: Error | null;
};

export const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Provider do Context
export function PermissionsProvider({ children }: { children: ReactNode }) {
  // Buscar permissões do usuário a partir da API com cache otimizado
  const { data: userPermissions = [], isLoading: isLoadingPermissions, error } = useQuery({
    queryKey: ["/api/me/permissions"],
    enabled: true,
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
  });

  // Buscar papel do usuário a partir da API
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
    staleTime: 15 * 60 * 1000, // 15 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
  });

  const userRole = userData?.role as UserRole || null;
  const isLoading = isLoadingPermissions || isLoadingUser;

  // Função para verificar se o usuário tem uma permissão específica
  // Com cache para evitar re-cálculos
  const permissionCache = new Map<string, boolean>();
  
  const hasUserPermission = (module: PermissionModule, action: PermissionAction): boolean => {
    const cacheKey = `${module}:${action}`;
    
    // Verificar se já temos o resultado em cache
    if (permissionCache.has(cacheKey)) {
      return permissionCache.get(cacheKey)!;
    }
    
    // Calcular resultado e armazenar em cache
    const result = checkPermission(userPermissions, userRole, module, action);
    permissionCache.set(cacheKey, result);
    
    return result;
  };

  // Valor do contexto
  const contextValue: PermissionsContextType = {
    permissions: userPermissions,
    userRole,
    defaultPermissions,
    checkPermission: hasUserPermission,
    isSuperUserOrOwner,
    isLoading,
    error
  };

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook para usar o context
export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissionsContext must be used within a PermissionsProvider");
  }
  return context;
}