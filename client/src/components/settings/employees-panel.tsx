import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Users,
  Edit,
  Trash,
  Plus,
  Search,
  RefreshCw,
  UserPlus,
  Calendar,
  Briefcase,
  GraduationCap,
  Palette,
  DollarSign,
} from "lucide-react";

// Interface para profissionais (baseada no schema do backend)
interface Professional {
  id: number;
  userId: number;
  clinicId: number;
  specialization: string | null;
  bio: string | null;
  education: string | null;
  workDays: number[] | null;
  workHoursStart: string | null;
  workHoursEnd: string | null;
  colors: string | null;
  commission: number | null;
  photo: string | null;
  rating: number | null;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User; // Informações do usuário relacionado
}

// Interface para usuários
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePhoto: string | null;
}

export function EmployeesPanel() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingProfessional, setIsAddingProfessional] = useState(false);
  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    userId: 0,
    specialization: "",
    bio: "",
    education: "",
    workDays: [1, 2, 3, 4, 5] as number[], // Default: segunda a sexta
    workHoursStart: "09:00",
    workHoursEnd: "18:00",
    colors: "#3498db", // Default blue
    commission: 0,
    isActive: true,
  });
  
  // Buscar profissionais da clínica
  const {
    data: professionals = [],
    isLoading: isLoadingProfessionals,
    refetch: refetchProfessionals,
  } = useQuery<Professional[]>({
    queryKey: ["/api/professionals", selectedClinic?.id],
    queryFn: async () => {
      if (!selectedClinic?.id) return [];
      const res = await apiRequest("GET", `/api/clinics/${selectedClinic.id}/professionals`);
      return res.json();
    },
    enabled: !!selectedClinic?.id,
  });
  
  // Buscar usuários disponíveis para vincular como profissionais
  const {
    data: availableUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery<User[]>({
    queryKey: ["/api/users/available"],
    queryFn: async () => {
      if (!selectedClinic?.id) return [];
      const res = await apiRequest("GET", `/api/users/available?clinicId=${selectedClinic.id}`);
      return res.json();
    },
    enabled: !!selectedClinic?.id && (isAddingProfessional || isEditingProfessional),
  });
  
  // Profissionais filtrados com base na pesquisa
  const filteredProfessionals = professionals.filter((professional) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (professional.user?.name || "").toLowerCase().includes(searchLower) ||
      (professional.specialization || "").toLowerCase().includes(searchLower)
    );
  });
  
  // Mutation para adicionar um novo profissional
  const addProfessionalMutation = useMutation({
    mutationFn: async (data: Omit<Professional, "id" | "createdAt" | "updatedAt" | "rating" | "reviewCount">) => {
      const res = await apiRequest("POST", "/api/professionals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional adicionado!",
        description: "O profissional foi adicionado com sucesso.",
      });
      setIsAddingProfessional(false);
      refetchProfessionals();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar profissional",
        description: error.message || "Ocorreu um erro ao adicionar o profissional.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar um profissional
  const updateProfessionalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Professional> }) => {
      const res = await apiRequest("PATCH", `/api/professionals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional atualizado!",
        description: "Os dados do profissional foram atualizados com sucesso.",
      });
      setIsEditingProfessional(false);
      refetchProfessionals();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar profissional",
        description: error.message || "Ocorreu um erro ao atualizar os dados do profissional.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation para remover um profissional
  const deleteProfessionalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/professionals/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profissional removido!",
        description: "O profissional foi removido com sucesso.",
      });
      refetchProfessionals();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover profissional",
        description: error.message || "Ocorreu um erro ao remover o profissional.",
        variant: "destructive",
      });
    },
  });
  
  // Reset form state
  const resetForm = () => {
    setFormData({
      userId: 0,
      specialization: "",
      bio: "",
      education: "",
      workDays: [1, 2, 3, 4, 5],
      workHoursStart: "09:00",
      workHoursEnd: "18:00",
      colors: "#3498db",
      commission: 0,
      isActive: true,
    });
    setSelectedProfessional(null);
  };
  
  // Open edit modal
  const handleEdit = (professional: Professional) => {
    setSelectedProfessional(professional);
    setFormData({
      userId: professional.userId,
      specialization: professional.specialization || "",
      bio: professional.bio || "",
      education: professional.education || "",
      workDays: professional.workDays || [1, 2, 3, 4, 5],
      workHoursStart: professional.workHoursStart || "09:00",
      workHoursEnd: professional.workHoursEnd || "18:00",
      colors: professional.colors || "#3498db",
      commission: professional.commission || 0,
      isActive: professional.isActive,
    });
    setIsEditingProfessional(true);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.userId === 0) {
      toast({
        title: "Erro no formulário",
        description: "Selecione um usuário para o profissional.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.specialization) {
      toast({
        title: "Erro no formulário",
        description: "Informe a especialização do profissional.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditingProfessional && selectedProfessional) {
      updateProfessionalMutation.mutate({
        id: selectedProfessional.id,
        data: {
          ...formData,
          clinicId: selectedClinic?.id || 0,
        },
      });
    } else {
      addProfessionalMutation.mutate({
        ...formData,
        clinicId: selectedClinic?.id || 0,
      } as any);
    }
  };
  
  // Handle field changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  // Handle work day toggle
  const handleWorkDayToggle = (day: number) => {
    setFormData((prev) => {
      const currentDays = [...prev.workDays];
      const index = currentDays.indexOf(day);
      
      if (index >= 0) {
        currentDays.splice(index, 1);
      } else {
        currentDays.push(day);
        currentDays.sort((a, b) => a - b);
      }
      
      return {
        ...prev,
        workDays: currentDays,
      };
    });
  };
  
  // Format work days
  const formatWorkDays = (days: number[] | null) => {
    if (!days || days.length === 0) return "Não definido";
    
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days.map((day) => dayNames[day % 7]).join(", ");
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Gerenciamento de Profissionais</CardTitle>
              <CardDescription>
                Cadastre e gerencie os profissionais que atuam na clínica
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profissional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px] md:w-[300px]"
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsAddingProfessional(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetchProfessionals()}
                title="Atualizar lista"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProfessionals ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredProfessionals.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Profissional</TableHead>
                    <TableHead>Especialização</TableHead>
                    <TableHead>Dias</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessionals.map((professional) => (
                    <TableRow key={professional.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            {professional.photo ? (
                              <AvatarImage src={professional.photo} alt={professional.user?.name || ""} />
                            ) : (
                              <AvatarFallback className="bg-primary/5">
                                {professional.user?.name.charAt(0) || "P"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{professional.user?.name || "Usuário não encontrado"}</div>
                            <div className="text-xs text-muted-foreground">{professional.user?.email || ""}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{professional.specialization || "Não definido"}</TableCell>
                      <TableCell>{formatWorkDays(professional.workDays)}</TableCell>
                      <TableCell>
                        {professional.workHoursStart && professional.workHoursEnd
                          ? `${professional.workHoursStart} - ${professional.workHoursEnd}`
                          : "Não definido"}
                      </TableCell>
                      <TableCell>{professional.commission ? `${professional.commission}%` : "0%"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={professional.isActive ? "default" : "outline"}
                          className={
                            professional.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {professional.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(professional)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Remover"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover este profissional? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProfessionalMutation.mutate(professional.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum profissional encontrado</h3>
              <p className="text-muted-foreground mt-2 mb-6">
                {searchTerm
                  ? "Nenhum profissional corresponde aos critérios de pesquisa."
                  : "Você ainda não adicionou profissionais à clínica."}
              </p>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddingProfessional(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Novo Profissional
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar profissional */}
      <Dialog
        open={isAddingProfessional || isEditingProfessional}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingProfessional(false);
            setIsEditingProfessional(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingProfessional ? "Editar Profissional" : "Adicionar Novo Profissional"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do profissional para
              {isEditingProfessional ? " atualizar suas informações" : " adicioná-lo à clínica"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuário
                  </Label>
                  <Select
                    value={formData.userId ? String(formData.userId) : ""}
                    onValueChange={(value) => handleChange("userId", Number(value))}
                    disabled={isEditingProfessional}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <div className="p-2 text-center">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                          <p className="text-sm">Carregando usuários...</p>
                        </div>
                      ) : availableUsers.length > 0 ? (
                        availableUsers.map((user) => (
                          <SelectItem key={user.id} value={String(user.id)}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Nenhum usuário disponível
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Especialização
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="Ex: Dermatologia"
                    value={formData.specialization}
                    onChange={(e) => handleChange("specialization", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Biografia
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Biografia do profissional"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Formação Acadêmica
                  </Label>
                  <Textarea
                    id="education"
                    placeholder="Formação acadêmica do profissional"
                    rows={2}
                    value={formData.education}
                    onChange={(e) => handleChange("education", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dias de Trabalho
                  </Label>
                  <div className="grid grid-cols-7 gap-2">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                      <div
                        key={index}
                        className={`flex flex-col items-center justify-center p-2 rounded-md cursor-pointer border ${
                          formData.workDays.includes(index)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                        onClick={() => handleWorkDayToggle(index)}
                      >
                        <span className="text-xs font-medium">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workHoursStart">Horário de Início</Label>
                    <Input
                      id="workHoursStart"
                      type="time"
                      value={formData.workHoursStart}
                      onChange={(e) => handleChange("workHoursStart", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workHoursEnd">Horário de Término</Label>
                    <Input
                      id="workHoursEnd"
                      type="time"
                      value={formData.workHoursEnd}
                      onChange={(e) => handleChange("workHoursEnd", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colors" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor na Agenda
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="colors"
                      type="color"
                      value={formData.colors}
                      onChange={(e) => handleChange("colors", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <div
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: formData.colors }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Comissão (%)
                  </Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.commission}
                    onChange={(e) => handleChange("commission", Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Profissional Ativo</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => {
                setIsAddingProfessional(false);
                setIsEditingProfessional(false);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addProfessionalMutation.isPending || updateProfessionalMutation.isPending}>
                {addProfessionalMutation.isPending || updateProfessionalMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Salvar
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}