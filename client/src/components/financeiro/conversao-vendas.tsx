import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversaoVendasProps {
  clinicId?: string;
}

const ConversaoVendas: React.FC<ConversaoVendasProps> = ({ clinicId }) => {
  // Query para obter dados de conversão de vendas
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "conversion"],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/conversion`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar dados de conversão");
      }
      return res.json();
    },
    enabled: !!clinicId,
    // Dados simulados para desenvolvimento
    placeholderData: {
      totalAppointments: 120,
      convertedAppointments: 84,
      conversionRate: 70,
      targetRate: 75,
      weeklyRates: [65, 68, 72, 70, 69, 71, 70]
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Erro ao carregar dados de conversão
      </div>
    );
  }

  // Formatação de porcentagem
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Taxa atual</span>
        <span className="text-sm font-medium">{formatPercent(data.conversionRate)}</span>
      </div>
      <Progress value={data.conversionRate} className="h-2" />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Meta: {formatPercent(data.targetRate)}</span>
        <span>{data.convertedAppointments} de {data.totalAppointments} atendimentos</span>
      </div>
      
      <div className="space-y-1 mt-6">
        <div className="text-sm font-medium">Últimos 7 dias</div>
        <div className="flex items-end justify-between h-16 gap-1">
          {data.weeklyRates.map((rate, index) => (
            <div
              key={index}
              className="bg-primary/80 hover:bg-primary transition-colors rounded-sm w-full"
              style={{ height: `${rate}%` }}
              title={`Dia ${index + 1}: ${formatPercent(rate)}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>
      </div>
    </div>
  );
};

export default ConversaoVendas;