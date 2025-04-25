import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Copy,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePermissionsContext2 } from "@/hooks/use-permissions-context";
import { getInitials, getAvatarColor } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarProps {
  className?: string;
}

// Componente de carregamento para o avatar
const AvatarSkeleton = () => (
  <div className="flex flex-col items-center">
    <Skeleton className="h-16 w-16 rounded-full mb-2" />
    <Skeleton className="h-4 w-24 mb-1" />
    <Skeleton className="h-3 w-16" />
  </div>
);

// Componente de carregamento para itens de navegação
const NavItemSkeleton = () => (
  <div className="px-3 py-2">
    <Skeleton className="h-8 w-full rounded-md" />
  </div>
);

export function Sidebar({ className }: SidebarProps) {
  const { user, logout, clinics, selectedClinic, setSelectedClinic } = useAuth();
  const { hasPermission } = usePermissionsContext2();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simular carregamento de dados
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Close sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);
  
  // Update sidebar open state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
    // Sempre expandir em dispositivos móveis quando aberto
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    
    // Anunciar para leitores de tela
    const message = isCollapsed ? "Menu expandido" : "Menu recolhido";
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };
  
  const handleClinicChange = (clinicId: string) => {
    const clinic = clinics.find(c => c.id.toString() === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
    }
  };
  
  const handleLogout = async () => {
    await logout();
  };
  
  // Mobile menu button
  const MobileMenuButton = () => (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={toggleSidebar}
        className="p-2 rounded-full glass-card backdrop-blur-md shadow-lg border-white/20 text-foreground hover:shadow-xl transition-all"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        aria-controls="sidebar-menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
    </div>
  );
  
  // If sidebar is closed on mobile, just show the menu button
  if (isMobile && !isOpen) {
    return <MobileMenuButton />;
  }
  
  // Navegação
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/dashboard" || location === "/"
    },
    {
      name: "Clientes",
      path: "/clients",
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/clients"
    },
    {
      name: "Agenda",
      path: "/appointments",
      icon: <Calendar className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/appointments"
    },
    {
      name: "Financeiro",
      path: "/financeiro",
      icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/financial" || location.startsWith("/financeiro")
    },
    {
      name: "Controle de Ponto",
      path: "/attendance",
      icon: <Clock className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/attendance"
    },
    {
      name: "CRM",
      path: "/crm",
      icon: <Copy className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/crm"
    },
    {
      name: "Usuários",
      path: "/users",
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/users"
    },
    {
      name: "Configurações",
      path: "/settings",
      icon: <Settings className="h-5 w-5" aria-hidden="true" />,
      isActive: location === "/settings"
    }
  ];
  
  return (
    <>
      <MobileMenuButton />
      
      <aside 
        className={cn(
          "z-40 flex flex-col glass-card sidebar-gradient transition-all duration-300 shadow-xl",
          isMobile ? "fixed inset-y-0 left-0 m-4 rounded-xl h-[calc(100%-2rem)]" : "h-screen ml-4 my-4 rounded-xl",
          isCollapsed && !isMobile ? "w-20" : "w-64",
          className
        )}
        id="sidebar-menu"
        aria-label="Menu de navegação principal"
        role="navigation"
      >
        {/* Logo e botão de colapso */}
        <div className="flex items-center justify-between h-16 border-b border-white/10 text-white px-4">
          {!isCollapsed && (
            <h1 className="text-2xl font-heading font-bold">Gardenia</h1>
          )}
          {isCollapsed && (
            <span className="text-2xl font-bold mx-auto">G</span>
          )}
          
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleCollapse}
              className="text-white hover:bg-white/10 h-8 w-8"
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!isCollapsed}
            >
              <ChevronRight className={cn(
                "h-5 w-5 transition-transform",
                isCollapsed ? "rotate-180" : ""
              )} aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className={cn(
            "flex border-b border-white/10",
            isCollapsed ? "flex-col items-center py-4" : "flex-col items-center pt-5 pb-4"
          )}>
            {isLoading ? (
              <AvatarSkeleton />
            ) : (
              <>
                <Avatar className={cn(
                  "relative mb-2 shadow-lg border-2 border-white/20",
                  isCollapsed ? "h-10 w-10" : "h-16 w-16"
                )}>
                  <AvatarFallback className={getAvatarColor(user.name)}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                  <div 
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white/60 shadow-md"
                    aria-label="Online"
                  ></div>
                </Avatar>
                
                {!isCollapsed && (
                  <>
                    <h2 className="text-lg font-semibold text-white">{user.name}</h2>
                    <p className="text-sm text-white/70">{user.role}</p>
                    
                    {/* Clinic Selector */}
                    {clinics.length > 0 && (
                      <div className="mt-2 w-48">
                        <Select 
                          value={selectedClinic?.id.toString()} 
                          onValueChange={handleClinicChange}
                          aria-label="Selecionar clínica"
                        >
                          <SelectTrigger className="text-sm glass-card text-white border-white/20 bg-white/10 focus:ring-white/20">
                            <SelectValue placeholder="Selecione uma clínica" />
                          </SelectTrigger>
                          <SelectContent className="glass-card">
                            {clinics.map(clinic => (
                              <SelectItem 
                                key={clinic.id} 
                                value={clinic.id.toString()}
                                className="focus:bg-white/10"
                              >
                                {clinic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Menu principal">
          <div className={cn(
            "space-y-2",
            isCollapsed ? "px-2" : "px-3"
          )}>
            {isLoading ? (
              // Esqueletos de carregamento para itens de navegação
              Array(7).fill(0).map((_, index) => (
                <NavItemSkeleton key={index} />
              ))
            ) : (
              navItems.map((item) => (
                <TooltipProvider key={item.path} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.path)}
                        className={cn(
                          "flex items-center rounded-xl w-full transition-all backdrop-blur-sm",
                          isCollapsed ? "justify-center p-3" : "px-3 py-3 text-left",
                          item.isActive
                            ? "bg-white/20 text-white shadow-md"
                            : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-sm"
                        )}
                        aria-current={item.isActive ? "page" : undefined}
                        aria-label={item.name}
                      >
                        <span className={cn(
                          "transition-transform",
                          item.isActive ? "text-white scale-110" : "text-white/80",
                          isCollapsed ? "" : "mr-3"
                        )}>
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span className={cn(
                            "text-sm font-medium",
                            item.isActive && "font-semibold"
                          )}>
                            {item.name}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="glass-card text-white border-white/20 bg-primary/80">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))
            )}
          </div>
        </nav>

        {/* Email info and Logout */}
        <div className="border-t border-white/10 p-4">
          {user && !isCollapsed && !isLoading && (
            <div className="mb-3 text-xs text-white/70 truncate">
              {user.email}
            </div>
          )}
          {isLoading ? (
            <Skeleton className="h-8 w-full rounded-md" />
          ) : (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "flex items-center text-sm text-white/80 hover:text-white transition-colors",
                      isCollapsed ? "justify-center w-full" : "w-full"
                    )}
                    aria-label="Sair do sistema"
                  >
                    <LogOut className={cn(
                      "h-5 w-5",
                      isCollapsed ? "" : "mr-3"
                    )} aria-hidden="true" />
                    {!isCollapsed && <span>Sair</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="glass-card text-white border-white/20 bg-primary/80">
                    Sair
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
