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
  Loader2
} from "lucide-react";

export default function Settings() {
  const { selectedClinic, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Query to get clinic details - usando tipagem correta
  const { data: clinic, isLoading } = useQuery<Clinic>({
    queryKey: ["/api/clinics", selectedClinic?.id],
    enabled: !!selectedClinic?.id,
  });
  
  // Inicializar clinicInfo com dados vazios
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    address: "",
    phone: "",
    openingHours: ""
  });
  
  // Atualizar o formulário quando os dados da clínica são carregados
  useEffect(() => {
    console.log("Clinic data loaded:", clinic);
    if (clinic) {
      setClinicInfo({
        name: clinic.name || "",
        address: clinic.address || "",
        phone: clinic.phone || "",
        openingHours: clinic.openingHours || ""
      });
    }
  }, [clinic]);
  
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
        <TabsList className="mb-4">
          <TabsTrigger value="clinic" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Clínica
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Perfil
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
                              defaultValue="14:00"
                              disabled={!hasPermission("settings", "edit") || isUpdating}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sunday">Domingo</Label>
                          <div className="flex items-center h-10">
                            <span className="text-sm text-gray-500">Fechado</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium mb-3">Serviços</h3>
                      <p className="text-sm text-gray-500">
                        Os serviços podem ser configurados na seção de serviços do sistema.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline"
                        disabled={isUpdating}
                      >
                        Gerenciar Serviços
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                {hasPermission("settings", "edit") && (
                  <Button 
                    type="submit" 
                    disabled={isUpdating || isLoading}
                  >
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
                Gerencie as informações do seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome Completo</Label>
                <Input 
                  id="username" 
                  placeholder="Seu nome completo" 
                  defaultValue="João Dourado"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu.email@exemplo.com" 
                  defaultValue="joao.dourado@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  placeholder="(XX) XXXXX-XXXX" 
                  defaultValue="(11) 98765-4321"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="profile-photo">Foto de Perfil</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-xl">JD</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Alterar Foto
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select defaultValue="pt-BR">
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select defaultValue="America/Sao_Paulo">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Selecione o fuso horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                    <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
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
                    <div className="space-y-0.5">
                      <Label htmlFor="email-appointments">Agendamentos</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba emails sobre novos agendamentos e alterações.
                      </p>
                    </div>
                    <Switch id="email-appointments" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-marketing">Marketing</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba emails sobre campanhas e promoções.
                      </p>
                    </div>
                    <Switch id="email-marketing" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-system">Sistema</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba emails sobre atualizações e alterações no sistema.
                      </p>
                    </div>
                    <Switch id="email-system" defaultChecked />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Notificações Push</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-appointments">Agendamentos</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações no navegador sobre agendamentos.
                      </p>
                    </div>
                    <Switch id="push-appointments" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-messages">Mensagens</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba notificações no navegador sobre novas mensagens.
                      </p>
                    </div>
                    <Switch id="push-messages" defaultChecked />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Lembretes</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminder-day-before">Dia Anterior</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba um lembrete um dia antes dos agendamentos.
                      </p>
                    </div>
                    <Switch id="reminder-day-before" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reminder-hour-before">Uma Hora Antes</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba um lembrete uma hora antes dos agendamentos.
                      </p>
                    </div>
                    <Switch id="reminder-hour-before" defaultChecked />
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
              <CardTitle>Segurança e Privacidade</CardTitle>
              <CardDescription>
                Gerencie suas configurações de segurança e privacidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Alterar Senha</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirme a Nova Senha</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                  
                  <Button className="mt-2">Alterar Senha</Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Verificação em Duas Etapas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Ativar Verificação em Duas Etapas</Label>
                      <p className="text-sm text-muted-foreground">
                        Adicione uma camada extra de segurança à sua conta.
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Dispositivos Conectados</h3>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <Smartphone className="mr-2 h-4 w-4" />
                          <span className="font-medium">iPhone 13 Pro</span>
                        </div>
                        <p className="text-sm text-muted-foreground">São Paulo, Brasil</p>
                        <p className="text-xs text-muted-foreground mt-1">Último acesso: Hoje, 09:32</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Desconectar
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <Laptop className="mr-2 h-4 w-4" />
                          <span className="font-medium">MacBook Pro</span>
                        </div>
                        <p className="text-sm text-muted-foreground">São Paulo, Brasil</p>
                        <p className="text-xs text-muted-foreground mt-1">Último acesso: Hoje, 08:15</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Desconectar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing Laptop component - used in the security tab
function Laptop(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  );
}
