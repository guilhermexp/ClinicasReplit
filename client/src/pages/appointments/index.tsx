import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus,
  Calendar as CalendarIcon,
  List,
  ArrowRight
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { AppointmentStatus } from "@shared/schema";
import { AgendaHero } from "@/components/ui/agenda-hero";

// Definindo tipos mais flexíveis para contornar erros de tipo
type Appointment = any;
type Client = any;
type Professional = any;
type Service = any;
import { CalendarView, DailyView } from "@/components/appointments/calendar-view";
import { AppointmentForm } from "@/components/appointments/appointment-form";

// Dialog para criar/editar agendamentos
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

// Status dos agendamentos
const appointmentStatusColors: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: "bg-blue-100 text-blue-800",
  [AppointmentStatus.CONFIRMED]: "bg-green-100 text-green-800",
  [AppointmentStatus.COMPLETED]: "bg-purple-100 text-purple-800",
  [AppointmentStatus.CANCELLED]: "bg-red-100 text-red-800",
  [AppointmentStatus.NO_SHOW]: "bg-amber-100 text-amber-800"
};

// Status para exibição
const appointmentStatusLabels: Record<string, string> = {
  [AppointmentStatus.SCHEDULED]: "Agendado",
  [AppointmentStatus.CONFIRMED]: "Confirmado",
  [AppointmentStatus.COMPLETED]: "Concluído",
  [AppointmentStatus.CANCELLED]: "Cancelado",
  [AppointmentStatus.NO_SHOW]: "Não Compareceu"
};

