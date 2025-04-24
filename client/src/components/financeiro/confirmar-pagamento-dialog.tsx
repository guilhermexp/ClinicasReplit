import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle } from "lucide-react";
import { Payment } from "@shared/schema";

type ConfirmarPagamentoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment;
};

export function ConfirmarPagamentoDialog({
  open,
  onOpenChange,
  payment,
}: ConfirmarPagamentoDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const confirmPagamentoMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await apiRequest("POST", "/api/payments/confirm", { paymentId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Pagamento confirmado com sucesso",
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
        title: "Erro ao confirmar pagamento",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleConfirmar = () => {
    confirmPagamentoMutation.mutate(payment.id);
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
      <DialogContent className="sm:max-w-[450px] bg-white/95 border border-slate-200 shadow-md backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">Confirmar Pagamento</DialogTitle>
          <DialogDescription>
            Você está prestes a confirmar este pagamento como recebido. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
            <div className="font-semibold text-slate-700">ID do Pagamento:</div>
            <div>{payment.id}</div>
            
            <div className="font-semibold text-slate-700">Valor:</div>
            <div className="font-medium text-green-700">{formatarValor(payment.amount)}</div>
            
            <div className="font-semibold text-slate-700">Cliente:</div>
            <div>ID: {payment.clientId}</div>
            
            <div className="font-semibold text-slate-700">Método:</div>
            <div>{payment.paymentMethod || "Não informado"}</div>
            
            {payment.appointmentId && (
              <>
                <div className="font-semibold text-slate-700">Agendamento:</div>
                <div>ID: {payment.appointmentId}</div>
              </>
            )}
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
            onClick={handleConfirmar}
            disabled={confirmPagamentoMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800"
          >
            {confirmPagamentoMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Recebimento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}