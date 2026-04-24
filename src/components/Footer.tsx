import React, { useState } from 'react';
import { Instagram, Linkedin, Youtube, Facebook, MessageCircle, Phone, Mail, MapPin, Clock, ChevronDown, Building2, Home, Map, Briefcase, Trees, ArrowRight, Bot } from 'lucide-react';
import { motion } from 'motion/react';

interface FooterProps {
  config?: any;
  onCategoryClick?: (cat: string) => void;
  onProjectFilterClick?: (filter: string) => void;
  onLocationClick?: (loc: string) => void;
  onServiceClick?: (service: string) => void;
  onCompanyClick?: (item: string) => void;
  onAIClick?: () => void;
  /** Fired when the user presses down on the AI button (push-to-talk start). */
  onAIPressStart?: () => void;
  /** Fired when the user releases the AI button (push-to-talk end). */
  onAIPressEnd?: () => void;
}

const Footer = ({ config, onCategoryClick, onProjectFilterClick, onLocationClick, onServiceClick, onCompanyClick, onAIClick, onAIPressStart, onAIPressEnd }: FooterProps) => {
  // Mobile accordion state
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handlePopup = (e: React.MouseEvent, title: string) => {
    e.preventDefault();
    alert(`Opening ${title} popup...`);
  };

  const footerConfig = config || {
    categories: ["Resale Homes", "New Projects", "Plots", "Commercial Spaces", "Farm Lands"],
    projectFilters: ["Trending Projects", "Luxury Projects", "Budget Homes", "Ready to Move", "New Launches"],
    locations: ["Gachibowli", "Hitech City", "Kondapur", "Whitefield", "Noida Extension"],
    services: ["Home Loans", "Instant Property Evaluation", "Documentation Support", "Schedule Site Visit"],
    company: ["About HOWZY", "Why HOWZY", "Careers", "Blog"],
    partners: ["Channel Partner Program", "List Your Property", "Contact Us", "FAQs"],
    legal: ["Privacy Policy", "Terms & Conditions"],
    contact: {
      call: "+91 XXXXX XXXXX",
      email: "hello@howzy.com",
      location: "Hyderabad, India",
      time: "10 AM – 7 PM"
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Resale')) return <RefreshCw className="w-4 h-4" />;
    if (cat.includes('Projects')) return <Building2 className="w-4 h-4" />;
    if (cat.includes('Plots')) return <Map className="w-4 h-4" />;
    if (cat.includes('Commercial')) return <Briefcase className="w-4 h-4" />;
    if (cat.includes('Farm')) return <Trees className="w-4 h-4" />;
    return <Home className="w-4 h-4" />;
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-20 pb-16 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-indigo-600/20">H</div>
              <span className="text-2xl font-bold text-white tracking-tight">HOWZY</span>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-lg font-medium leading-snug">Curating India’s Finest Homes.</p>
              <p className="text-slate-500 text-sm italic">Not Just Listings — Experiences.</p>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <a href="https://instagram.com/howzy" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-900 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/howzy" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-900 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all hover:-translate-y-1">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@howzy" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-900 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all hover:-translate-y-1">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-tight">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => onProjectFilterClick?.('Trending')} className="hover:text-white transition-colors">Projects</button></li>
              <li><button onClick={() => onLocationClick?.('All')} className="hover:text-white transition-colors">Locations</button></li>
              <li><button onClick={() => onCategoryClick?.('Resale')} className="hover:text-white transition-colors">Resale</button></li>
              <li><button onClick={() => onCategoryClick?.('Commercial')} className="hover:text-white transition-colors">Commercial</button></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-tight">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => onCompanyClick?.('About Us')} className="hover:text-white transition-colors">About Us</button></li>
              <li><button onClick={() => onCompanyClick?.('Careers')} className="hover:text-white transition-colors">Careers</button></li>
              <li><button onClick={() => onCompanyClick?.('Blog')} className="hover:text-white transition-colors">Blog</button></li>
              <li><button onClick={() => onCompanyClick?.('Partners')} className="hover:text-white transition-colors">Partners</button></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-base tracking-tight">Services</h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => onServiceClick?.('Home Buying')} className="hover:text-white transition-colors">Home Buying</button></li>
              <li><button onClick={() => onServiceClick?.('Loan Help')} className="hover:text-white transition-colors">Loan Help</button></li>
              <li><button onClick={() => onServiceClick?.('Legal')} className="hover:text-white transition-colors">Legal</button></li>
              <li><button onClick={() => onServiceClick?.('NRI Desk')} className="hover:text-white transition-colors">NRI Desk</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-slate-500 font-medium">
            © HOWZY 2026 | All Rights Reserved
          </div>
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-600">
            <button onClick={() => onCompanyClick?.('Privacy Policy')} className="hover:text-indigo-400 transition-colors">Privacy</button>
            <button onClick={() => onCompanyClick?.('Terms & Conditions')} className="hover:text-indigo-400 transition-colors">Terms</button>
            <button onClick={() => onCompanyClick?.('Contact')} className="hover:text-indigo-400 transition-colors">Contact</button>
            <button onClick={() => onCompanyClick?.('FAQs')} className="hover:text-indigo-400 transition-colors">FAQs</button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar — AI elevated in center, 2 items each side */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="relative grid grid-cols-5 items-end h-16 px-2">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors h-full">
            <Home className="w-5 h-5" />
            <span className="text-[11px] font-medium">Home</span>
          </button>
          <button onClick={() => onProjectFilterClick?.('All')} className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors h-full">
            <Map className="w-5 h-5" />
            <span className="text-[11px] font-medium">Explore</span>
          </button>

          {/* Center elevated AI button — hold to talk, release to send. */}
          <div className="flex justify-center items-end h-full">
            <motion.button
              onClick={onAIPressStart ? undefined : onAIClick}
              onPointerDown={(e) => { if (onAIPressStart) { e.preventDefault(); onAIPressStart(); } }}
              onPointerUp={onAIPressEnd}
              onPointerLeave={onAIPressEnd}
              onPointerCancel={onAIPressEnd}
              style={{ touchAction: 'none' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative -top-5 flex flex-col items-center gap-1 select-none"
              aria-label="Hold to talk to Howzy AI"
              title="Hold to talk"
            >
              <motion.div
                className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 ring-4 ring-white"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Bot className="w-6 h-6" />
              </motion.div>
              <span className="text-[11px] font-semibold text-indigo-600">AI</span>
            </motion.button>
          </div>

          <button onClick={() => onServiceClick?.('Consultation')} className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors h-full">
            <MessageCircle className="w-5 h-5" />
            <span className="text-[11px] font-medium">Consult</span>
          </button>
          <button onClick={() => onCompanyClick?.('About HOWZY')} className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors h-full">
            <Mail className="w-5 h-5" />
            <span className="text-[11px] font-medium">Contact</span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

const RefreshCw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
);

