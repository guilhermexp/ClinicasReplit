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
import { Save, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InventoryProduct } from "@shared/schema";

export function InventoryPanel() {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch inventory data
  const { 
    data: inventoryProducts = [], 
    isLoading,
    error
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
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
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
                    <div className="w-1/12 flex justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
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
    </Card>
  );
}