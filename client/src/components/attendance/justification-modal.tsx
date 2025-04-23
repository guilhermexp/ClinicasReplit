import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, FileText, Upload } from "lucide-react";
import { AttendanceRecord } from "./edit-attendance-modal";

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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema para validação do formulário
const formSchema = z.object({
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
  document_url: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface JustificationModalProps {
  record: AttendanceRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function JustificationModal({
  record,
  open,
  onOpenChange,
  onSuccess,
}: JustificationModalProps) {
  const { selectedClinic } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // Configurar formulário com react-hook-form e zod
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      notes: "",
      document_url: "",
    },
  });

  // Mutation para enviar justificativa
  const submitJustificationMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", `/api/attendance-records/${record.id}/justify`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Justificativa enviada",
        description: "A justificativa foi enviada com sucesso.",
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
        title: "Erro ao enviar justificativa",
        description: error.message || "Ocorreu um erro ao enviar a justificativa.",
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
    submitJustificationMutation.mutate({
      ...data,
      document_url: uploadedFile || data.document_url,
    });
  };

  // Simulação de upload de arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulação de upload
    setTimeout(() => {
      setUploadedFile(`https://example.com/documents/${file.name}`);
      setIsUploading(false);
      toast({
        title: "Arquivo enviado",
        description: "O documento foi enviado com sucesso.",
      });
    }, 1500);
  };

  // Opções de justificativa
  const justificationOptions = [
    "Consulta médica",
    "Problema de transporte",
    "Emergência familiar",
    "Problema técnico",
    "Esquecimento",
    "Outro"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Justificar Registro Incompleto</DialogTitle>
          <DialogDescription>
            Justifique o registro de ponto incompleto para {record.employee_name} em {format(new Date(record.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Motivo */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {justificationOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes adicionais sobre a justificativa"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de documento */}
            <div className="space-y-2">
              <FormLabel>Documento (opcional)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="document"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("document")?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar documento
                    </>
                  )}
                </Button>
              </div>
              {uploadedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">Documento enviado</span>
                </div>
              )}
            </div>

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
                    Enviando...
                  </>
                ) : (
                  "Enviar Justificativa"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
