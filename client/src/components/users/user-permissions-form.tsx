import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { roleDisplayNames } from "@/lib/auth-utils";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Save } from "lucide-react";

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
  }
];

export function UserPermissionsForm({ userId, clinicId, userRole }: UserPermissionsFormProps) {
  const { toast } = useToast();
  const [activeModuleTab, setActiveModuleTab] = useState("dashboard");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Card className="mt-8">
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
          <Button 
            onClick={savePermissions} 
            disabled={isSubmitting}
            className="mt-2 sm:mt-0"
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
      </CardHeader>
      <CardContent>
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
                  {module.actions.map(action => (
                    <div key={action.id} className="flex items-center space-x-2">
                      <Switch 
                        id={`${module.id}-${action.id}`}
                        checked={isPermissionSelected(module.id, action.id)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(module.id, action.id, checked)
                        }
                      />
                      <Label htmlFor={`${module.id}-${action.id}`}>
                        {action.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-6">
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
  );
}