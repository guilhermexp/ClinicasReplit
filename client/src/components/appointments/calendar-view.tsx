import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Definindo tipo mais flexível para contornar erros de tipo
type Appointment = any;
import { format, parseISO, isSameDay, addMonths, subMonths, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarViewProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  isLoading: boolean;
}

export function CalendarView({ appointments, onDateSelect, selectedDate, isLoading }: CalendarViewProps) {
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<"day" | "month">("month");
  const [daysWithAppointments, setDaysWithAppointments] = useState<Date[]>([]);

  // Processa os dias que têm agendamentos para realçar no calendário
  useEffect(() => {
    if (appointments.length > 0) {
      const days = appointments.reduce((acc: Date[], appointment) => {
        if (appointment.startTime) {
          const date = startOfDay(parseISO(appointment.startTime.toString()));
          if (!acc.some(d => isSameDay(d, date))) {
            acc.push(date);
          }
        }
        return acc;
      }, []);
      setDaysWithAppointments(days);
    }
  }, [appointments]);

  // Navegar para o mês anterior
  const handlePreviousMonth = () => {
    setCalendarDate(prev => subMonths(prev, 1));
  };

  // Navegar para o próximo mês
  const handleNextMonth = () => {
    setCalendarDate(prev => addMonths(prev, 1));
  };

  // Mudar visualização
  const toggleView = () => {
    setCalendarView(prev => prev === "month" ? "day" : "month");
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Calendário de Agendamentos</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
            >
              {calendarView === "month" ? "Visualização diária" : "Visualização mensal"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {format(calendarDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          className="w-full"
          modifiers={{
            hasBusy: (date) => 
              daysWithAppointments.some(d => isSameDay(d, date)),
          }}
          modifiersClassNames={{
            hasBusy: "font-bold bg-primary-100 text-primary-900 relative",
          }}
          locale={ptBR}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary-100"></div>
          <span className="text-xs text-gray-500">Dias com agendamentos</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateSelect(new Date())}
        >
          Hoje
        </Button>
      </CardFooter>
    </Card>
  );
}

// Componente para exibir a visualização diária
export function DailyView({ appointments, selectedDate, isLoading }: {
  appointments: Appointment[];
  selectedDate: Date;
  isLoading: boolean;
}) {
  // Filtra os agendamentos do dia selecionado
  const dailyAppointments = appointments.filter(app => 
    app.startTime && isSameDay(parseISO(app.startTime.toString()), selectedDate)
  );

  // Agrupa por períodos do dia
  const morningAppointments = dailyAppointments.filter(app => {
    if (!app.startTime) return false;
    const hour = parseISO(app.startTime.toString()).getHours();
    return hour >= 6 && hour < 12;
  });

  const afternoonAppointments = dailyAppointments.filter(app => {
    if (!app.startTime) return false;
    const hour = parseISO(app.startTime.toString()).getHours();
    return hour >= 12 && hour < 18;
  });

  const eveningAppointments = dailyAppointments.filter(app => {
    if (!app.startTime) return false;
    const hour = parseISO(app.startTime.toString()).getHours();
    return hour >= 18 || hour < 6;
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span>{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </CardTitle>
        <CardDescription>
          {dailyAppointments.length} agendamentos para hoje
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            {dailyAppointments.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Nenhum agendamento para esta data</p>
              </div>
            ) : (
              <>
                {morningAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-2">Manhã</h3>
                    <div className="space-y-2">
                      {morningAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
                {afternoonAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-2">Tarde</h3>
                    <div className="space-y-2">
                      {afternoonAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
                {eveningAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-500 mb-2">Noite</h3>
                    <div className="space-y-2">
                      {eveningAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Status dos agendamentos (cores e nomes)
const appointmentStatusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-amber-100 text-amber-800"
};

const appointmentStatusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu"
};

// Componente de cartão de agendamento
function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-1 self-stretch ${getStatusBarColor(appointment.status)}`}></div>
        <div>
          <p className="font-medium">Cliente #{appointment.clientId}</p>
          <p className="text-sm text-gray-500">Serviço #{appointment.serviceId}</p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {appointment.startTime && format(parseISO(appointment.startTime.toString()), "HH:mm")} - 
              {appointment.endTime && format(parseISO(appointment.endTime.toString()), "HH:mm")}
            </span>
          </div>
        </div>
      </div>
      <Badge className={appointmentStatusColors[appointment.status]}>
        {appointmentStatusLabels[appointment.status]}
      </Badge>
    </div>
  );
}

// Função auxiliar para obter a cor da barra de status
function getStatusBarColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500';
    case 'confirmed':
      return 'bg-green-500';
    case 'completed':
      return 'bg-indigo-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'no_show':
      return 'bg-amber-500';
    default:
      return 'bg-gray-300';
  }
}
