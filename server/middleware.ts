import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { permissions } from "@shared/schema";
import { and, eq } from "drizzle-orm";

// Middleware para verificar se o usuário tem permissão para um módulo e ação específicos
export async function hasPermission(
  req: Request,
  res: Response,
  next: NextFunction,
  clinicId: number,
  module: string,
  action: string
) {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
    }

    // Verifica se o usuário tem acesso à clínica
    const clinicUser = await storage.getClinicUser(clinicId, user.id);
    if (!clinicUser) {
      return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
    }

    // Se o usuário é OWNER ou MANAGER da clínica, sempre tem acesso
    if (clinicUser.role === "OWNER" || clinicUser.role === "MANAGER") {
      return next();
    }

    // Verifica se o usuário tem a permissão específica
    const [permissionExists] = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.clinicUserId, clinicUser.id),
          eq(permissions.module, module),
          eq(permissions.action, action)
        )
      );

    if (!permissionExists) {
      return res.status(403).json({ message: "Você não tem acesso a esta funcionalidade" });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    res.status(500).json({ message: "Erro ao verificar permissões" });
  }
}

// Função de fábrica para criar middleware com parâmetros específicos
export function requirePermission(module: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const clinicId = parseInt(req.params.clinicId);
    if (isNaN(clinicId)) {
      return res.status(400).json({ message: "ID da clínica inválido" });
    }
    
    await hasPermission(req, res, next, clinicId, module, action);
  };
}

// Middleware para verificar se o usuário é um gerente (OWNER ou MANAGER) da clínica
export async function isClinicManager(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as any;
    if (!user) {
      return res.status(401).json({ message: "Não autorizado. Faça login para continuar." });
    }

    const clinicId = parseInt(req.params.clinicId);
    if (isNaN(clinicId)) {
      return res.status(400).json({ message: "ID da clínica inválido" });
    }

    // Verifica se o usuário tem acesso à clínica
    const clinicUser = await storage.getClinicUser(clinicId, user.id);
    if (!clinicUser) {
      return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
    }

    // Verifica se o usuário é OWNER ou MANAGER
    if (clinicUser.role !== "OWNER" && clinicUser.role !== "MANAGER") {
      return res.status(403).json({ message: "Somente gerentes podem acessar esta funcionalidade" });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar gerente da clínica:", error);
    res.status(500).json({ message: "Erro ao verificar permissões" });
  }
}