export default function Appointments() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  
  // Query para obter agendamentos
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "appointments"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  });
  
  // Query para obter clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  }) as { data: Client[] };
  
  // Query para obter profissionais
  const { data: professionals = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "professionals"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  }) as { data: Professional[] };
  
  // Query para obter serviços
  const { data: services = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "services"],
    enabled: !!selectedClinic,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData || [],
  }) as { data: Service[] };
  
  // Obter detalhes de um agendamento por ID
  const selectedAppointment = selectedAppointmentId 
    ? appointments.find(a => a.id === selectedAppointmentId) 
    : null;

  // Mutation para criar um novo agendamento
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("POST", "/api/appointments", appointmentData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar agendamento");
      }
      return await response.json();
    },
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      // Invalidar cache para forçar recarregamento dos agendamentos
      queryClient.invalidateQueries({ 
        queryKey: ["/api/clinics", selectedClinic?.id, "appointments"] 
      });
      
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar um agendamento
  const updateAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await apiRequest("PUT", `/api/appointments/${appointmentData.id}`, appointmentData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar agendamento");
      }
      return await response.json();
    },
    onSuccess: () => {
      setSelectedAppointmentId(null);
      // Invalidar cache para forçar recarregamento dos agendamentos
      queryClient.invalidateQueries({ 
        queryKey: ["/api/clinics", selectedClinic?.id, "appointments"] 
      });
      
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar o status de um agendamento
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar status");
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
        description: "O status do agendamento foi atualizado",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para submissão do formulário
  const handleAppointmentSubmit = (data: any) => {
    if (data.id) {
      // Atualização de agendamento existente
      updateAppointmentMutation.mutate(data);
    } else {
      // Criação de novo agendamento
      createAppointmentMutation.mutate(data);
    }
  };

  // Handler para atualização de status
  const handleStatusUpdate = (id: number, newStatus: string) => {
    updateAppointmentStatusMutation.mutate({ id, status: newStatus });
  };

  // Encontrar detalhes do agendamento selecionado para o formulário (se houver)
  const getAppointmentFormValues = () => {
    if (!selectedAppointment) return undefined;
    
    const startTime = selectedAppointment.startTime 
      ? format(parseISO(selectedAppointment.startTime.toString()), "HH:mm") 
      : "09:00";
    
    const endTime = selectedAppointment.endTime 
      ? format(parseISO(selectedAppointment.endTime.toString()), "HH:mm") 
      : "10:00";
    
    const date = selectedAppointment.startTime
      ? parseISO(selectedAppointment.startTime.toString())
      : new Date();
    
    return {
      id: selectedAppointment.id,
      clientId: selectedAppointment.clientId,
      professionalId: selectedAppointment.professionalId,
      serviceId: selectedAppointment.serviceId,
      date,
      startTime,
      endTime,
      notes: selectedAppointment.notes || "",
      status: selectedAppointment.status
    };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Agendamentos</h1>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-secondary rounded-md p-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="h-8"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendário
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo agendamento
                </DialogDescription>
              </DialogHeader>
              <AppointmentForm
                clients={clients}
                professionals={professionals}
                services={services}
                initialDate={selectedDate}
                onSubmit={handleAppointmentSubmit}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createAppointmentMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <CalendarView
              appointments={appointments}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <DailyView
              appointments={appointments}
              selectedDate={selectedDate}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Data e Hora</th>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Profissional</th>
                  <th className="px-4 py-3 text-left font-medium">Serviço</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                      </div>
                      <p className="mt-2 text-gray-500">Carregando agendamentos...</p>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <CalendarIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Nenhum agendamento encontrado</p>
                      <Button
                        variant="link"
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="mt-2"
                      >
                        Criar novo agendamento
                      </Button>
                    </td>
                  </tr>
                ) : (
                  appointments.map(appointment => (
                    <tr key={appointment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {appointment.startTime && (
                          <>
                            <div className="font-medium">
                              {format(parseISO(appointment.startTime.toString()), "dd/MM/yyyy")}
                            </div>
                            <div className="text-gray-500">
                              {format(parseISO(appointment.startTime.toString()), "HH:mm")} - 
                              {appointment.endTime && format(parseISO(appointment.endTime.toString()), "HH:mm")}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {clients.find(c => c.id === appointment.clientId)?.name || "Cliente não encontrado"}
                      </td>
                      <td className="px-4 py-3">
                        {getClientDetails(appointment.professionalId, professionals, clients)}
                      </td>
                      <td className="px-4 py-3">
                        {services.find(s => s.id === appointment.serviceId)?.name || "Serviço não encontrado"}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-block px-2 py-1 rounded-full text-xs ${appointmentStatusColors[appointment.status]}`}>
                          {appointmentStatusLabels[appointment.status]}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAppointmentId(appointment.id)}
                          >
                            Editar
                          </Button>
                          <StatusDropdown
                            currentStatus={appointment.status}
                            onStatusChange={(newStatus) => handleStatusUpdate(appointment.id, newStatus)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dialog para editar agendamento */}
      {selectedAppointmentId && (
        <Dialog 
          open={!!selectedAppointmentId} 
          onOpenChange={(open) => !open && setSelectedAppointmentId(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>
                Atualize os dados do agendamento
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm
              clients={clients}
              professionals={professionals}
              services={services}
              initialValues={getAppointmentFormValues()}
              onSubmit={handleAppointmentSubmit}
              onCancel={() => setSelectedAppointmentId(null)}
              isLoading={updateAppointmentMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Componente para dropdown de status
function StatusDropdown({ 
  currentStatus, 
  onStatusChange 
}: { 
  currentStatus: string;
  onStatusChange: (status: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        Status
      </Button>
      
      {isOpen && (
        <div 
          className="absolute right-0 mt-1 w-40 bg-white shadow-lg rounded-md overflow-hidden z-10 border"
          onBlur={() => setIsOpen(false)}
        >
          {Object.entries(appointmentStatusLabels).map(([status, label]) => (
            <button
              key={status}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${status === currentStatus ? 'bg-gray-50 font-medium' : ''}`}
              onClick={() => {
                onStatusChange(status);
                setIsOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Função auxiliar para obter detalhes do profissional
function getClientDetails(
  professionalId: number,
  professionals: Professional[],
  clients: Client[]
): string {
  const professional = professionals.find(p => p.id === professionalId);
  
  if (!professional) return "Profissional não encontrado";
  
  const user = clients.find(c => c.id === professional.userId);
  return user?.name || "Profissional";
}
