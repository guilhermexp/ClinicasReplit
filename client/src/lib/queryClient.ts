import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache"
        }
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Acesso não autorizado para ${queryKey[0]}`);
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Erro na requisição para ${queryKey[0]}:`, error);
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      // Aumentar o tempo de cache para melhorar performance
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      // O parâmetro cacheTime foi renomeado para gcTime no React Query v5
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
    mutations: {
      retry: 1,
    },
  },
});
