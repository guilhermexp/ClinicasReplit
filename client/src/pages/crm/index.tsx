import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStatus, LeadSource } from "@shared/crm";
import {
  User,
  Phone,
  Calendar,
  PieChart,
  BarChart3,
  Users,
  UserPlus,
  CheckCircle,
  ArrowUpRight,
  Search,
  Filter,
  Plus,
  Instagram,
  Facebook,
  Globe,
  UserCheck,
  MessageSquare,
  ChevronDown
} from "lucide-react";

// Mock data até conectarmos com a API real
const mockLeads = [
  {
    id: 1,
    nome: "Maria Silva",
    telefone: "(11) 98765-4321",
    email: "maria@exemplo.com",
    fonte: "Instagram" as LeadSource,
    status: "Novo" as LeadStatus,
    dataCadastro: new Date(2023, 2, 15),
    ultimaAtualizacao: new Date(2023, 2, 15),
    procedimentoInteresse: "Botox",
    valorEstimado: 1500,
    responsavel: "Dr. Ana"
  },
  {
    id: 2,
    nome: "João Santos",
    telefone: "(11) 91234-5678",
    email: "joao@exemplo.com",
    fonte: "Facebook" as LeadSource,
    status: "Em contato" as LeadStatus,
    dataCadastro: new Date(2023, 2, 10),
    ultimaAtualizacao: new Date(2023, 2, 12),
    procedimentoInteresse: "Preenchimento Facial",
    valorEstimado: 2000,
    responsavel: "Dr. Ricardo"
  },
  {
    id: 3,
    nome: "Carla Oliveira",
    telefone: "(11) 99876-5432",
    email: "carla@exemplo.com",
    fonte: "Site" as LeadSource,
    status: "Agendado" as LeadStatus,
    dataCadastro: new Date(2023, 2, 5),
    ultimaAtualizacao: new Date(2023, 2, 14),
    procedimentoInteresse: "Limpeza de Pele",
    valorEstimado: 800,
    responsavel: "Dr. Ana"
  },
  {
    id: 4,
    nome: "Pedro Almeida",
    telefone: "(11) 97654-3210",
    email: "pedro@exemplo.com",
    fonte: "Indicação" as LeadSource,
    status: "Convertido" as LeadStatus,
    dataCadastro: new Date(2023, 1, 28),
    ultimaAtualizacao: new Date(2023, 2, 10),
    procedimentoInteresse: "Harmonização Facial",
    valorEstimado: 3500,
    responsavel: "Dr. Roberto"
  },
  {
    id: 5,
    nome: "Sofia Lima",
    telefone: "(11) 94321-8765",
    email: "sofia@exemplo.com",
    fonte: "Google" as LeadSource,
    status: "Perdido" as LeadStatus,
    dataCadastro: new Date(2023, 1, 20),
    ultimaAtualizacao: new Date(2023, 2, 5),
    procedimentoInteresse: "Criolipólise",
    valorEstimado: 2800,
    responsavel: "Dr. Roberto"
  },
  {
    id: 6,
    nome: "Lucia Fernandes",
    telefone: "(11) 92345-6789",
    email: "lucia@exemplo.com",
    fonte: "Instagram" as LeadSource,
    status: "Novo" as LeadStatus,
    dataCadastro: new Date(2023, 2, 17),
    ultimaAtualizacao: new Date(2023, 2, 17),
    procedimentoInteresse: "Microagulhamento",
    valorEstimado: 1200,
    responsavel: "Dr. Ricardo"
  }
];

