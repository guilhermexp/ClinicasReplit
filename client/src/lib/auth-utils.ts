import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Nomes formatados para os tipos de usuário
export const roleDisplayNames = {
  SUPER_ADMIN: "Super Admin",
  CLINIC_OWNER: "Proprietário da Clínica",
  OWNER: "Proprietário",
  CLINIC_MANAGER: "Gerente da Clínica",
  MANAGER: "Gerente",
  DOCTOR: "Médico",
  PROFESSIONAL: "Profissional",
  RECEPTIONIST: "Recepcionista",
  FINANCIAL: "Financeiro",
  MARKETING: "Marketing",
  STAFF: "Funcionário",
  DEFAULT: "Usuário"
};

// Cores para os tipos de usuário (classes Tailwind)
export const roleColors = {
  SUPER_ADMIN: "bg-violet-100 text-violet-800",
  CLINIC_OWNER: "bg-blue-100 text-blue-800",
  OWNER: "bg-blue-100 text-blue-800",
  CLINIC_MANAGER: "bg-green-100 text-green-800",
  MANAGER: "bg-green-100 text-green-800",
  DOCTOR: "bg-emerald-100 text-emerald-800",
  PROFESSIONAL: "bg-emerald-100 text-emerald-800",
  RECEPTIONIST: "bg-sky-100 text-sky-800",
  FINANCIAL: "bg-amber-100 text-amber-800",
  MARKETING: "bg-rose-100 text-rose-800",
  STAFF: "bg-gray-100 text-gray-800",
  DEFAULT: "bg-gray-100 text-gray-800"
};

// Cores para os status (classes Tailwind)
export const statusColors = {
  ACTIVE: "text-green-700 bg-green-50",
  INACTIVE: "text-red-700 bg-red-50",
  PENDING: "text-amber-700 bg-amber-50",
  DEFAULT: "text-gray-700 bg-gray-50"
};

// Formatar data
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date;
    
    if (!isValid(parsedDate)) {
      return "-";
    }
    
    return format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    return "-";
  }
};

// Obter iniciais a partir do nome
export const getInitials = (name: string): string => {
  if (!name) return "?";
  
  return name
    .split(" ")
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Obter uma cor de avatar baseada no nome (para consistência)
export const getAvatarColor = (name: string): string => {
  // Lista de cores disponíveis
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500"
  ];
  
  // Gera um índice baseado no nome para selecionar uma cor consistente
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % colors.length;
  
  return colors[colorIndex];
};