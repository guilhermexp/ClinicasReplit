import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CalendarClock, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  User,
  Clock3
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentStatus, Appointment, Client, Professional, Service } from "@shared/schema";

// Format the date display in a user-friendly way
const formatDateDisplay = (date: string | Date) => {
  const appointmentDate = typeof date === "string" ? parseISO(date) : date;
  
  if (isToday(appointmentDate)) {
    return "Hoje";
  } else if (isTomorrow(appointmentDate)) {
    return "Amanhã";
  } else {
    return format(appointmentDate, "EEE, dd 'de' MMMM", { locale: ptBR });
  }
};

// Format the time
const formatTime = (date: string | Date) => {
  const appointmentDate = typeof date === "string" ? parseISO(date) : date;
  return format(appointmentDate, "HH:mm");
};

// Status colors and display names
const statusColors: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: "bg-blue-100 text-blue-800",
  [AppointmentStatus.CONFIRMED]: "bg-green-100 text-green-800",
  [AppointmentStatus.COMPLETED]: "bg-purple-100 text-purple-800",
  [AppointmentStatus.CANCELLED]: "bg-red-100 text-red-800",
  [AppointmentStatus.NO_SHOW]: "bg-amber-100 text-amber-800"
};

// Função para obter a cor correspondente ao status (formato simplificado)
const getStatusColor = (status: string): string => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return "bg-blue-500";
    case AppointmentStatus.CONFIRMED:
      return "bg-green-500";
    case AppointmentStatus.COMPLETED:
      return "bg-purple-500";
    case AppointmentStatus.CANCELLED:
      return "bg-red-500";
    case AppointmentStatus.NO_SHOW:
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
};

// Status display names
const statusNames: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: "Agendado",
  [AppointmentStatus.CONFIRMED]: "Confirmado",
  [AppointmentStatus.COMPLETED]: "Concluído",
  [AppointmentStatus.CANCELLED]: "Cancelado",
  [AppointmentStatus.NO_SHOW]: "Não Compareceu"
};

