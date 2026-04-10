import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Search, Edit, Trash2, KeyRound, UserCheck, UserX, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateUserDialog from "@/components/admin/CreateUserDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AppRole = "administrador_master" | "administrador_secundario" | "usuario_padrao";
type UserStatus = "ativo" | "inativo";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string | null;
  email: string;
  role: AppRole;
  status: UserStatus;
  created_at: string;
  last_login: string | null;
}

const roleLabels: Record<AppRole, string> = {
  administrador_master: "Admin Master",
  administrador_secundario: "Admin Secundário",
  usuario_padrao: "Usuário Padrão",
};

const AdminPanel = () => {
  const { profile, signOut, isMasterAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.username && u.username.toLowerCase().includes(s))
      );
    }
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }
    setFilteredUsers(result);
  }, [users, search, roleFilter, statusFilter]);

  const toggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro", description: "Erro ao alterar status.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: `Usuário ${newStatus === "ativo" ? "ativado" : "desativado"}.` });
      fetchUsers();
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    if (deletingUser.role === "administrador_master") {
      toast({ title: "Erro", description: "O Administrador Master não pode ser excluído.", variant: "destructive" });
      setDeletingUser(null);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", deletingUser.id);

    if (error) {
      toast({ title: "Erro", description: "Erro ao excluir usuário.", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Usuário excluído." });
      fetchUsers();
    }
    setDeletingUser(null);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} title="Voltar" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate">Painel de Administração</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              Olá, {profile?.full_name || profile?.email}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="shrink-0 h-8 px-2 sm:px-3">
          <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
        </Button>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="administrador_master">Admin Master</SelectItem>
                <SelectItem value="administrador_secundario">Admin Secundário</SelectItem>
                <SelectItem value="usuario_padrao">Usuário Padrão</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Usuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
            ) : (
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Nome</th>
                      <th className="pb-3 font-medium">E-mail</th>
                      <th className="pb-3 font-medium">Perfil</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Criado em</th>
                      <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{user.full_name || "—"}</p>
                            {user.username && (
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <Badge variant={user.role === "administrador_master" ? "default" : "secondary"}>
                            {roleLabels[user.role]}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant={user.status === "ativo" ? "default" : "destructive"}>
                            {user.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" title="Editar" onClick={() => setEditingUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Redefinir senha" onClick={() => setResetPasswordUser(user)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title={user.status === "ativo" ? "Desativar" : "Ativar"} onClick={() => toggleStatus(user)}>
                              {user.status === "ativo" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            {isMasterAdmin && user.role !== "administrador_master" && (
                              <Button variant="ghost" size="icon" title="Excluir" onClick={() => setDeletingUser(user)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile card layout */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant={user.status === "ativo" ? "default" : "destructive"} className="shrink-0 text-[10px]">
                        {user.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === "administrador_master" ? "default" : "secondary"} className="text-[10px]">
                        {roleLabels[user.role]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-1 pt-1 border-t border-border">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setEditingUser(user)}>
                        <Edit className="h-3 w-3" /> Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setResetPasswordUser(user)}>
                        <KeyRound className="h-3 w-3" /> Senha
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => toggleStatus(user)}>
                        {user.status === "ativo" ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {user.status === "ativo" ? "Desativar" : "Ativar"}
                      </Button>
                      {isMasterAdmin && user.role !== "administrador_master" && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-destructive" onClick={() => setDeletingUser(user)}>
                          <Trash2 className="h-3 w-3" /> Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchUsers}
        isMasterAdmin={isMasterAdmin}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          user={editingUser}
          onSuccess={fetchUsers}
          isMasterAdmin={isMasterAdmin}
        />
      )}

      {resetPasswordUser && (
        <ResetPasswordDialog
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
          user={resetPasswordUser}
        />
      )}

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deletingUser?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
