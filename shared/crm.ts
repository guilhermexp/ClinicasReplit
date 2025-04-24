// Enums para o módulo CRM

// Status do lead
export enum LeadStatus {
  NOVO = "Novo",
  EM_CONTATO = "Em contato",
  AGENDADO = "Agendado",
  CONVERTIDO = "Convertido",
  PERDIDO = "Perdido"
}

// Origem do lead
export enum LeadSource {
  INSTAGRAM = "Instagram",
  FACEBOOK = "Facebook",
  SITE = "Site",
  INDICACAO = "Indicação",
  GOOGLE = "Google",
  WHATSAPP = "WhatsApp",
  OUTRO = "Outro"
}

// Tipo de interação
export enum InteractionType {
  TELEFONE = "Telefone",
  EMAIL = "Email",
  WHATSAPP = "WhatsApp",
  PRESENCIAL = "Presencial",
  INSTAGRAM = "Instagram", 
  FACEBOOK = "Facebook",
  OUTRO = "Outro"
}

// Status do agendamento
export enum AppointmentStatus {
  PENDENTE = "Pendente",
  CONFIRMADO = "Confirmado",
  REALIZADO = "Realizado",
  CANCELADO = "Cancelado",
  NAO_COMPARECEU = "Não compareceu"
}

// Convertendo enums para pgEnum
export const leadStatusEnum = Object.values(LeadStatus);
export const leadSourceEnum = Object.values(LeadSource);
export const interactionTypeEnum = Object.values(InteractionType);
export const appointmentStatusEnum = Object.values(AppointmentStatus);