import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

// Status colors
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  noshow: "bg-amber-100 text-amber-800"
};

// Status display names
const statusNames: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  noshow: "Não compareceu"
};

export default function Appointments() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Query to get appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "appointments"],
    enabled: !!selectedClinic,
  });
  
  // Query to get clients
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic,
  });
  
  // Query to get professionals
  const { data: professionals = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "professionals"],
    enabled: !!selectedClinic,
  });
  
  // Query to get services
  const { data: services = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "services"],
    enabled: !!selectedClinic,
  });
  
  // Filter appointments by selected date and status
  const filteredAppointments = appointments.filter((appointment: any) => {
    // Verificar se startTime está definido antes de chamar parseISO
    if (!appointment.startTime) return false;
    
    const appointmentDate = parseISO(appointment.startTime);
    const dateMatches = selectedDate 
      ? appointmentDate.toDateString() === selectedDate.toDateString()
      : true;
    
    const statusMatches = statusFilter === "all" || appointment.status === statusFilter;
    
    return dateMatches && statusMatches;
  });
  
  // Group appointments by time blocks (morning, afternoon, evening)
  const groupedAppointments = {
    morning: filteredAppointments.filter((appointment: any) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime).getHours();
      return hour >= 6 && hour < 12;
    }),
    afternoon: filteredAppointments.filter((appointment: any) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime).getHours();
      return hour >= 12 && hour < 18;
    }),
    evening: filteredAppointments.filter((appointment: any) => {
      if (!appointment.startTime) return false;
      const hour = parseISO(appointment.startTime).getHours();
      return hour >= 18 || hour < 6;
    })
  };
  
  // Find client, professional, and service names
  const getClientName = (clientId: number) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };
  
  const getProfessionalName = (professionalId: number) => {
    const professional = professionals.find((p: any) => p.id === professionalId);
    return professional ? professional.name || "Profissional" : "Profissional não encontrado";
  };
  
  const getServiceName = (serviceId: number) => {
    const service = services.find((s: any) => s.id === serviceId);
    return service ? service.name : "Serviço não encontrado";
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Agenda</h1>
        
        {hasPermission("appointments", "create") && (
          <DialogTrigger asChild>
            <Button className="mt-3 sm:mt-0">
              <Plus className="mr-2 h-5 w-5" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
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
            />
            
            <div className="mt-4">
              <Label htmlFor="status-filter">Filtrar por status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="noshow">Não compareceu</SelectItem>
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
                          {groupedAppointments.morning.map((appointment: any) => (
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
                          {groupedAppointments.afternoon.map((appointment: any) => (
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
                          {groupedAppointments.evening.map((appointment: any) => (
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
      
      {/* New Appointment Dialog */}
      <Dialog>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento.
            </DialogDescription>
          </DialogHeader>
          <form>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Cliente
                </Label>
                <Select>
                  <SelectTrigger id="client" className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="service" className="text-right">
                  Serviço
                </Label>
                <Select>
                  <SelectTrigger id="service" className="col-span-3">
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service: any) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} - {service.duration} min - R$ {(service.price / 100).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="professional" className="text-right">
                  Profissional
                </Label>
                <Select>
                  <SelectTrigger id="professional" className="col-span-3">
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((professional: any) => (
                      <SelectItem key={professional.id} value={professional.id.toString()}>
                        {professional.name || `Profissional #${professional.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <div className="col-span-3 flex space-x-2">
                  <div className="flex-1">
                    <Input
                      id="date"
                      type="date"
                      defaultValue={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="time"
                      type="time"
                      defaultValue="09:00"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select defaultValue="scheduled">
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="noshow">Não compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre o agendamento"
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Agendar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({ 
  appointment, 
  clientName,
  professionalName,
  serviceName
}: {
  appointment: any; 
  clientName: string;
  professionalName: string;
  serviceName: string;
}) {
  // Verificar se startTime e endTime estão definidos antes de chamar parseISO
  if (!appointment.startTime || !appointment.endTime) {
    return <Card><CardContent className="p-4">Dados de agendamento inválidos</CardContent></Card>;
  }
  
  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);
  
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
          <Badge
            variant="outline"
            className={statusColors[appointment.status] || "bg-gray-100 text-gray-800"}
          >
            {statusNames[appointment.status] || appointment.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
