"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser, useSession, useIsAdmin } from "@/lib/store";

const navItems = [
  { label: "Detalles", href: "/leagues" },
  { label: "Matches", href: "/matches" },
  { label: "Players", href: "/players" },
  { label: "Tournament", href: "/tournaments" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const currentUser = useCurrentUser();
  const [, { logout }] = useSession();
  const isAdmin = useIsAdmin();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 80) {
        setNavbarVisible(true);
      } else if (y > lastScrollY.current) {
        setNavbarVisible(false);
      } else {
        setNavbarVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname === "/") {
    return null;
  }

  const userInitials = initials(currentUser.fullname);

  return (
    <header
      className="sticky top-0 z-40 px-4 pt-4 pb-2 bg-linear-to-b from-slate-100 to-transparent transition-transform duration-300 ease-out"
      style={{ transform: navbarVisible ? "translateY(0)" : "translateY(-120%)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-3xl border border-slate-200 bg-white/95 px-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur-md sm:px-6">
        
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="flex items-center gap-2.5 rounded-2xl px-1 py-1 hover:bg-slate-50 transition-colors"
        >
          
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#13ec5b] to-emerald-400 shadow-sm shadow-emerald-200">
            <span className="text-slate-900 font-black text-sm">EP</span>
          </div>
          <div className="flex flex-col leading-tight text-left">
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Elite<span className="text-[#13ec5b]">Padel</span>
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
              League Dashboard
            </span>
          </div>
        </button>

        
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-500 md:flex">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative transition-colors ${isActive ? "text-slate-900" : "text-emerald-500 hover:text-emerald-600"
                  }`}
              >
                <span className="px-1">{item.label}</span>
                {isActive && (
                  <span className="absolute inset-x-1 -bottom-1 h-0.5 rounded-full bg-slate-900" />
                )}
              </Link>
            );
          })}
        </nav>

        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
              <Avatar className="h-8 w-8 bg-slate-200">
                <AvatarFallback className="text-[11px] font-semibold text-slate-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#13ec5b]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs">
              <Avatar className="h-7 w-7 bg-slate-200">
                <AvatarFallback className="text-[10px] font-semibold text-slate-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-slate-900">{currentUser.fullname}</span>
                <span className="text-[11px] text-slate-500">{currentUser.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              Perfil
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="size-3.5 mr-2 text-purple-500" />
                Panel Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-variant="destructive"
              onClick={handleLogout}
            >
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      
      <nav className="mt-3 flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-500 md:hidden">
        <div className="mx-auto flex w-full max-w-7xl gap-2">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 whitespace-nowrap rounded-full px-3 py-2 text-center ${isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-emerald-500 border border-slate-200"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}