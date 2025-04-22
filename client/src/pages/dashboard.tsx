import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";

export default function Dashboard() {
  const { user, selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Welcome Card */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Bem-vindo{user?.name ? `, ${user.name}` : ''}!</CardTitle>
            <CardDescription>
              {selectedClinic 
                ? `Você está gerenciando a clínica ${selectedClinic.name}.` 
                : 'Selecione uma clínica para começar a gerenciar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este é o painel de controle do sistema Gardenia para clínicas de estética.
              Utilize o menu lateral para navegar entre as funcionalidades disponíveis.
            </p>
          </CardContent>
        </Card>
        
        {/* Clients Card */}
        {hasPermission("clients", "read") && (
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Total de clientes cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center pt-2">
              <p className="text-4xl font-bold text-primary-500">42</p>
            </CardContent>
          </Card>
        )}
        
        {/* Appointments Card */}
        {hasPermission("appointments", "read") && (
          <Card>
            <CardHeader>
              <CardTitle>Agenda</CardTitle>
              <CardDescription>Agendamentos para hoje</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center pt-2">
              <p className="text-4xl font-bold text-primary-500">8</p>
            </CardContent>
          </Card>
        )}
        
        {/* Financial Card */}
        {hasPermission("financial", "read") && (
          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
              <CardDescription>Receita do mês atual</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center pt-2">
              <p className="text-4xl font-bold text-primary-500">R$ 12.450</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
