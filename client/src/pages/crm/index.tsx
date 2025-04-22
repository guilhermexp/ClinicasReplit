import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Users, 
  BarChart, 
  Calendar, 
  UserPlus, 
  Mail, 
  Send, 
  Filter 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function CrmPage() {
  const { selectedClinic } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Query to get clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "clients"],
    enabled: !!selectedClinic,
  });
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900">CRM</h1>
        
        {hasPermission("crm", "create") && (
          <div className="flex space-x-2 mt-3 sm:mt-0">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Campanhas
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Nova Mensagem
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Enviar Mensagem</DialogTitle>
                  <DialogDescription>
                    Crie e envie uma mensagem para clientes ou grupos.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipient" className="text-right">Para:</Label>
                    <div className="col-span-3">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um destinatário" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os clientes</SelectItem>
                          <SelectItem value="premium">Clientes Premium</SelectItem>
                          <SelectItem value="inactive">Clientes Inativos</SelectItem>
                          <SelectItem value="new">Novos Clientes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">Assunto:</Label>
                    <Input id="subject" placeholder="Assunto da mensagem" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="message" className="text-right pt-2">Mensagem:</Label>
                    <Textarea
                      id="message"
                      placeholder="Digite sua mensagem aqui..."
                      className="col-span-3 min-h-[120px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Enviar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      {/* CRM Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
                <h3 className="text-2xl font-bold text-primary-600 mt-1">{clients.length}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Novos Clientes (Mês)</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">12</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Retorno</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">68%</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Campanhas Ativas</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-1">3</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gerenciamento de Clientes</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar clientes..."
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Último Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.slice(0, 5).map((client: any, index: number) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{index % 3 === 0 ? "Limpeza de Pele" : index % 3 === 1 ? "Botox" : "Peeling"}</TableCell>
                        <TableCell>{new Date(client.updatedAt).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${index % 3 === 0 ? "bg-green-500" : index % 3 === 1 ? "bg-amber-500" : "bg-red-500"}`}></div>
                            {index % 3 === 0 ? "Ativo" : index % 3 === 1 ? "Pendente" : "Inativo"}
                          </div>
                        </TableCell>
                        <TableCell>R$ {(Math.floor(Math.random() * 5000) + 500).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline">Ver todos os clientes</Button>
            </CardFooter>
          </Card>
          
          {/* Client Segments */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Segmentação de Clientes</CardTitle>
              <CardDescription>
                Acompanhe e gerencie seus segmentos de clientes para campanhas direcionadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium">Clientes Premium</span>
                      <div className="text-xs text-muted-foreground">Gastaram mais de R$ 2.000 no último trimestre</div>
                    </div>
                    <span className="text-sm font-medium">28 clientes</span>
                  </div>
                  <Progress value={28} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium">Clientes Recorrentes</span>
                      <div className="text-xs text-muted-foreground">Frequência mensal nos últimos 6 meses</div>
                    </div>
                    <span className="text-sm font-medium">42 clientes</span>
                  </div>
                  <Progress value={42} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium">Clientes Inativos</span>
                      <div className="text-xs text-muted-foreground">Sem visitas nos últimos 3 meses</div>
                    </div>
                    <span className="text-sm font-medium">15 clientes</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <span className="text-sm font-medium">Novos Clientes</span>
                      <div className="text-xs text-muted-foreground">Primeira visita nos últimos 30 dias</div>
                    </div>
                    <span className="text-sm font-medium">12 clientes</span>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Campanhas de Marketing</CardTitle>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Campanha
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Campanha</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Taxa de Abertura</TableHead>
                    <TableHead>Conversões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Verão 2023</TableCell>
                    <TableCell>Todos os clientes</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Ativa
                      </div>
                    </TableCell>
                    <TableCell>145</TableCell>
                    <TableCell>68%</TableCell>
                    <TableCell>24</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Promoção de Aniversário</TableCell>
                    <TableCell>Clientes Premium</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Ativa
                      </div>
                    </TableCell>
                    <TableCell>28</TableCell>
                    <TableCell>85%</TableCell>
                    <TableCell>12</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Reativação</TableCell>
                    <TableCell>Clientes Inativos</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Ativa
                      </div>
                    </TableCell>
                    <TableCell>15</TableCell>
                    <TableCell>32%</TableCell>
                    <TableCell>3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Black Friday</TableCell>
                    <TableCell>Todos os clientes</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
                        Agendada
                      </div>
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Análise de Desempenho</CardTitle>
              <CardDescription>
                Visualize métricas importantes sobre o desempenho de suas campanhas e engajamento dos clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Análises em Desenvolvimento</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Esta funcionalidade estará disponível em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}