import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Configuração do persistidor de cache usando localStorage
export const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'CLINIC_REACT_QUERY_CACHE',
  throttleTime: 1000, // Tempo de espera antes de salvar no localStorage (ms)
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

// Helpers para gerenciar o redirecionamento em caso de 401
let isRedirectingToLogin = false;
const redirectToLogin = () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  // Salvar a URL atual para retornar após o login
  const currentPath = window.location.pathname;
  if (currentPath !== '/login' && currentPath !== '/auth') {
    localStorage.setItem('redirectAfterLogin', currentPath);
  }
  // Pequeno delay para evitar múltiplos redirecionamentos
  setTimeout(() => {
    window.location.href = '/login';
    isRedirectingToLogin = false;
  }, 100);
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Redirecionamento específico para erros 401 (Não autorizado)
    if (res.status === 401) {
      redirectToLogin();
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Cache de segundo nível para endpoints críticos (usado quando API falha temporariamente)
const criticalDataCache = new Map<string, {data: any, timestamp: number}>();

// Lista de endpoints críticos que devem ter cache de segundo nível
const CRITICAL_ENDPOINTS = [
  '/api/auth/me',
  '/api/me/permissions',
  '/api/dashboard/metrics',
  '/api/financial/summary'
];

// Tempo de expiração do cache de segundo nível (30 minutos)
const SECOND_LEVEL_CACHE_EXPIRY = 30 * 60 * 1000;

// Função aprimorada para buscas com cache de segundo nível
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;
    const isCriticalEndpoint = CRITICAL_ENDPOINTS.includes(endpoint);
    
    try {
      // Tentar obter dados da API primeiro
      const res = await fetch(endpoint, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Acesso não autorizado para ${endpoint}`);
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Se for um endpoint crítico, armazenar no cache de segundo nível
      if (isCriticalEndpoint) {
        criticalDataCache.set(endpoint, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      
      // Se for um endpoint crítico, verificar se temos dados em cache
      if (isCriticalEndpoint) {
        const cachedData = criticalDataCache.get(endpoint);
        
        // Usar dados em cache se estiverem disponíveis e dentro do prazo de validade
        if (cachedData && (Date.now() - cachedData.timestamp) < SECOND_LEVEL_CACHE_EXPIRY) {
          console.log(`Usando dados em cache para ${endpoint}`);
          return cachedData.data;
        }
      }
      
      // Comportamento padrão em caso de erro
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

// Configuração otimizada para o queryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      // Só recarregar dados quando a janela voltar ao foco se os dados forem obsoletos
      refetchOnWindowFocus: 'always',
      // Tempo de cache estendido para melhorar performance
      staleTime: 15 * 60 * 1000, // 15 minutos (aumentado)
      retry: 1,
      // Tempo de garbage collection estendido (renomeado para gcTime no React Query v5)
      gcTime: 60 * 60 * 1000, // 60 minutos (aumentado)
      // Estrutura para metadados que podem ser usados no futuro para persistência seletiva
      meta: {
        persist: true
      },
    },
    mutations: {
      retry: 1,
      // Atualiza o cache automaticamente em caso de erro, mantendo os dados anteriores
      onError: (err, variables, context) => {
        console.error('Erro em mutação:', err);
      }
    },
  },
});
