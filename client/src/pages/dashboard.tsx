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
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Interface para dados de receita
interface RevenueData {
  name: string;
  valor: number;
}

// Dados mockados para o gráfico
const revenueData: RevenueData[] = [
  { name: 'Botox', valor: 4500 },
  { name: 'Preenchimento', valor: 3200 },
  { name: 'Limpeza', valor: 2800 },
  { name: 'Massagem', valor: 1950 },
];

// Tipo de status de agendamento
type AppointmentStatus = 'confirmado' | 'pendente' | 'cancelado';

// Interface para agendamentos
interface Appointment {
  id: number;
  time: string;
  client: string;
  service: string;
  status: AppointmentStatus;
}

// Dados mockados para agendamentos
const todayAppointments: Appointment[] = [
  { id: 1, time: '09:00', client: 'Maria Silva', service: 'Limpeza de Pele', status: 'confirmado' },
  { id: 2, time: '10:30', client: 'Ana Costa', service: 'Botox', status: 'pendente' },
  { id: 3, time: '14:15', client: 'Carlos Mendes', service: 'Massagem', status: 'confirmado' },
  { id: 4, time: '16:00', client: 'Juliana Alves', service: 'Preenchimento', status: 'cancelado' },
];

// Interface para clientes recentes
interface RecentClient {
  id: number;
  name: string;
  phone: string;
  lastVisit: string;
}

// Dados mockados para clientes recentes
const recentClients: RecentClient[] = [
  { id: 1, name: 'Fernanda Lima', phone: '(11) 98765-4321', lastVisit: '2025-04-20T14:30:00' },
  { id: 2, name: 'Roberto Santos', phone: '(11) 91234-5678', lastVisit: '2025-04-19T11:00:00' },
  { id: 3, name: 'Carolina Martins', phone: '(11) 99876-5432', lastVisit: '2025-04-18T16:45:00' },
];

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
  confirmado: "bg-green-100 text-green-800",
  pendente: "bg-yellow-100 text-yellow-800",
  cancelado: "bg-red-100 text-red-800"
};

// Formatar data para exibição
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "dd/MM/yyyy", { locale: ptBR });
};

export default function Dashboard() {
  const { user, selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Consulta para obter dados da clínica
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic && hasPermission("clients", "read"),
  });
  
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
                O faturamento está 15% maior que o mês anterior. Você tem 8 agendamentos para hoje.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {hasPermission("clients", "read") && (
          <StatCard 
            icon={<Users className="h-5 w-5 text-blue-600" />}
            title="Clientes"
            value="42"
            desc="Total de clientes"
            color="bg-blue-100"
          />
        )}
        
        {hasPermission("appointments", "read") && (
          <StatCard 
            icon={<Calendar className="h-5 w-5 text-purple-600" />}
            title="Agendamentos"
            value="8"
            desc="Agendamentos hoje"
            color="bg-purple-100"
          />
        )}
        
        {hasPermission("financial", "read") && (
          <StatCard 
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            title="Receita"
            value="R$ 12.450"
            desc="Mês atual"
            color="bg-green-100"
          />
        )}
        
        <StatCard 
          icon={<CheckSquare className="h-5 w-5 text-amber-600" />}
          title="Procedimentos"
          value="126"
          desc="Realizados no mês"
          color="bg-amber-100"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Próximos Agendamentos */}
        {hasPermission("appointments", "read") && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Agendamentos de Hoje</CardTitle>
                <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/appointments'}>
                  <Calendar className="mr-2 h-4 w-4" /> Ver agenda
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{appointment.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/appointments'}>
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
                <Button variant="outline" size="sm" className="h-8" onClick={() => window.location.href = '/clients'}>
                  <Plus className="mr-2 h-4 w-4" /> Novo cliente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => window.location.href = '/clients'}>
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
                    formatter={(value) => [`R$ ${value}`, 'Receita']}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
