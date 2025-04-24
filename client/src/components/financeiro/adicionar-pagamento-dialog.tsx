import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type AdicionarPagamentoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: number;
  clientId?: number;
  appointmentId?: number;
};

const formSchema = z.object({
  amount: z.string().min(1, "O valor é obrigatório"),
  clientId: z.string().min(1, "O cliente é obrigatório"),
  paymentMethod: z.string().min(1, "O método de pagamento é obrigatório"),
  appointmentId: z.string().optional(),
  notes: z.string().optional(),
});

export function AdicionarPagamentoDialog({
  open,
  onOpenChange,
  clinicId,
  clientId,
  appointmentId,
}: AdicionarPagamentoDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  // Configuração do formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      clientId: clientId ? clientId.toString() : "",
      appointmentId: appointmentId ? appointmentId.toString() : "",
      paymentMethod: "",
      notes: "",
    },
  });

  // Buscar clientes da clínica
  const { data: clients = [] } = useQuery({
    queryKey: [`/api/clinics/${clinicId}/clients`],
    enabled: !!clinicId && open && !clientId,
  });

  // Buscar agendamentos do cliente (opcional)
  const { data: appointments = [] } = useQuery({
    queryKey: [`/api/clients/${form.watch("clientId")}/appointments`],
    enabled: !!form.watch("clientId") && open && !appointmentId,
  });

  // Mutation para adicionar pagamento
  const createPaymentMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      clinicId: number;
      clientId: number;
      createdBy: number;
      appointmentId?: number;
      paymentMethod?: string;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/payments/create", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento adicionado com sucesso",
        description: "O novo pagamento foi registrado no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payments/clinic/${clinicId}`] });
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/payments/client/${clientId}`] });
      }
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/payments/appointment/${appointmentId}`] });
      }
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar pagamento",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Marcar componente como montado (evita problemas com SSR)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset do formulário quando o diálogo abre
  useEffect(() => {
    if (open) {
      form.reset({
        amount: "",
        clientId: clientId ? clientId.toString() : "",
        appointmentId: appointmentId ? appointmentId.toString() : "",
        paymentMethod: "",
        notes: "",
      });
    }
  }, [open, form, clientId, appointmentId]);

  // Manipulador de envio do formulário
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar um pagamento.",
        variant: "destructive",
      });
      return;
    }

    // Converter valor de string para número (em centavos)
    const amountValue = parseFloat(values.amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(amountValue)) {
      form.setError("amount", { message: "Valor inválido" });
      return;
    }

    // Preparar dados para envio
    const paymentData = {
      amount: Math.round(amountValue * 100), // Converter para centavos
      clinicId: clinicId,
      clientId: parseInt(values.clientId),
      createdBy: user.id,
      paymentMethod: values.paymentMethod,
      notes: values.notes,
    };

    // Adicionar appointmentId se fornecido
    if (values.appointmentId) {
      paymentData.appointmentId = parseInt(values.appointmentId);
    }

    createPaymentMutation.mutate(paymentData);
  };

  if (!isMounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white/95 border border-slate-200 shadow-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">Adicionar Novo Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para registrar um novo pagamento no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => {
                          // Formatação para moeda brasileira
                          let value = e.target.value.replace(/\D/g, "");
                          if (value === "") {
                            field.onChange("");
                            return;
                          }
                          value = (parseFloat(value) / 100).toFixed(2);
                          value = value.replace(".", ",");
                          value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pagamento*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="debito">Cartão de Débito</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!clientId && (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name} (#{client.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!appointmentId && form.watch("clientId") && (
              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agendamento (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Associar a um agendamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum (pagamento avulso)</SelectItem>
                        {appointments.map((appointment: any) => (
                          <SelectItem key={appointment.id} value={appointment.id.toString()}>
                            #{appointment.id} - {new Date(appointment.date).toLocaleDateString('pt-BR')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione observações sobre o pagamento"
                      className="h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPaymentMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                {createPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Adicionar Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}