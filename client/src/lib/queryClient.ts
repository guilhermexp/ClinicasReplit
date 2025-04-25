import { QueryClient, 
         QueryFunction, 
         MutationFunction, 
         QueryKey,
         DefaultOptions } from "@tanstack/react-query";
import { localStoragePersister, removeExpiredPersistedQueries } from "@/hooks/use-local-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Tipo para parâmetros da requisição, para uso em apiRequest
export interface RequestParams {
  [key: string]: string | number | boolean | null | undefined;
}

// Configurações de cache otimizadas para diferentes tipos de dados
const queryConfig: DefaultOptions = {
  queries: {
    // Configuração default para a maioria das queries
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Configuração da persistência do cache (executado no lado do cliente)
if (typeof window !== 'undefined') {
  try {
    // Verificar se o persister é um objeto completo com a interface exigida
    const persister = typeof localStoragePersister !== 'function' && 
                       'persistClient' in localStoragePersister && 
                       'restoreClient' in localStoragePersister &&
                       typeof localStoragePersister.persistClient === 'function' &&
                       typeof localStoragePersister.restoreClient === 'function' 
      ? {
          ...localStoragePersister,
          // Implementar a função removeClient se não existir
          removeClient: async () => {
            localStorage.removeItem("CLINICAS_QUERY_CACHE");
            return Promise.resolve();
          }
        }
      : localStoragePersister;
    
    // Inicializa a persistência do cache
    persistQueryClient({
      queryClient,
      persister,
      // Máximo de 24 horas para dados em cache
      maxAge: 1000 * 60 * 60 * 24,
      // Configurações adicionais para melhorar performance
      dehydrateOptions: {
        // Não incluir dados com dehydrated: false na meta 
        shouldDehydrateQuery: (query: any) => {
          // Não persistir queries que estão em loading (usando string direto para evitar erro de tipos)
          if (String(query.state.status) === 'loading') return false;
          
          // Não persistir queries que têm persist=false no meta
          const meta = (query.state.meta as Record<string, any>) || {};
          if (meta.persist === false) return false;
          
          return true;
        },
      }
    });
    
    // Remover queries expiradas após inicialização
    removeExpiredPersistedQueries(queryClient);
  } catch (error) {
    console.error("Erro ao configurar persistência do cache:", error);
    
    // Em caso de erro, limpar o cache para evitar problemas
    try {
      localStorage.removeItem("CLINICAS_QUERY_CACHE");
    } catch (e) {
      // Ignorar erros ao tentar limpar o cache
    }
  }
}

export function invalidateQueries(
  invalidationCallback: (queryClient: QueryClient) => Promise<void>
): Promise<void> {
  return invalidationCallback(queryClient);
}

// Função para construir querystring a partir de objeto de parâmetros
// ignorando parâmetros nulos
function buildQueryString(params: RequestParams = {}): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value != null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

// Opções para o getQueryFn quando ocorre um erro 401
interface GetQueryFnOptions {
  on401?: "throw" | "returnNull";
  meta?: {
    persist?: boolean;  // Define se a query deve ser persistida no localStorage
    cacheTime?: number; // Tempo em milissegundos para o cache ser considerado válido
    priority?: 'high' | 'medium' | 'low'; // Prioridade para prefetching
  };
}

/**
 * Função para criar um queryFn que faz requisições à API e trata erros comuns
 * @param options Opções para comportamento em caso de erro 401 (não autenticado) e metadados de cache
 */
export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey, meta }: { queryKey: QueryKey, meta?: any }) => {
    // A primeira parte da queryKey é o endpoint da requisição
    const [endpoint, ...params] = queryKey;
    
    if (typeof endpoint !== "string") {
      throw new Error("A queryKey deve começar com uma string (endpoint)");
    }
    
    let queryParams: RequestParams = {};
    
    // Se há parâmetros e o último é um objeto, considera como queryParams
    if (params.length > 0) {
      const lastParam = params[params.length - 1];
      if (lastParam && typeof lastParam === "object" && !Array.isArray(lastParam)) {
        queryParams = lastParam as RequestParams;
      }
    }
    
    // Mesclar meta dados passados via opções e via queryOptions
    const combinedMeta = {
      ...options.meta,
      ...meta
    };
    
    // Fazer a requisição à API
    try {
      const res = await apiRequest("GET", endpoint, undefined, queryParams);
      const data = await res.json();
      
      // Para endpoints do dashboard, adicionar timestamps aos dados
      // Isso ajuda a identificar quando os dados foram carregados
      if (endpoint.includes('/api/dashboard') || endpoint.includes('/api/financeiro')) {
        return {
          ...data,
          _fetchedAt: Date.now()
        };
      }
      
      return data;
    } catch (error: any) {
      if (error.message?.includes("401") && options.on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };
}

/**
 * Função para fazer requisições à API com tratamento otimizado de erros e cache.
 * @param method Método HTTP (GET, POST, PUT, DELETE, etc.)
 * @param endpoint Endpoint da API (/api/users, /api/products, etc.)
 * @param data Dados para enviar no corpo da requisição (para POST, PUT, etc.)
 * @param params Parâmetros de consulta (para GET)
 * @returns Promise com o resultado da requisição
 */
export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any,
  params?: RequestParams
): Promise<Response> {
  let url = `${endpoint}${params ? buildQueryString(params) : ""}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    credentials: "include", // importante para enviar cookies em requisições cross-origin
  };

  // Adicionar body apenas para métodos não-GET
  if (method !== "GET" && data !== undefined) {
    options.body = JSON.stringify(data);
  }

  // Adicionar timestamp para evitar cache do navegador em requests críticos
  if (method === "GET" && !params?.nocache && endpoint.includes('/api/dashboard')) {
    const timestampParam = `_t=${Date.now()}`;
    url += url.includes('?') ? `&${timestampParam}` : `?${timestampParam}`;
  }

  const res = await fetch(url, options);
  
  if (!res.ok) {
    // Tentar obter mensagem de erro do corpo da resposta
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
    } catch (e) {
      // Se não conseguir parsear o corpo, usar mensagem padrão
      if (e instanceof SyntaxError) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      throw e;
    }
  }
  
  return res;
}

/**
 * Função para verificar se a resposta da requisição está ok.
 * Se não estiver, extrai a mensagem de erro e lança uma exceção.
 */
export async function throwIfResNotOk(res: Response): Promise<Response> {
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      throw e;
    }
  }
  return res;
}