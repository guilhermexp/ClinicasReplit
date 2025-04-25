import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, ShieldCheck, Save, RefreshCw, Copy, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { roleDisplayNames } from "@/lib/auth-utils";

// Estrutura das permissões disponíveis no sistema
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

// Permissões padrão por cargo
const defaultPermissions = {
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

interface PermissionManagerProps {
  clinicId: number;
}

export function PermissionManager({ clinicId }: PermissionManagerProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("PROFESSIONAL");
  const [activeModuleTab, setActiveModuleTab] = useState("dashboard");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  
  // Carregar permissões padrão iniciais para o cargo selecionado
  useEffect(() => {
    if (selectedRole) {
      const roleDefaultPermissions = defaultPermissions[selectedRole as keyof typeof defaultPermissions] || [];
      const permissionKeys = roleDefaultPermissions.map(p => `${p.module}:${p.action}`);
      setSelectedPermissions(permissionKeys);
    }
  }, [selectedRole]);
  
  // Atualizar os templates de permissão no backend
  const updatePermissionTemplateMutation = useMutation({
    mutationFn: async (data: { 
      clinicId: number; 
      role: string; 
      permissions: Array<{ module: string; action: string }> 
    }) => {
      const res = await apiRequest("POST", "/api/permission-templates", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Template de permissões atualizado",
        description: `As permissões padrão para ${roleDisplayNames[selectedRole]} foram atualizadas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permission-templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message || "Ocorreu um erro ao salvar as permissões padrão.",
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
  
  // Restaurar permissões padrão para o cargo
  const handleRestoreDefaults = () => {
    const roleDefaultPermissions = defaultPermissions[selectedRole as keyof typeof defaultPermissions] || [];
    const permissionKeys = roleDefaultPermissions.map(p => `${p.module}:${p.action}`);
    setSelectedPermissions(permissionKeys);
    setIsRestoreDialogOpen(false);
    
    toast({
      title: "Permissões restauradas",
      description: `As permissões padrão para ${roleDisplayNames[selectedRole] || selectedRole} foram restauradas.`,
    });
  };
  
  // Salvar template de permissões
  const savePermissionTemplate = async () => {
    if (!clinicId) return;
    
    setIsSubmitting(true);
    
    try {
      // Converter permissões selecionadas para o formato esperado pela API
      const permissions = selectedPermissions.map(key => {
        const [module, action] = key.split(':');
        return { module, action };
      });
      
      // Enviar para a API
      await updatePermissionTemplateMutation.mutateAsync({
        clinicId,
        role: selectedRole,
        permissions
      });
      
    } catch (error) {
      console.error("Erro ao salvar template de permissões:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Compartilhar template de permissões com outras clínicas
  const handleShareTemplate = () => {
    toast({
      title: "Recurso em desenvolvimento",
      description: "O compartilhamento de templates entre clínicas será implementado em breve.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="role-select">Cargo padrão</Label>
          <Select 
            value={selectedRole} 
            onValueChange={setSelectedRole}
          >
            <SelectTrigger id="role-select" className="w-[200px]">
              <SelectValue placeholder="Selecione um cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Proprietário</SelectItem>
              <SelectItem value="MANAGER">Gerente</SelectItem>
              <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
              <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
              <SelectItem value="FINANCIAL">Financeiro</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="STAFF">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Restaurar Padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar permissões padrão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso substituirá todas as permissões personalizadas para o cargo {roleDisplayNames[selectedRole] || selectedRole} com os valores padrão do sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreDefaults}>
                  Restaurar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button 
            size="sm"
            onClick={savePermissionTemplate}
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
                Salvar Template
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Permissões para {roleDisplayNames[selectedRole] || selectedRole}
          </CardTitle>
          <CardDescription>
            Configure as permissões padrão que serão atribuídas aos usuários deste cargo
          </CardDescription>
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
                          disabled={selectedRole === "OWNER"}
                        />
                        <Label htmlFor={`${module.id}-${action.id}`} className={selectedRole === "OWNER" ? "text-muted-foreground" : ""}>
                          {action.name}
                          {selectedRole === "OWNER" && action.id === "view" && (
                            <span className="ml-2 text-xs text-amber-600">(Proprietários sempre têm todas as permissões)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            As permissões são aplicadas a novos usuários deste cargo
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareTemplate}
            >
              <Copy className="mr-2 h-4 w-4" />
              Compartilhar Template
            </Button>
            <Button 
              size="sm"
              onClick={savePermissionTemplate}
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
                  Salvar Template
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}