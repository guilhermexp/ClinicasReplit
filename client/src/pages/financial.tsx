import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, BarChart, Calendar, Users } from "lucide-react";
import { ListaPagamentos } from "@/components/financeiro/lista-pagamentos";

export default function Financial() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedClinic, setSelectedClinic] = useState<number | null>(null);

  // Buscar clínicas disponíveis para o usuário
  const { data: clinics, isLoading } = useQuery({
    queryKey: ["/api/clinics"],
    enabled: !!user,
  });

  // Selecionar a primeira clínica disponível como padrão
  useEffect(() => {
    if (clinics && clinics.length > 0 && !selectedClinic) {
      setSelectedClinic(clinics[0].id);
    }
  }, [clinics, selectedClinic]);

  // Redirecionar para a página da clínica selecionada
  const handleClinicSelect = (clinicId: number) => {
    setSelectedClinic(clinicId);
    navigate(`/financeiro/${clinicId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Financeiro</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clinics && clinics.length > 0 ? (
          <div>
            {clinics.length > 1 ? (
              <Card className="mb-6 bg-white/80 backdrop-blur-sm border border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle>Selecione uma Clínica</CardTitle>
                  <CardDescription>
                    Escolha a clínica para gerenciar os pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {clinics.map((clinic) => (
                      <Button
                        key={clinic.id}
                        variant={selectedClinic === clinic.id ? "default" : "outline"}
                        className={
                          selectedClinic === clinic.id
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "border-blue-200 text-blue-700"
                        }
                        onClick={() => handleClinicSelect(clinic.id)}
                      >
                        {clinic.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {selectedClinic && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-100">
                      Total Recebido
                    </CardDescription>
                    <CardTitle className="text-2xl">R$ 0,00</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-100">Mês Atual</p>
                      <DollarSign className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-green-100">
                      Pagamentos Concluídos
                    </CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-100">Mês Atual</p>
                      <BarChart className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500 to-amber-700 text-white">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-amber-100">
                      Pendentes
                    </CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-amber-100">Aguardando Pagamento</p>
                      <Calendar className="h-8 w-8 text-amber-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-purple-100">
                      Clientes Ativos
                    </CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-purple-100">Com Pagamentos</p>
                      <Users className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedClinic && (
              <ListaPagamentos
                clinicId={selectedClinic}
                titulo="Todos os Pagamentos"
              />
            )}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border border-slate-200">
            <CardHeader>
              <CardTitle>Nenhuma Clínica Encontrada</CardTitle>
              <CardDescription>
                Você precisa criar ou ser adicionado a uma clínica para acessar o módulo financeiro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/onboarding")}>Criar uma Clínica</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}