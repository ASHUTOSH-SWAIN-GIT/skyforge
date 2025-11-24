
import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-mocha-mantle border-t border-mocha-surface0 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="text-2xl font-bold text-mocha-text tracking-tight">
              Skyforge
            </Link>
            <p className="text-mocha-subtext0 text-sm max-w-xs text-center md:text-left">
              The professional database design tool for modern development teams.
            </p>
          </div>
          
          <div className="flex gap-6">
            <Link href="#" className="text-mocha-subtext0 hover:text-mocha-blue transition-colors">
              <Github className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-mocha-subtext0 hover:text-mocha-blue transition-colors">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-mocha-subtext0 hover:text-mocha-blue transition-colors">
              <Linkedin className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-mocha-surface0 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-mocha-overlay0">
          <p>&copy; {new Date().getFullYear()} Skyforge. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-mocha-text transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-mocha-text transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

