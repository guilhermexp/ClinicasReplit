import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Calendar as CalendarIcon, Plus, TrendingUp, ArrowDownUp, Filter } from "lucide-react";

// Mock data for demonstration
const monthlyData = [
  { name: "Jan", receita: 12500, despesa: 8200 },
  { name: "Fev", receita: 14000, despesa: 9100 },
  { name: "Mar", receita: 15800, despesa: 9800 },
  { name: "Abr", receita: 16200, despesa: 10200 },
  { name: "Mai", receita: 18500, despesa: 11500 },
  { name: "Jun", receita: 17800, despesa: 10800 },
];

const categoryData = [
  { name: "Limpeza de Pele", value: 35 },
  { name: "Botox", value: 25 },
  { name: "Harmonização", value: 18 },
  { name: "Peeling", value: 15 },
  { name: "Outros", value: 7 },
];

const COLORS = ["#0C9488", "#3B82F6", "#8B5CF6", "#F97316", "#64748B"];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Custom Tooltip for bar chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-primary-600">
          Receita: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-red-600">
          Despesa: {formatCurrency(payload[1].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Financial() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const [periodFilter, setPeriodFilter] = useState("month");
  
  // Calculate summary
  const totalRevenue = monthlyData.reduce((acc, item) => acc + item.receita, 0);
  const totalExpenses = monthlyData.reduce((acc, item) => acc + item.despesa, 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = (profit / totalRevenue) * 100;
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">Financeiro</h1>
        
        {hasPermission("financial", "create") && (
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receita Total</p>
                <h3 className="text-2xl font-bold text-primary-600 mt-1">{formatCurrency(totalRevenue)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Despesas</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lucro</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(profit)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Margem de Lucro</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">{profitMargin.toFixed(1)}%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Revenue/Expense Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Receitas e Despesas</CardTitle>
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mês Atual</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                      <SelectItem value="year">Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => `R$ ${value / 1000}K`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="receita" name="Receita" fill="#0C9488" />
                      <Bar dataKey="despesa" name="Despesa" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Services Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {categoryData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Transactions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Data</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Descrição</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Categoria</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-600">Cliente</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">21/06/2023</td>
                      <td className="py-3 px-4 text-sm">Procedimento Limpeza de Pele</td>
                      <td className="py-3 px-4 text-sm">Serviços</td>
                      <td className="py-3 px-4 text-sm">Carla Soares</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">+ R$ 150,00</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">20/06/2023</td>
                      <td className="py-3 px-4 text-sm">Aplicação de Botox</td>
                      <td className="py-3 px-4 text-sm">Serviços</td>
                      <td className="py-3 px-4 text-sm">Ricardo Nunes</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">+ R$ 850,00</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">19/06/2023</td>
                      <td className="py-3 px-4 text-sm">Compra de Produtos</td>
                      <td className="py-3 px-4 text-sm">Fornecedores</td>
                      <td className="py-3 px-4 text-sm">-</td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right">- R$ 1.200,00</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">18/06/2023</td>
                      <td className="py-3 px-4 text-sm">Peeling Facial</td>
                      <td className="py-3 px-4 text-sm">Serviços</td>
                      <td className="py-3 px-4 text-sm">Maria Oliveira</td>
                      <td className="py-3 px-4 text-sm text-green-600 text-right">+ R$ 350,00</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm">17/06/2023</td>
                      <td className="py-3 px-4 text-sm">Pagamento de aluguel</td>
                      <td className="py-3 px-4 text-sm">Despesas fixas</td>
                      <td className="py-3 px-4 text-sm">-</td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right">- R$ 3.500,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Todas as Transações</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button variant="outline" size="sm">
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Funcionalidade completa de transações em desenvolvimento.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Funcionalidade de relatórios em desenvolvimento.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
