import { Request, Response } from "express";
import type { Express } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { inventoryProducts, InventoryStatus } from "../shared/schema";

export function registerInventoryRoutes(app: Express, isAuthenticated: (req: Request, res: Response, next: Function) => void) {
  // Inventory products endpoints
  app.get("/api/clinics/:clinicId/inventory", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clinicId } = req.params;
      
      const products = await db.query.inventoryProducts.findMany({
        where: (inventoryProducts, { eq }) => eq(inventoryProducts.clinicId, parseInt(clinicId))
      });
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching inventory products:", error);
      res.status(500).json({ message: "Error fetching inventory products" });
    }
  });
  
  app.post("/api/inventory", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { name, category, quantity, clinicId, price, lowStockThreshold } = req.body;
      
      // Calculate status based on quantity and low stock threshold
      let status = InventoryStatus.IN_STOCK;
      if (quantity === 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if (lowStockThreshold && quantity <= lowStockThreshold) {
        status = InventoryStatus.LOW_STOCK;
      }
      
      const newProduct = await db.insert(inventoryProducts).values({
        name,
        category,
        quantity,
        clinicId: parseInt(clinicId),
        price: price || 0,
        lowStockThreshold: lowStockThreshold || 5,
        status,
        createdBy: req.user?.id || 0
      }).returning();
      
      res.status(201).json(newProduct[0]);
    } catch (error) {
      console.error("Error creating inventory product:", error);
      res.status(500).json({ message: "Error creating inventory product" });
    }
  });
  
  app.patch("/api/inventory/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, category, quantity, price, lowStockThreshold } = req.body;
      
      // Get current product
      const [currentProduct] = await db.select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.id, parseInt(id)));
      
      if (!currentProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Calculate status based on quantity and low stock threshold
      let status = InventoryStatus.IN_STOCK;
      if (quantity === 0) {
        status = InventoryStatus.OUT_OF_STOCK;
      } else if ((lowStockThreshold || currentProduct.lowStockThreshold) && 
                quantity <= (lowStockThreshold || currentProduct.lowStockThreshold)) {
        status = InventoryStatus.LOW_STOCK;
      }
      
      const updatedProduct = await db.update(inventoryProducts)
        .set({
          name: name || currentProduct.name,
          category: category || currentProduct.category,
          quantity: quantity !== undefined ? quantity : currentProduct.quantity,
          price: price !== undefined ? price : currentProduct.price,
          lowStockThreshold: lowStockThreshold || currentProduct.lowStockThreshold,
          status,
          updatedAt: new Date()
        })
        .where(eq(inventoryProducts.id, parseInt(id)))
        .returning();
      
      res.json(updatedProduct[0]);
    } catch (error) {
      console.error("Error updating inventory product:", error);
      res.status(500).json({ message: "Error updating inventory product" });
    }
  });
  
  app.delete("/api/inventory/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await db.delete(inventoryProducts)
        .where(eq(inventoryProducts.id, parseInt(id)));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory product:", error);
      res.status(500).json({ message: "Error deleting inventory product" });
    }
  });
}