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
import { Save, Package, Loader2, Plus, Edit, Trash2, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InventoryProduct } from "@shared/schema";
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
import { Label } from "@/components/ui/label";

// Componente de adição/edição de produto
function ProductFormDialog({ 
  isOpen, 
  onOpenChange, 
  product = null, 
  clinicId, 
  onSuccess 
}: { 
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product?: InventoryProduct | null;
  clinicId: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEditing = !!product;
  
  // Estado do formulário
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() || "0");
  const [price, setPrice] = useState(product?.price ? (product.price / 100).toString() : "");
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold?.toString() || "5");
  const [description, setDescription] = useState(product?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutação para adicionar ou atualizar produto
  const inventoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isEditing 
        ? `/api/inventory/${product.id}`
        : "/api/inventory";
        
      const method = isEditing ? "PATCH" : "POST";
      
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Produto atualizado!" : "Produto adicionado!",
        description: isEditing 
          ? "O produto foi atualizado com sucesso."
          : "O produto foi adicionado ao inventário.",
        variant: "default",
      });
      
      // Resetar o formulário
      setName("");
      setCategory("");
      setQuantity("0");
      setPrice("");
      setLowStockThreshold("5");
      setDescription("");
      
      // Fechar o modal
      onOpenChange(false);
      
      // Atualizar a lista de produtos
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Erro ao ${isEditing ? "atualizar" : "adicionar"} produto: ${error.message}`,
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
      category,
      quantity: parseInt(quantity) || 0,
      price: price ? Math.round(parseFloat(price) * 100) : 0, // Converter para centavos
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      description,
      clinicId
    };
    
    inventoryMutation.mutate(formattedData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do produto no inventário." 
              : "Adicione um novo produto ao inventário da clínica."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Insira o nome do produto"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Injetáveis">Injetáveis</SelectItem>
                    <SelectItem value="Preenchedores">Preenchedores</SelectItem>
                    <SelectItem value="Cosméticos">Cosméticos</SelectItem>
                    <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                    <SelectItem value="Descartáveis">Descartáveis</SelectItem>
                    <SelectItem value="Medicamentos">Medicamentos</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
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
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">
                Limite para Estoque Baixo
                <span className="text-xs text-gray-500 ml-1">
                  (Aviso quando quantidade for menor ou igual)
                </span>
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do produto"
              />
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
  productName,
  isDeleting
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  productName: string;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o produto "{productName}"? 
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

export function InventoryPanel() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para os modais
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch inventory data
  const { 
    data: inventoryProducts = [], 
    isLoading,
    error,
    refetch
  } = useQuery<InventoryProduct[]>({
    queryKey: ["/api/clinics", selectedClinic?.id, "inventory"],
    queryFn: async () => {
      if (!selectedClinic?.id) return [];
      const res = await apiRequest(
        "GET", 
        `/api/clinics/${selectedClinic.id}/inventory`
      );
      return res.json();
    },
    enabled: !!selectedClinic?.id
  });
  
  // Mutation para excluir um produto
  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiRequest("DELETE", `/api/inventory/${productId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Produto excluído!",
        description: "O produto foi excluído com sucesso.",
        variant: "default",
      });
      
      // Atualizar a lista de produtos
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro!",
        description: `Erro ao excluir produto: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle de Estoque</CardTitle>
        <CardDescription>
          Gerencie o estoque de produtos e insumos da clínica.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Produtos em Estoque</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <Input 
                className="w-full pl-9" 
                placeholder="Buscar produto..." 
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
              Adicionar Produto
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 p-3 flex items-center font-medium text-sm">
            <div className="w-1/3">Produto</div>
            <div className="w-1/6">Categoria</div>
            <div className="w-1/6">Quantidade</div>
            <div className="w-1/6">Unidade</div>
            <div className="w-1/6">Status</div>
            <div className="w-1/12 text-right">Ações</div>
          </div>
          
          {isLoading ? (
            <div className="p-6 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando produtos...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              <p>Erro ao carregar produtos. Por favor, tente novamente.</p>
            </div>
          ) : inventoryProducts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum produto encontrado no estoque.</p>
              <p className="text-sm">Clique em "Adicionar Produto" para começar.</p>
            </div>
          ) : inventoryProducts.filter(product => 
              searchQuery === "" || 
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum produto encontrado para "{searchQuery}".</p>
              <p className="text-sm">Tente outro termo de busca.</p>
            </div>
          ) : (
            <div className="divide-y">
              {inventoryProducts
                .filter(product => 
                  searchQuery === "" || 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(product => {
                // Determine status display
                let statusColor = "bg-green-100 text-green-800"; // Default: normal
                let statusText = "Normal";
                
                if (product.status === "out_of_stock") {
                  statusColor = "bg-red-100 text-red-800";
                  statusText = "Esgotado";
                } else if (product.status === "low_stock") {
                  statusColor = "bg-yellow-100 text-yellow-800";
                  statusText = "Baixo";
                }
                
                return (
                  <div key={product.id} className="p-3 flex items-center text-sm hover:bg-gray-50">
                    <div className="w-1/3 font-medium">{product.name}</div>
                    <div className="w-1/6">{product.category || "N/A"}</div>
                    <div className="w-1/6">{product.quantity}</div>
                    <div className="w-1/6">UN</div>
                    <div className="w-1/6">
                      <span className={`inline-flex items-center rounded-full ${statusColor} px-2.5 py-0.5 text-xs font-medium`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="w-1/12 flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedProduct(product);
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
                          setSelectedProduct(product);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Produtos cadastrados</p>
                  <h4 className="text-2xl font-bold">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      inventoryProducts.length
                    )}
                  </h4>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Produtos com estoque baixo</p>
                  <h4 className="text-2xl font-bold">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      inventoryProducts.filter(p => p.status === "low_stock").length
                    )}
                  </h4>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Produtos esgotados</p>
                  <h4 className="text-2xl font-bold">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      inventoryProducts.filter(p => p.status === "out_of_stock").length
                    )}
                  </h4>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Relatório de Estoque
        </Button>
        <Button>
          <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Solicitar Compra
        </Button>
      </CardFooter>
      
      {/* Modais */}
      {selectedClinic && (
        <>
          {/* Modal de Adição */}
          <ProductFormDialog
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            clinicId={selectedClinic.id}
            onSuccess={refetch}
          />
          
          {/* Modal de Edição */}
          {selectedProduct && (
            <ProductFormDialog
              isOpen={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              product={selectedProduct}
              clinicId={selectedClinic.id}
              onSuccess={refetch}
            />
          )}
          
          {/* Modal de Confirmação de Exclusão */}
          {selectedProduct && (
            <DeleteConfirmationDialog
              isOpen={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              productName={selectedProduct.name}
              isDeleting={isDeleting}
              onConfirm={() => {
                setIsDeleting(true);
                deleteMutation.mutate(selectedProduct.id);
              }}
            />
          )}
        </>
      )}
    </Card>
  );
}