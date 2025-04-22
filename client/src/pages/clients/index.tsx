import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Client } from "@shared/schema";
import { Loader2, UserPlus, RefreshCcw, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Client components
import ClientList from "@/components/clients/client-list";
import AddClientDialog from "@/components/clients/add-client-dialog";
import ClientDetails from "@/components/clients/client-details";

export default function ClientsPage() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);

  // Fetch clients
  const {
    data: clients = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Client[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic?.id,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Lista atualizada",
      description: "A lista de clientes foi atualizada com sucesso.",
    });
  };

  // Filter clients by search term
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.email?.toLowerCase().includes(search.toLowerCase()) ||
    client.phone?.toLowerCase().includes(search.toLowerCase())
  );
  
  // Selected client
  const selectedClient = clients.find(client => client.id === selectedClientId);

  if (!selectedClinic) {
    return (
      <Card className="col-span-3">
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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de clientes da clínica {selectedClinic.name}
          </p>
        </div>
        
        {hasPermission("clients", "create") && (
          <Button onClick={() => setIsAddingClient(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Lista de Clientes</CardTitle>
              <CardDescription>
                Total de {filteredClients.length} clientes
              </CardDescription>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  title="Atualizar lista"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="py-8 text-center">
                  <p className="text-destructive mb-2">Erro ao carregar clientes</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? "Nenhum cliente encontrado para esta busca"
                      : "Nenhum cliente cadastrado ainda"}
                  </p>
                  {hasPermission("clients", "create") && !search && (
                    <Button onClick={() => setIsAddingClient(true)}>
                      Adicionar Cliente
                    </Button>
                  )}
                </div>
              ) : (
                <ClientList
                  clients={filteredClients}
                  selectedClientId={selectedClientId}
                  onSelectClient={setSelectedClientId}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedClient ? (
            <ClientDetails 
              client={selectedClient} 
              onClose={() => setSelectedClientId(null)} 
            />
          ) : (
            <Card className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente selecionado</h3>
                <p className="text-muted-foreground mb-4">
                  Selecione um cliente da lista para ver seus detalhes
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <AddClientDialog
        open={isAddingClient}
        onOpenChange={setIsAddingClient}
        onSuccess={(newClient) => {
          refetch();
          setSelectedClientId(newClient.id);
        }}
      />
    </>
  );
}