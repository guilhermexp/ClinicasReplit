import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { permissions } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

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
    // Se o ID do usuário for 999 (usuário de teste Guilherme Varela), use o ID 3 para consulta ao banco
    const userIdForDb = user.id === 999 ? 3 : user.id;
    
    // Log para ajudar a debugar
    console.log(`Verificando permissões para usuário ${user.id} (DB: ${userIdForDb}) na clínica ${clinicId}, módulo ${module}, ação ${action}`);
    
    const clinicUser = await storage.getClinicUser(clinicId, userIdForDb);
    if (!clinicUser) {
      return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
    }

    // Se o usuário é SUPER_ADMIN, OWNER ou MANAGER da clínica, sempre tem acesso
    if (user.role === "SUPER_ADMIN" || clinicUser.role === "OWNER" || clinicUser.role === "MANAGER") {
      console.log(`Acesso concedido com base no papel ${user.role} ou ${clinicUser.role}`);
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

    console.log(`Permissão concedida para ${module}:${action}`);
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

    // Se o usuário é SUPER_ADMIN, sempre tem acesso
    if (user.role === "SUPER_ADMIN") {
      console.log(`Acesso de gerente concedido para SUPER_ADMIN ${user.name} (${user.id})`);
      return next();
    }

    const clinicId = parseInt(req.params.clinicId);
    if (isNaN(clinicId)) {
      return res.status(400).json({ message: "ID da clínica inválido" });
    }

    // Verifica se o usuário tem acesso à clínica
    // Se o ID do usuário for 999 (usuário de teste Guilherme Varela), use o ID 3 para consulta ao banco
    const userIdForDb = user.id === 999 ? 3 : user.id;
    
    console.log(`Verificando acesso de gerente para usuário ${user.id} (DB: ${userIdForDb}) na clínica ${clinicId}`);
    
    const clinicUser = await storage.getClinicUser(clinicId, userIdForDb);
    if (!clinicUser) {
      return res.status(403).json({ message: "Você não tem acesso a esta clínica" });
    }

    // Verifica se o usuário é OWNER ou MANAGER
    if (clinicUser.role !== "OWNER" && clinicUser.role !== "MANAGER") {
      return res.status(403).json({ message: "Somente gerentes podem acessar esta funcionalidade" });
    }

    console.log(`Acesso de gerente concedido para usuário ${user.name} (${user.id}) na clínica ${clinicId}`);
    next();
  } catch (error) {
    console.error("Erro ao verificar gerente da clínica:", error);
    res.status(500).json({ message: "Erro ao verificar permissões" });
  }
}

// Middleware para validação de dados da requisição usando esquemas Zod
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = result.error.format();
        return res.status(400).json({ 
          message: "Dados inválidos na requisição",
          errors
        });
      }
      
      // Corpo da requisição validado, continuar
      next();
    } catch (error) {
      console.error("Erro ao validar requisição:", error);
      res.status(500).json({ message: "Erro ao processar a requisição" });
    }
  };
}