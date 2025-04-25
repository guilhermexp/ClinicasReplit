import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { usePermissionsContext2 } from "@/hooks/use-permissions-context";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  Loader2,
  Bell,
  BarChart as BarChartIcon,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PerformanceHeatmapSimplified } from "@/components/dashboard/performance-heatmap-simplified";
import { Progress } from "@/components/ui/progress";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link, useLocation } from "wouter";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";

// Interface para dados de receita
interface RevenueData {
  name: string;
  valor: number;
}

// Interface para estatísticas do dashboard
interface DashboardStats {
  clientCount: number;
  todayAppointmentCount: number;
  completedProceduresCount: number;
  monthlyRevenue: number;
}

// Interface para métricas avançadas
interface AdvancedMetrics {
  agendamentos: {
    total: number;
    mesAtual: number;
    mesAnterior: number;
    crescimento: number;
    taxaCancelamento: number;
    horarioMaisPopular: number;
    taxaOcupacao: number;
  };
  clientes: {
    total: number;
    novosNoMes: number;
    crescimentoNovosClientes: number;
  };
  financeiro: {
    receitaMesAtual: number;
    receitaMesAnterior: number;
    crescimentoReceita: number;
    ticketMedio: number;
  };
  equipe: {
    totalProfissionais: number;
    profissionalMaisOcupado: number;
    atendimentosPorProfissional: Record<number, number>;
  };
}

// Interface para análise de desempenho de serviços
interface ServicePerformance {
  id: number;
  name: string;
  price: number;
  duration: number;
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  totalRevenue: number;
  completionRate: number;
  cancellationRate: number;
  trend: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
}

// Tipo de status de agendamento
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

// Interface para agendamentos
interface Appointment {
  id: number;
  time: string;
  client: string;
  service: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  clientId: number;
  professionalId: number;
  serviceId: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para clientes recentes
interface RecentClient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string | null;
}

// Interface para lembretes
interface Reminder {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

// Interface para o componente StatCard
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  color: string;
  trend?: number;
  trendLabel?: string;
  hideArrow?: boolean;
}

