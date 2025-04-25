import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";

/**
 * Componente que pré-carrega dados importantes para o dashboard
 * Isso melhora a performance percebida pelo usuário, pois os dados já estão
 * no cache quando o usuário navega para o dashboard
 */
export function MetricsPrefetcher() {
  const queryClient = useQueryClient();
  const { selectedClinic } = useAuth();
  
  // Prefetch de dados críticos do dashboard
  useEffect(() => {
    if (!selectedClinic?.id) return;
    
    try {
      const fetchPriority = {
        high: 0,
        medium: 150,
        low: 300
      };
      
      const criticalEndpoints = [
        // Dados importantes do dashboard com prioridade alta (imediato)
        {
          endpoint: `/api/dashboard/summary/${selectedClinic.id}`,
          priority: fetchPriority.high,
          staleTime: 5 * 60 * 1000, // 5 minutos
          cachePriority: 'high'
        },
        
        // Dados importantes com prioridade média
        {
          endpoint: `/api/appointments/upcoming/${selectedClinic.id}`,
          priority: fetchPriority.medium,
          staleTime: 3 * 60 * 1000, // 3 minutos
          cachePriority: 'high'
        },
        {
          endpoint: `/api/clients/summary/${selectedClinic.id}`,
          priority: fetchPriority.medium,
          staleTime: 10 * 60 * 1000, // 10 minutos
          cachePriority: 'medium'
        },
        
        // Dados menos críticos com prioridade baixa
        {
          endpoint: `/api/professionals/summary/${selectedClinic.id}`,
          priority: fetchPriority.low,
          staleTime: 15 * 60 * 1000, // 15 minutos
          cachePriority: 'medium'
        },
        {
          endpoint: `/api/inventory/summary/${selectedClinic.id}`,
          priority: fetchPriority.low,
          staleTime: 20 * 60 * 1000, // 20 minutos
          cachePriority: 'low'
        },
        {
          endpoint: `/api/tasks/recent/${selectedClinic.id}`,
          priority: fetchPriority.low,
          staleTime: 10 * 60 * 1000, // 10 minutos
          cachePriority: 'low'
        }
      ];
      
      // Prefetch cada endpoint em ordem de prioridade
      criticalEndpoints.forEach(({ endpoint, priority, staleTime, cachePriority }) => {
        try {
          // Aplicar delay para endpoints de menor prioridade para não sobrecarregar
          setTimeout(() => {
            try {
              // Log para verificação durante o desenvolvimento
              console.log(`Prefetching ${endpoint} com prioridade ${cachePriority}`);
              
              // Prefetch e armazenar no cache com metadados para persistência
              queryClient.prefetchQuery({
                queryKey: [endpoint],
                staleTime: staleTime,
                gcTime: staleTime * 2, // Dobro do staleTime
                queryFn: getQueryFn({
                  meta: {
                    persist: true, // Marcar para persistência no localStorage
                    priority: cachePriority as 'high' | 'medium' | 'low',
                    cacheTime: staleTime, // Tempo de expiração do cache
                  }
                }),
                meta: {
                  persist: true, // Marcar para persistência no localStorage
                  priority: cachePriority as 'high' | 'medium' | 'low',
                  cacheTime: staleTime, // Tempo de expiração do cache
                }
              });
            } catch (innerError) {
              console.error(`Erro ao processar prefetch para ${endpoint}:`, innerError);
            }
          }, priority);
        } catch (permissionError) {
          console.error(`Erro ao verificar permissão para ${endpoint}:`, permissionError);
        }
      });
      
      // Limpar logs após 5 segundos para não poluir o console
      const timeout = setTimeout(() => {
        console.log('Prefetching concluído para métricas críticas');
      }, fetchPriority.low + 1000);
      
      return () => clearTimeout(timeout);
    } catch (error) {
      console.error("Erro no MetricsPrefetcher:", error);
    }
  }, [selectedClinic?.id, queryClient]);
  
  // Este componente não renderiza nada visualmente
  return null;
}