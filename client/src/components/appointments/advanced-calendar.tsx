import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Clock, Plus, RefreshCw } from 'lucide-react';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import { apiRequest } from '@/lib/queryClient';

// Definindo tipo mais flexível para contornar erros de tipo
type Appointment = any;
type Client = any;
type Professional = any;
type Service = any;

interface AdvancedCalendarProps {
  appointments: Appointment[];
  clients: Client[];
  professionals: Professional[];
  services: Service[];
  onAppointmentChange: (appointmentId: number, changes: any) => void;
  onAppointmentCreate: (appointment: any) => void;
  isLoading: boolean;
}

// Status dos agendamentos (cores e nomes)
const appointmentStatusColors: Record<string, string> = {
  scheduled: "#3788d8",
  confirmed: "#2ecc71",
  completed: "#673ab7",
  cancelled: "#e74c3c",
  no_show: "#f39c12"
};

const appointmentStatusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu"
};

export function AdvancedCalendar({ 
  appointments, 
  clients, 
  professionals, 
  services, 
  onAppointmentChange, 
  onAppointmentCreate,
  isLoading 
}: AdvancedCalendarProps) {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const calendarRef = useRef<any>(null);
  const { toast } = useToast();

  // Converter agendamentos para o formato esperado pelo FullCalendar
  const calendarEvents = appointments.map(appointment => {
    const client = clients.find(c => c.id === appointment.clientId);
    const professional = professionals.find(p => p.id === appointment.professionalId);
    const service = services.find(s => s.id === appointment.serviceId);
    
    return {
      id: appointment.id.toString(),
      title: client ? `${client.name}` : 'Cliente',
      start: appointment.startTime,
      end: appointment.endTime,
      backgroundColor: appointmentStatusColors[appointment.status] || '#999',
      borderColor: appointmentStatusColors[appointment.status] || '#999',
      textColor: '#fff',
      extendedProps: {
        ...appointment,
        clientName: client?.name || 'Cliente',
        professionalName: professional?.name || 'Profissional',
        serviceName: service?.name || 'Serviço',
        status: appointment.status
      }
    };
  });

  // Manipuladores de eventos
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.date);
    setIsCreateDialogOpen(true);
  };

  const handleEventClick = (info: any) => {
    const appointmentId = parseInt(info.event.id);
    const appointment = appointments.find(app => app.id === appointmentId);
    
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleEventDrop = async (info: any) => {
    try {
      setIsDragging(true);
      const appointmentId = parseInt(info.event.id);
      const startTime = info.event.start;
      const endTime = info.event.end;
      
      if (!endTime) {
        // Se não houver endTime, calcule-o como startTime + 1 hora
        const newEndTime = new Date(startTime);
        newEndTime.setHours(newEndTime.getHours() + 1);
        info.event.setEnd(newEndTime);
      }
      
      const changes = {
        startTime,
        endTime: info.event.end
      };
      
      await onAppointmentChange(appointmentId, changes);
      
      toast({
        title: "Agendamento atualizado",
        description: "O horário do agendamento foi alterado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      info.revert(); // Reverta a alteração se falhar
      
      toast({
        title: "Erro ao mover agendamento",
        description: "Não foi possível atualizar o horário do agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsDragging(false);
    }
  };

  const handleEventResize = async (info: any) => {
    try {
      setIsDragging(true);
      const appointmentId = parseInt(info.event.id);
      const changes = {
        startTime: info.event.start,
        endTime: info.event.end
      };
      
      await onAppointmentChange(appointmentId, changes);
      
      toast({
        title: "Duração atualizada",
        description: "A duração do agendamento foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar duração:", error);
      info.revert(); // Reverta a alteração se falhar
      
      toast({
        title: "Erro ao redimensionar",
        description: "Não foi possível atualizar a duração do agendamento.",
        variant: "destructive",
      });
    } finally {
      setIsDragging(false);
    }
  };

  const handleViewChange = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  const handleCreateAppointment = async (data: any) => {
    try {
      await onAppointmentCreate(data);
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      });
    }
  };

  // Renderize o calendário
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant={view === 'dayGridMonth' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleViewChange('dayGridMonth')}
            className={view === 'dayGridMonth' ? 'gradient-button' : 'border-primary/20 hover:bg-primary/10'}
          >
            Mês
          </Button>
          <Button 
            variant={view === 'timeGridWeek' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleViewChange('timeGridWeek')}
            className={view === 'timeGridWeek' ? 'gradient-button' : 'border-primary/20 hover:bg-primary/10'}
          >
            Semana
          </Button>
          <Button 
            variant={view === 'timeGridDay' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleViewChange('timeGridDay')}
            className={view === 'timeGridDay' ? 'gradient-button' : 'border-primary/20 hover:bg-primary/10'}
          >
            Dia
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (calendarRef.current) {
                const calendarApi = calendarRef.current.getApi();
                calendarApi.today();
              }
            }}
            className="border-primary/20 hover:bg-primary/10"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Hoje
          </Button>
          
          <Button 
            variant="gradient" 
            size="sm" 
            onClick={() => {
              setSelectedDate(new Date());
              setIsCreateDialogOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Agendamento
          </Button>
        </div>
      </div>
      
      <Card variant="glass" className="border-0 overflow-hidden shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-1 sm:p-2 md:p-4 h-[calc(100vh-12rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Carregando agendamentos...</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={view}
              headerToolbar={false}
              locale="pt-br"
              events={calendarEvents}
              selectable={true}
              editable={true}
              droppable={true}
              dayMaxEvents={true}
              allDaySlot={false}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              nowIndicator={true}
              slotDuration="00:15:00"
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a sábado
                startTime: '08:00',
                endTime: '18:00',
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                omitZeroMinute: false,
              }}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: false
              }}
              dayHeaderFormat={{
                weekday: 'short',
                day: 'numeric',
                omitCommas: true
              }}
              height="100%"
              themeSystem="standard"
            />
          )}
        </CardContent>
      </Card>
      
      {/* Dialog para criar agendamento */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-md border border-border/50 shadow-xl">
          <DialogHeader>
            <DialogTitle gradient>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Agendar para {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })} às {format(selectedDate, "HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            clients={clients}
            professionals={professionals}
            services={services}
            initialDate={selectedDate}
            onSubmit={handleCreateAppointment}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog para detalhes do agendamento */}
      {selectedAppointment && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-md border border-border/50 shadow-xl">
            <DialogHeader>
              <DialogTitle gradient={true}>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`bg-opacity-15 text-opacity-100 shadow-sm backdrop-blur-sm ${
                    appointmentStatusColors[selectedAppointment.status].replace('#', 'bg-[') + ']'
                  }`}
                >
                  {appointmentStatusLabels[selectedAppointment.status]}
                </Badge>
                <span className="text-sm">
                  ID: #{selectedAppointment.id}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Informações do Agendamento</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Cliente:</div>
                  <div>{clients.find(c => c.id === selectedAppointment.clientId)?.name || "Cliente não encontrado"}</div>
                  
                  <div className="text-muted-foreground">Profissional:</div>
                  <div>{professionals.find(p => p.id === selectedAppointment.professionalId)?.name || "Profissional não encontrado"}</div>
                  
                  <div className="text-muted-foreground">Serviço:</div>
                  <div>{services.find(s => s.id === selectedAppointment.serviceId)?.name || "Serviço não encontrado"}</div>
                  
                  <div className="text-muted-foreground">Data:</div>
                  <div>
                    {selectedAppointment.startTime && format(
                      parseISO(selectedAppointment.startTime.toString()),
                      "dd/MM/yyyy"
                    )}
                  </div>
                  
                  <div className="text-muted-foreground">Horário:</div>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    {selectedAppointment.startTime && format(
                      parseISO(selectedAppointment.startTime.toString()),
                      "HH:mm"
                    )} - 
                    {selectedAppointment.endTime && format(
                      parseISO(selectedAppointment.endTime.toString()),
                      "HH:mm"
                    )}
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium">Observações</h3>
                  <p className="text-sm text-muted-foreground bg-background/50 p-3 rounded-md">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  Fechar
                </Button>
                <Button
                  variant="gradient"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    // Adicionar lógica para editar
                  }}
                >
                  Editar Agendamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}