import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Payment, PaymentStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, CheckCircle, RefreshCw, AlertTriangle, Ban } from "lucide-react";
import { AdicionarPagamentoDialog } from "./adicionar-pagamento-dialog";
import { ConfirmarPagamentoDialog } from "./confirmar-pagamento-dialog";
import { ReembolsarPagamentoDialog } from "./reembolsar-pagamento-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ListaPagamentosProps = {
  clinicId: number;
  clienteId?: number;
  appointmentId?: number;
  titulo?: string;
};

export function ListaPagamentos({
  clinicId,
  clienteId,
  appointmentId,
  titulo = "Pagamentos",
}: ListaPagamentosProps) {
  const { toast } = useToast();
  const [showAdicionarDialog, setShowAdicionarDialog] = useState(false);
  const [showConfirmarDialog, setShowConfirmarDialog] = useState(false);
  const [showReembolsarDialog, setShowReembolsarDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Determinar qual endpoint usar com base nos props
  const endpoint = appointmentId
    ? `/api/payments/appointment/${appointmentId}`
    : clienteId
    ? `/api/payments/client/${clienteId}`
    : `/api/payments/clinic/${clinicId}`;

  const { data: pagamentos, isLoading, error } = useQuery<Payment[]>({
    queryKey: [endpoint],
    refetchOnWindowFocus: false,
  });

  // Handler para confirmar pagamento
  const handleConfirmarPagamento = (pagamento: Payment) => {
    setSelectedPayment(pagamento);
    setShowConfirmarDialog(true);
  };

  // Handler para reembolsar pagamento
  const handleReembolsarPagamento = (pagamento: Payment) => {
    setSelectedPayment(pagamento);
    setShowReembolsarDialog(true);
  };

  // Formatar valor para moeda brasileira
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  };

  // Formatar data
  const formatarData = (data: string | Date | null) => {
    if (!data) return "N/A";
    return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Obter a cor do badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case PaymentStatus.PAID:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case PaymentStatus.PARTIAL:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            <RefreshCw className="h-3 w-3 mr-1" />
            Parcial
          </Badge>
        );
      case PaymentStatus.REFUNDED:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <Ban className="h-3 w-3 mr-1" />
            Reembolsado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  // Formatar método de pagamento
  const formatarMetodoPagamento = (metodo: string) => {
    const metodos: Record<string, string> = {
      dinheiro: "Dinheiro",
      cartao_credito: "Cartão de Crédito",
      cartao_debito: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto",
      transferencia: "Transferência",
      cheque: "Cheque",
    };

    return metodos[metodo] || metodo;
  };

  if (error) {
    toast({
      title: "Erro ao carregar pagamentos",
      description: "Ocorreu um erro ao buscar os pagamentos.",
      variant: "destructive",
    });
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-blue-800">{titulo}</CardTitle>
            <CardDescription>Gerenciamento de pagamentos</CardDescription>
          </div>
          <Button
            onClick={() => setShowAdicionarDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : pagamentos && pagamentos.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.map((pagamento) => (
                  <TableRow key={pagamento.id}>
                    <TableCell className="font-medium">{pagamento.id}</TableCell>
                    <TableCell>{pagamento.clientId}</TableCell>
                    <TableCell>{formatarValor(pagamento.amount)}</TableCell>
                    <TableCell>{formatarMetodoPagamento(pagamento.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(pagamento.status)}</TableCell>
                    <TableCell>{formatarData(pagamento.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {pagamento.status === PaymentStatus.PENDING && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmarPagamento(pagamento)}
                            className="h-8 border-green-400 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                        )}
                        {pagamento.status === PaymentStatus.PAID && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReembolsarPagamento(pagamento)}
                            className="h-8 border-red-400 text-red-700 hover:bg-red-50"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reembolsar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-slate-500 mb-4">
              Nenhum pagamento registrado ainda.
            </p>
            <Button
              onClick={() => setShowAdicionarDialog(true)}
              variant="outline"
              className="border-blue-400 text-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          </div>
        )}
      </CardContent>

      {/* Diálogos */}
      <AdicionarPagamentoDialog
        open={showAdicionarDialog}
        onOpenChange={setShowAdicionarDialog}
        clinicId={clinicId}
        clienteId={clienteId}
        appointmentId={appointmentId}
      />

      {selectedPayment && (
        <>
          <ConfirmarPagamentoDialog
            open={showConfirmarDialog}
            onOpenChange={setShowConfirmarDialog}
            payment={selectedPayment}
          />
          <ReembolsarPagamentoDialog
            open={showReembolsarDialog}
            onOpenChange={setShowReembolsarDialog}
            payment={selectedPayment}
          />
        </>
      )}
    </Card>
  );
}