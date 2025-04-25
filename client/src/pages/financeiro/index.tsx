import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsOverview from "@/components/financeiro/stats-overview";
import ConversaoVendas from "@/components/financeiro/conversao-vendas";
import ListaPagamentos from "@/components/financeiro/lista-pagamentos";
import ListaDespesas from "@/components/financeiro/lista-despesas";
import GestaoContas from "@/components/financeiro/gestao-contas";
import RelatoriosFinanceiros from "@/components/financeiro/relatorios-financeiros";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  Plus,
  PlusCircle,
  RefreshCcw,
  TrendingUp,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import AdicionarDespesaDialog from "@/components/financeiro/adicionar-despesa-dialog";
import AdicionarPagamentoDialog from "@/components/financeiro/adicionar-pagamento-dialog";
import AdicionarContaDialog from "@/components/financeiro/adicionar-conta-dialog";

const FinanceiroPage = () => {
  const { clinicId } = useParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);

  // Query para obter os dados da clínica
  const { data: clinic, isLoading: isClinicLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}`);
      if (!res.ok) throw new Error("Não foi possível carregar os dados da clínica");
      return res.json();
    },
    enabled: !!clinicId
  });

  const handleAddExpense = () => {
    setShowAddExpenseDialog(true);
  };

  const handleAddPayment = () => {
    setShowAddPaymentDialog(true);
  };

  const handleAddAccount = () => {
    setShowAddAccountDialog(true);
  };

  if (isClinicLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie receitas, despesas e controle financeiro de {clinic?.name || "sua clínica"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="receitas" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>Receitas</span>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span>Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="contas" className="gap-1.5">
            <Wallet className="h-4 w-4" />
            <span>Contas</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <StatsOverview clinicId={clinicId} />
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Últimos Pagamentos</CardTitle>
                    <CardDescription>Pagamentos mais recentes da clínica</CardDescription>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleAddPayment}>
                    <Plus className="h-4 w-4 mr-1" /> Pagamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ListaPagamentos 
                  clinicId={clinicId} 
                  limit={5} 
                  simplified={true} 
                />
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("receitas")}>
                  Ver todos os pagamentos
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Últimas Despesas</CardTitle>
                    <CardDescription>Despesas mais recentes da clínica</CardDescription>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleAddExpense}>
                    <Plus className="h-4 w-4 mr-1" /> Despesa
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ListaDespesas 
                  clinicId={clinicId} 
                  limit={5} 
                  simplified={true} 
                />
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("despesas")}>
                  Ver todas as despesas
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Fluxo de Caixa</CardTitle>
                <CardDescription>Comparativo de receitas vs despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Gráfico de fluxo de caixa será exibido aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversão de Vendas</CardTitle>
                <CardDescription>Taxa de conversão dos atendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversaoVendas clinicId={clinicId} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestão de Receitas</h2>
            <Button onClick={handleAddPayment}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Pagamento
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <ListaPagamentos clinicId={clinicId} limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestão de Despesas</h2>
            <Button onClick={handleAddExpense}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <ListaDespesas clinicId={clinicId} limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestão de Contas</h2>
            <Button onClick={handleAddAccount}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <GestaoContas clinicId={clinicId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Relatórios Financeiros</h2>
            <Button variant="outline">
              <CalendarDays className="mr-2 h-4 w-4" />
              Definir Período
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <RelatoriosFinanceiros clinicId={clinicId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAddExpenseDialog && (
        <AdicionarDespesaDialog
          clinicId={Number(clinicId)}
          open={showAddExpenseDialog}
          onOpenChange={setShowAddExpenseDialog}
        />
      )}
      
      {showAddPaymentDialog && (
        <AdicionarPagamentoDialog
          clinicId={Number(clinicId)}
          open={showAddPaymentDialog}
          onOpenChange={setShowAddPaymentDialog}
        />
      )}
      
      {showAddAccountDialog && (
        <AdicionarContaDialog
          clinicId={Number(clinicId)}
          open={showAddAccountDialog}
          onOpenChange={setShowAddAccountDialog}
        />
      )}
    </div>
  );
};

export default FinanceiroPage;