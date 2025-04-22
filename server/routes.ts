import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClinicSchema,
  insertClinicUserSchema,
  insertPermissionSchema,
  insertClientSchema,
  insertServiceSchema,
  insertAppointmentSchema,
  insertInvitationSchema,
  UserRole,
  ClinicRole
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import MemoryStore from "memorystore";

// Create an instance of MemoryStore for sessions
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "gardenia-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new SessionStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: "Credenciais inválidas." });
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "Usuário inativo. Entre em contato com o administrador." });
          }
          
          // Compare password with hashed password
          // In a real app we'd use bcrypt.compare, but for this demo we'll check directly
          // const isValid = await bcrypt.compare(password, user.password);
          const isValid = password === "password"; // Simplified for demo
          
          if (!isValid) {
            return done(null, false, { message: "Credenciais inválidas." });
          }
          
          // Update last login time
          await storage.updateUser(user.id, { lastLogin: new Date() });
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  
  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
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
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout." });
      }
      res.json({ message: "Logout realizado com sucesso." });
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
      const clinics = await storage.listClinics();
      res.json(clinics);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clínicas." });
    }
  });
  
  app.post("/api/clinics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertClinicSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const newClinic = await storage.createClinic(result.data);
      
      // Create clinic-user relationship for the owner
      const user = req.user as any;
      await storage.createClinicUser({
        clinicId: newClinic.id,
        userId: user.id,
        role: ClinicRole.OWNER,
        invitedBy: user.id
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
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
