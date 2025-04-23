import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Calendar, 
  FileDown, 
  Edit, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Info,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Attendance components
import EditAttendanceModal, { AttendanceRecord } from "@/components/attendance/edit-attendance-modal";
import JustificationModal from "@/components/attendance/justification-modal";
import MonthlyReportModal, { Employee, MonthlyReportData } from "@/components/attendance/monthly-report-modal";

export default function AttendancePage() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Estado para controle da página
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [clockedStatus, setClockedStatus] = useState<"none" | "in" | "lunch" | "back" | "out">("none");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Estado para modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJustificationModalOpen, setIsJustificationModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [monthlyReportData, setMonthlyReportData] = useState<MonthlyReportData | null>(null);
  
  // Atualizar o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Buscar funcionários
  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
  } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedClinic?.id],
    enabled: !!selectedClinic?.id,
  });
  
  // Selecionar o primeiro funcionário por padrão se não houver nenhum selecionado
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(String(employees[0].id));
    }
  }, [employees, selectedEmployee]);
  
  // Buscar registros de ponto
  const {
    data: attendanceRecords = [],
    isLoading: isLoadingRecords,
    refetch: refetchRecords,
  } = useQuery<AttendanceRecord[]>({
    queryKey: [
      "/api/attendance-records", 
      selectedClinic?.id, 
      selectedEmployee, 
      viewMode, 
      viewMode === "daily" ? selectedDate : selectedMonth
    ],
    enabled: !!selectedClinic?.id && !!selectedEmployee,
  });
  
  // Buscar status atual do ponto
  const {
    data: currentStatus,
    refetch: refetchStatus,
  } = useQuery<{ status: "none" | "in" | "lunch" | "back" | "out" }>({
    queryKey: ["/api/attendance-records/status", selectedClinic?.id, selectedEmployee],
    enabled: !!selectedClinic?.id && !!selectedEmployee && selectedDate === new Date().toISOString().split('T')[0],
  });
  
  // Atualizar o status do ponto quando o currentStatus mudar
  useEffect(() => {
    if (currentStatus) {
      setClockedStatus(currentStatus.status);
    }
  }, [currentStatus]);
  
  // Buscar relatório mensal
  const {
    data: monthlyReport,
    isLoading: isLoadingMonthlyReport,
  } = useQuery<MonthlyReportData>({
    queryKey: ["/api/attendance-records/monthly-report", selectedClinic?.id, selectedEmployee, selectedMonth],
    enabled: !!selectedClinic?.id && !!selectedEmployee && viewMode === "monthly",
  });
  
  // Mutation para registrar ponto
  const clockActionMutation = useMutation({
    mutationFn: async (action: "clock_in" | "lunch_start" | "lunch_end" | "clock_out") => {
      const res = await apiRequest("POST", "/api/attendance-records", {
        employee_id: selectedEmployee,
        action_type: action,
        timestamp: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ponto registrado",
        description: "O registro de ponto foi realizado com sucesso.",
      });
      
      // Atualizar os registros e o status
      refetchRecords();
      refetchStatus();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message || "Ocorreu um erro ao registrar o ponto.",
        variant: "destructive",
      });
    },
  });
  
  // Handler para registrar ponto
  const handleClockAction = (action: "clock_in" | "lunch_start" | "lunch_end" | "clock_out") => {
    clockActionMutation.mutate(action);
  };
  
  // Handler para mudança de funcionário
  const handleEmployeeChange = (value: string) => {
    setSelectedEmployee(value);
  };
  
  // Handler para mudança de data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };
  
  // Handler para mudança de mês
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };
  
  // Handler para abrir modal de edição
  const openEditModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };
  
  // Handler para abrir modal de justificativa
  const openJustificationModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsJustificationModalOpen(true);
  };
  
  // Handler para abrir modal de relatório mensal
  const openMonthlyReportModal = () => {
    if (monthlyReport) {
      setMonthlyReportData(monthlyReport);
      setIsMonthlyReportModalOpen(true);
    }
  };
  
  // Handler para exportar relatório
  const exportAttendanceReport = async () => {
    try {
      const params = viewMode === "daily"
        ? { date: selectedDate, employee_id: selectedEmployee }
        : { month: selectedMonth, employee_id: selectedEmployee };
        
      const response = await apiRequest("GET", "/api/attendance-records/export", { params, responseType: "blob" });
      
      // Criar link de download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Nome do arquivo
      const employeeName = employees.find(e => e.id === Number(selectedEmployee))?.name || "colaborador";
      const fileName = viewMode === "daily"
        ? `ponto_${employeeName}_${selectedDate}.pdf`
        : `ponto_${employeeName}_${selectedMonth}.pdf`;
        
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
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
    }
  };
  
  // Formatar hora
  const formatTime = (timeString?: string) => {
    if (!timeString) return "-";
    try {
      return format(new Date(timeString), "HH:mm", { locale: ptBR });
    } catch (error) {
      return "-";
    }
  };
  
  // Verificar se a data selecionada é hoje
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  
  // Verificar se tem permissão para registrar ponto
  const canRegisterAttendance = hasPermission("attendance", "create") || hasPermission("attendance", "edit");
  
  if (!selectedClinic) {
    return (
      <Card className="col-span-3 shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle>Selecione uma clínica</CardTitle>
          <CardDescription>
            Por favor, selecione uma clínica para visualizar os registros de ponto.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Controle de Ponto</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerenciamento de ponto dos colaboradores da clínica {selectedClinic.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "monthly")} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">
                  <Calendar className="h-4 w-4 mr-2" />
                  Diário
                </TabsTrigger>
                <TabsTrigger value="monthly">
                  <Calendar className="h-4 w-4 mr-2" />
                  Mensal
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline" 
              onClick={exportAttendanceReport}
              className="whitespace-nowrap"
            >
              <FileDown className="mr-2 h-4 w-4" />
              <span className={isMobile ? "hidden" : "inline"}>Exportar Relatório</span>
              <span className={isMobile ? "inline" : "hidden"}>Exportar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Controles de filtro */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Colaborador</label>
              <Select 
                value={selectedEmployee} 
                onValueChange={handleEmployeeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {viewMode === "daily" ? (
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-1 block">Mês</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                />
              </div>
            )}
            
            {viewMode === "monthly" && (
              <div className="w-full md:w-1/3 flex items-end">
                <Button 
                  onClick={openMonthlyReportModal}
                  disabled={!monthlyReport}
                  className="w-full"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Ver Relatório Mensal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registrar ponto (apenas se for hoje) */}
      {viewMode === "daily" && isToday && canRegisterAttendance && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Registrar Ponto</CardTitle>
            <CardDescription>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{format(currentTime, "HH:mm:ss", { locale: ptBR })}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant={clockedStatus === "none" ? "default" : "outline"}
                onClick={() => handleClockAction("clock_in")}
                disabled={clockedStatus !== "none"}
                className="flex-1"
              >
                Entrada
              </Button>
              <Button
                variant={clockedStatus === "in" ? "default" : "outline"}
                onClick={() => handleClockAction("lunch_start")}
                disabled={clockedStatus !== "in"}
                className="flex-1"
              >
                Saída Almoço
              </Button>
              <Button
                variant={clockedStatus === "lunch" ? "default" : "outline"}
                onClick={() => handleClockAction("lunch_end")}
                disabled={clockedStatus !== "lunch"}
                className="flex-1"
              >
                Retorno Almoço
              </Button>
              <Button
                variant={clockedStatus === "back" ? "default" : "outline"}
                onClick={() => handleClockAction("clock_out")}
                disabled={clockedStatus !== "back"}
                className="flex-1"
              >
                Saída
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conteúdo principal */}
      {isLoadingEmployees || isLoadingRecords ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <Skeleton className="h-12 w-12 rounded-full mb-4" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ) : attendanceRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">
              {viewMode === "daily"
                ? `Não há registros de ponto para ${format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`
                : `Não há registros de ponto para ${format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}.`}
            </p>
            {viewMode === "daily" && isToday && canRegisterAttendance && (
              <Button onClick={() => handleClockAction("clock_in")}>
                <User className="mr-2 h-4 w-4" />
                Registrar Entrada
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "daily" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Registros de {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Saída Almoço</TableHead>
                  <TableHead>Retorno Almoço</TableHead>
                  <TableHead>Saída</TableHead>
                  <TableHead>Total de Horas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatTime(record.clock_in)}</TableCell>
                    <TableCell>{formatTime(record.lunch_start)}</TableCell>
                    <TableCell>{formatTime(record.lunch_end)}</TableCell>
                    <TableCell>{formatTime(record.clock_out)}</TableCell>
                    <TableCell>{record.total_hours || "-"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={record.status === "complete" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                      >
                        {record.status === "complete" ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {record.status === "complete" ? "Completo" : "Incompleto"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("attendance", "edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(record)}
                            title="Editar Registro"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {record.status === "incomplete" && hasPermission("attendance", "edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openJustificationModal(record)}
                            title="Justificar"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Resumo de {format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoadingMonthlyReport ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : monthlyReport ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge 
                          variant="outline" 
                          className={
                            monthlyReport.status === "complete" 
                              ? "bg-green-100 text-green-800" 
                              : monthlyReport.status === "incomplete" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {monthlyReport.status === "complete" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {monthlyReport.status === "complete" 
                            ? "Completo" 
                            : monthlyReport.status === "incomplete" 
                              ? "Incompleto" 
                              : "Pendente"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground mb-1">Total de Horas</p>
                        <p className="text-2xl font-bold">{monthlyReport.totalHours}h</p>
                        <p className="text-xs text-muted-foreground">
                          de {monthlyReport.expectedHours}h esperadas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-muted-foreground mb-1">Dias Trabalhados</p>
                        <p className="text-2xl font-bold">{monthlyReport.completeDays}</p>
                        <p className="text-xs text-muted-foreground">
                          de {monthlyReport.workDays} dias úteis
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Dias Completos vs. Incompletos</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center justify-center h-32">
                        <div className="w-32 h-32 rounded-full border-8 border-gray-100 relative">
                          <div 
                            className="absolute inset-0 rounded-full border-8 border-green-400"
                            style={{ 
                              clipPath: `polygon(0 0, 100% 0, 100% ${(monthlyReport.completeDays / monthlyReport.workDays) * 100}%, 0 ${(monthlyReport.completeDays / monthlyReport.workDays) * 100}%)` 
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-2xl font-bold">
                              {Math.round((monthlyReport.completeDays / monthlyReport.workDays) * 100)}%
                            </span>
                            <span className="text-xs text-muted-foreground">Completos</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 text-xs text-muted-foreground text-center">
                      {monthlyReport.completeDays} dias completos, {monthlyReport.incompleteDays} incompletos
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Detalhes</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Dias úteis:</span>
                          <span className="font-medium">{monthlyReport.workDays}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm">Dias completos:</span>
                          <span className="font-medium">{monthlyReport.completeDays}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm">Dias incompletos:</span>
                          <span className="font-medium">{monthlyReport.incompleteDays}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm">Faltas:</span>
                          <span className="font-medium">{monthlyReport.absentDays}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-sm">Horas extras:</span>
                          <span className="font-medium">{monthlyReport.overtime}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={openMonthlyReportModal}>
                    <Info className="mr-2 h-4 w-4" />
                    Ver Relatório Completo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Não foi possível carregar o relatório mensal.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      {selectedRecord && (
        <>
          <EditAttendanceModal
            record={selectedRecord}
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            onSuccess={() => {
              refetchRecords();
              setSelectedRecord(null);
            }}
          />
          
          <JustificationModal
            record={selectedRecord}
            open={isJustificationModalOpen}
            onOpenChange={setIsJustificationModalOpen}
            onSuccess={() => {
              refetchRecords();
              setSelectedRecord(null);
            }}
          />
        </>
      )}
      
      {monthlyReportData && (
        <MonthlyReportModal
          data={monthlyReportData}
          open={isMonthlyReportModalOpen}
          onOpenChange={setIsMonthlyReportModalOpen}
          onExport={exportAttendanceReport}
        />
      )}
    </>
  );
}
