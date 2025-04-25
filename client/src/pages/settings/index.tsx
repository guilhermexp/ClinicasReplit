import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Clinic, UserDevice, ActivityLog, UserTwoFactorAuth } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  const [setupMode, setSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(null);
  const [confirmingAction, setConfirmingAction] = useState(false);
  
  // Buscar dados da clínica
  const { data: clinic, isLoading: isLoadingClinic } = useQuery<Clinic>({
    queryKey: ["/api/clinics", selectedClinic?.id],
    queryFn: async () => {
      if (!selectedClinic?.id) return null;
      const res = await apiRequest("GET", `/api/clinics/${selectedClinic.id}`);
      return res.json();
    },
    enabled: !!selectedClinic?.id
  });
  
  // Buscar configurações de autenticação de dois fatores
  const { data: twoFactorAuth, isLoading: isLoadingTwoFA } = useQuery<Partial<UserTwoFactorAuth>>({
    queryKey: ["/api/security/2fa"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/security/2fa");
        return res.json();
      } catch (error) {
        // Se a configuração não for encontrada, podemos assumir que o usuário ainda não configurou 2FA
        setAppAuth(false);
        setSmsAuth(false);
        setEmailAuth(false);
        return null;
      }
    }
  });
  
  // Efeito para atualizar os estados quando os dados de 2FA forem carregados
  useEffect(() => {
    if (twoFactorAuth) {
      setAppAuth(twoFactorAuth.appEnabled || false);
      setSmsAuth(twoFactorAuth.smsEnabled || false);
      setEmailAuth(twoFactorAuth.emailEnabled || false);
    }
  }, [twoFactorAuth]);
  
  // Buscar dispositivos conectados
  const { data: devices, isLoading: isLoadingDevices } = useQuery<UserDevice[]>({
    queryKey: ["/api/security/devices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/security/devices");
      return res.json();
    }
  });
  
  // Efeito para identificar o dispositivo atual
  useEffect(() => {
    if (devices && devices.length > 0) {
      const currentDevice = devices.find(d => d.isCurrent);
      if (currentDevice) {
        setCurrentDeviceId(currentDevice.id);
      }
    }
  }, [devices]);
  
  // Buscar logs de atividade
  const { data: activityLogs, isLoading: isLoadingLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/security/activity-logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/security/activity-logs");
      return res.json();
    }
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
  
  // Mutation para configurar autenticação de dois fatores
  const setupTwoFAMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/security/2fa/setup");
      return res.json();
    },
    onSuccess: (data) => {
      setSetupMode(true);
      setBackupCodes(data.backupCodes || []);
      
      // Gerar QR code para o app autenticador (em um cenário real, isso viria do backend)
      const secret = data.appSecret;
      const username = user?.email || "usuario";
      const appName = "ClinicaSistema";
      setQrCodeUrl(`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=otpauth://totp/${appName}:${username}?secret=${secret}&issuer=${appName}`);
      
      toast({
        title: "Configuração iniciada!",
        description: "Siga as instruções para configurar a autenticação de dois fatores.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao configurar 2FA: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para verificar o código do app autenticador
  const verifyAppCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/security/2fa/verify-app", { code });
      return res.json();
    },
    onSuccess: () => {
      setAppAuth(true);
      setSetupMode(false);
      setVerificationCode("");
      
      toast({
        title: "Autenticação ativada!",
        description: "A autenticação por aplicativo foi ativada com sucesso.",
      });
      
      // Atualizar os dados da configuração 2FA
      queryClient.invalidateQueries({ queryKey: ["/api/security/2fa"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao verificar código: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para atualizar configurações de 2FA
  const updateTwoFAMutation = useMutation({
    mutationFn: async (data: Partial<UserTwoFactorAuth>) => {
      const res = await apiRequest("PATCH", "/api/security/2fa", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações atualizadas!",
        description: "As configurações de autenticação foram atualizadas com sucesso.",
      });
      
      // Atualizar os dados da configuração 2FA
      queryClient.invalidateQueries({ queryKey: ["/api/security/2fa"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao atualizar configurações: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para revogar um dispositivo
  const revokeDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      const res = await apiRequest("DELETE", `/api/security/devices/${deviceId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispositivo revogado!",
        description: "O acesso do dispositivo foi revogado com sucesso.",
      });
      
      // Atualizar a lista de dispositivos
      queryClient.invalidateQueries({ queryKey: ["/api/security/devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao revogar dispositivo: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation para revogar todos os dispositivos
  const revokeAllDevicesMutation = useMutation({
    mutationFn: async (exceptCurrent: boolean) => {
      const res = await apiRequest("POST", "/api/security/devices/revoke-all", {
        exceptCurrentDevice: exceptCurrent,
        currentDeviceId: currentDeviceId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispositivos revogados!",
        description: "Todos os dispositivos foram revogados com sucesso.",
      });
      
      // Atualizar a lista de dispositivos
      queryClient.invalidateQueries({ queryKey: ["/api/security/devices"] });
      setConfirmingAction(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Falha ao revogar dispositivos: ${error.message}`,
        variant: "destructive",
      });
      setConfirmingAction(false);
    }
  });
  
  // Função para lidar com a alteração dos switches de 2FA
  const handleAppAuthChange = (checked: boolean) => {
    if (checked && twoFactorAuth && !twoFactorAuth.appEnabled) {
      // Se estiver ativando, iniciar processo de configuração
      setupTwoFAMutation.mutate();
    } else if (!checked && twoFactorAuth && twoFactorAuth.appEnabled) {
      // Se estiver desativando
      updateTwoFAMutation.mutate({ appEnabled: false });
    }
  };
  
  const handleSmsAuthChange = (checked: boolean) => {
    updateTwoFAMutation.mutate({ smsEnabled: checked });
  };
  
  const handleEmailAuthChange = (checked: boolean) => {
    updateTwoFAMutation.mutate({ emailEnabled: checked });
  };
  
  // Função para verificar o código do app
  const handleVerifyCode = () => {
    if (!verificationCode) {
      toast({
        title: "Erro!",
        description: "O código de verificação é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    verifyAppCodeMutation.mutate(verificationCode);
  };
  
  // Função para revogar um dispositivo
  const handleRevokeDevice = (deviceId: number) => {
    revokeDeviceMutation.mutate(deviceId);
  };
  
  // Função para revogar todos os dispositivos
  const handleRevokeAllDevices = (exceptCurrent: boolean) => {
    setConfirmingAction(true);
    revokeAllDevicesMutation.mutate(exceptCurrent);
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
                    {setupMode ? (
                      <div className="space-y-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-medium">Configure o Autenticador</h3>
                          <p className="text-sm text-muted-foreground">
                            Escaneie o código QR abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
                          </p>
                          
                          {qrCodeUrl && (
                            <div className="flex justify-center py-4">
                              <img src={qrCodeUrl} alt="QR Code para autenticação" className="h-48 w-48" />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="verification-code">Código de Verificação</Label>
                            <Input
                              id="verification-code"
                              placeholder="Digite o código de 6 dígitos"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="max-w-xs mx-auto"
                            />
                          </div>
                          
                          <Button onClick={handleVerifyCode} className="mt-4">
                            Verificar e Ativar
                          </Button>
                        </div>
                        
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Códigos de Backup</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Guarde estes códigos em um local seguro. Você pode usá-los para acessar sua conta caso perca o acesso ao seu dispositivo autenticador.
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {backupCodes.map((code, index) => (
                              <div key={index} className="bg-secondary p-2 rounded text-center font-mono text-sm">
                                {code}
                              </div>
                            ))}
                          </div>
                          <Button variant="outline" className="mt-4 w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Baixar Códigos de Backup
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                            onCheckedChange={handleAppAuthChange}
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
                            onCheckedChange={handleSmsAuthChange}
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
                            onCheckedChange={handleEmailAuthChange}
                          />
                        </div>
                      </>
                    )}
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
                    {isLoadingDevices ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : devices && devices.length > 0 ? (
                      devices.map((device) => (
                        <div key={device.id} className={`flex items-center justify-between p-2 border rounded-md ${device.id === currentDeviceId ? 'bg-muted/30' : ''}`}>
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                              {device.deviceType.toLowerCase().includes('mobile') ? (
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
                              ) : (
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
                              )}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <p className="text-sm font-medium">{device.deviceName}</p>
                                {device.id === currentDeviceId && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                    Dispositivo atual
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {device.lastIp || 'Localização desconhecida'} · {device.browser || 'Navegador desconhecido'} · {device.operatingSystem || 'Sistema desconhecido'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Último acesso: {device.lastActive ? format(new Date(device.lastActive), 'dd/MM/yyyy, HH:mm', { locale: ptBR }) : 'Desconhecido'}
                              </p>
                            </div>
                          </div>
                          {device.id !== currentDeviceId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRevokeDevice(device.id)}
                              disabled={revokeDeviceMutation.isPending}
                            >
                              <LogOut className="h-4 w-4" />
                              <span className="sr-only">Encerrar sessão</span>
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum dispositivo encontrado.</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRevokeAllDevices(true)}
                      disabled={confirmingAction || !devices || devices.length <= 1}
                    >
                      Encerrar Outras Sessões
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleRevokeAllDevices(false)}
                      disabled={confirmingAction || !devices || devices.length === 0}
                    >
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
                    {isLoadingLogs ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      </div>
                    ) : activityLogs && activityLogs.length > 0 ? (
                      <div className="space-y-4">
                        {activityLogs.map((log) => (
                          <div key={log.id} className="border-b pb-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm font-medium">{log.activity}</p>
                                <p className="text-xs text-muted-foreground">
                                  {log.ipAddress || 'Localização desconhecida'} · {log.userAgent ? (
                                    log.userAgent.includes('Chrome') ? 'Navegador Chrome' :
                                    log.userAgent.includes('Firefox') ? 'Navegador Firefox' :
                                    log.userAgent.includes('Safari') ? 'Navegador Safari' :
                                    log.userAgent.includes('Edge') ? 'Navegador Edge' :
                                    'Navegador desconhecido'
                                  ) : 'Dispositivo desconhecido'}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {log.createdAt ? format(new Date(log.createdAt), 'dd/MM/yyyy, HH:mm', { locale: ptBR }) : 'Data desconhecida'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum registro de atividade encontrado.</p>
                      </div>
                    )}
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