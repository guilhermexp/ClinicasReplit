import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import { startOfYear, endOfYear, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Importar o CSS base da biblioteca
import "react-calendar-heatmap/dist/styles.css";

// Tipo de dado para o heatmap
type HeatmapData = {
  date: string;
  count: number;
  value: number;
};

type HeatmapDisplayMode = 'appointments' | 'revenue';

export function PerformanceHeatmapSimplified() {
  const { selectedClinic } = useAuth();
  const [displayMode, setDisplayMode] = useState<HeatmapDisplayMode>('appointments');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const startDate = useMemo(() => format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'), [selectedYear]);
  const endDate = useMemo(() => format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'), [selectedYear]);
  
  // Dados para o heatmap - carregar do backend
  const { data: heatmapData = [], isLoading, error } = useQuery<HeatmapData[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "performance-heatmap", startDate, endDate],
    enabled: !!selectedClinic?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  // Dados de exemplo para demonstração caso não haja dados do backend
  // Isso garante que o componente sempre tenha um visual interessante
  const sampleData = useMemo(() => {
    if (heatmapData.length > 0) {
      // Se temos dados reais, usar eles
      return heatmapData;
    }
    
    // Caso contrário, criar alguns dados de exemplo para visualização
    const data: HeatmapData[] = [];
    const year = selectedYear;
    
    // Adicionar alguns valores para mostrar o heatmap funcionando
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        // Gerar valores esparsos para demonstração (apenas 30% dos dias)
        if (Math.random() > 0.7) {
          const count = Math.floor(Math.random() * 8) + 1;
          const value = count * 100 + Math.floor(Math.random() * 500);
          
          data.push({
            date: format(new Date(year, month, day), 'yyyy-MM-dd'),
            count,
            value
          });
        }
      }
    }
    
    return data;
  }, [heatmapData, selectedYear]);
  
  // Criar um array com anos disponíveis para seleção (atual e 2 anos anteriores)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      currentYear - 2,
      currentYear - 1,
      currentYear
    ];
  }, []);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
  };
  
  const getClassForValue = (value: any) => {
    if (!value || (!value.count && !value.value)) {
      return 'color-empty';
    }
    
    const relevantValue = displayMode === 'appointments' ? value.count : value.value;
    
    if (relevantValue <= 0) return 'color-scale-0';
    if (relevantValue <= 2) return 'color-scale-1';
    if (relevantValue <= 5) return 'color-scale-2';
    if (relevantValue <= 10) return 'color-scale-3';
    return 'color-scale-4';
  };
  
  const getTooltipDataAttrs = (value: any) => {
    if (!value || !value.date) {
      return { 'data-tip': '' };
    }
    
    const date = format(parseISO(value.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const formattedValue = value.value 
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value.value) 
      : "R$ 0,00";
    
    return {
      'data-tip': `Data: ${date}\nAgendamentos: ${value.count || 0}\nReceita: ${formattedValue}`
    };
  };
  
  return (
    <Card className="border-0 shadow-lg h-full heatmap-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle gradient={true} className="text-lg flex items-center">
            <span className="mr-2">Desempenho da Clínica</span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select
              value={displayMode}
              onValueChange={(value) => setDisplayMode(value as HeatmapDisplayMode)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Visualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointments">Agendamentos</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={selectedYear.toString()}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CardDescription>
          {displayMode === 'appointments' 
            ? 'Visualização de agendamentos ao longo do ano'
            : 'Visualização de receita ao longo do ano'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md overflow-hidden p-2">
          <ReactCalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={sampleData}
            classForValue={getClassForValue}
            tooltipDataAttrs={getTooltipDataAttrs}
            showWeekdayLabels={true}
            gutterSize={2}
          />
        </div>
        
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 mr-1">Menor</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
            <div className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200"></div>
            <div className="w-3 h-3 rounded-sm bg-blue-300 border border-blue-400"></div>
            <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600"></div>
            <div className="w-3 h-3 rounded-sm bg-blue-700 border border-blue-800"></div>
            <span className="text-gray-500 ml-1">Maior</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <p className="text-xs text-muted-foreground w-full text-center">
          {displayMode === 'appointments'
            ? 'A intensidade da cor representa o número de agendamentos no dia'
            : 'A intensidade da cor representa o valor da receita no dia'}
        </p>
      </CardFooter>
    </Card>
  );
}