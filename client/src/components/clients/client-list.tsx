import { Client } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, CalendarClock, Clock, MapPin, Mail, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientListProps {
  clients: Client[];
  selectedClientId: number | null;
  onSelectClient: (id: number) => void;
}

export default function ClientList({ clients, selectedClientId, onSelectClient }: ClientListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      <div className="space-y-1">
        {clients.map((client) => (
          <div
            key={client.id}
            className={`p-3 rounded-md cursor-pointer transition-colors flex items-start gap-3 ${
              selectedClientId === client.id
                ? "bg-primary/10 hover:bg-primary/15"
                : "hover:bg-muted"
            }`}
            onClick={() => onSelectClient(client.id)}
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <User className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-medium truncate">{client.name}</h3>
                <span className="text-xs text-muted-foreground">
                  {client.createdAt && 
                    format(new Date(client.createdAt), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <div className="mt-1 text-sm text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-1 truncate">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}