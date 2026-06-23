"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mail, Calendar, Shield, UserPlus, X, Eye, EyeOff, Sparkles, Clock, AlertCircle, Check, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface UserWithBarbershop {
  id: string;
  email: string;
  created_at: string;
  barbershop_name?: string;
  barbershop_slug?: string;
  is_subscribed: boolean;
  subscription_status: "subscribed" | "trial" | "expired";
  trial_days_remaining: number | null;
  subscription_activated_at: string | null;
  whatsapp?: string;
}

function SubscriptionBadge({ user }: { user: UserWithBarbershop }) {
  if (user.subscription_status === "subscribed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
        <Sparkles className="h-2.5 w-2.5 fill-current" />
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wide">
      <AlertCircle className="h-2.5 w-2.5" />
      Inativo
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithBarbershop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "subscribed" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

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

  const handleToggleSubscription = async (user: UserWithBarbershop) => {
    setTogglingUserId(user.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, is_subscribed: !user.is_subscribed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await fetchUsers();
    } catch (err: any) {
      console.error("Erro ao alterar assinatura:", err.message);
    } finally {
      setTogglingUserId(null);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.barbershop_name?.toLowerCase().includes(search.toLowerCase()) || false);

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "subscribed") return matchesSearch && user.subscription_status === "subscribed";
    if (statusFilter === "inactive") return matchesSearch && user.subscription_status !== "subscribed";
    return matchesSearch;
  });

  // Stats por status
  const subscribedCount = users.filter(u => u.subscription_status === "subscribed").length;
  const inactiveCount = users.filter(u => u.subscription_status !== "subscribed").length;

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
              placeholder="Buscar por email ou barbearia..."
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

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400 fill-current shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 font-medium">Assinantes Pro</p>
            <p className="text-lg font-black text-emerald-400">{subscribedCount}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 font-medium">Inativos / Aguardando Pagamento</p>
            <p className="text-lg font-black text-red-400">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Filtros de Status */}
      <div className="flex gap-2 bg-obsidian-900/30 p-1.5 border border-zinc-800/40 rounded-xl w-fit">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusFilter === "all"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-400 hover:text-zinc-200"
            }`}
        >
          Todos ({users.length})
        </button>
        <button
          onClick={() => setStatusFilter("subscribed")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${statusFilter === "subscribed"
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "text-zinc-400 hover:text-zinc-200"
            }`}
        >
          <Sparkles className="h-3 w-3 fill-current" />
          Assinantes Pro ({subscribedCount})
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${statusFilter === "inactive"
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "text-zinc-400 hover:text-zinc-200"
            }`}
        >
          <AlertCircle className="h-3 w-3" />
          Inativos ({inactiveCount})
        </button>
      </div>

      {/* Users Table */}
      <Card className="bg-obsidian-900/50 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-800">
                <tr className="text-left text-xs text-zinc-500">
                  <th className="p-4 font-medium">Usuário</th>
                  <th className="p-4 font-medium">WhatsApp / Contato</th>
                  <th className="p-4 font-medium">Barbearia</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Cadastro</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-xs shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-zinc-200">{user.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.whatsapp ? (
                        <a
                          href={`https://wa.me/${user.whatsapp.replace(/\D/g, "").startsWith("55") ? "" : "55"}${user.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Olá! Vi que você se cadastrou no BarberZap com o e-mail ${user.email}, mas não concluiu o pagamento da assinatura Pro. Ficou com alguma dúvida ou gostaria de ajuda para configurar o seu painel de agendamentos?`
                          )}`}
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
                          <div className="text-sm font-medium text-zinc-200">{user.barbershop_name}</div>
                          <div className="text-xs text-zinc-500">/{user.barbershop_slug}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">Nenhuma barbearia</span>
                      )}
                    </td>
                    <td className="p-4">
                      <SubscriptionBadge user={user} />
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
                      <Button
                        variant={user.is_subscribed ? "danger" : "ghost"}
                        size="sm"
                        className={`text-xs gap-1.5 ${user.is_subscribed ? "" : "text-emerald-500 hover:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/5"}`}
                        onClick={() => handleToggleSubscription(user)}
                        isLoading={togglingUserId === user.id}
                        title={user.is_subscribed ? "Revogar assinatura" : "Ativar assinatura Pro"}
                      >
                        {togglingUserId === user.id ? null : user.is_subscribed ? (
                          <><Shield className="h-3.5 w-3.5" /> Revogar</>
                        ) : (
                          <><Check className="h-3.5 w-3.5" /> Ativar Pro</>
                        )}
                      </Button>
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
                  <p className="text-xs text-zinc-500 mt-0.5">Conta criada com e-mail verificado e plano Pro ativo</p>
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
    </div>
  );
}
