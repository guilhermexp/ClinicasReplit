import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Client, AppointmentStatus } from "@shared/schema";
import { 
  Loader2, 
  UserPlus, 
  RefreshCcw, 
  FileText, 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  LayoutGrid,
  LayoutList,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Client components
import ClientList from "@/components/clients/client-list";
import AddClientDialog from "@/components/clients/add-client-dialog";
import ClientDetails from "@/components/clients/client-details";
import DeleteClientModal from "@/components/clients/delete-client-modal";

export default function ClientsPage() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Fetch clients com cache otimizado
  const {
    data: clients = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    // Uma estratégia para reduzir o impacto da primeira carga
    placeholderData: (previousData) => previousData || [],
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Lista atualizada",
      description: "A lista de clientes foi atualizada com sucesso.",
    });
  };

  // Filter clients by search term and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch = 
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      (client.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (client.phone?.toLowerCase() || "").includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && client.status === "active") ||
      (statusFilter === "inactive" && (client.status === "inactive" || !client.status));
    
    return matchesSearch && matchesStatus;
  });
  
  // Pagination
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };
  
  // Handle delete client
  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };
  
  // Confirm delete client
  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    // O modal DeleteClientModal vai lidar com a exclusão
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };
  
  // Cancel delete client
  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };
  
  // Selected client
  const selectedClient = clients.find(client => client.id === selectedClientId);
  
  // Fechar detalhes do cliente em dispositivos móveis quando mudar a seleção
  useEffect(() => {
    if (isMobile && selectedClientId) {
      // Rolar para o topo quando selecionar um cliente em dispositivo móvel
      window.scrollTo(0, 0);
    }
  }, [selectedClientId, isMobile]);

  if (!selectedClinic) {
    return (
      <Card className="col-span-3 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Selecione uma clínica</CardTitle>
          <CardDescription>
            Por favor, selecione uma clínica para visualizar seus clientes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerenciamento de clientes da clínica {selectedClinic.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            {hasPermission("clients", "create") && (
              <Button 
                onClick={() => setIsAddingClient(true)}
                className="whitespace-nowrap"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span className={isMobile ? "hidden" : "inline"}>Adicionar Cliente</span>
                <span className={isMobile ? "inline" : "hidden"}>Adicionar</span>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opções</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Atualizar lista
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar clientes
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar clientes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col md:flex-row gap-2 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors ${isSearchFocused ? 'text-primary' : 'text-gray-400'}`} />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 h-10"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {search && (
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 whitespace-nowrap">
              <Filter className="h-4 w-4" />
              Filtros
              <Badge className="ml-1 bg-primary text-white">0</Badge>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filtrar clientes</SheetTitle>
              <SheetDescription>
                Aplique filtros para refinar sua busca de clientes
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6">
              <div className="space-y-4">
                {/* Filtros seriam implementados aqui */}
                <p className="text-sm text-muted-foreground text-center">
                  Funcionalidade de filtros em desenvolvimento
                </p>
              </div>
            </div>
            
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
              </SheetClose>
              <Button className="w-full sm:w-auto">Aplicar filtros</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "cards")} className="w-[180px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Lista</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Conteúdo principal */}
      {filteredClients.length === 0 ? (
        <Card className="shadow-sm border-gray-200">
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">
              {search
                ? "Nenhum cliente encontrado para esta busca"
                : "Nenhum cliente cadastrado ainda"}
            </p>
            {hasPermission("clients", "create") && !search && (
              <Button onClick={() => setIsAddingClient(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="shadow-sm border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Lista de Clientes</CardTitle>
                <CardDescription>
                  Total de {filteredClients.length} clientes
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  title="Atualizar lista"
                  className="h-8 w-8"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Nome</th>
                      <th className="text-left p-3 font-medium">Telefone</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Último Atendimento</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {client.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{client.phone || "-"}</td>
                        <td className="p-3 text-muted-foreground">{client.email || "-"}</td>
                        <td className="p-3 text-muted-foreground">
                          {client.lastVisit 
                            ? format(new Date(client.lastVisit), "dd/MM/yyyy", { locale: ptBR })
                            : "Nunca atendido"}
                        </td>
                        <td className="p-3">
                          <Badge variant={client.status === "active" ? "default" : "secondary"} className={client.status === "active" ? "bg-green-100 text-green-800" : ""}>
                            {client.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedClientId(client.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {hasPermission("clients", "delete") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(client)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedClientId(client.id)}>
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Novo Agendamento
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Anamnese
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          
          {totalPages > 1 && (
            <CardFooter className="border-t p-3 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} clientes
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedClients.map((client) => (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{client.name}</CardTitle>
                        <CardDescription>
                          {client.lastVisit 
                            ? `Última visita: ${format(new Date(client.lastVisit), "dd/MM/yyyy", { locale: ptBR })}`
                            : "Sem visitas"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={client.status === "active" ? "default" : "secondary"} className={client.status === "active" ? "bg-green-100 text-green-800" : ""}>
                      {client.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-2 text-sm">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-1">{client.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t pt-3 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedClientId(client.id)}
                  >
                    Ver Detalhes
                  </Button>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedClientId(client.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    {hasPermission("clients", "delete") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      <AddClientDialog
        open={isAddingClient}
        onOpenChange={setIsAddingClient}
        onSuccess={(newClient) => {
          refetch();
          setSelectedClientId(newClient.id);
        }}
      />
      
      {clientToDelete && (
        <DeleteClientModal
          client={clientToDelete}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          onSuccess={() => {
            refetch();
            if (selectedClientId === clientToDelete.id) {
              setSelectedClientId(null);
            }
          }}
        />
      )}
      
      {/* Modal de detalhes do cliente */}
      {selectedClientId && selectedClient && (
        <Sheet open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
          <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
            <ClientDetails 
              client={selectedClient} 
              onClose={() => setSelectedClientId(null)} 
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
