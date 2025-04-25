import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { getQueryFn } from "@/lib/queryClient";
import { PermissionModule, PermissionAction } from "@/hooks/use-permissions-helper";

/**
 * Componente que pré-carrega dados importantes para o dashboard
 * Isso melhora a performance percebida pelo usuário, pois os dados já estão
 * no cache quando o usuário navega para o dashboard
 */
export function MetricsPrefetcher() {
  const queryClient = useQueryClient();
  const { selectedClinic } = useAuth();
  const permissions = usePermissions();
  
  // Prefetch de dados críticos do dashboard
  useEffect(() => {
    if (!selectedClinic?.id) return;
    
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
        permission: { module: "dashboard" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 5 * 60 * 1000, // 5 minutos
        cachePriority: 'high'
      },
      
      // Dados importantes com prioridade média
      {
        endpoint: `/api/appointments/upcoming/${selectedClinic.id}`,
        priority: fetchPriority.medium,
        permission: { module: "appointments" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 3 * 60 * 1000, // 3 minutos
        cachePriority: 'high'
      },
      {
        endpoint: `/api/clients/summary/${selectedClinic.id}`,
        priority: fetchPriority.medium,
        permission: { module: "clients" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 10 * 60 * 1000, // 10 minutos
        cachePriority: 'medium'
      },
      
      // Dados menos críticos com prioridade baixa
      {
        endpoint: `/api/professionals/summary/${selectedClinic.id}`,
        priority: fetchPriority.low,
        permission: { module: "professionals" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 15 * 60 * 1000, // 15 minutos
        cachePriority: 'medium'
      },
      {
        endpoint: `/api/inventory/summary/${selectedClinic.id}`,
        priority: fetchPriority.low,
        permission: { module: "inventory" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 20 * 60 * 1000, // 20 minutos
        cachePriority: 'low'
      },
      {
        endpoint: `/api/tasks/recent/${selectedClinic.id}`,
        priority: fetchPriority.low,
        permission: { module: "tasks" as PermissionModule, action: "view" as PermissionAction },
        staleTime: 10 * 60 * 1000, // 10 minutos
        cachePriority: 'low'
      }
    ];
    
    // Prefetch cada endpoint em ordem de prioridade
    criticalEndpoints.forEach(({ endpoint, priority, permission, staleTime, cachePriority }) => {
      // Só prefetch dados que o usuário tem permissão para ver
      if (permissions.checkPermission(permission.module, permission.action)) {
        // Aplicar delay para endpoints de menor prioridade para não sobrecarregar
        setTimeout(() => {
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
                priority: cachePriority as 'high' | 'medium' | 'low'
              }
            }),
            meta: {
              persist: true, // Marcar para persistência no localStorage
              priority: cachePriority as 'high' | 'medium' | 'low'
            }
          });
          
        }, priority);
      }
    });
    
    // Limpar logs após 5 segundos para não poluir o console
    const timeout = setTimeout(() => {
      console.log('Prefetching concluído para métricas críticas');
    }, fetchPriority.low + 1000);
    
    return () => clearTimeout(timeout);
    
  }, [selectedClinic?.id, queryClient, permissions]);
  
  // Este componente não renderiza nada visualmente
  return null;
}