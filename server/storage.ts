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
  UserDevice, InsertUserDevice,
  ActivityLog, InsertActivityLog,
  UserTwoFactorAuth, InsertUserTwoFactorAuth,
  users, clinics, clinicUsers, permissions, clients, professionals, services, appointments, invitations,
  payments, commissions, userDevices, activityLogs, userTwoFactorAuth
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import memorystore from "memorystore";

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
  updateProfessional(id: number, professional: Partial<Professional>): Promise<Professional>;
  deleteProfessional(id: number): Promise<void>;
  getProfessionalsByClinic(clinicId: number): Promise<Professional[]>;
  getProfessionalByUserAndClinic(userId: number, clinicId: number): Promise<Professional | undefined>;
  getUsersByClinic(clinicId: number): Promise<User[]>;
  getClinicUserByUserAndClinic(userId: number, clinicId: number): Promise<ClinicUser | undefined>;
  
  // Service operations
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<Service>): Promise<Service>;
  deleteService(id: number): Promise<void>;
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
  
  // User device operations
  getUserDevice(id: number): Promise<UserDevice | undefined>;
  getUserDeviceByToken(token: string): Promise<UserDevice | undefined>;
  getUserDevices(userId: number): Promise<UserDevice[]>;
  createUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  updateUserDevice(id: number, device: Partial<UserDevice>): Promise<UserDevice | undefined>;
  deleteUserDevice(id: number): Promise<boolean>;
  revokeAllUserDevices(userId: number, exceptDeviceId?: number): Promise<boolean>;
  
  // Activity log operations
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getUserActivityLogs(userId: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Two-factor authentication operations
  getUserTwoFactorAuth(userId: number): Promise<UserTwoFactorAuth | undefined>;
  createUserTwoFactorAuth(twoFactorAuth: InsertUserTwoFactorAuth): Promise<UserTwoFactorAuth>;
  updateUserTwoFactorAuth(userId: number, twoFactorAuth: Partial<UserTwoFactorAuth>): Promise<UserTwoFactorAuth | undefined>;
}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    // Usar armazenamento em memória para sessões
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // limpar sessões expiradas a cada 24h
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
    try {
      const result = await db.execute(
        sql`SELECT 
            id, name, email, phone, address, birthdate, clinic_id AS "clinicId",
            created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
          FROM clients
          WHERE id = ${id}`
      );
      
      if (result.rows.length === 0) return undefined;
      
      // Adicionar campos que podem estar ausentes no banco de dados
      const client = result.rows[0] as any;
      client.status = client.status || null;
      client.notes = null;
      client.gender = null;
      client.occupation = null;
      client.source = null;
      client.documentId = null;
      client.documentType = null;
      client.tags = null;
      
      return client as Client;
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      return undefined;
    }
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    try {
      // Garantir que os campos existem no banco de dados
      const dbClient = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        birthdate: client.birthdate,
        clinic_id: client.clinicId,
        created_by: client.createdBy,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await db.execute(
        sql`INSERT INTO clients (name, email, phone, address, birthdate, clinic_id, created_by, created_at, updated_at)
            VALUES (${dbClient.name}, ${dbClient.email}, ${dbClient.phone}, ${dbClient.address}, 
                   ${dbClient.birthdate}, ${dbClient.clinic_id}, ${dbClient.created_by},
                   ${dbClient.created_at}, ${dbClient.updated_at})
            RETURNING *`
      );
      
      if (result.rows.length === 0) throw new Error("Falha ao criar cliente");
      
      // Converter nomes de colunas para camelCase
      const newClient = result.rows[0] as any;
      newClient.clinicId = newClient.clinic_id;
      newClient.createdBy = newClient.created_by;
      newClient.createdAt = newClient.created_at;
      newClient.updatedAt = newClient.updated_at;
      
      return newClient as Client;
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      throw error;
    }
  }
  
  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    try {
      // Obter o cliente atual
      const currentClient = await this.getClient(id);
      if (!currentClient) return undefined;
      
      // Preparar os campos a serem atualizados
      const fields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        fields.push("name = $" + (values.length + 1));
        values.push(updates.name);
      }
      
      if (updates.email !== undefined) {
        fields.push("email = $" + (values.length + 1));
        values.push(updates.email);
      }
      
      if (updates.phone !== undefined) {
        fields.push("phone = $" + (values.length + 1));
        values.push(updates.phone);
      }
      
      if (updates.address !== undefined) {
        fields.push("address = $" + (values.length + 1));
        values.push(updates.address);
      }
      
      if (updates.birthdate !== undefined) {
        fields.push("birthdate = $" + (values.length + 1));
        values.push(updates.birthdate);
      }
      
      // Adicionar campo de atualização
      fields.push("updated_at = $" + (values.length + 1));
      values.push(new Date());
      
      // Se não há campos para atualizar, retornar o cliente atual
      if (fields.length === 1) return currentClient;
      
      // Executar a atualização
      const result = await db.execute(
        sql`UPDATE clients SET ${sql.raw(fields.join(", "))} WHERE id = ${id} RETURNING *`,
        ...values
      );
      
      if (result.rows.length === 0) return undefined;
      
      // Retornar o cliente atualizado com todos os campos
      return this.getClient(id);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      return undefined;
    }
  }
  
  async listClients(clinicId: number): Promise<Client[]> {
    try {
      const result = await db.execute(
        sql`SELECT 
            id, name, email, phone, address, birthdate, clinic_id AS "clinicId",
            created_by AS "createdBy", created_at AS "createdAt", updated_at AS "updatedAt"
          FROM clients
          WHERE clinic_id = ${clinicId}`
      );
      
      // Adicionar campos que podem estar ausentes no banco de dados
      const clientList = result.rows.map((client: any) => {
        client.status = client.status || null;
        client.notes = null;
        client.gender = null;
        client.occupation = null;
        client.source = null;
        client.documentId = null;
        client.documentType = null;
        client.tags = null;
        return client;
      });
      
      return clientList as Client[];
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      return [];
    }
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
  
  async updateProfessional(id: number, updates: Partial<Professional>): Promise<Professional> {
    const [updatedProfessional] = await db
      .update(professionals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    
    if (!updatedProfessional) {
      throw new Error("Profissional não encontrado");
    }
    
    return updatedProfessional;
  }
  
  async deleteProfessional(id: number): Promise<void> {
    await db.delete(professionals).where(eq(professionals.id, id));
  }
  
  async getProfessionalsByClinic(clinicId: number): Promise<Professional[]> {
    return await db
      .select()
      .from(professionals)
      .where(eq(professionals.clinicId, clinicId));
  }
  
  // Usado para listagem retrocompatível
  async listProfessionals(clinicId: number): Promise<Professional[]> {
    return this.getProfessionalsByClinic(clinicId);
  }
  
  async getProfessionalByUserAndClinic(userId: number, clinicId: number): Promise<Professional | undefined> {
    const [professional] = await db
      .select()
      .from(professionals)
      .where(and(
        eq(professionals.userId, userId),
        eq(professionals.clinicId, clinicId)
      ));
    
    return professional;
  }
  
  async getUsersByClinic(clinicId: number): Promise<User[]> {
    const clinicUserRecords = await db
      .select()
      .from(clinicUsers)
      .where(eq(clinicUsers.clinicId, clinicId));
    
    const userIds = clinicUserRecords.map(record => record.userId);
    
    if (userIds.length === 0) {
      return [];
    }
    
    const userRecords = await Promise.all(
      userIds.map(userId => this.getUser(userId))
    );
    
    return userRecords.filter(user => user !== undefined) as User[];
  }
  
  async getClinicUserByUserAndClinic(userId: number, clinicId: number): Promise<ClinicUser | undefined> {
    const [clinicUser] = await db
      .select()
      .from(clinicUsers)
      .where(and(
        eq(clinicUsers.userId, userId),
        eq(clinicUsers.clinicId, clinicId)
      ));
    
    return clinicUser;
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
  
  async updateService(id: number, serviceData: Partial<Service>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }
  
  async deleteService(id: number): Promise<void> {
    await db
      .delete(services)
      .where(eq(services.id, id));
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
    try {
      const result = await db.execute(
        sql`SELECT 
            id, email, clinic_id AS "clinicId", role, token, permissions,
            invited_by AS "invitedBy", expires_at AS "expiresAt", 
            created_at AS "createdAt"
          FROM invitations
          WHERE token = ${token}`
      );
      
      if (result.rows.length === 0) return undefined;
      
      return result.rows[0] as Invitation;
    } catch (error) {
      console.error("Erro ao buscar convite por token:", error);
      return undefined;
    }
  }
  
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    try {
      const result = await db.execute(
        sql`INSERT INTO invitations (email, clinic_id, role, token, permissions, invited_by, expires_at, created_at)
            VALUES (
              ${invitation.email}, 
              ${invitation.clinicId}, 
              ${invitation.role}, 
              ${invitation.token}, 
              ${invitation.permissions}, 
              ${invitation.invitedBy}, 
              ${invitation.expiresAt}, 
              NOW()
            )
            RETURNING id, email, clinic_id AS "clinicId", role, token, permissions, invited_by AS "invitedBy", expires_at AS "expiresAt", created_at AS "createdAt"`
      );
      
      if (result.rows.length === 0) throw new Error("Falha ao criar convite");
      
      return result.rows[0] as Invitation;
    } catch (error) {
      console.error("Erro ao criar convite:", error);
      throw error;
    }
  }
  
  async deleteInvitation(id: number): Promise<boolean> {
    const result = await db
      .delete(invitations)
      .where(eq(invitations.id, id));
    return !!result;
  }
  
  async listInvitations(clinicId: number): Promise<Invitation[]> {
    try {
      const result = await db.execute(
        sql`SELECT 
            id, email, clinic_id AS "clinicId", role, token, permissions,
            invited_by AS "invitedBy", expires_at AS "expiresAt", 
            created_at AS "createdAt"
          FROM invitations
          WHERE clinic_id = ${clinicId}`
      );
      
      return result.rows as Invitation[];
    } catch (error) {
      console.error("Erro ao listar convites:", error);
      return [];
    }
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
  
  // Implementação das operações de dispositivos de usuário
  async getUserDevice(id: number): Promise<UserDevice | undefined> {
    const [device] = await db
      .select()
      .from(userDevices)
      .where(eq(userDevices.id, id));
    return device;
  }
  
  async getUserDeviceByToken(token: string): Promise<UserDevice | undefined> {
    const [device] = await db
      .select()
      .from(userDevices)
      .where(eq(userDevices.token, token));
    return device;
  }
  
  async getUserDevices(userId: number): Promise<UserDevice[]> {
    try {
      // Tentar obter os dispositivos com todas as colunas
      const devices = await db
        .select()
        .from(userDevices)
        .where(eq(userDevices.userId, userId));
      
      // Adicionar a propriedade isCurrent temporariamente se ela ainda não existir na tabela
      return devices.map(device => ({
        ...device,
        isCurrent: false
      }));
    } catch (error) {
      console.error("Erro ao buscar dispositivos do usuário:", error);
      // Buscar apenas as colunas que sabemos que existem
      const devices = await db
        .select({
          id: userDevices.id,
          userId: userDevices.userId,
          deviceName: userDevices.deviceName,
          deviceType: userDevices.deviceType,
          browser: userDevices.browser,
          operatingSystem: userDevices.operatingSystem,
          lastIp: userDevices.lastIp,
          lastActive: userDevices.lastActive,
          isActive: userDevices.isActive,
          userAgent: userDevices.userAgent,
          token: userDevices.token,
          expiresAt: userDevices.expiresAt,
          createdAt: userDevices.createdAt,
          updatedAt: userDevices.updatedAt
        })
        .from(userDevices)
        .where(eq(userDevices.userId, userId));
      
      // Adicionar a propriedade isCurrent temporariamente
      return devices.map(device => ({
        ...device,
        isCurrent: false
      }));
    }
  }
  
  async createUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    const [newDevice] = await db
      .insert(userDevices)
      .values({
        ...device,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newDevice;
  }
  
  async updateUserDevice(id: number, updates: Partial<UserDevice>): Promise<UserDevice | undefined> {
    const [updatedDevice] = await db
      .update(userDevices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userDevices.id, id))
      .returning();
    return updatedDevice;
  }
  
  async deleteUserDevice(id: number): Promise<boolean> {
    const result = await db
      .delete(userDevices)
      .where(eq(userDevices.id, id));
    return !!result;
  }
  
  async revokeAllUserDevices(userId: number, exceptDeviceId?: number): Promise<boolean> {
    try {
      if (exceptDeviceId) {
        await db
          .update(userDevices)
          .set({ isActive: false, updatedAt: new Date() })
          .where(and(
            eq(userDevices.userId, userId),
            sql`id != ${exceptDeviceId}`
          ));
      } else {
        await db
          .update(userDevices)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(userDevices.userId, userId));
      }
      return true;
    } catch (error) {
      console.error("Erro ao revogar todos os dispositivos:", error);
      return false;
    }
  }
  
  // Implementação das operações de logs de atividade
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.id, id));
    return log;
  }
  
  async getUserActivityLogs(userId: number, limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(sql`${activityLogs.createdAt} DESC`)
      .limit(limit);
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
    return newLog;
  }
  
  // Implementação das operações de autenticação de dois fatores
  async getUserTwoFactorAuth(userId: number): Promise<UserTwoFactorAuth | undefined> {
    const [twoFA] = await db
      .select()
      .from(userTwoFactorAuth)
      .where(eq(userTwoFactorAuth.userId, userId));
    return twoFA;
  }
  
  async createUserTwoFactorAuth(twoFactorAuth: InsertUserTwoFactorAuth): Promise<UserTwoFactorAuth> {
    const [newTwoFA] = await db
      .insert(userTwoFactorAuth)
      .values({
        ...twoFactorAuth,
        updatedAt: new Date()
      })
      .returning();
    return newTwoFA;
  }
  
  async updateUserTwoFactorAuth(userId: number, updates: Partial<UserTwoFactorAuth>): Promise<UserTwoFactorAuth | undefined> {
    const [updatedTwoFA] = await db
      .update(userTwoFactorAuth)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userTwoFactorAuth.userId, userId))
      .returning();
    return updatedTwoFA;
  }
}

export const storage = new DatabaseStorage();
