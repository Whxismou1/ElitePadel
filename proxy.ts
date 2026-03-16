import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/"];

export async function proxy(req: NextRequest) {
    const res = NextResponse.next();
    const { pathname } = req.nextUrl;

    if (PUBLIC_ROUTES.includes(pathname)) return res;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value);
                        res.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/";
        return NextResponse.redirect(loginUrl);
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all routes EXCEPT:
         *  - /  (login page)
         *  - /_next/static, /_next/image, /favicon.ico, /api/*
         *  - PWA assets: /sw.js, /manifest.json, /icons/*
         */
        "/((?!_next/static|_next/image|favicon.ico|api/|sw.js|manifest.json|icons/).*)",
    ],
};
