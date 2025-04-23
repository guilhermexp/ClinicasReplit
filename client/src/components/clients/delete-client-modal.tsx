import { useState } from "react";
import { Client } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

// UI Components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteClientModalProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteClientModal({
  client,
  open,
  onOpenChange,
  onSuccess,
}: DeleteClientModalProps) {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  // Mutation para deletar cliente
  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/clients/${client.id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      
      // Limpar dados do cache para atualizar a lista
      queryClient.invalidateQueries({
        queryKey: ["/api/clinics", selectedClinic?.id, "clients"]
      });
      
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteClientMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Você está prestes a excluir o cliente <strong>{client.name}</strong>. Esta ação não pode ser desfeita e todos os dados associados a este cliente serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Sim, excluir cliente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
