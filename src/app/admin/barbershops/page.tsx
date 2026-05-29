"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Store, Calendar, DollarSign, Eye, MoreVertical } from "lucide-react";
import Link from "next/link";

interface BarbershopWithStats {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at: string;
  total_appointments: number;
  total_revenue: number;
}

export default function AdminBarbershops() {
  const [barbershops, setBarbershops] = useState<BarbershopWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchBarbershops = async () => {
      try {
        const res = await fetch("/api/admin/barbershops");
        if (!res.ok) throw new Error("Falha ao carregar barbearias");
        const { barbershops: data } = await res.json();
        setBarbershops(data);
      } catch (error) {
        console.error("Erro ao carregar barbearias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBarbershops();
  }, []);

  const filteredShops = barbershops.filter(shop =>
    shop.name.toLowerCase().includes(search.toLowerCase()) ||
    shop.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Barbearias</h1>
          <p className="text-sm text-zinc-500">Gerencie todas as barbearias da plataforma</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-80"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredShops.map((shop) => (
          <Card key={shop.id} className="bg-obsidian-900/50 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-gold-500" />
                    <h3 className="text-lg font-bold text-zinc-100">{shop.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      /{shop.slug}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Criado em: {new Date(shop.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-400">{shop.total_appointments} agendamentos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-zinc-500" />
                      <span className="text-gold-500 font-semibold">R$ {shop.total_revenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${shop.slug}`} target="_blank">
                    <Button variant="secondary" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" /> Ver Página
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredShops.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Nenhuma barbearia encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
