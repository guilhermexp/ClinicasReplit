import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db, pool } from "./db";
import { eq, inArray, and, gte, lte } from "drizzle-orm";
import { format } from "date-fns";
import { registerCRMRoutes } from "./routes-crm";
import { registerInventoryRoutes } from "./routes-inventory";
import { registerProfessionalsRoutes } from "./routes-professionals";
import { registerFinancialRoutes } from "./routes-financial";
import { registerTaskRoutes } from "./routes-tasks";
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
  insertLeadSchema,
  insertLeadInteractionSchema,
  insertLeadAppointmentSchema,
  insertUserDeviceSchema,
  insertActivityLogSchema,
  insertUserTwoFactorAuthSchema,
  UserRole,
  ClinicRole,
  clinics,
  clinicUsers,
  clients,
  leads,
  leadInteractions,
  leadAppointments,
  appointments,
  payments,
  PaymentStatus,
  userDevices,
  activityLogs,
  userTwoFactorAuth,
  users,
  professionals
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { paymentService } from "./payment-service";
import passport from "passport";
import { setupAuth } from "./auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    console.log("Verificando autenticação na rota:", req.originalUrl);
    console.log("Session ID:", req.sessionID);
    console.log("Está autenticado?", req.isAuthenticated());
    if (req.isAuthenticated()) {
      console.log("Usuário autenticado:", req.user?.email);
      return next();
    }
    console.log("Usuário não está autenticado");
    res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
  };
  
  // API Routes
  
  // Auth routes
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    console.log("Tentativa de login:", req.body.email);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Erro na autenticação:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Autenticação falhou:", info);
        return res.status(401).json({ message: "Email ou senha inválidos." });
      }
      
      console.log("Usuário autenticado com sucesso:", user.email);
      
      req.login(user, (err) => {
        if (err) {
          console.error("Erro ao fazer login:", err);
          return next(err);
        }
        
        console.log("Sessão criada com sucesso. User ID:", user.id, "Session ID:", req.sessionID);
        
        // Forçar salvamento da sessão no armazenamento para garantir persistência
        req.session.save((err) => {
          if (err) {
            console.error("Erro ao salvar sessão:", err);
          }
          
          // Adicionar informações de debug
          console.log("Cookies sendo enviados:", {
            'connect.sid': req.cookies['connect.sid'],
            sessionID: req.sessionID,
            isAuthenticated: req.isAuthenticated()
          });
          
          return res.json({ user: req.user });
        });
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Verificar se o usuário está logado antes de tentar fazer logout
    if (!req.isAuthenticated()) {
      console.log("Logout de usuário não autenticado");
      return res.status(200).json({ message: "Usuário já estava desconectado." });
    }
    
    console.log("Realizando logout do usuário:", req.user?.email);
    
    req.logout((err) => {
      if (err) {
        console.error("Erro ao fazer logout:", err);
        return res.status(500).json({ message: "Erro ao fazer logout." });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Erro ao destruir sessão:", err);
        }
        
        // Limpar cookie de sessão - observe que o nome deve corresponder ao configurado
        res.clearCookie('connect.sid', {
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'lax'
        });
        
        console.log("Logout realizado com sucesso");
        res.status(200).json({ message: "Logout realizado com sucesso." });
      });
    });
  });
  
  app.get("/api/auth/me", (req: Request, res: Response) => {
    console.log("Verificando usuário autenticado. Session ID:", req.sessionID);
    console.log("Usuário autenticado?", req.isAuthenticated());
    
    if (req.isAuthenticated()) {
      console.log("Usuário está autenticado:", req.user?.email);
      return res.json({ user: req.user });
    } else {
      console.log("Usuário não está autenticado");
      return res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
    }
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
          console.error("Erro ao fazer login automático:", err);
          return res.status(500).json({ message: "Erro ao fazer login automático." });
        }
        
        console.log("Sessão criada após registro. User ID:", newUser.id, "Session ID:", req.sessionID);
        
        // Forçar salvamento da sessão no armazenamento para garantir persistência
        req.session.save((err) => {
          if (err) {
            console.error("Erro ao salvar sessão após registro:", err);
          }
          
          res.status(201).json({ user: newUser });
        });
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
  
  // Excluir usuário de uma clínica
  app.delete("/api/clinic-users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicUserId = parseInt(req.params.id);
      
      // Verificar se o clinicUser existe
      const clinicUsers = await storage.listClinicUsers();
      const clinicUser = clinicUsers.find(cu => cu.id === clinicUserId);
      
      if (!clinicUser) {
        return res.status(404).json({ message: "Usuário da clínica não encontrado." });
      }
      
      // Verificar se o usuário é SUPER_ADMIN (que tem todas as permissões)
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
      
      if (!isSuperAdmin) {
        // Verificar se o usuário solicitante tem permissão para remover usuários da clínica
        const requesterClinicUser = await storage.getClinicUserByUserAndClinic(req.user!.id, clinicUser.clinicId);
        
        if (!requesterClinicUser || !['OWNER', 'MANAGER'].includes(requesterClinicUser.role)) {
          return res.status(403).json({ message: "Você não tem permissão para remover usuários desta clínica." });
        }
      }
      
      // Não permitir a exclusão do próprio usuário OWNER
      if (clinicUser.role === 'OWNER' && clinicUser.userId === req.user!.id) {
        return res.status(400).json({ message: "Você não pode remover a si mesmo como proprietário da clínica." });
      }
      
      // Excluir o clinicUser
      const result = await storage.deleteClinicUser(clinicUserId);
      
      if (result) {
        res.json({ message: "Usuário removido da clínica com sucesso." });
      } else {
        res.status(500).json({ message: "Erro ao remover usuário da clínica." });
      }
    } catch (error) {
      console.error("Erro ao excluir usuário da clínica:", error);
      res.status(500).json({ message: "Erro ao excluir usuário da clínica." });
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
  
  // Endpoint para buscar as permissões do usuário logado
  app.get("/api/me/permissions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        // Se o usuário não estiver autenticado, retorna um array vazio
        // Isso é importante para o funcionamento do PermissionsProvider no cliente
        return res.json([]);
      }
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      // Buscar todas as relações clinicUser do usuário
      const clinicUsers = await storage.listClinicUsers(undefined, userId);
      
      if (clinicUsers.length === 0) {
        return res.json([]);
      }
      
      // Buscar todas as permissões de todas as relações clinicUser do usuário
      const permissions = [];
      
      for (const clinicUser of clinicUsers) {
        const userPermissions = await storage.getPermissions(clinicUser.id);
        permissions.push(...userPermissions);
      }
      
      // Remover duplicatas (caso o usuário tenha a mesma permissão em múltiplas clínicas)
      const uniquePermissions = permissions.filter((permission, index, self) =>
        index === self.findIndex((p) => 
          p.module === permission.module && p.action === permission.action
        )
      );
      
      res.json(uniquePermissions);
    } catch (error) {
      console.error("Erro ao buscar permissões do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar permissões do usuário." });
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
      console.log("[DEBUG] Erro ao buscar serviços:", error);
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
  
  app.patch("/api/services/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      // Verificar se o serviço existe
      const existingService = await storage.getService(serviceId);
      if (!existingService) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }
      
      // Verificar se o usuário tem permissão para editar serviços da clínica
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(existingService.clinicId, user.id);
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem permissão para editar este serviço." });
      }
      
      // Atualizar o serviço
      try {
        const updatedService = await storage.updateService(serviceId, req.body);
        res.json(updatedService);
      } catch (error) {
        return res.status(400).json({ message: "Dados inválidos para atualização." });
      }
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Erro ao atualizar serviço." });
    }
  });
  
  app.delete("/api/services/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      
      // Verificar se o serviço existe
      const existingService = await storage.getService(serviceId);
      if (!existingService) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }
      
      // Verificar se o usuário tem permissão para excluir serviços da clínica
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(existingService.clinicId, user.id);
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este serviço." });
      }
      
      // Excluir o serviço
      await storage.deleteService(serviceId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Erro ao excluir serviço." });
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
      const user = req.user as any;
      const { clinicId } = req.body;
      
      console.log("Tentando criar convite. Usuário:", user.email, "ID:", user.id, "Clínica ID:", clinicId);
      
      if (!clinicId) {
        console.log("Erro: ID da clínica não informado");
        return res.status(400).json({ message: "É necessário informar o ID da clínica." });
      }
      
      // Verificando se o usuário existe pelo email, que é mais confiável que o ID
      const userEmail = user.email;
      console.log("Buscando usuário pelo email:", userEmail);
      
      // Buscar no banco diretamente para evitar problemas de ID
      // Selecionar apenas as colunas que existem na tabela
      const [userDetails] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(eq(users.email, userEmail));
      
      console.log("Detalhes do usuário encontrado:", JSON.stringify(userDetails));
      
      if (!userDetails) {
        console.log("Usuário não encontrado na base de dados");
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      
      // Verificando relação com a clínica usando o ID recuperado do banco
      const [clinicUser] = await db
        .select()
        .from(clinicUsers)
        .where(
          and(
            eq(clinicUsers.userId, userDetails.id),
            eq(clinicUsers.clinicId, clinicId)
          )
        );
      
      console.log("Relação com a clínica:", JSON.stringify(clinicUser));
      
      // Se o usuário é SUPER_ADMIN ou OWNER da clínica, ele deve ter permissão
      if (userDetails.role === UserRole.SUPER_ADMIN || (clinicUser && clinicUser.role === ClinicRole.OWNER)) {
        console.log("Usuário tem permissão para criar convites. Role:", userDetails.role, "Clínica Role:", clinicUser?.role);
        
        // Generate a random token
        const token = crypto.randomBytes(32).toString("hex");
        
        const data = {
          ...req.body,
          token,
          invitedBy: userDetails.id, // Use o ID correto do banco
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };
        
        console.log("Dados do convite:", JSON.stringify(data));
        
        const result = insertInvitationSchema.safeParse(data);
        
        if (!result.success) {
          console.log("Dados inválidos:", result.error.errors);
          return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
        }
        
        console.log("Criando convite na base de dados");
        const newInvitation = await storage.createInvitation(result.data);
        console.log("Convite criado com sucesso:", JSON.stringify(newInvitation));
        
        // In a real app, we would send an email with the invitation link
        // For demo purposes, we'll just return the token in the response
        res.status(201).json({
          ...newInvitation,
          invitationLink: `/accept-invitation?token=${token}`
        });
      } else {
        console.log("Usuário não tem permissão. Role:", userDetails.role, "Clínica Role:", clinicUser?.role);
        return res.status(403).json({ message: "Você não tem permissão para convidar usuários para esta clínica." });
      }
    } catch (error) {
      console.error("Erro ao criar convite:", error);
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
  
  // Get invitations for a specific clinic
  app.get("/api/clinics/:clinicId/invitations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verificar se o usuário tem permissão para esta clínica
      const clinicUser = await storage.getClinicUserByUserAndClinic(req.user!.id, clinicId);
      
      if (!clinicUser || !['OWNER', 'MANAGER'].includes(clinicUser.role)) {
        return res.status(403).json({ message: "Você não tem permissão para visualizar convites desta clínica." });
      }
      
      const invitations = await storage.listInvitations(clinicId);
      
      // Filtrar apenas convites não expirados
      const validInvitations = invitations.filter(inv => 
        new Date(inv.expiresAt) > new Date()
      );
      
      // Obter informações adicionais sobre quem enviou o convite
      const invitationsWithDetails = await Promise.all(validInvitations.map(async inv => {
        const inviter = await storage.getUser(inv.invitedBy);
        
        return {
          ...inv,
          inviterName: inviter?.name || `Usuário #${inv.invitedBy}`
        };
      }));
      
      console.log(`Retornando ${invitationsWithDetails.length} convites para a clínica ${clinicId}`);
      res.json(invitationsWithDetails);
    } catch (error) {
      console.error(`Erro ao buscar convites da clínica: ${error}`);
      res.status(500).json({ message: "Erro ao buscar convites da clínica." });
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
  
  // Cancelar convite (exclui o convite)
  app.delete("/api/invitations/:token", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const invitation = await storage.getInvitation(token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Convite não encontrado." });
      }
      
      // Verificar se o usuário tem permissão para gerenciar esta clínica
      const clinicUser = await storage.getClinicUserByUserAndClinic(req.user!.id, invitation.clinicId);
      
      if (!clinicUser || !['OWNER', 'MANAGER'].includes(clinicUser.role)) {
        return res.status(403).json({ message: "Você não tem permissão para cancelar convites nesta clínica." });
      }
      
      await storage.deleteInvitationByToken(token);
      res.status(200).json({ message: "Convite cancelado com sucesso." });
    } catch (error) {
      console.error("Erro ao cancelar convite:", error);
      res.status(500).json({ message: "Erro ao cancelar convite." });
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
  app.post("/api/payments/create", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { amount, appointmentId, clinicId, serviceId, clientId, paymentMethod = 'dinheiro', notes } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valor do pagamento inválido" });
      }
      
      if (!clinicId) {
        return res.status(400).json({ message: "ID da clínica é obrigatório" });
      }
      
      if (!clientId) {
        return res.status(400).json({ message: "ID do cliente é obrigatório" });
      }
      
      // Criar registro de pagamento usando nosso serviço local
      const payment = await paymentService.createPayment({
        amount,
        clinicId,
        clientId,
        createdBy: req.user!.id,
        appointmentId,
        paymentMethod,
        notes
      });
      
      // Retornar as informações do pagamento
      res.json({
        payment,
        success: true
      });
    } catch (error: any) {
      console.error("Erro ao criar pagamento:", error);
      res.status(500).json({ message: error.message || "Erro ao processar pagamento" });
    }
  });
  
  app.post("/api/payments/confirm", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "ID de pagamento inválido" });
      }
      
      // Confirmar pagamento usando nosso serviço local
      const payment = await paymentService.confirmPayment(paymentId);
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error("Erro ao confirmar pagamento:", error);
      res.status(500).json({ message: error.message || "Erro ao confirmar pagamento" });
    }
  });
  
  app.post("/api/payments/refund", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { paymentId, amount, reason } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: "ID de pagamento inválido" });
      }
      
      // Processar reembolso usando nosso serviço local
      const payment = await paymentService.createRefund(paymentId, amount, reason);
      
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error("Erro ao processar reembolso:", error);
      res.status(500).json({ message: error.message || "Erro ao processar reembolso" });
    }
  });
  
  app.get("/api/payments/clinic/:clinicId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const payments = await paymentService.listPaymentsByClinic(clinicId);
      res.json(payments);
    } catch (error: any) {
      console.error("Erro ao buscar pagamentos da clínica:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamentos" });
    }
  });
  
  app.get("/api/payments/appointment/:appointmentId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const payments = await paymentService.listPaymentsByAppointment(appointmentId);
      res.json(payments);
    } catch (error: any) {
      console.error("Erro ao buscar pagamentos do agendamento:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamentos" });
    }
  });
  
  app.get("/api/payments/client/:clientId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const payments = await paymentService.listPaymentsByClient(clientId);
      res.json(payments);
    } catch (error: any) {
      console.error("Erro ao buscar pagamentos do cliente:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamentos" });
    }
  });
  
  app.get("/api/payments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const paymentId = parseInt(req.params.id);
      const payment = await paymentService.getPayment(paymentId);
      
      if (!payment) {
        return res.status(404).json({ message: "Pagamento não encontrado" });
      }
      
      res.json(payment);
    } catch (error: any) {
      console.error("Erro ao buscar pagamento:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar pagamento" });
    }
  });
  
  // Rota para obter dados de desempenho da clínica para o heatmap
  // Endpoints do módulo financeiro para dashboard
  app.get("/api/clinics/:clinicId/financial/stats/:period", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const period = req.params.period || "month";
      
      // Verifica se o usuário tem permissão para acessar dados desta clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar dados desta clínica" });
      }
      
      // Define o período de consulta
      const now = new Date();
      let startDate = new Date();
      
      if (period === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      // Consulta pagamentos do período
      const paymentsData = await db
        .select({
          id: payments.id,
          amount: payments.amount,
          status: payments.status,
          createdAt: payments.createdAt
        })
        .from(payments)
        .where(eq(payments.clinicId, clinicId));
      
      // Filtra por período
      const periodPayments = paymentsData.filter(p => 
        p.createdAt >= startDate && p.createdAt <= now
      );
      
      // Calcula estatísticas
      const totalRevenue = periodPayments
        .filter(p => p.status === PaymentStatus.PAID || p.status === PaymentStatus.PARTIAL)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingPayments = periodPayments
        .filter(p => p.status === PaymentStatus.PENDING)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const completedPayments = periodPayments
        .filter(p => p.status === PaymentStatus.PAID)
        .length;
      
      // Consulta as despesas (em uma implementação real, teria uma tabela de despesas)
      // Usando valor fixo para exemplo
      const totalExpenses = Math.round(totalRevenue * 0.41); // 41% de despesas
      
      // Calcula lucro líquido
      const netProfit = totalRevenue - totalExpenses;
      
      // Calcula taxa de crescimento (exemplo)
      const growthRate = 8.5;
      
      res.json({
        totalRevenue,
        totalExpenses,
        netProfit,
        pendingPayments,
        completedPayments,
        growthRate
      });
    } catch (error: any) {
      console.error("Erro ao buscar estatísticas financeiras:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Endpoint para obter métricas avançadas para o dashboard
  app.get("/api/clinics/:clinicId/dashboard/advanced-metrics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verifica se o usuário tem permissão para acessar dados desta clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar dados desta clínica" });
      }
      
      // Determina datas para análise
      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      // Buscar dados do banco
      let appointmentsData = [];
      let clientsData = [];
      let paymentsData = [];
      let professionalsData = [];
      
      try {
        // Buscar todos os agendamentos - apenas campos que sabemos que existem na tabela física
        appointmentsData = await db
          .select({
            id: appointments.id,
            clientId: appointments.clientId,
            professionalId: appointments.professionalId,
            serviceId: appointments.serviceId,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            status: appointments.status,
            createdAt: appointments.createdAt
          })
          .from(appointments)
          .where(eq(appointments.clinicId, clinicId));
        
        // Buscar clientes - apenas campos que sabemos que existem na tabela física
        clientsData = await db
          .select({
            id: clients.id,
            name: clients.name,
            email: clients.email,
            phone: clients.phone,
            createdAt: clients.createdAt
          })
          .from(clients)
          .where(eq(clients.clinicId, clinicId));
        
        // Buscar pagamentos - apenas campos que sabemos que existem na tabela física
        paymentsData = await db
          .select({
            id: payments.id,
            clientId: payments.clientId,
            appointmentId: payments.appointmentId,
            amount: payments.amount,
            paymentMethod: payments.paymentMethod,
            status: payments.status,
            createdAt: payments.createdAt
          })
          .from(payments)
          .where(eq(payments.clinicId, clinicId));
        
        // Buscar profissionais - apenas campos que sabemos que existem na tabela física
        professionalsData = await db
          .select({
            id: professionals.id,
            userId: professionals.userId,
            specialization: professionals.specialization,
            createdAt: professionals.createdAt
          })
          .from(professionals)
          .where(eq(professionals.clinicId, clinicId));
      } catch (dbError) {
        console.error("Erro na consulta ao banco de dados:", dbError);
        return res.status(500).json({ message: "Erro na consulta ao banco de dados" });
      }
      
      // Cálculos para métricas de agendamentos
      const currentMonthAppointments = appointmentsData.filter(
        app => app.startTime >= startOfCurrentMonth && app.startTime <= today
      );
      
      const previousMonthAppointments = appointmentsData.filter(
        app => app.startTime >= startOfPreviousMonth && app.startTime < startOfCurrentMonth
      );
      
      const canceledAppointments = appointmentsData.filter(app => app.status === "CANCELLED");
      const cancelationRate = appointmentsData.length > 0 
        ? (canceledAppointments.length / appointmentsData.length) * 100 
        : 0;
      
      // Análise de horários mais populares
      const hourCounts: Record<number, number> = {};
      appointmentsData.forEach(app => {
        const hour = new Date(app.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      // Encontrar o horário mais popular
      let mostPopularHour = 0;
      let maxCount = 0;
      Object.entries(hourCounts).forEach(([hour, count]) => {
        if (count > maxCount) {
          mostPopularHour = parseInt(hour);
          maxCount = count;
        }
      });
      
      // Calcular taxa de agendamentos por profissional
      const appointmentsByProfessional: Record<number, number> = {};
      appointmentsData.forEach(app => {
        appointmentsByProfessional[app.professionalId] = (appointmentsByProfessional[app.professionalId] || 0) + 1;
      });
      
      // Calcular o profissional mais ocupado
      let busiestProfessionalId = 0;
      let busiestProfessionalCount = 0;
      Object.entries(appointmentsByProfessional).forEach(([profId, count]) => {
        if (count > busiestProfessionalCount) {
          busiestProfessionalId = parseInt(profId);
          busiestProfessionalCount = count;
        }
      });
      
      // Análise de novos clientes
      const newClientsThisMonth = clientsData.filter(
        client => client.createdAt >= startOfCurrentMonth
      ).length;
      
      const newClientsPreviousMonth = clientsData.filter(
        client => client.createdAt >= startOfPreviousMonth && client.createdAt < startOfCurrentMonth
      ).length;
      
      const newClientsGrowth = newClientsPreviousMonth > 0 
        ? ((newClientsThisMonth - newClientsPreviousMonth) / newClientsPreviousMonth) * 100 
        : newClientsThisMonth > 0 ? 100 : 0;
      
      // Análise de receita
      const currentMonthRevenue = paymentsData
        .filter(payment => payment.createdAt >= startOfCurrentMonth)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const previousMonthRevenue = paymentsData
        .filter(payment => payment.createdAt >= startOfPreviousMonth && payment.createdAt < startOfCurrentMonth)
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : currentMonthRevenue > 0 ? 100 : 0;
      
      // Taxa de ocupação da clínica
      // Aqui consideramos horário comercial (8h às 18h) e dias úteis (22 dias no mês)
      const workingHoursPerDay = 10; // 8h às 18h
      const workingDaysPerMonth = 22;
      const totalPossibleAppointmentsPerMonth = workingHoursPerDay * workingDaysPerMonth * professionalsData.length;
      
      const occupancyRate = totalPossibleAppointmentsPerMonth > 0 
        ? (currentMonthAppointments.length / totalPossibleAppointmentsPerMonth) * 100 
        : 0;
      
      res.json({
        agendamentos: {
          total: appointmentsData.length,
          mesAtual: currentMonthAppointments.length,
          mesAnterior: previousMonthAppointments.length,
          crescimento: previousMonthAppointments.length > 0 
            ? ((currentMonthAppointments.length - previousMonthAppointments.length) / previousMonthAppointments.length) * 100 
            : currentMonthAppointments.length > 0 ? 100 : 0,
          taxaCancelamento: cancelationRate,
          horarioMaisPopular: mostPopularHour,
          taxaOcupacao: occupancyRate
        },
        clientes: {
          total: clientsData.length,
          novosNoMes: newClientsThisMonth,
          crescimentoNovosClientes: newClientsGrowth,
        },
        financeiro: {
          receitaMesAtual: currentMonthRevenue,
          receitaMesAnterior: previousMonthRevenue,
          crescimentoReceita: revenueGrowth,
          ticketMedio: paymentsData.length > 0 ? paymentsData.reduce((sum, p) => sum + p.amount, 0) / paymentsData.length : 0
        },
        equipe: {
          totalProfissionais: professionalsData.length,
          profissionalMaisOcupado: busiestProfessionalId,
          atendimentosPorProfissional: appointmentsByProfessional
        }
      });
    } catch (error: any) {
      console.error("Erro ao buscar métricas avançadas:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar métricas avançadas" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/revenue/:period", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const period = req.params.period || "month";
      
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar dados desta clínica" });
      }
      
      // Consulta os serviços realizados com pagamentos
      const revenueResults = await db
        .select({
          serviceId: appointments.serviceId,
        })
        .from(appointments)
        .where(eq(appointments.clinicId, clinicId));
        
      // Agrupa os resultados por tipo de serviço
      const serviceGroups: Record<string, number> = {
        'Consultas': 0,
        'Procedimentos': 0,
        'Produtos': 0,
        'Exames': 0
      };
      
      // Em uma implementação real, consultaria o banco para categorizar
      // Aqui estamos distribuindo os valores como exemplo
      const totalRevenue = 78950;
      serviceGroups['Consultas'] = Math.round(totalRevenue * 0.41);
      serviceGroups['Procedimentos'] = Math.round(totalRevenue * 0.35);
      serviceGroups['Produtos'] = Math.round(totalRevenue * 0.16);
      serviceGroups['Exames'] = Math.round(totalRevenue * 0.08);
      
      const revenueBySource = Object.entries(serviceGroups).map(([name, value]) => ({
        name,
        value
      }));
      
      res.json(revenueBySource);
    } catch (error: any) {
      console.error("Erro ao buscar receitas por fonte:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/monthly/:period", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar dados desta clínica" });
      }
      
      // Em uma implementação real, consultaríamos o banco para cada mês
      // Aqui estamos retornando dados de exemplo para não bloquear o frontend
      const monthlySummary = [
        { month: 'Jan', revenue: 52000, expenses: 22000, profit: 30000 },
        { month: 'Fev', revenue: 58000, expenses: 24000, profit: 34000 },
        { month: 'Mar', revenue: 61000, expenses: 26000, profit: 35000 },
        { month: 'Abr', revenue: 65000, expenses: 28000, profit: 37000 },
        { month: 'Mai', revenue: 69000, expenses: 30000, profit: 39000 },
        { month: 'Jun', revenue: 78950, expenses: 32450, profit: 46500 }
      ];
      
      res.json(monthlySummary);
    } catch (error: any) {
      console.error("Erro ao buscar resumo mensal:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Função auxiliar para verificar acesso à clínica
  async function hasClinicAccess(userId: number, clinicId: number): Promise<boolean> {
    try {
      console.log(`Verificando acesso do usuário ${userId} à clínica ${clinicId}`);
      
      // Verifica casos especiais para usuários de teste
      if (userId === 999) {
        console.log("Usuário de teste (Guilherme Varela) tem acesso a todas as clínicas");
        return true;
      }
      
      // Primeiro verifica se o usuário existe
      const userResult = await storage.getUser(userId);
      if (!userResult) {
        console.log(`Usuário ${userId} não encontrado`);
        return false;
      }
      
      // Verifica se o usuário é SUPER_ADMIN
      if (userResult.role === UserRole.SUPER_ADMIN) {
        console.log(`Usuário ${userId} é SUPER_ADMIN e tem acesso a todas as clínicas`);
        return true;
      }
      
      // Verifica se o usuário está associado à clínica
      const clinicUser = await storage.getClinicUser(clinicId, userId);
      console.log(`Associação do usuário ${userId} com a clínica ${clinicId}: ${!!clinicUser}`);
      
      return !!clinicUser;
    } catch (error) {
      console.error("Erro ao verificar acesso à clínica:", error);
      return false;
    }
  }

  // Endpoint para análise de desempenho por serviço
  app.get("/api/clinics/:clinicId/dashboard/service-performance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verifica se o usuário tem permissão para acessar dados desta clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar dados desta clínica" });
      }
      
      // Importar esquema de serviços
      const { services } = await import("@shared/schema");
      
      // Buscar serviços da clínica
      const servicesData = await db
        .select({
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
        })
        .from(services)
        .where(eq(services.clinicId, clinicId))
        .limit(10);  // Limita para os 10 primeiros para performance
      
      // Buscar agendamentos para calcular quantas vezes cada serviço foi realizado
      const { appointments } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      
      const appointmentsData = await db
        .select({
          serviceId: appointments.serviceId,
          status: appointments.status,
          startTime: appointments.startTime,
        })
        .from(appointments)
        .where(eq(appointments.clinicId, clinicId))
        .orderBy(desc(appointments.startTime));
      
      // Calcular performance de cada serviço
      const servicePerformance = servicesData.map(service => {
        // Contar quantas vezes este serviço foi agendado
        const serviceAppointments = appointmentsData.filter(app => app.serviceId === service.id);
        const completedAppointments = serviceAppointments.filter(app => app.status === "COMPLETED").length;
        const canceledAppointments = serviceAppointments.filter(app => app.status === "CANCELLED").length;
        
        // Calcular receita total gerada por este serviço
        const totalRevenue = completedAppointments * service.price;
        
        // Calcular taxa de conclusão e cancelamento
        const completionRate = serviceAppointments.length > 0 
          ? (completedAppointments / serviceAppointments.length) * 100 
          : 0;
        
        const cancellationRate = serviceAppointments.length > 0 
          ? (canceledAppointments / serviceAppointments.length) * 100 
          : 0;
        
        // Agrupar por mês para tendência
        const monthlyData = new Map<string, { count: number, revenue: number }>();
        const today = new Date();
        
        // Inicializar os últimos 6 meses
        for (let i = 5; i >= 0; i--) {
          const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
          monthlyData.set(monthKey, { count: 0, revenue: 0 });
        }
        
        // Preencher com dados reais
        serviceAppointments.forEach(app => {
          const appDate = new Date(app.startTime);
          const monthKey = `${appDate.getFullYear()}-${appDate.getMonth() + 1}`;
          
          if (monthlyData.has(monthKey) && app.status === "COMPLETED") {
            const data = monthlyData.get(monthKey)!;
            data.count += 1;
            data.revenue += service.price;
          }
        });
        
        // Converter para array para resposta
        const trend = Array.from(monthlyData.entries()).map(([month, data]) => ({
          month,
          count: data.count,
          revenue: data.revenue
        }));
        
        return {
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          totalAppointments: serviceAppointments.length,
          completedAppointments,
          canceledAppointments,
          totalRevenue,
          completionRate,
          cancellationRate,
          trend
        };
      });
      
      // Ordenar por receita total
      servicePerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
      
      res.json(servicePerformance);
    } catch (error: any) {
      console.error("Erro ao buscar desempenho por serviço:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar desempenho por serviço" });
    }
  });
  
  app.get("/api/clinics/:clinicId/performance-heatmap", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const { startDate, endDate } = req.query;
      
      // Validar parâmetros
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Data inicial e final são obrigatórias" });
      }
      
      const start = startDate as string;
      const end = endDate as string;
      
      // Agregar dados por dia
      type DailyPerformance = {
        date: string;
        count: number;
        value: number;
      };
      
      try {
        // Importar função de formatação de datas
        const { format } = await import("date-fns");
        
        // Buscar os agendamentos diretamente com SQL para evitar problemas de schema
        const appointmentsResult = await pool.query(`
          SELECT 
            id, start_time, client_id, professional_id 
          FROM 
            appointments 
          WHERE 
            clinic_id = $1 
            AND start_time BETWEEN $2 AND $3
        `, [clinicId, start, end]);
        
        // Buscar os pagamentos diretamente com SQL
        const paymentsResult = await pool.query(`
          SELECT 
            id, amount, created_at, client_id 
          FROM 
            payments 
          WHERE 
            clinic_id = $1 
            AND created_at BETWEEN $2 AND $3
        `, [clinicId, start, end]);
        
        const appointmentsData = appointmentsResult.rows || [];
        const paymentsData = paymentsResult.rows || [];
        
        const performanceMap = new Map<string, DailyPerformance>();
        
        // Processar agendamentos
        for (const appointment of appointmentsData) {
          const appointmentDate = new Date(appointment.start_time);
          const dateStr = format(appointmentDate, 'yyyy-MM-dd');
          
          if (!performanceMap.has(dateStr)) {
            performanceMap.set(dateStr, { date: dateStr, count: 0, value: 0 });
          }
          
          const dayData = performanceMap.get(dateStr)!;
          dayData.count += 1;
        }
        
        // Processar pagamentos
        for (const payment of paymentsData) {
          if (!payment.created_at) continue;
          
          const paymentDate = new Date(payment.created_at);
          const dateStr = format(paymentDate, 'yyyy-MM-dd');
          
          if (!performanceMap.has(dateStr)) {
            performanceMap.set(dateStr, { date: dateStr, count: 0, value: 0 });
          }
          
          const dayData = performanceMap.get(dateStr)!;
          dayData.value += Number(payment.amount);
        }
        
        // Converter para array de resultados formatados para o heatmap
        const heatmapData = Array.from(performanceMap.values()).map(day => ({
          date: day.date,
          count: day.count,
          value: day.value
        }));
        
        res.json(heatmapData);
      } catch (dbError) {
        console.error("Erro na consulta do banco:", dbError);
        res.status(500).json({ message: "Erro na consulta ao banco de dados", error: (dbError as Error).message });
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados de desempenho para heatmap:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar dados de desempenho" });
    }
  });

  // Registrar as rotas do CRM
  registerCRMRoutes(app, isAuthenticated);

  // Registrar as rotas de inventário
  registerInventoryRoutes(app, isAuthenticated);

  // Registrar as rotas de profissionais
  registerProfessionalsRoutes(app, isAuthenticated);
  
  // Registrar as rotas do módulo financeiro
  registerFinancialRoutes(app, isAuthenticated);

  // Registrar as rotas do sistema de tarefas
  registerTaskRoutes(app, isAuthenticated);

  // Rotas do módulo de segurança

  // Rotas para gerenciamento de dispositivos conectados
  app.get("/api/security/devices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const devices = await storage.getUserDevices(userId);
      res.json(devices);
    } catch (error) {
      console.error("Erro ao buscar dispositivos do usuário:", error);
      res.status(500).json({ message: "Erro ao buscar dispositivos." });
    }
  });

  app.post("/api/security/devices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const result = insertUserDeviceSchema.safeParse({
        ...req.body,
        userId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const device = await storage.createUserDevice(result.data);
      res.status(201).json(device);
    } catch (error) {
      console.error("Erro ao criar dispositivo:", error);
      res.status(500).json({ message: "Erro ao criar dispositivo." });
    }
  });

  app.delete("/api/security/devices/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const deviceId = parseInt(req.params.id);
      const device = await storage.getUserDevice(deviceId);
      
      if (!device || device.userId !== userId) {
        return res.status(404).json({ message: "Dispositivo não encontrado ou não pertence ao usuário." });
      }
      
      const success = await storage.deleteUserDevice(deviceId);
      if (success) {
        res.json({ message: "Dispositivo removido com sucesso." });
      } else {
        res.status(500).json({ message: "Erro ao remover dispositivo." });
      }
    } catch (error) {
      console.error("Erro ao remover dispositivo:", error);
      res.status(500).json({ message: "Erro ao remover dispositivo." });
    }
  });

  app.post("/api/security/devices/revoke-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const { exceptCurrentDevice } = req.body;
      const currentDeviceId = exceptCurrentDevice ? parseInt(req.body.currentDeviceId) : undefined;
      
      const success = await storage.revokeAllUserDevices(userId, currentDeviceId);
      if (success) {
        res.json({ message: "Todos os dispositivos foram revogados com sucesso." });
      } else {
        res.status(500).json({ message: "Erro ao revogar dispositivos." });
      }
    } catch (error) {
      console.error("Erro ao revogar todos os dispositivos:", error);
      res.status(500).json({ message: "Erro ao revogar dispositivos." });
    }
  });

  // Rotas para logs de atividade
  app.get("/api/security/activity-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getUserActivityLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Erro ao buscar logs de atividade:", error);
      res.status(500).json({ message: "Erro ao buscar logs de atividade." });
    }
  });

  app.post("/api/security/activity-logs", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const result = insertActivityLogSchema.safeParse({
        ...req.body,
        userId,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const log = await storage.createActivityLog(result.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Erro ao criar log de atividade:", error);
      res.status(500).json({ message: "Erro ao criar log de atividade." });
    }
  });

  // Rotas para autenticação de dois fatores (2FA)
  app.get("/api/security/2fa", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const twoFA = await storage.getUserTwoFactorAuth(userId);
      if (!twoFA) {
        return res.status(404).json({ message: "Configuração 2FA não encontrada." });
      }
      
      // Não enviar o secret para o cliente
      const { appSecret, ...safeData } = twoFA;
      res.json(safeData);
    } catch (error) {
      console.error("Erro ao buscar configuração 2FA:", error);
      res.status(500).json({ message: "Erro ao buscar configuração 2FA." });
    }
  });

  app.post("/api/security/2fa/setup", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      // Gerar um segredo para autenticação por app
      const appSecret = crypto.randomBytes(20).toString('hex');
      
      // Gerar códigos de backup
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
      
      const result = insertUserTwoFactorAuthSchema.safeParse({
        userId,
        appEnabled: false,
        appSecret,
        smsEnabled: false,
        phoneVerified: false,
        emailEnabled: false,
        emailVerified: false,
        backupCodes
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      // Verificar se já existe configuração 2FA para este usuário
      const existingTwoFA = await storage.getUserTwoFactorAuth(userId);
      
      let twoFA;
      if (existingTwoFA) {
        // Atualizar configuração existente
        twoFA = await storage.updateUserTwoFactorAuth(userId, {
          appSecret,
          backupCodes
        });
      } else {
        // Criar nova configuração
        twoFA = await storage.createUserTwoFactorAuth(result.data);
      }
      
      if (!twoFA) {
        return res.status(500).json({ message: "Erro ao configurar 2FA." });
      }
      
      // Retornar apenas o necessário para setup
      res.status(201).json({
        appSecret,
        backupCodes
      });
    } catch (error) {
      console.error("Erro ao configurar 2FA:", error);
      res.status(500).json({ message: "Erro ao configurar 2FA." });
    }
  });

  app.post("/api/security/2fa/verify-app", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Código obrigatório." });
      }
      
      const twoFA = await storage.getUserTwoFactorAuth(userId);
      if (!twoFA || !twoFA.appSecret) {
        return res.status(404).json({ message: "Configuração 2FA não encontrada." });
      }
      
      // Em uma implementação real, você verificaria o código TOTP aqui
      // Para este protótipo, vamos simular a verificação
      const verified = code === "123456"; // Simulação
      
      if (verified) {
        await storage.updateUserTwoFactorAuth(userId, {
          appEnabled: true
        });
        
        // Registrar atividade
        await storage.createActivityLog({
          userId,
          activity: "Ativação de autenticação em dois fatores (app)",
          entityType: "security",
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
        res.json({ success: true, message: "Verificação bem-sucedida. 2FA com app está ativado." });
      } else {
        res.status(400).json({ success: false, message: "Código inválido." });
      }
    } catch (error) {
      console.error("Erro ao verificar código 2FA:", error);
      res.status(500).json({ message: "Erro ao verificar código 2FA." });
    }
  });

  app.post("/api/security/2fa/verify-email", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Código obrigatório." });
      }
      
      // Em uma implementação real, você verificaria o código enviado por email
      // Para este protótipo, vamos simular a verificação
      const verified = code === "654321"; // Simulação
      
      if (verified) {
        await storage.updateUserTwoFactorAuth(userId, {
          emailEnabled: true,
          emailVerified: true
        });
        
        // Registrar atividade
        await storage.createActivityLog({
          userId,
          activity: "Ativação de autenticação em dois fatores (email)",
          entityType: "security",
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
        res.json({ success: true, message: "Verificação bem-sucedida. 2FA com email está ativado." });
      } else {
        res.status(400).json({ success: false, message: "Código inválido." });
      }
    } catch (error) {
      console.error("Erro ao verificar código de email 2FA:", error);
      res.status(500).json({ message: "Erro ao verificar código de email 2FA." });
    }
  });

  app.post("/api/security/2fa/verify-sms", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Código obrigatório." });
      }
      
      // Em uma implementação real, você verificaria o código enviado por SMS
      // Para este protótipo, vamos simular a verificação
      const verified = code === "987654"; // Simulação
      
      if (verified) {
        await storage.updateUserTwoFactorAuth(userId, {
          smsEnabled: true,
          phoneVerified: true
        });
        
        // Registrar atividade
        await storage.createActivityLog({
          userId,
          activity: "Ativação de autenticação em dois fatores (SMS)",
          entityType: "security",
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
        
        res.json({ success: true, message: "Verificação bem-sucedida. 2FA com SMS está ativado." });
      } else {
        res.status(400).json({ success: false, message: "Código inválido." });
      }
    } catch (error) {
      console.error("Erro ao verificar código de SMS 2FA:", error);
      res.status(500).json({ message: "Erro ao verificar código de SMS 2FA." });
    }
  });

  app.post("/api/security/2fa/disable", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado." });
      }
      
      const { method } = req.body;
      if (!method || !["app", "sms", "email"].includes(method)) {
        return res.status(400).json({ message: "Método inválido. Use 'app', 'sms' ou 'email'." });
      }
      
      const twoFA = await storage.getUserTwoFactorAuth(userId);
      if (!twoFA) {
        return res.status(404).json({ message: "Configuração 2FA não encontrada." });
      }
      
      const updates: Partial<UserTwoFactorAuth> = {};
      
      if (method === "app") {
        updates.appEnabled = false;
      } else if (method === "sms") {
        updates.smsEnabled = false;
      } else if (method === "email") {
        updates.emailEnabled = false;
      }
      
      await storage.updateUserTwoFactorAuth(userId, updates);
      
      // Registrar atividade
      await storage.createActivityLog({
        userId,
        activity: `Desativação de autenticação em dois fatores (${method})`,
        entityType: "security",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ message: `2FA por ${method} desativado com sucesso.` });
    } catch (error) {
      console.error("Erro ao desativar 2FA:", error);
      res.status(500).json({ message: "Erro ao desativar 2FA." });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
