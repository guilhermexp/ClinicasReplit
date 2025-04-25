import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, Save, Scissors, Loader2, FileText, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: number;
  clinicId: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// Componente de adição/edição de procedimento
function ProcedureFormDialog({ 
  isOpen, 
  onOpenChange, 
  procedure = null, 
  clinicId, 
  onSuccess 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  procedure?: Service | null;
  clinicId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!procedure;
  
  // Estado do formulário
  const [name, setName] = useState(procedure?.name || "");
  const [description, setDescription] = useState(procedure?.description || "");
  const [duration, setDuration] = useState(procedure?.duration?.toString() || "60");
  const [price, setPrice] = useState(procedure?.price ? (procedure.price / 100).toString() : "");
  const [category, setCategory] = useState("Estética Facial");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutação para adicionar ou atualizar procedimento
  const procedureMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isEditing 
        ? `/api/services/${procedure.id}`
        : "/api/services";
        
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Procedimento atualizado!" : "Procedimento adicionado!",
        description: isEditing 
          ? "O procedimento foi atualizado com sucesso."
          : "O procedimento foi adicionado com sucesso.",
        variant: "default",
      });
      
      // Resetar o formulário
      setName("");
      setDescription("");
      setDuration("60");
      setPrice("");
      setCategory("Estética Facial");
      
      // Fechar o modal
      onOpenChange(false);
      
      // Atualizar a lista de procedimentos
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Erro ao ${isEditing ? "atualizar" : "adicionar"} procedimento: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    // Converter valores para o formato correto
    const formattedData = {
      name,
      description,
      duration: parseInt(duration) || 60,
      price: price ? Math.round(parseFloat(price) * 100) : 0, // Converter para centavos
      clinicId
    };
    
    procedureMutation.mutate(formattedData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Procedimento" : "Adicionar Procedimento"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do procedimento." 
              : "Adicione um novo procedimento oferecido pela clínica."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Procedimento</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Insira o nome do procedimento"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do procedimento"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Estética Facial">Estética Facial</SelectItem>
                    <SelectItem value="Estética Corporal">Estética Corporal</SelectItem>
                    <SelectItem value="Massoterapia">Massoterapia</SelectItem>
                    <SelectItem value="Injetáveis">Injetáveis</SelectItem>
                    <SelectItem value="Tratamentos">Tratamentos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Atualizando..." : "Salvando..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Atualizar" : "Salvar"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente para confirmação de exclusão
function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  procedureName,
  isDeleting
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  procedureName: string;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o procedimento "{procedureName}"? 
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProceduresPanel() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para os modais
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Buscar dados de procedimentos
  const { 
    data: procedures = [], 
    isLoading,
    error,
    refetch
  } = useQuery<Service[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "services"],
    queryFn: async () => {
      if (!selectedClinic?.id) return [];
      const res = await apiRequest(
        "GET", 
        `/api/clinics/${selectedClinic.id}/services`
      );
      return res.json();
    },
    enabled: !!selectedClinic?.id
  });
  
  // Mutation para excluir um procedimento
  const deleteMutation = useMutation({
    mutationFn: async (procedureId: number) => {
      const response = await apiRequest("DELETE", `/api/services/${procedureId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Procedimento excluído!",
        description: "O procedimento foi excluído com sucesso.",
        variant: "default",
      });
      
      // Atualizar a lista de procedimentos
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Erro ao excluir procedimento: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedProcedure(null);
    }
  });
  
  // Função para formatar o preço (de centavos para reais)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };
  
  // Função para formatar a duração (em minutos)
  const formatDuration = (minutes: number) => {
    return `${minutes} min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Procedimentos</CardTitle>
        <CardDescription>
          Cadastre e gerencie os procedimentos oferecidos pela clínica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Procedimentos Cadastrados</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <Input 
                className="w-full pl-9" 
                placeholder="Buscar procedimento..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Procedimento
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center font-medium text-sm">
            <div className="w-1/3">Nome</div>
            <div className="w-1/6">Duração</div>
            <div className="w-1/4">Descrição</div>
            <div className="w-1/6">Valor</div>
            <div className="w-1/12 text-right">Ações</div>
          </div>
          
          {isLoading ? (
            <div className="p-6 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando procedimentos...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              <p>Erro ao carregar procedimentos. Por favor, tente novamente.</p>
            </div>
          ) : procedures.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Scissors className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum procedimento encontrado.</p>
              <p className="text-sm">Clique em "Novo Procedimento" para começar.</p>
            </div>
          ) : procedures.filter(procedure => 
              searchQuery === "" || 
              procedure.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (procedure.description && procedure.description.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Scissors className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum procedimento encontrado para "{searchQuery}".</p>
              <p className="text-sm">Tente outro termo de busca.</p>
            </div>
          ) : (
            <div className="divide-y">
              {procedures
                .filter(procedure => 
                  searchQuery === "" || 
                  procedure.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (procedure.description && procedure.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(procedure => (
                  <div key={procedure.id} className="p-3 flex items-center text-sm hover:bg-gray-50">
                    <div className="w-1/3 font-medium">{procedure.name}</div>
                    <div className="w-1/6">{formatDuration(procedure.duration)}</div>
                    <div className="w-1/4 truncate">{procedure.description || "-"}</div>
                    <div className="w-1/6">{formatPrice(procedure.price)}</div>
                    <div className="w-1/12 flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedProcedure(procedure);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedProcedure(procedure);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Categorias de Procedimentos</h3>
          <div className="flex flex-wrap gap-2">
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
              Estética Facial
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
              Estética Corporal
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
              Massoterapia
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
              Injetáveis
            </div>
            <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center">
              Tratamentos
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Relatório de Procedimentos
        </Button>
      </CardFooter>
      
      {/* Modais */}
      {selectedClinic && (
        <>
          {/* Modal de Adição */}
          <ProcedureFormDialog
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            clinicId={selectedClinic.id}
            onSuccess={refetch}
          />
          
          {/* Modal de Edição */}
          {selectedProcedure && (
            <ProcedureFormDialog
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              procedure={selectedProcedure}
              clinicId={selectedClinic.id}
              onSuccess={refetch}
            />
          )}
          
          {/* Modal de Confirmação de Exclusão */}
          {selectedProcedure && (
            <DeleteConfirmationDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              procedureName={selectedProcedure.name}
              isDeleting={isDeleting}
              onConfirm={() => {
                setIsDeleting(true);
                deleteMutation.mutate(selectedProcedure.id);
              }}
            />
          )}
        </>
      )}
    </Card>
  );
}