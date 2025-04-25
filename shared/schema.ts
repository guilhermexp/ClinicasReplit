import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, primaryKey, jsonb, date, decimal, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { leadSourceEnum, leadStatusEnum, interactionTypeEnum, appointmentStatusEnum } from "./crm";

// User Role enum
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLINIC_OWNER = "CLINIC_OWNER",
  CLINIC_MANAGER = "CLINIC_MANAGER",
  DOCTOR = "DOCTOR",
  RECEPTIONIST = "RECEPTIONIST",
  FINANCIAL = "FINANCIAL",
  MARKETING = "MARKETING",
  STAFF = "STAFF"
}

// Clinic Role enum
export enum ClinicRole {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  PROFESSIONAL = "PROFESSIONAL",
  RECEPTIONIST = "RECEPTIONIST",
  FINANCIAL = "FINANCIAL",
  MARKETING = "MARKETING",
  STAFF = "STAFF"
}

// Appointment Status enum
export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show"
}

// Payment Status enum
export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  PARTIAL = "partial"
}

// Service Category enum
export enum ServiceCategory {
  FACIAL = "facial",
  BODY = "body",
  HAIR = "hair",
  LASER = "laser",
  INJECTABLES = "injectables",
  MASSAGES = "massages",
  OTHER = "other"
}

// Document Type enum
export enum DocumentType {
  CONTRACT = "contract",
  CONSENT_FORM = "consent_form",
  PRESCRIPTION = "prescription",
  BEFORE_AFTER = "before_after",
  MEDICAL_RECORD = "medical_record",
  OTHER = "other"
}

// Marketing Campaign Type enum
export enum CampaignType {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  SOCIAL_MEDIA = "social_media",
  PUSH_NOTIFICATION = "push_notification"
}

// Notification Type enum
export enum NotificationType {
  APPOINTMENT_REMINDER = "appointment_reminder",
  APPOINTMENT_CONFIRMATION = "appointment_confirmation",
  APPOINTMENT_CANCELLATION = "appointment_cancellation",
  PAYMENT_RECEIPT = "payment_receipt",
  PROMOTION = "promotion",
  BIRTHDAY = "birthday",
  OTHER = "other"
}

