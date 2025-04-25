import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissionsContext2 } from "@/hooks/use-permissions-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserList } from "@/components/users/user-list";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { UserPermissionsForm } from "@/components/users/user-permissions-form";
import { formatDate, roleColors, roleDisplayNames } from "@/lib/auth-utils";
import { Copy, Loader2, Mail, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";

export default function Users() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissionsContext2();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
  
  // Query to get clinic users com cache otimizado
  const { data: clinicUsers = [], isLoading } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "users"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query para obter usuários Super Admin (apenas para proprietários)
  const { data: superAdmins = [], isLoading: isLoadingSuperAdmins } = useQuery({
    queryKey: ["/api/users/superadmins"],
    enabled: !!selectedClinic && hasPermission("users", "read"),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query to get pending invitations com cache otimizado
  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "invitations"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  const handleUserEdit = (userId: number, role: string) => {
    setSelectedUserId(userId);
    setSelectedUserRole(role);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Gerenciamento de Usuários</h1>
        
        {hasPermission("users", "create") && (
          <Button 
            onClick={() => setIsInviteDialogOpen(true)}
            className="mt-3 sm:mt-0"
          >
            <Plus className="mr-2 h-5 w-5" />
            Convidar Usuário
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="invitations">Convites</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários da Clínica</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex space-x-3">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="OWNER">Proprietário</SelectItem>
                      <SelectItem value="MANAGER">Gerente</SelectItem>
                      <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                      <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                      <SelectItem value="FINANCIAL">Financeiro</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="STAFF">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status: Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Status: Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* User List */}
              <UserList 
                isLoading={isLoading} 
                users={clinicUsers}
                searchQuery={searchQuery}
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                onEdit={handleUserEdit}
                superAdmins={superAdmins}
                isLoadingSuperAdmins={isLoadingSuperAdmins}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>
                Gerenciar convites enviados para novos usuários da clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvitations ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Não há convites pendentes no momento.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-muted-foreground tracking-wide">
                        <th className="p-2 pl-4">Email</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Enviado por</th>
                        <th className="p-2">Data de envio</th>
                        <th className="p-2">Expira em</th>
                        <th className="p-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invitations.map((invitation: any) => (
                        <tr key={invitation.id} className="hover:bg-muted/50">
                          <td className="p-2 pl-4">
                            <div className="font-medium">{invitation.email}</div>
                          </td>
                          <td className="p-2">
                            <Badge 
                              className={`${roleColors[invitation.role] || roleColors.DEFAULT} hover:${roleColors[invitation.role] || roleColors.DEFAULT}`}
                            >
                              {roleDisplayNames[invitation.role] || invitation.role}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">
                            {/* Adicionar um usuário real aqui quando estiver pronto */}
                            Usuário #{invitation.invitedBy}
                          </td>
                          <td className="p-2 text-sm">
                            {formatDate(invitation.createdAt)}
                          </td>
                          <td className="p-2 text-sm">
                            {formatDate(invitation.expiresAt)}
                          </td>
                          <td className="p-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Menu de ações</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/onboarding?token=${invitation.token}`);
                                    toast({
                                      title: "Link copiado",
                                      description: "O link de convite foi copiado para a área de transferência.",
                                    });
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  <span>Copiar link</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => {
                                    window.open(`mailto:${invitation.email}?subject=Convite para a clínica ${selectedClinic?.name}&body=Você foi convidado para participar da clínica ${selectedClinic?.name}. Acesse este link para se juntar: ${window.location.origin}/onboarding?token=${invitation.token}`);
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  <span>Enviar por email</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={() => {
                                    // Cancelar convite usando a API
                                    fetch(`/api/invitations/${invitation.token}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      }
                                    })
                                    .then(response => {
                                      if (response.ok) {
                                        toast({
                                          title: "Convite cancelado",
                                          description: "O convite foi cancelado com sucesso."
                                        });
                                        // Invalidar o cache para forçar a atualização
                                        queryClient.invalidateQueries({
                                          queryKey: ["/api/clinics", selectedClinic?.id, "invitations"]
                                        });
                                      } else {
                                        response.json().then(data => {
                                          toast({
                                            title: "Erro ao cancelar convite",
                                            description: data.message || "Ocorreu um erro ao cancelar o convite.",
                                            variant: "destructive"
                                          });
                                        }).catch(() => {
                                          toast({
                                            title: "Erro ao cancelar convite",
                                            description: "Ocorreu um erro ao cancelar o convite.",
                                            variant: "destructive"
                                          });
                                        });
                                      }
                                    })
                                    .catch(error => {
                                      console.error("Erro ao cancelar convite:", error);
                                      toast({
                                        title: "Erro ao cancelar convite",
                                        description: "Ocorreu um erro ao cancelar o convite. Tente novamente mais tarde.",
                                        variant: "destructive"
                                      });
                                    });
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Cancelar convite</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Permissões</CardTitle>
              <CardDescription>
                Configure as permissões padrão para cada tipo de usuário na sua clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="role-select">Tipo de Usuário</Label>
                    <Select defaultValue="PROFESSIONAL">
                      <SelectTrigger id="role-select" className="w-full sm:w-[260px]">
                        <SelectValue placeholder="Selecione um tipo de usuário" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="MANAGER">Gerente</SelectItem>
                        <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                        <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                        <SelectItem value="FINANCIAL">Financeiro</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="STAFF">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-base font-medium mb-3">Permissões do Profissional</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Dashboard */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Dashboard</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="dashboard-view" defaultChecked />
                            <Label htmlFor="dashboard-view">Visualizar</Label>
                          </div>
                        </div>
                      </div>
                    
                      {/* Clientes */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Clientes</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="clients-view" defaultChecked />
                            <Label htmlFor="clients-view">Visualizar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="clients-create" defaultChecked />
                            <Label htmlFor="clients-create">Criar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="clients-edit" defaultChecked />
                            <Label htmlFor="clients-edit">Editar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="clients-delete" />
                            <Label htmlFor="clients-delete">Excluir</Label>
                          </div>
                        </div>
                      </div>
                    
                      {/* Agendamentos */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Agendamentos</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="appointments-view" defaultChecked />
                            <Label htmlFor="appointments-view">Visualizar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="appointments-create" defaultChecked />
                            <Label htmlFor="appointments-create">Criar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="appointments-edit" defaultChecked />
                            <Label htmlFor="appointments-edit">Editar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="appointments-delete" />
                            <Label htmlFor="appointments-delete">Excluir</Label>
                          </div>
                        </div>
                      </div>
                    
                      {/* Financeiro */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Financeiro</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="financial-view" />
                            <Label htmlFor="financial-view">Visualizar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="financial-create" />
                            <Label htmlFor="financial-create">Criar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="financial-edit" />
                            <Label htmlFor="financial-edit">Editar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="financial-delete" />
                            <Label htmlFor="financial-delete">Excluir</Label>
                          </div>
                        </div>
                      </div>
                    
                      {/* Relatórios */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Relatórios</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="reports-view" />
                            <Label htmlFor="reports-view">Visualizar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="reports-export" />
                            <Label htmlFor="reports-export">Exportar</Label>
                          </div>
                        </div>
                      </div>
                    
                      {/* Configurações */}
                      <div className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Configurações</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="settings-view" />
                            <Label htmlFor="settings-view">Visualizar</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="settings-edit" />
                            <Label htmlFor="settings-edit">Editar</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => {
                          toast({
                            title: "Permissões restauradas",
                            description: "As permissões padrão foram restauradas.",
                          });
                        }}
                      >
                        Restaurar Padrão
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "Recurso em desenvolvimento",
                            description: "A funcionalidade de salvar permissões padrão será implementada em breve.",
                          });
                        }}
                      >
                        Salvar Configurações
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h3 className="text-amber-800 font-medium mb-2">Importante sobre permissões</h3>
                  <p className="text-amber-700 text-sm">
                    As permissões padrão são aplicadas automaticamente aos novos usuários conforme o tipo selecionado.
                    Usuários do tipo "Proprietário" sempre terão acesso total à clínica e não podem ter suas permissões alteradas.
                    Para configurar permissões específicas para um usuário, edite-o na aba "Usuários".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit User Permissions Form */}
      {selectedUserId && selectedClinic && (
        <UserPermissionsForm 
          userId={selectedUserId} 
          clinicId={selectedClinic.id} 
          userRole={selectedUserRole || "STAFF"}
        />
      )}
      
      {/* Invite User Dialog */}
      <InviteUserDialog 
        isOpen={isInviteDialogOpen} 
        onClose={() => setIsInviteDialogOpen(false)}
        clinicId={selectedClinic?.id}
      />
    </div>
  );
}
