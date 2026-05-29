import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Essa função pode ser expandida para proteger rotas do dashboard no futuro
export function proxy(request: NextRequest) {
  // Por enquanto, apenas permite acesso a todas as rotas
  // As verificações de autenticação estão sendo feitas no cliente via DashboardContext
  return NextResponse.next();
}

// Configuração para aplicar o proxy apenas em rotas específicas se necessário
export const config = {
  matcher: [
    // Excluir arquivos estáticos e API routes por padrão
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
