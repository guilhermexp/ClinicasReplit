import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Copy, AlertTriangle } from "lucide-react";
import { roleDisplayNames } from "@/lib/auth-utils";

interface PermissionCopyProps {
  clinicId: number;
  targetUserId: number;
  targetUserRole: string;
  targetClinicUserId: number;
}

export function PermissionCopy({ 
  clinicId, 
  targetUserId, 
  targetUserRole,
  targetClinicUserId
}: PermissionCopyProps) {
  const { toast } = useToast();
  const [sourceUserId, setSourceUserId] = useState<string>("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar todos os usuários da clínica para exibir como opções
  const { data: clinicUsers = [], isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "users"],
    enabled: !!clinicId,
  });

  // Mutation para copiar permissões
  const copyPermissionsMutation = useMutation({
    mutationFn: async ({ sourceClinicUserId, targetClinicUserId }: { sourceClinicUserId: number, targetClinicUserId: number }) => {
      const res = await apiRequest("POST", "/api/permissions/copy", {
        sourceClinicUserId,
        targetClinicUserId
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissões copiadas",
        description: "As permissões foram copiadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-users", targetClinicUserId, "permissions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao copiar permissões",
        description: error.message || "Ocorreu um erro ao copiar as permissões.",
        variant: "destructive",
      });
    },
  });

  // Encontrar o usuário selecionado como origem
  const sourceUser = clinicUsers.find((u: any) => u.userId.toString() === sourceUserId);

  // Função para lidar com a cópia de permissões
  const handleCopyPermissions = async () => {
    if (!sourceUser?.id || !targetClinicUserId) {
      toast({
        title: "Erro ao copiar permissões",
        description: "Selecione um usuário de origem válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await copyPermissionsMutation.mutateAsync({
        sourceClinicUserId: sourceUser.id,
        targetClinicUserId: targetClinicUserId
      });
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error("Erro ao copiar permissões:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Copy className="h-5 w-5 text-primary" />
          Copiar Permissões de Outro Usuário
        </CardTitle>
        <CardDescription>
          Copie as permissões configuradas de um usuário existente para este usuário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Selecione um usuário de origem</p>
            <Select value={sourceUserId} onValueChange={setSourceUserId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {clinicUsers
                  .filter((u: any) => u.userId !== targetUserId) // Remover o próprio usuário da lista
                  .map((user: any) => (
                    <SelectItem key={user.userId} value={user.userId.toString()}>
                      {user.name} ({roleDisplayNames[user.role] || user.role})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {sourceUser && (
            <div className="rounded-md bg-muted p-4">
              <h4 className="text-sm font-medium">Detalhes do usuário de origem</h4>
              <p className="text-sm mt-1">Nome: {sourceUser.name}</p>
              <p className="text-sm">Cargo: {roleDisplayNames[sourceUser.role] || sourceUser.role}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="flex items-center text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          Esta ação substituirá todas as permissões atuais
        </div>
        <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              disabled={!sourceUser || isSubmitting}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Permissões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar cópia de permissões</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a copiar todas as permissões de <strong>{sourceUser?.name}</strong> para este usuário.
                Esta ação substituirá todas as permissões existentes. Tem certeza que deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCopyPermissions} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Copiando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}