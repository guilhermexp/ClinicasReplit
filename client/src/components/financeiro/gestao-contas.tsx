import React from "react";
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
import { Landmark, CreditCard, Eye, FileEdit, MoreHorizontal, Repeat, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GestaoContasProps {
  clinicId?: string;
}

// Interface para os dados de conta
interface Account {
  id: number;
  name: string;
  type: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  isActive: boolean;
}

const GestaoContas: React.FC<GestaoContasProps> = ({ clinicId }) => {
  // Query para buscar as contas da clínica
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/clinics", clinicId, "financial", "accounts"],
    queryFn: async () => {
      const res = await fetch(`/api/clinics/${clinicId}/financial/accounts`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao carregar contas financeiras");
      }
      return res.json();
    },
    enabled: !!clinicId,
    // Dados simulados para desenvolvimento
    placeholderData: {
      accounts: [
        {
          id: 1,
          name: "Conta Principal",
          type: "checking",
          bankName: "Banco do Brasil",
          accountNumber: "12345-6",
          balance: 12750.85,
          isActive: true
        },
        {
          id: 2,
          name: "Reserva de Emergência",
          type: "savings",
          bankName: "Nubank",
          accountNumber: "9876-5",
          balance: 25000.00,
          isActive: true
        },
        {
          id: 3,
          name: "Cartão Corporativo",
          type: "credit_card",
          bankName: "Itaú",
          accountNumber: "4567-8",
          balance: -2840.90,
          isActive: true
        },
        {
          id: 4,
          name: "Investimentos",
          type: "investment",
          bankName: "XP Investimentos",
          accountNumber: "INV-78901",
          balance: 50000.00,
          isActive: true
        },
        {
          id: 5,
          name: "Conta Antiga",
          type: "checking",
          bankName: "Santander",
          accountNumber: "5432-1",
          balance: 0.00,
          isActive: false
        }
      ]
    }
  });

  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Mapear tipos de conta para nomes legíveis
  const getAccountTypeName = (type: string) => {
    const types: Record<string, string> = {
      'checking': 'Conta Corrente',
      'savings': 'Poupança',
      'credit_card': 'Cartão de Crédito',
      'investment': 'Investimentos',
      'cash': 'Caixa',
      'other': 'Outro'
    };
    return types[type] || type;
  };

  // Função para obter o ícone do tipo de conta
  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
      case 'investment':
        return <Repeat className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Landmark className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Calcular saldo total de todas as contas ativas
  const calculateTotalBalance = () => {
    if (!data?.accounts) return 0;
    return data.accounts
      .filter((account: Account) => account.isActive)
      .reduce((total: number, account: Account) => total + account.balance, 0);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        Erro ao carregar contas financeiras. Por favor, tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total Disponível</CardTitle>
            <CardDescription>Total em todas as contas ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalBalance())}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <CardDescription>Número de contas em uso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.accounts?.filter((account: Account) => account.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome / Banco</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  Nenhuma conta encontrada
                </TableCell>
              </TableRow>
            ) : (
              data.accounts.map((account: Account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">{account.bankName}</div>
                  </TableCell>
                  <TableCell className="flex items-center">
                    {getAccountTypeIcon(account.type)}
                    <span className="ml-2">{getAccountTypeName(account.type)}</span>
                  </TableCell>
                  <TableCell>{account.accountNumber}</TableCell>
                  <TableCell className={account.balance < 0 ? "text-red-500" : ""}>
                    {formatCurrency(account.balance)}
                  </TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        Inativa
                      </Badge>
                    )}
                  </TableCell>
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
                          <Eye className="mr-2 h-4 w-4" /> Ver transações
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileEdit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {account.isActive ? (
                            <>
                              <Landmark className="mr-2 h-4 w-4" /> Desativar
                            </>
                          ) : (
                            <>
                              <Landmark className="mr-2 h-4 w-4" /> Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GestaoContas;