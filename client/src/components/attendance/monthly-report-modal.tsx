import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Calendar, FileDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Interfaces
export interface Employee {
  id: number;
  name: string;
  user_id: string;
  role: string;
  department?: string;
  photo_url?: string;
}

export interface MonthlyReportData {
  employee: Employee;
  month: string;
  totalDays: number;
  workDays: number;
  completeDays: number;
  incompleteDays: number;
  absentDays: number;
  justifiedDays: number;
  totalHours: number;
  expectedHours: number;
  overtime: number;
  status: "complete" | "incomplete" | "pending";
}

interface MonthlyReportModalProps {
  data: MonthlyReportData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<void>;
}

export default function MonthlyReportModal({
  data,
  open,
  onOpenChange,
  onExport,
}: MonthlyReportModalProps) {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Formatar o mês
  const formattedMonth = format(new Date(data.month + "-01"), "MMMM 'de' yyyy", { locale: ptBR });

  // Função para exportar o relatório
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
      toast({
        title: "Relatório exportado",
        description: "O relatório foi exportado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar relatório",
        description: "Ocorreu um erro ao exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "incomplete":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Função para obter o ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case "incomplete":
      case "pending":
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório Mensal de Ponto</DialogTitle>
          <DialogDescription>
            Relatório de {formattedMonth} para {data.employee.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Resumo do mês */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Resumo do Mês</CardTitle>
                <CardDescription>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formattedMonth}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className={getStatusColor(data.status)}>
                        {getStatusIcon(data.status)}
                        {data.status === "complete" ? "Completo" : data.status === "incomplete" ? "Incompleto" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Horas</p>
                    <p className="font-medium">{data.totalHours}h / {data.expectedHours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dias Trabalhados</p>
                    <p className="font-medium">{data.completeDays} de {data.workDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horas Extras</p>
                    <p className="font-medium">{data.overtime}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dias úteis no mês:</span>
                    <span className="font-medium">{data.workDays}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dias completos:</span>
                    <span className="font-medium">{data.completeDays}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Dias incompletos:</span>
                    <span className="font-medium">{data.incompleteDays}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faltas:</span>
                    <span className="font-medium">{data.absentDays}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Faltas justificadas:</span>
                    <span className="font-medium">{data.justifiedDays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                {data.status === "incomplete" ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    Existem registros de ponto incompletos neste mês. Por favor, verifique e justifique os dias incompletos.
                  </div>
                ) : data.status === "complete" ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                    <CheckCircle2 className="h-4 w-4 inline-block mr-1" />
                    Todos os registros de ponto deste mês estão completos.
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                    O mês ainda não foi finalizado. Alguns registros podem estar pendentes.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
