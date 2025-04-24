import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, RotateCcw } from "lucide-react";
import { Payment } from "@shared/schema";

type ReembolsarPagamentoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
};

export function ReembolsarPagamentoDialog({
  open,
  onOpenChange,
  payment,
}: ReembolsarPagamentoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [reembolsoTotal, setReembolsoTotal] = useState(true);
  
  const refundPagamentoMutation = useMutation({
    mutationFn: async (data: { paymentId: number; amount?: number; reason?: string }) => {
      const res = await apiRequest("POST", "/api/payments/refund", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reembolso processado com sucesso",
        description: "O status do pagamento foi atualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/clinic", payment.clinicId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/client", payment.clientId] });
      if (payment.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/payments/appointment", payment.appointmentId] });
      }
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar reembolso",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleReembolsar = () => {
    const data: { paymentId: number; amount?: number; reason?: string } = {
      paymentId: payment.id,
    };
    
    if (!reembolsoTotal) {
      const valorNumerico = parseFloat(valor.replace(/\./g, "").replace(",", "."));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        toast({
          title: "Valor inválido",
          description: "Por favor, informe um valor válido para o reembolso.",
          variant: "destructive",
        });
        return;
      }
      
      // Converter para centavos
      data.amount = Math.round(valorNumerico * 100);
      
      if (data.amount > payment.amount) {
        toast({
          title: "Valor inválido",
          description: "O valor do reembolso não pode ser maior que o valor do pagamento.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (motivo) {
      data.reason = motivo;
    }
    
    refundPagamentoMutation.mutate(data);
  };
  
  // Formatar valor para moeda brasileira
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 border border-slate-200 shadow-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">Reembolsar Pagamento</DialogTitle>
          <DialogDescription>
            Você está prestes a reembolsar um pagamento. Informe os detalhes abaixo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
            <div className="font-semibold text-slate-700">ID do Pagamento:</div>
            <div>{payment.id}</div>
            
            <div className="font-semibold text-slate-700">Valor Original:</div>
            <div className="font-medium text-green-700">{formatarValor(payment.amount)}</div>
            
            <div className="font-semibold text-slate-700">Cliente:</div>
            <div>ID: {payment.clientId}</div>
            
            {payment.appointmentId && (
              <>
                <div className="font-semibold text-slate-700">Agendamento:</div>
                <div>ID: {payment.appointmentId}</div>
              </>
            )}
          </div>
          
          <div className="flex items-center mt-4 mb-2">
            <input
              type="checkbox"
              id="reembolsoTotal"
              checked={reembolsoTotal}
              onChange={() => setReembolsoTotal(!reembolsoTotal)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="reembolsoTotal" className="ml-2">
              Reembolso total
            </Label>
          </div>
          
          {!reembolsoTotal && (
            <div className="mt-3">
              <Label htmlFor="valor" className="block mb-1">
                Valor a reembolsar (R$):
              </Label>
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
          )}
          
          <div className="mt-3">
            <Label htmlFor="motivo" className="block mb-1">
              Motivo do reembolso:
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo do reembolso"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="resize-none h-20"
            />
          </div>
          
          <div className="mt-4 bg-red-50 p-3 rounded-md text-red-800 text-sm">
            <p>
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Certifique-se de que todas as informações estão corretas antes de prosseguir.
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleReembolsar}
            disabled={refundPagamentoMutation.isPending}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800"
          >
            {refundPagamentoMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Processar Reembolso
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}