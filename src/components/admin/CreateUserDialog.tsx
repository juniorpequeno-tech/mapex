import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isMasterAdmin: boolean;
}

const generatePassword = (length = 12) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const CreateUserDialog = ({ open, onOpenChange, onSuccess, isMasterAdmin }: CreateUserDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string>("usuario_padrao");
  const [autoPassword, setAutoPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado!", description: `${field} copiado para a área de transferência.` });
  };

  const copyAll = () => {
    if (!generatedPassword) return;
    const text = `Usuário: ${email}\nSenha: ${generatedPassword}`;
    copyToClipboard(text, "all");
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setUsername("");
    setRole("usuario_padrao");
    setAutoPassword(true);
    setPassword("");
    setGeneratedPassword(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      toast({ title: "Erro", description: "Preencha nome e e-mail.", variant: "destructive" });
      return;
    }

    const finalPassword = autoPassword ? generatePassword() : password;

    if (!autoPassword && finalPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Use edge function for secure server-side user creation
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: {
        email,
        password: finalPassword,
        full_name: fullName,
        username: username || null,
        role,
      },
    });

    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error || error?.message || "Erro ao criar usuário", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);

    if (autoPassword) {
      setGeneratedPassword(finalPassword);
      toast({ title: "Usuário criado!", description: "Copie a senha gerada abaixo." });
    } else {
      toast({ title: "Sucesso", description: "Usuário criado com sucesso!" });
      resetForm();
      onOpenChange(false);
    }
    onSuccess();
  };


  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Usuário criado! Copie as credenciais abaixo para enviar ao usuário:
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">E-mail / Usuário</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{email}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(email, "E-mail")}>
                    {copiedField === "E-mail" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Senha</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{generatedPassword}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedPassword, "Senha")}>
                    {copiedField === "Senha" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={copyAll} variant="outline" className="w-full">
              {copiedField === "all" ? (
                <><Check className="h-4 w-4 mr-2 text-primary" /> Credenciais Copiadas!</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Copiar Tudo</>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ A senha não será mostrada novamente. Anote antes de fechar.
            </p>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nome de usuário</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label>Perfil de acesso</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isMasterAdmin && (
                    <SelectItem value="administrador_secundario">Admin Secundário</SelectItem>
                  )}
                  <SelectItem value="usuario_padrao">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Gerar senha automaticamente</Label>
              <Switch checked={autoPassword} onCheckedChange={setAutoPassword} />
            </div>
            {!autoPassword && (
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Usuário"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
