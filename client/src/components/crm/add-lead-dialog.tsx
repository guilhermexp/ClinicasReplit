import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LeadSource, LeadStatus } from "@shared/crm";

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
const leadFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().min(8, "Telefone deve ter pelo menos 8 dígitos"),
  fonte: z.nativeEnum(LeadSource),
  procedimentoInteresse: z.string().optional(),
  valorEstimado: z.coerce.number().min(0).optional(),
  responsavel: z.string().optional(),
  observacoes: z.string().optional(),
  clinicId: z.coerce.number()
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: number;
  onSuccess?: () => void;
}

export function AddLeadDialog({ 
  open, 
  onOpenChange, 
  clinicId,
  onSuccess 
}: AddLeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      fonte: LeadSource.OUTRO,
      procedimentoInteresse: "",
      valorEstimado: 0,
      responsavel: "",
      observacoes: "",
      clinicId
    }
  });

  const onSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/leads", {
        ...data,
        status: LeadStatus.NOVO
      });
      
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${clinicId}/leads`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clinics/${clinicId}/crm/stats`] });
      
      toast({
        title: "Lead adicionado com sucesso!",
        description: "O novo lead foi cadastrado e está pronto para seguimento.",
      });
      
      // Resetar o form e fechar o diálogo
      form.reset();
      onOpenChange(false);
      
      // Callback de sucesso (opcional)
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao adicionar lead:", error);
      toast({
        title: "Erro ao adicionar lead",
        description: "Ocorreu um erro ao cadastrar o lead. Tente novamente.",
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
          <DialogTitle className="text-2xl">Adicionar Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo potencial cliente para sua clínica.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone*</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="fonte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LeadSource.INSTAGRAM}>Instagram</SelectItem>
                          <SelectItem value={LeadSource.FACEBOOK}>Facebook</SelectItem>
                          <SelectItem value={LeadSource.SITE}>Site</SelectItem>
                          <SelectItem value={LeadSource.INDICACAO}>Indicação</SelectItem>
                          <SelectItem value={LeadSource.GOOGLE}>Google</SelectItem>
                          <SelectItem value={LeadSource.WHATSAPP}>WhatsApp</SelectItem>
                          <SelectItem value={LeadSource.OUTRO}>Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="procedimentoInteresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimento de Interesse</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Botox, Preenchimento..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="valorEstimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="1" 
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
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
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Informações adicionais sobre o lead..."
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
                name="clinicId"
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
                {isSubmitting ? "Salvando..." : "Adicionar Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}