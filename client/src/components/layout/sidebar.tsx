import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { getInitials, getAvatarColor } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout, clinics, selectedClinic, setSelectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  // Close sidebar on mobile when location changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);
  
  // Update sidebar open state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
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
        className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
    </div>
  );
  
  // If sidebar is closed on mobile, just show the menu button
  if (isMobile && !isOpen) {
    return <MobileMenuButton />;
  }
  
  return (
    <>
      <MobileMenuButton />
      
      <aside 
        className={cn(
          "z-40 flex flex-col w-64 bg-white border-r border-gray-200 transition-all duration-300",
          isMobile ? "fixed inset-y-0 left-0" : "h-screen",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-primary-500 text-white">
          <h1 className="text-2xl font-heading font-bold">Gardenia</h1>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex flex-col items-center pt-5 pb-4 border-b border-gray-200">
            <div className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center mb-2",
              getAvatarColor(user.name)
            )}>
              <span className="text-xl font-semibold">{getInitials(user.name)}</span>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.role}</p>
            
            {/* Clinic Selector */}
            {clinics.length > 0 && (
              <div className="mt-2 w-48">
                <Select 
                  value={selectedClinic?.id.toString()} 
                  onValueChange={handleClinicChange}
                >
                  <SelectTrigger className="text-sm bg-white">
                    <SelectValue placeholder="Selecione uma clínica" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map(clinic => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1">
            {/* Dashboard - Sempre visível */}
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/dashboard" || location === "/"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </button>
            
            {/* Clients - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/clients')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/clients"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Users className="mr-3 h-5 w-5" />
              Clientes
            </button>
            
            {/* Appointments - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/appointments')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/appointments"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Calendar className="mr-3 h-5 w-5" />
              Agenda
            </button>
            
            {/* Financial - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/financial')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/financial"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <DollarSign className="mr-3 h-5 w-5" />
              Financeiro
            </button>
            
            {/* CRM - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/crm')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/crm"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Copy className="mr-3 h-5 w-5" />
              CRM
            </button>
            
            {/* Users - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/users')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/users"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Users className="mr-3 h-5 w-5" />
              Usuários
            </button>
            
            {/* Settings - Temporariamente sempre visível */}
            <button
              onClick={() => navigate('/settings')}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left",
                location === "/settings"
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Settings className="mr-3 h-5 w-5" />
              Configurações
            </button>
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center text-sm text-gray-700 hover:text-primary-600"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