function CRMDashboard() {
  const [leads, setLeads] = useState(mockLeads);
  const [filteredLeads, setFilteredLeads] = useState(mockLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "Todos">("Todos");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "Todos">("Todos");

  // Filtrar leads quando os filtros mudarem
  useEffect(() => {
    let result = [...leads];
    
    // Filtrar por status
    if (statusFilter !== "Todos") {
      result = result.filter(lead => lead.status === statusFilter);
    }
    
    // Filtrar por origem
    if (sourceFilter !== "Todos") {
      result = result.filter(lead => lead.fonte === sourceFilter);
    }
    
    // Filtrar por texto de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => 
        lead.nome.toLowerCase().includes(query) || 
        lead.telefone.includes(query) ||
        (lead.email && lead.email.toLowerCase().includes(query))
      );
    }
    
    setFilteredLeads(result);
  }, [leads, statusFilter, sourceFilter, searchQuery]);

  // Contadores para o dashboard
  const getLeadsByStatus = (status: LeadStatus): number => {
    return leads.filter(lead => lead.status === status).length;
  };

  const getLeadsBySource = (): Record<string, number> => {
    return leads.reduce((acc, lead) => {
      acc[lead.fonte] = (acc[lead.fonte] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  // Funções auxiliares
  const getStatusColor = (status: LeadStatus): string => {
    const colors: Record<LeadStatus, string> = {
      "Novo": "bg-blue-100 text-blue-800",
      "Em contato": "bg-indigo-100 text-indigo-800",
      "Agendado": "bg-yellow-100 text-yellow-800",
      "Convertido": "bg-green-100 text-green-800",
      "Perdido": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getSourceIcon = (source: LeadSource) => {
    const icons: Record<LeadSource, JSX.Element> = {
      "Instagram": <Instagram size={16} className="text-pink-500" />,
      "Facebook": <Facebook size={16} className="text-blue-600" />,
      "Site": <Globe size={16} className="text-purple-500" />,
      "Indicação": <UserCheck size={16} className="text-green-500" />,
      "Google": <Search size={16} className="text-red-500" />,
      "WhatsApp": <MessageSquare size={16} className="text-green-600" />,
      "Outro": <ChevronDown size={16} className="text-gray-500" />
    };
    return icons[source] || <ChevronDown size={16} />;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="container p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">CRM - Gestão de Leads</h1>
        <Button className="gap-2">
          <Plus size={16} />
          Novo Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="glass" className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <h2 className="text-3xl font-bold">{leads.length}</h2>
              </div>
              <div className="bg-primary-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Novos Leads</p>
                <h2 className="text-3xl font-bold">{getLeadsByStatus("Novo")}</h2>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Convertidos</p>
                <h2 className="text-3xl font-bold">{getLeadsByStatus("Convertido")}</h2>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <h2 className="text-3xl font-bold">
                  {leads.length > 0 
                    ? `${(getLeadsByStatus("Convertido") / leads.length * 100).toFixed(1)}%` 
                    : "0%"}
                </h2>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos (simulados com visualização básica) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card variant="glass" className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Leads por Status</CardTitle>
            <CardDescription>Distribuição de leads por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <PieChart className="h-40 w-40 mx-auto mb-4 opacity-25" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Novo ({getLeadsByStatus("Novo")})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span>Em contato ({getLeadsByStatus("Em contato")})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Agendado ({getLeadsByStatus("Agendado")})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Convertido ({getLeadsByStatus("Convertido")})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Perdido ({getLeadsByStatus("Perdido")})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>Distribuição de leads por canal de origem</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart3 className="h-40 w-full mx-auto mb-4 opacity-25" />
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(getLeadsBySource()).map(([source, count]) => (
                <div key={source} className="flex items-center gap-2">
                  {getSourceIcon(source as LeadSource)}
                  <span>
                    {source} ({count})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass" className="border-none shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Gerenciamento de Leads</CardTitle>
              <CardDescription>
                Gerencie todos os leads da sua clínica
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar leads..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as LeadStatus | "Todos")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os Status</SelectItem>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Em contato">Em contato</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Convertido">Convertido</SelectItem>
                    <SelectItem value="Perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sourceFilter}
                  onValueChange={(value) => setSourceFilter(value as LeadSource | "Todos")}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todas as Origens</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="w-full overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium text-xs">Nome</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Contato</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Origem</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Status</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Interesse</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Responsável</th>
                    <th className="py-3 px-4 text-left font-medium text-xs">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-t hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{lead.nome}</p>
                            <p className="text-xs text-muted-foreground">{lead.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{lead.telefone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(lead.fonte)}
                          <span>{lead.fonte}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{lead.procedimentoInteresse}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.valorEstimado ? `R$ ${lead.valorEstimado.toLocaleString('pt-BR')}` : '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{lead.responsavel || "-"}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Cadastro:</p>
                          <p className="text-sm">{formatDate(lead.dataCadastro)}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLeads.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum lead encontrado com os filtros aplicados.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CRMDashboard;