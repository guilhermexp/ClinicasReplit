import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface AdicionarDespesaDialogProps {
  clinicId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Schema para validação do formulário
const expenseSchema = z.object({
  description: z.string().min(1, { message: "Descrição é obrigatória" }),
  amount: z.string().min(1, { message: "Valor é obrigatório" }),
  category: z.string().min(1, { message: "Categoria é obrigatória" }),
  dueDate: z.date({ required_error: "Data de vencimento é obrigatória" }),
  status: z.string().min(1, { message: "Status é obrigatório" }),
  supplierName: z.string().optional(),
  supplierContact: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const AdicionarDespesaDialog: React.FC<AdicionarDespesaDialogProps> = ({
  clinicId,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Categorias de despesas
  const expenseCategories = [
    { value: "rent", label: "Aluguel" },
    { value: "utilities", label: "Serviços públicos" },
    { value: "salary", label: "Salários" },
    { value: "marketing", label: "Marketing" },
    { value: "supplies", label: "Suprimentos" },
    { value: "equipment", label: "Equipamentos" },
    { value: "maintenance", label: "Manutenção" },
    { value: "taxes", label: "Impostos" },
    { value: "insurance", label: "Seguros" },
    { value: "software", label: "Software" },
    { value: "training", label: "Treinamento" },
    { value: "travel", label: "Viagens" },
    { value: "other", label: "Outros" }
  ];

  // Configuração do hook form
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      dueDate: new Date(),
      status: "pending",
      supplierName: "",
      supplierContact: "",
      notes: "",
    },
  });

  // Mutation para adicionar despesa
  const mutation = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
      // Converter amount para número decimal
      const payload = {
        ...values,
        clinicId,
        createdBy: 1, // Assumindo que temos o ID do usuário atual
        amount: parseFloat(values.amount.replace(/\./g, "").replace(",", "."))
      };
      
      const res = await apiRequest("POST", "/api/financial/expenses", payload);
      return res.json();
    },
    onSuccess: () => {
      // Invalidar as queries de despesas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "financial", "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "financial", "stats"] });
      
      toast({
        title: "Despesa adicionada",
        description: "A despesa foi registrada com sucesso.",
      });
      
      // Fechar o dialog e resetar o formulário
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar despesa",
        description: error.message || "Ocorreu um erro ao registrar a despesa. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Handler do envio do formulário
  const onSubmit = (values: ExpenseFormValues) => {
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
          <DialogTitle>Adicionar Despesa</DialogTitle>
          <DialogDescription>
            Registre uma nova despesa no sistema. Preencha todos os campos necessários.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descrição da despesa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
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
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
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
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="scheduled">Agendado</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="recurring">Recorrente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do fornecedor (opcional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="supplierContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato do Fornecedor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Email ou telefone do fornecedor (opcional)" />
                  </FormControl>
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
                    <Textarea {...field} placeholder="Observações adicionais sobre a despesa" />
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

export default AdicionarDespesaDialog;