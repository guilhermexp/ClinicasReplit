import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Download } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatoriosFinanceirosProps {
  clinicId?: string;
}

const RelatoriosFinanceiros: React.FC<RelatoriosFinanceirosProps> = ({ clinicId }) => {
  const [reportType, setReportType] = useState("cashflow");
  const [period, setPeriod] = useState("month");

  // Query para buscar os dados de relatório financeiro
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "reports", reportType, period],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/reports/${reportType}?period=${period}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar relatório financeiro");
      }
      return res.json();
    },
    enabled: !!clinicId,
    // Dados simulados para desenvolvimento
    placeholderData: {
      period: "april-2025",
      periodLabel: "Abril 2025",
      data: {
        cashflow: {
          totalRevenue: 38500.00,
          totalExpenses: 28450.75,
          netIncome: 10049.25,
          categories: {
            revenue: [
              { name: "Procedimentos estéticos", value: 22500.00 },
              { name: "Consultas", value: 8000.00 },
              { name: "Venda de produtos", value: 6500.00 },
              { name: "Outros", value: 1500.00 }
            ],
            expenses: [
              { name: "Aluguel", value: 3500.00 },
              { name: "Salários", value: 15000.00 },
              { name: "Materiais", value: 4800.00 },
              { name: "Serviços públicos", value: 1200.00 },
              { name: "Marketing", value: 2000.00 },
              { name: "Outros", value: 1950.75 }
            ]
          },
          dailyData: [
            { date: "2025-04-01", revenue: 1250.00, expense: 950.00 },
            { date: "2025-04-02", revenue: 1550.00, expense: 850.00 },
            { date: "2025-04-03", revenue: 1800.00, expense: 950.00 },
            { date: "2025-04-04", revenue: 1950.00, expense: 1050.00 },
            { date: "2025-04-05", revenue: 1350.00, expense: 750.00 },
            // ... mais dias
          ]
        },
        profitability: {
          overall: 26.10, // porcentagem
          byService: [
            { name: "Limpeza de pele", revenue: 3500.00, cost: 1400.00, profit: 2100.00, margin: 60.0 },
            { name: "Botox", revenue: 12500.00, cost: 7500.00, profit: 5000.00, margin: 40.0 },
            { name: "Preenchimento", revenue: 8000.00, cost: 5600.00, profit: 2400.00, margin: 30.0 },
            { name: "Massagem", revenue: 4500.00, cost: 1800.00, profit: 2700.00, margin: 60.0 },
            { name: "Drenagem linfática", revenue: 3800.00, cost: 1500.00, profit: 2300.00, margin: 60.5 }
          ]
        },
        performance: {
          previousPeriod: {
            totalRevenue: 36200.00,
            totalExpenses: 27500.50,
            netIncome: 8699.50
          },
          yearToDate: {
            totalRevenue: 142500.00,
            totalExpenses: 105450.25,
            netIncome: 37049.75
          }
        }
      }
    }
  });

  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatação de porcentagem
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  // Calcular variação percentual
  const calculateVariation = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
        </div>
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Erro ao carregar relatório financeiro. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Relatórios Financeiros</h3>
          <p className="text-muted-foreground text-sm">Período: {data.periodLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
              <SelectItem value="semester">Semestral</SelectItem>
              <SelectItem value="year">Anual</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <CardDescription>Comparado ao período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.data.cashflow.totalRevenue)}</div>
            <p className="text-xs flex items-center mt-1">
              <span className={`font-medium ${calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue) >= 0 ? "+" : ""}
                {formatPercent(calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue))}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <CardDescription>Comparado ao período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.data.cashflow.totalExpenses)}</div>
            <p className="text-xs flex items-center mt-1">
              <span className={`font-medium ${calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses) <= 0 ? "text-green-500" : "text-red-500"}`}>
                {calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses) >= 0 ? "+" : ""}
                {formatPercent(calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses))}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <CardDescription>Comparado ao período anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.data.cashflow.netIncome)}</div>
            <p className="text-xs flex items-center mt-1">
              <span className={`font-medium ${calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome) >= 0 ? "+" : ""}
                {formatPercent(calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome))}
              </span>
              <span className="text-muted-foreground ml-1">vs período anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes tipos de relatórios */}
      <Tabs defaultValue="cashflow" value={reportType} onValueChange={setReportType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="profitability">Lucratividade</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Receitas</CardTitle>
              <CardDescription>Principais fontes de receita no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.data.cashflow.categories.revenue.map((item: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(item.value / data.data.cashflow.totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Despesas</CardTitle>
              <CardDescription>Principais categorias de despesas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.data.cashflow.categories.expenses.map((item: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-red-400 h-full rounded-full"
                        style={{ width: `${(item.value / data.data.cashflow.totalExpenses) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Margem de Lucro por Serviço</CardTitle>
                <CardDescription>
                  Análise de rentabilidade por tipo de serviço
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Lucro</TableHead>
                    <TableHead>Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.profitability.byService.map((service: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{formatCurrency(service.revenue)}</TableCell>
                      <TableCell>{formatCurrency(service.cost)}</TableCell>
                      <TableCell>{formatCurrency(service.profit)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`font-medium ${service.margin > 50 ? 'text-green-600' : service.margin > 30 ? 'text-amber-600' : 'text-red-600'}`}>
                            {formatPercent(service.margin)}
                          </span>
                          <div className="ml-2 w-12 bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${service.margin > 50 ? 'bg-green-500' : service.margin > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${service.margin}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rentabilidade Geral</CardTitle>
              <CardDescription>Margem de lucro total no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold mr-4">{formatPercent(data.data.profitability.overall)}</div>
                <div className="flex-1 bg-gray-100 h-4 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${data.data.profitability.overall > 25 ? 'bg-green-500' : data.data.profitability.overall > 15 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${data.data.profitability.overall}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Desempenho</CardTitle>
              <CardDescription>Comparação com períodos anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Métrica</TableHead>
                    <TableHead>Período Atual</TableHead>
                    <TableHead>Período Anterior</TableHead>
                    <TableHead>Variação</TableHead>
                    <TableHead>Acumulado no Ano</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Receitas</TableCell>
                    <TableCell>{formatCurrency(data.data.cashflow.totalRevenue)}</TableCell>
                    <TableCell>{formatCurrency(data.data.performance.previousPeriod.totalRevenue)}</TableCell>
                    <TableCell>
                      <span className={calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue) >= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue) >= 0 ? "+" : ""}
                        {formatPercent(calculateVariation(data.data.cashflow.totalRevenue, data.data.performance.previousPeriod.totalRevenue))}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(data.data.performance.yearToDate.totalRevenue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Despesas</TableCell>
                    <TableCell>{formatCurrency(data.data.cashflow.totalExpenses)}</TableCell>
                    <TableCell>{formatCurrency(data.data.performance.previousPeriod.totalExpenses)}</TableCell>
                    <TableCell>
                      <span className={calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses) <= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses) >= 0 ? "+" : ""}
                        {formatPercent(calculateVariation(data.data.cashflow.totalExpenses, data.data.performance.previousPeriod.totalExpenses))}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(data.data.performance.yearToDate.totalExpenses)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lucro Líquido</TableCell>
                    <TableCell>{formatCurrency(data.data.cashflow.netIncome)}</TableCell>
                    <TableCell>{formatCurrency(data.data.performance.previousPeriod.netIncome)}</TableCell>
                    <TableCell>
                      <span className={calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome) >= 0 ? "text-green-600" : "text-red-600"}>
                        {calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome) >= 0 ? "+" : ""}
                        {formatPercent(calculateVariation(data.data.cashflow.netIncome, data.data.performance.previousPeriod.netIncome))}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(data.data.performance.yearToDate.netIncome)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosFinanceiros;