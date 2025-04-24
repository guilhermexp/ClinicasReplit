import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, subDays, isWeekend } from "date-fns";
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
  ChevronRight,
  Search,
  Users,
  Filter,
  CalendarDays,
  BarChart,
  RefreshCw
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "incomplete">("all");
  
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
    refetch: refetchEmployees
  } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedClinic?.id],
    enabled: !!selectedClinic?.id,
  });
  
  // Funcionários filtrados com base na pesquisa
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.role && employee.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm]);
  
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
    isFetching: isFetchingRecords
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
  
  // Registros filtrados com base no status
  const filteredRecords = useMemo(() => {
    if (filterStatus === "all") return attendanceRecords;
    return attendanceRecords.filter(record => record.status === filterStatus);
  }, [attendanceRecords, filterStatus]);
  
  // Buscar status atual do ponto
  const {
    data: currentStatus,
    refetch: refetchStatus,
    isFetching: isFetchingStatus
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
    isFetching: isFetchingMonthlyReport
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
  
  // Função para refresh dos dados
  const refreshData = () => {
    refetchEmployees();
    refetchRecords();
    refetchStatus();
    toast({
      title: "Atualizando dados",
      description: "Os dados estão sendo atualizados...",
    });
  };
  
  // Verificar se está carregando/atualizando qualquer dado
  const isLoading = isLoadingEmployees || isLoadingRecords || isLoadingMonthlyReport || 
                    isFetchingRecords || isFetchingStatus || isFetchingMonthlyReport;
  
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
  
  // Handler para navegação de data
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    let newDate;
    
    if (direction === 'prev') {
      newDate = subDays(currentDate, 1);
    } else {
      newDate = addDays(currentDate, 1);
    }
    
    // Não permitir datas futuras
    if (newDate > new Date()) {
      return;
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
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
  
  // Verificar se a data selecionada é fim de semana
  const isWeekendDay = useMemo(() => {
    return isWeekend(new Date(selectedDate));
  }, [selectedDate]);
  
  // Verificar se tem permissão para registrar ponto
  const canRegisterAttendance = hasPermission("attendance", "create") || hasPermission("attendance", "edit");
  
  // Obter o status do funcionário selecionado no dia atual
  const selectedEmployeeData = useMemo(() => {
    return employees.find(e => e.id === Number(selectedEmployee)) || null;
  }, [employees, selectedEmployee]);
  
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Controle de Ponto
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerenciamento de ponto dos colaboradores da clínica {selectedClinic.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Botões de ação */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "daily" | "monthly")} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Diário
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <BarChart className="h-4 w-4 mr-2" />
                    Mensal
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={exportAttendanceReport}
                    className="whitespace-nowrap"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    <span className={isMobile ? "hidden" : "inline"}>Exportar Relatório</span>
                    <span className={isMobile ? "inline" : "hidden"}>Exportar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar relatório em PDF</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={refreshData}
                    size="icon"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Atualizar dados</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Card de informações do funcionário selecionado */}
      {selectedEmployeeData && (
        <Card className="mb-6 border-l-4 border-l-primary overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10"></div>
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {selectedEmployeeData.photo_url ? (
                  <AvatarImage src={selectedEmployeeData.photo_url} alt={selectedEmployeeData.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/30">
                    {selectedEmployeeData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{selectedEmployeeData.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedEmployeeData.role || 'Colaborador'}</span>
                  {selectedEmployeeData.department && (
                    <>
                      <span>•</span>
                      <span>{selectedEmployeeData.department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {viewMode === "daily" && isToday && (
                <Badge variant="outline" className={
                  clockedStatus === "none" ? "bg-gray-100 text-gray-800" :
                  clockedStatus === "in" ? "bg-blue-100 text-blue-800" :
                  clockedStatus === "lunch" ? "bg-orange-100 text-orange-800" :
                  clockedStatus === "back" ? "bg-green-100 text-green-800" :
                  "bg-purple-100 text-purple-800"
                }>
                  {clockedStatus === "none" && "Não Registrado"}
                  {clockedStatus === "in" && "Em Serviço"}
                  {clockedStatus === "lunch" && "Em Almoço"}
                  {clockedStatus === "back" && "Retornou do Almoço"}
                  {clockedStatus === "out" && "Finalizado"}
                </Badge>
              )}
              
              {viewMode === "monthly" && monthlyReport && (
                <>
                  <Badge variant="outline" className={
                    monthlyReport.status === "complete" ? "bg-green-100 text-green-800" :
                    monthlyReport.status === "incomplete" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }>
                    {monthlyReport.status === "complete" ? "Mês Completo" : 
                     monthlyReport.status === "incomplete" ? "Mês Incompleto" : 
                     "Mês em Andamento"}
                  </Badge>
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                    {monthlyReport.totalHours}h de {monthlyReport.expectedHours}h
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de filtro */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                <Users className="h-4 w-4" />
                Colaborador
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className={`overflow-y-auto max-h-36 bg-background border rounded-md mt-1 ${searchTerm ? 'block' : 'hidden'}`}>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(employee => (
                    <div
                      key={employee.id}
                      className={`p-2 hover:bg-muted cursor-pointer flex items-center gap-2 border-b last:border-b-0 ${Number(selectedEmployee) === employee.id ? 'bg-muted' : ''}`}
                      onClick={() => {
                        setSelectedEmployee(String(employee.id));
                        setSearchTerm("");
                      }}
                    >
                      <Avatar className="h-6 w-6">
                        {employee.photo_url ? (
                          <AvatarImage src={employee.photo_url} alt={employee.name} />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{employee.name}</p>
                        {(employee.role || employee.department) && (
                          <p className="text-xs text-muted-foreground">
                            {employee.role}{employee.department ? ` • ${employee.department}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum colaborador encontrado
                  </div>
                )}
              </div>
              {!searchTerm && (
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
              )}
            </div>
            
            {viewMode === "daily" ? (
              <div className="space-y-1">
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data
                </label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigateDate('prev')}
                    className="flex-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigateDate('next')}
                    disabled={isToday}
                    className="flex-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {isWeekendDay && (
                  <p className="text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                    Esta data é um fim de semana
                  </p>
                )}
                {isToday && (
                  <p className="text-xs text-blue-500">
                    <Info className="h-3 w-3 inline-block mr-1" />
                    Data atual
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Mês
                </label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                />
              </div>
            )}
            
            <div className="space-y-1">
              {viewMode === "monthly" ? (
                <div className="h-full flex flex-col">
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <BarChart className="h-4 w-4" />
                    Relatório
                  </label>
                  <Button 
                    onClick={openMonthlyReportModal}
                    disabled={!monthlyReport}
                    className="flex-1"
                    variant="outline"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Visualizar Relatório Mensal
                  </Button>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Filtrar por Status
                  </label>
                  <Select
                    value={filterStatus}
                    onValueChange={(value) => setFilterStatus(value as "all" | "complete" | "incomplete")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="complete">Completos</SelectItem>
                      <SelectItem value="incomplete">Incompletos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrar ponto (apenas se for hoje) */}
      {viewMode === "daily" && isToday && canRegisterAttendance && (
        <Card className="mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-6 -mt-6"></div>
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Registrar Ponto
            </CardTitle>
            <CardDescription>
              <div className="flex items-center">
                <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded text-lg tracking-widest">{format(currentTime, "HH:mm:ss", { locale: ptBR })}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 relative z-10">
            {/* Progresso atual do registro */}
            <div className="mb-4 px-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Entrada</span>
                <span>Saída p/ Almoço</span>
                <span>Retorno</span>
                <span>Saída</span>
              </div>
              <div className="relative pt-2">
                <Progress 
                  value={
                    clockedStatus === "none" ? 0 :
                    clockedStatus === "in" ? 25 :
                    clockedStatus === "lunch" ? 50 :
                    clockedStatus === "back" ? 75 :
                    100
                  } 
                  className="h-2"
                />
                <div className="absolute top-0 left-0 w-full flex justify-between">
                  <div className={`h-2 w-2 rounded-full ${clockedStatus !== "none" ? "bg-primary" : "bg-gray-300"}`}></div>
                  <div className={`h-2 w-2 rounded-full ${clockedStatus === "lunch" || clockedStatus === "back" || clockedStatus === "out" ? "bg-primary" : "bg-gray-300"}`}></div>
                  <div className={`h-2 w-2 rounded-full ${clockedStatus === "back" || clockedStatus === "out" ? "bg-primary" : "bg-gray-300"}`}></div>
                  <div className={`h-2 w-2 rounded-full ${clockedStatus === "out" ? "bg-primary" : "bg-gray-300"}`}></div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant={clockedStatus === "none" ? "default" : "outline"}
                onClick={() => handleClockAction("clock_in")}
                disabled={clockedStatus !== "none" || clockActionMutation.isPending}
                className={`flex-1 ${clockedStatus === "none" ? "bg-gradient-to-r from-primary to-primary/80" : ""}`}
              >
                Entrada
              </Button>
              <Button
                variant={clockedStatus === "in" ? "default" : "outline"}
                onClick={() => handleClockAction("lunch_start")}
                disabled={clockedStatus !== "in" || clockActionMutation.isPending}
                className={`flex-1 ${clockedStatus === "in" ? "bg-gradient-to-r from-primary to-primary/80" : ""}`}
              >
                Saída Almoço
              </Button>
              <Button
                variant={clockedStatus === "lunch" ? "default" : "outline"}
                onClick={() => handleClockAction("lunch_end")}
                disabled={clockedStatus !== "lunch" || clockActionMutation.isPending}
                className={`flex-1 ${clockedStatus === "lunch" ? "bg-gradient-to-r from-primary to-primary/80" : ""}`}
              >
                Retorno Almoço
              </Button>
              <Button
                variant={clockedStatus === "back" ? "default" : "outline"}
                onClick={() => handleClockAction("clock_out")}
                disabled={clockedStatus !== "back" || clockActionMutation.isPending}
                className={`flex-1 ${clockedStatus === "back" ? "bg-gradient-to-r from-primary to-primary/80" : ""}`}
              >
                Saída
              </Button>
            </div>
            
            {clockActionMutation.isPending && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                <Loader2 className="inline-block h-4 w-4 animate-spin mr-1" />
                Registrando ponto...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conteúdo principal */}
      {isLoading ? (
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="relative w-16 h-16 mb-6">
              <Skeleton className="h-16 w-16 rounded-full absolute animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin absolute inset-0 m-auto text-primary/30" />
            </div>
            <Skeleton className="h-5 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </Card>
      ) : filteredRecords.length === 0 ? (
        <Card className="border border-gray-100 shadow-sm overflow-hidden bg-gradient-to-b from-background to-muted/20">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {viewMode === "daily"
                ? `Não há registros de ponto para ${format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`
                : `Não há registros de ponto para ${format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}.`}
            </p>
            {viewMode === "daily" && isToday && canRegisterAttendance && (
              <Button onClick={() => handleClockAction("clock_in")} className="bg-gradient-to-r from-primary to-primary/80">
                <User className="mr-2 h-4 w-4" />
                Registrar Entrada
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "daily" ? (
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Registros de {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              {filterStatus !== "all" && (
                <Badge variant="outline" className="self-start">
                  {filterStatus === "complete" ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completos
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Incompletos
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">{formatTime(record.clock_in)}</div>
                        {record.clock_in && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.clock_in), "EEE, dd/MM", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatTime(record.lunch_start)}</div>
                        {record.lunch_start && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.lunch_start), "EEE, dd/MM", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatTime(record.lunch_end)}</div>
                        {record.lunch_end && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.lunch_end), "EEE, dd/MM", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatTime(record.clock_out)}</div>
                        {record.clock_out && (
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.clock_out), "EEE, dd/MM", { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {record.total_hours ? (
                            <span className="font-semibold text-primary">{record.total_hours}h</span>
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`${
                            record.status === "complete" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          } font-medium`}
                        >
                          {record.status === "complete" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {record.status === "complete" ? "Completo" : "Incompleto"}
                        </Badge>
                        {record.justification && (
                          <div className="text-xs mt-1 text-muted-foreground flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            Justificado
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <TooltipProvider>
                            {hasPermission("attendance", "edit") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditModal(record)}
                                    className="h-8 w-8 text-gray-500 hover:text-primary"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar Registro</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            
                            {record.status === "incomplete" && hasPermission("attendance", "edit") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openJustificationModal(record)}
                                    className="h-8 w-8 text-gray-500 hover:text-green-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Justificar Registro</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="py-3 px-4 border-t flex justify-between items-center text-xs text-muted-foreground">
            <div>
              Total de registros: {filteredRecords.length}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Completos: {filteredRecords.filter(r => r.status === "complete").length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Incompletos: {filteredRecords.filter(r => r.status === "incomplete").length}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Resumo de {format(new Date(selectedMonth + "-01"), "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingMonthlyReport ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : monthlyReport ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm">
                    <CardContent className="p-4 relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -mr-4 -mt-4"></div>
                      <div className="flex flex-col items-center relative z-10">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${monthlyReport.status === "complete" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : monthlyReport.status === "incomplete" 
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            } text-sm px-3 py-1
                          `}
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
                  
                  <Card className="overflow-hidden border-l-4 border-l-indigo-400 shadow-sm">
                    <CardContent className="p-4 relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-full -mr-4 -mt-4"></div>
                      <div className="flex flex-col items-center relative z-10">
                        <p className="text-sm text-muted-foreground mb-1">Total de Horas</p>
                        <p className="text-2xl font-bold text-indigo-600">{monthlyReport.totalHours}h</p>
                        <p className="text-xs text-muted-foreground">
                          de {monthlyReport.expectedHours}h esperadas
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden border-l-4 border-l-emerald-400 shadow-sm">
                    <CardContent className="p-4 relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-4 -mt-4"></div>
                      <div className="flex flex-col items-center relative z-10">
                        <p className="text-sm text-muted-foreground mb-1">Dias Trabalhados</p>
                        <p className="text-2xl font-bold text-emerald-600">{monthlyReport.completeDays}</p>
                        <p className="text-xs text-muted-foreground">
                          de {monthlyReport.workDays} dias úteis
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                        Dias Completos vs. Incompletos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center justify-center h-40">
                        <div className="w-40 h-40 rounded-full border-8 border-gray-100 relative overflow-hidden">
                          <div 
                            className="absolute inset-0 rounded-full border-8 bg-gradient-to-r from-green-400 to-emerald-500"
                            style={{ 
                              clipPath: `polygon(0 0, 100% 0, 100% ${(monthlyReport.completeDays / monthlyReport.workDays) * 100}%, 0 ${(monthlyReport.completeDays / monthlyReport.workDays) * 100}%)` 
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              {Math.round((monthlyReport.completeDays / monthlyReport.workDays) * 100)}%
                            </span>
                            <span className="text-xs text-muted-foreground">Completos</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                        <span>{monthlyReport.completeDays} dias completos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                        <span>{monthlyReport.incompleteDays} dias incompletos</span>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Info className="h-4 w-4 mr-2 text-primary" />
                        Detalhes do Mês
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-gray-200 rounded-full"></div>
                            <span className="text-sm">Dias úteis</span>
                          </div>
                          <div className="font-medium bg-gray-100 px-2 py-1 rounded-md">{monthlyReport.workDays}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-green-200 rounded-full"></div>
                            <span className="text-sm">Dias completos</span>
                          </div>
                          <div className="font-medium bg-green-50 text-green-700 px-2 py-1 rounded-md">{monthlyReport.completeDays}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-yellow-200 rounded-full"></div>
                            <span className="text-sm">Dias incompletos</span>
                          </div>
                          <div className="font-medium bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">{monthlyReport.incompleteDays}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-red-200 rounded-full"></div>
                            <span className="text-sm">Faltas</span>
                          </div>
                          <div className="font-medium bg-red-50 text-red-700 px-2 py-1 rounded-md">{monthlyReport.absentDays}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-8 bg-blue-200 rounded-full"></div>
                            <span className="text-sm">Horas extras</span>
                          </div>
                          <div className="font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{monthlyReport.overtime}h</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={openMonthlyReportModal} className="bg-gradient-to-r from-primary to-primary/80">
                    <Info className="mr-2 h-4 w-4" />
                    Ver Relatório Completo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Dados não disponíveis</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
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
