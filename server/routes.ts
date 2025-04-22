import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";
import { 
  insertUserSchema, 
  insertClinicSchema,
  insertClinicUserSchema,
  insertPermissionSchema,
  insertClientSchema,
  insertServiceSchema,
  insertAppointmentSchema,
  insertInvitationSchema,
  insertPaymentSchema,
  UserRole,
  ClinicRole,
  clinics,
  clinicUsers,
  PaymentStatus
} from "@shared/schema";
import { z } from "zod";
import { stripeService } from "./stripe";
import passport from "passport";
import { setupAuth } from "./auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
  };
  
  // API Routes
  
  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req: Request, res: Response) => {
    res.json({ user: req.user });
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Verificar se o usuário está logado antes de tentar fazer logout
    if (!req.isAuthenticated()) {
      return res.status(200).json({ message: "Usuário já estava desconectado." });
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout." });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Erro ao destruir sessão:", err);
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logout realizado com sucesso." });
      });
    });
  });
  
  app.get("/api/auth/me", isAuthenticated, (req: Request, res: Response) => {
    res.json({ user: req.user });
  });
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const existingUser = await storage.getUserByEmail(result.data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já cadastrado." });
      }
      
      // Hash password
      // const hashedPassword = await bcrypt.hash(result.data.password, 10);
      // For demo we'll use the password directly
      const hashedPassword = result.data.password;
      
      const newUser = await storage.createUser({
        ...result.data,
        password: hashedPassword,
        role: UserRole.STAFF
      });
      
      // Login the user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login automático." });
        }
        res.status(201).json({ user: newUser });
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro ao criar usuário." });
    }
  });
  
  // User routes
  app.get("/api/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  });
  
  app.get("/api/users/superadmins", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se o usuário tem permissão para ver os Super Admins
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      console.log("Requisição para /api/users/superadmins recebida. Usuário:", user.email);
      
      // Buscar todos os usuários que são Super Admins
      const allUsers = await storage.listUsers();
      console.log("Total de usuários encontrados:", allUsers.length);
      
      const superAdmins = allUsers.filter(u => u.role === UserRole.SUPER_ADMIN);
      console.log("Super Admins encontrados:", superAdmins.length);
      
      const formattedSuperAdmins = superAdmins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      }));
      
      console.log("Enviando resposta com Super Admins formatados");
      res.json(formattedSuperAdmins);
    } catch (error) {
      console.error("Erro ao buscar super administradores:", error);
      res.status(500).json({ message: "Erro ao buscar super administradores." });
    }
  });
  
  app.get("/api/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuário." });
    }
  });
  
  // Clinic routes
  app.get("/api/clinics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Verificar se é um SUPER_ADMIN - nesse caso, pode ver todas as clínicas
      const user = req.user as any;
      if (user && user.role === UserRole.SUPER_ADMIN) {
        const allClinics = await storage.listClinics();
        return res.json(allClinics);
      }
      
      // Para usuários normais, buscar apenas as clínicas vinculadas a eles
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      // Usar o método do storage para buscar as clínicas vinculadas ao usuário
      const clinicUsersList = await storage.listClinicUsers(undefined, userId);
      
      if (clinicUsersList.length === 0) {
        // Usuário não tem vínculo com nenhuma clínica
        return res.json([]);
      }
      
      // Buscar as clínicas associadas
      const clinicsPromises = clinicUsersList.map(cu => storage.getClinic(cu.clinicId));
      const userClinics = await Promise.all(clinicsPromises);
      
      // Filtrar clínicas que existem (remove undefined)
      const validClinics = userClinics.filter(c => c !== undefined);
      
      res.json(validClinics);
    } catch (error) {
      console.error("Erro ao buscar clínicas:", error);
      res.status(500).json({ message: "Erro ao buscar clínicas." });
    }
  });
  
  app.post("/api/clinics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertClinicSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      // Check if user already has a clinic where they are the owner
      const user = req.user as any;
      const allClinics = await storage.listClinics();
      
      // Get all clinic-user relationships for this user where the user is an owner
      const clinicUsers = await storage.listClinicUsers(undefined, user.id);
      const ownerClinics = clinicUsers.filter(cu => cu.role === ClinicRole.OWNER);
      
      // Each user can only create one clinic as an owner
      if (ownerClinics.length > 0) {
        return res.status(400).json({ 
          message: "Você já possui uma clínica cadastrada como proprietário. Você pode criar novas clínicas apenas se for convidado por outros usuários." 
        });
      }
      
      const newClinic = await storage.createClinic(result.data);
      
      // Create clinic-user relationship for the owner
      await storage.createClinicUser({
        clinicId: newClinic.id,
        userId: user.id,
        role: ClinicRole.OWNER,
        invitedBy: user.id
      });
      
      // Atualizar o papel do usuário para SUPER_ADMIN
      await storage.updateUser(user.id, {
        role: UserRole.SUPER_ADMIN
      });
      
      res.status(201).json(newClinic);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar clínica." });
    }
  });
  
  app.get("/api/clinics/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinic = await storage.getClinic(parseInt(req.params.id));
      if (!clinic) {
        return res.status(404).json({ message: "Clínica não encontrada." });
      }
      res.json(clinic);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clínica." });
    }
  });
  
  // Clinic Users routes
  app.get("/api/clinics/:clinicId/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const clinicUsers = await storage.listClinicUsers(clinicId);
      
      // Fetch full user data for each clinic user
      const usersPromises = clinicUsers.map(async (cu) => {
        const user = await storage.getUser(cu.userId);
        return {
          ...cu,
          user
        };
      });
      
      const users = await Promise.all(usersPromises);
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar usuários da clínica." });
    }
  });
  
  // ClinicUser routes
  app.get("/api/clinics/:clinicId/user", isAuthenticated, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autorizado." });
    }
    
    try {
      const clinicId = parseInt(req.params.clinicId);
      const userId = req.user.id;
      
      const clinicUser = await storage.getClinicUser(clinicId, userId);
      
      if (!clinicUser) {
        return res.status(404).json({ message: "Relação usuário-clínica não encontrada." });
      }
      
      res.json(clinicUser);
    } catch (error) {
      console.error("Erro ao buscar relação usuário-clínica:", error);
      res.status(500).json({ message: "Erro ao buscar relação usuário-clínica." });
    }
  });
  
  // Permissions routes
  app.get("/api/clinic-users/:clinicUserId/permissions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicUserId = parseInt(req.params.clinicUserId);
      const permissions = await storage.getPermissions(clinicUserId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar permissões." });
    }
  });
  
  app.post("/api/permissions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertPermissionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const newPermission = await storage.createPermission(result.data);
      res.status(201).json(newPermission);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar permissão." });
    }
  });
  
  app.delete("/api/permissions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const permissionId = parseInt(req.params.id);
      const success = await storage.deletePermission(permissionId);
      
      if (!success) {
        return res.status(404).json({ message: "Permissão não encontrada." });
      }
      
      res.json({ message: "Permissão removida com sucesso." });
    } catch (error) {
      res.status(500).json({ message: "Erro ao remover permissão." });
    }
  });
  
  // Client routes
  app.get("/api/clinics/:clinicId/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const clients = await storage.listClients(clinicId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clientes." });
    }
  });
  
  app.post("/api/clients", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertClientSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const user = req.user as any;
      
      const newClient = await storage.createClient({
        ...result.data,
        createdBy: user.id
      });
      
      res.status(201).json(newClient);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar cliente." });
    }
  });
  
  app.get("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cliente." });
    }
  });
  
  app.patch("/api/clients/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }
      
      // Valide apenas os campos enviados para atualização
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        birthdate: z.string().nullable().optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const updatedClient = await storage.updateClient(clientId, result.data);
      
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar cliente." });
    }
  });
  
  // Service routes
  app.get("/api/clinics/:clinicId/services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const services = await storage.listServices(clinicId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços." });
    }
  });
  
  app.post("/api/services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertServiceSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const newService = await storage.createService(result.data);
      res.status(201).json(newService);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar serviço." });
    }
  });
  
  // Appointment routes
  app.get("/api/clinics/:clinicId/appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const appointments = await storage.listAppointments(clinicId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos." });
    }
  });
  
  app.post("/api/appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertAppointmentSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const user = req.user as any;
      
      const newAppointment = await storage.createAppointment({
        ...result.data,
        createdBy: user.id
      });
      
      res.status(201).json(newAppointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar agendamento." });
    }
  });
  
  // Invitation routes
  app.get("/api/clinics/:clinicId/invitations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const invitations = await storage.listInvitations(clinicId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar convites." });
    }
  });
  
  app.post("/api/invitations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Generate a random token
      const token = crypto.randomBytes(32).toString("hex");
      
      const user = req.user as any;
      const data = {
        ...req.body,
        token,
        invitedBy: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
      
      const result = insertInvitationSchema.safeParse(data);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const newInvitation = await storage.createInvitation(result.data);
      
      // In a real app, we would send an email with the invitation link
      // For demo purposes, we'll just return the token in the response
      res.status(201).json({
        ...newInvitation,
        invitationLink: `/accept-invitation?token=${token}`
      });
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar convite." });
    }
  });
  
  // Get invitations for current user (by email)
  app.get("/api/invitations/user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || !user.email) {
        return res.status(400).json({ message: "Usuário não autenticado corretamente." });
      }
      
      // Find all invitations for this user's email
      const allInvitations = [];
      // Get invitations from all clinics
      const clinics = await storage.listClinics();
      for (const clinic of clinics) {
        const clinicInvitations = await storage.listInvitations(clinic.id);
        allInvitations.push(...clinicInvitations);
      }
      
      const userInvitations = allInvitations.filter(inv => 
        inv.email.toLowerCase() === user.email.toLowerCase() && 
        new Date(inv.expiresAt) > new Date()
      );
      
      // Get additional info for each invitation
      const invitationsWithDetails = await Promise.all(userInvitations.map(async inv => {
        const clinic = await storage.getClinic(inv.clinicId);
        const inviter = await storage.getUser(inv.invitedBy);
        
        return {
          ...inv,
          clinicName: clinic?.name || "Clínica desconhecida",
          inviterName: inviter?.name || "Usuário desconhecido"
        };
      }));
      
      res.json(invitationsWithDetails);
    } catch (error) {
      console.error("Error fetching user invitations:", error);
      res.status(500).json({ message: "Erro ao buscar convites." });
    }
  });
  
  // Accept invitation
  app.post("/api/invitations/:id/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const invitationId = parseInt(req.params.id);
      const user = req.user as any;
      
      // Find the invitation by searching in all clinics
      let invitation = null;
      const clinics = await storage.listClinics();
      for (const clinic of clinics) {
        const clinicInvitations = await storage.listInvitations(clinic.id);
        const found = clinicInvitations.find(inv => inv.id === invitationId);
        if (found) {
          invitation = found;
          break;
        }
      }
      
      if (!invitation) {
        return res.status(404).json({ message: "Convite não encontrado." });
      }
      
      // Verify invitation belongs to this user
      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({ message: "Este convite não pertence ao usuário atual." });
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Convite expirado." });
      }
      
      // Create clinic-user relationship
      const clinicUser = await storage.createClinicUser({
        clinicId: invitation.clinicId,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy
      });
      
      // If permissions were specified in the invitation, create them
      if (invitation.permissions) {
        try {
          const permissions = JSON.parse(invitation.permissions);
          for (const perm of permissions) {
            await storage.createPermission({
              clinicUserId: clinicUser.id,
              module: perm.module,
              action: perm.action
            });
          }
        } catch (e) {
          console.error("Error parsing permissions:", e);
        }
      }
      
      // Delete the invitation
      await storage.deleteInvitation(invitation.id);
      
      res.json({ message: "Convite aceito com sucesso!", clinicUser });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Erro ao aceitar convite." });
    }
  });
  
  // Get invitation by token
  app.get("/api/invitations/:token", async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const invitation = await storage.getInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Convite não encontrado ou expirado." });
      }
      
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Convite expirado." });
      }
      
      res.json(invitation);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar convite." });
    }
  });
  
  // Accept invitation by token
  app.post("/api/invitations/accept", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token de convite é obrigatório." });
      }
      
      const user = req.user as any;
      const invitation = await storage.getInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Convite não encontrado ou expirado." });
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Convite expirado." });
      }
      
      // Create clinic-user relationship
      const clinicUser = await storage.createClinicUser({
        clinicId: invitation.clinicId,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy
      });
      
      // If permissions were specified in the invitation, create them
      if (invitation.permissions) {
        try {
          const permissions = JSON.parse(invitation.permissions);
          for (const perm of permissions) {
            await storage.createPermission({
              clinicUserId: clinicUser.id,
              module: perm.module,
              action: perm.action
            });
          }
        } catch (e) {
          console.error("Error parsing permissions:", e);
        }
      }
      
      // Delete the invitation
      await storage.deleteInvitation(invitation.id);
      
      res.json({ message: "Convite aceito com sucesso!", clinicUser });
    } catch (error) {
      console.error("Error accepting invitation by token:", error);
      res.status(500).json({ message: "Erro ao aceitar convite." });
    }
  });
  
  // Dashboard routes
  app.get("/api/clinics/:clinicId/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Get client count
      const clients = await storage.listClients(clinicId);
      const clientCount = clients.length;
      
      // Get today's appointments
      const appointments = await storage.listAppointments(clinicId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        return appointmentDate >= today && appointmentDate < tomorrow;
      });
      
      // Calculate completed procedures this month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const completedProcedures = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        return appointmentDate >= firstDayOfMonth && 
               appointmentDate <= today && 
               appointment.status === 'completed';
      });
      
      // Calculate monthly revenue (in a real app, this would come from financial records)
      // For now, we'll estimate based on completed appointments
      const services = await storage.listServices(clinicId);
      let monthlyRevenue = 0;
      
      completedProcedures.forEach(appointment => {
        const service = services.find(s => s.id === appointment.serviceId);
        if (service && service.price) {
          monthlyRevenue += Number(service.price);
        }
      });
      
      res.json({
        clientCount,
        todayAppointmentCount: todayAppointments.length,
        completedProceduresCount: completedProcedures.length,
        monthlyRevenue
      });
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ message: "Erro ao obter estatísticas do dashboard." });
    }
  });
  
  // Today's appointments
  app.get("/api/clinics/:clinicId/dashboard/appointments/today", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Get all appointments
      const appointments = await storage.listAppointments(clinicId);
      
      // Get all clients, professionals and services for lookup
      const clients = await storage.listClients(clinicId);
      const professionals = await storage.listProfessionals(clinicId);
      const services = await storage.listServices(clinicId);
      
      // Filter today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayAppointments = appointments
        .filter(appointment => {
          const appointmentDate = new Date(appointment.startTime);
          return appointmentDate >= today && appointmentDate < tomorrow;
        })
        .map(appointment => {
          // Get client name
          const client = clients.find(c => c.id === appointment.clientId);
          
          // Get professional name
          const professional = professionals.find(p => p.id === appointment.professionalId);
          
          // Get service name
          const service = services.find(s => s.id === appointment.serviceId);
          
          // Format time
          const time = new Date(appointment.startTime).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });
          
          return {
            id: appointment.id,
            time,
            client: client?.name || 'Cliente não encontrado',
            service: service?.name || 'Serviço não encontrado',
            status: appointment.status
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));
      
      res.json(todayAppointments);
    } catch (error) {
      console.error("Error getting today's appointments:", error);
      res.status(500).json({ message: "Erro ao obter agendamentos de hoje." });
    }
  });
  
  // Recent clients
  app.get("/api/clinics/:clinicId/dashboard/clients/recent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Get all clients
      const clients = await storage.listClients(clinicId);
      
      // Get all appointments for last visit lookup
      const appointments = await storage.listAppointments(clinicId);
      
      // Process clients to include last visit information
      const clientsWithLastVisit = clients.map(client => {
        // Find client's appointments
        const clientAppointments = appointments.filter(a => a.clientId === client.id);
        
        // Find the most recent appointment
        let lastVisit = null;
        if (clientAppointments.length > 0) {
          lastVisit = clientAppointments
            .map(a => new Date(a.startTime))
            .sort((a, b) => b.getTime() - a.getTime())[0];
        }
        
        return {
          id: client.id,
          name: client.name,
          phone: client.phone || 'Não informado',
          lastVisit: lastVisit ? lastVisit.toISOString() : null
        };
      });
      
      // Filter clients with at least one visit and sort by most recent
      const recentClients = clientsWithLastVisit
        .filter(client => client.lastVisit !== null)
        .sort((a, b) => {
          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        })
        .slice(0, 5); // Get top 5 most recent
      
      res.json(recentClients);
    } catch (error) {
      console.error("Error getting recent clients:", error);
      res.status(500).json({ message: "Erro ao obter clientes recentes." });
    }
  });
  
  // Revenue by service
  app.get("/api/clinics/:clinicId/dashboard/revenue/services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Get all appointments
      const appointments = await storage.listAppointments(clinicId);
      
      // Get all services
      const services = await storage.listServices(clinicId);
      
      // Get first day of current month
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Filter completed appointments for current month
      const completedAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        return appointmentDate >= firstDayOfMonth && 
               appointmentDate <= today && 
               appointment.status === 'completed';
      });
      
      // Calculate revenue by service
      const revenueByService = services.map(service => {
        // Filter appointments for this service
        const serviceAppointments = completedAppointments.filter(a => a.serviceId === service.id);
        
        // Calculate total revenue
        const totalRevenue = serviceAppointments.length * (service.price ? Number(service.price) : 0);
        
        return {
          name: service.name,
          valor: totalRevenue
        };
      });
      
      // Sort by revenue (highest first) and get top 5
      const topServices = revenueByService
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5);
      
      res.json(topServices);
    } catch (error) {
      console.error("Error getting revenue by service:", error);
      res.status(500).json({ message: "Erro ao obter receita por serviço." });
    }
  });
  
  // Stripe Payment Routes
  app.post("/api/payments/create-intent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'brl', appointmentId, clinicId, serviceId, clientId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valor do pagamento inválido" });
      }
      
      // Metadata para o pagamento
      const metadata: Record<string, any> = {
        userId: req.user?.id,
        appointmentId,
        clinicId,
        serviceId,
        clientId
      };
      
      // Criar intenção de pagamento no Stripe
      const paymentIntent = await stripeService.createPaymentIntent(amount, currency, metadata);
      
      // Registrar o pagamento na base de dados
      const payment = await storage.createPayment({
        amount,
        currency,
        status: PaymentStatus.PENDING,
        stripePaymentIntentId: paymentIntent.id,
        appointmentId: appointmentId,
        clinicId: clinicId,
        clientId: clientId,
        serviceId: serviceId,
        createdBy: req.user?.id as number
      });
      
      res.json({
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Erro ao criar intenção de pagamento:", error);
      res.status(500).json({ message: error.message || "Erro ao processar pagamento" });
    }
  });
  
  app.post("/api/payments/confirm", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "ID de pagamento inválido" });
      }
      
      // Confirmar pagamento no Stripe
      const paymentIntent = await stripeService.confirmPayment(paymentIntentId);
      
      // Atualizar status do pagamento na base de dados
      await storage.updatePaymentByStripeId(paymentIntentId, {
        status: PaymentStatus.PAID,
        paidAt: new Date()
      });
      
      res.json({ success: true, paymentIntent });
    } catch (error: any) {
      console.error("Erro ao confirmar pagamento:", error);
      res.status(500).json({ message: error.message || "Erro ao confirmar pagamento" });
    }
  });
  
  app.post("/api/payments/refund", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentIntentId, amount, reason } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "ID de pagamento inválido" });
      }
      
      // Processar reembolso no Stripe
      const refund = await stripeService.createRefund(paymentIntentId, amount, reason);
      
      // Atualizar status do pagamento na base de dados
      await storage.updatePaymentByStripeId(paymentIntentId, {
        status: amount ? PaymentStatus.PARTIAL : PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount: amount
      });
      
      res.json({ success: true, refund });
    } catch (error: any) {
      console.error("Erro ao processar reembolso:", error);
      res.status(500).json({ message: error.message || "Erro ao processar reembolso" });
    }
  });
  
  app.get("/api/payments/clinic/:clinicId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const payments = await storage.listPaymentsByClinic(clinicId);
      res.json(payments);
    } catch (error: any) {
      console.error("Erro ao buscar pagamentos da clínica:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamentos" });
    }
  });
  
  app.get("/api/payments/appointment/:appointmentId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const payments = await storage.listPaymentsByAppointment(appointmentId);
      res.json(payments);
    } catch (error: any) {
      console.error("Erro ao buscar pagamentos do agendamento:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamentos" });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
