import { ReactNode, useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import { Loader2, BellIcon, Search, User, Settings, LogOut } from "lucide-react";
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
  <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
    <Skeleton className="h-6 w-40" />
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-64 hidden md:block" />
      <Skeleton className="h-10 w-10 rounded-full" />
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
        <div className="glass-card p-8 shadow-lg floating">
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
            className="h-16 glass-card backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 mx-4 mt-4 rounded-xl"
            role="banner"
            aria-label="Cabeçalho principal"
          >
            <div className="flex items-center">
              {selectedClinic && (
                <h2 className="text-lg font-medium gradient-text hidden md:block">
                  {selectedClinic.name}
                </h2>
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Barra de pesquisa responsiva */}
              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isSearchOpen ? "w-full md:w-64" : "w-0 md:w-64"
              )}>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input 
                    type="search" 
                    placeholder="Pesquisar..." 
                    className="pl-8 h-9 md:h-10 w-full bg-transparent border-muted/50 focus:border-primary/50 focus:ring-primary/25"
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
                  className="md:hidden text-foreground/80 hover:text-foreground hover:bg-transparent"
                  aria-label={isSearchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
                  aria-expanded={isSearchOpen}
                  aria-controls="search-input"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                </Button>
              )}
              
              {/* Notificações */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-foreground/80 hover:text-foreground hover:bg-transparent"
                aria-label="Notificações"
              >
                <BellIcon className="h-5 w-5" aria-hidden="true" />
                <span 
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-md"
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
                      className="rounded-full h-9 w-9 md:h-10 md:w-10 hover:bg-transparent hover:shadow-md transition-shadow"
                      aria-label="Menu do usuário"
                    >
                      <Avatar className="h-9 w-9 md:h-10 md:w-10 shadow-md border-2 border-white/50">
                        <AvatarFallback className={getAvatarColor(user.name)}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-card">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium gradient-text">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem 
                      onClick={() => navigate('/settings')}
                      className="hover:bg-primary/10 focus:bg-primary/10 transition-colors"
                    >
                      <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Meu perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30" />
                    <DropdownMenuItem 
                      onClick={() => logout()}
                      className="hover:bg-destructive/10 focus:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>Sair</span>
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
