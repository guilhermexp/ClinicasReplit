import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface Permission {
  id: number;
  clinicUserId: number;
  module: string;
  action: string;
}

export function usePermissions() {
  const { user, selectedClinic } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [clinicUserId, setClinicUserId] = useState<number | null>(null);
  
  // Query to get clinic users for the selected clinic
  const { data: clinicUsers } = useQuery({
    queryKey: ["/api/clinics", selectedClinic?.id, "users"],
    enabled: !!selectedClinic && !!user,
  });
  
  // Find the clinic user ID for the current user and selected clinic
  useEffect(() => {
    if (clinicUsers && user && selectedClinic) {
      const clinicUser = clinicUsers.find((cu: any) => cu.userId === user.id && cu.clinicId === selectedClinic.id);
      setClinicUserId(clinicUser?.id || null);
    }
  }, [clinicUsers, user, selectedClinic]);
  
  // Query to get permissions for the clinic user
  const { data: permissionsData } = useQuery({
    queryKey: ["/api/clinic-users", clinicUserId, "permissions"],
    enabled: !!clinicUserId,
  });
  
  // Update permissions when the data changes
  useEffect(() => {
    if (permissionsData) {
      setPermissions(permissionsData);
    }
  }, [permissionsData]);
  
  // Check if the user has a specific permission
  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !permissions.length) return false;
    
    // Super admin has all permissions
    if (user.role === "SUPER_ADMIN") return true;
    
    return permissions.some(
      (p) => p.module === module && p.action === action
    );
  };
  
  return {
    permissions,
    hasPermission,
    clinicUserId,
  };
}
