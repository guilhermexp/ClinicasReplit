import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaPagamentos } from "@/components/financeiro/lista-pagamentos";
import { Loader2, AlertTriangle } from "lucide-react";

// Interfaces
interface Clinic {
  id: number;
  name: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  openingHours: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FinanceiroPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams<{ clinicId?: string }>();
  const { selectedClinic } = useAuth();
  const clinicId = params.clinicId ? parseInt(params.clinicId) : (selectedClinic?.id || 0);
  const [activeTab, setActiveTab] = useState("pagamentos");

  // Verificar se a clínica existe
  const { data: clinic, isLoading: isLoadingClinic, error: clinicError } = useQuery<Clinic>({
    queryKey: [`/api/clinics/${clinicId}`],
    enabled: !!clinicId && !isNaN(clinicId),
  });

  // Verificar se o usuário tem permissão para acessar a página
  const { data: clinicUser, isLoading: isLoadingPermission } = useQuery({
    queryKey: [`/api/clinics/${clinicId}/user`],
    enabled: !!clinicId && !isNaN(clinicId) && !!user,
  });

  if (isLoadingClinic || isLoadingPermission) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-800">Carregando...</span>
        </div>
      </div>
    );
  }

  if (clinicError) {
    toast({
      title: "Erro ao carregar dados da clínica",
      description: "Verifique se você tem permissão para acessar essa página.",
      variant: "destructive",
    });

    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-700 mb-2">Erro ao carregar dados</h2>
          <p className="text-slate-600">
            Não foi possível carregar os dados da clínica. Verifique se você tem permissão para
            acessar essa página.
          </p>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-amber-700 mb-2">Clínica não encontrada</h2>
          <p className="text-slate-600">
            A clínica solicitada não foi encontrada. Verifique o ID da clínica e tente novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">Financeiro</h1>
          <p className="text-slate-600">{`Gerencie pagamentos e finanças da clínica ${clinic.name || ''}`}</p>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="pagamentos" className="font-medium">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="comissoes" className="font-medium">
              Comissões
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="pagamentos" className="mt-0">
              <ListaPagamentos 
                clinicId={clinicId} 
                titulo="Todos os Pagamentos" 
              />
            </TabsContent>

            <TabsContent value="comissoes" className="mt-0">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">
                    Módulo de Comissões em Desenvolvimento
                  </h3>
                  <p className="text-slate-600 max-w-lg">
                    A funcionalidade de gerenciamento de comissões está sendo desenvolvida e estará
                    disponível em breve. As comissões serão calculadas automaticamente com base nos
                    pagamentos confirmados.
                  </p>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}