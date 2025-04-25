import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdicionarPagamentoDialogProps {
  clinicId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Schema para validação do formulário
const paymentSchema = z.object({
  clientId: z.string().min(1, { message: "Selecione um cliente" }),
  serviceId: z.string().min(1, { message: "Selecione um serviço" }),
  amount: z.string().min(1, { message: "Informe o valor" }),
  paymentMethod: z.string().min(1, { message: "Selecione o método de pagamento" }),
  paymentDate: z.date({ required_error: "Selecione a data do pagamento" }),
  status: z.string().min(1, { message: "Selecione o status" }),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const AdicionarPagamentoDialog: React.FC<AdicionarPagamentoDialogProps> = ({
  clinicId,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query para buscar clientes da clínica
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clinics", clinicId, "clients"],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/clients`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    },
    enabled: open && !!clinicId,
  });

  // Query para buscar serviços da clínica
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/clinics", clinicId, "services"],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/services`);
      if (!res.ok) throw new Error("Erro ao carregar serviços");
      return res.json();
    },
    enabled: open && !!clinicId,
  });

  // Configuração do hook form
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      clientId: "",
      serviceId: "",
      amount: "",
      paymentMethod: "",
      paymentDate: new Date(),
      status: "paid",
      notes: "",
    },
  });

  // Mutation para adicionar pagamento
  const mutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      // Convertendo clientId e serviceId para número e amount para decimal
      const payload = {
        ...values,
        clinicId,
        clientId: parseInt(values.clientId),
        serviceId: parseInt(values.serviceId),
        amount: parseFloat(values.amount.replace(/\./g, "").replace(",", "."))
      };
      
      const res = await apiRequest("POST", "/api/financial/payments", payload);
      return res.json();
    },
    onSuccess: () => {
      // Invalidar as queries de pagamentos para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "financial", "payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "financial", "stats"] });
      
      toast({
        title: "Pagamento adicionado",
        description: "O pagamento foi registrado com sucesso.",
        variant: "default"
      });
      
      // Fechar o dialog e resetar o formulário
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar pagamento",
        description: error.message || "Ocorreu um erro ao registrar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Handler do envio do formulário
  const onSubmit = (values: PaymentFormValues) => {
    mutation.mutate(values);
  };

  // Formatar campo de valor monetário
  const formatCurrency = (value: string) => {
    // Remover todos os caracteres não numéricos
    let numericValue = value.replace(/\D/g, "");
    
    // Converter para número, dividir por 100 para considerar os centavos e formatar
    if (numericValue) {
      const number = parseInt(numericValue, 10) / 100;
      return number.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Pagamento</DialogTitle>
          <DialogDescription>
            Registre um novo pagamento no sistema. Preencha todos os campos necessários.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingClients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Auto-preencher o valor do serviço
                      if (value && services) {
                        const selectedService = services.find((s: any) => s.id.toString() === value);
                        if (selectedService) {
                          form.setValue("amount", formatCurrency(selectedService.price.toString()));
                        }
                      }
                    }}
                    defaultValue={field.value}
                    disabled={isLoadingServices}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services?.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {formatCurrency(service.price.toString())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field: { onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        {...field}
                        className="pl-9"
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          e.target.value = formatted;
                          onChange(e);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="bank_transfer">Transferência</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Pagamento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações adicionais sobre o pagamento" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarPagamentoDialog;