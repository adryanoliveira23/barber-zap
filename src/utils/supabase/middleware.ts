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
  const { data: { user } } = await supabase.auth.getUser();

  // Route protection rules
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');

  if (isDashboardRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const isSubscriptionRoute = request.nextUrl.pathname === '/dashboard/subscription';
    const isSubscribed = !!user?.user_metadata?.is_subscribed;
    const createdTime = user?.created_at ? new Date(user.created_at).getTime() : 0;
    const isTrialActive = createdTime ? (createdTime + 7 * 24 * 60 * 60 * 1000) > Date.now() : false;
    const hasAccess = isSubscribed || isTrialActive;

    if (!hasAccess && !isSubscriptionRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/subscription';
      return NextResponse.redirect(url);
    }
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    const isSubscribed = !!user?.user_metadata?.is_subscribed;
    const createdTime = user?.created_at ? new Date(user.created_at).getTime() : 0;
    const isTrialActive = createdTime ? (createdTime + 7 * 24 * 60 * 60 * 1000) > Date.now() : false;
    const hasAccess = isSubscribed || isTrialActive;
    url.pathname = hasAccess ? '/dashboard' : '/dashboard/subscription';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
