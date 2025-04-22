import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Building2,
  PlusCircle,
  LogIn,
  Loader2,
} from "lucide-react";

// Esquema de validação para criação de clínica
const clinicFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome da clínica precisa ter pelo menos 3 caracteres.",
  }),
  address: z.string().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
});

// Esquema de validação para código de convite
const inviteCodeSchema = z.object({
  code: z.string().min(6, {
    message: "O código de convite precisa ter pelo menos 6 caracteres.",
  }),
});

type ClinicFormValues = z.infer<typeof clinicFormSchema>;
type InviteCodeFormValues = z.infer<typeof inviteCodeSchema>;

export default function OnboardingPage() {
  const { user, clinics } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("create");

  const { data: invitations = [], isLoading: isLoadingInvitations } = useQuery({
    queryKey: ["/api/invitations/user"],
    enabled: !!user,
  });

  const clinicForm = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      openingHours: "",
    },
  });

  const inviteCodeForm = useForm<InviteCodeFormValues>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Mutação para criar clínica
  const createClinicMutation = useMutation({
    mutationFn: async (data: ClinicFormValues) => {
      const res = await apiRequest("POST", "/api/clinics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Clínica criada com sucesso!",
        description: "Sua clínica foi criada e você agora é o proprietário.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar clínica",
        description: error.message || "Houve um erro ao criar a clínica. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutação para usar código de convite
  const useInviteCodeMutation = useMutation({
    mutationFn: async (data: InviteCodeFormValues) => {
      const res = await apiRequest("POST", "/api/invitations/accept", { token: data.code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Convite aceito com sucesso!",
        description: "Você agora tem acesso à clínica.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Código de convite inválido",
        description: error.message || "O código de convite é inválido ou expirou.",
        variant: "destructive",
      });
    },
  });

  // Mutação para aceitar convite
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const res = await apiRequest("POST", `/api/invitations/${invitationId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invitations/user"] });
      toast({
        title: "Convite aceito com sucesso!",
        description: "Você agora tem acesso à clínica.",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aceitar convite",
        description: error.message || "Houve um erro ao aceitar o convite. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Se o usuário já tem uma clínica, redireciona para o dashboard
  useEffect(() => {
    if (user && clinics.length > 0) {
      navigate("/dashboard");
    }
  }, [user, clinics, navigate]);

  // Função para criar clínica
  const onCreateClinic = async (values: ClinicFormValues) => {
    await createClinicMutation.mutateAsync(values);
  };

  // Função para usar código de convite
  const onUseInviteCode = async (values: InviteCodeFormValues) => {
    await useInviteCodeMutation.mutateAsync(values);
  };

  // Função para aceitar convite
  const onAcceptInvitation = async (invitationId: number) => {
    await acceptInvitationMutation.mutateAsync(invitationId);
  };

  // Se não houver usuário logado, redireciona para login
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Bem-vindo(a) ao Gardenia, {user.name}!</h1>
        <p className="text-center text-gray-600 mb-10">
          Para começar a usar o sistema, escolha uma das opções abaixo:
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="create">Criar Clínica</TabsTrigger>
            <TabsTrigger value="invite" disabled={invitations.length === 0}>
              Convites ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="code">Código de Acesso</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Criar Nova Clínica
                </CardTitle>
                <CardDescription>
                  Crie sua própria clínica para começar a gerenciar seus pacientes e agendamentos.
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
                          <FormLabel>Nome da Clínica</FormLabel>
                          <FormControl>
                            <Input placeholder="Clínica Estética Exemplar" {...field} />
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
                          <FormLabel>Endereço (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua Exemplo, 123 - Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clinicForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={clinicForm.control}
                      name="openingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Funcionamento (opcional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Segunda a Sexta, 8h às 18h" {...field} />
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
                      {createClinicMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Criar Clínica
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite">
            <Card>
              <CardHeader>
                <CardTitle>Convites Pendentes</CardTitle>
                <CardDescription>
                  Você recebeu convites para juntar-se às seguintes clínicas:
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingInvitations ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Você não tem convites pendentes.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map((invitation: any) => (
                      <Card key={invitation.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{invitation.clinicName}</h3>
                              <p className="text-sm text-gray-500">
                                Função: {invitation.role}
                              </p>
                              <p className="text-sm text-gray-500">
                                Convidado por: {invitation.inviterName}
                              </p>
                            </div>
                            <Button
                              onClick={() => onAcceptInvitation(invitation.id)}
                              disabled={acceptInvitationMutation.isPending}
                              size="sm"
                            >
                              {acceptInvitationMutation.isPending && 
                                acceptInvitationMutation.variables === invitation.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Aceitar"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LogIn className="mr-2 h-5 w-5" />
                  Usar Código de Acesso
                </CardTitle>
                <CardDescription>
                  Insira um código de acesso que você recebeu para juntar-se a uma clínica existente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...inviteCodeForm}>
                  <form onSubmit={inviteCodeForm.handleSubmit(onUseInviteCode)} className="space-y-4">
                    <FormField
                      control={inviteCodeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Acesso</FormLabel>
                          <FormControl>
                            <Input placeholder="Insira o código de acesso" {...field} />
                          </FormControl>
                          <FormDescription>
                            O código deve ter sido fornecido pelo administrador da clínica.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={useInviteCodeMutation.isPending}
                    >
                      {useInviteCodeMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Acessar Clínica
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}