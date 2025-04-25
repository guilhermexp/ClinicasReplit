/**
 * Tipos e funções auxiliares para lidar com o sistema de permissões
 */

// Tipos de módulos do sistema
export type PermissionModule = 
  | "dashboard" 
  | "users" 
  | "clients" 
  | "appointments" 
  | "financial" 
  | "reports" 
  | "settings" 
  | "crm" 
  | "inventory"
  | "professionals" 
  | "tasks"
  | "attendance";

// Tipos de ações permitidas
export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

// Estrutura de uma permissão
export interface Permission {
  module: PermissionModule;
  action: PermissionAction;
}

// Tipos de papéis de usuário
export type UserRole = 
  | "SUPER_ADMIN" 
  | "OWNER" 
  | "MANAGER" 
  | "PROFESSIONAL" 
  | "RECEPTIONIST" 
  | "FINANCIAL" 
  | "MARKETING" 
  | "STAFF";

// Permissões padrão por papel do usuário
export const defaultPermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Super Admins têm todas as permissões possíveis
    { module: "dashboard", action: "view" },
    { module: "users", action: "view" },
    { module: "users", action: "create" },
    { module: "users", action: "edit" },
    { module: "users", action: "delete" },
    { module: "clients", action: "view" },
    { module: "clients", action: "create" },
    { module: "clients", action: "edit" },
    { module: "clients", action: "delete" },
    { module: "appointments", action: "view" },
    { module: "appointments", action: "create" },
    { module: "appointments", action: "edit" },
    { module: "appointments", action: "delete" },
    { module: "financial", action: "view" },
    { module: "financial", action: "create" },
    { module: "financial", action: "edit" },
    { module: "financial", action: "delete" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "settings", action: "view" },
    { module: "settings", action: "edit" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" },
    { module: "crm", action: "delete" },
    { module: "inventory", action: "view" },
    { module: "inventory", action: "create" },
    { module: "inventory", action: "edit" },
    { module: "inventory", action: "delete" },
    { module: "professionals", action: "view" },
    { module: "professionals", action: "create" },
    { module: "professionals", action: "edit" },
    { module: "professionals", action: "delete" },
    { module: "tasks", action: "view" },
    { module: "tasks", action: "create" },
    { module: "tasks", action: "edit" },
    { module: "tasks", action: "delete" }
  ],
  OWNER: [
    // Proprietários têm acesso total a tudo
    { module: "dashboard", action: "view" },
    { module: "users", action: "view" },
    { module: "users", action: "create" },
    { module: "users", action: "edit" },
    { module: "users", action: "delete" },
    { module: "clients", action: "view" },
    { module: "clients", action: "create" },
    { module: "clients", action: "edit" },
    { module: "clients", action: "delete" },
    { module: "appointments", action: "view" },
    { module: "appointments", action: "create" },
    { module: "appointments", action: "edit" },
    { module: "appointments", action: "delete" },
    { module: "financial", action: "view" },
    { module: "financial", action: "create" },
    { module: "financial", action: "edit" },
    { module: "financial", action: "delete" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "settings", action: "view" },
    { module: "settings", action: "edit" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" },
    { module: "crm", action: "delete" },
    { module: "inventory", action: "view" },
    { module: "inventory", action: "create" },
    { module: "inventory", action: "edit" },
    { module: "inventory", action: "delete" },
    { module: "professionals", action: "view" },
    { module: "professionals", action: "create" },
    { module: "professionals", action: "edit" },
    { module: "professionals", action: "delete" },
    { module: "tasks", action: "view" },
    { module: "tasks", action: "create" },
    { module: "tasks", action: "edit" },
    { module: "tasks", action: "delete" }
  ],
  MANAGER: [
    // Gerentes têm quase todas as permissões, exceto algumas configurações sensíveis
    { module: "dashboard", action: "view" },
    { module: "users", action: "view" },
    { module: "users", action: "create" },
    { module: "users", action: "edit" },
    { module: "clients", action: "view" },
    { module: "clients", action: "create" },
    { module: "clients", action: "edit" },
    { module: "clients", action: "delete" },
    { module: "appointments", action: "view" },
    { module: "appointments", action: "create" },
    { module: "appointments", action: "edit" },
    { module: "appointments", action: "delete" },
    { module: "financial", action: "view" },
    { module: "financial", action: "create" },
    { module: "financial", action: "edit" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "settings", action: "view" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" },
    { module: "inventory", action: "view" },
    { module: "inventory", action: "create" },
    { module: "inventory", action: "edit" },
    { module: "professionals", action: "view" },
    { module: "professionals", action: "create" },
    { module: "professionals", action: "edit" },
    { module: "tasks", action: "view" },
    { module: "tasks", action: "create" },
    { module: "tasks", action: "edit" },
    { module: "tasks", action: "delete" }
  ],
  PROFESSIONAL: [
    // Profissionais acessam seus agendamentos e clientes
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "appointments", action: "view" },
    { module: "professionals", action: "view" },
    { module: "tasks", action: "view" },
    { module: "tasks", action: "create" },
    { module: "tasks", action: "edit" }
  ],
  RECEPTIONIST: [
    // Recepcionistas gerenciam agendamentos e clientes
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "clients", action: "create" },
    { module: "clients", action: "edit" },
    { module: "appointments", action: "view" },
    { module: "appointments", action: "create" },
    { module: "appointments", action: "edit" },
    { module: "appointments", action: "delete" },
    { module: "professionals", action: "view" },
    { module: "tasks", action: "view" }
  ],
  FINANCIAL: [
    // Financeiro acessa área financeira e relatórios
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "financial", action: "view" },
    { module: "financial", action: "create" },
    { module: "financial", action: "edit" },
    { module: "financial", action: "delete" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "inventory", action: "view" },
    { module: "tasks", action: "view" }
  ],
  MARKETING: [
    // Marketing acessa clientes e algumas configurações
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" },
    { module: "tasks", action: "view" },
    { module: "tasks", action: "create" }
  ],
  STAFF: [
    // Funcionários comuns têm acesso mínimo
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "appointments", action: "view" },
    { module: "tasks", action: "view" }
  ]
};

/**
 * Verifica se o usuário tem permissão específica
 * 
 * Considera tanto a lista de permissões quanto o papel do usuário
 * para determinar se uma operação deve ser permitida
 * 
 * @param permissions Lista de permissões do usuário
 * @param userRole Papel do usuário
 * @param module Módulo a ser verificado
 * @param action Ação a ser verificada
 */
export function checkPermission(
  permissions: Permission[], 
  userRole: UserRole | null, 
  module: PermissionModule, 
  action: PermissionAction
): boolean {
  // Super admins e owners têm todas as permissões automaticamente
  if (isSuperUserOrOwner(userRole)) {
    return true;
  }
  
  // Verificar se o usuário tem a permissão específica
  return permissions.some(perm => 
    perm.module === module && perm.action === action
  );
}

/**
 * Verifica se o usuário possui papel de super usuário (super admin ou proprietário)
 * que dão acesso completo ao sistema
 * 
 * @param role Papel do usuário
 */
export function isSuperUserOrOwner(role: UserRole | null): boolean {
  return role === "SUPER_ADMIN" || role === "OWNER";
}