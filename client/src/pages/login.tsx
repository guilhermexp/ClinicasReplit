import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      // The redirect is handled in the auth provider
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/60">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl bg-background">
        {/* Lado esquerdo - Hero section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white hidden lg:flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 max-w-md mx-auto">
            <h1 className="text-5xl font-bold mb-6 font-heading text-teal-300">Clinicas.com</h1>
            <p className="text-xl mb-10 text-teal-200">Sistema de Gestão para Clínicas de Estética</p>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4 backdrop-blur-sm bg-primary-700 p-4 rounded-xl hover:bg-primary-800 transition-colors">
                <div className="bg-white text-primary-600 p-2 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-teal-200">Gestão completa de clientes</h3>
                  <p className="text-teal-100">Cadastro, histórico e acompanhamento</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 backdrop-blur-sm bg-primary-700 p-4 rounded-xl hover:bg-primary-800 transition-colors">
                <div className="bg-white text-primary-600 p-2 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-teal-200">Agendamento inteligente</h3>
                  <p className="text-teal-100">Controle total da agenda de profissionais</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 backdrop-blur-sm bg-primary-700 p-4 rounded-xl hover:bg-primary-800 transition-colors">
                <div className="bg-white text-primary-600 p-2 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-teal-200">Relatórios financeiros</h3>
                  <p className="text-teal-100">Acompanhe o desempenho do seu negócio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lado direito - Formulário de login */}
        <div className="lg:w-1/2 p-6 md:p-10 flex flex-col justify-center">
          {/* Logo para mobile e tablet */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-4xl font-bold gradient-text font-heading">Clinicas.com</h1>
            <p className="text-muted-foreground mt-2">Sistema de Gestão para Clínicas de Estética</p>
          </div>
          
          <Card variant="glass" className="border-0 shadow-lg w-full max-w-md mx-auto">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold gradient-text text-center">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-background/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                    <button 
                      onClick={() => navigate('/forgot-password')}
                      className="text-xs text-primary hover:underline font-medium"
                      type="button"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-background/50"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Lembrar-me
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Entrar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Não tem uma conta?{" "}
                  <button
                    onClick={() => navigate('/register')}
                    className="text-primary hover:underline font-medium"
                    type="button"
                  >
                    Registre-se
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
