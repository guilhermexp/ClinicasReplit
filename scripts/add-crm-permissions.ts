import { db } from "../server/db";
import { storage } from "../server/storage";
import { permissions } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Este script adiciona permissões de CRM para um usuário específico
// É necessário especificar o userId e clinicId para adicionar as permissões

async function main() {
  try {
    // Parâmetros
    const userId = 3; // ID do usuário (guilherme-varela@hotmail.com)
    const clinicId = 2; // ID da clínica (Gardenia Clinic)
    const clinicUserId = 2; // ID da relação clinic_user
    
    // Verifica se o usuário existe e tem associação com a clínica
    const clinicUser = await storage.getClinicUser(clinicId, userId);
    
    if (!clinicUser) {
      console.error(`O usuário ${userId} não está associado à clínica ${clinicId}`);
      process.exit(1);
    }
    
    console.log(`Adicionando permissões de CRM para o usuário ${userId} na clínica ${clinicId}`);
    
    // Permissões do CRM a serem adicionadas
    const crmPermissions = [
      { module: "crm", action: "view" },
      { module: "crm", action: "create" },
      { module: "crm", action: "edit" },
      { module: "crm", action: "delete" },
      { module: "leads", action: "view" },
      { module: "leads", action: "create" },
      { module: "leads", action: "edit" },
      { module: "leads", action: "delete" },
      { module: "interactions", action: "view" },
      { module: "interactions", action: "create" },
      { module: "appointments", action: "view" },
      { module: "appointments", action: "create" }
    ];
    
    // Adiciona cada permissão
    for (const perm of crmPermissions) {
      // Verifica se a permissão já existe
      const [existingPerm] = await db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.clinicUserId, clinicUserId),
            eq(permissions.module, perm.module),
            eq(permissions.action, perm.action)
          )
        );
      
      if (existingPerm) {
        console.log(`Permissão ${perm.module}:${perm.action} já existe.`);
        continue;
      }
      
      // Adiciona a permissão
      await db.insert(permissions).values({
        clinicUserId: clinicUserId,
        module: perm.module,
        action: perm.action
      });
      
      console.log(`Permissão ${perm.module}:${perm.action} adicionada com sucesso.`);
    }
    
    console.log("Todas as permissões foram adicionadas com sucesso!");
    
  } catch (error) {
    console.error("Erro ao adicionar permissões:", error);
    process.exit(1);
  }
}

main();