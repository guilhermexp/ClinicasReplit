import { relations } from "drizzle-orm/relations";
import { clinics, clients, users, clinicUsers, appointments, professionals, services, invitations, permissions } from "./schema";

export const clientsRelations = relations(clients, ({one, many}) => ({
	clinic: one(clinics, {
		fields: [clients.clinicId],
		references: [clinics.id]
	}),
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	appointments: many(appointments),
}));

export const clinicsRelations = relations(clinics, ({many}) => ({
	clients: many(clients),
	clinicUsers: many(clinicUsers),
	appointments: many(appointments),
	professionals: many(professionals),
	services: many(services),
	invitations: many(invitations),
}));

export const usersRelations = relations(users, ({many}) => ({
	clients: many(clients),
	clinicUsers: many(clinicUsers),
	appointments: many(appointments),
	professionals: many(professionals),
	invitations: many(invitations),
}));

export const clinicUsersRelations = relations(clinicUsers, ({one, many}) => ({
	clinic: one(clinics, {
		fields: [clinicUsers.clinicId],
		references: [clinics.id]
	}),
	user: one(users, {
		fields: [clinicUsers.userId],
		references: [users.id]
	}),
	permissions: many(permissions),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	clinic: one(clinics, {
		fields: [appointments.clinicId],
		references: [clinics.id]
	}),
	client: one(clients, {
		fields: [appointments.clientId],
		references: [clients.id]
	}),
	professional: one(professionals, {
		fields: [appointments.professionalId],
		references: [professionals.id]
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
	user: one(users, {
		fields: [appointments.createdBy],
		references: [users.id]
	}),
}));

export const professionalsRelations = relations(professionals, ({one, many}) => ({
	appointments: many(appointments),
	user: one(users, {
		fields: [professionals.userId],
		references: [users.id]
	}),
	clinic: one(clinics, {
		fields: [professionals.clinicId],
		references: [clinics.id]
	}),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	appointments: many(appointments),
	clinic: one(clinics, {
		fields: [services.clinicId],
		references: [clinics.id]
	}),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	clinic: one(clinics, {
		fields: [invitations.clinicId],
		references: [clinics.id]
	}),
	user: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({one}) => ({
	clinicUser: one(clinicUsers, {
		fields: [permissions.clinicUserId],
		references: [clinicUsers.id]
	}),
}));