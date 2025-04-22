import { useAuth } from "@/hooks/use-auth";

// Map role names to display names in Portuguese
export const roleDisplayNames = {
  // User roles
  SUPER_ADMIN: "Super Admin",
  CLINIC_OWNER: "Proprietário",
  CLINIC_MANAGER: "Gerente",
  DOCTOR: "Profissional",
  RECEPTIONIST: "Recepcionista",
  FINANCIAL: "Financeiro",
  MARKETING: "Marketing",
  STAFF: "Funcionário",
  
  // Clinic roles
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  PROFESSIONAL: "Profissional",
  STAFF: "Funcionário"
};

// Role colors for badges
export const roleColors = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  CLINIC_OWNER: "bg-primary-100 text-primary-800",
  OWNER: "bg-primary-100 text-primary-800",
  CLINIC_MANAGER: "bg-blue-100 text-blue-800",
  MANAGER: "bg-blue-100 text-blue-800",
  DOCTOR: "bg-indigo-100 text-indigo-800",
  PROFESSIONAL: "bg-indigo-100 text-indigo-800",
  RECEPTIONIST: "bg-amber-100 text-amber-800",
  FINANCIAL: "bg-emerald-100 text-emerald-800",
  MARKETING: "bg-pink-100 text-pink-800",
  STAFF: "bg-gray-100 text-gray-800"
};

// Status colors for badges
export const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800"
};

// Format date for display
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  // If today, show time
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return `Hoje, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  // If yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return `Ontem, ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  // Otherwise show date
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// Generate user initials from name
export const getInitials = (name: string): string => {
  if (!name) return "";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

// Generate avatar background color based on name
export const getAvatarColor = (name: string): string => {
  if (!name) return "bg-primary-100";
  
  const colors = [
    "bg-primary-100 text-primary-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-blue-100 text-blue-700",
    "bg-yellow-100 text-yellow-700",
    "bg-green-100 text-green-700",
    "bg-orange-100 text-orange-700",
    "bg-indigo-100 text-indigo-700",
    "bg-red-100 text-red-700",
    "bg-teal-100 text-teal-700"
  ];
  
  // Hash the name to get a consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
