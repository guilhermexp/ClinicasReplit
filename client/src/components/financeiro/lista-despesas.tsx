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
import { CreditCard, Eye, FileEdit, MoreHorizontal, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ListaDespesasProps {
  clinicId?: string;
  limit?: number;
  simplified?: boolean;
}

// Interface para os dados de despesa
interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  dueDate: string;
  paymentDate: string | null;
  status: string;
  supplierName?: string;
}

const ListaDespesas: React.FC<ListaDespesasProps> = ({ clinicId, limit = 10, simplified = false }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Query para buscar as despesas da clínica
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "expenses", { page: currentPage, limit }],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/expenses?page=${currentPage}&limit=${limit}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar despesas");
      }
      return res.json();
    },
    enabled: !!clinicId,
    // Dados simulados para desenvolvimento
    placeholderData: {
      expenses: [
        {
          id: 1,
          description: "Aluguel da clínica",
          category: "rent",
          amount: 3500.00,
          dueDate: "2025-04-30T00:00:00Z",
          paymentDate: null,
          status: "pending",
          supplierName: "Imobiliária Confiança"
        },
        {
          id: 2,
          description: "Materiais descartáveis",
          category: "supplies",
          amount: 850.00,
          dueDate: "2025-04-18T00:00:00Z",
          paymentDate: "2025-04-18T14:35:00Z",
          status: "paid",
          supplierName: "Medical Supplies LTDA"
        },
        {
          id: 3,
          description: "Conta de energia elétrica",
          category: "utilities",
          amount: 780.00,
          dueDate: "2025-04-15T00:00:00Z",
          paymentDate: "2025-04-15T10:20:00Z",
          status: "paid",
          supplierName: "Companhia Elétrica"
        },
        {
          id: 4,
          description: "Salários dos funcionários",
          category: "salary",
          amount: 12000.00,
          dueDate: "2025-05-05T00:00:00Z",
          paymentDate: null,
          status: "scheduled",
          supplierName: ""
        },
        {
          id: 5,
          description: "Manutenção de equipamentos",
          category: "maintenance",
          amount: 650.00,
          dueDate: "2025-04-28T00:00:00Z",
          paymentDate: null,
          status: "pending",
          supplierName: "TechFix Equipamentos"
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
    if (!dateString) return "Não pago";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  // Mapear categorias para nomes legíveis
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'rent': 'Aluguel',
      'utilities': 'Serviços públicos',
      'salary': 'Salários',
      'marketing': 'Marketing',
      'supplies': 'Suprimentos',
      'equipment': 'Equipamentos',
      'maintenance': 'Manutenção',
      'taxes': 'Impostos',
      'insurance': 'Seguros',
      'software': 'Software',
      'training': 'Treinamento',
      'travel': 'Viagens',
      'other': 'Outros'
    };
    return categories[category] || category;
  };

  // Mapear status para badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendado</Badge>;
      case 'recurring':
        return <Badge variant="default">Recorrente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Função para pagar uma despesa
  const handlePayExpense = (expenseId: number) => {
    console.log(`Pagar despesa ${expenseId}`);
    // Implementar lógica para pagar despesa
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
        Erro ao carregar despesas. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição / Categoria</TableHead>
              <TableHead>Valor</TableHead>
              {!simplified && <TableHead>Fornecedor</TableHead>}
              <TableHead>Vencimento</TableHead>
              {!simplified && <TableHead>Pagamento</TableHead>}
              <TableHead>Status</TableHead>
              {!simplified && <TableHead className="w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={simplified ? 4 : 7} className="text-center text-muted-foreground h-24">
                  Nenhuma despesa encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.expenses.map((expense: Expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="font-medium">{expense.description}</div>
                    <div className="text-sm text-muted-foreground">{getCategoryName(expense.category)}</div>
                  </TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  {!simplified && <TableCell>{expense.supplierName || "-"}</TableCell>}
                  <TableCell>{formatDate(expense.dueDate)}</TableCell>
                  {!simplified && <TableCell>{expense.paymentDate ? formatDate(expense.paymentDate) : "-"}</TableCell>}
                  <TableCell>{getStatusBadge(expense.status)}</TableCell>
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
                          {expense.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handlePayExpense(expense.id)}>
                              <CreditCard className="mr-2 h-4 w-4" /> Registrar pagamento
                            </DropdownMenuItem>
                          )}
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

export default ListaDespesas;