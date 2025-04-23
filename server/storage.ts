import {
  User, InsertUser, UserRole,
  Clinic, InsertClinic,
  ClinicUser, InsertClinicUser, ClinicRole,
  Permission, InsertPermission,
  Client, InsertClient,
  Professional, InsertProfessional,
  Service, InsertService,
  Appointment, InsertAppointment, AppointmentStatus,
  Invitation, InsertInvitation,
  Payment, InsertPayment, PaymentStatus,
  Commission, InsertCommission,
  users, clinics, clinicUsers, permissions, clients, professionals, services, appointments, invitations,
  payments, commissions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface for CRUD operations
export interface IStorage {
  // Propriedade de armazenamento de sessão
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Clinic operations
  getClinic(id: number): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: number, clinic: Partial<Clinic>): Promise<Clinic | undefined>;
  listClinics(): Promise<Clinic[]>;
  
  // ClinicUser operations
  getClinicUser(clinicId: number, userId: number): Promise<ClinicUser | undefined>;
  createClinicUser(clinicUser: InsertClinicUser): Promise<ClinicUser>;
  updateClinicUser(id: number, clinicUser: Partial<ClinicUser>): Promise<ClinicUser | undefined>;
  listClinicUsers(clinicId: number): Promise<ClinicUser[]>;
  
  // Permission operations
  getPermissions(clinicUserId: number): Promise<Permission[]>;
  createPermission(permission: InsertPermission): Promise<Permission>;
  deletePermission(id: number): Promise<boolean>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  listClients(clinicId: number): Promise<Client[]>;
  
  // Professional operations
  getProfessional(id: number): Promise<Professional | undefined>;
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  listProfessionals(clinicId: number): Promise<Professional[]>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  listServices(clinicId: number): Promise<Service[]>;
  
  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  listAppointments(clinicId: number): Promise<Appointment[]>;
  
  // Invitation operations
  getInvitation(token: string): Promise<Invitation | undefined>;
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  deleteInvitation(id: number): Promise<boolean>;
  listInvitations(clinicId: number): Promise<Invitation[]>;
  
  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  updatePaymentByStripeId(stripePaymentIntentId: string, payment: Partial<Payment>): Promise<Payment | undefined>;
  listPaymentsByClinic(clinicId: number): Promise<Payment[]>;
  listPaymentsByAppointment(appointmentId: number): Promise<Payment[]>;
  listPaymentsByClient(clientId: number): Promise<Payment[]>;
  
  // Commission operations
  getCommission(id: number): Promise<Commission | undefined>;
  createCommission(commission: InsertCommission): Promise<Commission>;
  updateCommission(id: number, commission: Partial<Commission>): Promise<Commission | undefined>;
  listCommissionsByClinic(clinicId: number): Promise<Commission[]>;
  listCommissionsByProfessional(professionalId: number): Promise<Commission[]>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      // Buscar apenas os campos que existem no banco de dados para evitar erros
      const result = await db.execute(
        sql`SELECT 
            id, name, email, password, role, is_active AS "isActive", 
            last_login AS "lastLogin", created_by AS "createdBy", 
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM users 
          WHERE id = ${id}`
      );
      
      if (result.rows.length === 0) return undefined;
      
      const user = result.rows[0] as any;
      // Adicionar campos vazios para propriedades que estão no schema mas não no banco
      user.preferences = {};
      user.phone = null;
      user.profilePhoto = null;
      user.stripeCustomerId = null;
      user.stripeSubscriptionId = null;
      
      return user as User;
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Buscar apenas os campos que existem no banco de dados para evitar erros
      const result = await db.execute(
        sql`SELECT 
            id, name, email, password, role, is_active AS "isActive", 
            last_login AS "lastLogin", created_by AS "createdBy", 
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM users 
          WHERE email = ${email}`
      );
      
      if (result.rows.length === 0) return undefined;
      
      const user = result.rows[0] as any;
      // Adicionar campos vazios para propriedades que estão no schema mas não no banco
      user.preferences = {};
      user.phone = null;
      user.profilePhoto = null;
      user.stripeCustomerId = null;
      user.stripeSubscriptionId = null;
      
      return user as User;
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    try {
      const result = await db.execute(
        sql`SELECT 
            id, name, email, password, role, is_active AS "isActive", 
            last_login AS "lastLogin", created_by AS "createdBy", 
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM users`
      );
      
      // Adicionar campos vazios para propriedades que estão no schema mas não no banco
      const users = result.rows.map((user: any) => {
        user.preferences = {};
        user.phone = null;
        user.profilePhoto = null;
        user.stripeCustomerId = null;
        user.stripeSubscriptionId = null;
        return user;
      });
      
      return users as User[];
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return [];
    }
  }
  
  // Clinic operations
  async getClinic(id: number): Promise<Clinic | undefined> {
    try {
      const result = await db.execute(
        sql`SELECT 
            id, name, logo, address, phone, opening_hours AS "openingHours",
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM clinics
          WHERE id = ${id}`
      );
      
      if (result.rows.length === 0) return undefined;
      
      return result.rows[0] as Clinic;
    } catch (error) {
      console.error("Erro ao buscar clínica:", error);
      return undefined;
    }
  }
  
  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const [newClinic] = await db.insert(clinics).values(clinic).returning();
    return newClinic;
  }
  
  async updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic | undefined> {
    const [updatedClinic] = await db
      .update(clinics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return updatedClinic;
  }
  
  async listClinics(): Promise<Clinic[]> {
    try {
      const result = await db.execute(
        sql`SELECT 
            id, name, logo, address, phone, opening_hours AS "openingHours",
            created_at AS "createdAt", updated_at AS "updatedAt"
          FROM clinics`
      );
      
      return result.rows as Clinic[];
    } catch (error) {
      console.error("Erro ao listar clínicas:", error);
      return [];
    }
  }
  
  // ClinicUser operations
  async getClinicUser(clinicId: number, userId: number): Promise<ClinicUser | undefined> {
    const [clinicUser] = await db
      .select()
      .from(clinicUsers)
      .where(and(
        eq(clinicUsers.clinicId, clinicId),
        eq(clinicUsers.userId, userId)
      ));
    return clinicUser;
  }
  
  async createClinicUser(clinicUser: InsertClinicUser): Promise<ClinicUser> {
    const [newClinicUser] = await db.insert(clinicUsers).values(clinicUser).returning();
    return newClinicUser;
  }
  
  async updateClinicUser(id: number, updates: Partial<ClinicUser>): Promise<ClinicUser | undefined> {
    const [updatedClinicUser] = await db
      .update(clinicUsers)
      .set(updates)
      .where(eq(clinicUsers.id, id))
      .returning();
    return updatedClinicUser;
  }
  
  async listClinicUsers(clinicId?: number, userId?: number): Promise<ClinicUser[]> {
    if (clinicId !== undefined && userId !== undefined) {
      return await db
        .select()
        .from(clinicUsers)
        .where(and(
          eq(clinicUsers.clinicId, clinicId),
          eq(clinicUsers.userId, userId)
        ));
    }
    
    if (clinicId !== undefined) {
      return await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.clinicId, clinicId));
    }
    
    if (userId !== undefined) {
      return await db
        .select()
        .from(clinicUsers)
        .where(eq(clinicUsers.userId, userId));
    }
    
    return await db.select().from(clinicUsers);
  }
  
  // Permission operations
  async getPermissions(clinicUserId: number): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.clinicUserId, clinicUserId));
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }
  
  async deletePermission(id: number): Promise<boolean> {
    const result = await db
      .delete(permissions)
      .where(eq(permissions.id, id));
    return !!result;
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }
  
  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }
  
  async listClients(clinicId: number): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.clinicId, clinicId));
  }
  
  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    return professional;
  }
  
  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const [newProfessional] = await db.insert(professionals).values(professional).returning();
    return newProfessional;
  }
  
  async listProfessionals(clinicId: number): Promise<Professional[]> {
    return await db
      .select()
      .from(professionals)
      .where(eq(professionals.clinicId, clinicId));
  }
  
  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }
  
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }
  
  async listServices(clinicId: number): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.clinicId, clinicId));
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values(appointment).returning();
    return newAppointment;
  }
  
  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }
  
  async listAppointments(clinicId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId));
  }
  
  // Invitation operations
  async getInvitation(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token));
    return invitation;
  }
  
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const [newInvitation] = await db.insert(invitations).values(invitation).returning();
    return newInvitation;
  }
  
  async deleteInvitation(id: number): Promise<boolean> {
    const result = await db
      .delete(invitations)
      .where(eq(invitations.id, id));
    return !!result;
  }
  
  async listInvitations(clinicId: number): Promise<Invitation[]> {
    return await db
      .select()
      .from(invitations)
      .where(eq(invitations.clinicId, clinicId));
  }
  
  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }
  
  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment;
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values({
      ...payment,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newPayment;
  }
  
  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  async updatePaymentByStripeId(stripePaymentIntentId: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
      .returning();
    return updatedPayment;
  }
  
  async listPaymentsByClinic(clinicId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.clinicId, clinicId));
  }
  
  async listPaymentsByAppointment(appointmentId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.appointmentId, appointmentId));
  }
  
  async listPaymentsByClient(clientId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId));
  }
  
  // Commission operations
  async getCommission(id: number): Promise<Commission | undefined> {
    const [commission] = await db.select().from(commissions).where(eq(commissions.id, id));
    return commission;
  }
  
  async createCommission(commission: InsertCommission): Promise<Commission> {
    const [newCommission] = await db.insert(commissions).values({
      ...commission,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newCommission;
  }
  
  async updateCommission(id: number, updates: Partial<Commission>): Promise<Commission | undefined> {
    const [updatedCommission] = await db
      .update(commissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commissions.id, id))
      .returning();
    return updatedCommission;
  }
  
  async listCommissionsByClinic(clinicId: number): Promise<Commission[]> {
    return await db
      .select()
      .from(commissions)
      .where(eq(commissions.clinicId, clinicId));
  }
  
  async listCommissionsByProfessional(professionalId: number): Promise<Commission[]> {
    return await db
      .select()
      .from(commissions)
      .where(eq(commissions.professionalId, professionalId));
  }
}

export const storage = new DatabaseStorage();