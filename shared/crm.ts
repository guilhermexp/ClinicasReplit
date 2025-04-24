// Definição dos tipos de dados para o CRM
import { z } from "zod";

export const leadStatusEnum = z.enum(['Novo', 'Em contato', 'Agendado', 'Convertido', 'Perdido']);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

export const leadSourceEnum = z.enum(['Instagram', 'Facebook', 'Site', 'Indicação', 'Google', 'WhatsApp', 'Outro']);
export type LeadSource = z.infer<typeof leadSourceEnum>;

export const interactionTypeEnum = z.enum(['Mensagem', 'Ligação', 'Email', 'Atendimento', 'Outro']);
export type InteractionType = z.infer<typeof interactionTypeEnum>;

export const appointmentStatusEnum = z.enum(['Confirmado', 'Pendente', 'Cancelado', 'Realizado']);
export type AppointmentStatus = z.infer<typeof appointmentStatusEnum>;

// Lead schema
export const leadSchema = z.object({
  id: z.number(),
  clinicId: z.number(),
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().nullable(),
  telefone: z.string().min(1, "Telefone é obrigatório"),
  fonte: leadSourceEnum,
  status: leadStatusEnum,
  dataCadastro: z.date(),
  ultimaAtualizacao: z.date(),
  procedimentoInteresse: z.string().optional().nullable(),
  valorEstimado: z.number().optional().nullable(),
  responsavel: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable()
});

export type Lead = z.infer<typeof leadSchema>;
export const insertLeadSchema = leadSchema.omit({ id: true, dataCadastro: true, ultimaAtualizacao: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Lead Interaction schema
export const leadInteractionSchema = z.object({
  id: z.number(),
  leadId: z.number(),
  data: z.date(),
  tipo: interactionTypeEnum,
  descricao: z.string(),
  responsavel: z.string()
});

export type LeadInteraction = z.infer<typeof leadInteractionSchema>;
export const insertLeadInteractionSchema = leadInteractionSchema.omit({ id: true });
export type InsertLeadInteraction = z.infer<typeof insertLeadInteractionSchema>;

// Lead Appointment schema
export const leadAppointmentSchema = z.object({
  id: z.number(),
  leadId: z.number(),
  data: z.date(),
  horario: z.string(),
  procedimento: z.string(),
  status: appointmentStatusEnum,
  observacoes: z.string().optional().nullable()
});

export type LeadAppointment = z.infer<typeof leadAppointmentSchema>;
export const insertLeadAppointmentSchema = leadAppointmentSchema.omit({ id: true });
export type InsertLeadAppointment = z.infer<typeof insertLeadAppointmentSchema>;