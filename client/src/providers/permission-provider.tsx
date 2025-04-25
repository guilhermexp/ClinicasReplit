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
} from "@/hooks/use-permissions";

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
  // Buscar permissões do usuário a partir da API
  const { data: userPermissions = [], isLoading: isLoadingPermissions, error } = useQuery({
    queryKey: ["/api/me/permissions"],
    enabled: true,
  });

  // Buscar papel do usuário a partir da API
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: true,
  });

  const userRole = userData?.role as UserRole || null;
  const isLoading = isLoadingPermissions || isLoadingUser;

  // Função para verificar se o usuário tem uma permissão específica
  const hasUserPermission = (module: PermissionModule, action: PermissionAction): boolean => {
    return checkPermission(userPermissions, userRole, module, action);
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