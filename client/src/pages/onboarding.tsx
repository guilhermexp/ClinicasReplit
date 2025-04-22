import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

import { Building, Mail, User, Clock, MapPin, Phone, Gift, CheckCircle2, TicketCheck } from "lucide-react";

// Esquemas de validação
const clinicFormSchema = z.object({
  name: z.string().min(3, "O nome da clínica deve ter pelo menos 3 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  openingHours: z.string().optional(),
});

const inviteCodeSchema = z.object({
  token: z.string().min(8, "Código de convite deve ter pelo menos 8 caracteres")
});

type ClinicFormValues = z.infer<typeof clinicFormSchema>;
type InviteCodeFormValues = z.infer<typeof inviteCodeSchema>;

export default function OnboardingPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create-clinic");

  // Form para criar uma nova clínica
  const clinicForm = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      openingHours: ""
    }
  });

  // Form para usar um código de convite
  const inviteCodeForm = useForm<InviteCodeFormValues>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      token: ""
    }
  });

  // Buscar convites pendentes para este usuário
  const { data: invitations = [] } = useQuery<any[]>({
    queryKey: ["/api/invitations/user"],
    enabled: !!user
  });

  // Mutation para criar uma nova clínica
  const createClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormValues) => {
      const res = await apiRequest("POST", "/api/clinics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      navigate("/dashboard");
      toast({
        title: "Clínica criada com sucesso!",
        description: "Você agora é o proprietário desta clínica."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar clínica",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para usar um código de convite
  const useInviteCodeMutation = useMutation({
    mutationFn: async (data: InviteCodeFormValues) => {
      const res = await apiRequest("POST", "/api/invitations/accept", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      navigate("/dashboard");
      toast({
        title: "Convite aceito com sucesso!",
        description: "Você agora faz parte desta clínica."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao usar código de convite",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para aceitar um convite específico
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest("POST", `/api/invitations/${invitationId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/user"] });
      navigate("/dashboard");
      toast({
        title: "Convite aceito com sucesso!",
        description: "Você agora faz parte desta clínica."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onCreateClinic = async (values: ClinicFormValues) => {
    await createClinicMutation.mutateAsync(values);
  };

  const onUseInviteCode = async (values: InviteCodeFormValues) => {
    await useInviteCodeMutation.mutateAsync(values);
  };

  const onAcceptInvitation = async (invitationId: number) => {
    await acceptInvitationMutation.mutateAsync(invitationId);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Acesso Não Autorizado</CardTitle>
            <CardDescription>Você precisa estar logado para acessar esta página.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/login")}>Ir para o Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna esquerda - Formulários */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight">
              Bem-vindo ao Sistema de Gestão de Clínicas
            </h1>
            <p className="text-muted-foreground mt-2">
              Para começar, você precisa criar uma clínica, aceitar um convite ou usar um código de acesso.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="create-clinic">Criar Clínica</TabsTrigger>
              <TabsTrigger value="invitations">Convites ({invitations?.length || 0})</TabsTrigger>
              <TabsTrigger value="invite-code">Código de Acesso</TabsTrigger>
            </TabsList>

            {/* Tab para criar uma nova clínica */}
            <TabsContent value="create-clinic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Criar Nova Clínica
                  </CardTitle>
                  <CardDescription>
                    Crie sua própria clínica e torne-se o administrador.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...clinicForm}>
                    <form onSubmit={clinicForm.handleSubmit(onCreateClinic)} className="space-y-4">
                      <FormField
                        control={clinicForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Clínica *</FormLabel>
                            <FormControl>
                              <Input placeholder="Clínica Estética Gardênia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clinicForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Av. Paulista, 1000 - São Paulo/SP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={clinicForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99999-9999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={clinicForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="contato@clinica.com.br" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={clinicForm.control}
                        name="openingHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Horário de Funcionamento</FormLabel>
                            <FormControl>
                              <Input placeholder="Segunda a Sexta: 9h às 18h" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createClinicMutation.isPending}
                      >
                        {createClinicMutation.isPending ? "Criando..." : "Criar Clínica"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab para listar convites pendentes */}
            <TabsContent value="invitations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Convites Pendentes
                  </CardTitle>
                  <CardDescription>
                    Aceite convites para se juntar a clínicas existentes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invitations && invitations.length > 0 ? (
                    <div className="space-y-4">
                      {invitations.map((invitation: any) => (
                        <Card key={invitation.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{invitation.clinicName}</h3>
                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {invitation.role}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Convidado por: {invitation.inviterName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Expira em: {new Date(invitation.expiresAt).toLocaleDateString()}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2 border-t pt-4">
                            <Button 
                              variant="outline" 
                              onClick={() => setActiveTab("invite-code")}
                            >
                              Recusar
                            </Button>
                            <Button 
                              onClick={() => onAcceptInvitation(invitation.id)}
                              disabled={acceptInvitationMutation.isPending}
                            >
                              {acceptInvitationMutation.isPending ? "Aceitando..." : "Aceitar Convite"}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">Sem convites pendentes</h3>
                      <p className="text-muted-foreground mt-1">
                        Você não tem convites pendentes para se juntar a clínicas.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab para usar código de convite */}
            <TabsContent value="invite-code">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TicketCheck className="h-5 w-5" />
                    Usar Código de Acesso
                  </CardTitle>
                  <CardDescription>
                    Entre com o código de convite que você recebeu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...inviteCodeForm}>
                    <form onSubmit={inviteCodeForm.handleSubmit(onUseInviteCode)} className="space-y-4">
                      <FormField
                        control={inviteCodeForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Convite</FormLabel>
                            <FormControl>
                              <Input placeholder="Insira o código que você recebeu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={useInviteCodeMutation.isPending}
                      >
                        {useInviteCodeMutation.isPending ? "Verificando..." : "Usar Código"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Coluna direita - Informações */}
        <div className="flex flex-col bg-primary text-primary-foreground rounded-lg p-8 hidden lg:flex">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Sistema Completo para Gestão de Clínicas</h2>
              <p className="text-primary-foreground/80 mb-6">
                Nossa plataforma foi desenvolvida para atender às necessidades específicas de clínicas estéticas,
                oferecendo um conjunto completo de ferramentas para gerenciar todos os aspectos do seu negócio.
              </p>
            </div>

            <Separator className="bg-primary-foreground/20" />

            <div className="space-y-6">
              <h3 className="text-xl font-medium">Principais Recursos:</h3>
              
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary-foreground/80" />
                  <div>
                    <h4 className="font-medium">Agendamento Inteligente</h4>
                    <p className="text-primary-foreground/80 text-sm">
                      Gerencie consultas, evite conflitos e envie lembretes automáticos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary-foreground/80" />
                  <div>
                    <h4 className="font-medium">Gestão de Pacientes</h4>
                    <p className="text-primary-foreground/80 text-sm">
                      Mantenha um histórico completo, com fotos, tratamentos e evolução.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary-foreground/80" />
                  <div>
                    <h4 className="font-medium">Controle Financeiro</h4>
                    <p className="text-primary-foreground/80 text-sm">
                      Acompanhe pagamentos, gere relatórios e tenha visão completa do faturamento.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary-foreground/80" />
                  <div>
                    <h4 className="font-medium">Controle de Acesso</h4>
                    <p className="text-primary-foreground/80 text-sm">
                      Defina permissões específicas para cada tipo de usuário da sua equipe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}