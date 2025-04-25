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
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>
                    Gerencie as configurações de segurança da sua conta.
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