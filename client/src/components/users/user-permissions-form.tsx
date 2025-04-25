import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { roleDisplayNames } from "@/lib/auth-utils";
import { usePermissions, UserRole } from "@/hooks/use-permissions";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  ShieldCheck, 
  Save, 
  HelpCircle, 
  AlertTriangle, 
  RefreshCw 
} from "lucide-react";
import { PermissionCopy } from "@/components/permissions/permission-copy";

interface Permission {
  id: number;
  clinicUserId: number;
  module: string;
  action: string;
}

interface UserPermissionsFormProps {
  userId: number;
  clinicId: number;
  userRole: string;
}

// Definição dos módulos e ações disponíveis no sistema
const permissionModules = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Acesso ao painel principal",
    actions: [
      { id: "view", name: "Visualizar" }
    ]
  },
  {
    id: "users",
    name: "Usuários",
    description: "Gerenciamento de usuários da clínica",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  },
  {
    id: "clients",
    name: "Clientes",
    description: "Cadastro e gerenciamento de clientes/pacientes",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  },
  {
    id: "appointments",
    name: "Agendamentos",
    description: "Controle de agendamentos e consultas",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  },
  {
    id: "financial",
    name: "Financeiro",
    description: "Gerenciamento financeiro e pagamentos",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  },
  {
    id: "reports",
    name: "Relatórios",
    description: "Relatórios e estatísticas",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "export", name: "Exportar" }
    ]
  },
  {
    id: "settings",
    name: "Configurações",
    description: "Configurações da clínica",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "edit", name: "Editar" }
    ]
  },
  {
    id: "crm",
    name: "CRM",
    description: "Gerenciamento de leads e oportunidades",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  },
  {
    id: "inventory",
    name: "Estoque",
    description: "Gerenciamento de produtos e estoque",
    actions: [
      { id: "view", name: "Visualizar" },
      { id: "create", name: "Criar" },
      { id: "edit", name: "Editar" },
      { id: "delete", name: "Excluir" }
    ]
  }
];

