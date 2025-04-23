import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro na validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(name, email, password);
      // The redirect is handled in the auth provider
    } catch (error) {
      toast({
        title: "Erro ao registrar",
        description: "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Seção de boas-vindas - visível apenas em telas médias e maiores */}
      <div className="hidden md:flex md:w-1/2 bg-primary-600 text-white p-8 flex-col justify-center items-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6 font-heading">Gardenia</h1>
          <p className="text-xl mb-8">Crie sua conta e comece a gerenciar sua clínica</p>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Cadastro rápido</h3>
                <p className="text-primary-100">Comece a usar em minutos</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Sem complicações</h3>
                <p className="text-primary-100">Interface intuitiva e fácil de usar</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary-500 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">Suporte especializado</h3>
                <p className="text-primary-100">Ajuda quando você precisar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulário de registro */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* Logo para mobile */}
          <div className="text-center mb-8 md:hidden">
            <h1 className="text-3xl font-bold text-primary-600 font-heading">Gardenia</h1>
            <p className="text-gray-600 mt-2">Sistema de Gestão para Clínicas de Estética</p>
          </div>
          
          <Card className="border-none shadow-lg mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Criar sua conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para começar
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu Nome Completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Alert className="bg-primary-50 text-primary-800 border-primary-200">
                  <AlertDescription className="text-xs">
                    Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Criar conta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
                <p className="text-sm text-center text-gray-600">
                  Já tem uma conta?{" "}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-primary-600 hover:underline font-medium"
                    type="button"
                  >
                    Faça login
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
