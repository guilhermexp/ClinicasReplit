import { Request, Response, type Express } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { 
  insertLeadSchema,
  insertLeadInteractionSchema,
  insertLeadAppointmentSchema,
  leads,
  leadInteractions,
  leadAppointments
} from "@shared/schema";

export function registerCRMRoutes(app: Express, isAuthenticated: (req: Request, res: Response, next: Function) => void) {
  // Leads routes
  app.get("/api/clinics/:clinicId/leads", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verifica se o usuário tem acesso à clínica
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
      }
      
      const leadsResult = await db.select().from(leads).where(eq(leads.clinicId, clinicId));
      res.json(leadsResult);
    } catch (error: any) {
      console.error("Erro ao buscar leads:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar leads" });
    }
  });
  
  app.post("/api/leads", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertLeadSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const user = req.user as any;
      const clinicId = result.data.clinicId;
      
      // Verifica se o usuário tem acesso à clínica
      const clinicUser = await storage.getClinicUser(clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
      }
      
      const [lead] = await db.insert(leads).values({
        ...result.data,
        createdBy: user.id,
      }).returning();
      
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Erro ao criar lead:", error);
      res.status(500).json({ message: error.message || "Erro ao criar lead" });
    }
  });
  
  app.get("/api/leads/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(lead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      res.json(lead);
    } catch (error: any) {
      console.error("Erro ao buscar lead:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar lead" });
    }
  });
  
  app.patch("/api/leads/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.id);
      const [existingLead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!existingLead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(existingLead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      // Atualiza apenas os campos enviados
      const [updatedLead] = await db.update(leads)
        .set({
          ...req.body,
          ultimaAtualizacao: new Date()
        })
        .where(eq(leads.id, leadId))
        .returning();
      
      res.json(updatedLead);
    } catch (error: any) {
      console.error("Erro ao atualizar lead:", error);
      res.status(500).json({ message: error.message || "Erro ao atualizar lead" });
    }
  });
  
  // Lead Interactions routes
  app.get("/api/leads/:leadId/interactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(lead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      const interactions = await db.select().from(leadInteractions).where(eq(leadInteractions.leadId, leadId));
      res.json(interactions);
    } catch (error: any) {
      console.error("Erro ao buscar interações:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar interações" });
    }
  });
  
  app.post("/api/lead-interactions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertLeadInteractionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const leadId = result.data.leadId;
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(lead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      const [interaction] = await db.insert(leadInteractions).values({
        ...result.data,
        createdBy: user.id,
      }).returning();
      
      // Atualiza a data da última atualização do lead
      await db.update(leads)
        .set({ ultimaAtualizacao: new Date() })
        .where(eq(leads.id, leadId));
      
      res.status(201).json(interaction);
    } catch (error: any) {
      console.error("Erro ao criar interação:", error);
      res.status(500).json({ message: error.message || "Erro ao criar interação" });
    }
  });
  
  // Lead Appointments routes
  app.get("/api/leads/:leadId/appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(lead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      const appointments = await db.select().from(leadAppointments).where(eq(leadAppointments.leadId, leadId));
      res.json(appointments);
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar agendamentos" });
    }
  });
  
  app.post("/api/lead-appointments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const result = insertLeadAppointmentSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Dados inválidos.", errors: result.error.errors });
      }
      
      const leadId = result.data.leadId;
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      
      if (!lead) {
        return res.status(404).json({ message: "Lead não encontrado" });
      }
      
      // Verifica se o usuário tem acesso à clínica do lead
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(lead.clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a este lead" });
      }
      
      const [appointment] = await db.insert(leadAppointments).values({
        ...result.data,
        createdBy: user.id,
      }).returning();
      
      // Atualizar o status do lead para "Agendado" e a data da última atualização
      await db.update(leads)
        .set({ 
          status: "Agendado",
          ultimaAtualizacao: new Date() 
        })
        .where(eq(leads.id, leadId));
      
      res.status(201).json(appointment);
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      res.status(500).json({ message: error.message || "Erro ao criar agendamento" });
    }
  });
  
  // Dashboard CRM stats
  app.get("/api/clinics/:clinicId/crm/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verifica se o usuário tem acesso à clínica
      const user = req.user as any;
      const clinicUser = await storage.getClinicUser(clinicId, user.id);
      
      if (!clinicUser) {
        return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
      }
      
      const allLeads = await db.select().from(leads).where(eq(leads.clinicId, clinicId));
      
      // Estatísticas básicas
      const stats = {
        totalLeads: allLeads.length,
        byStatus: {
          novo: allLeads.filter(lead => lead.status === "Novo").length,
          emContato: allLeads.filter(lead => lead.status === "Em contato").length,
          agendado: allLeads.filter(lead => lead.status === "Agendado").length,
          convertido: allLeads.filter(lead => lead.status === "Convertido").length,
          perdido: allLeads.filter(lead => lead.status === "Perdido").length
        },
        bySource: {
          instagram: allLeads.filter(lead => lead.fonte === "Instagram").length,
          facebook: allLeads.filter(lead => lead.fonte === "Facebook").length,
          site: allLeads.filter(lead => lead.fonte === "Site").length,
          indicacao: allLeads.filter(lead => lead.fonte === "Indicação").length,
          google: allLeads.filter(lead => lead.fonte === "Google").length,
          whatsapp: allLeads.filter(lead => lead.fonte === "WhatsApp").length,
          outro: allLeads.filter(lead => lead.fonte === "Outro").length
        },
        conversionRate: allLeads.length > 0 
          ? (allLeads.filter(lead => lead.status === "Convertido").length / allLeads.length * 100).toFixed(1) 
          : 0
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Erro ao buscar estatísticas do CRM:", error);
      res.status(500).json({ message: error.message || "Erro ao buscar estatísticas" });
    }
  });
}