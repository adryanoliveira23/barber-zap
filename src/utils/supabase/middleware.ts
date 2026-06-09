import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh token if needed
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (err) {
    console.warn("Auth middleware refresh failed:", err);
  }

  // Route protection rules
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');
  const isRootRoute = request.nextUrl.pathname === '/';

  // Se está logado e abre a landing page, vai direto pro dashboard
  if (isRootRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const isSubscriptionRoute = request.nextUrl.pathname === '/dashboard/subscription';
    const isSubscribed = !!user?.user_metadata?.is_subscribed;
    const hasAccess = isSubscribed;

    if (!hasAccess && !isSubscriptionRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/subscription';
      return NextResponse.redirect(url);
    }
  }


  return supabaseResponse;
}
