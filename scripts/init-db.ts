import { db } from "../server/db";
import { storage } from "../server/storage";
import { 
  users, clinics, clinicUsers, permissions, 
  clients, professionals, services, appointments, 
  invitations, UserRole, ClinicRole 
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTables() {
  console.log("Criando tabelas...");
  try {
    // Verificar se a tabela de usuários existe
    const hasUsersTable = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!hasUsersTable.rows[0].exists) {
      console.log("Tabelas não existem, criando...");
      
      // Criar tabelas em sequência
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'STAFF',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_login TIMESTAMP,
          created_by INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS clinics (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          logo TEXT,
          address TEXT,
          phone TEXT,
          opening_hours TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS clinic_users (
          id SERIAL PRIMARY KEY,
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          role TEXT NOT NULL DEFAULT 'STAFF',
          invited_by INTEGER,
          invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
          accepted_at TIMESTAMP,
          UNIQUE(clinic_id, user_id)
        );
        
        CREATE TABLE IF NOT EXISTS permissions (
          id SERIAL PRIMARY KEY,
          clinic_user_id INTEGER NOT NULL REFERENCES clinic_users(id),
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          UNIQUE(clinic_user_id, module, action)
        );
        
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          birthdate TIMESTAMP,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS professionals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          specialization TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          price INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          client_id INTEGER NOT NULL REFERENCES clients(id),
          professional_id INTEGER NOT NULL REFERENCES professionals(id),
          service_id INTEGER NOT NULL REFERENCES services(id),
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          status TEXT NOT NULL DEFAULT 'scheduled',
          notes TEXT,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS invitations (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          clinic_id INTEGER NOT NULL REFERENCES clinics(id),
          role TEXT NOT NULL,
          token TEXT NOT NULL,
          permissions TEXT,
          invited_by INTEGER NOT NULL REFERENCES users(id),
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      
      console.log("Tabelas criadas com sucesso!");
      
      // Criar usuário admin inicial
      const hashedPassword = await hashPassword("admin123");
      
      // Inserir usuário admin
      await db.execute(sql`
        INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
        VALUES ('Admin', 'admin@gardenia.com', ${hashedPassword}, 'SUPER_ADMIN', TRUE, NOW(), NOW())
      `);
      
      console.log("Usuário admin criado com sucesso!");
      console.log("Email: admin@gardenia.com");
      console.log("Senha: admin123");
    } else {
      console.log("Tabelas já existem, pulando criação.");
    }
    
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    throw error;
  }
}

async function main() {
  console.log("Iniciando script de inicialização do banco de dados...");
  
  try {
    await createTables();
    console.log("Banco de dados inicializado com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  } finally {
    process.exit(0);
  }
}

main();