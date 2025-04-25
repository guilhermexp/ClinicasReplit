import { Request, Response } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { validateRequest } from "./middleware";
import { requirePermission } from "./middleware";
import { insertInventoryCategorySchema, insertInventoryProductSchema, insertInventoryTransactionSchema } from "../shared/schema";

export function registerInventoryRoutes(app: Express, isAuthenticated: (req: Request, res: Response, next: Function) => void) {
  // Inventory Category routes
  app.get("/api/clinics/:clinicId/inventory/categories", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        const categories = await storage.getInventoryCategoriesByClinic(clinicId);
        res.json(categories);
      } catch (error) {
        console.error("Erro ao buscar categorias de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar categorias de inventário" });
      }
    }
  );
  
  app.get("/api/clinics/:clinicId/inventory/categories/:id", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const categoryId = parseInt(req.params.id);
        const category = await storage.getInventoryCategory(categoryId);
        
        if (!category) {
          return res.status(404).json({ message: "Categoria não encontrada" });
        }
        
        res.json(category);
      } catch (error) {
        console.error("Erro ao buscar categoria de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar categoria de inventário" });
      }
    }
  );
  
  app.post("/api/clinics/:clinicId/inventory/categories", 
    isAuthenticated,
    requirePermission("inventory", "create"),
    validateRequest(insertInventoryCategorySchema),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        const userId = req.user!.id;
        
        const newCategory = await storage.createInventoryCategory({
          ...req.body,
          clinicId,
          createdBy: userId
        });
        
        res.status(201).json(newCategory);
      } catch (error) {
        console.error("Erro ao criar categoria de inventário:", error);
        res.status(500).json({ message: "Erro ao criar categoria de inventário" });
      }
    }
  );
  
  app.patch("/api/clinics/:clinicId/inventory/categories/:id", 
    isAuthenticated,
    requirePermission("inventory", "update"),
    async (req: Request, res: Response) => {
      try {
        const categoryId = parseInt(req.params.id);
        const updates = req.body;
        
        const updatedCategory = await storage.updateInventoryCategory(categoryId, updates);
        
        if (!updatedCategory) {
          return res.status(404).json({ message: "Categoria não encontrada" });
        }
        
        res.json(updatedCategory);
      } catch (error) {
        console.error("Erro ao atualizar categoria de inventário:", error);
        res.status(500).json({ message: "Erro ao atualizar categoria de inventário" });
      }
    }
  );
  
  app.delete("/api/clinics/:clinicId/inventory/categories/:id", 
    isAuthenticated,
    requirePermission("inventory", "delete"),
    async (req: Request, res: Response) => {
      try {
        const categoryId = parseInt(req.params.id);
        
        const result = await storage.deleteInventoryCategory(categoryId);
        
        if (!result) {
          return res.status(409).json({ 
            message: "Não é possível excluir esta categoria. Verifique se ela possui produtos ou subcategorias associados."
          });
        }
        
        res.status(204).send();
      } catch (error) {
        console.error("Erro ao excluir categoria de inventário:", error);
        res.status(500).json({ message: "Erro ao excluir categoria de inventário" });
      }
    }
  );
  
  // Inventory Product routes
  app.get("/api/clinics/:clinicId/inventory/products", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        
        let products;
        if (req.query.categoryId) {
          const categoryId = parseInt(req.query.categoryId as string);
          products = await storage.getInventoryProductsByCategory(categoryId);
        } else {
          products = await storage.getInventoryProductsByClinic(clinicId);
        }
        
        res.json(products);
      } catch (error) {
        console.error("Erro ao buscar produtos de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar produtos de inventário" });
      }
    }
  );
  
  app.get("/api/clinics/:clinicId/inventory/products/:id", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.id);
        const product = await storage.getInventoryProduct(productId);
        
        if (!product) {
          return res.status(404).json({ message: "Produto não encontrado" });
        }
        
        res.json(product);
      } catch (error) {
        console.error("Erro ao buscar produto de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar produto de inventário" });
      }
    }
  );
  
  app.post("/api/clinics/:clinicId/inventory/products", 
    isAuthenticated,
    requirePermission("inventory", "create"),
    validateRequest(insertInventoryProductSchema),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        const userId = req.user!.id;
        
        const newProduct = await storage.createInventoryProduct({
          ...req.body,
          clinicId,
          createdBy: userId
        });
        
        res.status(201).json(newProduct);
      } catch (error) {
        console.error("Erro ao criar produto de inventário:", error);
        res.status(500).json({ message: "Erro ao criar produto de inventário" });
      }
    }
  );
  
  app.patch("/api/clinics/:clinicId/inventory/products/:id", 
    isAuthenticated,
    requirePermission("inventory", "update"),
    async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.id);
        const updates = {
          ...req.body,
          createdBy: req.user!.id
        };
        
        const updatedProduct = await storage.updateInventoryProduct(productId, updates);
        
        if (!updatedProduct) {
          return res.status(404).json({ message: "Produto não encontrado" });
        }
        
        res.json(updatedProduct);
      } catch (error) {
        console.error("Erro ao atualizar produto de inventário:", error);
        res.status(500).json({ message: "Erro ao atualizar produto de inventário" });
      }
    }
  );
  
  app.delete("/api/clinics/:clinicId/inventory/products/:id", 
    isAuthenticated,
    requirePermission("inventory", "delete"),
    async (req: Request, res: Response) => {
      try {
        const productId = parseInt(req.params.id);
        
        const result = await storage.deleteInventoryProduct(productId);
        
        if (!result) {
          return res.status(409).json({ 
            message: "Erro ao excluir o produto. Verifique se existem transações associadas."
          });
        }
        
        res.status(204).send();
      } catch (error) {
        console.error("Erro ao excluir produto de inventário:", error);
        res.status(500).json({ message: "Erro ao excluir produto de inventário" });
      }
    }
  );
  
  // Inventory Transaction routes
  app.get("/api/clinics/:clinicId/inventory/transactions", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        
        let transactions;
        if (req.query.productId) {
          const productId = parseInt(req.query.productId as string);
          transactions = await storage.getInventoryTransactionsByProduct(productId);
        } else {
          transactions = await storage.getInventoryTransactionsByClinic(clinicId);
        }
        
        res.json(transactions);
      } catch (error) {
        console.error("Erro ao buscar transações de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar transações de inventário" });
      }
    }
  );
  
  app.get("/api/clinics/:clinicId/inventory/transactions/:id", 
    isAuthenticated,
    requirePermission("inventory", "view"),
    async (req: Request, res: Response) => {
      try {
        const transactionId = parseInt(req.params.id);
        const transaction = await storage.getInventoryTransaction(transactionId);
        
        if (!transaction) {
          return res.status(404).json({ message: "Transação não encontrada" });
        }
        
        res.json(transaction);
      } catch (error) {
        console.error("Erro ao buscar transação de inventário:", error);
        res.status(500).json({ message: "Erro ao buscar transação de inventário" });
      }
    }
  );
  
  app.post("/api/clinics/:clinicId/inventory/transactions", 
    isAuthenticated,
    requirePermission("inventory", "create"),
    validateRequest(insertInventoryTransactionSchema),
    async (req: Request, res: Response) => {
      try {
        const clinicId = parseInt(req.params.clinicId);
        const userId = req.user!.id;
        
        // Obter o produto atual para calcular as quantidades
        const productId = req.body.productId;
        const product = await storage.getInventoryProduct(productId);
        
        if (!product) {
          return res.status(404).json({ message: "Produto não encontrado" });
        }
        
        const quantity = req.body.quantity;
        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity + quantity;
        
        // Criar a transação
        const newTransaction = await storage.createInventoryTransaction({
          ...req.body,
          clinicId,
          createdBy: userId,
          previousQuantity,
          newQuantity,
          date: new Date()
        });
        
        // Atualizar o estoque do produto
        await storage.updateInventoryProduct(productId, {
          quantity: newQuantity,
          createdBy: userId
        });
        
        res.status(201).json(newTransaction);
      } catch (error) {
        console.error("Erro ao criar transação de inventário:", error);
        res.status(500).json({ message: "Erro ao criar transação de inventário" });
      }
    }
  );
  
  app.patch("/api/clinics/:clinicId/inventory/transactions/:id", 
    isAuthenticated,
    requirePermission("inventory", "update"),
    async (req: Request, res: Response) => {
      try {
        const transactionId = parseInt(req.params.id);
        const userId = req.user!.id;
        
        // Obter a transação atual
        const currentTransaction = await storage.getInventoryTransaction(transactionId);
        
        if (!currentTransaction) {
          return res.status(404).json({ message: "Transação não encontrada" });
        }
        
        // Verificar se a quantidade está sendo alterada
        if (req.body.quantity !== undefined && req.body.quantity !== currentTransaction.quantity) {
          // Obter o produto atual
          const productId = currentTransaction.productId;
          const product = await storage.getInventoryProduct(productId);
          
          if (!product) {
            return res.status(404).json({ message: "Produto não encontrado" });
          }
          
          // Reverter o efeito da transação anterior
          const quantityDifference = req.body.quantity - currentTransaction.quantity;
          const newProductQuantity = product.quantity + quantityDifference;
          
          // Atualizar tanto a transação quanto o produto
          const updatedTransaction = await storage.updateInventoryTransaction(transactionId, {
            ...req.body,
            previousQuantity: currentTransaction.previousQuantity,
            newQuantity: currentTransaction.previousQuantity + req.body.quantity,
            createdBy: userId
          });
          
          await storage.updateInventoryProduct(productId, {
            quantity: newProductQuantity,
            createdBy: userId
          });
          
          res.json(updatedTransaction);
        } else {
          // Se a quantidade não está sendo alterada, apenas atualizar a transação
          const updatedTransaction = await storage.updateInventoryTransaction(transactionId, {
            ...req.body,
            createdBy: userId
          });
          
          res.json(updatedTransaction);
        }
      } catch (error) {
        console.error("Erro ao atualizar transação de inventário:", error);
        res.status(500).json({ message: "Erro ao atualizar transação de inventário" });
      }
    }
  );
  
  app.delete("/api/clinics/:clinicId/inventory/transactions/:id", 
    isAuthenticated,
    requirePermission("inventory", "delete"),
    async (req: Request, res: Response) => {
      try {
        const transactionId = parseInt(req.params.id);
        
        const result = await storage.deleteInventoryTransaction(transactionId);
        
        if (!result) {
          return res.status(404).json({ message: "Transação não encontrada ou não pode ser excluída" });
        }
        
        res.status(204).send();
      } catch (error) {
        console.error("Erro ao excluir transação de inventário:", error);
        res.status(500).json({ message: "Erro ao excluir transação de inventário" });
      }
    }
  );
}