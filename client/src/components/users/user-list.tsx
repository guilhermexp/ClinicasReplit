import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, getAvatarColor, formatDate, roleDisplayNames, roleColors, statusColors } from "@/lib/auth-utils";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/use-permissions";

interface UserListProps {
  isLoading: boolean;
  users: any[];
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  onEdit: (userId: number, role: string) => void;
}

export function UserList({
  isLoading,
  users,
  searchQuery,
  roleFilter,
  statusFilter,
  onEdit
}: UserListProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Apply filters
  const filteredUsers = users.filter(user => {
    // Verificar se user e user.user existem para evitar erros
    if (!user || !user.user) return false;
    
    const matchesSearch = 
      !searchQuery || 
      (user.user.name && user.user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.user.email && user.user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.user.isActive) ||
      (statusFilter === 'inactive' && !user.user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle status change
  const handleStatusChange = async (userId: number, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/users/${userId}`, { isActive: !isActive });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      
      toast({
        title: "Status atualizado",
        description: `Usuário ${!isActive ? "ativado" : "desativado"} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    }
  };
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[80px] mt-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[100px] rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  // If no users after filtering
  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((clinicUser) => {
              // Verificar se clinicUser e clinicUser.user existem
              if (!clinicUser || !clinicUser.user) return null;
              
              const user = clinicUser.user;
              return (
                <TableRow key={clinicUser.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getAvatarColor(user.name || 'Usuário')}`}>
                        <span>{getInitials(user.name || 'Usuário')}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Nome não disponível'}</div>
                        <div className="text-sm text-gray-500">
                          Criado em {user.createdAt ? formatDate(user.createdAt).split(',')[0] : 'data desconhecida'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{user.email || 'Email não disponível'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${clinicUser.role && roleColors[clinicUser.role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {clinicUser.role && roleDisplayNames[clinicUser.role as keyof typeof roleDisplayNames] || clinicUser.role || 'Função desconhecida'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={user.isActive !== undefined ? (user.isActive ? statusColors.active : statusColors.inactive) : 'bg-gray-100 text-gray-800'}
                    >
                      {user.isActive !== undefined ? (user.isActive ? "Ativo" : "Inativo") : "Status desconhecido"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {user.lastLogin ? formatDate(user.lastLogin) : "Nunca"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {hasPermission("users", "update") && user.id && (
                          <DropdownMenuItem onClick={() => onEdit(user.id, clinicUser.role)}>
                            Editar
                          </DropdownMenuItem>
                        )}
                        {hasPermission("users", "update") && user.id && user.isActive !== undefined && (
                          <DropdownMenuItem onClick={() => handleStatusChange(user.id, user.isActive)}>
                            {user.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                // Show pages centered around current page
                let pageToShow = currentPage;
                if (currentPage < 3) {
                  pageToShow = i + 1;
                } else if (currentPage > totalPages - 2) {
                  pageToShow = totalPages - 4 + i;
                } else {
                  pageToShow = currentPage - 2 + i;
                }
                
                // Make sure we don't show pages below 1 or above totalPages
                if (pageToShow < 1 || pageToShow > totalPages) return null;
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageToShow)}
                      isActive={currentPage === pageToShow}
                    >
                      {pageToShow}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
