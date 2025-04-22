import {
  User, InsertUser, UserRole,
  Clinic, InsertClinic,
  ClinicUser, InsertClinicUser, ClinicRole,
  Permission, InsertPermission,
  Client, InsertClient,
  Professional, InsertProfessional,
  Service, InsertService,
  Appointment, InsertAppointment,
  Invitation, InsertInvitation,
  users, clinics, clinicUsers, permissions, clients, professionals, services, appointments, invitations
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Storage interface for CRUD operations
export interface IStorage {
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clinics: Map<number, Clinic>;
  private clinicUsers: Map<number, ClinicUser>;
  private permissions: Map<number, Permission>;
  private clients: Map<number, Client>;
  private professionals: Map<number, Professional>;
  private services: Map<number, Service>;
  private appointments: Map<number, Appointment>;
  private invitations: Map<number, Invitation>;
  
  private userIdCounter: number;
  private clinicIdCounter: number;
  private clinicUserIdCounter: number;
  private permissionIdCounter: number;
  private clientIdCounter: number;
  private professionalIdCounter: number;
  private serviceIdCounter: number;
  private appointmentIdCounter: number;
  private invitationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.clinics = new Map();
    this.clinicUsers = new Map();
    this.permissions = new Map();
    this.clients = new Map();
    this.professionals = new Map();
    this.services = new Map();
    this.appointments = new Map();
    this.invitations = new Map();
    
    this.userIdCounter = 1;
    this.clinicIdCounter = 1;
    this.clinicUserIdCounter = 1;
    this.permissionIdCounter = 1;
    this.clientIdCounter = 1;
    this.professionalIdCounter = 1;
    this.serviceIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.invitationIdCounter = 1;
    
    // Seed some initial data
    this._seedInitialData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = {
      ...user,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Clinic operations
  async getClinic(id: number): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }
  
  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    const id = this.clinicIdCounter++;
    const timestamp = new Date();
    const newClinic: Clinic = {
      ...clinic,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.clinics.set(id, newClinic);
    return newClinic;
  }
  
  async updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic | undefined> {
    const clinic = this.clinics.get(id);
    if (!clinic) return undefined;
    
    const updatedClinic = { ...clinic, ...updates, updatedAt: new Date() };
    this.clinics.set(id, updatedClinic);
    return updatedClinic;
  }
  
  async listClinics(): Promise<Clinic[]> {
    return Array.from(this.clinics.values());
  }
  
  // ClinicUser operations
  async getClinicUser(clinicId: number, userId: number): Promise<ClinicUser | undefined> {
    return Array.from(this.clinicUsers.values()).find(
      cu => cu.clinicId === clinicId && cu.userId === userId
    );
  }
  
  async createClinicUser(clinicUser: InsertClinicUser): Promise<ClinicUser> {
    const id = this.clinicUserIdCounter++;
    const timestamp = new Date();
    const newClinicUser: ClinicUser = {
      ...clinicUser,
      id,
      invitedAt: timestamp,
      acceptedAt: null
    };
    this.clinicUsers.set(id, newClinicUser);
    return newClinicUser;
  }
  
  async updateClinicUser(id: number, updates: Partial<ClinicUser>): Promise<ClinicUser | undefined> {
    const clinicUser = this.clinicUsers.get(id);
    if (!clinicUser) return undefined;
    
    const updatedClinicUser = { ...clinicUser, ...updates };
    this.clinicUsers.set(id, updatedClinicUser);
    return updatedClinicUser;
  }
  
  async listClinicUsers(clinicId: number): Promise<ClinicUser[]> {
    return Array.from(this.clinicUsers.values()).filter(
      cu => cu.clinicId === clinicId
    );
  }
  
  // Permission operations
  async getPermissions(clinicUserId: number): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter(
      perm => perm.clinicUserId === clinicUserId
    );
  }
  
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const id = this.permissionIdCounter++;
    const newPermission: Permission = {
      ...permission,
      id
    };
    this.permissions.set(id, newPermission);
    return newPermission;
  }
  
  async deletePermission(id: number): Promise<boolean> {
    return this.permissions.delete(id);
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const timestamp = new Date();
    const newClient: Client = {
      ...client,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...updates, updatedAt: new Date() };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async listClients(clinicId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      client => client.clinicId === clinicId
    );
  }
  
  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    return this.professionals.get(id);
  }
  
  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    const id = this.professionalIdCounter++;
    const timestamp = new Date();
    const newProfessional: Professional = {
      ...professional,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.professionals.set(id, newProfessional);
    return newProfessional;
  }
  
  async listProfessionals(clinicId: number): Promise<Professional[]> {
    return Array.from(this.professionals.values()).filter(
      prof => prof.clinicId === clinicId
    );
  }
  
  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const timestamp = new Date();
    const newService: Service = {
      ...service,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.services.set(id, newService);
    return newService;
  }
  
  async listServices(clinicId: number): Promise<Service[]> {
    return Array.from(this.services.values()).filter(
      service => service.clinicId === clinicId
    );
  }
  
  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const timestamp = new Date();
    const newAppointment: Appointment = {
      ...appointment,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...updates, updatedAt: new Date() };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async listAppointments(clinicId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      appointment => appointment.clinicId === clinicId
    );
  }
  
  // Invitation operations
  async getInvitation(token: string): Promise<Invitation | undefined> {
    return Array.from(this.invitations.values()).find(
      invitation => invitation.token === token
    );
  }
  
  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    const id = this.invitationIdCounter++;
    const timestamp = new Date();
    const newInvitation: Invitation = {
      ...invitation,
      id,
      createdAt: timestamp
    };
    this.invitations.set(id, newInvitation);
    return newInvitation;
  }
  
  async deleteInvitation(id: number): Promise<boolean> {
    return this.invitations.delete(id);
  }
  
  async listInvitations(clinicId: number): Promise<Invitation[]> {
    return Array.from(this.invitations.values()).filter(
      invitation => invitation.clinicId === clinicId
    );
  }
  
  // Seed initial data for development
  private _seedInitialData() {
    // Create a super admin user
    const adminUser: User = {
      id: this.userIdCounter++,
      name: "Admin User",
      email: "admin@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui", // "password" hashed
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      lastLogin: new Date(),
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create a clinic owner
    const ownerUser: User = {
      id: this.userIdCounter++,
      name: "João Dourado",
      email: "joao@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui", // "password" hashed
      role: UserRole.CLINIC_OWNER,
      isActive: true,
      lastLogin: new Date(),
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(ownerUser.id, ownerUser);
    
    // Create some test users with different roles
    const managerUser: User = {
      id: this.userIdCounter++,
      name: "Maria Silva",
      email: "maria@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui",
      role: UserRole.CLINIC_MANAGER,
      isActive: true,
      lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      createdBy: ownerUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(managerUser.id, managerUser);
    
    const doctorUser: User = {
      id: this.userIdCounter++,
      name: "Ana Costa",
      email: "ana@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui",
      role: UserRole.DOCTOR,
      isActive: true,
      lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdBy: ownerUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(doctorUser.id, doctorUser);
    
    const receptionistUser: User = {
      id: this.userIdCounter++,
      name: "Roberto Lima",
      email: "roberto@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui",
      role: UserRole.RECEPTIONIST,
      isActive: false,
      lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      createdBy: managerUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(receptionistUser.id, receptionistUser);
    
    const financialUser: User = {
      id: this.userIdCounter++,
      name: "Paula Barbosa",
      email: "paula@gardenia.com",
      password: "$2b$10$FNguwf6r7uS5u3KZ6G4y4O3gNYiSCvUEL7zfEG8d97l/E7QnW7tui",
      role: UserRole.FINANCIAL,
      isActive: true,
      lastLogin: new Date(),
      createdBy: ownerUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(financialUser.id, financialUser);
    
    // Create some clinics
    const clinic1: Clinic = {
      id: this.clinicIdCounter++,
      name: "Clínica Estética Girassol",
      logo: null,
      address: "Av. Paulista, 1000 - São Paulo/SP",
      phone: "(11) 3333-4444",
      openingHours: JSON.stringify({
        monday: { open: "08:00", close: "18:00" },
        tuesday: { open: "08:00", close: "18:00" },
        wednesday: { open: "08:00", close: "18:00" },
        thursday: { open: "08:00", close: "18:00" },
        friday: { open: "08:00", close: "18:00" },
        saturday: { open: "09:00", close: "14:00" },
        sunday: { open: null, close: null }
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clinics.set(clinic1.id, clinic1);
    
    const clinic2: Clinic = {
      id: this.clinicIdCounter++,
      name: "Estética Avançada SP",
      logo: null,
      address: "Rua Augusta, 500 - São Paulo/SP",
      phone: "(11) 4444-5555",
      openingHours: JSON.stringify({
        monday: { open: "09:00", close: "19:00" },
        tuesday: { open: "09:00", close: "19:00" },
        wednesday: { open: "09:00", close: "19:00" },
        thursday: { open: "09:00", close: "19:00" },
        friday: { open: "09:00", close: "19:00" },
        saturday: { open: "10:00", close: "15:00" },
        sunday: { open: null, close: null }
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clinics.set(clinic2.id, clinic2);
    
    // Create ClinicUsers - associate users with clinics
    const clinicUser1: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic1.id,
      userId: ownerUser.id,
      role: ClinicRole.OWNER,
      invitedBy: adminUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser1.id, clinicUser1);
    
    const clinicUser2: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic1.id,
      userId: managerUser.id,
      role: ClinicRole.MANAGER,
      invitedBy: ownerUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser2.id, clinicUser2);
    
    const clinicUser3: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic1.id,
      userId: doctorUser.id,
      role: ClinicRole.PROFESSIONAL,
      invitedBy: ownerUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser3.id, clinicUser3);
    
    const clinicUser4: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic1.id,
      userId: receptionistUser.id,
      role: ClinicRole.RECEPTIONIST,
      invitedBy: managerUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser4.id, clinicUser4);
    
    const clinicUser5: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic1.id,
      userId: financialUser.id,
      role: ClinicRole.FINANCIAL,
      invitedBy: ownerUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser5.id, clinicUser5);
    
    // Owner for second clinic
    const clinicUser6: ClinicUser = {
      id: this.clinicUserIdCounter++,
      clinicId: clinic2.id,
      userId: ownerUser.id,
      role: ClinicRole.OWNER,
      invitedBy: adminUser.id,
      invitedAt: new Date(),
      acceptedAt: new Date()
    };
    this.clinicUsers.set(clinicUser6.id, clinicUser6);
    
    // Create some permissions
    this._addDefaultPermissions(clinicUser1.id, ClinicRole.OWNER);
    this._addDefaultPermissions(clinicUser2.id, ClinicRole.MANAGER);
    this._addDefaultPermissions(clinicUser3.id, ClinicRole.PROFESSIONAL);
    this._addDefaultPermissions(clinicUser4.id, ClinicRole.RECEPTIONIST);
    this._addDefaultPermissions(clinicUser5.id, ClinicRole.FINANCIAL);
    this._addDefaultPermissions(clinicUser6.id, ClinicRole.OWNER);
    
    // Create some clients
    const client1: Client = {
      id: this.clientIdCounter++,
      clinicId: clinic1.id,
      name: "Carla Soares",
      email: "carla@email.com",
      phone: "(11) 99999-8888",
      address: "Rua dos Clientes, 123",
      birthdate: new Date(1985, 5, 15),
      createdBy: receptionistUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clients.set(client1.id, client1);
    
    const client2: Client = {
      id: this.clientIdCounter++,
      clinicId: clinic1.id,
      name: "Ricardo Nunes",
      email: "ricardo@email.com",
      phone: "(11) 98888-7777",
      address: "Av. dos Clientes, 456",
      birthdate: new Date(1990, 2, 10),
      createdBy: receptionistUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clients.set(client2.id, client2);
    
    // Add a professional
    const professional1: Professional = {
      id: this.professionalIdCounter++,
      userId: doctorUser.id,
      clinicId: clinic1.id,
      specialization: "Esteticista Facial",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.professionals.set(professional1.id, professional1);
    
    // Add some services
    const service1: Service = {
      id: this.serviceIdCounter++,
      clinicId: clinic1.id,
      name: "Limpeza de Pele",
      description: "Limpeza profunda com extração de cravos e hidratação",
      duration: 60, // minutes
      price: 15000, // R$ 150,00 (in cents)
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.services.set(service1.id, service1);
    
    const service2: Service = {
      id: this.serviceIdCounter++,
      clinicId: clinic1.id,
      name: "Massagem Relaxante",
      description: "Massagem corporal para relaxamento",
      duration: 45, // minutes
      price: 12000, // R$ 120,00 (in cents)
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.services.set(service2.id, service2);
    
    // Add some appointments
    const appointment1: Appointment = {
      id: this.appointmentIdCounter++,
      clinicId: clinic1.id,
      clientId: client1.id,
      professionalId: professional1.id,
      serviceId: service1.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // tomorrow + 1h
      status: "scheduled",
      notes: "Cliente solicitou atenção especial na área do nariz",
      createdBy: receptionistUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appointments.set(appointment1.id, appointment1);
    
    const appointment2: Appointment = {
      id: this.appointmentIdCounter++,
      clinicId: clinic1.id,
      clientId: client2.id,
      professionalId: professional1.id,
      serviceId: service2.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // day after tomorrow
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // day after tomorrow + 45min
      status: "confirmed",
      notes: "",
      createdBy: receptionistUser.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.appointments.set(appointment2.id, appointment2);
  }
  
  // Helper to add default permissions based on role
  private _addDefaultPermissions(clinicUserId: number, role: ClinicRole) {
    const permissionsMap: Record<ClinicRole, Array<{module: string, action: string}>> = {
      [ClinicRole.OWNER]: [
        { module: "dashboard", action: "read" },
        { module: "clients", action: "read" },
        { module: "clients", action: "create" },
        { module: "clients", action: "update" },
        { module: "clients", action: "delete" },
        { module: "appointments", action: "read" },
        { module: "appointments", action: "create" },
        { module: "appointments", action: "update" },
        { module: "appointments", action: "delete" },
        { module: "financial", action: "read" },
        { module: "financial", action: "create" },
        { module: "financial", action: "update" },
        { module: "financial", action: "delete" },
        { module: "crm", action: "read" },
        { module: "crm", action: "create" },
        { module: "crm", action: "update" },
        { module: "crm", action: "delete" },
        { module: "users", action: "read" },
        { module: "users", action: "create" },
        { module: "users", action: "update" },
        { module: "users", action: "delete" },
        { module: "settings", action: "read" },
        { module: "settings", action: "update" }
      ],
      [ClinicRole.MANAGER]: [
        { module: "dashboard", action: "read" },
        { module: "clients", action: "read" },
        { module: "clients", action: "create" },
        { module: "clients", action: "update" },
        { module: "appointments", action: "read" },
        { module: "appointments", action: "create" },
        { module: "appointments", action: "update" },
        { module: "appointments", action: "delete" },
        { module: "financial", action: "read" },
        { module: "crm", action: "read" },
        { module: "crm", action: "create" },
        { module: "crm", action: "update" },
        { module: "users", action: "read" },
        { module: "users", action: "create" },
        { module: "users", action: "update" },
        { module: "settings", action: "read" }
      ],
      [ClinicRole.PROFESSIONAL]: [
        { module: "dashboard", action: "read" },
        { module: "clients", action: "read" },
        { module: "clients", action: "update" },
        { module: "appointments", action: "read" },
        { module: "appointments", action: "update" }
      ],
      [ClinicRole.RECEPTIONIST]: [
        { module: "dashboard", action: "read" },
        { module: "clients", action: "read" },
        { module: "clients", action: "create" },
        { module: "clients", action: "update" },
        { module: "appointments", action: "read" },
        { module: "appointments", action: "create" },
        { module: "appointments", action: "update" }
      ],
      [ClinicRole.FINANCIAL]: [
        { module: "dashboard", action: "read" },
        { module: "financial", action: "read" },
        { module: "financial", action: "create" },
        { module: "financial", action: "update" }
      ],
      [ClinicRole.MARKETING]: [
        { module: "dashboard", action: "read" },
        { module: "clients", action: "read" },
        { module: "crm", action: "read" },
        { module: "crm", action: "create" },
        { module: "crm", action: "update" }
      ],
      [ClinicRole.STAFF]: [
        { module: "dashboard", action: "read" }
      ]
    };
    
    const permissions = permissionsMap[role] || permissionsMap[ClinicRole.STAFF];
    
    permissions.forEach(perm => {
      const id = this.permissionIdCounter++;
      this.permissions.set(id, {
        id,
        clinicUserId,
        module: perm.module,
        action: perm.action
      });
    });
  }
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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Adiciona timestamps e valores padrão
    const userData = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: user.role || UserRole.STAFF,
      isActive: user.isActive !== undefined ? user.isActive : true,
      lastLogin: null,
      createdBy: user.createdBy || null
    };
    
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Clinic operations
  async getClinic(id: number): Promise<Clinic | undefined> {
    const [clinic] = await db.select().from(clinics).where(eq(clinics.id, id));
    return clinic;
  }

  async createClinic(clinic: InsertClinic): Promise<Clinic> {
    // Adiciona timestamps e valores padrão
    const clinicData = {
      ...clinic,
      createdAt: new Date(),
      updatedAt: new Date(),
      logo: clinic.logo ?? null,
      address: clinic.address ?? null,
      phone: clinic.phone ?? null,
      openingHours: clinic.openingHours ?? null
    };
    
    const [newClinic] = await db.insert(clinics).values(clinicData).returning();
    return newClinic;
  }

  async updateClinic(id: number, updates: Partial<Clinic>): Promise<Clinic | undefined> {
    const [updatedClinic] = await db.update(clinics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clinics.id, id))
      .returning();
    return updatedClinic;
  }

  async listClinics(): Promise<Clinic[]> {
    return await db.select().from(clinics);
  }

  // ClinicUser operations
  async getClinicUser(clinicId: number, userId: number): Promise<ClinicUser | undefined> {
    const [clinicUser] = await db.select()
      .from(clinicUsers)
      .where(
        and(
          eq(clinicUsers.clinicId, clinicId),
          eq(clinicUsers.userId, userId)
        )
      );
    return clinicUser;
  }

  async createClinicUser(clinicUser: InsertClinicUser): Promise<ClinicUser> {
    // Adiciona timestamps e valores padrão
    const clinicUserData = {
      ...clinicUser,
      role: clinicUser.role || ClinicRole.STAFF,
      invitedBy: clinicUser.invitedBy || null,
      invitedAt: new Date(),
      acceptedAt: null
    };
    
    const [newClinicUser] = await db.insert(clinicUsers).values(clinicUserData).returning();
    return newClinicUser;
  }

  async updateClinicUser(id: number, updates: Partial<ClinicUser>): Promise<ClinicUser | undefined> {
    const [updatedClinicUser] = await db.update(clinicUsers)
      .set(updates)
      .where(eq(clinicUsers.id, id))
      .returning();
    return updatedClinicUser;
  }

  async listClinicUsers(clinicId: number): Promise<ClinicUser[]> {
    return await db.select()
      .from(clinicUsers)
      .where(eq(clinicUsers.clinicId, clinicId));
  }

  // Permission operations
  async getPermissions(clinicUserId: number): Promise<Permission[]> {
    return await db.select()
      .from(permissions)
      .where(eq(permissions.clinicUserId, clinicUserId));
  }

  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [newPermission] = await db.insert(permissions).values(permission).returning();
    return newPermission;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await db.delete(permissions).where(eq(permissions.id, id)).returning();
    return result.length > 0;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    // Adiciona timestamps e valores padrão
    const clientData = {
      ...client,
      createdAt: new Date(),
      updatedAt: new Date(),
      email: client.email ?? null,
      address: client.address ?? null,
      phone: client.phone ?? null,
      birthdate: client.birthdate ?? null
    };
    
    const [newClient] = await db.insert(clients).values(clientData).returning();
    return newClient;
  }

  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db.update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async listClients(clinicId: number): Promise<Client[]> {
    return await db.select()
      .from(clients)
      .where(eq(clients.clinicId, clinicId));
  }

  // Professional operations
  async getProfessional(id: number): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    return professional;
  }

  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    // Adiciona timestamps e valores padrão
    const professionalData = {
      ...professional,
      createdAt: new Date(),
      updatedAt: new Date(),
      specialization: professional.specialization ?? null
    };
    
    const [newProfessional] = await db.insert(professionals).values(professionalData).returning();
    return newProfessional;
  }

  async listProfessionals(clinicId: number): Promise<Professional[]> {
    return await db.select()
      .from(professionals)
      .where(eq(professionals.clinicId, clinicId));
  }

  // Service operations
  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    // Adiciona timestamps e valores padrão
    const serviceData = {
      ...service,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: service.description ?? null
    };
    
    const [newService] = await db.insert(services).values(serviceData).returning();
    return newService;
  }

  async listServices(clinicId: number): Promise<Service[]> {
    return await db.select()
      .from(services)
      .where(eq(services.clinicId, clinicId));
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    // Adiciona timestamps e valores padrão
    const appointmentData = {
      ...appointment,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: appointment.status || 'AGENDADO',
      notes: appointment.notes ?? null
    };
    
    const [newAppointment] = await db.insert(appointments).values(appointmentData).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async listAppointments(clinicId: number): Promise<Appointment[]> {
    return await db.select()
      .from(appointments)
      .where(eq(appointments.clinicId, clinicId));
  }

  // Invitation operations
  async getInvitation(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invitation;
  }

  async createInvitation(invitation: InsertInvitation): Promise<Invitation> {
    // Adiciona timestamps e valores padrão
    const invitationData = {
      ...invitation,
      createdAt: new Date(),
      permissions: invitation.permissions ?? null
    };
    
    const [newInvitation] = await db.insert(invitations).values(invitationData).returning();
    return newInvitation;
  }

  async deleteInvitation(id: number): Promise<boolean> {
    const result = await db.delete(invitations).where(eq(invitations.id, id)).returning();
    return result.length > 0;
  }

  async listInvitations(clinicId: number): Promise<Invitation[]> {
    return await db.select()
      .from(invitations)
      .where(eq(invitations.clinicId, clinicId));
  }
}

// Use database storage instead of in-memory storage
export const storage = new DatabaseStorage();
