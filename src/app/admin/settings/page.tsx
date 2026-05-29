"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Settings, Save, Globe, Shield, Bell } from "lucide-react";

export default function AdminSettings() {
  const [globalConfig, setGlobalConfig] = useState({
    systemName: "BarberZap",
    supportEmail: "suporte@barberzap.com",
    maintenanceMode: false,
    defaultPlanPrice: 59,
  });
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    // Carregar configurações do localStorage ou API (mock)
    const saved = localStorage.getItem("admin_global_config");
    if (saved) {
      setGlobalConfig(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem("admin_global_config", JSON.stringify(globalConfig));
      success("Configurações salvas!", "As configurações globais foram atualizadas.");
      setSaving(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Configurações Globais</h1>
        <p className="text-sm text-zinc-500">Gerencie as configurações de todo o sistema</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card className="bg-obsidian-900/50 border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Globe className="h-5 w-5 text-gold-500" />
              <h2 className="text-lg font-semibold text-zinc-100">Configurações Gerais</h2>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-1">Nome do Sistema</label>
              <Input
                value={globalConfig.systemName}
                onChange={(e) => setGlobalConfig({ ...globalConfig, systemName: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-1">Email de Suporte</label>
              <Input
                type="email"
                value={globalConfig.supportEmail}
                onChange={(e) => setGlobalConfig({ ...globalConfig, supportEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-1">Preço Padrão do Plano (R$)</label>
              <Input
                type="number"
                value={globalConfig.defaultPlanPrice}
                onChange={(e) => setGlobalConfig({ ...globalConfig, defaultPlanPrice: parseFloat(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-zinc-500" />
                <span className="text-sm text-zinc-400">Modo de Manutenção</span>
              </div>
              <button
                onClick={() => setGlobalConfig({ ...globalConfig, maintenanceMode: !globalConfig.maintenanceMode })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                  globalConfig.maintenanceMode ? "bg-red-500" : "bg-zinc-800"
                }`}
              >
                <div className={`h-5 w-5 rounded-full bg-obsidian-950 transition-transform ${globalConfig.maintenanceMode ? "transform translate-x-5" : ""}`} />
              </button>
            </div>

            <Button onClick={handleSave} isLoading={saving} className="w-full mt-4 gap-2">
              <Save className="h-4 w-4" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-obsidian-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
              <Bell className="h-5 w-5 text-gold-500" />
              <h2 className="text-lg font-semibold text-zinc-100">Informações do Admin</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Para alterar o email do administrador, configure a variável de ambiente <code className="bg-zinc-900 px-1 py-0.5 rounded">NEXT_PUBLIC_ADMIN_EMAIL</code> no arquivo <code className="bg-zinc-900 px-1 py-0.5 rounded">.env.local</code>.
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Email atual: <strong>{process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@barberzap.com"}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