// Inventory Status enum
export enum InventoryStatus {
  IN_STOCK = "in_stock",
  LOW_STOCK = "low_stock",
  OUT_OF_STOCK = "out_of_stock",
  DISCONTINUED = "discontinued"
}

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").$type<UserRole>().notNull().default(UserRole.STAFF),
  isActive: boolean("is_active").notNull().default(true),
  phone: text("phone"),
  profilePhoto: text("profile_photo"),
  preferences: jsonb("preferences"),
  lastLogin: timestamp("last_login"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Clinics table
export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  address: text("address"),
  phone: text("phone"),
  openingHours: text("opening_hours"),
  email: text("email"),
  website: text("website"),
  socialMedia: jsonb("social_media"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ClinicUsers table - join table between clinics and users
export const clinicUsers = pgTable("clinic_users", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").$type<ClinicRole>().notNull().default(ClinicRole.STAFF),
  invitedBy: integer("invited_by"),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at"),
}, (table) => {
  return {
    clinicUserUnique: uniqueIndex("clinic_user_unique").on(table.clinicId, table.userId),
  };
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  clinicUserId: integer("clinic_user_id").notNull().references(() => clinicUsers.id),
  module: text("module").notNull(),
  action: text("action").notNull(),
}, (table) => {
  return {
    permissionUnique: uniqueIndex("permission_unique").on(table.clinicUserId, table.module, table.action),
  };
});

// Clients/Patients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  birthdate: timestamp("birthdate"),
  gender: text("gender"),
  photo: text("photo"),
  customFields: jsonb("custom_fields"),
  medicalHistory: jsonb("medical_history"),
  tags: text("tags").array(),
  status: text("status").default("active"),
  source: text("source"),
  lastVisit: timestamp("last_visit"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Professionals table
export const professionals = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  specialization: text("specialization"),
  bio: text("bio"),
  education: text("education"),
  workDays: integer("work_days").array(),
  workHoursStart: text("work_hours_start"),
  workHoursEnd: text("work_hours_end"),
  colors: text("colors"),
  commission: real("commission"), // Percentage commission for services
  photo: text("photo"),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").$type<ServiceCategory>().default(ServiceCategory.OTHER),
  duration: integer("duration").notNull(),
  price: integer("price").notNull(),
  discountPrice: integer("discount_price"),
  isActive: boolean("is_active").notNull().default(true),
  image: text("image"),
  professionalIds: integer("professional_ids").array(),
  commissionRate: real("commission_rate"),
  supplies: jsonb("supplies"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").$type<AppointmentStatus>().notNull().default(AppointmentStatus.SCHEDULED),
  notes: text("notes"),
  confirmationSent: boolean("confirmation_sent").default(false),
  reminderSent: boolean("reminder_sent").default(false),
  recurrence: jsonb("recurrence"),
  colorLabel: text("color_label"),
  title: text("title"),
  reasonForCancellation: text("reason_for_cancellation"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  amount: integer("amount").notNull(), // in cents
  status: text("status").$type<PaymentStatus>().notNull().default(PaymentStatus.PENDING),
  paymentMethod: text("payment_method").notNull(),
  paymentDate: timestamp("payment_date"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  receiptUrl: text("receipt_url"),
  refundAmount: integer("refund_amount"),
  refundReason: text("refund_reason"),
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Commissions table
export const commissions = pgTable("commissions", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  professionalId: integer("professional_id").notNull().references(() => professionals.id),
  paymentId: integer("payment_id").notNull().references(() => payments.id),
  amount: integer("amount").notNull(), // in cents
  rate: real("rate").notNull(), // percentage (e.g. 0.15 for 15%)
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  clientId: integer("client_id").references(() => clients.id),
  name: text("name").notNull(),
  type: text("type").$type<DocumentType>().notNull(),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory Products table
export const inventoryProducts = pgTable("inventory_products", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  sku: text("sku"),
  description: text("description"),
  category: text("category"),
  price: integer("price"),
  costPrice: integer("cost_price"),
  quantity: integer("quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold"),
  image: text("image"),
  supplier: text("supplier"),
  location: text("location"),
  status: text("status").$type<InventoryStatus>().notNull().default(InventoryStatus.IN_STOCK),
  expiryDate: timestamp("expiry_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Marketing Campaigns table
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  name: text("name").notNull(),
  type: text("type").$type<CampaignType>().notNull(),
  status: text("status").notNull().default("draft"),
  targetSegment: jsonb("target_segment"),
  content: text("content").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  template: text("template"),
  metrics: jsonb("metrics"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  userId: integer("user_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  type: text("type").$type<NotificationType>().notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  channel: text("channel").notNull(),
  deliveryStatus: text("delivery_status").notNull().default("pending"),
  data: jsonb("data"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invitations table
export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  role: text("role").$type<ClinicRole>().notNull(),
  token: text("token").notNull(),
  permissions: text("permissions"),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CRM - Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull().references(() => clinics.id),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone").notNull(),
  fonte: text("fonte").$type<string>().notNull(),
  status: text("status").$type<string>().notNull().default("Novo"),
  dataCadastro: timestamp("data_cadastro").notNull().defaultNow(),
  ultimaAtualizacao: timestamp("ultima_atualizacao").notNull().defaultNow(),
  procedimentoInteresse: text("procedimento_interesse"),
  valorEstimado: integer("valor_estimado"),
  responsavel: text("responsavel"),
  observacoes: text("observacoes"),
  createdBy: integer("created_by").references(() => users.id),
});

// CRM - Lead Interactions table
export const leadInteractions = pgTable("lead_interactions", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  data: timestamp("data").notNull().defaultNow(),
  tipo: text("tipo").$type<string>().notNull(),
  descricao: text("descricao").notNull(),
  responsavel: text("responsavel").notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// CRM - Lead Appointments table
export const leadAppointments = pgTable("lead_appointments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  data: timestamp("data").notNull(),
  horario: text("horario").notNull(),
  procedimento: text("procedimento").notNull(),
  status: text("status").$type<string>().notNull().default("Pendente"),
  observacoes: text("observacoes"),
  createdBy: integer("created_by").references(() => users.id),
});

// User devices table
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(),
  browser: text("browser"),
  operatingSystem: text("operating_system"),
  lastIp: text("last_ip"),
  lastActive: timestamp("last_active").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  userAgent: text("user_agent"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activity: text("activity").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceId: integer("device_id").references(() => userDevices.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User 2FA settings table
export const userTwoFactorAuth = pgTable("user_two_factor_auth", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  appEnabled: boolean("app_enabled").notNull().default(false),
  appSecret: text("app_secret"),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  backupCodes: text("backup_codes").array(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true, createdAt: true, updatedAt: true });
export const insertClinicSchema = createInsertSchema(clinics).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClinicUserSchema = createInsertSchema(clinicUsers).omit({ id: true, invitedAt: true, acceptedAt: true });
export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfessionalSchema = createInsertSchema(professionals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true, updatedAt: true });
export const updateServiceSchema = createInsertSchema(services).omit({ id: true, clinicId: true, createdAt: true, updatedAt: true }).partial();
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInventoryProductSchema = createInsertSchema(inventoryProducts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvitationSchema = createInsertSchema(invitations).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, dataCadastro: true, ultimaAtualizacao: true });
export const insertLeadInteractionSchema = createInsertSchema(leadInteractions).omit({ id: true, data: true });
export const insertLeadAppointmentSchema = createInsertSchema(leadAppointments).omit({ id: true });

// Typescript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;

export type ClinicUser = typeof clinicUsers.$inferSelect;
export type InsertClinicUser = z.infer<typeof insertClinicUserSchema>;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Commission = typeof commissions.$inferSelect;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type InventoryProduct = typeof inventoryProducts.$inferSelect;
export type InsertInventoryProduct = z.infer<typeof insertInventoryProductSchema>;

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type LeadInteraction = typeof leadInteractions.$inferSelect;
export type InsertLeadInteraction = z.infer<typeof insertLeadInteractionSchema>;

export type LeadAppointment = typeof leadAppointments.$inferSelect;
export type InsertLeadAppointment = z.infer<typeof insertLeadAppointmentSchema>;

// Schema para os dispositivos de usuário
export const insertUserDeviceSchema = createInsertSchema(userDevices).omit({ id: true, createdAt: true, updatedAt: true });
export type UserDevice = typeof userDevices.$inferSelect;
export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;

// Schema para logs de atividade
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Schema para configurações de 2FA
export const insertUserTwoFactorAuthSchema = createInsertSchema(userTwoFactorAuth).omit({ id: true, updatedAt: true });
export type UserTwoFactorAuth = typeof userTwoFactorAuth.$inferSelect;
export type InsertUserTwoFactorAuth = z.infer<typeof insertUserTwoFactorAuthSchema>;
