import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    user_id: string;
    full_name: string;
    username: string | null;
    email: string;
    role: string;
    status: string;
  };
  onSuccess: () => void;
  isMasterAdmin: boolean;
}

const EditUserDialog = ({ open, onOpenChange, user, onSuccess, isMasterAdmin }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [username, setUsername] = useState(user.username || "");
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: username || null,
        role: role as any,
        status: status as any,
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: "Erro ao atualizar usuário.", variant: "destructive" });
    } else {
      // Update role in user_roles table too
      await supabase
        .from("user_roles")
        .update({ role: role as any })
        .eq("user_id", user.user_id);

      toast({ title: "Sucesso", description: "Usuário atualizado." });
      onSuccess();
      onOpenChange(false);
    }
    setIsLoading(false);
  };

  const isMasterUser = user.role === "administrador_master";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user.email} disabled className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Nome de usuário</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          {!isMasterUser && (
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
          )}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={isMasterUser}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
