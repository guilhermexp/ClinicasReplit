// Vamos alterar a extensão para .ts e remover JSX
// Manteremos apenas o hook e as constantes para uso no sistema de permissões

// Tipo para os módulos e ações disponíveis no sistema 
export type PermissionModule = 
  | "dashboard" 
  | "users" 
  | "clients" 
  | "appointments" 
  | "financial" 
  | "reports" 
  | "settings"
  | "crm"
  | "inventory";

export type PermissionAction = 
  | "view" 
  | "create" 
  | "edit" 
  | "delete" 
  | "export";

export interface Permission {
  module: PermissionModule;
  action: PermissionAction;
}

export type UserRole = 
  | "SUPER_ADMIN" 
  | "OWNER" 
  | "MANAGER" 
  | "PROFESSIONAL" 
  | "RECEPTIONIST" 
  | "FINANCIAL" 
  | "MARKETING" 
  | "STAFF";

// Permissões padrão por cargo
export const defaultPermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Super Admins têm acesso total a tudo no sistema
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
    { module: "inventory", action: "delete" }
  ],
  OWNER: [
    // Proprietários têm acesso total a tudo em suas clínicas
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
    { module: "inventory", action: "delete" }
  ],
  MANAGER: [
    // Gerentes têm quase todas as permissões, exceto algumas configurações sensíveis
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
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "settings", action: "view" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" },
    { module: "inventory", action: "view" },
    { module: "inventory", action: "create" },
    { module: "inventory", action: "edit" }
  ],
  PROFESSIONAL: [
    // Profissionais têm acesso ao básico + consultas
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "clients", action: "create" },
    { module: "clients", action: "edit" },
    { module: "appointments", action: "view" },
    { module: "appointments", action: "create" },
    { module: "appointments", action: "edit" }
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
    { module: "appointments", action: "delete" }
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
    { module: "reports", action: "export" }
  ],
  MARKETING: [
    // Marketing acessa clientes e algumas configurações
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "reports", action: "view" },
    { module: "reports", action: "export" },
    { module: "crm", action: "view" },
    { module: "crm", action: "create" },
    { module: "crm", action: "edit" }
  ],
  STAFF: [
    // Funcionários comuns têm acesso mínimo
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "appointments", action: "view" }
  ]
};

// Helper para verificar se SUPER_ADMIN ou OWNER tem permissão
export function isSuperUserOrOwner(userRole: UserRole | null): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "OWNER";
}

// Helper para verificar se um usuário tem uma permissão específica
export function checkPermission(
  userPermissions: Permission[], 
  userRole: UserRole | null, 
  module: PermissionModule, 
  action: PermissionAction
): boolean {
  // Super admins e owners têm todas as permissões
  if (isSuperUserOrOwner(userRole)) {
    return true;
  }

  // Verificar se a permissão existe nas permissões do usuário
  return userPermissions.some(
    (p) => p.module === module && p.action === action
  );
}

// Hook simples para usar permissões
export function usePermissions() {
  return {
    defaultPermissions,
    isSuperUserOrOwner,
    checkPermission
  };
}