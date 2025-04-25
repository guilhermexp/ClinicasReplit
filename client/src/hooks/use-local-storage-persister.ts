import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

/**
 * Verifica se o código está sendo executado no navegador
 * Usado para evitar erros com window.localStorage no lado do servidor
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Cria um persister para o localStorage que salva o estado das queries
 * entre sessões do navegador
 */
// Interface completa para o persister
interface CustomPersister {
  persistClient: (client: any) => Promise<void>;
  restoreClient: () => Promise<any>;
  removeClient: () => Promise<void>;
}

// Criar um persister customizado que implementa todas as interfaces necessárias
export const localStoragePersister: CustomPersister = isBrowser
  ? {
      // Implementação baseada no createSyncStoragePersister
      persistClient: async (client: any) => {
        try {
          const serialized = JSON.stringify({
            timestamp: Date.now(),
            buster: '1.0', // para invalidar o cache quando a versão muda
            data: client
          });
          window.localStorage.setItem("CLINICAS_QUERY_CACHE", serialized);
        } catch (error) {
          console.error("Erro ao persistir cliente no cache:", error);
        }
      },
      
      restoreClient: async () => {
        try {
          const cachedString = window.localStorage.getItem("CLINICAS_QUERY_CACHE");
          if (!cachedString) {
            return {};
          }
          
          const cache = JSON.parse(cachedString);
          
          // Verificar se o cache é da versão atual
          if (cache.buster !== '1.0') {
            return {};
          }
          
          // Verificar se o cache expirou (30 dias)
          const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
          if (Date.now() - cache.timestamp > maxAge) {
            return {};
          }
          
          return cache.data;
        } catch (e) {
          console.error("Erro ao deserializar cache:", e);
          return {};
        }
      },
      
      removeClient: async () => {
        try {
          window.localStorage.removeItem("CLINICAS_QUERY_CACHE");
        } catch (error) {
          console.error("Erro ao remover cliente do cache:", error);
        }
      }
    }
  : {
      persistClient: async () => {},
      restoreClient: async () => ({}),
      removeClient: async () => {}
    };

/**
 * Função que remove dados expirados do cache persistido
 * Deve ser chamada na inicialização da aplicação
 */
export function removeExpiredPersistedQueries(queryClient: QueryClient) {
  if (!isBrowser) return;
  
  try {
    // Tempo de expiração 
    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
    
    // Recuperar o cache atual
    const cacheString = window.localStorage.getItem("CLINICAS_QUERY_CACHE");
    if (!cacheString) return;
    
    try {
      const cache = JSON.parse(cacheString);
      
      // Se o cache inteiro é antigo (mais de 30 dias), limpar tudo
      if (Date.now() - cache.timestamp > 30 * 24 * 60 * 60 * 1000) {
        window.localStorage.removeItem("CLINICAS_QUERY_CACHE");
        return;
      }
      
      // Filtrar queries expiradas e atualizar o cache
      const queries = cache.data?.queries || [];
      const activeQueries = queries.filter((query: any) => {
        // Se a query não tem meta.persist, não persistir
        if (!query.state?.meta?.persist) return false;
        
        // Verificar se a query expirou
        const lastUpdated = query.state?.dataUpdatedAt || 0;
        return Date.now() - lastUpdated < expirationTime;
      });
      
      // Atualizar o cache apenas com queries ativas
      if (activeQueries.length !== queries.length) {
        cache.data.queries = activeQueries;
        window.localStorage.setItem(
          "CLINICAS_QUERY_CACHE",
          JSON.stringify(cache)
        );
        
        console.log(
          `Cache de queries limpo: removidas ${queries.length - activeQueries.length} queries expiradas`
        );
      }
    } catch (parseError) {
      // Se não conseguir parsear o cache, limpar tudo
      console.error("Erro ao parsear cache:", parseError);
      window.localStorage.removeItem("CLINICAS_QUERY_CACHE");
    }
  } catch (error) {
    // Em caso de erro, limpar o cache completamente para evitar problemas
    console.error("Erro ao limpar o cache, reset completo:", error);
    try {
      window.localStorage.removeItem("CLINICAS_QUERY_CACHE");
    } catch (e) {
      // Ignorar erros ao tentar limpar
    }
  }
}