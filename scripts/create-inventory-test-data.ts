import { InventoryStatus, inventoryProducts } from "../shared/schema";
import { db } from "../server/db";

async function main() {
  console.log("Adicionando produtos de teste ao inventário...");

  // Clínica ID deve corresponder a uma clínica válida no sistema
  const clinicId = 2; // Gardenia Clinic
  const createdBy = 1; // ID do usuário que está criando os produtos

  const testProducts = [
    {
      name: "Agulha Botox - SOLM",
      category: "Injetáveis",
      quantity: 64,
      clinicId,
      price: 15.00,
      lowStockThreshold: 10,
      status: InventoryStatus.IN_STOCK,
      createdBy
    },
    {
      name: "Biogelis - Preenchedor",
      category: "Preenchedores",
      quantity: 11,
      clinicId,
      price: 350.00,
      lowStockThreshold: 5,
      status: InventoryStatus.IN_STOCK,
      createdBy
    },
    {
      name: "Intramuscular PHD",
      category: "Injetáveis",
      quantity: 38,
      clinicId,
      price: 28.50,
      lowStockThreshold: 15,
      status: InventoryStatus.IN_STOCK,
      createdBy
    },
    {
      name: "Intramuscular Victalab",
      category: "Injetáveis",
      quantity: 21,
      clinicId,
      price: 27.80,
      lowStockThreshold: 10,
      status: InventoryStatus.IN_STOCK,
      createdBy
    },
    {
      name: "Juvederm - Preenchedor Labial",
      category: "Preenchedores",
      quantity: 4,
      clinicId,
      price: 420.00,
      lowStockThreshold: 5,
      status: InventoryStatus.LOW_STOCK,
      createdBy
    },
    {
      name: "Agulha Cinza - Intra",
      category: "Injetáveis",
      quantity: 3,
      clinicId,
      price: 12.50,
      lowStockThreshold: 5,
      status: InventoryStatus.LOW_STOCK,
      createdBy
    },
    {
      name: "Água Termal",
      category: "Cosméticos",
      quantity: 0,
      clinicId,
      price: 85.00,
      lowStockThreshold: 3,
      status: InventoryStatus.OUT_OF_STOCK,
      createdBy
    },
    {
      name: "Agulha Verde",
      category: "Injetáveis",
      quantity: 0,
      clinicId,
      price: 10.90,
      lowStockThreshold: 8,
      status: InventoryStatus.OUT_OF_STOCK,
      createdBy
    }
  ];

  try {
    // Verificar se já existem produtos para não duplicar
    const existingProducts = await db.query.inventoryProducts.findMany({
      where: (inventoryProducts, { eq }) => eq(inventoryProducts.clinicId, clinicId)
    });

    if (existingProducts.length > 0) {
      console.log(`Já existem ${existingProducts.length} produtos no inventário para a clínica ${clinicId}. Pulando inserção.`);
      return;
    }

    const inserted = await db.insert(inventoryProducts).values(testProducts);
    console.log(`${testProducts.length} produtos de teste adicionados com sucesso!`);
  } catch (error) {
    console.error("Erro ao adicionar produtos de teste:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro ao executar script:", error);
    process.exit(1);
  });