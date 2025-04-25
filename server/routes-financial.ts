import { Request, Response, Express } from "express";
import { z } from "zod";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { 
  expenses, 
  accounts, 
  financialTransactions, 
  budgets, 
  financialGoals,
  payments,
  insertExpenseSchema,
  insertAccountSchema,
  insertFinancialTransactionSchema,
  insertBudgetSchema,
  insertFinancialGoalSchema,
  ExpenseStatus
} from "@shared/schema";
import { financialService } from "./financial-service";
// Importação de middleware
import { hasPermission, requirePermission } from "./middleware";
import { storage } from "./storage";

// Função para registrar as rotas financeiras
// Função para verificar acesso do usuário à clínica
async function hasClinicAccess(userId: number, clinicId: number): Promise<boolean> {
  const clinicUser = await storage.getClinicUser(clinicId, userId);
  return !!clinicUser;
}
export function registerFinancialRoutes(app: Express, isAuthenticated: Function) {
  // Rotas para Despesas
  app.post("/api/financial/expenses", isAuthenticated, requirePermission("financial", "create"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, validatedData.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const expense = await financialService.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error: any) {
      console.error("Erro ao criar despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao criar despesa" });
    }
  });
  
  app.put("/api/financial/expenses/:id", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      // Buscar despesa para verificar acesso à clínica
      const expense = await financialService.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, expense.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedExpense = await financialService.updateExpense(id, updatedData);
      res.json(updatedExpense);
    } catch (error: any) {
      console.error("Erro ao atualizar despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar despesa" });
    }
  });
  
  app.post("/api/financial/expenses/:id/pay", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentMethod } = req.body;
      
      if (!paymentMethod) {
        return res.status(400).json({ message: "Método de pagamento é obrigatório" });
      }
      
      // Buscar despesa para verificar acesso à clínica
      const expense = await financialService.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, expense.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedExpense = await financialService.payExpense(id, paymentMethod);
      res.json(updatedExpense);
    } catch (error: any) {
      console.error("Erro ao pagar despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao pagar despesa" });
    }
  });
  
  app.post("/api/financial/expenses/:id/cancel", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Buscar despesa para verificar acesso à clínica
      const expense = await financialService.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, expense.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedExpense = await financialService.cancelExpense(id);
      res.json(updatedExpense);
    } catch (error: any) {
      console.error("Erro ao cancelar despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao cancelar despesa" });
    }
  });
  
  app.get("/api/financial/expenses/:id", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const expense = await financialService.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Despesa não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, expense.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      res.json(expense);
    } catch (error: any) {
      console.error("Erro ao buscar despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar despesa" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/expenses", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      // Verificar filtros
      const { status, category, startDate, endDate } = req.query;
      
      let expensesList;
      
      if (status) {
        expensesList = await financialService.listExpensesByStatus(clinicId, status as ExpenseStatus);
      } else if (category) {
        expensesList = await financialService.listExpensesByCategory(clinicId, category as string);
      } else if (startDate && endDate) {
        expensesList = await financialService.listExpensesByPeriod(
          clinicId, 
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else {
        expensesList = await financialService.listExpensesByClinic(clinicId);
      }
      
      res.json(expensesList);
    } catch (error: any) {
      console.error("Erro ao listar despesas:", error);
      res.status(400).json({ message: error.message || "Erro ao listar despesas" });
    }
  });
  
  // Rotas para Contas Financeiras
  app.post("/api/financial/accounts", isAuthenticated, requirePermission("financial", "create"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, validatedData.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const account = await financialService.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      res.status(400).json({ message: error.message || "Erro ao criar conta" });
    }
  });
  
  app.put("/api/financial/accounts/:id", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      // Buscar conta para verificar acesso à clínica
      const account = await financialService.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, account.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedAccount = await financialService.updateAccount(id, updatedData);
      res.json(updatedAccount);
    } catch (error: any) {
      console.error("Erro ao atualizar conta:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar conta" });
    }
  });
  
  app.get("/api/financial/accounts/:id", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const account = await financialService.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Conta não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, account.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      res.json(account);
    } catch (error: any) {
      console.error("Erro ao buscar conta:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar conta" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/accounts", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const accounts = await financialService.listAccountsByClinic(clinicId);
      res.json(accounts);
    } catch (error: any) {
      console.error("Erro ao listar contas:", error);
      res.status(400).json({ message: error.message || "Erro ao listar contas" });
    }
  });
  
  // Rotas para Transações Financeiras
  app.post("/api/financial/transactions", isAuthenticated, requirePermission("financial", "create"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinancialTransactionSchema.parse(req.body);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, validatedData.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      // Se for uma transação de receita ou despesa a partir de uma conta, atualizar o saldo da conta
      if (validatedData.accountId) {
        const account = await financialService.getAccount(validatedData.accountId);
        if (!account) {
          return res.status(404).json({ message: "Conta não encontrada" });
        }
        
        // Atualizar o saldo da conta
        await financialService.updateAccountBalance(validatedData.accountId, validatedData.amount);
      }
      
      const transaction = await financialService.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Erro ao criar transação:", error);
      res.status(400).json({ message: error.message || "Erro ao criar transação" });
    }
  });
  
  app.get("/api/financial/transactions/:id", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const transaction = await financialService.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, transaction.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      res.json(transaction);
    } catch (error: any) {
      console.error("Erro ao buscar transação:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar transação" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/transactions", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      // Verificar filtros
      const { accountId, startDate, endDate } = req.query;
      
      let transactions;
      
      if (accountId) {
        transactions = await financialService.listTransactionsByAccount(parseInt(accountId as string));
      } else if (startDate && endDate) {
        transactions = await financialService.listTransactionsByPeriod(
          clinicId, 
          new Date(startDate as string), 
          new Date(endDate as string)
        );
      } else {
        transactions = await financialService.listTransactionsByClinic(clinicId);
      }
      
      res.json(transactions);
    } catch (error: any) {
      console.error("Erro ao listar transações:", error);
      res.status(400).json({ message: error.message || "Erro ao listar transações" });
    }
  });
  
  // Rotas para Orçamentos
  app.post("/api/financial/budgets", isAuthenticated, requirePermission("financial", "create"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, validatedData.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const budget = await financialService.createBudget(validatedData);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error("Erro ao criar orçamento:", error);
      res.status(400).json({ message: error.message || "Erro ao criar orçamento" });
    }
  });
  
  app.put("/api/financial/budgets/:id", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      // Buscar orçamento para verificar acesso à clínica
      const budget = await financialService.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Orçamento não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, budget.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedBudget = await financialService.updateBudget(id, updatedData);
      res.json(updatedBudget);
    } catch (error: any) {
      console.error("Erro ao atualizar orçamento:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar orçamento" });
    }
  });
  
  app.get("/api/financial/budgets/:id", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const budget = await financialService.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Orçamento não encontrado" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, budget.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      res.json(budget);
    } catch (error: any) {
      console.error("Erro ao buscar orçamento:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar orçamento" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/budgets/:year/:month", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const budget = await financialService.getBudgetByYearMonth(clinicId, year, month);
      if (!budget) {
        return res.status(404).json({ message: "Orçamento não encontrado" });
      }
      
      res.json(budget);
    } catch (error: any) {
      console.error("Erro ao buscar orçamento:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar orçamento" });
    }
  });
  
  // Rotas para Metas Financeiras
  app.post("/api/financial/goals", isAuthenticated, requirePermission("financial", "create"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertFinancialGoalSchema.parse(req.body);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, validatedData.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const goal = await financialService.createFinancialGoal(validatedData);
      res.status(201).json(goal);
    } catch (error: any) {
      console.error("Erro ao criar meta financeira:", error);
      res.status(400).json({ message: error.message || "Erro ao criar meta financeira" });
    }
  });
  
  app.put("/api/financial/goals/:id", isAuthenticated, requirePermission("financial", "update"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      // Buscar meta para verificar acesso à clínica
      const goal = await financialService.getFinancialGoal(id);
      if (!goal) {
        return res.status(404).json({ message: "Meta financeira não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, goal.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const updatedGoal = await financialService.updateFinancialGoal(id, updatedData);
      res.json(updatedGoal);
    } catch (error: any) {
      console.error("Erro ao atualizar meta financeira:", error);
      res.status(400).json({ message: error.message || "Erro ao atualizar meta financeira" });
    }
  });
  
  app.get("/api/financial/goals/:id", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const goal = await financialService.getFinancialGoal(id);
      if (!goal) {
        return res.status(404).json({ message: "Meta financeira não encontrada" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, goal.clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      res.json(goal);
    } catch (error: any) {
      console.error("Erro ao buscar meta financeira:", error);
      res.status(400).json({ message: error.message || "Erro ao buscar meta financeira" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/goals", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const goals = await financialService.listFinancialGoalsByClinic(clinicId);
      res.json(goals);
    } catch (error: any) {
      console.error("Erro ao listar metas financeiras:", error);
      res.status(400).json({ message: error.message || "Erro ao listar metas financeiras" });
    }
  });
  
  // Rotas para Relatórios Financeiros
  app.get("/api/clinics/:clinicId/financial/reports/cash-flow", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Data de início e fim são obrigatórias" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const cashFlow = await financialService.getCashFlowByPeriod(
        clinicId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(cashFlow);
    } catch (error: any) {
      console.error("Erro ao gerar relatório de fluxo de caixa:", error);
      res.status(400).json({ message: error.message || "Erro ao gerar relatório de fluxo de caixa" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/reports/summary", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Data de início e fim são obrigatórias" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const summary = await financialService.getFinancialSummaryByPeriod(
        clinicId, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(summary);
    } catch (error: any) {
      console.error("Erro ao gerar resumo financeiro:", error);
      res.status(400).json({ message: error.message || "Erro ao gerar resumo financeiro" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/reports/expenses-by-category", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const { period } = req.query;
      
      if (!period) {
        return res.status(400).json({ message: "Período é obrigatório (week, month, quarter, year)" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const expensesByCategory = await financialService.getExpenseBreakdownByCategory(
        clinicId, 
        period as string
      );
      
      res.json(expensesByCategory);
    } catch (error: any) {
      console.error("Erro ao gerar relatório de despesas por categoria:", error);
      res.status(400).json({ message: error.message || "Erro ao gerar relatório de despesas por categoria" });
    }
  });
  
  app.get("/api/clinics/:clinicId/financial/reports/revenue-vs-expense", isAuthenticated, requirePermission("financial", "read"), async (req: Request, res: Response) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      const { period } = req.query;
      
      if (!period) {
        return res.status(400).json({ message: "Período é obrigatório (week, month, quarter, year)" });
      }
      
      // Verificar se o usuário tem acesso à clínica
      const hasAccess = await hasClinicAccess(req.user!.id, clinicId);
      if (!hasAccess) {
        return res.status(403).json({ message: "Permissão negada para acessar esta clínica" });
      }
      
      const revenueVsExpense = await financialService.getRevenueVsExpenseByPeriod(
        clinicId, 
        period as string
      );
      
      res.json(revenueVsExpense);
    } catch (error: any) {
      console.error("Erro ao gerar relatório de receita vs despesa:", error);
      res.status(400).json({ message: error.message || "Erro ao gerar relatório de receita vs despesa" });
    }
  });
}