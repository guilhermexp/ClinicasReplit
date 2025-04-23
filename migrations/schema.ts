import { pgTable, foreignKey, serial, integer, text, timestamp, uniqueIndex, index, varchar, json, unique, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const clients = pgTable("clients", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	address: text(),
	birthdate: timestamp({ mode: 'string' }),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "clients_clinic_id_clinics_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "clients_created_by_users_id_fk"
		}),
]);

export const clinicUsers = pgTable("clinic_users", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	userId: integer("user_id").notNull(),
	role: text().default('STAFF').notNull(),
	invitedBy: integer("invited_by"),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("clinic_user_unique").using("btree", table.clinicId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "clinic_users_clinic_id_clinics_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "clinic_users_user_id_users_id_fk"
		}),
]);

export const appointments = pgTable("appointments", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	clientId: integer("client_id").notNull(),
	professionalId: integer("professional_id").notNull(),
	serviceId: integer("service_id").notNull(),
	startTime: timestamp("start_time", { mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { mode: 'string' }).notNull(),
	status: text().default('scheduled').notNull(),
	notes: text(),
	createdBy: integer("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "appointments_clinic_id_clinics_id_fk"
		}),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "appointments_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.professionalId],
			foreignColumns: [professionals.id],
			name: "appointments_professional_id_professionals_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_services_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "appointments_created_by_users_id_fk"
		}),
]);

export const session = pgTable("session", {
	sid: varchar().primaryKey().notNull(),
	sess: json().notNull(),
	expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const clinics = pgTable("clinics", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	logo: text(),
	address: text(),
	phone: text(),
	openingHours: text("opening_hours"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const professionals = pgTable("professionals", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	clinicId: integer("clinic_id").notNull(),
	specialization: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "professionals_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "professionals_clinic_id_clinics_id_fk"
		}),
]);

export const services = pgTable("services", {
	id: serial().primaryKey().notNull(),
	clinicId: integer("clinic_id").notNull(),
	name: text().notNull(),
	description: text(),
	duration: integer().notNull(),
	price: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "services_clinic_id_clinics_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: text().default('STAFF').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const invitations = pgTable("invitations", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	clinicId: integer("clinic_id").notNull(),
	role: text().notNull(),
	token: text().notNull(),
	permissions: text(),
	invitedBy: integer("invited_by").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.id],
			name: "invitations_clinic_id_clinics_id_fk"
		}),
	foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "invitations_invited_by_users_id_fk"
		}),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	clinicUserId: integer("clinic_user_id").notNull(),
	module: text().notNull(),
	action: text().notNull(),
}, (table) => [
	uniqueIndex("permission_unique").using("btree", table.clinicUserId.asc().nullsLast().op("text_ops"), table.module.asc().nullsLast().op("int4_ops"), table.action.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.clinicUserId],
			foreignColumns: [clinicUsers.id],
			name: "permissions_clinic_user_id_clinic_users_id_fk"
		}),
]);
