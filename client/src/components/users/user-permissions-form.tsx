import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

// Module definitions with available permissions
const modules = [
  {
    id: "dashboard",
    name: "Dashboard",
    permissions: ["read"],
  },
  {
    id: "clients",
    name: "Clientes",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "appointments",
    name: "Agenda",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "anamnesis",
    name: "Anamnese",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "financial",
    name: "Financeiro",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "reports",
    name: "Relatórios",
    permissions: ["read"],
  },
  {
    id: "crm",
    name: "CRM",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "users",
    name: "Usuários",
    permissions: ["read", "create", "update", "delete"],
  },
  {
    id: "settings",
    name: "Configurações",
    permissions: ["read", "update"],
  },
];

// Permission action display names
const permissionActions: Record<string, string> = {
  read: "Visualizar",
  create: "Criar",
  update: "Editar",
  delete: "Excluir",
};

interface UserPermissionsFormProps {
  userId: number;
  clinicId: number;
  userRole: string;
}

export function UserPermissionsForm({ userId, clinicId, userRole }: UserPermissionsFormProps) {
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});
  const [clinicUserId, setClinicUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState(userRole);
  
  // Query to get clinic users
  const { data: clinicUsers, isLoading: isLoadingClinicUsers } = useQuery({
    queryKey: ["/api/clinics", clinicId, "users"],
    enabled: !!clinicId,
  });
  
  // Find the clinic user ID for the given user
  useEffect(() => {
    if (clinicUsers && userId) {
      const clinicUser = clinicUsers.find((cu: any) => cu.userId === userId && cu.clinicId === clinicId);
      if (clinicUser) {
        setClinicUserId(clinicUser.id);
        setSelectedRole(clinicUser.role);
      }
    }
  }, [clinicUsers, userId, clinicId]);
  
  // Query to get permissions for the clinic user
  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["/api/clinic-users", clinicUserId, "permissions"],
    enabled: !!clinicUserId,
  });
  
  // Initialize expanded state for all modules
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    modules.forEach(module => {
      expanded[module.id] = true;
    });
    setExpandedModules(expanded);
  }, []);
  
  // Update permissions when data is loaded
  useEffect(() => {
    if (permissions) {
      const permMap: Record<string, string[]> = {};
      
      permissions.forEach((perm: any) => {
        if (!permMap[perm.module]) {
          permMap[perm.module] = [];
        }
        permMap[perm.module].push(perm.action);
      });
      
      setUserPermissions(permMap);
    }
  }, [permissions]);
  
  // Mutation for updating user role
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { role: string }) => {
      if (!clinicUserId) throw new Error("ID do usuário na clínica não encontrado");
      const res = await apiRequest("PATCH", `/api/clinic-users/${clinicUserId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "users"] });
      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar função",
        description: "Não foi possível atualizar a função do usuário.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { permissions: Record<string, string[]> }) => {
      if (!clinicUserId) throw new Error("ID do usuário na clínica não encontrado");
      
      // Convert permissions object to array of permission objects
      const permissionsArray = Object.entries(data.permissions).flatMap(([module, actions]) =>
        actions.map(action => ({ clinicUserId, module, action }))
      );
      
      // First delete all existing permissions
      await apiRequest("DELETE", `/api/clinic-users/${clinicUserId}/permissions`, {});
      
      // Then create new permissions
      if (permissionsArray.length > 0) {
        const res = await apiRequest("POST", `/api/permissions/batch`, { permissions: permissionsArray });
        return res.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-users", clinicUserId, "permissions"] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões do usuário foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar permissões",
        description: "Não foi possível atualizar as permissões do usuário.",
        variant: "destructive",
      });
    }
  });
  
  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Check if a module is checked (at least one permission)
  const isModuleChecked = (moduleId: string) => {
    return !!userPermissions[moduleId] && userPermissions[moduleId].length > 0;
  };
  
  // Toggle module checkbox (all permissions for a module)
  const toggleModuleCheck = (moduleId: string, checked: boolean) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    setUserPermissions(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[moduleId] = [...module.permissions];
      } else {
        delete updated[moduleId];
      }
      return updated;
    });
  };
  
  // Check if a specific permission is checked
  const isPermissionChecked = (moduleId: string, action: string) => {
    return !!userPermissions[moduleId] && userPermissions[moduleId].includes(action);
  };
  
  // Toggle a specific permission
  const togglePermission = (moduleId: string, action: string, checked: boolean) => {
    setUserPermissions(prev => {
      const updated = { ...prev };
      
      if (!updated[moduleId]) {
        updated[moduleId] = [];
      }
      
      if (checked) {
        if (!updated[moduleId].includes(action)) {
          updated[moduleId] = [...updated[moduleId], action];
        }
      } else {
        updated[moduleId] = updated[moduleId].filter(a => a !== action);
        if (updated[moduleId].length === 0) {
          delete updated[moduleId];
        }
      }
      
      return updated;
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update role if changed
    if (selectedRole !== userRole) {
      updateRoleMutation.mutate({ role: selectedRole });
    }
    
    // Update permissions
    updatePermissionsMutation.mutate({ permissions: userPermissions });
  };
  
  const isLoading = isLoadingClinicUsers || isLoadingPermissions;
  const isSaving = updateRoleMutation.isPending || updatePermissionsMutation.isPending;
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Editar Permissões - {clinicUsers?.find((cu: any) => cu.userId === userId)?.user?.name || "Usuário"}</CardTitle>
        <CardDescription>Configure as permissões específicas para este usuário.</CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Carregando permissões...</span>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700 block mb-2">Função na Clínica</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Selecione uma função" />
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
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">Permissões de Acesso</h4>
                
                <div className="space-y-5">
                  {modules.map(module => (
                    <div key={module.id} className="border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center">
                          <Checkbox 
                            id={`${module.id}-module`} 
                            checked={isModuleChecked(module.id)}
                            onCheckedChange={(checked) => toggleModuleCheck(module.id, checked as boolean)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`${module.id}-module`} className="ml-2 text-sm font-medium text-gray-700">
                            {module.name}
                          </Label>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleModule(module.id)}
                        >
                          {expandedModules[module.id] ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      
                      {expandedModules[module.id] && (
                        <div className={`p-4 ${module.permissions.length > 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}`}>
                          {module.permissions.map(action => (
                            <div key={`${module.id}-${action}`} className="flex items-center">
                              <Checkbox 
                                id={`${module.id}-${action}`} 
                                checked={isPermissionChecked(module.id, action)}
                                onCheckedChange={(checked) => togglePermission(module.id, action, checked as boolean)}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`${module.id}-${action}`} className="ml-2 text-sm text-gray-700">
                                {permissionActions[action] || action}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-3">
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || isSaving}>
            {isSaving ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
