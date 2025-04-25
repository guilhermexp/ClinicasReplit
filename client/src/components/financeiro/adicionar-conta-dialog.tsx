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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, CreditCard, Landmark, Wallet } from "lucide-react";

interface AdicionarContaDialogProps {
  clinicId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Schema para validação do formulário
const accountSchema = z.object({
  name: z.string().min(1, { message: "Nome da conta é obrigatório" }),
  type: z.string().min(1, { message: "Tipo de conta é obrigatório" }),
  bankName: z.string().min(1, { message: "Nome do banco é obrigatório" }),
  accountNumber: z.string().min(1, { message: "Número da conta é obrigatório" }),
  balance: z.string().min(1, { message: "Saldo inicial é obrigatório" }),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

const AdicionarContaDialog: React.FC<AdicionarContaDialogProps> = ({
  clinicId,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tipos de contas
  const accountTypes = [
    { value: "checking", label: "Conta Corrente", icon: <Building className="h-4 w-4 mr-2" /> },
    { value: "savings", label: "Poupança", icon: <Landmark className="h-4 w-4 mr-2" /> },
    { value: "credit_card", label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4 mr-2" /> },
    { value: "investment", label: "Investimentos", icon: <Wallet className="h-4 w-4 mr-2" /> },
    { value: "cash", label: "Caixa", icon: <Wallet className="h-4 w-4 mr-2" /> },
    { value: "other", label: "Outro", icon: <Wallet className="h-4 w-4 mr-2" /> },
  ];

  // Configuração do hook form
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "",
      bankName: "",
      accountNumber: "",
      balance: "0,00",
      isActive: true,
      description: "",
    },
  });

  // Mutation para adicionar conta
  const mutation = useMutation({
    mutationFn: async (values: AccountFormValues) => {
      // Converter balance para número decimal
      const payload = {
        ...values,
        clinicId,
        balance: parseFloat(values.balance.replace(/\./g, "").replace(",", "."))
      };
      
      const res = await apiRequest("POST", "/api/financial/accounts", payload);
      return res.json();
    },
    onSuccess: () => {
      // Invalidar as queries de contas para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "financial", "accounts"] });
      
      toast({
        title: "Conta adicionada",
        description: "A conta financeira foi registrada com sucesso.",
      });
      
      // Fechar o dialog e resetar o formulário
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar conta",
        description: error.message || "Ocorreu um erro ao registrar a conta. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Handler do envio do formulário
  const onSubmit = (values: AccountFormValues) => {
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
          <DialogTitle>Adicionar Conta Financeira</DialogTitle>
          <DialogDescription>
            Registre uma nova conta financeira no sistema. Preencha todos os campos necessários.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Conta Principal, Cartão Empresarial" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Conta</FormLabel>
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
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              {type.icon}
                              {type.label}
                            </div>
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
                name="balance"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial</FormLabel>
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
            </div>
            
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Banco / Instituição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Banco do Brasil, Nubank, XP Investimentos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Conta / Identificação</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: 12345-6, 9876-5432-1, VGBL123" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Informações adicionais sobre a conta" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Conta Ativa</FormLabel>
                    <FormDescription className="text-xs">
                      Contas inativas não aparecem em algumas análises
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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

export default AdicionarContaDialog;