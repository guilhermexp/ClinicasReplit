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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Edit, Save, X, Trash, Upload, Download, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InventoryPanel } from "./inventory-panel";
import { ProceduresPanel } from "./procedures-panel";

export default function Settings() {
  const { user, selectedClinic, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  
  // Dados da clínica
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicWebsite, setClinicWebsite] = useState("");
  const [clinicLogo, setClinicLogo] = useState("");
  
  // Buscar dados da clínica
  const { data: clinic, isLoading } = useQuery<Clinic>({
    queryKey: ["/api/clinics", selectedClinic?.id],
    queryFn: async () => {
      if (!selectedClinic?.id) return null;
      const res = await apiRequest("GET", `/api/clinics/${selectedClinic.id}`);
      return res.json();
    },
    enabled: !!selectedClinic?.id
  });
  
  // Preencher os dados da clínica quando disponíveis
  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.name || "");
      setClinicAddress(clinic.address || "");
      setClinicPhone(clinic.phone || "");
      setClinicEmail(clinic.email || "");
      setClinicWebsite(clinic.website || "");
      setClinicLogo(clinic.logo || "");
    }
  }, [clinic]);
  
  // Mutation para atualizar os dados da clínica
  const updateClinicMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/clinics/${selectedClinic?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "As configurações da clínica foram atualizadas.",
      });
      
      // Atualizar os dados da clínica no cache
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", selectedClinic?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao atualizar as configurações: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setSaving(false);
    }
  });
  
  // Função para salvar as configurações gerais
  const handleSaveGeneralSettings = () => {
    setSaving(true);
    
    const clinicData = {
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      email: clinicEmail,
      website: clinicWebsite,
      logo: clinicLogo
    };
    
    updateClinicMutation.mutate(clinicData);
  };
  
  return (
    <div className="w-full space-y-6 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie todas as configurações da sua clínica.
        </p>
      </div>
      
      <Separator className="my-6" />
      
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-1/5">
          <Tabs
            orientation="vertical"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-2"
          >
            <TabsList className="flex flex-col items-start h-auto space-y-1">
              <TabsTrigger
                value="general"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Geral
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Aparência
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Notificações
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Segurança
              </TabsTrigger>
              <TabsTrigger
                value="procedures"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Procedimentos
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Inventário
              </TabsTrigger>
              <TabsTrigger
                value="employees"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Colaboradores
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="w-full justify-start text-left px-2 py-1.5"
              >
                Faturamento
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </aside>
        
        <div className="flex-1 lg:max-w-4xl">
          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
                <CardDescription>
                  Atualize as informações básicas da sua clínica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinic-name">Nome da Clínica</Label>
                    <Input
                      id="clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Nome da clínica"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinic-address">Endereço</Label>
                    <Input
                      id="clinic-address"
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      placeholder="Endereço completo"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clinic-phone">Telefone</Label>
                      <Input
                        id="clinic-phone"
                        value={clinicPhone}
                        onChange={(e) => setClinicPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinic-email">E-mail</Label>
                      <Input
                        id="clinic-email"
                        type="email"
                        value={clinicEmail}
                        onChange={(e) => setClinicEmail(e.target.value)}
                        placeholder="contato@clinica.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clinic-website">Website</Label>
                    <Input
                      id="clinic-website"
                      value={clinicWebsite}
                      onChange={(e) => setClinicWebsite(e.target.value)}
                      placeholder="https://www.clinica.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Logo da Clínica</Label>
                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-lg border flex items-center justify-center overflow-hidden bg-gray-50">
                        {clinicLogo ? (
                          <img 
                            src={clinicLogo} 
                            alt="Logo da clínica" 
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm text-center p-2">
                            Sem logo
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Fazer upload
                        </Button>
                        <p className="text-xs text-gray-500">
                          Recomendado: PNG ou JPG, 1:1, mínimo 200x200px
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Restaurar Padrões
                </Button>
                <Button onClick={handleSaveGeneralSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema e suas preferências visuais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tema</Label>
                      <p className="text-sm text-muted-foreground">
                        Escolha entre tema claro ou escuro.
                      </p>
                    </div>
                    <Select defaultValue="light">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cor Primária</Label>
                      <p className="text-sm text-muted-foreground">
                        Defina a cor principal do sistema.
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="h-6 w-6 rounded-full border-2 border-primary bg-primary" aria-label="Cor primária"></button>
                      <button className="h-6 w-6 rounded-full border-2 border-primary/20 bg-purple-600" aria-label="Roxo"></button>
                      <button className="h-6 w-6 rounded-full border-2 border-primary/20 bg-blue-600" aria-label="Azul"></button>
                      <button className="h-6 w-6 rounded-full border-2 border-primary/20 bg-green-600" aria-label="Verde"></button>
                      <button className="h-6 w-6 rounded-full border-2 border-primary/20 bg-orange-600" aria-label="Laranja"></button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animações</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar ou desativar animações na interface.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Densidade</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajuste o espaçamento dos elementos na interface.
                      </p>
                    </div>
                    <div className="w-32">
                      <Slider defaultValue={[50]} max={100} step={10} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Restaurar Padrões
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure como e quando deseja receber notificações.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notificações por E-mail</h3>
                  
                  <div className="rounded-md border divide-y">
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Novos Agendamentos</div>
                        <div className="text-sm text-muted-foreground">
                          Receba um e-mail quando um novo agendamento for confirmado.
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Lembretes de Consulta</div>
                        <div className="text-sm text-muted-foreground">
                          Receba lembretes de consultas agendadas para o dia seguinte.
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Relatórios Semanais</div>
                        <div className="text-sm text-muted-foreground">
                          Receba um relatório semanal com estatísticas da clínica.
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Alertas de Pagamento</div>
                        <div className="text-sm text-muted-foreground">
                          Receba notificações sobre pagamentos recebidos ou pendentes.
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium pt-4">Notificações por WhatsApp</h3>
                  
                  <div className="rounded-md border divide-y">
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Confirmação de Agendamento</div>
                        <div className="text-sm text-muted-foreground">
                          Envie confirmações automáticas de agendamentos via WhatsApp.
                        </div>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">Lembretes Automáticos</div>
                        <div className="text-sm text-muted-foreground">
                          Envie lembretes automáticos antes das consultas.
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Restaurar Padrões
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Gerencie as configurações de segurança da sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Alterar Senha</h3>
                  
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
                  
                  <Button className="mt-2">Atualizar Senha</Button>
                  
                  <Separator className="my-4" />
                  
                  <h3 className="text-sm font-medium">Sessões Ativas</h3>
                  
                  <div className="space-y-4">
                    <div className="rounded-md border p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Sessão Atual (Chrome em Windows)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            IP: 189.76.xxx.xxx · Iniciada há 2 horas
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-xs font-medium">Ativo</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="destructive" className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Encerrar Todas as Outras Sessões
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Cancelar
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Procedures Settings */}
          <TabsContent value="procedures">
            <ProceduresPanel />
          </TabsContent>
          
          {/* Inventory Settings */}
          <TabsContent value="inventory">
            <InventoryPanel />
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
                        <div className="w-1/5">Nutricionista</div>
                        <div className="w-1/5">Nutrição</div>
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
                  <h3 className="text-sm font-medium">Gerenciar Cargos</h3>
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-50 p-3 flex items-center font-medium text-sm">
                      <div className="w-2/5">Cargo</div>
                      <div className="w-2/5">Permissões</div>
                      <div className="w-1/5 text-right">Ações</div>
                    </div>
                    <div className="divide-y">
                      <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                        <div className="w-2/5 font-medium">Administrador</div>
                        <div className="w-2/5">
                          <div className="flex">
                            <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 mr-1">Acesso Total</span>
                          </div>
                        </div>
                        <div className="w-1/5 flex justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                        <div className="w-2/5 font-medium">Atendente</div>
                        <div className="w-2/5">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Agendamentos</span>
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Clientes</span>
                          </div>
                        </div>
                        <div className="w-1/5 flex justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 flex items-center text-sm hover:bg-gray-50">
                        <div className="w-2/5 font-medium">Profissional</div>
                        <div className="w-2/5">
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Agenda Pessoal</span>
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Prontuários</span>
                          </div>
                        </div>
                        <div className="w-1/5 flex justify-end">
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
                  <Button variant="outline" size="sm" className="flex items-center">
                    <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Adicionar Cargo
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  Cancelar
                </Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Billing Settings */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Plano e Faturamento</CardTitle>
                <CardDescription>
                  Gerencie seu plano de assinatura e informações de faturamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-md p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h3 className="font-medium">Plano Premium</h3>
                      <p className="text-sm text-muted-foreground">
                        Acesso a todos os recursos premium.
                      </p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Ativo
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                      <p className="font-medium">15/05/2023</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium">R$ 199,90 / mês</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Método de pagamento</p>
                      <p className="font-medium">Cartão de crédito terminando em 4242</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Limite de usuários</p>
                      <p className="font-medium">30 usuários (10 ativos)</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <Button variant="outline" size="sm">
                      Atualizar método de pagamento
                    </Button>
                    <Button variant="outline" size="sm">
                      Ver histórico de faturamento
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Mudar de Plano</h3>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-medium">Básico</h3>
                        <p className="text-2xl font-bold">R$ 99,90<span className="text-sm font-normal text-muted-foreground"> / mês</span></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Até 10 usuários
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Agendamento
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Cadastro de clientes
                        </li>
                        <li className="flex items-center text-muted-foreground">
                          <svg className="h-4 w-4 mr-2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                          Relatórios avançados
                        </li>
                      </ul>
                      <Button variant="outline" className="w-full">Downgrade</Button>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-4 bg-primary/5 border-primary">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <h3 className="font-medium">Premium</h3>
                          <div className="ml-2 bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                            Atual
                          </div>
                        </div>
                        <p className="text-2xl font-bold">R$ 199,90<span className="text-sm font-normal text-muted-foreground"> / mês</span></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Até 30 usuários
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Recursos do plano Básico
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Relatórios avançados
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Integrações
                        </li>
                      </ul>
                      <Button disabled className="w-full">Plano Atual</Button>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-medium">Enterprise</h3>
                        <p className="text-2xl font-bold">R$ 499,90<span className="text-sm font-normal text-muted-foreground"> / mês</span></p>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Usuários ilimitados
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Recursos do plano Premium
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          API dedicada
                        </li>
                        <li className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Suporte prioritário
                        </li>
                      </ul>
                      <Button variant="outline" className="w-full">Upgrade</Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mt-4">
                    <p>Todos os planos incluem atualizações automáticas e acesso à nossa central de suporte.</p>
                    <p className="mt-1">Entre em contato com nossa equipe de vendas para cotações personalizadas.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </div>
    </div>
  );
}