export default function Appointments() {
  const { selectedClinic, user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Query to get appointments com cache otimizado
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "appointments"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query to get clients com cache otimizado
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query to get professionals com cache otimizado
  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "professionals"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query to get services com cache otimizado
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "services"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Filter appointments by selected date and status
  const filteredAppointments = appointments.filter((appointment: Appointment) => {
    // Verificar se startTime está definido antes de chamar parseISO
    if (!appointment.startTime) return false;
    
    const appointmentDate = parseISO(appointment.startTime.toString());
    const dateMatches = selectedDate 
      ? appointmentDate.toDateString() === selectedDate.toDateString()
      : true;
    
    const statusMatches = statusFilter === "all" || appointment.status === statusFilter;
    
    return dateMatches && statusMatches;
  });
  
  // Group appointments by time blocks (morning, afternoon, evening)
  const groupedAppointments = {
    morning: filteredAppointments.filter((appointment: Appointment) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime.toString()).getHours();
      return hour >= 6 && hour < 12;
    }),
    afternoon: filteredAppointments.filter((appointment: Appointment) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime.toString()).getHours();
      return hour >= 12 && hour < 18;
    }),
    evening: filteredAppointments.filter((appointment: Appointment) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime.toString()).getHours();
      return hour >= 18 || hour < 6;
    })
  };
  
  // Find client, professional, and service names
  const getClientName = (clientId: number) => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };
  
  const getProfessionalName = (professionalId: number) => {
    // Procura primeiro nos professores
    const professional = professionals.find((p: Professional) => p.id === professionalId);
    if (professional) {
      // Busca informações do usuário relacionado
      const user = clients.find((c: Client) => c.id === professional.userId);
      return user?.name || "Profissional";
    }
    return "Profissional não encontrado";
  };
  
  const getServiceName = (serviceId: number) => {
    const service = services.find((s: Service) => s.id === serviceId);
    return service ? service.name : "Serviço não encontrado";
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Agenda</h1>
        
        {hasPermission("appointments", "create") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-3 sm:mt-0">
                <Plus className="mr-2 h-5 w-5" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Criar um novo agendamento no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">Cliente</Label>
                  <div className="col-span-3">
                    <Select>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="professional" className="text-right">Profissional</Label>
                  <div className="col-span-3">
                    <Select>
                      <SelectTrigger id="professional">
                        <SelectValue placeholder="Selecione um profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((professional) => (
                          <SelectItem key={professional.id} value={professional.id.toString()}>
                            {getProfessionalName(professional.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service" className="text-right">Serviço</Label>
                  <div className="col-span-3">
                    <Select>
                      <SelectTrigger id="service">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Data</Label>
                  <div className="col-span-3">
                    <Input id="date" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-time" className="text-right">Hora início</Label>
                  <div className="col-span-3">
                    <Input id="start-time" type="time" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-time" className="text-right">Hora fim</Label>
                  <div className="col-span-3">
                    <Input id="end-time" type="time" />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">Observações</Label>
                  <div className="col-span-3">
                    <Textarea id="notes" placeholder="Adicione observações sobre o agendamento..." />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Agendar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              locale={ptBR}
              modifiers={{
                booked: appointments.map(app => 
                  app.startTime ? new Date(app.startTime) : new Date()
                )
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                }
              }}
              components={{
                DayContent: ({ date }) => {
                  // Contar quantos agendamentos existem neste dia
                  const appointmentsForDay = appointments.filter(app => {
                    if (!app.startTime) return false;
                    const appDate = new Date(app.startTime);
                    return appDate.toDateString() === date.toDateString();
                  });
                  
                  return (
                    <div className="relative flex h-9 w-9 items-center justify-center">
                      {date.getDate()}
                      {appointmentsForDay.length > 0 && (
                        <div className="absolute -bottom-1">
                          <div className="flex gap-0.5">
                            {appointmentsForDay.slice(0, 3).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-1 w-1 rounded-full ${
                                  getStatusColor(appointmentsForDay[i].status || AppointmentStatus.SCHEDULED)
                                }`}
                              />
                            ))}
                            {appointmentsForDay.length > 3 && (
                              <div className="h-1 w-1 rounded-full bg-gray-400" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              }}
            />
            
            <div className="mt-4">
              <Label htmlFor="status-filter">Filtrar por status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value={AppointmentStatus.SCHEDULED}>Agendado</SelectItem>
                  <SelectItem value={AppointmentStatus.CONFIRMED}>Confirmado</SelectItem>
                  <SelectItem value={AppointmentStatus.COMPLETED}>Concluído</SelectItem>
                  <SelectItem value={AppointmentStatus.CANCELLED}>Cancelado</SelectItem>
                  <SelectItem value={AppointmentStatus.NO_SHOW}>Não compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Legenda</h3>
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm">Agendado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm">Confirmado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-sm">Concluído</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm">Cancelado</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm">Não compareceu</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Appointments List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate ? (
                <>
                  Agendamentos para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </>
              ) : (
                "Todos os Agendamentos"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="mt-2">
              <TabsList>
                <TabsTrigger value="list">Lista</TabsTrigger>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="mt-4">
                {isLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex justify-between">
                            <div>
                              <Skeleton className="h-5 w-[180px]" />
                              <div className="flex mt-2">
                                <Skeleton className="h-4 w-4 mr-2" />
                                <Skeleton className="h-4 w-[120px]" />
                              </div>
                            </div>
                            <Skeleton className="h-6 w-[100px] rounded-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Sem agendamentos</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Não há agendamentos para o dia selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Morning */}
                    {groupedAppointments.morning.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Manhã (6h - 12h)
                        </h3>
                        <div className="space-y-3">
                          {groupedAppointments.morning.map((appointment: Appointment) => (
                            <AppointmentCard 
                              key={appointment.id}
                              appointment={appointment}
                              clientName={getClientName(appointment.clientId)}
                              professionalName={getProfessionalName(appointment.professionalId)}
                              serviceName={getServiceName(appointment.serviceId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Afternoon */}
                    {groupedAppointments.afternoon.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Tarde (12h - 18h)
                        </h3>
                        <div className="space-y-3">
                          {groupedAppointments.afternoon.map((appointment: Appointment) => (
                            <AppointmentCard 
                              key={appointment.id}
                              appointment={appointment}
                              clientName={getClientName(appointment.clientId)}
                              professionalName={getProfessionalName(appointment.professionalId)}
                              serviceName={getServiceName(appointment.serviceId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Evening */}
                    {groupedAppointments.evening.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Noite (18h - 6h)
                        </h3>
                        <div className="space-y-3">
                          {groupedAppointments.evening.map((appointment: Appointment) => (
                            <AppointmentCard 
                              key={appointment.id}
                              appointment={appointment}
                              clientName={getClientName(appointment.clientId)}
                              professionalName={getProfessionalName(appointment.professionalId)}
                              serviceName={getServiceName(appointment.serviceId)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-4">
                <div className="text-center py-8 text-gray-500">
                  <p>Visualização de linha do tempo em desenvolvimento.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  clientName,
  professionalName,
  serviceName
}: {
  appointment: Appointment; 
  clientName: string;
  professionalName: string;
  serviceName: string;
}) {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Verificar se startTime e endTime estão definidos
  if (!appointment.startTime || !appointment.endTime) {
    return <Card><CardContent className="p-4">Dados de agendamento inválidos</CardContent></Card>;
  }
  
  // Convertemos para Date para uso com formatTime
  const startTime = new Date(appointment.startTime);
  const endTime = new Date(appointment.endTime);
  
  // Mutation para atualizar o status do agendamento
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest("PATCH", `/api/appointments/${appointment.id}`, {
        status: newStatus
      });
      if (!response.ok) {
        throw new Error("Erro ao atualizar status do agendamento");
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidar cache para forçar recarregamento dos agendamentos
      queryClient.invalidateQueries({ 
        queryKey: ["/api/clinics", selectedClinic?.id, "appointments"] 
      });
      toast({
        title: "Status atualizado",
        description: "O status do agendamento foi atualizado com sucesso",
      });
      setIsUpdating(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: `Não foi possível atualizar o status: ${error.message}`,
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  });
  
  const handleStatusUpdate = (newStatus: string) => {
    setIsUpdating(true);
    updateStatusMutation.mutate(newStatus);
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{clientName}</h4>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              {formatTime(startTime)} - {formatTime(endTime)}
            </div>
            <div className="flex flex-wrap mt-2 gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                {serviceName}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {professionalName}
              </Badge>
            </div>
            {appointment.notes && (
              <p className="mt-2 text-xs text-gray-500 line-clamp-2">{appointment.notes}</p>
            )}
          </div>
          <div>
            {hasPermission("appointments", "update") ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <span className="flex items-center">
                        <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></span>
                        Atualizando...
                      </span>
                    ) : (
                      statusNames[appointment.status] || appointment.status
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mudar status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {appointment.status !== AppointmentStatus.SCHEDULED && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(AppointmentStatus.SCHEDULED)}>
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      Agendado
                    </DropdownMenuItem>
                  )}
                  {appointment.status !== AppointmentStatus.CONFIRMED && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(AppointmentStatus.CONFIRMED)}>
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      Confirmado
                    </DropdownMenuItem>
                  )}
                  {appointment.status !== AppointmentStatus.COMPLETED && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(AppointmentStatus.COMPLETED)}>
                      <div className="h-2 w-2 rounded-full bg-purple-500 mr-2"></div>
                      Concluído
                    </DropdownMenuItem>
                  )}
                  {appointment.status !== AppointmentStatus.CANCELLED && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(AppointmentStatus.CANCELLED)}>
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                      Cancelado
                    </DropdownMenuItem>
                  )}
                  {appointment.status !== AppointmentStatus.NO_SHOW && (
                    <DropdownMenuItem onClick={() => handleStatusUpdate(AppointmentStatus.NO_SHOW)}>
                      <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                      Não compareceu
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge
                variant="outline"
                className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
              >
                {statusNames[appointment.status] || appointment.status}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}