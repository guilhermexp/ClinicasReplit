import { useContext } from "react";
import { PermissionsContext } from "@/providers/permission-provider";

/**
 * Hook para acessar o contexto de permissões
 * 
 * Fornece funções para verificar permissões do usuário atual
 * e informações sobre o papel do usuário no sistema
 */
export function usePermissions() {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    throw new Error("usePermissions deve ser usado dentro de um PermissionsProvider");
  }
  
  return context;
}