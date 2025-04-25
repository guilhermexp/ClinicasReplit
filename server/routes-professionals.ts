import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { professionals } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export function registerProfessionalsRoutes(app: Express, isAuthenticated: (req: Request, res: Response, next: Function) => void) {
  // Obter todos os profissionais de uma clínica
  app.get("/api/clinics/:clinicId/professionals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clinicId } = req.params;
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, Number(clinicId))) {
        return res.status(403).json({ message: "Você não tem permissão para acessar os dados desta clínica" });
      }
      
      const professionalsList = await storage.getProfessionalsByClinic(Number(clinicId));
      
      // Buscar os dados de usuário relacionados para cada profissional
      const enhancedProfessionals = await Promise.all(
        professionalsList.map(async (professional) => {
          const user = await storage.getUser(professional.userId);
          return {
            ...professional,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              profilePhoto: user.profilePhoto
            } : undefined
          };
        })
      );
      
      res.status(200).json(enhancedProfessionals);
    } catch (error: any) {
      console.error("Erro ao obter profissionais:", error);
      res.status(500).json({ message: `Erro ao buscar profissionais: ${error.message}` });
    }
  });
  
  // Obter um profissional específico
  app.get("/api/professionals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const professional = await storage.getProfessional(Number(id));
      
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, professional.clinicId)) {
        return res.status(403).json({ message: "Você não tem permissão para acessar os dados deste profissional" });
      }
      
      // Buscar dados do usuário relacionado
      const user = await storage.getUser(professional.userId);
      
      const enhancedProfessional = {
        ...professional,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto
        } : undefined
      };
      
      res.status(200).json(enhancedProfessional);
    } catch (error: any) {
      console.error("Erro ao obter profissional:", error);
      res.status(500).json({ message: `Erro ao buscar profissional: ${error.message}` });
    }
  });
  
  // Criar um novo profissional
  app.post("/api/professionals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId, clinicId, specialization, bio, education, workDays, workHoursStart, workHoursEnd, colors, commission, isActive } = req.body;
      
      // Verificar dados obrigatórios
      if (!userId || !clinicId || !specialization) {
        return res.status(400).json({ message: "Dados obrigatórios não fornecidos" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, clinicId)) {
        return res.status(403).json({ message: "Você não tem permissão para adicionar profissionais a esta clínica" });
      }
      
      // Verificar se o usuário existe
      const userExists = await storage.getUser(userId);
      if (!userExists) {
        return res.status(400).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o usuário já é um profissional nesta clínica
      const existingProfessional = await storage.getProfessionalByUserAndClinic(userId, clinicId);
      if (existingProfessional) {
        return res.status(400).json({ message: "Este usuário já está registrado como profissional nesta clínica" });
      }
      
      // Criar profissional
      const newProfessional = await storage.createProfessional({
        userId,
        clinicId,
        specialization,
        bio: bio || null,
        education: education || null,
        workDays: workDays || [1, 2, 3, 4, 5], // Padrão: Segunda a Sexta
        workHoursStart: workHoursStart || "09:00",
        workHoursEnd: workHoursEnd || "18:00",
        colors: colors || "#3498db",
        commission: commission || 0,
        isActive: isActive !== undefined ? isActive : true,
        photo: null, // Foto será gerenciada em outro endpoint
        rating: null,
        reviewCount: 0
      });
      
      // Buscar dados do usuário relacionado
      const user = await storage.getUser(newProfessional.userId);
      
      const enhancedProfessional = {
        ...newProfessional,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto
        } : undefined
      };
      
      res.status(201).json(enhancedProfessional);
    } catch (error: any) {
      console.error("Erro ao criar profissional:", error);
      res.status(500).json({ message: `Erro ao criar profissional: ${error.message}` });
    }
  });
  
  // Atualizar um profissional
  app.patch("/api/professionals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { specialization, bio, education, workDays, workHoursStart, workHoursEnd, colors, commission, isActive } = req.body;
      
      // Buscar profissional existente
      const professional = await storage.getProfessional(Number(id));
      
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, professional.clinicId)) {
        return res.status(403).json({ message: "Você não tem permissão para editar este profissional" });
      }
      
      // Atualizar profissional
      const updatedProfessional = await storage.updateProfessional(Number(id), {
        specialization: specialization !== undefined ? specialization : professional.specialization,
        bio: bio !== undefined ? bio : professional.bio,
        education: education !== undefined ? education : professional.education,
        workDays: workDays !== undefined ? workDays : professional.workDays,
        workHoursStart: workHoursStart !== undefined ? workHoursStart : professional.workHoursStart,
        workHoursEnd: workHoursEnd !== undefined ? workHoursEnd : professional.workHoursEnd,
        colors: colors !== undefined ? colors : professional.colors,
        commission: commission !== undefined ? commission : professional.commission,
        isActive: isActive !== undefined ? isActive : professional.isActive
      });
      
      // Buscar dados do usuário relacionado
      const user = await storage.getUser(updatedProfessional.userId);
      
      const enhancedProfessional = {
        ...updatedProfessional,
        user: user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePhoto: user.profilePhoto
        } : undefined
      };
      
      res.status(200).json(enhancedProfessional);
    } catch (error: any) {
      console.error("Erro ao atualizar profissional:", error);
      res.status(500).json({ message: `Erro ao atualizar profissional: ${error.message}` });
    }
  });
  
  // Excluir um profissional
  app.delete("/api/professionals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Buscar profissional existente
      const professional = await storage.getProfessional(Number(id));
      
      if (!professional) {
        return res.status(404).json({ message: "Profissional não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, professional.clinicId)) {
        return res.status(403).json({ message: "Você não tem permissão para excluir este profissional" });
      }
      
      // Excluir profissional
      await storage.deleteProfessional(Number(id));
      
      res.status(200).json({ message: "Profissional excluído com sucesso" });
    } catch (error: any) {
      console.error("Erro ao excluir profissional:", error);
      res.status(500).json({ message: `Erro ao excluir profissional: ${error.message}` });
    }
  });
  
  // Obter usuários disponíveis para serem adicionados como profissionais
  app.get("/api/users/available", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clinicId } = req.query;
      
      if (!clinicId) {
        return res.status(400).json({ message: "ID da clínica é obrigatório" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      if (!await hasClinicAccess(req.user?.id, Number(clinicId))) {
        return res.status(403).json({ message: "Você não tem permissão para acessar os dados desta clínica" });
      }
      
      // Buscar todos os usuários da clínica
      const clinicUsers = await storage.getUsersByClinic(Number(clinicId));
      
      // Buscar todos os profissionais já registrados na clínica
      const clinicProfessionals = await storage.getProfessionalsByClinic(Number(clinicId));
      
      // Filtrar usuários que ainda não são profissionais
      const availableUsers = clinicUsers.filter(user => 
        !clinicProfessionals.some(professional => professional.userId === user.id)
      );
      
      // Retornar apenas os dados necessários
      const filteredUsers = availableUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto
      }));
      
      res.status(200).json(filteredUsers);
    } catch (error: any) {
      console.error("Erro ao buscar usuários disponíveis:", error);
      res.status(500).json({ message: `Erro ao buscar usuários disponíveis: ${error.message}` });
    }
  });
  
  // Função auxiliar para verificar se o usuário tem acesso à clínica
  async function hasClinicAccess(userId: number | undefined, clinicId: number): Promise<boolean> {
    if (!userId) return false;
    
    try {
      // Verificar se o usuário é superadmin
      const user = await storage.getUser(userId);
      if (user?.role === "SUPER_ADMIN") return true;
      
      // Verificar se o usuário está associado à clínica
      const clinicUser = await storage.getClinicUserByUserAndClinic(userId, clinicId);
      return !!clinicUser;
    } catch (error) {
      console.error("Erro ao verificar acesso à clínica:", error);
      return false;
    }
  }
}