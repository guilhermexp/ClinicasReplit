import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type AdicionarPagamentoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: number;
  clienteId?: number;
  appointmentId?: number;
};

export function AdicionarPagamentoDialog({
  open,
  onOpenChange,
  clinicId,
  clienteId,
  appointmentId,
}: AdicionarPagamentoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [notas, setNotas] = useState("");
  const [cliente, setCliente] = useState(clienteId?.toString() || "");
  
  const createPagamentoMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      clinicId: number;
      clientId: number;
      appointmentId?: number;
      paymentMethod: string;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/payments/create", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado com sucesso",
        description: "O pagamento foi adicionado ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/clinic", clinicId] });
      if (clienteId) {
        queryClient.invalidateQueries({ queryKey: ["/api/payments/client", clienteId] });
      }
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/payments/appointment", appointmentId] });
      }
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setValor("");
    setFormaPagamento("dinheiro");
    setNotas("");
    if (!clienteId) {
      setCliente("");
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
    
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }
    
    if (!cliente && !clienteId) {
      toast({
        title: "Cliente não selecionado",
        description: "Por favor, selecione um cliente para este pagamento.",
        variant: "destructive",
      });
      return;
    }
    
    const clientId = clienteId || parseInt(cliente);
    
    createPagamentoMutation.mutate({
      amount: valorNumerico,
      clinicId,
      clientId,
      appointmentId,
      paymentMethod: formaPagamento,
      notes: notas || undefined,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 border border-slate-200 shadow-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">Registrar Novo Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do pagamento a ser registrado.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {!clienteId && (
            <div className="grid grid-cols-12 items-center gap-2">
              <Label htmlFor="cliente" className="col-span-4 text-right">
                Cliente:
              </Label>
              <div className="col-span-8">
                <Input
                  id="cliente"
                  placeholder="ID do cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-12 items-center gap-2">
            <Label htmlFor="valor" className="col-span-4 text-right">
              Valor (R$):
            </Label>
            <div className="col-span-8">
              <Input
                id="valor"
                placeholder="0,00"
                value={valor}
                onChange={(e) => {
                  // Formatação para moeda brasileira
                  let value = e.target.value.replace(/\D/g, "");
                  value = (parseFloat(value) / 100).toFixed(2);
                  value = value.replace(".", ",");
                  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                  setValor(value === "0,00" ? "" : value);
                }}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-12 items-center gap-2">
            <Label htmlFor="formaPagamento" className="col-span-4 text-right">
              Forma de Pagamento:
            </Label>
            <div className="col-span-8">
              <Select
                value={formaPagamento}
                onValueChange={(value) => setFormaPagamento(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-12 items-center gap-2">
            <Label htmlFor="notas" className="col-span-4 text-right">
              Notas:
            </Label>
            <div className="col-span-8">
              <Input
                id="notas"
                placeholder="Observações sobre o pagamento"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPagamentoMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              {createPagamentoMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Pagamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}