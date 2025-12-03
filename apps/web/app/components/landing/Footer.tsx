import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#' },
    { label: 'Roadmap', href: '#' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Community', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'Press Kit', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { icon: <Github className="w-5 h-5" />, href: 'https://github.com/ASHUTOSH-SWAIN-GIT/skyforge', label: 'GitHub' },
  { icon: <Twitter className="w-5 h-5" />, href: '#', label: 'Twitter' },
  { icon: <Linkedin className="w-5 h-5" />, href: '#', label: 'LinkedIn' },
  { icon: <Mail className="w-5 h-5" />, href: '#', label: 'Email' },
];

export function Footer() {
  return (
    <footer className="bg-mocha-crust border-t border-mocha-surface0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <span className="text-xl font-bold text-mocha-text">Skyforge</span>
            </Link>
            <p className="text-mocha-subtext0 text-sm max-w-xs mb-6 leading-relaxed">
              The modern database design tool for teams who ship fast. 
              Visual schema design, real-time collaboration, and instant code generation.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-mocha-surface0/50 hover:bg-mocha-surface0 flex items-center justify-center text-mocha-overlay0 hover:text-mocha-text transition-colors"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-mocha-text mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-mocha-overlay0 hover:text-mocha-text transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-mocha-surface0 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-mocha-overlay0">
            &copy; {new Date().getFullYear()} Skyforge. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-mocha-overlay0">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mocha-green animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
