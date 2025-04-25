import { ReactNode, useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { Loader2, BellIcon, Search, User, Settings, LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getAvatarColor } from "@/lib/auth-utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

interface MainLayoutProps {
  children: ReactNode;
}

// Componente de carregamento para o cabeçalho
const HeaderSkeleton = () => (
  <div className="h-16 glass-card backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 mx-4 mt-4 rounded-xl shadow-md">
    <Skeleton className="h-8 w-48 bg-gray-300/30" />
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-64 hidden md:block bg-gray-300/30" />
      <Skeleton className="h-10 w-10 rounded-full bg-gray-300/30" />
      <Skeleton className="h-10 w-10 rounded-full bg-gray-300/30" />
    </div>
  </div>
);

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isLoading, logout, selectedClinic } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [headerLoading, setHeaderLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simular carregamento do cabeçalho
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeaderLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Função para lidar com a pesquisa
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implementar lógica de pesquisa global aqui
      console.log("Pesquisando por:", searchQuery);
      
      // Anunciar para leitores de tela
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('class', 'sr-only');
      announcement.textContent = `Pesquisando por ${searchQuery}`;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="glass-card p-8 shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="gradient-text text-lg font-medium animate-pulse" aria-live="polite">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {headerLoading ? (
          <HeaderSkeleton />
        ) : (
          <header 
            className="h-16 bg-black/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 mx-4 mt-4 rounded-xl shadow-md border border-white/10"
            role="banner"
            aria-label="Cabeçalho principal"
          >
            <div className="flex items-center">
              {selectedClinic && (
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-white drop-shadow-sm hidden md:block">
                    {selectedClinic.name}
                  </h2>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Barra de pesquisa responsiva */}
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isSearchOpen ? "w-full md:w-64" : "w-0 md:w-64"
              )}>
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute left-2 top-[50%] transform -translate-y-1/2 p-1 rounded-md bg-primary-600/20">
                    <Search className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                  </div>
                  <Input 
                    type="search" 
                    placeholder="Pesquisar..." 
                    className="pl-10 h-9 md:h-10 w-full bg-black/40 border-white/20 focus:border-white/40 focus:ring-white/20 rounded-lg shadow-sm text-white placeholder:text-white/60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Pesquisar no sistema"
                  />
                  <button type="submit" className="sr-only">Pesquisar</button>
                </form>
              </div>
              
              {/* Botão de pesquisa para mobile */}
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden text-white hover:text-white hover:bg-white/10 rounded-lg"
                  aria-label={isSearchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
                  aria-expanded={isSearchOpen}
                  aria-controls="search-input"
                >
                  <div className="p-1.5 rounded-md bg-primary-600/20">
                    <Search className="h-4 w-4 text-white" aria-hidden="true" />
                  </div>
                </Button>
              )}
              
              {/* Notificações */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-white hover:text-white hover:bg-white/10 rounded-lg"
                aria-label="Notificações"
              >
                <div className="p-1.5 rounded-md bg-primary-600/20">
                  <BellIcon className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-md animate-pulse"
                  aria-label="Novas notificações"
                ></span>
              </Button>
              
              {/* Menu do usuário */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-9 w-9 md:h-10 md:w-10 hover:bg-transparent hover:shadow-lg transition-all p-0 border-2 border-primary-200/30"
                      aria-label="Menu do usuário"
                    >
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 shadow-md border-[3px] border-white/30 bg-gradient-to-br from-primary-100/80 to-primary-600/50">
                        <AvatarFallback className="bg-gradient-to-br from-primary-600 to-primary-400 text-white font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 bg-black/75 backdrop-blur-md border border-white/10 shadow-xl p-1">
                    <DropdownMenuLabel>
                      <div className="flex items-center space-x-3 p-1.5">
                        <Avatar className="h-12 w-12 shadow-md border-2 border-white/30 bg-gradient-to-br from-primary-100/80 to-primary-600/50">
                          <AvatarFallback className="bg-gradient-to-br from-primary-600 to-primary-400 text-white font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-white/80 truncate">{user.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20 my-1" />
                    <DropdownMenuItem 
                      onClick={() => navigate('/settings')}
                      className="hover:bg-white/10 focus:bg-white/10 transition-colors rounded-md my-0.5 p-2.5 text-white"
                    >
                      <div className="mr-3 p-1.5 rounded-md bg-primary-600/20">
                        <Settings className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                      <span>Meu perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20 my-1" />
                    <DropdownMenuItem 
                      onClick={() => logout()}
                      className="hover:bg-red-900/20 focus:bg-red-900/20 transition-colors rounded-md my-0.5 p-2.5 text-white"
                    >
                      <div className="mr-3 p-1.5 rounded-md bg-red-700/20">
                        <LogOut className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                      <span className="text-white">Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
        )}
        
        {/* Main content */}
        <main 
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          id="main-content"
          role="main"
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
