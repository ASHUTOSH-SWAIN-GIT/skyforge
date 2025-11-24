"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import { 
  LayoutGrid, 
  Database, 
  Users,
  LogOut,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [showLogout, setShowLogout] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Check if we're on a canvas page - don't show sidebar for canvas
  const isCanvasPage = pathname?.includes("/canvas/");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };

    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

  const navItems = [
    {
      label: "Workspace",
      href: "/dashboard",
      icon: LayoutGrid,
    },
    {
      label: "Connect DB",
      href: "/dashboard/connect-db",
      icon: Database,
    },
    {
      label: "Collaborate",
      href: "/dashboard/collaborate",
      icon: Users,
    },
  ];

  // Full page layout for canvas
  if (isCanvasPage) {
    return <div className="min-h-screen bg-mocha-base">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-mocha-base text-mocha-text font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 border-r border-mocha-surface0 flex flex-col fixed inset-y-0 left-0 bg-mocha-mantle z-50">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-mocha-surface0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-mocha-mauve flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                className="w-4 h-4 text-mocha-crust"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-mocha-text">Skyforge</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-medium text-mocha-overlay0 mb-4 px-2 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200 group ${
                  isActive 
                    ? "bg-mocha-surface0 text-mocha-mauve font-medium shadow-sm" 
                    : "text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-mocha-mauve" : "text-mocha-overlay0 group-hover:text-mocha-text"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 opacity-50 text-mocha-mauve" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer - User Profile & Logout */}
        <div className="p-4 border-t border-mocha-surface0" ref={userMenuRef}>
          {/* User Profile - Clickable */}
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-mocha-surface0 transition-colors group"
          >
            {(() => {
              const avatarUrl = user?.avatar_url;
              const hasAvatar = avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() !== "";
              
              if (hasAvatar) {
                return (
                  <img
                    src={avatarUrl}
                    alt={user?.name || "User"}
                    className="h-8 w-8 rounded-full border border-mocha-surface1 object-cover flex-shrink-0"
                    onError={(e) => {
                      // Hide image on error, show fallback
                      e.currentTarget.style.display = "none";
                    }}
                  />
                );
              }
              return (
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-mocha-surface1 to-mocha-surface0 flex items-center justify-center text-xs font-medium border border-mocha-surface1 flex-shrink-0 text-mocha-text">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              );
            })()}
            <div className="flex-1 overflow-hidden text-left min-w-0">
              <p className="text-sm font-medium truncate text-mocha-text">{user?.name || "User"}</p>
            </div>
            {showLogout ? (
              <ChevronDown className="w-4 h-4 text-mocha-overlay0 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-mocha-overlay0 group-hover:text-mocha-text flex-shrink-0" />
            )}
          </button>
          
          {/* Logout Button - Conditional */}
          {showLogout && (
            <button 
              onClick={async () => {
                try {
                  // Call backend logout endpoint to clear HttpOnly cookie
                  await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include",
                  });
                  
                  // Clear any cached data
                  if (typeof window !== 'undefined') {
                    localStorage.clear();
                    sessionStorage.clear();
                  }
                  
                  // Force a hard redirect to landing page to clear all state
                  window.location.href = "/";
                } catch (error) {
                  console.error("Logout error:", error);
                  // Fallback: try to clear cookie manually and redirect
                  document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  window.location.href = "/";
                }
              }}
              className="flex items-center gap-3 w-full px-3 py-2 mt-2 text-sm text-mocha-subtext0 hover:text-mocha-red hover:bg-mocha-red/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen bg-mocha-base">
        <div className="max-w-6xl mx-auto p-8 lg:p-12 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
