import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Clinic } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  User, 
  Bell, 
  Lock, 
  Clock, 
  Smartphone, 
  Mail,
  Save,
  Loader2,
  Scissors,
  Users,
  Package
} from "lucide-react";

// Helper component for the inventory tab
import { InventoryPanel } from "./inventory-panel";

export default function Settings() {
  const { selectedClinic, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Usar diretamente os dados de selectedClinic em vez de fazer uma nova consulta
  const [isLoading, setIsLoading] = useState(false);
  const clinicDetails = selectedClinic;
  
  // Inicializar clinicInfo com dados vazios
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    address: "",
    phone: "",
    openingHours: ""
  });
  
  // Atualizar o formulário quando os dados da clínica são carregados
  useEffect(() => {
    if (clinicDetails) {
      console.log("Setting clinic info:", clinicDetails);
      
      // Definir os valores dos campos do formulário
      setClinicInfo({
        name: clinicDetails.name || "",
        address: clinicDetails.address || "",
        phone: clinicDetails.phone || "",
        openingHours: clinicDetails.openingHours || ""
      });
    }
  }, [clinicDetails]);
  
  // Mutation for updating clinic
  const updateClinicMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedClinic?.id) throw new Error("Clínica não selecionada");
      const res = await apiRequest("PATCH", `/api/clinics/${selectedClinic.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações da clínica foram atualizadas com sucesso."
      });
      setIsUpdating(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Ocorreu um erro ao salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
      setIsUpdating(false);
    }
  });
  
  const handleClinicInfoChange = (field: string, value: string) => {
    setClinicInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveClinicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    updateClinicMutation.mutate(clinicInfo);
  };
  
  if (!hasPermission("settings", "view")) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Configurações</h1>
      </div>
      
      <Tabs defaultValue="clinic">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="clinic" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="procedures" className="flex items-center">
            <Scissors className="mr-2 h-4 w-4" />
            Procedimentos
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Colaboradores
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>
        
        {/* Clinic Settings */}
        <TabsContent value="clinic">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Clínica</CardTitle>
              <CardDescription>
                Edite as informações básicas da sua clínica.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveClinicInfo}>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="clinic-name">Nome da Clínica</Label>
                      <Input 
                        id="clinic-name" 
                        value={clinicInfo.name}
                        onChange={(e) => handleClinicInfoChange("name", e.target.value)}
                        placeholder="Nome da sua clínica"
                        disabled={!hasPermission("settings", "edit") || isUpdating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinic-address">Endereço</Label>
                      <Textarea 
                        id="clinic-address" 
                        value={clinicInfo.address}
                        onChange={(e) => handleClinicInfoChange("address", e.target.value)}
                        placeholder="Endereço completo da clínica"
                        disabled={!hasPermission("settings", "edit") || isUpdating}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinic-phone">Telefone</Label>
                      <Input 
                        id="clinic-phone" 
                        value={clinicInfo.phone}
                        onChange={(e) => handleClinicInfoChange("phone", e.target.value)}
                        placeholder="(XX) XXXXX-XXXX"
                        disabled={!hasPermission("settings", "edit") || isUpdating}
                      />
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <h3 className="text-sm font-medium mb-3">Horário de Funcionamento</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="monday">Segunda-feira</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="monday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="08:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="monday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="18:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tuesday">Terça-feira</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="tuesday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="08:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="tuesday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="18:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wednesday">Quarta-feira</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="wednesday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="08:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="wednesday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="18:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="thursday">Quinta-feira</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="thursday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="08:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="thursday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="18:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="friday">Sexta-feira</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="friday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="08:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="friday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="18:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="saturday">Sábado</Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="saturday-open" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="09:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                            <span className="flex items-center">até</span>
                            <Input 
                              id="saturday-close" 
                              type="time" 
                              className="flex-1" 
                              defaultValue="13:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {hasPermission("settings", "edit") && (
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Usuário</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e preferências de conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user?.name || "Nome do Usuário"}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {user?.email || "email@exemplo.com"}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {user?.role || "Usuário"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue={user?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select defaultValue="America/Sao_Paulo">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                      <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Procedures Settings */}
        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Procedimentos</CardTitle>
              <CardDescription>
                Cadastre e gerencie os procedimentos oferecidos pela clínica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Procedimentos Cadastrados</h3>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Novo Procedimento
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 flex items-center font-medium text-sm">
                    <div className="w-1/3">Nome</div>
                    <div className="w-1/6">Duração</div>
                    <div className="w-1/4">Categoria</div>
                    <div className="w-1/6">Valor</div>
                    <div className="w-1/12 text-right">Ações</div>
                  </div>
                  <div className="divide-y">
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-1/3 font-medium">Botox Facial</div>
                      <div className="w-1/6">45 min</div>
                      <div className="w-1/4">Estética Facial</div>
                      <div className="w-1/6">R$ 450,00</div>
                      <div className="w-1/12 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-1/3 font-medium">Preenchimento Labial</div>
                      <div className="w-1/6">60 min</div>
                      <div className="w-1/4">Estética Facial</div>
                      <div className="w-1/6">R$ 800,00</div>
                      <div className="w-1/12 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-1/3 font-medium">Limpeza de Pele</div>
                      <div className="w-1/6">90 min</div>
                      <div className="w-1/4">Estética Facial</div>
                      <div className="w-1/6">R$ 180,00</div>
                      <div className="w-1/12 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Categorias de Procedimentos</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Estética Facial
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Estética Corporal
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Massoterapia
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Nova Categoria
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                Exportar Lista
              </Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Employees Settings */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Colaboradores</CardTitle>
              <CardDescription>
                Cadastre e gerencie informações dos colaboradores da clínica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Colaboradores Cadastrados</h3>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Novo Colaborador
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 p-3 flex items-center font-medium text-sm">
                    <div className="w-2/5">Nome</div>
                    <div className="w-1/5">Cargo</div>
                    <div className="w-1/5">Departamento</div>
                    <div className="w-1/5 text-right">Ações</div>
                  </div>
                  <div className="divide-y">
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-2/5 font-medium flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 mr-2 flex items-center justify-center font-medium">AM</div>
                        Ana Mendes
                      </div>
                      <div className="w-1/5">Esteticista</div>
                      <div className="w-1/5">Estética Facial</div>
                      <div className="w-1/5 flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10H3M16 2v8M8 2v8M1 10h22v9a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-9Z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-2/5 font-medium flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 mr-2 flex items-center justify-center font-medium">RS</div>
                        Ricardo Santos
                      </div>
                      <div className="w-1/5">Massoterapeuta</div>
                      <div className="w-1/5">Massoterapia</div>
                      <div className="w-1/5 flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10H3M16 2v8M8 2v8M1 10h22v9a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-9Z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                      <div className="w-2/5 font-medium flex items-center">
                        <div className="h-8 w-8 rounded-full bg-pink-100 text-pink-600 mr-2 flex items-center justify-center font-medium">JL</div>
                        Juliana Lima
                      </div>
                      <div className="w-1/5">Esteticista</div>
                      <div className="w-1/5">Estética Corporal</div>
                      <div className="w-1/5 flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10H3M16 2v8M8 2v8M1 10h22v9a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-9Z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Departamentos</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Estética Facial
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Estética Corporal
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Massoterapia
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
                    Administração
                    <button className="ml-2 text-primary/70 hover:text-primary">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Novo Departamento
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                Relatório de Colaboradores
              </Button>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Inventory Settings */}
        <TabsContent value="inventory">
          <InventoryPanel />
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Gerencie como e quando você recebe notificações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Notificações de Email</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="marketing"
                        className="text-sm font-medium"
                      >
                        Notificações de Marketing
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba informações sobre promoções e novidades.
                      </p>
                    </div>
                    <Switch id="marketing" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="social"
                        className="text-sm font-medium"
                      >
                        Lembretes de Consulta
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba lembretes de consultas agendadas.
                      </p>
                    </div>
                    <Switch id="social" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="security"
                        className="text-sm font-medium"
                      >
                        Alertas de Segurança
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Seja notificado sobre atividades suspeitas.
                      </p>
                    </div>
                    <Switch id="security" defaultChecked />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Notificações de Aplicativo</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="new-features"
                        className="text-sm font-medium"
                      >
                        Novos Recursos
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações sobre novos recursos.
                      </p>
                    </div>
                    <Switch id="new-features" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="account-activity"
                        className="text-sm font-medium"
                      >
                        Atividade da Conta
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações sobre a atividade da sua conta.
                      </p>
                    </div>
                    <Switch id="account-activity" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="newsletter"
                        className="text-sm font-medium"
                      >
                        Newsletter
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receba nossa newsletter mensal.
                      </p>
                    </div>
                    <Switch id="newsletter" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança e controle de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Alterar Senha</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Autenticação de Dois Fatores</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Aumente a segurança da sua conta com autenticação de dois fatores.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Sessões Ativas</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Chrome em Windows</p>
                      <p className="text-xs text-gray-500">Último acesso: Hoje, 14:30</p>
                    </div>
                    <Button variant="outline" size="sm">Encerrar</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Safari em MacOS</p>
                      <p className="text-xs text-gray-500">Último acesso: Ontem, 18:45</p>
                    </div>
                    <Button variant="outline" size="sm">Encerrar</Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}