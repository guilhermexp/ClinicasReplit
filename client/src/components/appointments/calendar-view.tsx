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
    <Card variant="glass" className="h-full border-0 overflow-hidden shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle gradient={true}>Calendário de Agendamentos</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 hover:bg-primary/10"
              onClick={toggleView}
            >
              {calendarView === "month" ? "Visualização diária" : "Visualização mensal"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-primary/20 hover:bg-primary/10"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-primary/20 hover:bg-primary/10"
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
            hasBusy: "font-bold bg-primary/15 text-primary relative backdrop-blur-sm",
          }}
          locale={ptBR}
          classNames={{
            day_selected: "bg-gradient-to-br from-[hsl(var(--primary-start))] to-[hsl(var(--primary-end))] text-primary-foreground",
            day_today: "border border-primary/30 bg-primary/5 text-accent-foreground",
            day_outside: "text-muted-foreground/50",
            day: "h-9 w-9 p-0 font-normal rounded-md aria-selected:opacity-100"
          }}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary/30 backdrop-blur-sm"></div>
          <span className="text-xs text-muted-foreground">Dias com agendamentos</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-primary/20 hover:bg-primary/10"
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
    <Card variant="glass" className="h-full border-0 overflow-hidden shadow-lg hover:shadow-xl transition-all">
      <CardHeader>
        <CardTitle gradient={true} className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <span>{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </CardTitle>
        <CardDescription>
          {dailyAppointments.length} agendamentos para {isSameDay(selectedDate, new Date()) ? 'hoje' : 'este dia'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {dailyAppointments.length === 0 ? (
              <div className="text-center py-10">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                >
                  Criar novo agendamento
                </Button>
              </div>
            ) : (
              <>
                {morningAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2 pl-1">
                      <span className="flex items-center">
                        <div className="w-1 h-4 bg-yellow-400/50 rounded-full mr-2"></div>
                        Manhã
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {morningAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
                {afternoonAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2 pl-1">
                      <span className="flex items-center">
                        <div className="w-1 h-4 bg-orange-400/50 rounded-full mr-2"></div>
                        Tarde
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {afternoonAppointments.map(appointment => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  </div>
                )}
                {eveningAppointments.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2 pl-1">
                      <span className="flex items-center">
                        <div className="w-1 h-4 bg-purple-400/50 rounded-full mr-2"></div>
                        Noite
                      </span>
                    </h3>
                    <div className="space-y-3">
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
  scheduled: "bg-blue-100/70 text-blue-700 border-blue-200/50 hover:bg-blue-200/70",
  confirmed: "bg-green-100/70 text-green-700 border-green-200/50 hover:bg-green-200/70",
  completed: "bg-indigo-100/70 text-indigo-700 border-indigo-200/50 hover:bg-indigo-200/70",
  cancelled: "bg-red-100/70 text-red-700 border-red-200/50 hover:bg-red-200/70",
  no_show: "bg-amber-100/70 text-amber-700 border-amber-200/50 hover:bg-amber-200/70"
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
    <div className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/30 hover:shadow-md transition-all">
      <div className="flex items-center space-x-3">
        <div className={`w-1 h-full min-h-[40px] rounded-full ${getStatusBarColor(appointment.status)}`}></div>
        <div>
          <p className="font-medium">Cliente #{appointment.clientId}</p>
          <p className="text-sm text-muted-foreground">Serviço #{appointment.serviceId}</p>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {appointment.startTime && format(parseISO(appointment.startTime.toString()), "HH:mm")} - 
              {appointment.endTime && format(parseISO(appointment.endTime.toString()), "HH:mm")}
            </span>
          </div>
        </div>
      </div>
      <Badge className={`shadow-sm backdrop-blur-sm ${appointmentStatusColors[appointment.status]}`}>
        {appointmentStatusLabels[appointment.status]}
      </Badge>
    </div>
  );
}

// Função auxiliar para obter a cor da barra de status
function getStatusBarColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-400 shadow-md';
    case 'confirmed':
      return 'bg-green-400 shadow-md';
    case 'completed':
      return 'bg-indigo-400 shadow-md';
    case 'cancelled':
      return 'bg-red-400 shadow-md';
    case 'no_show':
      return 'bg-amber-400 shadow-md';
    default:
      return 'bg-gray-300 shadow-md';
  }
}
