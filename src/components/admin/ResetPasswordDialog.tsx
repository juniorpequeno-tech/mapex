import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    email: string;
    full_name: string;
  };
}

const ResetPasswordDialog = ({ open, onOpenChange, user }: ResetPasswordDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);

    if (error) {
      toast({ title: "Erro", description: "Erro ao enviar e-mail de redefinição.", variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  const handleClose = () => {
    setSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir Senha</DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="text-center space-y-4 py-4">
            <Mail className="h-10 w-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              E-mail de redefinição enviado para <strong>{user.email}</strong>.
            </p>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enviar e-mail de redefinição de senha para <strong>{user.full_name}</strong> ({user.email})?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleReset} disabled={isLoading} className="flex-1">
                {isLoading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
