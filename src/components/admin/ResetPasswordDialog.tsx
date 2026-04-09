import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, EyeOff, KeyRound, Check } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    full_name: string;
    username: string | null;
  };
}

const generatePassword = (length = 12) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const ResetPasswordDialog = ({ open, onOpenChange, user }: ResetPasswordDialogProps) => {
  const [autoPassword, setAutoPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setAutoPassword(true);
    setPassword("");
    setShowPassword(false);
    setResult(null);
    setCopiedField(null);
  };

  const handleReset = async () => {
    const finalPassword = autoPassword ? generatePassword() : password;

    if (!autoPassword && finalPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke("reset-password", {
      body: {
        user_id: user.user_id,
        password: finalPassword,
      },
    });

    setIsLoading(false);

    if (error || data?.error) {
      toast({ title: "Erro", description: data?.error || error?.message || "Erro ao redefinir senha.", variant: "destructive" });
      return;
    }

    setResult({ email: user.email, password: finalPassword });
    toast({ title: "Senha redefinida!", description: "Copie as credenciais abaixo para enviar ao usuário." });
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado!", description: `${field === "all" ? "Credenciais copiadas" : field + " copiado"} para a área de transferência.` });
  };

  const copyAll = () => {
    if (!result) return;
    const text = `Usuário: ${result.email}\nSenha: ${result.password}`;
    copyToClipboard(text, "all");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Redefinir Senha
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Senha redefinida para <strong>{user.full_name}</strong>. Copie as credenciais abaixo para enviar ao usuário:
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">E-mail / Usuário</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{result.email}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.email, "E-mail")}>
                    {copiedField === "E-mail" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nova Senha</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{result.password}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.password, "Senha")}>
                    {copiedField === "Senha" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <Button onClick={copyAll} variant="outline" className="w-full">
              {copiedField === "all" ? (
                <><Check className="h-4 w-4 mr-2 text-green-500" /> Credenciais Copiadas!</>
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redefinir senha de <strong>{user.full_name}</strong> ({user.email})
            </p>

            <div className="flex items-center justify-between">
              <Label>Gerar senha automaticamente</Label>
              <Switch checked={autoPassword} onCheckedChange={setAutoPassword} />
            </div>

            {!autoPassword && (
              <div className="space-y-2">
                <Label>Nova Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleReset} disabled={isLoading} className="flex-1">
                {isLoading ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
