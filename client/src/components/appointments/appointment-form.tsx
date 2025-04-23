import { useState, useEffect } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface Professional {
  id: number;
  userId: number;
  name: string;
  specialization?: string;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface AppointmentFormProps {
  clients: Client[];
  professionals: Professional[];
  services: Service[];
  initialDate?: Date;
  initialValues?: {
    id?: number;
    clientId: number;
    professionalId: number;
    serviceId: number;
    date: Date;
    startTime: string;
    endTime: string;
    notes?: string;
    status?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function AppointmentForm({
  clients,
  professionals,
  services,
  initialDate = new Date(),
  initialValues,
  onSubmit,
  onCancel,
  isLoading
}: AppointmentFormProps) {
  // Estados do formulário
  const [selectedClient, setSelectedClient] = useState<string>(initialValues?.clientId.toString() || "");
  const [selectedProfessional, setSelectedProfessional] = useState<string>(initialValues?.professionalId.toString() || "");
  const [selectedService, setSelectedService] = useState<string>(initialValues?.serviceId.toString() || "");
  const [date, setDate] = useState<Date | undefined>(initialValues?.date || initialDate);
  const [startTime, setStartTime] = useState<string>(initialValues?.startTime || "09:00");
  const [endTime, setEndTime] = useState<string>(initialValues?.endTime || "10:00");
  const [notes, setNotes] = useState<string>(initialValues?.notes || "");
  
  // Calcula o horário de término com base no serviço selecionado
  useEffect(() => {
    if (selectedService && startTime) {
      const service = services.find(s => s.id.toString() === selectedService);
      if (service) {
        // Calcula o horário de término com base na duração do serviço
        try {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0);
          
          const endDate = addMinutes(startDate, service.duration);
          setEndTime(format(endDate, "HH:mm"));
        } catch (error) {
          console.error("Erro ao calcular horário de término:", error);
        }
      }
    }
  }, [selectedService, startTime, services]);
  
  // Manipulador de envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !selectedClient || !selectedProfessional || !selectedService || !startTime || !endTime) {
      // Aqui você pode mostrar uma mensagem de erro ou validação
      return;
    }
    
    // Prepara os dados para envio
    const formattedDate = format(date, "yyyy-MM-dd");
    const startDateTime = `${formattedDate}T${startTime}:00`;
    const endDateTime = `${formattedDate}T${endTime}:00`;
    
    const appointmentData = {
      id: initialValues?.id, // Se for edição, inclui o ID
      clientId: parseInt(selectedClient),
      professionalId: parseInt(selectedProfessional),
      serviceId: parseInt(selectedService),
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
      status: initialValues?.status || "scheduled" // Status padrão para novos agendamentos
    };
    
    onSubmit(appointmentData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialValues?.id ? "Editar Agendamento" : "Novo Agendamento"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select
              value={selectedClient}
              onValueChange={setSelectedClient}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name} - {client.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seleção de Profissional */}
          <div className="space-y-2">
            <Label htmlFor="professional">Profissional</Label>
            <Select
              value={selectedProfessional}
              onValueChange={setSelectedProfessional}
            >
              <SelectTrigger id="professional">
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id.toString()}>
                    {professional.name} {professional.specialization ? `- ${professional.specialization}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seleção de Serviço */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço</Label>
            <Select
              value={selectedService}
              onValueChange={setSelectedService}
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - {service.duration} min - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Seleção de Data */}
          <div className="space-y-2">
            <Label>Data do Agendamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Seleção de Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Início</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Término</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1"
                  disabled={!selectedService} // Desabilita se nenhum serviço for selecionado
                />
              </div>
            </div>
          </div>
          
          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais sobre o agendamento"
              rows={3}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Salvando...
              </>
            ) : initialValues?.id ? "Atualizar" : "Agendar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 