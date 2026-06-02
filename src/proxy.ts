import { type NextRequest } from 'next/server';
import { updateSession } from "./utils/supabase/middleware";

// Essa função protege as rotas do dashboard no servidor
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// Configuração para aplicar o proxy apenas em rotas específicas se necessário
export const config = {
  matcher: [
    // Excluir arquivos estáticos e API routes por padrão
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
