import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Client } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePermissions } from "@/hooks/use-permissions";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  Loader2, 
  Edit, 
  X, 
  Save, 
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  Badge,
  PlusCircle
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
}

// Criar schema extendido do Zod para validação do formulário de edição
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthdate: z.date().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export default function ClientDetails({ client, onClose }: ClientDetailsProps) {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Carregar dados do cliente para o formulário
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      birthdate: client.birthdate ? new Date(client.birthdate) : null,
    },
  });

  // Mutation para atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/clients/${client.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado",
        description: "Os dados do cliente foram atualizados com sucesso.",
      });
      
      // Limpar dados do cache para atualizar a lista
      queryClient.invalidateQueries({
        queryKey: ["/api/clinics", selectedClinic?.id, "clients"]
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro ao atualizar os dados do cliente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handler para submissão do formulário
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    updateClientMutation.mutate(data);
  };

  // Campo de informação formatado
  const InfoField = ({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ComponentType<{ className?: string }> }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-start gap-2 mb-4">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />}
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-base">{value}</p>
        </div>
      </div>
    );
  };

  // Data de criação formatada
  const createdDate = client.createdAt 
    ? format(new Date(client.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data desconhecida";

  // Data de nascimento formatada
  const birthDate = client.birthdate 
    ? format(new Date(client.birthdate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Não informada";

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Formatador de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };
  
  // Mapeamento de cores para status de agendamento
  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    completed: "bg-indigo-100 text-indigo-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-amber-100 text-amber-800"
  };
  
  // Tradução dos status
  const statusLabels: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não compareceu"
  };
  
  // Dados de exemplo para agendamentos (em desenvolvimento)
  const appointments: { date: string; startTime: string; }[] = [];
  
  // Dados de exemplo para histórico médico (em desenvolvimento)
  const medicalHistory: { date: string; }[] = [];
  
  // Ordenar agendamentos por data (mais recentes primeiro)
  const sortedAppointments = [...appointments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Ordenar histórico médico por data (mais recentes primeiro)
  const sortedMedicalHistory = [...medicalHistory].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Verifica se tem agendamentos futuros
  const hasFutureAppointments = appointments.some((app) => {
    const appDate = new Date(`${app.date}T${app.startTime}`);
    return appDate > new Date();
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-xl">Detalhes do Cliente</CardTitle>
            <CardDescription>Visualização e gestão dos dados do cliente</CardDescription>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && hasPermission("clients", "edit") && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar cliente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isEditing && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsEditing(false);
                  form.reset({
                    name: client.name,
                    email: client.email || "",
                    phone: client.phone || "",
                    address: client.address || "",
                    birthdate: client.birthdate ? new Date(client.birthdate) : null,
                  });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="default" 
                size="icon" 
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mb-2">
          <TabsTrigger value="overview">Resumo</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="medical">Prontuário</TabsTrigger>
        </TabsList>
        
        <Separator />
        
        <TabsContent value="overview" className="flex-1 p-0">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar e informações principais */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={client.name} />
                  <AvatarFallback className="text-xl bg-primary-100 text-primary-800">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 font-semibold text-lg text-center">{client.name}</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Cliente desde {createdDate}
                </p>
              </div>
              
              {/* Detalhes do cliente */}
              <div className="flex-1">
                {!isEditing ? (
                  <div className="space-y-1">
                    <InfoField label="Email" value={client.email} icon={Mail} />
                    <InfoField label="Telefone" value={client.phone} icon={Phone} />
                    <InfoField label="Endereço" value={client.address} icon={MapPin} />
                    <InfoField label="Data de Nascimento" value={birthDate} icon={Calendar} />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Nome do cliente */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Telefone */}
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Endereço */}
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Textarea
                                className="resize-none"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data de nascimento */}
                      <FormField
                        control={form.control}
                        name="birthdate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Nascimento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={`w-full pl-3 text-left font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd 'de' MMMM 'de' yyyy", {
                                        locale: ptBR,
                                      })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="appointments" className="flex-1 p-0">
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">Funcionalidade em desenvolvimento</h3>
              <p className="text-muted-foreground mb-4">
                A visualização do histórico de consultas estará disponível em breve.
              </p>
              <Button variant="outline" onClick={() => setActiveTab("overview")}>
                Voltar para informações
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="medical" className="flex-1 p-0">
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">Funcionalidade em desenvolvimento</h3>
              <p className="text-muted-foreground mb-4">
                A visualização do histórico completo do cliente estará disponível em breve.
              </p>
              <Button variant="outline" onClick={() => setActiveTab("overview")}>
                Voltar para informações
              </Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
