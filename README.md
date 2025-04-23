# Gardenia - Sistema de Gestão para Clínicas de Estética

## Visão Geral

Gardenia é um sistema completo de gestão para clínicas de estética, oferecendo funcionalidades para gerenciamento de clientes, agendamentos, finanças, usuários e muito mais.

## Tecnologias Utilizadas

- **Frontend**: React, TailwindCSS, Shadcn/UI, React Query
- **Backend**: Node.js, Express
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Autenticação**: Passport.js
- **Pagamentos**: Stripe

## Estrutura do Projeto

O projeto segue uma estrutura monorepo simplificada:

- `/client`: Aplicação frontend React
- `/server`: API backend Express
- `/shared`: Tipos e utilitários compartilhados
- `/migrations`: Migrações de banco de dados

## Funcionalidades Principais

- **Dashboard**: Visão geral das métricas da clínica
- **Clientes**: Cadastro e gerenciamento de clientes
- **Agendamentos**: Calendário e agendamento de consultas
- **Financeiro**: Controle de pagamentos e relatórios
- **CRM**: Gestão de relacionamento com clientes
- **Usuários**: Gerenciamento de usuários e permissões
- **Configurações**: Personalização do sistema

## Requisitos

- Node.js 20+
- PostgreSQL 16+

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente (crie um arquivo `.env` baseado no `.env.example`)
4. Inicialize o banco de dados:
   ```bash
   npm run db:push
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm run start`: Inicia o servidor em modo produção
- `npm run check`: Verifica tipos TypeScript
- `npm run db:push`: Atualiza o esquema do banco de dados

## Navegação no Código

- **Componentes UI**: `/client/src/components/ui`
- **Páginas**: `/client/src/pages`
- **Rotas da API**: `/server/routes.ts`
- **Esquema do Banco**: `/shared/schema.ts`
- **Autenticação**: `/server/auth.ts`

## Desenvolvimento

Para contribuir com o projeto, siga estas diretrizes:

1. Use componentes funcionais React com TypeScript
2. Siga os padrões de estilo do TailwindCSS
3. Utilize os hooks do React Query para gerenciamento de estado
4. Mantenha a estrutura de pastas organizada
5. Documente novas funcionalidades

## Licença

MIT
