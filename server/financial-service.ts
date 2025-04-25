import { 
  Expense, 
  InsertExpense, 
  ExpenseStatus, 
  Account, 
  InsertAccount, 
  FinancialTransaction, 
  InsertFinancialTransaction,
  Budget,
  InsertBudget,
  FinancialGoal,
  InsertFinancialGoal
} from '@shared/schema';
import { storage } from './storage';
import { db } from './db';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { expenses, accounts, financialTransactions, budgets, financialGoals } from '@shared/schema';

export interface FinancialService {
  // Despesas
  createExpense(data: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense>;
  payExpense(id: number, paymentMethod: string): Promise<Expense>;
  cancelExpense(id: number): Promise<Expense>;
  getExpense(id: number): Promise<Expense | undefined>;
  listExpensesByClinic(clinicId: number): Promise<Expense[]>;
  listExpensesByStatus(clinicId: number, status: ExpenseStatus): Promise<Expense[]>;
  listExpensesByCategory(clinicId: number, category: string): Promise<Expense[]>;
  listExpensesByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<Expense[]>;
  
  // Contas Bancárias e de Crédito
  createAccount(data: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<InsertAccount>): Promise<Account>;
  getAccount(id: number): Promise<Account | undefined>;
  listAccountsByClinic(clinicId: number): Promise<Account[]>;
  updateAccountBalance(id: number, amount: number): Promise<Account>;
  
  // Transações Financeiras
  createTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getTransaction(id: number): Promise<FinancialTransaction | undefined>;
  listTransactionsByClinic(clinicId: number): Promise<FinancialTransaction[]>;
  listTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]>;
  listTransactionsByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<FinancialTransaction[]>;
  
  // Orçamentos
  createBudget(data: InsertBudget): Promise<Budget>;
  updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget>;
  getBudget(id: number): Promise<Budget | undefined>;
  getBudgetByYearMonth(clinicId: number, year: number, month: number): Promise<Budget | undefined>;
  
  // Metas Financeiras
  createFinancialGoal(data: InsertFinancialGoal): Promise<FinancialGoal>;
  updateFinancialGoal(id: number, data: Partial<InsertFinancialGoal>): Promise<FinancialGoal>;
  getFinancialGoal(id: number): Promise<FinancialGoal | undefined>;
  listFinancialGoalsByClinic(clinicId: number): Promise<FinancialGoal[]>;
  
  // Relatórios e Análises
  getCashFlowByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<any>;
  getFinancialSummaryByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<any>;
  getExpenseBreakdownByCategory(clinicId: number, period: string): Promise<any>;
  getRevenueVsExpenseByPeriod(clinicId: number, period: string): Promise<any>;
}

