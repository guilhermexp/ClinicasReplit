import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppointmentStatus, LeadStatus } from "@shared/crm";
import { Lead } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema para validação do formulário
const appointmentFormSchema = z.object({
  leadId: z.coerce.number(),
  procedimento: z.string().min(2, "Procedimento é obrigatório"),
  data: z.date({
    required_error: "Data é obrigatória",
  }),
  horario: z.string().min(1, "Horário é obrigatório"),
  observacoes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.PENDENTE)
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function AddAppointmentDialog({ 
  open, 
  onOpenChange, 
  lead,
  onSuccess 
}: AddAppointmentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      leadId: lead?.id,
      procedimento: lead?.procedimentoInteresse || "",
      data: new Date(),
      horario: "",
      observacoes: "",
      status: AppointmentStatus.PENDENTE
    }
  });

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Cadastrar o agendamento
      await apiRequest("POST", "/api/lead-appointments", data);
      
      // Atualizar o status do lead para Agendado, se ainda não estiver
      if (lead.status !== LeadStatus.AGENDADO && lead.status !== LeadStatus.CONVERTIDO) {
        await apiRequest("PATCH", `/api/leads/${data.leadId}`, {
          status: LeadStatus.AGENDADO
        });
      }
      
      // Registrar uma interação automática sobre o agendamento
      await apiRequest("POST", "/api/lead-interactions", {
        leadId: data.leadId,
        tipo: "Sistema",
        descricao: `Agendamento realizado para ${format(data.data, "dd/MM/yyyy")} às ${data.horario} - ${data.procedimento}`,
        responsavel: "Sistema"
      });
      
      // Invalidar queries para atualizar as listas
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/appointments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/interactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${lead.clinicId}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${lead.clinicId}/crm/stats`] });
      
      toast({
        title: "Agendamento realizado com sucesso!",
        description: `Consulta agendada para ${format(data.data, "dd/MM/yyyy")} às ${data.horario}.`,
      });
      
      // Resetar o form e fechar o diálogo
      form.reset();
      onOpenChange(false);
      
      // Callback de sucesso (opcional)
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      toast({
        title: "Erro ao agendar consulta",
        description: "Ocorreu um erro ao agendar a consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background/80 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agendar Consulta</DialogTitle>
          <DialogDescription>
            Agende uma consulta para o lead {lead?.nome}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <FormField
                control={form.control}
                name="procedimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento*</FormLabel>
                    <FormControl>
                      <Input placeholder="Procedimento de interesse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="horario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário*</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AppointmentStatus.PENDENTE}>Pendente</SelectItem>
                        <SelectItem value={AppointmentStatus.CONFIRMADO}>Confirmado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o agendamento..."
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="gap-1"
              >
                {isSubmitting ? "Agendando..." : "Agendar Consulta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}