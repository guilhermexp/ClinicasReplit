import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link, useLocation } from "wouter";

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

// Tipo de status de agendamento
type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

// Interface para agendamentos
interface Appointment {
  id: number;
  time: string;
  client: string;
  service: string;
  status: AppointmentStatus;
}

// Interface para clientes recentes
interface RecentClient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string | null;
}

// Interface para o componente StatCard
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  color: string;
}

// Componente para o cartão de estatísticas
const StatCard = ({ icon, title, value, desc, color }: StatCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
      <CardDescription>{desc}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">{value}</p>
    </CardContent>
  </Card>
);

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
  const { hasPermission } = usePermissions();
  const [location, setLocation] = useLocation();
  
  // Consultas para obter dados da dashboard
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "stats"],
    enabled: !!selectedClinic,
  });
  
  const { data: todayAppointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "appointments", "today"],
    enabled: !!selectedClinic && hasPermission("appointments", "read"),
  });
  
  const { data: recentClients = [], isLoading: isLoadingClients } = useQuery<RecentClient[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "clients", "recent"],
    enabled: !!selectedClinic && hasPermission("clients", "read"),
  });
  
  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery<RevenueData[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "dashboard", "revenue", "services"],
    enabled: !!selectedClinic && hasPermission("financial", "read"),
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
  const isLoading = isLoadingStats || isLoadingAppointments || isLoadingClients || isLoadingRevenue;
  const hasNoStats = !dashboardStats;
  
  if (isLoading || hasNoStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>
      
      {/* Welcome Card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Bem-vindo{user?.name ? `, ${user.name}` : ''}!</CardTitle>
          <CardDescription>
            {selectedClinic 
              ? `Você está gerenciando a clínica ${selectedClinic.name}.` 
              : 'Selecione uma clínica para começar a gerenciar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-full text-primary-700">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-primary-900">Desempenho da clínica</h3>
              <p className="text-sm text-primary-700 mt-1">
                {dashboardStats && `Você tem ${dashboardStats.todayAppointmentCount} agendamentos para hoje.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {hasPermission("clients", "read") && dashboardStats && (
          <StatCard 
            icon={<Users className="h-5 w-5 text-blue-600" />}
            title="Clientes"
            value={dashboardStats.clientCount.toString()}
            desc="Total de clientes"
            color="bg-blue-100"
          />
        )}
        
        {hasPermission("appointments", "read") && dashboardStats && (
          <StatCard 
            icon={<Calendar className="h-5 w-5 text-purple-600" />}
            title="Agendamentos"
            value={dashboardStats.todayAppointmentCount.toString()}
            desc="Agendamentos hoje"
            color="bg-purple-100"
          />
        )}
        
        {hasPermission("financial", "read") && dashboardStats && (
          <StatCard 
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            title="Receita"
            value={formatCurrency(dashboardStats.monthlyRevenue)}
            desc="Mês atual"
            color="bg-green-100"
          />
        )}
        
        {dashboardStats && (
          <StatCard 
            icon={<CheckSquare className="h-5 w-5 text-amber-600" />}
            title="Procedimentos"
            value={dashboardStats.completedProceduresCount.toString()}
            desc="Realizados no mês"
            color="bg-amber-100"
          />
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Próximos Agendamentos */}
        {hasPermission("appointments", "read") && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8" 
                  onClick={() => setLocation('/appointments')}
                >
                  <Calendar className="mr-2 h-4 w-4" /> Ver agenda
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-10 w-10 mb-2 text-gray-400" />
                  <p>Não há agendamentos para hoje</p>
                  <p className="text-sm mt-1">Todos os agendamentos do dia aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map(appointment => (
                    <div key={appointment.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="p-2 bg-primary-100 rounded-full">
                        <Clock className="h-5 w-5 text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{appointment.client}</p>
                            <p className="text-sm text-gray-500">{appointment.service}</p>
                          </div>
                          <Badge className={appointmentStatusColors[appointment.status]}>
                            {appointmentStatusLabels[appointment.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{appointment.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setLocation('/appointments')}
              >
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Clientes Recentes */}
        {hasPermission("clients", "read") && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Clientes Recentes</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8" 
                  onClick={() => setLocation('/clients')}
                >
                  <Plus className="mr-2 h-4 w-4" /> Novo cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto h-10 w-10 mb-2 text-gray-400" />
                  <p>Nenhum cliente recente</p>
                  <p className="text-sm mt-1">Os clientes com visitas recentes aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClients.map(client => (
                    <div key={client.id} className="flex gap-3 items-center p-2 border rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{client.name}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" /> {client.phone}
                          </span>
                          <span className="flex items-center">
                            <CalendarIcon className="mr-1 h-3 w-3" /> {formatDate(client.lastVisit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setLocation('/clients')}
              >
                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      {/* Gráfico de receita por serviço */}
      {hasPermission("financial", "read") && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Receita por Serviço</CardTitle>
            <CardDescription>Faturamento do mês atual por tipo de serviço</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <DollarSign className="mx-auto h-10 w-10 mb-2 text-gray-400" />
                <p>Sem dados de receita disponíveis</p>
                <p className="text-sm mt-1">Os dados financeiros aparecerão aqui quando houver procedimentos concluídos</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                    <YAxis tick={{ fill: '#6B7280' }} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(Number(value)), 'Receita']}
                      labelStyle={{ color: '#111827' }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.375rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar dataKey="valor" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