// Componente para o cartão de estatísticas
const StatCard = ({ icon, title, value, desc, color, trend, trendLabel, hideArrow = false }: StatCardProps) => {
  const isPositive = trend ? trend > 0 : false;
  const isNeutral = trend === 0;
  
  return (
    <Card variant="glass" className="overflow-hidden border-0 hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle gradient={true} className="text-lg font-medium">{title}</CardTitle>
          <div className={`p-3 rounded-full shadow-md ${color} backdrop-blur-sm`}>
            {icon}
          </div>
        </div>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
      {typeof trend !== 'undefined' && (
        <CardFooter>
          <div className="flex items-center space-x-1 text-sm">
            {!hideArrow && (
              <>
                {isPositive && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {isNeutral && <span className="h-4 w-4" />}
                {!isPositive && !isNeutral && <TrendingDown className="h-4 w-4 text-red-500" />}
              </>
            )}
            <span className={`font-medium ${
              isPositive ? "text-emerald-500" : 
              isNeutral ? "text-gray-500" : 
              "text-red-500"
            }`}>
              {trend > 0 && "+"}
              {trend !== 0 ? `${trend.toFixed(1)}%` : "0%"}
            </span>
            {trendLabel && <span className="text-gray-500 text-xs">{trendLabel}</span>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// Status dos agendamentos
const appointmentStatusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-indigo-100 text-indigo-800",
  cancelled: "bg-red-100 text-red-800",
  no_show: "bg-gray-100 text-gray-800"
};

// Status para exibição
const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu"
};

// Prioridades dos lembretes
const reminderPriorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800"
};

const reminderPriorityLabels: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

// Formatar data para exibição
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Não disponível";
  const date = new Date(dateString);
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

// Formatar valor monetário
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function Dashboard() {
  const { user, selectedClinic } = useAuth();
  const { hasPermission } = usePermissionsContext2();
  const [location, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Consultas para obter dados da dashboard
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "stats"],
    enabled: !!selectedClinic,
  });
  
  const { data: todayAppointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "appointments", "today"],
    enabled: !!selectedClinic && hasPermission("appointments", "read"),
  });
  
  const { data: selectedDateAppointments = [], isLoading: isLoadingSelectedDate } = useQuery<Appointment[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "appointments", "date", selectedDate ? selectedDate.toISOString().split('T')[0] : null],
    enabled: !!selectedClinic && !!selectedDate && hasPermission("appointments", "read"),
  });
  
  const { data: recentClients = [], isLoading: isLoadingClients } = useQuery<RecentClient[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "clients", "recent"],
    enabled: !!selectedClinic && hasPermission("clients", "read"),
  });
  
  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery<RevenueData[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "revenue", "services"],
    enabled: !!selectedClinic && hasPermission("financial", "read"),
  });

  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery<Reminder[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "reminders"],
    enabled: !!selectedClinic,
  });
  
  // Consultas para métricas avançadas
  const { data: advancedMetrics, isLoading: isLoadingAdvancedMetrics } = useQuery<AdvancedMetrics>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "advanced-metrics"],
    enabled: !!selectedClinic,
  });
  
  // Consulta para análise de desempenho dos serviços
  const { data: servicePerformance = [], isLoading: isLoadingServicePerformance } = useQuery<ServicePerformance[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "service-performance"],
    enabled: !!selectedClinic && hasPermission("services", "read"),
  });
  
  // Obter dias com agendamentos para o calendário
  const { data: appointmentDays = [], isLoading: isLoadingAppointmentDays } = useQuery<string[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "appointments", "days", 
      format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      format(endOfMonth(new Date()), 'yyyy-MM-dd')
    ],
    enabled: !!selectedClinic && hasPermission("appointments", "read"),
  });
  
  // Loading state
  if (!selectedClinic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl mb-2">Selecione uma clínica para visualizar o dashboard</h2>
          <p className="text-gray-500">Escolha uma clínica no seletor acima para continuar</p>
        </div>
      </div>
    );
  }
  
  // Verificar se os dados das estatísticas foram carregados
  const isLoading = isLoadingStats || isLoadingAppointments || isLoadingClients || isLoadingRevenue || isLoadingReminders || isLoadingAdvancedMetrics || isLoadingServicePerformance;
  const hasNoStats = !dashboardStats;
  
  if (isLoading || hasNoStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Carregando dashboard...</p>
      </div>
    );
  }
  
  // Função para verificar se uma data tem agendamentos
  const hasDayAppointment = (date: Date) => {
    return appointmentDays.some(dayStr => {
      if (typeof dayStr !== 'string') return false;
      try {
        const day = parseISO(dayStr);
        return isSameDay(day, date);
      } catch (error) {
        console.error("Erro ao analisar data:", dayStr, error);
        return false;
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>
      
      {/* Welcome Card */}
      <Card variant="glass" className="mb-6 border-0 overflow-hidden shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle gradient={true} className="text-2xl">Bem-vindo{user?.name ? `, ${user.name}` : ''}!</CardTitle>
          <CardDescription>
            {selectedClinic 
              ? `Você está gerenciando a clínica ${selectedClinic.name}.` 
              : 'Selecione uma clínica para começar a gerenciar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-4 rounded-xl backdrop-blur-sm flex items-start gap-4 border border-primary/20">
            <div className="p-3 bg-primary/20 rounded-full text-primary shadow-md">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium gradient-text">Desempenho da clínica</h3>
              <p className="text-sm text-foreground/80 mt-1">
                {dashboardStats && `Você tem ${dashboardStats.todayAppointmentCount} agendamentos para hoje.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {hasPermission("clients", "read") && dashboardStats && typeof dashboardStats.clientCount !== 'undefined' && (
          <StatCard 
            icon={<Users className="h-5 w-5 text-blue-600" />}
            title="Clientes"
            value={String(dashboardStats.clientCount || 0)}
            desc="Total de clientes"
            color="bg-blue-100"
            trend={5.2}
            trendLabel="vs. mês anterior"
          />
        )}
        
        {hasPermission("appointments", "read") && dashboardStats && typeof dashboardStats.todayAppointmentCount !== 'undefined' && (
          <StatCard 
            icon={<Calendar className="h-5 w-5 text-purple-600" />}
            title="Agendamentos"
            value={String(dashboardStats.todayAppointmentCount || 0)}
            desc="Agendamentos hoje"
            color="bg-purple-100"
            trend={dashboardStats.todayAppointmentCount > 3 ? 8.1 : -2.3}
            trendLabel="vs. média diária"
          />
        )}
        
        {hasPermission("financial", "read") && dashboardStats && typeof dashboardStats.monthlyRevenue !== 'undefined' && (
          <StatCard 
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            title="Receita"
            value={formatCurrency(dashboardStats.monthlyRevenue || 0)}
            desc="Mês atual"
            color="bg-green-100"
            trend={7.4}
            trendLabel="vs. mês anterior"
          />
        )}
        
        {dashboardStats && typeof dashboardStats.completedProceduresCount !== 'undefined' && (
          <StatCard 
            icon={<CheckSquare className="h-5 w-5 text-amber-600" />}
            title="Procedimentos"
            value={String(dashboardStats.completedProceduresCount || 0)}
            desc="Realizados no mês"
            color="bg-amber-100"
            trend={3.2}
            trendLabel="vs. mês anterior"
          />
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Calendário */}
        <div className="lg:col-span-1">
          <Card variant="glass" className="h-full border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle gradient={true} className="flex items-center text-lg">
                <CalendarIcon className="h-5 w-5 mr-2" /> Calendário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                modifiers={{
                  hasAppointment: (date) => hasDayAppointment(date),
                }}
                modifiersClassNames={{
                  hasAppointment: "bg-primary/15 text-primary font-bold",
                }}
              />
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  setLocation("/appointments");
                }}
              >
                Ver todos os agendamentos
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Agendamentos do dia */}
        {hasPermission("appointments", "read") && (
          <div className="lg:col-span-2">
            <Card variant="glass" className="h-full border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" /> 
                  {selectedDate && isSameDay(selectedDate, new Date()) 
                    ? "Agendamentos de Hoje" 
                    : `Agendamentos de ${format(selectedDate || new Date(), "dd 'de' MMMM", { locale: ptBR })}`}
                </CardTitle>
                <CardDescription>
                  {selectedDateAppointments.length > 0 
                    ? `${selectedDateAppointments.length} agendamentos`
                    : `Nenhum agendamento para ${format(selectedDate || new Date(), "dd/MM", { locale: ptBR })}`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {selectedDateAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateAppointments.map((appointment) => (
                      <div 
                        key={appointment.id}
                        className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-full min-h-[40px] rounded-full ${getAppointmentStatusColor(appointment.status)}`}></div>
                          <div>
                            <p className="font-medium">{appointment.client}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {appointment.startTime && appointment.endTime ? (
                                <>
                                  {format(parseISO(appointment.startTime), "HH:mm")} - {format(parseISO(appointment.endTime), "HH:mm")}
                                </>
                              ) : (
                                "Horário não disponível"
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Badge className={`${appointmentStatusColors[appointment.status]} shadow-sm`}>
                            {appointmentStatusLabels[appointment.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
                    <Button
                      variant="link"
                      className="mt-2 text-primary"
                      onClick={() => setLocation("/appointments")}
                    >
                      Criar novo agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
              {selectedDateAppointments.length > 0 && (
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-primary/20 hover:bg-primary/10"
                    onClick={() => setLocation("/appointments")}
                  >
                    Gerenciar agendamentos <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
        
        {/* Gráfico de receita por serviço */}
        {hasPermission("financial", "read") && (
          <div className="md:col-span-2 lg:col-span-2">
            <Card variant="glass" className="h-full border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle gradient={true} className="flex items-center text-lg">
                  <BarChartIcon className="h-5 w-5 mr-2" /> Receita por serviço
                </CardTitle>
                <CardDescription>Análise de receita por tipo de serviço</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis 
                          tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip 
                          formatter={(value) => [`R$${value}`, 'Valor']}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="valor" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary-start))" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="hsl(var(--primary-end))" stopOpacity={0.8} />
                            </linearGradient>
                          </defs>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChartIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Sem dados disponíveis</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/20 hover:bg-primary/10"
                  onClick={() => setLocation("/financial")}
                >
                  Ver relatório financeiro completo
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Clientes recentes */}
        {hasPermission("clients", "read") && (
          <div className="md:col-span-2 lg:col-span-1">
            <Card variant="glass" className="h-full border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle gradient={true} className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2" /> Clientes Recentes
                </CardTitle>
                <CardDescription>Últimos atendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                {recentClients.length > 0 ? (
                  <div className="space-y-4">
                    {recentClients.slice(0, 5).map((client) => (
                      <div 
                        key={client.id} 
                        className="flex items-start space-x-3 p-3 rounded-xl bg-background/50 backdrop-blur-sm border border-border/30 hover:shadow-md transition-all"
                      >
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 shadow-md flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {client.name}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Última visita: {formatDate(client.lastVisit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">Sem clientes recentes</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/20 hover:bg-primary/10"
                  onClick={() => setLocation("/clients")}
                >
                  Ver todos os clientes
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Lembretes */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card variant="glass" className="h-full border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle gradient={true} className="flex items-center text-lg">
                <Bell className="h-5 w-5 mr-2" /> Lembretes e Tarefas
              </CardTitle>
              <CardDescription>Seus lembretes e tarefas pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              {reminders && reminders.length > 0 ? (
                <div className="space-y-3">
                  {reminders.slice(0, 5).map((reminder) => (
                    <div 
                      key={reminder.id}
                      className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full shadow-md ${
                          reminder.priority === 'high' 
                            ? 'bg-red-100/60 backdrop-blur-sm text-red-500' 
                            : reminder.priority === 'medium'
                              ? 'bg-yellow-100/60 backdrop-blur-sm text-yellow-600'
                              : 'bg-blue-100/60 backdrop-blur-sm text-blue-500'
                        }`}>
                          {reminder.priority === 'high' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{reminder.title}</p>
                          <p className="text-sm text-muted-foreground">{reminder.description}</p>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(reminder.dueDate)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Badge className={`shadow-sm ${
                          reminder.priority === 'high' 
                            ? 'bg-red-100/90 text-red-700 hover:bg-red-200/90' 
                            : reminder.priority === 'medium'
                              ? 'bg-yellow-100/90 text-yellow-700 hover:bg-yellow-200/90'
                              : 'bg-blue-100/90 text-blue-700 hover:bg-blue-200/90'
                        }`}>
                          {reminderPriorityLabels[reminder.priority]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhum lembrete pendente</p>
                  <Button
                    variant="link"
                    className="mt-2 text-primary"
                  >
                    Criar novo lembrete
                  </Button>
                </div>
              )}
            </CardContent>
            {reminders && reminders.length > 0 && (
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-primary/20 hover:bg-primary/10"
                >
                  Ver tudo
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-gradient-to-r from-[hsl(var(--primary-start))] to-[hsl(var(--primary-end))] shadow-md hover:shadow-lg transition-shadow"
                >
                  Adicionar lembrete <Plus className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Seção de Métricas Avançadas */}
      {advancedMetrics && advancedMetrics.agendamentos && advancedMetrics.clientes && advancedMetrics.financeiro && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 gradient-text">Métricas Avançadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Métricas de Agendamentos */}
            <Card variant="glass" className="border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="text-lg">Agendamentos</CardTitle>
                <CardDescription>Performance de agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Agendamentos no mês</span>
                      <span className="font-medium text-foreground">
                        {advancedMetrics?.agendamentos?.mesAtual || 0}
                      </span>
                    </div>
                    <Progress value={Math.min(((advancedMetrics?.agendamentos?.mesAtual || 0) / 100) * 100, 100)} className="h-2"/>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Taxa de ocupação</span>
                      <span className="font-medium text-foreground">
                        {(advancedMetrics?.agendamentos?.taxaOcupacao || 0).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={advancedMetrics?.agendamentos?.taxaOcupacao || 0} 
                      className={`h-2 bg-muted/30 ${(advancedMetrics?.agendamentos?.taxaOcupacao || 0) > 70 ? "[--progress-foreground:theme(colors.green.500)]" : "[--progress-foreground:theme(colors.amber.500)]"}`}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Taxa de cancelamento</span>
                      <span className="font-medium text-foreground">
                        {(advancedMetrics?.agendamentos?.taxaCancelamento || 0).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={advancedMetrics?.agendamentos?.taxaCancelamento || 0} 
                      className={`h-2 bg-muted/30 ${(advancedMetrics?.agendamentos?.taxaCancelamento || 0) < 10 ? "[--progress-foreground:theme(colors.green.500)]" : "[--progress-foreground:theme(colors.red.500)]"}`}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-border/30">
                    <div>
                      <p className="text-sm text-muted-foreground">Crescimento</p>
                      <div className="flex items-center space-x-1 text-sm">
                        {(advancedMetrics?.agendamentos?.crescimento || 0) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          (advancedMetrics?.agendamentos?.crescimento || 0) > 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {(advancedMetrics?.agendamentos?.crescimento || 0) > 0 && "+"}
                          {(advancedMetrics?.agendamentos?.crescimento || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Horário popular</p>
                      <p className="font-medium">{advancedMetrics?.agendamentos?.horarioMaisPopular || 0}h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Métricas de Clientes */}
            <Card variant="glass" className="border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="text-lg">Clientes</CardTitle>
                <CardDescription>Métricas de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Total de clientes</span>
                      <span className="font-medium text-foreground">{advancedMetrics?.clientes?.total || 0}</span>
                    </div>
                    <Progress value={Math.min(((advancedMetrics?.clientes?.total || 0) / 500) * 100, 100)} className="h-2 bg-muted/30"/>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Novos clientes no mês</span>
                      <span className="font-medium text-foreground">{advancedMetrics?.clientes?.novosNoMes || 0}</span>
                    </div>
                    <Progress 
                      value={Math.min(((advancedMetrics?.clientes?.novosNoMes || 0) / 50) * 100, 100)} 
                      className="h-2 bg-muted/30 [--progress-foreground:theme(colors.blue.500)]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-border/30 mt-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Crescimento de novos clientes</p>
                      <div className="flex items-center space-x-1 text-sm">
                        {(advancedMetrics?.clientes?.crescimentoNovosClientes || 0) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          (advancedMetrics?.clientes?.crescimentoNovosClientes || 0) > 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {(advancedMetrics?.clientes?.crescimentoNovosClientes || 0) > 0 && "+"}
                          {(advancedMetrics?.clientes?.crescimentoNovosClientes || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Métricas Financeiras */}
            <Card variant="glass" className="border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="text-lg">Financeiro</CardTitle>
                <CardDescription>Performance financeira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Receita no mês</span>
                      <span className="font-medium text-foreground">{formatCurrency(advancedMetrics?.financeiro?.receitaMesAtual || 0)}</span>
                    </div>
                    <Progress value={Math.min(((advancedMetrics?.financeiro?.receitaMesAtual || 0) / 100000) * 100, 100)} className="h-2 bg-muted/30"/>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Ticket médio</span>
                      <span className="font-medium text-foreground">{formatCurrency(advancedMetrics?.financeiro?.ticketMedio || 0)}</span>
                    </div>
                    <Progress 
                      value={Math.min(((advancedMetrics?.financeiro?.ticketMedio || 0) / 1000) * 100, 100)} 
                      className="h-2 bg-muted/30 [--progress-foreground:theme(colors.green.500)]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-t border-border/30 mt-8">
                    <div>
                      <p className="text-sm text-muted-foreground">Crescimento da receita</p>
                      <div className="flex items-center space-x-1 text-sm">
                        {(advancedMetrics?.financeiro?.crescimentoReceita || 0) > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          (advancedMetrics?.financeiro?.crescimentoReceita || 0) > 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {(advancedMetrics?.financeiro?.crescimentoReceita || 0) > 0 && "+"}
                          {(advancedMetrics?.financeiro?.crescimentoReceita || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Seção de Análise de Desempenho de Serviços */}
      {servicePerformance?.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 gradient-text">Desempenho de Serviços</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking de serviços por receita */}
            <Card variant="glass" className="border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="text-lg">Top Serviços</CardTitle>
                <CardDescription>Ranking por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {servicePerformance.slice(0, 5).map((service, index) => (
                    <div key={service.id} className="p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/30 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className="text-sm font-bold">{formatCurrency(service.totalRevenue)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex text-xs justify-between mb-1">
                          <span className="text-muted-foreground">Taxa de conclusão</span>
                          <span>{service.completionRate.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={service.completionRate} 
                          className="h-1.5 bg-muted/30 [--progress-foreground:hsl(var(--primary))]"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2">
                        <span className="text-muted-foreground">{service.completedAppointments} concluídos</span>
                        <span className="text-muted-foreground">Duração: {service.duration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Gráfico de tendência */}
            <Card variant="glass" className="border-0 overflow-hidden shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle gradient={true} className="text-lg">Tendência de Receita</CardTitle>
                <CardDescription>Evolução dos serviços mais rentáveis</CardDescription>
              </CardHeader>
              <CardContent>
                {servicePerformance?.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={servicePerformance[0].trend.map(item => ({
                          month: item.month.split('-')[1], // Exibir apenas o mês
                          receita: item.revenue,
                          atendimentos: item.count
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="month" />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          tickFormatter={(value) => `R$${value}`}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'receita' ? `R$${value}` : value,
                            name === 'receita' ? 'Receita' : 'Atendimentos'
                          ]}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar yAxisId="left" dataKey="receita" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary-start))" stopOpacity={0.8}/>
                              <stop offset="100%" stopColor="hsl(var(--primary-end))" stopOpacity={0.8}/>
                            </linearGradient>
                          </defs>
                        </Bar>
                        <Bar yAxisId="right" dataKey="atendimentos" fill="rgba(0, 0, 0, 0.2)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full border-primary/20 hover:bg-primary/10"
                  onClick={() => setLocation("/services")}
                >
                  Ver todos os serviços
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      
      {/* Seção de Análise de Desempenho - Heatmap */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4 gradient-text">Análise de Desempenho Anual</h2>
        <div className="grid grid-cols-1">
          <PerformanceHeatmapSimplified />
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para obter a cor do status do agendamento
function getAppointmentStatusColor(status: string): string {
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
      return 'bg-gray-500';
    default:
      return 'bg-gray-300';
  }
}
