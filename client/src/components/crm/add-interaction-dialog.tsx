import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InteractionType, LeadStatus } from "@shared/crm";
import { Lead } from "@shared/schema";

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

// Schema para validação do formulário
const interactionFormSchema = z.object({
  leadId: z.coerce.number(),
  tipo: z.nativeEnum(InteractionType),
  descricao: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  responsavel: z.string().min(2, "Nome do responsável é obrigatório"),
  novoStatus: z.nativeEnum(LeadStatus).optional()
});

type InteractionFormValues = z.infer<typeof interactionFormSchema>;

interface AddInteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSuccess?: () => void;
}

export function AddInteractionDialog({ 
  open, 
  onOpenChange, 
  lead,
  onSuccess 
}: AddInteractionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      leadId: lead?.id,
      tipo: InteractionType.TELEFONE,
      descricao: "",
      responsavel: "",
      novoStatus: undefined
    }
  });

  const onSubmit = async (data: InteractionFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Primeiro, cadastrar a interação
      await apiRequest("POST", "/api/lead-interactions", {
        leadId: data.leadId,
        tipo: data.tipo,
        descricao: data.descricao,
        responsavel: data.responsavel
      });
      
      // Se houver mudança de status, atualizar o lead
      if (data.novoStatus && data.novoStatus !== lead.status) {
        await apiRequest("PATCH", `/api/leads/${data.leadId}`, {
          status: data.novoStatus
        });
      }
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [`/api/leads/${lead.id}/interactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${lead.clinicId}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${lead.clinicId}/crm/stats`] });
      
      toast({
        title: "Interação registrada com sucesso!",
        description: "A interação foi registrada e o histórico foi atualizado.",
      });
      
      // Resetar o form e fechar o diálogo
      form.reset();
      onOpenChange(false);
      
      // Callback de sucesso (opcional)
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao registrar interação:", error);
      toast({
        title: "Erro ao registrar interação",
        description: "Ocorreu um erro ao registrar a interação. Tente novamente.",
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
          <DialogTitle className="text-2xl">Registrar Interação</DialogTitle>
          <DialogDescription>
            Registre uma nova interação com o lead {lead?.nome}.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Interação*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={InteractionType.TELEFONE}>Telefone</SelectItem>
                          <SelectItem value={InteractionType.EMAIL}>Email</SelectItem>
                          <SelectItem value={InteractionType.WHATSAPP}>WhatsApp</SelectItem>
                          <SelectItem value={InteractionType.PRESENCIAL}>Presencial</SelectItem>
                          <SelectItem value={InteractionType.INSTAGRAM}>Instagram</SelectItem>
                          <SelectItem value={InteractionType.FACEBOOK}>Facebook</SelectItem>
                          <SelectItem value={InteractionType.OUTRO}>Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Interação*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a interação realizada..."
                        className="resize-none min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="novoStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atualizar Status do Lead?</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione para atualizar o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LeadStatus.NOVO}>Novo</SelectItem>
                        <SelectItem value={LeadStatus.EM_CONTATO}>Em contato</SelectItem>
                        <SelectItem value={LeadStatus.AGENDADO}>Agendado</SelectItem>
                        <SelectItem value={LeadStatus.CONVERTIDO}>Convertido</SelectItem>
                        <SelectItem value={LeadStatus.PERDIDO}>Perdido</SelectItem>
                      </SelectContent>
                    </Select>
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
                {isSubmitting ? "Salvando..." : "Registrar Interação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}