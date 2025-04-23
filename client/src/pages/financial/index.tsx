import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { FinancialStatsOverview } from "@/components/financial/stats-overview";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download, Filter, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Dados de exemplo para as estatísticas financeiras
const financialStatsData = {
  totalRevenue: 78950,
  totalExpenses: 32450,
  netProfit: 46500,
  pendingPayments: 12340,
  completedPayments: 66610,
  growthRate: 12.5
};

// Dados de exemplo para receita por fonte
const revenueBySourceData = [
  { name: 'Consultas', value: 32000 },
  { name: 'Procedimentos', value: 28000 },
  { name: 'Produtos', value: 12500 },
  { name: 'Exames', value: 6450 }
];

// Dados de exemplo para resumo mensal
const monthlySummaryData = [
  { month: 'Jan', revenue: 52000, expenses: 22000, profit: 30000 },
  { month: 'Fev', revenue: 58000, expenses: 24000, profit: 34000 },
  { month: 'Mar', revenue: 61000, expenses: 26000, profit: 35000 },
  { month: 'Abr', revenue: 65000, expenses: 28000, profit: 37000 },
  { month: 'Mai', revenue: 69000, expenses: 30000, profit: 39000 },
  { month: 'Jun', revenue: 78950, expenses: 32450, profit: 46500 }
];

export default function Financial() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState<"week" | "month" | "year">("month");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Simulação de uma query para obter os dados financeiros
  const { data: financialStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "financial", "stats", timePeriod],
    enabled: !!selectedClinic,
    placeholderData: financialStatsData,
  });
  
  const { data: revenueBySource, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "financial", "revenue", timePeriod],
    enabled: !!selectedClinic,
    placeholderData: revenueBySourceData,
  });
  
  const { data: monthlySummary, isLoading: isLoadingMonthlySummary } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "financial", "monthly", timePeriod],
    enabled: !!selectedClinic,
    placeholderData: monthlySummaryData,
  });
  
  const handleExport = () => {
    toast({
      title: "Exportando relatório financeiro",
      description: "O relatório está sendo preparado e será baixado em breve.",
    });
    // Aqui você adicionaria a lógica para gerar e baixar um relatório
  };
  
  const handleAddTransaction = () => {
    toast({
      title: "Adicionar transação",
      description: "Funcionalidade de adicionar transação em desenvolvimento.",
    });
    // Aqui você adicionaria a lógica para abrir um modal de nova transação
  };
  
  // Se não tiver selecionado uma clínica
  if (!selectedClinic) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl mb-2">Selecione uma clínica para visualizar os dados financeiros</h2>
          <p className="text-gray-500">Escolha uma clínica no seletor acima para continuar</p>
        </div>
      </div>
    );
  }
  
  // Verificar se os dados estão carregando
  const isLoading = isLoadingStats || isLoadingRevenue || isLoadingMonthlySummary;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
        <p className="text-gray-500">Carregando dados financeiros...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">
          Financeiro
        </h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={handleAddTransaction}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          
          {activeTab === "income" || activeTab === "expenses" ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <ChevronDown className="mr-2 h-4 w-4" />
                Ordem
              </Button>
            </div>
          ) : null}
        </div>
        
        <TabsContent value="overview">
          <FinancialStatsOverview
            stats={financialStats}
            revenueBySource={revenueBySource}
            monthlySummary={monthlySummary}
            period={timePeriod}
            onPeriodChange={setTimePeriod}
          />
        </TabsContent>
        
        <TabsContent value="income">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h2 className="text-lg font-medium mb-2">Visualização de Receitas</h2>
            <p className="text-gray-500">
              Esta funcionalidade está em desenvolvimento. Aqui você poderá visualizar, filtrar e gerenciar todas as receitas da clínica.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="expenses">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h2 className="text-lg font-medium mb-2">Visualização de Despesas</h2>
            <p className="text-gray-500">
              Esta funcionalidade está em desenvolvimento. Aqui você poderá visualizar, filtrar e gerenciar todas as despesas da clínica.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports">
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <h2 className="text-lg font-medium mb-2">Relatórios Financeiros</h2>
            <p className="text-gray-500">
              Esta funcionalidade está em desenvolvimento. Aqui você poderá gerar relatórios financeiros personalizados.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
