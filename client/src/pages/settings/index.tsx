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
  
  // Dados de segurança
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);
  const [appAuth, setAppAuth] = useState(false);
  const [smsAuth, setSmsAuth] = useState(false);
  const [emailAuth, setEmailAuth] = useState(false);
  
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
  
  // Mutation para alterar a senha do usuário
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha Alterada!",
        description: "Sua senha foi alterada com sucesso.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao alterar senha: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setChangingPassword(false);
    }
  });
  
  // Função para calcular a força da senha
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Comprimento mínimo
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    
    // Complexidade
    if (/[A-Z]/.test(password)) strength += 20; // Letras maiúsculas
    if (/[a-z]/.test(password)) strength += 10; // Letras minúsculas
    if (/[0-9]/.test(password)) strength += 20; // Números
    if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Caracteres especiais
    
    return Math.min(strength, 100);
  };
  
  // Função para atualizar a força da senha em tempo real
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(calculatePasswordStrength(password));
  };
  
  // Função para alterar a senha
  const handleChangePassword = () => {
    // Validações
    if (!currentPassword) {
      toast({
        title: "Erro!",
        description: "A senha atual é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPassword) {
      toast({
        title: "Erro!",
        description: "A nova senha é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro!",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordStrength < 50) {
      toast({
        title: "Atenção!",
        description: "Sua senha é fraca. Recomendamos uma senha mais forte.",
      });
      return;
    }
    
    setChangingPassword(true);
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
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
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="lg:w-1/5">
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
                  {/* Conteúdo omitido para brevidade */}
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
                  {/* Conteúdo omitido para brevidade */}
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
                  {/* Conteúdo omitido para brevidade */}
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
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Alteração de Senha</CardTitle>
                    <CardDescription>
                      Atualize sua senha para manter sua conta segura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Senha Atual</Label>
                        <Input 
                          type="password" 
                          id="current-password" 
                          placeholder="Digite sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input 
                          type="password" 
                          id="new-password" 
                          placeholder="Digite a nova senha"
                          value={newPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                        <Input 
                          type="password" 
                          id="confirm-password" 
                          placeholder="Confirme a nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Força da Senha</div>
                      <Progress value={passwordStrength} className="h-2 w-full" />
                      <p className="text-xs text-muted-foreground">
                        Para uma senha forte, inclua letras maiúsculas, minúsculas, números e símbolos.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleChangePassword} disabled={changingPassword} className="ml-auto">
                      {changingPassword ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground" />
                          Alterando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Alterar Senha
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Autenticação de Dois Fatores</CardTitle>
                    <CardDescription>
                      Adicione uma camada extra de segurança à sua conta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          Autenticação por Aplicativo
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Use um aplicativo autenticador como Google Authenticator ou Authy.
                        </div>
                      </div>
                      <Switch 
                        checked={appAuth}
                        onCheckedChange={setAppAuth}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          Autenticação por SMS
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Receba códigos de verificação por mensagem de texto.
                        </div>
                      </div>
                      <Switch 
                        checked={smsAuth}
                        onCheckedChange={setSmsAuth}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          Autenticação por E-mail
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Receba códigos de verificação por e-mail.
                        </div>
                      </div>
                      <Switch 
                        checked={emailAuth}
                        onCheckedChange={setEmailAuth}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dispositivos Conectados</CardTitle>
                    <CardDescription>
                      Gerencie dispositivos que possuem acesso à sua conta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                          >
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" x2="16" y1="21" y2="21" />
                            <line x1="12" x2="12" y1="17" y2="21" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">MacBook Pro</p>
                          <p className="text-xs text-muted-foreground">São Paulo, Brasil · Ativo agora</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Encerrar sessão</span>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                          >
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" x2="12.01" y1="18" y2="18" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">iPhone 13</p>
                          <p className="text-xs text-muted-foreground">São Paulo, Brasil · Último acesso: Ontem</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Encerrar sessão</span>
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="ml-auto">
                      Encerrar Todas as Sessões
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Registros de Atividade</CardTitle>
                    <CardDescription>
                      Monitore as atividades recentes da sua conta para maior segurança.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Login bem-sucedido</p>
                            <p className="text-xs text-muted-foreground">São Paulo, Brasil · Navegador Chrome</p>
                          </div>
                          <span className="text-xs text-muted-foreground">Hoje, 14:23</span>
                        </div>
                      </div>
                      <div className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Alteração de senha</p>
                            <p className="text-xs text-muted-foreground">São Paulo, Brasil · Navegador Safari</p>
                          </div>
                          <span className="text-xs text-muted-foreground">10/04/2025, 08:15</span>
                        </div>
                      </div>
                      <div className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Atualização de perfil</p>
                            <p className="text-xs text-muted-foreground">São Paulo, Brasil · Navegador Firefox</p>
                          </div>
                          <span className="text-xs text-muted-foreground">05/04/2025, 16:42</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="ml-auto">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Histórico Completo
                    </Button>
                  </CardFooter>
                </Card>
              </div>
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
                  {/* Conteúdo omitido para brevidade */}
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
                  {/* Conteúdo omitido para brevidade */}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}