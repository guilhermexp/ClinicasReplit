import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserList } from "@/components/users/user-list";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";
import { UserPermissionsForm } from "@/components/users/user-permissions-form";
import { Plus, Search } from "lucide-react";

export default function Users() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
  
  // Query to get clinic users
  const { data: clinicUsers = [], isLoading } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "users"],
    enabled: !!selectedClinic,
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
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Invitations list would go here */}
              <p className="text-gray-500">Não há convites pendentes no momento.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Permissões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-6">
                Configure as permissões padrão para cada tipo de usuário na sua clínica.
              </p>
              
              {/* Permission configuration would go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit User Permissions Form */}
      {selectedUserId && selectedClinic && (
        <UserPermissionsForm 
          userId={selectedUserId} 
          clinicId={selectedClinic.id} 
          userRole={selectedUserRole || ""}
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
