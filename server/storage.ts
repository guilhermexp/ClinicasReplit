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
  Task, InsertTask, TaskStatus,
  InventoryCategory, InsertInventoryCategory,
  InventoryProduct, InsertInventoryProduct, InventoryStatus,
  InventoryTransaction, InsertInventoryTransaction, InventoryTransactionType,
  users, clinics, clinicUsers, permissions, clients, professionals, services, appointments, invitations,
  payments, commissions, userDevices, activityLogs, userTwoFactorAuth, tasks,
  inventoryCategories, inventoryProducts, inventoryTransactions
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
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
  deleteInvitationByToken(token: string): Promise<boolean>;
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
  
  // Task operations
  getTask(id: number): Promise<Task | undefined>;
  getTasksByClinic(clinicId: number): Promise<Task[]>;
  getTasksByAssignee(userId: number): Promise<Task[]>;
  getTasksByStatus(clinicId: number, status: TaskStatus): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Inventory Category operations
  getInventoryCategory(id: number): Promise<InventoryCategory | undefined>;
  getInventoryCategoriesByClinic(clinicId: number): Promise<InventoryCategory[]>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  updateInventoryCategory(id: number, category: Partial<InventoryCategory>): Promise<InventoryCategory | undefined>;
  deleteInventoryCategory(id: number): Promise<boolean>;
  
  // Inventory Product operations
  getInventoryProduct(id: number): Promise<InventoryProduct | undefined>;
  getInventoryProductsByClinic(clinicId: number): Promise<InventoryProduct[]>;
  getInventoryProductsByCategory(categoryId: number): Promise<InventoryProduct[]>;
  createInventoryProduct(product: InsertInventoryProduct): Promise<InventoryProduct>;
  updateInventoryProduct(id: number, product: Partial<InventoryProduct>): Promise<InventoryProduct | undefined>;
  deleteInventoryProduct(id: number): Promise<boolean>;
  
  // Inventory Transaction operations
  getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined>;
  getInventoryTransactionsByProduct(productId: number): Promise<InventoryTransaction[]>;
  getInventoryTransactionsByClinic(clinicId: number): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
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
    try {
      // Uso de SQL direto devido a incompatibilidades de tipagem entre Drizzle e TypeScript
      const result = await db.execute(
        sql`INSERT INTO users (
            name, email, password, role, is_active, 
            phone, created_by, created_at, updated_at
          ) VALUES (
            ${user.name}, ${user.email}, ${user.password}, ${user.role || 'STAFF'}, 
            ${user.isActive === undefined ? true : user.isActive}, 
            ${user.phone || null}, ${user.createdBy || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING 
            id, name, email, password, role, is_active AS "isActive",
            last_login AS "lastLogin", created_by AS "createdBy",
            created_at AS "createdAt", updated_at AS "updatedAt"
        `
      );
      
      if (result.rows.length === 0) {
        throw new Error("Falha ao criar usuário: nenhum registro retornado");
      }
      
      const newUser = result.rows[0] as any;
      // Adicionar campos vazios para propriedades que estão no schema mas não no banco
      newUser.preferences = {};
      newUser.phone = newUser.phone || null;
      newUser.profilePhoto = null;
      newUser.stripeCustomerId = null;
      newUser.stripeSubscriptionId = null;
      
      return newUser as User;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
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
  
  async deleteClinicUser(id: number): Promise<boolean> {
    try {
      // Primeiro excluir todas as permissões associadas a este clinicUser
      await db
        .delete(permissions)
        .where(eq(permissions.clinicUserId, id));
      
      // Depois excluir o clinicUser
      const result = await db
        .delete(clinicUsers)
        .where(eq(clinicUsers.id, id));
      
      return result.rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir usuário da clínica:", error);
      return false;
    }
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
  
  async deleteInvitationByToken(token: string): Promise<boolean> {
    const result = await db
      .delete(invitations)
      .where(eq(invitations.token, token));
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
      // Buscar apenas as colunas que sabemos que existem na tabela
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
    } catch (error) {
      console.error("Erro ao buscar dispositivos do usuário:", error);
      // Em caso de qualquer erro, retornar um array vazio
      return [];
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

  // Task operations
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task;
  }

  async getTasksByClinic(clinicId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.clinicId, clinicId));
  }

  async getTasksByAssignee(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId));
  }

  async getTasksByStatus(clinicId: number, status: TaskStatus): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.clinicId, clinicId),
        eq(tasks.status, status)
      ));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    // Se estiver completando a tarefa, adicionar a data de conclusão
    if (updates.status === TaskStatus.DONE && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    
    return result !== null && (result as any).rowCount > 0;
  }
  
  // Inventory Category operations
  async getInventoryCategory(id: number): Promise<InventoryCategory | undefined> {
    const [category] = await db.select().from(inventoryCategories).where(eq(inventoryCategories.id, id));
    return category;
  }
  
  async getInventoryCategoriesByClinic(clinicId: number): Promise<InventoryCategory[]> {
    return await db.select().from(inventoryCategories).where(eq(inventoryCategories.clinicId, clinicId));
  }
  
  async createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory> {
    const [newCategory] = await db.insert(inventoryCategories).values(category).returning();
    return newCategory;
  }
  
  async updateInventoryCategory(id: number, updates: Partial<InventoryCategory>): Promise<InventoryCategory | undefined> {
    const [updatedCategory] = await db
      .update(inventoryCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteInventoryCategory(id: number): Promise<boolean> {
    try {
      // Verificar se existem produtos associados à categoria
      const productsWithCategory = await db
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.categoryId, id));
      
      if (productsWithCategory.length > 0) {
        console.error("Não é possível excluir categoria com produtos associados");
        return false;
      }
      
      // Verificar se existem subcategorias
      const subcategories = await db
        .select()
        .from(inventoryCategories)
        .where(eq(inventoryCategories.parentId, id));
      
      if (subcategories.length > 0) {
        console.error("Não é possível excluir categoria com subcategorias");
        return false;
      }
      
      const result = await db
        .delete(inventoryCategories)
        .where(eq(inventoryCategories.id, id));
      
      return result !== null && (result as any).rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir categoria de inventário:", error);
      return false;
    }
  }
  
  // Inventory Product operations
  async getInventoryProduct(id: number): Promise<InventoryProduct | undefined> {
    const [product] = await db.select().from(inventoryProducts).where(eq(inventoryProducts.id, id));
    return product;
  }
  
  async getInventoryProductsByClinic(clinicId: number): Promise<InventoryProduct[]> {
    return await db.select().from(inventoryProducts).where(eq(inventoryProducts.clinicId, clinicId));
  }
  
  async getInventoryProductsByCategory(categoryId: number): Promise<InventoryProduct[]> {
    return await db.select().from(inventoryProducts).where(eq(inventoryProducts.categoryId, categoryId));
  }
  
  async createInventoryProduct(product: InsertInventoryProduct): Promise<InventoryProduct> {
    const [newProduct] = await db.insert(inventoryProducts).values(product).returning();
    
    // Registrar transação de entrada inicial se quantidade > 0
    if (newProduct.quantity > 0) {
      await this.createInventoryTransaction({
        clinicId: newProduct.clinicId,
        productId: newProduct.id,
        type: InventoryTransactionType.PURCHASE,
        quantity: newProduct.quantity,
        previousQuantity: 0,
        newQuantity: newProduct.quantity,
        date: new Date(),
        notes: "Estoque inicial",
        cost: product.costPrice ? product.costPrice * newProduct.quantity : 0,
        createdBy: newProduct.createdBy
      });
    }
    
    return newProduct;
  }
  
  async updateInventoryProduct(id: number, updates: Partial<InventoryProduct>): Promise<InventoryProduct | undefined> {
    // Se a quantidade estiver sendo atualizada, registrar uma transação
    if (updates.quantity !== undefined) {
      const [currentProduct] = await db
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.id, id));
      
      if (currentProduct) {
        const previousQuantity = currentProduct.quantity;
        const newQuantity = updates.quantity;
        const quantityDiff = newQuantity - previousQuantity;
        
        if (quantityDiff !== 0) {
          // Determinar o tipo de transação com base na diferença de quantidade
          const transactionType = quantityDiff > 0 
            ? InventoryTransactionType.PURCHASE 
            : InventoryTransactionType.ADJUSTMENT;
          
          await this.createInventoryTransaction({
            clinicId: currentProduct.clinicId,
            productId: currentProduct.id,
            type: transactionType,
            quantity: quantityDiff,
            previousQuantity,
            newQuantity,
            date: new Date(),
            notes: updates.notes || "Ajuste manual de estoque",
            cost: currentProduct.costPrice ? Math.abs(quantityDiff) * currentProduct.costPrice : 0,
            createdBy: updates.createdBy || currentProduct.createdBy
          });
        }
      }
    }
    
    // Atualizar a situação do estoque com base na quantidade e limiar
    if (updates.quantity !== undefined || updates.lowStockThreshold !== undefined) {
      const [currentProduct] = await db
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.id, id));
      
      if (currentProduct) {
        const newQuantity = updates.quantity !== undefined ? updates.quantity : currentProduct.quantity;
        const threshold = updates.lowStockThreshold !== undefined ? updates.lowStockThreshold : currentProduct.lowStockThreshold;
        
        let status = InventoryStatus.IN_STOCK;
        if (newQuantity === 0) {
          status = InventoryStatus.OUT_OF_STOCK;
        } else if (threshold && newQuantity <= threshold) {
          status = InventoryStatus.LOW_STOCK;
        }
        
        updates.status = status;
      }
    }
    
    // Realizar a atualização do produto
    const [updatedProduct] = await db
      .update(inventoryProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryProducts.id, id))
      .returning();
    
    return updatedProduct;
  }
  
  async deleteInventoryProduct(id: number): Promise<boolean> {
    try {
      // Verificar se existem transações relacionadas ao produto
      const transactions = await db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.productId, id));
      
      if (transactions.length > 0) {
        // Em vez de falhar, podemos marcar o produto como descontinuado
        await db
          .update(inventoryProducts)
          .set({ 
            status: InventoryStatus.DISCONTINUED, 
            updatedAt: new Date() 
          })
          .where(eq(inventoryProducts.id, id));
        
        return true;
      }
      
      // Se não houver transações, podemos excluir o produto
      const result = await db
        .delete(inventoryProducts)
        .where(eq(inventoryProducts.id, id));
      
      return result !== null && (result as any).rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir produto de inventário:", error);
      return false;
    }
  }
  
  // Inventory Transaction operations
  async getInventoryTransaction(id: number): Promise<InventoryTransaction | undefined> {
    const [transaction] = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, id));
    return transaction;
  }
  
  async getInventoryTransactionsByProduct(productId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.productId, productId))
      .orderBy(desc(inventoryTransactions.date));
  }
  
  async getInventoryTransactionsByClinic(clinicId: number): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.clinicId, clinicId))
      .orderBy(desc(inventoryTransactions.date));
  }
  
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await db.insert(inventoryTransactions).values(transaction).returning();
    return newTransaction;
  }
  
  async updateInventoryTransaction(id: number, updates: Partial<InventoryTransaction>): Promise<InventoryTransaction | undefined> {
    try {
      // Verificar se a transação existe
      const [existingTransaction] = await db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.id, id));
      
      if (!existingTransaction) {
        return undefined;
      }
      
      // Atualizar a transação
      const [updatedTransaction] = await db
        .update(inventoryTransactions)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(inventoryTransactions.id, id))
        .returning();
      
      return updatedTransaction;
    } catch (error) {
      console.error("Erro ao atualizar transação de inventário:", error);
      return undefined;
    }
  }
  
  async deleteInventoryTransaction(id: number): Promise<boolean> {
    try {
      // Verificar se a transação existe
      const [transaction] = await db
        .select()
        .from(inventoryTransactions)
        .where(eq(inventoryTransactions.id, id));
      
      if (!transaction) {
        return false;
      }
      
      // Obter o produto relacionado
      const [product] = await db
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.id, transaction.productId));
      
      if (!product) {
        return false;
      }
      
      // Calcular nova quantidade do produto (reverter a transação)
      const newQuantity = product.quantity - transaction.quantity;
      
      // Atualizar o estoque do produto
      await db
        .update(inventoryProducts)
        .set({ 
          quantity: newQuantity,
          updatedAt: new Date()
        })
        .where(eq(inventoryProducts.id, transaction.productId));
      
      // Excluir a transação
      const result = await db
        .delete(inventoryTransactions)
        .where(eq(inventoryTransactions.id, id));
      
      return result !== null && (result as any).rowCount > 0;
    } catch (error) {
      console.error("Erro ao excluir transação de inventário:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
