import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import { startOfYear, endOfYear, format, parseISO, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Info } from "lucide-react";
import "react-calendar-heatmap/dist/styles.css";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type HeatmapDataPoint = {
  date: string;
  count: number;
  value: number;
};

type HeatmapDisplayMode = 'appointments' | 'revenue';

const tooltipDataAttrs = (value: any) => {
  if (!value || !value.date) {
    return null;
  }
  
  const date = format(parseISO(value.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedValue = value.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value.value) : "R$ 0,00";
  
  return {
    'data-tip': `
      Data: ${date}
      Agendamentos: ${value.count || 0}
      Receita: ${formattedValue}
    `,
  };
};

const getClassForValue = (mode: HeatmapDisplayMode) => (value: any) => {
  if (!value || (!value.count && !value.value)) {
    return 'color-empty';
  }
  
  const relevantValue = mode === 'appointments' ? value.count : value.value;
  
  if (relevantValue <= 0) return 'color-scale-0';
  if (relevantValue <= 2) return 'color-scale-1';
  if (relevantValue <= 5) return 'color-scale-2';
  if (relevantValue <= 10) return 'color-scale-3';
  return 'color-scale-4';
};

export function PerformanceHeatmap() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [displayMode, setDisplayMode] = useState<HeatmapDisplayMode>('appointments');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const startDate = useMemo(() => format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'), [selectedYear]);
  const endDate = useMemo(() => format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd'), [selectedYear]);
  
  const { data: heatmapData, isLoading, error } = useQuery<HeatmapDataPoint[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "performance-heatmap", startDate, endDate],
    enabled: !!selectedClinic?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
    onError: () => {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível obter os dados de desempenho da clínica.",
        variant: "destructive"
      });
    }
  });
  
  // Criar um array com anos disponíveis para seleção (atual e 2 anos anteriores)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [
      currentYear - 2,
      currentYear - 1,
      currentYear
    ];
  }, []);
  
  // Gerar valores para preencher dias sem dados
  const filledValues = useMemo(() => {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (!heatmapData) return [];
    
    // Criar um Map para acesso rápido aos dados por data
    const dataMap = new Map<string, HeatmapDataPoint>();
    heatmapData.forEach(d => dataMap.set(d.date, d));
    
    // Gerar array com todos os dias do período
    const result: HeatmapDataPoint[] = [];
    let currentDate = startDateObj;
    
    while (currentDate <= endDateObj) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      if (dataMap.has(dateStr)) {
        result.push(dataMap.get(dateStr)!);
      } else {
        result.push({
          date: dateStr,
          count: 0,
          value: 0
        });
      }
      
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }
    
    return result;
  }, [heatmapData, startDate, endDate]);
  
  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
  };
  
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg h-full">
        <CardHeader>
          <CardTitle gradient={true} className="text-lg flex items-center">
            <span className="mr-2">Desempenho da Clínica</span>
          </CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[250px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !filledValues.length) {
    return (
      <Card className="border-0 shadow-lg h-full">
        <CardHeader>
          <CardTitle gradient={true} className="text-lg flex items-center">
            <span className="mr-2">Desempenho da Clínica</span>
          </CardTitle>
          <CardDescription>Sem dados disponíveis para exibição</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center min-h-[250px]">
          <Info className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-center">
            Não foi possível carregar os dados de desempenho para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }
  
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
            values={filledValues}
            classForValue={getClassForValue(displayMode)}
            tooltipDataAttrs={tooltipDataAttrs}
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