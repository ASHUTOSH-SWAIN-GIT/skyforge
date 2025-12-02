'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useUser } from '../../../hooks/useUser';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to extract avatar URL
  const getAvatarUrl = (avatarUrlRaw: string | { String: string; Valid: boolean } | null | undefined): string | null => {
    if (!avatarUrlRaw) return null;
    if (typeof avatarUrlRaw === "string") {
      return avatarUrlRaw;
    } else if (typeof avatarUrlRaw === "object" && avatarUrlRaw !== null && "String" in avatarUrlRaw && "Valid" in avatarUrlRaw) {
      const nullString = avatarUrlRaw as { String: string; Valid: boolean };
      if (nullString.Valid && nullString.String) {
        return nullString.String;
      }
    }
    return null;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-mocha-crust/90 backdrop-blur-xl border-b border-mocha-surface0/50 shadow-lg shadow-mocha-crust/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <span className="text-xl font-bold text-mocha-text tracking-tight">
              Skyforge
            </span>
            </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoading && user ? (
              <Link href="/dashboard">
                <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-mocha-surface0/50 transition-colors">
                  {(() => {
                    const avatarUrl = getAvatarUrl(user.avatar_url);
                    const hasAvatar = avatarUrl && avatarUrl.trim() !== "";
                    
                    if (hasAvatar) {
                      return (
                        <img
                          src={avatarUrl!}
                          alt={user.name || "User"}
                          className="h-8 w-8 rounded-full border border-mocha-surface1 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      );
                    }
                    return (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-mocha-surface1 to-mocha-surface0 flex items-center justify-center text-xs font-medium border border-mocha-surface1 text-mocha-text">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    );
                  })()}
                  <span className="text-sm font-medium text-mocha-text">{user.name || "User"}</span>
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="px-4 py-2 text-sm font-medium text-mocha-text hover:text-mocha-mauve transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link href="/login">
                  <button className="relative group px-5 py-2.5 text-sm font-semibold text-mocha-crust rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-mocha-mauve via-mocha-pink to-mocha-mauve bg-[length:200%_100%] animate-gradient-x" />
                    <span className="relative">Get Started</span>
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-mocha-crust/95 backdrop-blur-xl border-b border-mocha-surface0 p-4 space-y-2">
            {!isLoading && user ? (
              <Link href="/dashboard" className="block">
                <button className="w-full mt-4 px-5 py-3 bg-mocha-mauve text-mocha-crust rounded-lg font-semibold">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <Link href="/login" className="block">
                <button className="w-full mt-4 px-5 py-3 bg-mocha-mauve text-mocha-crust rounded-lg font-semibold">
                  Get Started
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
