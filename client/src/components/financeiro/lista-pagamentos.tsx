import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Check, Undo2, Search, Filter } from "lucide-react";
import { AdicionarPagamentoDialog } from "./adicionar-pagamento-dialog";
import { ConfirmarPagamentoDialog } from "./confirmar-pagamento-dialog";
import { ReembolsarPagamentoDialog } from "./reembolsar-pagamento-dialog";
import { Payment, PaymentStatus } from "@shared/schema";

type ListaPagamentosProps = {
  clinicId: number;
  titulo: string;
  clientId?: number;
  appointmentId?: number;
};

export function ListaPagamentos({ clinicId, titulo, clientId, appointmentId }: ListaPagamentosProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [adicionarPagamentoOpen, setAdicionarPagamentoOpen] = useState(false);
  const [confirmarPagamentoOpen, setConfirmarPagamentoOpen] = useState(false);
  const [reembolsarPagamentoOpen, setReembolsarPagamentoOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Determinar qual endpoint usar com base nos props
  let queryKey = `/api/payments/clinic/${clinicId}`;
  if (clientId) {
    queryKey = `/api/payments/client/${clientId}`;
  } else if (appointmentId) {
    queryKey = `/api/payments/appointment/${appointmentId}`;
  }
  
  // Buscar pagamentos
  const { data: payments = [], isLoading } = useQuery({
    queryKey: [queryKey],
    enabled: !!clinicId,
  });
  
  // Filtragem de pagamentos
  const filteredPayments = payments
    .filter((payment: Payment) => {
      // Filtro de status
      if (statusFilter !== "todos") {
        return payment.status === statusFilter;
      }
      return true;
    })
    .filter((payment: Payment) => {
      // Filtro de busca
      if (!search) return true;
      
      const searchLower = search.toLowerCase();
      return (
        payment.id.toString().includes(searchLower) ||
        payment.paymentMethod?.toLowerCase().includes(searchLower) ||
        payment.clientId.toString().includes(searchLower) ||
        payment.notes?.toLowerCase().includes(searchLower) ||
        formatarValor(payment.amount).includes(searchLower)
      );
    });
  
  // Manipuladores de eventos
  const handleConfirmPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setConfirmarPagamentoOpen(true);
  };
  
  const handleRefundPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setReembolsarPagamentoOpen(true);
  };
  
  // Função para formatar valor
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor / 100);
  };
  
  // Função para formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  };
  
  // Função para obter cor do badge de status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmado":
        return "bg-green-100 text-green-800 border-green-200";
      case "reembolsado":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };
  
  // Função para traduzir status
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      [PaymentStatus.PENDING]: "pendente",
      [PaymentStatus.PAID]: "confirmado",
      [PaymentStatus.REFUNDED]: "reembolsado",
      [PaymentStatus.FAILED]: "falhou",
      [PaymentStatus.PARTIAL]: "parcial",
    };
    return statusMap[status] || status;
  };
  
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-blue-800">{titulo}</CardTitle>
          
          <Dialog open={adicionarPagamentoOpen} onOpenChange={setAdicionarPagamentoOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Novo Pagamento
              </Button>
            </DialogTrigger>
            <AdicionarPagamentoDialog
              open={adicionarPagamentoOpen}
              onOpenChange={setAdicionarPagamentoOpen}
              clinicId={clinicId}
              clientId={clientId}
              appointmentId={appointmentId}
            />
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar pagamentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-white/90"
              />
            </div>
            
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-slate-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-white/90">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value={PaymentStatus.PENDING}>Pendentes</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Confirmados</SelectItem>
                  <SelectItem value={PaymentStatus.REFUNDED}>Reembolsados</SelectItem>
                  <SelectItem value={PaymentStatus.FAILED}>Falhos</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIAL}>Parciais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-800">Carregando pagamentos...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-full mb-4">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">Nenhum pagamento encontrado</h3>
              <p className="text-slate-500 max-w-md">
                {search || statusFilter !== "todos"
                  ? "Tente ajustar os filtros para encontrar o que procura."
                  : "Não há pagamentos registrados. Clique em 'Novo Pagamento' para adicionar."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: Payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.id}</TableCell>
                      <TableCell className="font-medium text-green-700">
                        {formatarValor(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusBadgeVariant(payment.status)} px-2 py-0.5 font-normal`}
                          variant="outline"
                        >
                          {translateStatus(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>Cliente #{payment.clientId}</TableCell>
                      <TableCell>{payment.paymentMethod || "Não informado"}</TableCell>
                      <TableCell>{formatarData(payment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {payment.status === PaymentStatus.PENDING && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-green-700 hover:text-green-900 hover:bg-green-50"
                              onClick={() => handleConfirmPayment(payment)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          
                          {payment.status === PaymentStatus.PAID && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-red-700 hover:text-red-900 hover:bg-red-50"
                              onClick={() => handleRefundPayment(payment)}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Reembolsar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      
      {selectedPayment && (
        <>
          <ConfirmarPagamentoDialog
            open={confirmarPagamentoOpen}
            onOpenChange={setConfirmarPagamentoOpen}
            payment={selectedPayment}
          />
          
          <ReembolsarPagamentoDialog
            open={reembolsarPagamentoOpen}
            onOpenChange={setReembolsarPagamentoOpen}
            payment={selectedPayment}
          />
        </>
      )}
    </Card>
  );
}