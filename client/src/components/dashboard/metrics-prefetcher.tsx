import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Lista de endpoints que devem ser pré-carregados para o dashboard
const PREFETCH_ENDPOINTS = [
  '/api/dashboard/metrics',
  '/api/dashboard/appointments/upcoming',
  '/api/dashboard/financial/summary',
  '/api/dashboard/tasks/pending'
];

/**
 * Componente que pré-carrega dados importantes para o dashboard
 * Isso melhora a performance percebida pelo usuário, pois os dados já estão
 * no cache quando o usuário navega para o dashboard
 */
export function MetricsPrefetcher() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Prefetch de todos os endpoints críticos
    PREFETCH_ENDPOINTS.forEach(endpoint => {
      queryClient.prefetchQuery({
        queryKey: [endpoint],
        // Não há necessidade de definir queryFn, pois usamos o padrão global
        staleTime: 5 * 60 * 1000, // 5 minutos
      });
    });
    
    // Configurar um intervalo para atualizar os dados em segundo plano
    const intervalId = setInterval(() => {
      PREFETCH_ENDPOINTS.forEach(endpoint => {
        queryClient.invalidateQueries({ queryKey: [endpoint] });
      });
    }, 15 * 60 * 1000); // Atualizar a cada 15 minutos
    
    return () => clearInterval(intervalId);
  }, [queryClient]);
  
  // Este componente não renderiza nada visível
  return null;
}