import { useState } from "react";
import { ClinicUser } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, ShieldAlert, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleDisplayNames, roleColors, statusColors, getInitials } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/auth-utils";
import { usePermissions } from "@/hooks/use-permissions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface UserListProps {
  users: any[];
  isLoading: boolean;
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  onEdit: (userId: number, role: string) => void;
  superAdmins?: any[];
  isLoadingSuperAdmins?: boolean;
}

export function UserList({ 
  users, 
  isLoading, 
  searchQuery, 
  roleFilter, 
  statusFilter, 
  onEdit,
  superAdmins = [],
  isLoadingSuperAdmins = false
}: UserListProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  const [targetUserName, setTargetUserName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Função para excluir um usuário da clínica
  const deleteUser = async (clinicUserId: number) => {
    if (!clinicUserId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clinic-users/${clinicUserId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir usuário');
      }
      
      // Atualizar o cache do React Query após a exclusão bem-sucedida
      toast({
        title: "Usuário removido",
        description: `${targetUserName} foi removido da clínica com sucesso.`,
        variant: "default",
      });
      
      // Invalidar as queries relevantes para atualizar a lista de usuários
      queryClient.invalidateQueries({ queryKey: ['/api/clinics'] });
      
    } catch (error: any) {
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Ocorreu um erro ao tentar remover o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Filtragem para usuários regulares da clínica
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.status === "ACTIVE") ||
      (statusFilter === "inactive" && user.status === "INACTIVE");

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filtragem para Super Admins
  const filteredSuperAdmins = superAdmins.filter((admin) => {
    if (roleFilter !== "all" && roleFilter !== "SUPER_ADMIN") return false;
    
    return !searchQuery || 
      admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading || isLoadingSuperAdmins) {
    return <UserListSkeleton />;
  }

  if (filteredUsers.length === 0 && filteredSuperAdmins.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground tracking-wide">
            <th className="p-2 pl-4">Usuário</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Status</th>
            <th className="p-2">Entrou em</th>
            <th className="p-2">Último acesso</th>
            <th className="p-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {/* Super Admins primeiro */}
          {filteredSuperAdmins.length > 0 && (
            <>
              {filteredSuperAdmins.map((admin, index) => (
                <tr key={`admin-${admin.id || index}`} className="hover:bg-muted/50 bg-violet-50">
                  <td className="p-2 pl-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-violet-100 text-violet-800">
                          {getInitials(admin.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center font-medium">
                          {admin.name}
                          <ShieldAlert className="ml-2 h-4 w-4 text-violet-800" />
                        </div>
                        <div className="text-sm text-muted-foreground">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge 
                      className={`${roleColors.SUPER_ADMIN} hover:${roleColors.SUPER_ADMIN}`}
                    >
                      {roleDisplayNames.SUPER_ADMIN}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge 
                      variant="outline" 
                      className={`${statusColors.ACTIVE} border-${statusColors.ACTIVE}`}
                    >
                      Ativo
                    </Badge>
                  </td>
                  <td className="p-2 text-sm">
                    {formatDate(admin.createdAt)}
                  </td>
                  <td className="p-2 text-sm">
                    {formatDate(admin.lastLogin)}
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
                        
                        {/* Enviar email para Super Admin */}
                        <DropdownMenuItem className="cursor-pointer">
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Enviar email</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              
              {/* Separador visual entre Super Admins e usuários regulares */}
              {filteredUsers.length > 0 && (
                <tr className="bg-muted/40">
                  <td colSpan={6} className="p-1 py-2 text-center">
                    <div className="text-xs font-medium text-muted-foreground">
                      Usuários da Clínica
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}
          
          {/* Usuários regulares da clínica */}
          {filteredUsers.map((user) => (
            <tr key={user.id} className="hover:bg-muted/50">
              <td className="p-2 pl-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="p-2">
                <Badge 
                  className={`${roleColors[user.role] || roleColors.DEFAULT} hover:${roleColors[user.role] || roleColors.DEFAULT}`}
                >
                  {roleDisplayNames[user.role] || user.role}
                </Badge>
              </td>
              <td className="p-2">
                <Badge 
                  variant="outline" 
                  className={`${statusColors[user.status] || statusColors.DEFAULT} border-${statusColors[user.status] || statusColors.DEFAULT}`}
                >
                  {user.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="p-2 text-sm">
                {formatDate(user.joinedAt)}
              </td>
              <td className="p-2 text-sm">
                {formatDate(user.lastLogin)}
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
                    
                    {/* Enviar email para usuário */}
                    <DropdownMenuItem className="cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Enviar email</span>
                    </DropdownMenuItem>
                    
                    {/* Permissões de usuário - apenas para administradores e gerentes */}
                    {hasPermission("users", "edit") && user.role !== "OWNER" && (
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => onEdit(user.id, user.role)}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Permissões</span>
                      </DropdownMenuItem>
                    )}
                    
                    {/* Excluir usuário - apenas para administradores e gerentes */}
                    {hasPermission("users", "delete") && user.role !== "OWNER" && (
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => {
                          setTargetUserId(user.id);
                          setTargetUserName(user.name);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remover</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Diálogo de confirmação para exclusão de usuário */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{targetUserName}</strong> da clínica? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)} 
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteUser(targetUserId!)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Skeleton para carregamento
function UserListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}