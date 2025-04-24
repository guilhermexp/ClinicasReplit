import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    // Extending User interface
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Para testes, permitir que senhas armazenadas sem hash funcionem diretamente
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // Para senhas hasheadas, verificar com o algoritmo de hash
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "sessionsecret",
    resave: true,
    saveUninitialized: true,
    rolling: true, // Renova o cookie a cada requisição
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          // Verificar se é o usuário de teste
          if (email === "guilherme-varela@hotmail.com" && password === "adoado01") {
            const testUser = {
              id: 999,
              name: "Guilherme Varela",
              email: "guilherme-varela@hotmail.com",
              password: "adoado01",
              role: "SUPER_ADMIN",
              isActive: true,
              lastLogin: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: null,
              preferences: {},
              phone: null,
              profilePhoto: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null
            } as UserType;
            return done(null, testUser);
          }
          
          // Verificar se é o usuário admin
          if (email === "admin@gardenia.com" && password === "admin123") {
            const adminUser = {
              id: 1,
              name: "Admin",
              email: "admin@gardenia.com",
              password: "admin123",
              role: "SUPER_ADMIN",
              isActive: true,
              lastLogin: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: null,
              preferences: {},
              phone: null,
              profilePhoto: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null
            } as UserType;
            return done(null, adminUser);
          }
          
          // Tentar buscar no banco de dados
          try {
            const user = await storage.getUserByEmail(email);
            if (!user || !(await comparePasswords(password, user.password))) {
              return done(null, false);
            } else {
              // Atualizar o lastLogin do usuário
              await storage.updateUser(user.id, { lastLogin: new Date() });
              return done(null, user);
            }
          } catch (dbError) {
            console.error("Erro ao buscar usuário por email:", dbError);
            // Se não conseguir acessar o banco, mas for um dos usuários hardcoded, já retornou acima
            return done(null, false);
          }
        } catch (error) {
          return done(error);
        }
      }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      // Verificar se é o usuário de teste
      if (id === 999) {
        const testUser = {
          id: 999,
          name: "Guilherme Varela",
          email: "guilherme-varela@hotmail.com",
          password: "adoado01",
          role: "SUPER_ADMIN",
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          preferences: {},
          phone: null,
          profilePhoto: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        } as UserType;
        return done(null, testUser);
      }
      
      // Verificar se é o usuário admin
      if (id === 1) {
        const adminUser = {
          id: 1,
          name: "Admin",
          email: "admin@gardenia.com",
          password: "admin123",
          role: "SUPER_ADMIN",
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          preferences: {},
          phone: null,
          profilePhoto: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        } as UserType;
        return done(null, adminUser);
      }
      
      // Tentar buscar no banco de dados
      try {
        const user = await storage.getUser(id);
        done(null, user);
      } catch (dbError) {
        console.error("Erro ao buscar usuário por ID:", dbError);
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });
}
