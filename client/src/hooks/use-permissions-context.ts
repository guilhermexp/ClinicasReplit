// Este é um hook auxiliar para facilitar a migração gradual dos componentes para usar o PermissionsProvider
import { usePermissionsContext } from "@/providers/permission-provider";
import { PermissionModule, PermissionAction } from "./use-permissions-helper";

// Este hook substitui o antigo usePermissions, facilitando a migração gradual
export function usePermissionsContext2() {
  const context = usePermissionsContext();
  
  // Para compatibilidade com código que ainda usa hasPermission
  return {
    ...context,
    hasPermission: (module: PermissionModule, action: PermissionAction) => 
      context.checkPermission(module, action)
  };
}