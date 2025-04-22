import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface Permission {
  id: number;
  clinicUserId: number;
  module: string;
  action: string;
}

// Mapeamento de permissões padrão por tipo de usuário
const defaultPermissions = {
  SUPER_ADMIN: [
    // Administradores do sistema têm acesso total a tudo
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
    { module: "settings", action: "edit" }
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
    { module: "settings", action: "edit" }
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
    { module: "settings", action: "view" }
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
    { module: "reports", action: "export" }
  ],
  STAFF: [
    // Funcionários comuns têm acesso mínimo
    { module: "dashboard", action: "view" },
    { module: "clients", action: "view" },
    { module: "appointments", action: "view" }
  ]
};

export function usePermissions() {
  const { user, selectedClinic, activeClinicUser } = useAuth();

  // Buscar as permissões do usuário para a clínica atual com cache otimizado
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["/api/clinic-users", activeClinicUser?.id, "permissions"],
    enabled: !!activeClinicUser?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos - as permissões não mudam frequentemente
    gcTime: 20 * 60 * 1000, // 20 minutos
  });

  // Verificar se um usuário tem uma permissão específica
  const hasPermission = (module: string, action: string): boolean => {
    // Se não há usuário logado ou clínica selecionada, não tem permissão para nada
    if (!user || !selectedClinic || !activeClinicUser) {
      return false;
    }

    // Super admins e proprietários têm permissão para tudo
    if (user.role === "SUPER_ADMIN" || activeClinicUser.role === "OWNER") {
      return true;
    }

    // Verificar nas permissões personalizadas do usuário
    if (permissions.some(p => p.module === module && p.action === action)) {
      return true;
    }

    // Verificar nas permissões padrão do cargo
    if (activeClinicUser.role && defaultPermissions[activeClinicUser.role as keyof typeof defaultPermissions]) {
      return defaultPermissions[activeClinicUser.role as keyof typeof defaultPermissions]
        .some(p => p.module === module && p.action === action);
    }

    return false;
  };

  // Verificar se um usuário pode acessar um módulo (qualquer ação)
  const canAccessModule = (module: string): boolean => {
    // Se não há usuário logado ou clínica selecionada, não tem permissão para nada
    if (!user || !selectedClinic || !activeClinicUser) {
      return false;
    }

    // Super admins e proprietários têm permissão para tudo
    if (user.role === "SUPER_ADMIN" || activeClinicUser.role === "OWNER") {
      return true;
    }

    // Verificar nas permissões personalizadas do usuário
    if (permissions.some(p => p.module === module)) {
      return true;
    }

    // Verificar nas permissões padrão do cargo
    if (activeClinicUser.role && defaultPermissions[activeClinicUser.role as keyof typeof defaultPermissions]) {
      return defaultPermissions[activeClinicUser.role as keyof typeof defaultPermissions]
        .some(p => p.module === module);
    }

    return false;
  };

  return {
    hasPermission,
    canAccessModule,
    permissions
  };
}