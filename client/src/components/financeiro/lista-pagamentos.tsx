import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, FileEdit, MoreHorizontal, Printer, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ListaPagamentosProps {
  clinicId?: string;
  limit?: number;
  simplified?: boolean;
}

// Interface para os dados de pagamento
interface Payment {
  id: number;
  clientName: string;
  serviceName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

const ListaPagamentos: React.FC<ListaPagamentosProps> = ({ clinicId, limit = 10, simplified = false }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Query para buscar os pagamentos da clínica
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "payments", { page: currentPage, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/payments?page=${currentPage}&limit=${limit}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar pagamentos");
      }
      return res.json();
    },
    enabled: !!clinicId,
    // Dados simulados para desenvolvimento
    placeholderData: {
      payments: [
        {
          id: 1,
          clientName: "Ana Silva",
          serviceName: "Limpeza de Pele",
          amount: 120.00,
          paymentMethod: "credit_card",
          paymentDate: "2025-04-22T14:30:00Z",
          status: "paid"
        },
        {
          id: 2,
          clientName: "Carlos Oliveira",
          serviceName: "Massagem Relaxante",
          amount: 180.00,
          paymentMethod: "pix",
          paymentDate: "2025-04-21T10:15:00Z",
          status: "paid"
        },
        {
          id: 3,
          clientName: "Mariana Costa",
          serviceName: "Aplicação de Botox",
          amount: 850.00,
          paymentMethod: "credit_card",
          paymentDate: "2025-04-20T16:45:00Z",
          status: "paid"
        },
        {
          id: 4,
          clientName: "Pedro Santos",
          serviceName: "Depilação a Laser",
          amount: 350.00,
          paymentMethod: "pending",
          paymentDate: null,
          status: "pending"
        },
        {
          id: 5,
          clientName: "Julia Mendes",
          serviceName: "Drenagem Linfática",
          amount: 220.00,
          paymentMethod: "bank_transfer",
          paymentDate: "2025-04-18T11:30:00Z",
          status: "paid"
        }
      ],
      total: 5,
      page: 1,
      totalPages: 1
    }
  });

  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatação de data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pendente";
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Mapear métodos de pagamento para nomes legíveis
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'bank_transfer': 'Transferência',
      'boleto': 'Boleto',
      'pending': 'Pendente'
    };
    return methods[method] || method;
  };

  // Mapear status para badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Reembolsado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'partial':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Parcial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Erro ao carregar pagamentos. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente / Serviço</TableHead>
              <TableHead>Valor</TableHead>
              {!simplified && <TableHead>Método</TableHead>}
              {!simplified && <TableHead>Data</TableHead>}
              <TableHead>Status</TableHead>
              {!simplified && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={simplified ? 3 : 6} className="text-center text-muted-foreground h-24">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              data.payments.map((payment: Payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">{payment.clientName}</div>
                    <div className="text-sm text-muted-foreground">{payment.serviceName}</div>
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  {!simplified && <TableCell>{getPaymentMethodName(payment.paymentMethod)}</TableCell>}
                  {!simplified && <TableCell>{formatDate(payment.paymentDate)}</TableCell>}
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  {!simplified && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileEdit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir recibo
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!simplified && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="text-sm">
            Página {data.page} de {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.totalPages))}
            disabled={currentPage === data.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default ListaPagamentos;