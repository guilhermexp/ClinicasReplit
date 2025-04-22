import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  role: z.enum(["OWNER", "MANAGER", "PROFESSIONAL", "RECEPTIONIST", "FINANCIAL", "MARKETING", "STAFF"], {
    required_error: "Selecione um tipo de usuário",
  }),
  permissions: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId?: number;
}

export function InviteUserDialog({ isOpen, onClose, clinicId }: InviteUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "STAFF",
      permissions: "",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues & { clinicId: number }) => {
      const res = await apiRequest("POST", "/api/invitations", data);
      return res.json();
    },
    onSuccess: (data) => {
      setInviteLink(data.invitationLink);
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "invitations"] });
      toast({
        title: "Convite enviado com sucesso",
        description: "O usuário receberá um email com instruções para se juntar à clínica.",
      });
      // Não feche o diálogo, pois queremos mostrar o link de convite
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    if (!clinicId) {
      toast({
        title: "Erro ao enviar convite",
        description: "Selecione uma clínica primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await inviteMutation.mutateAsync({
      ...values,
      clinicId,
    });
  };

  const handleClose = () => {
    // Reset form and state when closing
    form.reset();
    setInviteLink(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
          <DialogDescription>
            {!inviteLink
              ? "Envie um convite para que um novo usuário se junte à clínica."
              : "Convite criado com sucesso! Copie o link abaixo e envie para o usuário."}
          </DialogDescription>
        </DialogHeader>

        {!inviteLink ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Usuário</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MANAGER">Gerente</SelectItem>
                        <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                        <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                        <SelectItem value="FINANCIAL">Financeiro</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="STAFF">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O tipo de usuário determina as permissões padrão dentro da clínica.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Convite"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium break-all">
                {window.location.origin}/onboarding?token={inviteLink}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                Esse link dá acesso à sua clínica. Compartilhe apenas com pessoas confiáveis.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/onboarding?token=${inviteLink}`);
                  toast({
                    title: "Link copiado",
                    description: "O link de convite foi copiado para a área de transferência.",
                  });
                }}
              >
                Copiar Link
              </Button>
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}