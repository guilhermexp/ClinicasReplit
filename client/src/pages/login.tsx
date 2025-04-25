import { useState, useEffect } from "react";
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
  const [email, setEmail] = useState("guilherme-varela@hotmail.com");
  const [password, setPassword] = useState("adoado01");
  const [rememberMe, setRememberMe] = useState(true);
  
  // Redirecionar para o dashboard ou a página salva se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      if (savedRedirect) {
        localStorage.removeItem("redirectAfterLogin");
        navigate(savedRedirect);
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log("Iniciando login com método simples...");
      
      // Realizar login diretamente com fetch
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Login bem-sucedido:", data);
      
      // Redirecionar diretamente para o dashboard
      toast({
        title: "Login bem-sucedido",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      
      // Redirecionar após um curto atraso
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
      
    } catch (error: any) {
      console.error("Erro durante login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/60">
      <div className="w-full max-w-md mx-auto p-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text font-heading">Clinicas.com</h1>
          <p className="text-muted-foreground mt-2">Sistema de Gestão para Clínicas de Estética</p>
        </div>
        
        {/* Formulário de login */}
        <Card variant="glass" className="border-0 shadow-lg w-full">
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
  );
}
