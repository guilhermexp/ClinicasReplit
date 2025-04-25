import { Request, Response, Router } from "express";
import { isAuthenticated, hasClinicAccess } from "./middleware";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, TaskStatus } from "@shared/schema";

// Validação para criar uma tarefa
const createTaskSchema = insertTaskSchema.extend({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100, "O título deve ter no máximo 100 caracteres"),
  description: z.string().optional(),
  // Outros campos podem ter validações adicionais conforme necessário
});

// Validação para atualizar uma tarefa
const updateTaskSchema = createTaskSchema.partial();

// Definir as rotas para tarefas
export function registerTaskRoutes(router: Router) {
  // Obter todas as tarefas de uma clínica
  router.get("/tasks/clinic/:clinicId", isAuthenticated, hasClinicAccess, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "ID da clínica inválido" });
      }

      const tasks = await storage.getTasksByClinic(clinicId);
      res.json(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      res.status(500).json({ error: "Erro ao buscar tarefas" });
    }
  });

  // Obter tarefas por status
  router.get("/tasks/clinic/:clinicId/status/:status", isAuthenticated, hasClinicAccess, async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const status = req.params.status as TaskStatus;
      
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "ID da clínica inválido" });
      }

      // Validar o status
      if (!Object.values(TaskStatus).includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }

      const tasks = await storage.getTasksByStatus(clinicId, status);
      res.json(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas por status:", error);
      res.status(500).json({ error: "Erro ao buscar tarefas por status" });
    }
  });

  // Obter tarefas atribuídas a um usuário específico
  router.get("/tasks/assignee/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "ID do usuário inválido" });
      }

      // Se não for o próprio usuário ou um administrador, negar acesso
      if (req.user.id !== userId && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const tasks = await storage.getTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas do usuário:", error);
      res.status(500).json({ error: "Erro ao buscar tarefas do usuário" });
    }
  });

  // Obter uma tarefa específica
  router.get("/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "ID de tarefa inválido" });
      }

      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
      }

      // Verificar se o usuário tem acesso à clínica dessa tarefa
      const hasAccess = await hasClinicAccessHelper(req.user.id, task.clinicId);
      if (!hasAccess && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(task);
    } catch (error) {
      console.error("Erro ao buscar tarefa:", error);
      res.status(500).json({ error: "Erro ao buscar tarefa" });
    }
  });

  // Criar uma nova tarefa
  router.post("/tasks", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validar dados de entrada
      const validationResult = createTaskSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dados de tarefa inválidos", 
          details: validationResult.error.format()
        });
      }

      const taskData = validationResult.data;

      // Verificar se o usuário tem acesso à clínica para a qual está criando a tarefa
      const hasAccess = await hasClinicAccessHelper(req.user.id, taskData.clinicId);
      if (!hasAccess && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Acesso negado a esta clínica" });
      }

      // Adicionar o usuário atual como criador da tarefa
      taskData.createdBy = req.user.id;

      const newTask = await storage.createTask(taskData);
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      res.status(500).json({ error: "Erro ao criar tarefa" });
    }
  });

  // Atualizar uma tarefa existente
  router.put("/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "ID de tarefa inválido" });
      }

      // Buscar a tarefa para verificar acesso
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
      }

      // Verificar se o usuário tem acesso à clínica dessa tarefa
      const hasAccess = await hasClinicAccessHelper(req.user.id, existingTask.clinicId);
      if (!hasAccess && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Validar dados de entrada
      const validationResult = updateTaskSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dados de atualização inválidos", 
          details: validationResult.error.format() 
        });
      }

      const taskData = validationResult.data;

      // Não permitir alterar a clínica ou o criador da tarefa
      delete taskData.clinicId;
      delete taskData.createdBy;

      const updatedTask = await storage.updateTask(taskId, taskData);
      res.json(updatedTask);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      res.status(500).json({ error: "Erro ao atualizar tarefa" });
    }
  });

  // Excluir uma tarefa
  router.delete("/tasks/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "ID de tarefa inválido" });
      }

      // Buscar a tarefa para verificar acesso
      const existingTask = await storage.getTask(taskId);
      
      if (!existingTask) {
        return res.status(404).json({ error: "Tarefa não encontrada" });
      }

      // Verificar se o usuário tem acesso à clínica dessa tarefa
      const hasAccess = await hasClinicAccessHelper(req.user.id, existingTask.clinicId);
      if (!hasAccess && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const success = await storage.deleteTask(taskId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ error: "Erro ao excluir tarefa" });
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      res.status(500).json({ error: "Erro ao excluir tarefa" });
    }
  });
}

// Função auxiliar para verificar acesso à clínica
async function hasClinicAccessHelper(userId: number, clinicId: number): Promise<boolean> {
  try {
    const clinicUser = await storage.getClinicUser(clinicId, userId);
    return !!clinicUser;
  } catch (error) {
    console.error("Erro ao verificar acesso à clínica:", error);
    return false;
  }
}