export function UserPermissionsForm({ userId, clinicId, userRole }: UserPermissionsFormProps) {
  const { toast } = useToast();
  const { defaultPermissions, isSuperUserOrOwner } = usePermissions();
  const [activeModuleTab, setActiveModuleTab] = useState("dashboard");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Buscar informações do usuário específico
  const { data: clinicUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/clinics", clinicId, "users", userId],
    enabled: !!userId && !!clinicId,
  });

  // Buscar permissões atuais do usuário
  const { data: userPermissions = [], isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ["/api/clinic-users", clinicUser?.id, "permissions"],
    enabled: !!clinicUser?.id,
  });

  // Obter permissões padrão para o cargo do usuário
  const roleDefaultPermissions = userRole ? 
    (defaultPermissions[userRole as keyof typeof defaultPermissions] || []) : [];
  
  // Criar chaves para permissões padrão para comparação
  const defaultPermissionKeys = roleDefaultPermissions.map(p => `${p.module}:${p.action}`);

  // Configurar permissões iniciais quando os dados forem carregados
  useEffect(() => {
    if (userPermissions && userPermissions.length > 0) {
      const permissionKeys = userPermissions.map(p => `${p.module}:${p.action}`);
      setSelectedPermissions(permissionKeys);
    }
  }, [userPermissions]);

  // Mutation para adicionar uma permissão
  const addPermissionMutation = useMutation({
    mutationFn: async (data: { clinicUserId: number; module: string; action: string }) => {
      const res = await apiRequest("POST", "/api/permissions", data);
      return res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar permissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para remover uma permissão
  const removePermissionMutation = useMutation({
    mutationFn: async (permissionId: number) => {
      await apiRequest("DELETE", `/api/permissions/${permissionId}`, {});
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover permissão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manipular alteração em uma permissão
  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    const permissionKey = `${module}:${action}`;
    
    if (checked) {
      // Adicionar permissão
      setSelectedPermissions(prev => [...prev, permissionKey]);
    } else {
      // Remover permissão
      setSelectedPermissions(prev => prev.filter(p => p !== permissionKey));
    }
  };

  // Verificar se uma permissão está selecionada
  const isPermissionSelected = (module: string, action: string) => {
    return selectedPermissions.includes(`${module}:${action}`);
  };

  // Verificar o tipo de permissão (padrão ou customizada)
  const getPermissionType = (module: string, action: string) => {
    const permissionKey = `${module}:${action}`;
    const existingPermission = userPermissions.find(p => p.module === module && p.action === action);
    
    if (existingPermission) {
      return "custom"; // Permissão explicitamente atribuída a este usuário
    } else if (defaultPermissionKeys.includes(permissionKey) && isPermissionSelected(module, action)) {
      return "default"; // Permissão padrão do cargo
    }
    
    return "none"; // Não tem a permissão
  };

  // Restaurar permissões padrão para o cargo
  const handleRestoreDefaults = () => {
    setSelectedPermissions(defaultPermissionKeys);
    
    toast({
      title: "Permissões padrão restauradas",
      description: `As permissões foram restauradas para o padrão do cargo ${roleDisplayNames[userRole] || userRole}.`,
    });
  };

  // Salvar todas as alterações de permissões
  const savePermissions = async () => {
    if (!clinicUser?.id) return;
    
    setIsSubmitting(true);
    
    try {
      // Primeiro, determinar quais permissões devem ser adicionadas e quais devem ser removidas
      const existingPermissionKeys = userPermissions.map(p => `${p.module}:${p.action}`);
      
      // Permissões para adicionar (estão em selectedPermissions mas não em existingPermissionKeys)
      const permissionsToAdd = selectedPermissions.filter(
        key => !existingPermissionKeys.includes(key)
      ).map(key => {
        const [module, action] = key.split(':');
        return { clinicUserId: clinicUser.id, module, action };
      });
      
      // Permissões para remover (estão em existingPermissionKeys mas não em selectedPermissions)
      const permissionsToRemove = userPermissions.filter(
        p => !selectedPermissions.includes(`${p.module}:${p.action}`)
      );
      
      // Adicionar novas permissões
      for (const permission of permissionsToAdd) {
        await addPermissionMutation.mutateAsync(permission);
      }
      
      // Remover permissões
      for (const permission of permissionsToRemove) {
        await removePermissionMutation.mutateAsync(permission.id);
      }
      
      // Atualizar cache
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-users", clinicUser.id, "permissions"] });
      
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar permissões",
        description: "Ocorreu um erro ao salvar as permissões.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser || isLoadingPermissions) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Carregando Permissões</CardTitle>
          <CardDescription>Aguarde enquanto carregamos as informações...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!clinicUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Permissões do Usuário
              </CardTitle>
              <CardDescription>
                Configurando permissões para {clinicUser.name} - {roleDisplayNames[userRole] || userRole}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {showHelp ? "Ocultar Ajuda" : "Mostrar Ajuda"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestoreDefaults}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restaurar Padrão
              </Button>
              <Button 
                onClick={savePermissions} 
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Permissões
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showHelp && (
          <div className="px-6 py-2 bg-muted/50 border-y">
            <div className="text-sm space-y-2">
              <p className="font-medium">Legenda das Permissões:</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 bg-blue-50 hover:bg-blue-50">Padrão</Badge>
                  <span>Permissão padrão do cargo</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Personalizada</Badge>
                  <span>Permissão específica para este usuário</span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Alterações nas permissões serão salvas apenas ao clicar em "Salvar Permissões"</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <CardContent className="pt-6">
          <Tabs value={activeModuleTab} onValueChange={setActiveModuleTab}>
            <TabsList className="flex flex-wrap">
              {permissionModules.map(module => (
                <TabsTrigger key={module.id} value={module.id}>
                  {module.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {permissionModules.map(module => (
              <TabsContent key={module.id} value={module.id} className="pt-6">
                <div className="grid gap-6">
                  <div>
                    <h3 className="text-lg font-medium">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {module.actions.map(action => {
                      const permissionType = getPermissionType(module.id, action.id);
                      const isDisabled = isSuperUserOrOwner(userRole as UserRole); // Super Admins e Proprietários sempre têm todas as permissões
                      
                      return (
                        <div key={action.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`${module.id}-${action.id}`}
                              checked={isPermissionSelected(module.id, action.id) || isDisabled}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module.id, action.id, checked)
                              }
                              disabled={isDisabled}
                            />
                            <Label htmlFor={`${module.id}-${action.id}`} className={isDisabled ? "text-muted-foreground" : ""}>
                              {action.name}
                              {isDisabled && (
                                <span className="ml-2 text-xs text-amber-600">(Sempre ativo para Super Admins e Proprietários)</span>
                              )}
                            </Label>
                          </div>
                          
                          {!isDisabled && permissionType !== "none" && (
                            <Badge 
                              variant="outline" 
                              className={permissionType === "default" ? 
                                "bg-blue-50 hover:bg-blue-50" : 
                                "bg-green-50 text-green-700 hover:bg-green-50"
                              }
                            >
                              {permissionType === "default" ? "Padrão" : "Personalizada"}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            As alterações só terão efeito após clicar em "Salvar Permissões"
          </div>
          <Button 
            onClick={savePermissions} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Permissões
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Componente para copiar permissões de outro usuário */}
      <PermissionCopy 
        clinicId={clinicId}
        targetUserId={userId}
        targetUserRole={userRole}
        targetClinicUserId={clinicUser.id}
      />
    </div>
  );
}