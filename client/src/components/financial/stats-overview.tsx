import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  CreditCard,
  Wallet
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  completedPayments: number;
  growthRate: number;
}

interface RevenueBySource {
  name: string;
  value: number;
}

interface MonthlySummary {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface FinancialStatsProps {
  stats: FinancialStats;
  revenueBySource: RevenueBySource[];
  monthlySummary: MonthlySummary[];
  period: "week" | "month" | "year";
  onPeriodChange: (period: "week" | "month" | "year") => void;
}

export function FinancialStatsOverview({
  stats,
  revenueBySource,
  monthlySummary,
  period,
  onPeriodChange
}: FinancialStatsProps) {
  // Formatar valor monetário
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatar percentual
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Cores para o gráfico de pizza
  const COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
  
  return (
    <div className="space-y-6">
      {/* Selector para período de tempo */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Visão Geral Financeira</h2>
        <Tabs value={period} onValueChange={onPeriodChange as any} className="w-[400px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Cards com estatísticas resumidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          description="Total arrecadado no período"
          icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
          trend={stats.growthRate}
          trendLabel="vs. período anterior"
          color="bg-emerald-50"
        />
        
        <StatCard 
          title="Despesas"
          value={formatCurrency(stats.totalExpenses)}
          description="Total de gastos no período"
          icon={<CreditCard className="h-4 w-4 text-red-600" />}
          trend={-3.2} // Valor de exemplo
          trendLabel="vs. período anterior"
          color="bg-red-50"
        />
        
        <StatCard 
          title="Lucro Líquido"
          value={formatCurrency(stats.netProfit)}
          description="Receita menos despesas"
          icon={<Wallet className="h-4 w-4 text-primary-600" />}
          trend={5.8} // Valor de exemplo
          trendLabel="vs. período anterior"
          color="bg-primary-50"
        />
        
        <StatCard 
          title="Pgtos. Pendentes"
          value={formatCurrency(stats.pendingPayments)}
          description="Pagamentos aguardando confirmação"
          icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
          trend={0}
          color="bg-amber-50"
          hideArrow={true}
        />
      </div>
      
      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de receita e despesas por mês */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receita e Despesas</CardTitle>
            <CardDescription>Análise mensal comparativa</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySummary}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Valor"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="revenue" name="Receita" fill="#4F46E5" />
                <Bar dataKey="expenses" name="Despesas" fill="#F87171" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Gráfico de lucro líquido */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Lucro Líquido</CardTitle>
            <CardDescription>Tendência ao longo do período</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySummary}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Valor"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Lucro"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Origem da receita (gráfico de pizza) */}
      <Card>
        <CardHeader>
          <CardTitle>Origem da Receita</CardTitle>
          <CardDescription>Distribuição por fonte de receita</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="w-full md:w-1/2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-4">
            {revenueBySource.map((source, index) => (
              <div key={source.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <div>
                  <p className="text-sm font-medium">{source.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(source.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: string;
  hideArrow?: boolean;
}

function StatCard({ title, value, description, icon, trend = 0, trendLabel, color, hideArrow = false }: StatCardProps) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", color)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
      {typeof trend !== 'undefined' && (
        <CardFooter>
          <div className="flex items-center space-x-1 text-sm">
            {!hideArrow && (
              <>
                {isPositive && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                {isNeutral && <span className="h-4 w-4" />}
                {!isPositive && !isNeutral && <ArrowDownRight className="h-4 w-4 text-red-500" />}
              </>
            )}
            <span className={cn(
              "font-medium",
              isPositive && "text-emerald-500",
              isNeutral && "text-gray-500",
              !isPositive && !isNeutral && "text-red-500"
            )}>
              {trend > 0 && "+"}
              {trend !== 0 ? `${trend.toFixed(1)}%` : "0%"}
            </span>
            {trendLabel && <span className="text-gray-500 text-xs">{trendLabel}</span>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 