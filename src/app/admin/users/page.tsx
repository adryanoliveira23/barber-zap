"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Calendar, UserPlus, X, Eye, EyeOff, Sparkles, Check, MessageSquare, Send, Edit, Trash2, MapPin, Instagram, FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserWithBarbershop {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  barbershop_name?: string;
  barbershop_slug?: string;
  barbershop_address?: string;
  barbershop_whatsapp?: string;
  barbershop_instagram?: string;
  barbershop_description?: string;
  whatsapp?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithBarbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  
  const [resendingAccessId, setResendingAccessId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<boolean>(false);
  
  const [toastMessage, setToastMessage] = useState("");
  const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState<{email: string, password: string} | null>(null);
  const [viewUserDetails, setViewUserDetails] = useState<UserWithBarbershop | null>(null);
  const [editUserDetails, setEditUserDetails] = useState<UserWithBarbershop | null>(null);

  // Edit form states
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editShopName, setEditShopName] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Falha ao carregar usuários");
      }
      const { users: enriched } = await res.json();
      setUsers(enriched);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResendAccess = async (user: UserWithBarbershop) => {
    setResendingAccessId(user.id);
    try {
      const res = await fetch("/api/admin/users/resend-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          email: user.email,
          userName: user.full_name || user.email.split("@")[0],
          barbershopName: user.barbershop_name
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao reenviar");
      }
      setGeneratedPasswordInfo({ email: user.email, password: data.newPassword });
      setToastMessage(`Nova senha gerada para ${user.email}`);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      setToastMessage("Falha ao reenviar acesso");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setResendingAccessId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword, full_name: newFullName, shop_name: newShopName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar usuário");

      setCreateSuccess(`Usuário ${data.user.email} criado com sucesso!`);
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewShopName("");
      await fetchUsers();
      setTimeout(() => {
        setShowModal(false);
        setCreateSuccess("");
      }, 1800);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este usuário e sua barbearia? Esta ação é irreversível.")) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir usuário");
      }
      setToastMessage("Usuário excluído com sucesso!");
      setTimeout(() => setToastMessage(""), 3000);
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      setToastMessage("Falha ao excluir usuário: " + err.message);
      setTimeout(() => setToastMessage(""), 5000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const openEditModal = (user: UserWithBarbershop) => {
    setEditUserDetails(user);
    setEditEmail(user.email);
    setEditFullName(user.full_name || "");
    setEditWhatsapp(user.whatsapp || "");
    setEditShopName(user.barbershop_name || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserDetails) return;
    
    setEditingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editUserDetails.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: editEmail, 
          full_name: editFullName, 
          whatsapp: editWhatsapp, 
          barbershop_name: editShopName 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar usuário");
      }
      
      setToastMessage("Usuário atualizado com sucesso!");
      setTimeout(() => setToastMessage(""), 3000);
      setEditUserDetails(null);
      
      // Update local state if currently viewing details
      if (viewUserDetails?.id === editUserDetails.id) {
        setViewUserDetails({
          ...viewUserDetails,
          email: editEmail,
          full_name: editFullName,
          whatsapp: editWhatsapp,
          barbershop_name: editShopName
        });
      }
      
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao atualizar: " + err.message);
    } finally {
      setEditingUser(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    return user.email.toLowerCase().includes(searchLower) ||
      (user.barbershop_name?.toLowerCase().includes(searchLower)) ||
      (user.full_name?.toLowerCase().includes(searchLower));
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Usuários</h1>
          <p className="text-sm text-zinc-500">
            {users.length} conta{users.length !== 1 ? "s" : ""} cadastrada{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar por nome, email ou barbearia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2 shrink-0">
            <UserPlus className="h-4 w-4" />
            Criar Usuário
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-obsidian-900/50 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-zinc-800 bg-black/20">
                <tr className="text-left text-xs text-zinc-400">
                  <th className="p-4 font-semibold uppercase tracking-wider">Usuário</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">WhatsApp / Contato</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Barbearia</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Cadastro</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-sm shrink-0">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-zinc-200">{user.full_name || "Sem nome"}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.whatsapp ? (
                        <a
                          href={`https://wa.me/${user.whatsapp.replace(/\D/g, "").startsWith("55") ? "" : "55"}${user.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
                          title="Falar no WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span>{user.whatsapp}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Não informado</span>
                      )}
                    </td>
                    <td className="p-4">
                      {user.barbershop_name ? (
                        <div>
                          <div className="text-sm font-semibold text-zinc-200">{user.barbershop_name}</div>
                          <div className="text-xs text-zinc-500">/{user.barbershop_slug}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Nenhuma barbearia</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-600" />
                        <span className="text-sm text-zinc-400">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                          onClick={() => setViewUserDetails(user)}
                          title="Visualizar Detalhes Completos"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          onClick={() => openEditModal(user)}
                          title="Editar Usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gold-500 hover:text-gold-400 hover:bg-gold-500/10"
                          onClick={() => handleResendAccess(user)}
                          isLoading={resendingAccessId === user.id}
                          title="Gerar nova senha de acesso"
                        >
                          {resendingAccessId === user.id ? null : <Send className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteUser(user.id)}
                          isLoading={deletingUserId === user.id}
                          title="Excluir Usuário"
                        >
                          {deletingUserId === user.id ? null : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12 text-zinc-500">
          Nenhum usuário encontrado.
        </div>
      )}

      {/* View Details Modal */}
      <AnimatePresence>
        {viewUserDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setViewUserDetails(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-obsidian-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">Ficha Completa do Usuário</h2>
                </div>
                <button
                  onClick={() => setViewUserDetails(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* User Info Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gold-500 mb-3 uppercase tracking-wider">Dados Pessoais</h3>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><UserPlus className="h-4 w-4"/> Nome Completo</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.full_name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><Mail className="h-4 w-4"/> E-mail</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.email}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><MessageSquare className="h-4 w-4"/> WhatsApp</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.whatsapp || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><Calendar className="h-4 w-4"/> Conta Criada em</span>
                      <span className="text-sm font-semibold text-zinc-200">{new Date(viewUserDetails.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                {/* Barbershop Info Section */}
                <div>
                  <h3 className="text-sm font-semibold text-emerald-500 mb-3 uppercase tracking-wider">Dados da Barbearia</h3>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><Sparkles className="h-4 w-4"/> Nome</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.barbershop_name || "Não configurado"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><Send className="h-4 w-4"/> Link (Slug)</span>
                      <span className="text-sm font-semibold text-zinc-200">/{viewUserDetails.barbershop_slug || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><MessageSquare className="h-4 w-4"/> WhatsApp Barbearia</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.barbershop_whatsapp || "-"}</span>
                    </div>
                    <div className="flex flex-col border-b border-zinc-800/50 pb-2 gap-1">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><MapPin className="h-4 w-4"/> Endereço</span>
                      <span className="text-sm font-semibold text-zinc-200 text-right">{viewUserDetails.barbershop_address || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-zinc-800/50 pb-2">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><Instagram className="h-4 w-4"/> Instagram</span>
                      <span className="text-sm font-semibold text-zinc-200">{viewUserDetails.barbershop_instagram || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-zinc-500 flex items-center gap-2"><FileText className="h-4 w-4"/> Descrição</span>
                      <span className="text-sm font-semibold text-zinc-200 text-right">{viewUserDetails.barbershop_description || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-2 text-center">
                    <p className="text-xs text-amber-500/80">
                      <strong>Segurança:</strong> As senhas são criptografadas e irreversíveis no banco de dados. Para dar o acesso ao cliente, você precisa gerar uma nova senha.
                    </p>
                    <Button 
                      variant="secondary" 
                      className="w-full border border-amber-500/30 bg-transparent text-amber-500 hover:bg-amber-500/10"
                      isLoading={resendingAccessId === viewUserDetails.id}
                      onClick={() => {
                        setViewUserDetails(null);
                        handleResendAccess(viewUserDetails);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" /> Gerar Nova Senha para o Usuário
                    </Button>
                  </div>

                  <Button className="w-full" variant="secondary" onClick={() => {
                    setViewUserDetails(null);
                    openEditModal(viewUserDetails);
                  }}>
                    <Edit className="h-4 w-4 mr-2" /> Editar Dados do Usuário
                  </Button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editUserDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditUserDetails(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-obsidian-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Editar Usuário</h2>
                </div>
                <button
                  onClick={() => setEditUserDetails(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
                <Input
                  label="Nome completo"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                />
                <Input
                  label="WhatsApp"
                  placeholder="Ex: 5511999999999"
                  value={editWhatsapp}
                  onChange={(e) => setEditWhatsapp(e.target.value)}
                />
                <Input
                  label="Nome da barbearia"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                />

                <div className="flex gap-3 mt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 border-zinc-800"
                    onClick={() => setEditUserDetails(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={editingUser} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-500 text-white">
                    <Check className="h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-obsidian-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Criar Novo Usuário</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Conta criada com e-mail verificado e acesso liberado</p>
                </div>
                <button
                  onClick={() => { setShowModal(false); setCreateError(""); setCreateSuccess(""); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  placeholder="barbeiro@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />

                <div className="relative">
                  <Input
                    label="Senha inicial"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 bottom-3 text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  label="Nome completo"
                  placeholder="Ex: Carlos Barber"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                />

                <Input
                  label="Nome da barbearia"
                  placeholder="Ex: Barbearia do Carlos"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  required
                />

                {createError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {createError}
                  </p>
                )}
                {createSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    ✓ {createSuccess}
                  </p>
                )}

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 border-zinc-800"
                    onClick={() => { setShowModal(false); setCreateError(""); }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={creating} className="flex-1 gap-2">
                    <UserPlus className="h-4 w-4" />
                    Criar Conta
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 text-obsidian-950 px-4 py-3 font-semibold shadow-xl flex items-center gap-2 text-sm"
          >
            <Check className="h-4 w-4" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Password Modal */}
      <AnimatePresence>
        {generatedPasswordInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setGeneratedPasswordInfo(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-obsidian-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Nova Senha Gerada</h2>
                </div>
                <button
                  onClick={() => setGeneratedPasswordInfo(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4 text-center">
                <p className="text-sm text-zinc-400">
                  Uma nova senha foi gerada para <strong className="text-zinc-200">{generatedPasswordInfo.email}</strong>.
                  O usuário já recebeu essa senha por e-mail, mas você pode copiá-la abaixo caso precise enviar via WhatsApp.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-2">
                  <span className="text-xl font-mono font-bold tracking-widest text-gold-400">
                    {generatedPasswordInfo.password}
                  </span>
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPasswordInfo.password);
                    setToastMessage("Senha copiada para a área de transferência!");
                    setTimeout(() => setToastMessage(""), 3000);
                  }}
                >
                  Copiar Senha
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
