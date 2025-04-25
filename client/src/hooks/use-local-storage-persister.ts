import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';

/**
 * Cria um persister para o localStorage que salva o estado das queries
 * entre sessões do navegador
 */
export const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'clinicas-system-query-cache',
  // Define quais queries serão persistidas (baseado em metadados)
  // Por padrão, só persiste queries que têm meta.persist = true
  throttleTime: 1000, // milliseconds
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data),
});

/**
 * Função que remove dados expirados do cache persistido
 * Deve ser chamada na inicialização da aplicação
 */
export function removeExpiredPersistedQueries(queryClient: QueryClient) {
  try {
    // Obter os dados atuais do cache persistido
    const localStorageCache = JSON.parse(
      localStorage.getItem('clinicas-system-query-cache') || '{}'
    );
    
    if (!localStorageCache.clientState?.queries) {
      return;
    }
    
    // Verificar e filtrar queries expiradas
    const now = Date.now();
    const queries = localStorageCache.clientState.queries;
    
    // Remover queries que estão expiradas
    let hasRemovedItems = false;
    for (const queryKey in queries) {
      const query = queries[queryKey];
      
      // Se o tempo de expiração do GC (garbage collection) já passou, remover a query
      if (query.gcTime && now > query.gcTime) {
        delete queries[queryKey];
        hasRemovedItems = true;
      }
    }
    
    // Se houve remoções, atualizar o localStorage
    if (hasRemovedItems) {
      localStorage.setItem(
        'clinicas-system-query-cache',
        JSON.stringify(localStorageCache)
      );
      
      console.log('Removidas queries expiradas do cache persistido');
    }
  } catch (error) {
    console.error('Erro ao limpar cache persistido:', error);
    // Em caso de erro, limpar completamente o cache para evitar problemas
    localStorage.removeItem('clinicas-system-query-cache');
  }
}