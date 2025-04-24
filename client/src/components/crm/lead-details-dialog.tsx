import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead, LeadInteraction, LeadAppointment } from "@shared/schema";
import { LeadStatus, LeadSource, InteractionType, AppointmentStatus } from "@shared/crm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AddInteractionDialog } from "./add-interaction-dialog";
import { AddAppointmentDialog } from "./add-appointment-dialog";

import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Clock,
  ExternalLink,
  PlusCircle,
  Info,
  MessageCircle,
  CalendarDays
} from "lucide-react";

interface LeadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function LeadDetailsDialog({ 
  open, 
  onOpenChange, 
  lead
}: LeadDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  
  // Buscar interações do lead
  const { 
    data: interactions,
    isLoading: isLoadingInteractions
  } = useQuery({
    queryKey: [`/api/leads/${lead?.id}/interactions`],
    queryFn: async () => {
      if (!lead?.id) return [];
      const res = await fetch(`/api/leads/${lead.id}/interactions`);
      if (!res.ok) throw new Error("Falha ao carregar interações");
      return await res.json() as LeadInteraction[];
    },
    enabled: !!lead?.id && open
  });
  
  // Buscar agendamentos do lead
  const { 
    data: appointments,
    isLoading: isLoadingAppointments
  } = useQuery({
    queryKey: [`/api/leads/${lead?.id}/appointments`],
    queryFn: async () => {
      if (!lead?.id) return [];
      const res = await fetch(`/api/leads/${lead.id}/appointments`);
      if (!res.ok) throw new Error("Falha ao carregar agendamentos");
      return await res.json() as LeadAppointment[];
    },
    enabled: !!lead?.id && open
  });
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [LeadStatus.NOVO]: "bg-blue-500",
      [LeadStatus.EM_CONTATO]: "bg-indigo-500",
      [LeadStatus.AGENDADO]: "bg-yellow-500",
      [LeadStatus.CONVERTIDO]: "bg-green-500",
      [LeadStatus.PERDIDO]: "bg-red-500"
    };
    return colors[status] || "bg-gray-500";
  };
  
  const getAppointmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [AppointmentStatus.PENDENTE]: "bg-yellow-500",
      [AppointmentStatus.CONFIRMADO]: "bg-blue-500",
      [AppointmentStatus.REALIZADO]: "bg-green-500",
      [AppointmentStatus.CANCELADO]: "bg-red-500",
      [AppointmentStatus.NAO_COMPARECEU]: "bg-gray-500"
    };
    return colors[status] || "bg-gray-500";
  };
  
  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };
  
  const formatDateTime = (date: Date | string) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  if (!lead) return null;
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden bg-background/80 backdrop-blur-xl">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10 bg-primary">
                <User className="h-6 w-6 text-white" />
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{lead.nome}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary"
                      className={`${getStatusColor(lead.status)} text-white`}
                    >
                      {lead.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Lead desde {formatDate(lead.dataCadastro)}
                    </span>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="detalhes" className="flex-1">
                <Info className="mr-2 h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="interacoes" className="flex-1">
                <MessageCircle className="mr-2 h-4 w-4" />
                Interações {interactions?.length > 0 && `(${interactions.length})`}
              </TabsTrigger>
              <TabsTrigger value="agendamentos" className="flex-1">
                <CalendarDays className="mr-2 h-4 w-4" />
                Agendamentos {appointments?.length > 0 && `(${appointments.length})`}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="detalhes" className="h-full">
                <ScrollArea className="h-[calc(80vh-12rem)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações de Contato</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">
                              {lead.email || "-"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Telefone</p>
                            <p className="text-sm text-muted-foreground">
                              {lead.telefone}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Origem e Interesse</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Origem</p>
                            <p className="text-sm text-muted-foreground">
                              {lead.fonte}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Procedimento de Interesse</p>
                            <p className="text-sm text-muted-foreground">
                              {lead.procedimentoInteresse || "-"}
                            </p>
                          </div>
                        </div>
                        
                        {lead.valorEstimado > 0 && (
                          <div className="flex items-start gap-3">
                            <span className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">R$</span>
                            <div>
                              <p className="text-sm font-medium">Valor Estimado</p>
                              <p className="text-sm text-muted-foreground">
                                {lead.valorEstimado.toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Datas</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Data de Cadastro</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(lead.dataCadastro)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Última Atualização</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(lead.ultimaAtualizacao)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {lead.observacoes && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Observações</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {lead.observacoes}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="interacoes" className="h-full flex flex-col">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="default" 
                    className="gap-1"
                    onClick={() => setInteractionDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Nova Interação
                  </Button>
                </div>
                
                <ScrollArea className="h-[calc(80vh-16rem)] rounded-md border p-4">
                  {isLoadingInteractions ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Carregando interações...</p>
                    </div>
                  ) : !interactions?.length ? (
                    <div className="flex flex-col justify-center items-center h-40">
                      <p className="text-muted-foreground mb-2">Nenhuma interação registrada</p>
                      <Button 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => setInteractionDialogOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Registrar Primeira Interação
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {interactions.map((interaction, index) => (
                        <div key={interaction.id} className="relative">
                          {index > 0 && (
                            <div className="absolute left-5 -top-6 bottom-full w-px bg-border" />
                          )}
                          
                          <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                <div>
                                  <p className="font-medium">
                                    {interaction.tipo}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Responsável: {interaction.responsavel}
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(interaction.data)}
                                </p>
                              </div>
                              
                              <p className="text-sm mb-2 p-3 bg-muted rounded-md">
                                {interaction.descricao}
                              </p>
                            </div>
                          </div>
                          
                          {index < interactions.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-px bg-border" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="agendamentos" className="h-full flex flex-col">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="default" 
                    className="gap-1"
                    onClick={() => setAppointmentDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Novo Agendamento
                  </Button>
                </div>
                
                <ScrollArea className="h-[calc(80vh-16rem)] rounded-md border p-4">
                  {isLoadingAppointments ? (
                    <div className="flex justify-center items-center h-40">
                      <p className="text-muted-foreground">Carregando agendamentos...</p>
                    </div>
                  ) : !appointments?.length ? (
                    <div className="flex flex-col justify-center items-center h-40">
                      <p className="text-muted-foreground mb-2">Nenhum agendamento registrado</p>
                      <Button 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => setAppointmentDialogOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Agendar Primeira Consulta
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <Card key={appointment.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base">{appointment.procedimento}</CardTitle>
                              <Badge 
                                variant="secondary"
                                className={`${getAppointmentStatusColor(appointment.status)} text-white`}
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Data</p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(appointment.data)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">Horário</p>
                                  <p className="text-sm text-muted-foreground">
                                    {appointment.horario}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {appointment.observacoes && (
                              <div className="mt-4">
                                <p className="text-sm font-medium">Observações</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {appointment.observacoes}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Diálogos filhos */}
      <AddInteractionDialog
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
        lead={lead}
      />
      
      <AddAppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        lead={lead}
      />
    </>
  );
}