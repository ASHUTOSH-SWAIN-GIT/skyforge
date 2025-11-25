'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'bg-mocha-crust/90 backdrop-blur-xl border-b border-mocha-surface0/50 shadow-lg shadow-mocha-crust/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-mocha-mauve to-mocha-blue rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-mocha-mauve to-mocha-blue flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-mocha-crust">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold text-mocha-text tracking-tight">
              Skyforge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '#features', label: 'Features' },
              { href: '#how-it-works', label: 'How it Works' },
              { href: '#pricing', label: 'Pricing' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-mocha-subtext0 hover:text-mocha-text transition-colors group"
              >
                {item.label}
                <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-mocha-mauve/0 via-mocha-mauve to-mocha-mauve/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            <Link
              href="https://github.com/lowkeydev/skyforge"
              target="_blank"
              className="px-4 py-2 text-sm font-medium text-mocha-subtext0 hover:text-mocha-text transition-colors"
            >
              GitHub
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
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
            {['Features', 'How it Works', 'Pricing', 'GitHub'].map((item) => (
              <Link
                key={item}
                href={item === 'GitHub' ? 'https://github.com' : `#${item.toLowerCase().replace(' ', '-')}`}
                className="block px-4 py-3 text-mocha-subtext0 hover:text-mocha-text hover:bg-mocha-surface0 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <Link href="/login" className="block">
              <button className="w-full mt-4 px-5 py-3 bg-mocha-mauve text-mocha-crust rounded-lg font-semibold">
                Get Started
              </button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