class DatabaseFinancialService implements FinancialService {
  // Implementação para Despesas
  async createExpense(data: InsertExpense): Promise<Expense> {
    try {
      const [expense] = await db
        .insert(expenses)
        .values(data)
        .returning();
      return expense;
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      throw new Error('Falha ao criar despesa');
    }
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense> {
    try {
      const [expense] = await db
        .update(expenses)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, id))
        .returning();
      
      if (!expense) {
        throw new Error('Despesa não encontrada');
      }
      
      return expense;
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw new Error('Falha ao atualizar despesa');
    }
  }

  async payExpense(id: number, paymentMethod: string): Promise<Expense> {
    try {
      const expense = await this.getExpense(id);
      
      if (!expense) {
        throw new Error('Despesa não encontrada');
      }
      
      const [updatedExpense] = await db
        .update(expenses)
        .set({
          status: ExpenseStatus.PAID,
          paymentDate: new Date(),
          paymentMethod,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, id))
        .returning();
      
      // Criar transação correspondente se contas estiverem sendo usadas
      if (updatedExpense.paymentMethod) {
        const accounts = await this.listAccountsByClinic(updatedExpense.clinicId);
        
        if (accounts.length > 0) {
          // Use a conta padrão ou a primeira disponível
          const account = accounts.find(a => a.isDefault) || accounts[0];
          
          await this.createTransaction({
            clinicId: updatedExpense.clinicId,
            accountId: account.id,
            amount: -updatedExpense.amount, // Valor negativo para despesa
            description: updatedExpense.description,
            type: 'expense',
            category: updatedExpense.category,
            date: new Date(),
            expenseId: updatedExpense.id,
            createdBy: updatedExpense.createdBy
          });
          
          // Atualizar saldo da conta
          await this.updateAccountBalance(account.id, -updatedExpense.amount);
        }
      }
      
      return updatedExpense;
    } catch (error) {
      console.error('Erro ao pagar despesa:', error);
      throw new Error('Falha ao pagar despesa');
    }
  }

  async cancelExpense(id: number): Promise<Expense> {
    try {
      const [expense] = await db
        .update(expenses)
        .set({
          status: ExpenseStatus.CANCELLED,
          updatedAt: new Date()
        })
        .where(eq(expenses.id, id))
        .returning();
      
      if (!expense) {
        throw new Error('Despesa não encontrada');
      }
      
      return expense;
    } catch (error) {
      console.error('Erro ao cancelar despesa:', error);
      throw new Error('Falha ao cancelar despesa');
    }
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    try {
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, id));
      
      return expense;
    } catch (error) {
      console.error('Erro ao buscar despesa:', error);
      throw new Error('Falha ao buscar despesa');
    }
  }

  async listExpensesByClinic(clinicId: number): Promise<Expense[]> {
    try {
      const results = await db
        .select()
        .from(expenses)
        .where(eq(expenses.clinicId, clinicId))
        .orderBy(desc(expenses.dueDate));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar despesas da clínica:', error);
      throw new Error('Falha ao listar despesas da clínica');
    }
  }

  async listExpensesByStatus(clinicId: number, status: ExpenseStatus): Promise<Expense[]> {
    try {
      const results = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.clinicId, clinicId),
            eq(expenses.status, status)
          )
        )
        .orderBy(desc(expenses.dueDate));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar despesas por status:', error);
      throw new Error('Falha ao listar despesas por status');
    }
  }

  async listExpensesByCategory(clinicId: number, category: string): Promise<Expense[]> {
    try {
      const results = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.clinicId, clinicId),
            eq(expenses.category, category)
          )
        )
        .orderBy(desc(expenses.dueDate));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar despesas por categoria:', error);
      throw new Error('Falha ao listar despesas por categoria');
    }
  }

  async listExpensesByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<Expense[]> {
    try {
      const results = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.clinicId, clinicId),
            gte(expenses.dueDate, startDate),
            lte(expenses.dueDate, endDate)
          )
        )
        .orderBy(desc(expenses.dueDate));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar despesas por período:', error);
      throw new Error('Falha ao listar despesas por período');
    }
  }

  // Implementação para Contas
  async createAccount(data: InsertAccount): Promise<Account> {
    try {
      // Se esta conta for definida como padrão, desativa outras contas padrão
      if (data.isDefault) {
        await db
          .update(accounts)
          .set({ isDefault: false })
          .where(eq(accounts.clinicId, data.clinicId));
      }
      
      const [account] = await db
        .insert(accounts)
        .values(data)
        .returning();
      
      return account;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw new Error('Falha ao criar conta');
    }
  }

  async updateAccount(id: number, data: Partial<InsertAccount>): Promise<Account> {
    try {
      // Se esta conta for definida como padrão, desativa outras contas padrão
      if (data.isDefault) {
        const currentAccount = await this.getAccount(id);
        if (currentAccount) {
          await db
            .update(accounts)
            .set({ isDefault: false })
            .where(
              and(
                eq(accounts.clinicId, currentAccount.clinicId),
                sql`${accounts.id} != ${id}`
              )
            );
        }
      }
      
      const [account] = await db
        .update(accounts)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, id))
        .returning();
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }
      
      return account;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      throw new Error('Falha ao atualizar conta');
    }
  }

  async getAccount(id: number): Promise<Account | undefined> {
    try {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, id));
      
      return account;
    } catch (error) {
      console.error('Erro ao buscar conta:', error);
      throw new Error('Falha ao buscar conta');
    }
  }

  async listAccountsByClinic(clinicId: number): Promise<Account[]> {
    try {
      const results = await db
        .select()
        .from(accounts)
        .where(eq(accounts.clinicId, clinicId))
        .orderBy(desc(accounts.isDefault), asc(accounts.name));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar contas da clínica:', error);
      throw new Error('Falha ao listar contas da clínica');
    }
  }

  async updateAccountBalance(id: number, amount: number): Promise<Account> {
    try {
      const account = await this.getAccount(id);
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }
      
      const newBalance = account.balance + amount;
      
      const [updatedAccount] = await db
        .update(accounts)
        .set({
          balance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, id))
        .returning();
      
      return updatedAccount;
    } catch (error) {
      console.error('Erro ao atualizar saldo da conta:', error);
      throw new Error('Falha ao atualizar saldo da conta');
    }
  }

  // Implementação para Transações Financeiras
  async createTransaction(data: InsertFinancialTransaction): Promise<FinancialTransaction> {
    try {
      const [transaction] = await db
        .insert(financialTransactions)
        .values(data)
        .returning();
      
      return transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação');
    }
  }

  async getTransaction(id: number): Promise<FinancialTransaction | undefined> {
    try {
      const [transaction] = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.id, id));
      
      return transaction;
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      throw new Error('Falha ao buscar transação');
    }
  }

  async listTransactionsByClinic(clinicId: number): Promise<FinancialTransaction[]> {
    try {
      const results = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.clinicId, clinicId))
        .orderBy(desc(financialTransactions.date));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar transações da clínica:', error);
      throw new Error('Falha ao listar transações da clínica');
    }
  }

  async listTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]> {
    try {
      const results = await db
        .select()
        .from(financialTransactions)
        .where(eq(financialTransactions.accountId, accountId))
        .orderBy(desc(financialTransactions.date));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar transações da conta:', error);
      throw new Error('Falha ao listar transações da conta');
    }
  }

  async listTransactionsByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
    try {
      const results = await db
        .select()
        .from(financialTransactions)
        .where(
          and(
            eq(financialTransactions.clinicId, clinicId),
            gte(financialTransactions.date, startDate),
            lte(financialTransactions.date, endDate)
          )
        )
        .orderBy(desc(financialTransactions.date));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar transações por período:', error);
      throw new Error('Falha ao listar transações por período');
    }
  }

  // Implementação para Orçamentos
  async createBudget(data: InsertBudget): Promise<Budget> {
    try {
      // Verificar se já existe um orçamento para este mês e ano
      const existingBudget = await this.getBudgetByYearMonth(data.clinicId, data.year, data.month);
      
      if (existingBudget) {
        throw new Error('Já existe um orçamento para este mês e ano');
      }
      
      const [budget] = await db
        .insert(budgets)
        .values(data)
        .returning();
      
      return budget;
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      throw new Error('Falha ao criar orçamento');
    }
  }

  async updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget> {
    try {
      const [budget] = await db
        .update(budgets)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(budgets.id, id))
        .returning();
      
      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }
      
      return budget;
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      throw new Error('Falha ao atualizar orçamento');
    }
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    try {
      const [budget] = await db
        .select()
        .from(budgets)
        .where(eq(budgets.id, id));
      
      return budget;
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      throw new Error('Falha ao buscar orçamento');
    }
  }

  async getBudgetByYearMonth(clinicId: number, year: number, month: number): Promise<Budget | undefined> {
    try {
      const [budget] = await db
        .select()
        .from(budgets)
        .where(
          and(
            eq(budgets.clinicId, clinicId),
            eq(budgets.year, year),
            eq(budgets.month, month)
          )
        );
      
      return budget;
    } catch (error) {
      console.error('Erro ao buscar orçamento por ano e mês:', error);
      throw new Error('Falha ao buscar orçamento por ano e mês');
    }
  }

  // Implementação para Metas Financeiras
  async createFinancialGoal(data: InsertFinancialGoal): Promise<FinancialGoal> {
    try {
      const [goal] = await db
        .insert(financialGoals)
        .values(data)
        .returning();
      
      return goal;
    } catch (error) {
      console.error('Erro ao criar meta financeira:', error);
      throw new Error('Falha ao criar meta financeira');
    }
  }

  async updateFinancialGoal(id: number, data: Partial<InsertFinancialGoal>): Promise<FinancialGoal> {
    try {
      const [goal] = await db
        .update(financialGoals)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(financialGoals.id, id))
        .returning();
      
      if (!goal) {
        throw new Error('Meta financeira não encontrada');
      }
      
      return goal;
    } catch (error) {
      console.error('Erro ao atualizar meta financeira:', error);
      throw new Error('Falha ao atualizar meta financeira');
    }
  }

  async getFinancialGoal(id: number): Promise<FinancialGoal | undefined> {
    try {
      const [goal] = await db
        .select()
        .from(financialGoals)
        .where(eq(financialGoals.id, id));
      
      return goal;
    } catch (error) {
      console.error('Erro ao buscar meta financeira:', error);
      throw new Error('Falha ao buscar meta financeira');
    }
  }

  async listFinancialGoalsByClinic(clinicId: number): Promise<FinancialGoal[]> {
    try {
      const results = await db
        .select()
        .from(financialGoals)
        .where(eq(financialGoals.clinicId, clinicId))
        .orderBy(asc(financialGoals.endDate));
      
      return results;
    } catch (error) {
      console.error('Erro ao listar metas financeiras da clínica:', error);
      throw new Error('Falha ao listar metas financeiras da clínica');
    }
  }

  // Relatórios e Análises
  async getCashFlowByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<any> {
    try {
      // Obter transações do período
      const transactions = await this.listTransactionsByPeriod(clinicId, startDate, endDate);
      
      // Calcular fluxo de caixa diário
      const dailyCashFlow = new Map<string, number>();
      const labels: string[] = [];
      const incomeData: number[] = [];
      const expenseData: number[] = [];
      const balanceData: number[] = [];
      
      // Inicializa o mapa com todas as datas no intervalo
      let currentDate = new Date(startDate);
      const endDateTime = new Date(endDate).getTime();
      
      while (currentDate.getTime() <= endDateTime) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dailyCashFlow.set(dateStr, 0);
        labels.push(dateStr);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Agrupa transações por data
      const transactionsByDate = new Map<string, FinancialTransaction[]>();
      
      transactions.forEach(transaction => {
        const dateStr = new Date(transaction.date).toISOString().split('T')[0];
        
        if (!transactionsByDate.has(dateStr)) {
          transactionsByDate.set(dateStr, []);
        }
        
        transactionsByDate.get(dateStr)?.push(transaction);
      });
      
      // Calcular receitas e despesas por dia
      labels.forEach(dateStr => {
        const dateTransactions = transactionsByDate.get(dateStr) || [];
        
        let dailyIncome = 0;
        let dailyExpense = 0;
        
        dateTransactions.forEach(transaction => {
          if (transaction.amount > 0) {
            dailyIncome += transaction.amount;
          } else {
            dailyExpense += Math.abs(transaction.amount);
          }
        });
        
        incomeData.push(dailyIncome);
        expenseData.push(dailyExpense);
        balanceData.push(dailyIncome - dailyExpense);
      });
      
      return {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            type: 'line',
            borderColor: 'rgba(46, 204, 113, 1)',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
          },
          {
            label: 'Despesas',
            data: expenseData,
            type: 'line',
            borderColor: 'rgba(231, 76, 60, 1)',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
          },
          {
            label: 'Saldo',
            data: balanceData,
            type: 'bar',
            backgroundColor: (ctx: any) => {
              if (!ctx || !ctx.parsed || typeof ctx.parsed.y !== 'number') return 'rgba(52, 152, 219, 0.7)';
              return ctx.parsed.y >= 0 
                ? 'rgba(46, 204, 113, 0.7)'
                : 'rgba(231, 76, 60, 0.7)';
            },
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar fluxo de caixa:', error);
      throw new Error('Falha ao gerar fluxo de caixa');
    }
  }

  async getFinancialSummaryByPeriod(clinicId: number, startDate: Date, endDate: Date): Promise<any> {
    try {
      // Obter transações do período
      const transactions = await this.listTransactionsByPeriod(clinicId, startDate, endDate);
      
      // Calcular totais
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      transactions.forEach(transaction => {
        if (transaction.amount > 0) {
          totalRevenue += transaction.amount;
        } else {
          totalExpenses += Math.abs(transaction.amount);
        }
      });
      
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // Obter despesas do período
      const expensesList = await this.listExpensesByPeriod(clinicId, startDate, endDate);
      const pendingExpenses = expensesList.filter(e => e.status === ExpenseStatus.PENDING).reduce((sum, e) => sum + e.amount, 0);
      
      // Calcular taxa de crescimento (exemplo simplificado)
      // Em uma implementação real, precisaríamos comparar com o período anterior
      const growthRate = 0; // placeholder
      
      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        pendingExpenses,
        growthRate,
        transactionCount: transactions.length
      };
    } catch (error) {
      console.error('Erro ao gerar resumo financeiro:', error);
      throw new Error('Falha ao gerar resumo financeiro');
    }
  }

  async getExpenseBreakdownByCategory(clinicId: number, period: string): Promise<any> {
    try {
      // Determinar datas com base no período
      const now = new Date();
      let startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else if (period === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      }
      
      // Obter despesas do período
      const expensesList = await this.listExpensesByPeriod(clinicId, startDate, now);
      
      // Agrupar despesas por categoria
      const categoryMap = new Map<string, number>();
      
      expensesList.forEach(expense => {
        if (expense.status !== ExpenseStatus.CANCELLED) {
          const currentAmount = categoryMap.get(expense.category) || 0;
          categoryMap.set(expense.category, currentAmount + expense.amount);
        }
      });
      
      // Converter para formato de gráfico
      const categories: string[] = [];
      const values: number[] = [];
      
      categoryMap.forEach((amount, category) => {
        categories.push(category);
        values.push(amount);
      });
      
      return {
        labels: categories,
        datasets: [
          {
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(231, 76, 60, 0.7)',
              'rgba(46, 204, 113, 0.7)',
              'rgba(52, 152, 219, 0.7)',
              'rgba(155, 89, 182, 0.7)',
              'rgba(241, 196, 15, 0.7)',
              'rgba(230, 126, 34, 0.7)',
              'rgba(149, 165, 166, 0.7)'
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar breakdown de despesas por categoria:', error);
      throw new Error('Falha ao gerar breakdown de despesas por categoria');
    }
  }

  async getRevenueVsExpenseByPeriod(clinicId: number, period: string): Promise<any> {
    try {
      // Determinar datas com base no período
      const now = new Date();
      let startDate = new Date();
      let intervals = 6; // número de intervalos no gráfico
      let format = 'MM/dd'; // formato de data para o gráfico
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
        intervals = 7;
        format = 'EEE';
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
        intervals = 4; // semanas
        format = 'semana W';
      } else if (period === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
        intervals = 12; // meses
        format = 'MMM';
      } else if (period === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
        intervals = 3; // meses
        format = 'MMM';
      }
      
      // Obter transações do período
      const transactions = await this.listTransactionsByPeriod(clinicId, startDate, now);
      
      // Gerar labels para os intervalos
      const labels: string[] = [];
      for (let i = 0; i < intervals; i++) {
        labels.push(`Intervalo ${i + 1}`);
      }
      
      // Inicializar arrays de dados
      const revenueData = new Array(intervals).fill(0);
      const expenseData = new Array(intervals).fill(0);
      
      // Distribuir transações por intervalo
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const timeRange = (now.getTime() - startDate.getTime()) / intervals;
        const intervalIndex = Math.floor((transactionDate.getTime() - startDate.getTime()) / timeRange);
        
        if (intervalIndex >= 0 && intervalIndex < intervals) {
          if (transaction.amount > 0) {
            revenueData[intervalIndex] += transaction.amount;
          } else {
            expenseData[intervalIndex] += Math.abs(transaction.amount);
          }
        }
      });
      
      return {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: revenueData,
            backgroundColor: 'rgba(46, 204, 113, 0.7)',
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar comparativo de receitas vs despesas:', error);
      throw new Error('Falha ao gerar comparativo de receitas vs despesas');
    }
  }
}

// Singleton
export const financialService: FinancialService = new DatabaseFinancialService();