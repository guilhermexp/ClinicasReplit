import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, CreditCard, DollarSign, Percent, TrendingUp, Wallet } from "lucide-react";

interface StatsOverviewProps {
  clinicId?: string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ clinicId }) => {
  // Query para obter as estatísticas financeiras da clínica
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "stats"],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/stats`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar estatísticas financeiras");
      }
      return res.json();
    },
    enabled: !!clinicId,
    placeholderData: {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      pendingPayments: 0,
      conversionRate: 0
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        <p>Erro ao carregar estatísticas: {error.message}</p>
      </div>
    );
  }

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

  // Dados para exibir (usando valores simulados se necessário)
  const stats = {
    totalRevenue: data?.totalRevenue || 0, 
    totalExpenses: data?.totalExpenses || 0,
    netIncome: data?.netIncome || 0,
    pendingPayments: data?.pendingPayments || 0,
    conversionRate: data?.conversionRate || 0
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 font-medium flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" /> +2.5%
            </span>{" "}
            em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-red-500 font-medium flex items-center">
              <ArrowDown className="h-3 w-3 mr-1" /> +0.8%
            </span>{" "}
            em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.netIncome)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 font-medium flex items-center">
              <ArrowUp className="h-3 w-3 mr-1" /> +7.2%
            </span>{" "}
            em relação ao mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(stats.conversionRate)}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-500 font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +5.1%
            </span>{" "}
            desde a semana passada
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsOverview;