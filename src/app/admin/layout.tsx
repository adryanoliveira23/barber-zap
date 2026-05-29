"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Store, Users, Settings, BarChart3 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar token de admin no localStorage
    const token = localStorage.getItem("admin_token");
    if (token === "authenticated") {
      setIsAuthenticated(true);
    } else if (pathname !== "/admin/login") {
      router.push("/admin/login");
    }
    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-500"></div>
      </div>
    );
  }

  // Se não autenticado e não está na página de login, não renderiza o layout (redirecionamento já ocorreu)
  if (!isAuthenticated && pathname !== "/admin/login") {
    return null;
  }

  // Se não autenticado mas está na página de login, renderiza apenas o children (formulário de login)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Autenticado: renderiza o layout completo com sidebar
  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Barbearias", href: "/admin/barbershops", icon: Store },
    { name: "Usuários", href: "/admin/users", icon: Users },
    { name: "Configurações Globais", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-obsidian-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-obsidian-900 border-r border-zinc-800/50 p-5 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
