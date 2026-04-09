import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Copy, Eye, EyeOff } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

    // Create user via Supabase Auth admin (we use signUp since we don't have admin API on client)
    // The trigger will auto-create the profile
    const { data, error } = await supabase.auth.signUp({
      email,
      password: finalPassword,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Update profile with extra data
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          username: username || null,
          role: role as any,
          status: "ativo",
        })
        .eq("user_id", data.user.id);
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

  const copyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({ title: "Copiado!", description: "Senha copiada para a área de transferência." });
    }
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
              Usuário criado! Anote a senha gerada (ela não será mostrada novamente):
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm font-mono break-all">{generatedPassword}</code>
              <Button variant="ghost" size="icon" onClick={copyPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 No futuro, essa senha poderá ser enviada automaticamente por e-mail.
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
