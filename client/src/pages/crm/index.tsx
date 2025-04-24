import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { type Lead } from "@shared/schema";
import { AddLeadDialog } from "@/components/crm/add-lead-dialog";
import { LeadDetailsDialog } from "@/components/crm/lead-details-dialog";
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
  Plus,
  Instagram,
  Facebook,
  Globe,
  UserCheck,
  MessageSquare,
  ChevronDown
} from "lucide-react";

function CRMDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "Todos">("Todos");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "Todos">("Todos");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [leadDetailsDialogOpen, setLeadDetailsDialogOpen] = useState(false);
  
  // Get active clinic
  const { data: clinics } = useQuery({
    queryKey: ["/api/clinics"],
    queryFn: async () => {
      const res = await fetch("/api/clinics");
      if (!res.ok) throw new Error("Failed to fetch clinics");
      return await res.json();
    }
  });
  
  const activeClinic = clinics?.[0];
  
  // Fetch leads for active clinic
  const { 
    data: leads = [],
    isLoading: isLoadingLeads,
    isError: isLeadsError,
    error: leadsError
  } = useQuery({
    queryKey: [`/api/clinics/${activeClinic?.id}/leads`],
    queryFn: async () => {
      if (!activeClinic?.id) return [];
      const res = await fetch(`/api/clinics/${activeClinic.id}/leads`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      return await res.json() as Lead[];
    },
    enabled: !!activeClinic?.id
  });
  
  // Fetch CRM stats
  const {
    data: crmStats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: [`/api/clinics/${activeClinic?.id}/crm/stats`],
    queryFn: async () => {
      if (!activeClinic?.id) return null;
      const res = await fetch(`/api/clinics/${activeClinic.id}/crm/stats`);
      if (!res.ok) throw new Error("Failed to fetch CRM stats");
      return await res.json();
    },
    enabled: !!activeClinic?.id
  });

  // Filtrar leads baseado nos filtros
  const filteredLeads = React.useMemo(() => {
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
    
    return result;
  }, [leads, statusFilter, sourceFilter, searchQuery]);

  // Contadores para o dashboard
  const getLeadsByStatus = (status: string): number => {
    return leads.filter(lead => lead.status === status).length;
  };

  const getLeadsBySource = (): Record<string, number> => {
    return leads.reduce((acc, lead) => {
      acc[lead.fonte] = (acc[lead.fonte] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  // Funções auxiliares
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      [LeadStatus.NOVO]: "bg-blue-100 text-blue-800",
      [LeadStatus.EM_CONTATO]: "bg-indigo-100 text-indigo-800",
      [LeadStatus.AGENDADO]: "bg-yellow-100 text-yellow-800",
      [LeadStatus.CONVERTIDO]: "bg-green-100 text-green-800",
      [LeadStatus.PERDIDO]: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getSourceIcon = (source: string): JSX.Element => {
    const icons: Record<string, JSX.Element> = {
      [LeadSource.INSTAGRAM]: <Instagram size={16} className="text-pink-500" />,
      [LeadSource.FACEBOOK]: <Facebook size={16} className="text-blue-600" />,
      [LeadSource.SITE]: <Globe size={16} className="text-purple-500" />,
      [LeadSource.INDICACAO]: <UserCheck size={16} className="text-green-500" />,
      [LeadSource.GOOGLE]: <Search size={16} className="text-red-500" />,
      [LeadSource.WHATSAPP]: <MessageSquare size={16} className="text-green-600" />,
      [LeadSource.OUTRO]: <ChevronDown size={16} className="text-gray-500" />
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
        <Button 
          className="gap-2"
          onClick={() => setAddLeadDialogOpen(true)}
        >
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
                <h2 className="text-3xl font-bold">{getLeadsByStatus(LeadStatus.NOVO)}</h2>
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
                <h2 className="text-3xl font-bold">{getLeadsByStatus(LeadStatus.CONVERTIDO)}</h2>
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
                    ? `${(getLeadsByStatus(LeadStatus.CONVERTIDO) / leads.length * 100).toFixed(1)}%` 
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
                  <span>Novo ({getLeadsByStatus(LeadStatus.NOVO)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span>Em contato ({getLeadsByStatus(LeadStatus.EM_CONTATO)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Agendado ({getLeadsByStatus(LeadStatus.AGENDADO)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Convertido ({getLeadsByStatus(LeadStatus.CONVERTIDO)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Perdido ({getLeadsByStatus(LeadStatus.PERDIDO)})</span>
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
                  {getSourceIcon(source)}
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
                    <SelectItem value={LeadStatus.NOVO}>Novo</SelectItem>
                    <SelectItem value={LeadStatus.EM_CONTATO}>Em contato</SelectItem>
                    <SelectItem value={LeadStatus.AGENDADO}>Agendado</SelectItem>
                    <SelectItem value={LeadStatus.CONVERTIDO}>Convertido</SelectItem>
                    <SelectItem value={LeadStatus.PERDIDO}>Perdido</SelectItem>
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
                    <SelectItem value={LeadSource.INSTAGRAM}>Instagram</SelectItem>
                    <SelectItem value={LeadSource.FACEBOOK}>Facebook</SelectItem>
                    <SelectItem value={LeadSource.SITE}>Site</SelectItem>
                    <SelectItem value={LeadSource.INDICACAO}>Indicação</SelectItem>
                    <SelectItem value={LeadSource.GOOGLE}>Google</SelectItem>
                    <SelectItem value={LeadSource.WHATSAPP}>WhatsApp</SelectItem>
                    <SelectItem value={LeadSource.OUTRO}>Outro</SelectItem>
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
                    <tr 
                      key={lead.id} 
                      className="border-t hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead);
                        setLeadDetailsDialogOpen(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{lead.nome}</p>
                            <p className="text-xs text-muted-foreground">{lead.email || '-'}</p>
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
                          <p className="font-medium">{lead.procedimentoInteresse || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.valorEstimado ? `R$ ${lead.valorEstimado.toLocaleString('pt-BR')}` : '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{lead.responsavel || "-"}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Cadastro:</p>
                          <p className="text-sm">{formatDate(new Date(lead.dataCadastro))}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredLeads.length === 0 && (
                    <tr className="border-t">
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        {isLoadingLeads ? (
                          <div className="flex justify-center items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                            <span>Carregando leads...</span>
                          </div>
                        ) : (
                          <>
                            {isLeadsError ? (
                              <div>
                                <p>Erro ao carregar leads.</p>
                                <p className="text-sm">{String(leadsError)}</p>
                              </div>
                            ) : "Nenhum lead encontrado com os filtros selecionados."}
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {activeClinic && (
        <>
          <AddLeadDialog 
            open={addLeadDialogOpen} 
            onOpenChange={setAddLeadDialogOpen} 
            clinicId={activeClinic.id}
            onSuccess={() => {
              // Recarregar os leads
              const queryKey = `/api/clinics/${activeClinic.id}/leads`;
              queryClient.invalidateQueries({ queryKey: [queryKey] });
            }}
          />
          
          {selectedLead && (
            <LeadDetailsDialog
              open={leadDetailsDialogOpen}
              onOpenChange={setLeadDetailsDialogOpen}
              lead={selectedLead}
            />
          )}
        </>
      )}
    </div>
  );
}

export default CRMDashboard;