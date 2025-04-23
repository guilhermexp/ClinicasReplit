import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Clock } from "lucide-react";

// UI Components
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Definir a interface para o registro de ponto
export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  date: string;
  clock_in?: string;
  lunch_start?: string;
  lunch_end?: string;
  clock_out?: string;
  total_hours?: number;
  status: "complete" | "incomplete";
  justification?: {
    reason: string;
    notes: string;
    document_url?: string;
  };
}

// Schema para validação do formulário
const formSchema = z.object({
  clock_in: z.string().optional(),
  lunch_start: z.string().optional(),
  lunch_end: z.string().optional(),
  clock_out: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditAttendanceModalProps {
  record: AttendanceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditAttendanceModal({
  record,
  open,
  onOpenChange,
  onSuccess,
}: EditAttendanceModalProps) {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função para formatar a hora para o formato de entrada
  const formatTimeForInput = (timeString?: string) => {
    if (!timeString) return "";
    try {
      return format(new Date(timeString), "HH:mm");
    } catch (error) {
      return "";
    }
  };

  // Configurar formulário com react-hook-form e zod
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clock_in: formatTimeForInput(record.clock_in),
      lunch_start: formatTimeForInput(record.lunch_start),
      lunch_end: formatTimeForInput(record.lunch_end),
      clock_out: formatTimeForInput(record.clock_out),
    },
  });

  // Mutation para atualizar registro
  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Converter os horários para o formato ISO
      const formatTimeToISO = (timeString?: string) => {
        if (!timeString) return null;
        try {
          const [hours, minutes] = timeString.split(":");
          const date = new Date(record.date);
          date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          return date.toISOString();
        } catch (error) {
          return null;
        }
      };

      const payload = {
        clock_in: formatTimeToISO(data.clock_in),
        lunch_start: formatTimeToISO(data.lunch_start),
        lunch_end: formatTimeToISO(data.lunch_end),
        clock_out: formatTimeToISO(data.clock_out),
      };

      const res = await apiRequest("PUT", `/api/attendance-records/${record.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Registro atualizado",
        description: "O registro de ponto foi atualizado com sucesso.",
      });
      
      // Limpar dados do cache para atualizar a lista
      queryClient.invalidateQueries({
        queryKey: ["/api/attendance-records"]
      });
      
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message || "Ocorreu um erro ao atualizar o registro de ponto.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handler para submissão do formulário
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    updateAttendanceMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Registro de Ponto</DialogTitle>
          <DialogDescription>
            Edite os horários do registro de ponto para {record.employee_name} em {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Entrada */}
            <FormField
              control={form.control}
              name="clock_in"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entrada</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        placeholder="00:00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Saída para almoço */}
            <FormField
              control={form.control}
              name="lunch_start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saída para almoço</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        placeholder="00:00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Retorno do almoço */}
            <FormField
              control={form.control}
              name="lunch_end"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retorno do almoço</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        placeholder="00:00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Saída */}
            <FormField
              control={form.control}
              name="clock_out"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saída</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        placeholder="00:00"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
