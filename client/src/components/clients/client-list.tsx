import { Client } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, CalendarClock, Clock, MapPin, Mail, Phone, Calendar, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, getAvatarColor } from "@/lib/auth-utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientListProps {
  clients: Client[];
  selectedClientId: number | null;
  onSelectClient: (id: number) => void;
}

export default function ClientList({ clients, selectedClientId, onSelectClient }: ClientListProps) {
  // Função para calcular a data da última visita
  const getLastVisitLabel = (lastVisit: Date | string | null | undefined): string => {
    if (!lastVisit) return "Sem visitas";
    
    const visitDate = lastVisit instanceof Date ? lastVisit : new Date(lastVisit);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - visitDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };
  
  // Função para obter a cor do status do cliente
  const getClientStatusColor = (client: Client): string => {
    // Aqui você pode implementar lógica baseada em algum campo do cliente
    // Por exemplo, baseado na data da última visita
    if (!client.lastVisit) return "bg-gray-100 text-gray-800";
    
    const lastVisit = client.lastVisit instanceof Date ? client.lastVisit : new Date(client.lastVisit);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return "bg-green-100 text-green-800";
    if (diffDays < 90) return "bg-blue-100 text-blue-800";
    if (diffDays < 180) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };
  
  // Função para obter o label do status do cliente
  const getClientStatusLabel = (client: Client): string => {
    if (!client.lastVisit) return "Novo";
    
    const lastVisit = client.lastVisit instanceof Date ? client.lastVisit : new Date(client.lastVisit);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return "Ativo";
    if (diffDays < 90) return "Regular";
    if (diffDays < 180) return "Infrequente";
    return "Inativo";
  };

  return (
    <div className="divide-y divide-gray-100">
      {clients.map((client) => (
        <div
          key={client.id}
          className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedClientId === client.id
              ? "bg-primary-50"
              : ""
          }`}
          onClick={() => onSelectClient(client.id)}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className={getAvatarColor(client.name)}>
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 truncate">{client.name}</h3>
                  
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                    {client.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    
                    {client.email && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 max-w-[150px]">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{client.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={getClientStatusColor(client)}>
                    {getClientStatusLabel(client)}
                  </Badge>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{getLastVisitLabel(client.lastVisit)}</span>
                  </div>
                </div>
              </div>
              
              {client.address && (
                <div className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{client.address}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex justify-between items-center">
            <div className="flex gap-1">
              {/* Aqui você pode adicionar tags ou outras informações relevantes */}
              {client.tags && client.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {client.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {client.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{client.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onSelectClient(client.id);
                }}>
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Agendar consulta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Enviar mensagem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
