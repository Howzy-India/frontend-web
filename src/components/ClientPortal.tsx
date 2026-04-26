import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Search, MapPin, Filter, Heart, Home, Trees, Map, Building2, Phone, Calendar, ArrowLeft, ArrowRight, LogOut, FileText, CheckCircle2, Clock, X, Plus, Bell, Star, Shield, MessageCircle, Mail, User, RefreshCw, Briefcase, TrendingUp, Sparkles, Tag, ChevronLeft, ChevronDown, TrendingDown, Globe, DollarSign, Eye, Users, Key, Zap, Layout, FileCheck, PenTool, Landmark, Palette, Leaf, Sun, Apple, Wind, Moon, ShoppingBag, Truck, BarChart3, Settings, CreditCard, Bot, Upload, Menu } from 'lucide-react';

function WhatsAppIcon({ className = 'w-5 h-5' }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import Logo from './Logo';
import { api } from '../services/api';
import { TEST_IDS } from '../constants/testIds';
import FarmLandOnboardingModal from './FarmLandOnboardingModal';
import PlotsOnboardingModal from './PlotsOnboardingModal';
import Footer from './Footer';
import { useEnquiryUpdates } from '../hooks/useNotifications';
import ClientProfileEditModal from './ClientProfileEditModal';
import ClientChatWidget from './ClientChatWidget';
import ErrorBoundary from './ErrorBoundary';
import type { AppRole } from '../hooks/useAuth';
import { getClientProfile } from '../hooks/useClientProfile';
import { uploadResaleFloorPlan } from '../utils/storageUpload';

function FilterDropdown({ label, value, options, onChange, isOpen, onToggle }: any) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button 
        onClick={onToggle} 
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${value ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
      >
        {value ? options.find((o: any) => o.value === value)?.label : label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden"
          >
            <button 
              onClick={() => { onChange(''); onToggle(); }} 
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${!value ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'}`}
            >
              All {label}
            </button>
            {options.map((opt: any) => (
              <button 
                key={opt.value} 
                onClick={() => { onChange(opt.value); onToggle(); }} 
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${value === opt.value ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatBudget(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)} Cr`;
  return `₹${(val / 100000).toFixed(0)} Lacs`;
}

function BudgetRangeSlider({ minVal, maxVal, onChange }: Readonly<{
  minVal: number; maxVal: number;
  onChange: (min: number, max: number) => void;
}>) {
  const MIN = 2500000, MAX = 250000000, STEP = 500000;
  const pctLeft = ((minVal - MIN) / (MAX - MIN)) * 100;
  const pctRight = ((maxVal - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 min-w-[220px] sm:min-w-[260px]">
      <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Budget</span>
      <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap">{formatBudget(minVal)}</span>
      <div className="relative flex-1 h-5">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-indigo-100 rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full" style={{ left: `${pctLeft}%`, right: `${100 - pctRight}%` }} />
        <input type="range" min={MIN} max={MAX} step={STEP} value={minVal}
          onChange={e => { const v = Math.min(Number(e.target.value), maxVal - STEP); onChange(v, maxVal); }}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow"
        />
        <input type="range" min={MIN} max={MAX} step={STEP} value={maxVal}
          onChange={e => { const v = Math.max(Number(e.target.value), minVal + STEP); onChange(minVal, v); }}
          className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow"
        />
      </div>
      <span className="text-xs font-semibold text-indigo-700 whitespace-nowrap">{formatBudget(maxVal)}</span>
    </div>
  );
}

interface AvatarDropdownProps {
  userName?: string;
  onEditProfile: () => void;
  onLogout: () => void;
}

function AvatarDropdown({ userName, onEditProfile, onLogout }: Readonly<AvatarDropdownProps>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-full rounded-full flex items-center justify-center"
        aria-label="User menu"
        data-testid={TEST_IDS.PORTAL.AVATAR_MENU_BTN}
        title={userName || 'Profile'}
      >
        {userName ? userName.charAt(0).toUpperCase() : '?'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
            data-testid={TEST_IDS.PORTAL.AVATAR_MENU_PANEL}
          >
            {userName && (
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); onEditProfile(); }}
              data-testid={TEST_IDS.PORTAL.AVATAR_EDIT_PROFILE_BTN}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              <User className="w-4 h-4" /> Edit Profile
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              data-testid={TEST_IDS.PORTAL.AVATAR_LOGOUT_BTN}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ClientPortalProps {
  uid?: string;
  onLogout: () => void;
  onLoginClick?: () => void;
  onProfileUpdate?: (name: string) => void;
  userEmail?: string;
  userName?: string;
  userRole?: AppRole;
  footerConfig?: any;
}

export default function ClientPortal({ uid, onLogout, onLoginClick, onProfileUpdate, userEmail, userName, userRole, footerConfig }: Readonly<ClientPortalProps>) {
  const [activeTab, setActiveTab] = useState<'Home' | 'Projects' | 'Services' | 'About' | 'Dashboard'>('Home');
  const [landingCategory, setLandingCategory] = useState<'All' | 'Resale' | 'Projects' | 'Plots' | 'Commercial' | 'Farm Lands'>('All');
  const [projectCategory, setProjectCategory] = useState<'All' | 'Apartments' | 'Villas' | 'Resale' | 'Plots' | 'Commercial' | 'Farm Lands'>('All');
  const [dashboardTab, setDashboardTab] = useState<'My Listings' | 'My Enquiries' | 'My Saved Projects'>('My Saved Projects');
  const [isAIOpen, setIsAIOpen] = useState(0);
  // Hold-to-talk signals for the AI button (header + footer). Incrementing
  // holdStart / holdEnd lets ClientChatWidget drive push-to-talk recording.
  const [aiHoldStart, setAiHoldStart] = useState(0);
  const [aiHoldEnd, setAiHoldEnd] = useState(0);
  const aiPressActive = useRef(false);
  const onAIPressStart = useCallback(() => {
    if (aiPressActive.current) return;
    aiPressActive.current = true;
    setIsAIOpen((n) => n + 1); // ensure the voice bar is visible
    setAiHoldStart((n) => n + 1);
  }, []);
  const onAIPressEnd = useCallback(() => {
    if (!aiPressActive.current) return;
    aiPressActive.current = false;
    setAiHoldEnd((n) => n + 1);
  }, []);

  // Admin Configuration State
  const [adminConfig, setAdminConfig] = useState({
    Apartments: {
      enableBHK: true,
      enablePrice: true,
      enablePossession: true,
      enableFacing: false,
      enableAmenities: true,
    },
    Villas: {
      enableBHK: true,
      enablePrice: true,
      enableGated: true,
    },
    Resale: {
      enableAge: true,
      enableFurnishing: true,
      enableOwnership: true,
    },
    Plots: {
      enableSize: true,
      enableApproval: true,
      enableCorner: true,
    },
    Commercial: {
      enableType: true,
      enableTransaction: true,
      enableArea: true,
    },
    FarmLands: {
      enableSize: true,
      enablePrice: true,
    },
    footer: {
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
    }
  });

  // Filter States
  const [filters, setFilters] = useState({
    location: '',
    bhk: '',
    priceRange: '',
    priceMin: 2500000,
    priceMax: 250000000,
    possession: '',
    gated: '',
    age: '',
    furnishing: '',
    ownership: '',
    size: '',
    approval: '',
    corner: '',
    type: '',
    transaction: '',
    area: '',
    trendingArea: ''
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const propertyCategories = [
    { id: 'Apartments', title: 'New Projects', subtitle: 'Find apartments that match your needs', icon: Building2, color: 'blue' },
    { id: 'Villas', title: 'Villas', subtitle: 'Luxury independent houses and villas', icon: Home, color: 'emerald' },
    { id: 'Resale', title: 'Resale Homes', subtitle: 'Pre-owned properties ready to move', icon: RefreshCw, color: 'amber' },
    { id: 'Plots', title: 'Open Plots', subtitle: 'Open plots for your dream home', icon: Map, color: 'indigo' },
    { id: 'Commercial', title: 'Commercial', subtitle: 'Office spaces, shops, and warehouses', icon: Briefcase, color: 'purple' },
    { id: 'Farm Lands', title: 'Farm Lands', subtitle: 'Agricultural and farm lands', icon: Trees, color: 'green' }
  ];
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [myResaleListings, setMyResaleListings] = useState<any[]>([]);
  const [isResaleModalOpen, setIsResaleModalOpen] = useState(false);
  const INITIAL_RESALE_FORM = {
    title: '', description: '', price: '', propertyType: 'Apartment',
    city: '', location: '', area: '', bedrooms: '', bathrooms: '',
    segment: '', societyType: '',
    emiFrom: '', ownerName: '', ownerPhone: '', agentName: '', agentPhone: '',
    address: '', zone: '', cluster: '', state: '', pincode: '', landmark: '',
    mapLink: '', possession: '', floor: '', totalFloors: '', floorPlan: '',
  };
  const [resaleForm, setResaleForm] = useState(INITIAL_RESALE_FORM);
  const [resaleSubmitting, setResaleSubmitting] = useState(false);
  const [resaleSubmitMsg, setResaleSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingResaleId, setEditingResaleId] = useState<string | null>(null);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);
  const [floorPlanProgress, setFloorPlanProgress] = useState(0);
  const [floorPlanError, setFloorPlanError] = useState('');
  const [floorPlanFileName, setFloorPlanFileName] = useState('');
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [delegatingResaleId, setDelegatingResaleId] = useState<string | null>(null);
  const [delegateForm, setDelegateForm] = useState({ agentName: '', agentPhone: '' });
  const [delegateSubmitting, setDelegateSubmitting] = useState(false);
  const [delegateMsg, setDelegateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [profileContactTime, setProfileContactTime] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  
  const [isFarmLandModalOpen, setIsFarmLandModalOpen] = useState(false);
  const [isPlotsModalOpen, setIsPlotsModalOpen] = useState(false);

  // City selector
  const [selectedCity, setSelectedCity] = useState('Hyderabad');
  const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR'];
  const [showComingSoonBanner, setShowComingSoonBanner] = useState(false);

  // Sticky filter detection
  const [isFilterStuck, setIsFilterStuck] = useState(false);
  const filterSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFilterStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // Hamburger menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);

  const navigateFromMenu = (section: 'Services' | 'About') => {
    setIsMobileMenuOpen(false);
    setMobileSubMenu(null);
    setActiveTab(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPropertyCategory = (category: string) => {
    setIsMobileMenuOpen(false);
    setMobileSubMenu(null);
    setActiveTab('Projects');
    const catMap: Record<string, any> = {
      'New Projects': 'Apartments',
      'Villas': 'Villas',
      'Resale Homes': 'Resale',
      'Open Plots': 'Plots',
      'Farm Lands': 'Farm Lands',
      'Commercial': 'Commercial',
    };
    setProjectCategory(catMap[category] || 'All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close notifications panel on outside click
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  // Load contact time eagerly so the profile edit modal has it on first open
  useEffect(() => {
    if (uid) {
      getClientProfile(uid).then(p => {
        if (p?.contactTime) setProfileContactTime(p.contactTime);
        if (p?.phone) setProfilePhone(p.phone);
      }).catch(() => null);
    }
  }, [uid]);
  const fetchEnquiries = async () => {
    if (!userEmail) return;
    try {
      const data = await api.getClientEnquiries(userEmail);
      setEnquiries(data.enquiries || []);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    }
  };

  useEffect(() => {
    fetchProperties();
    if (userEmail) {
      fetchMyListings();
      fetchMyResaleListings();
      fetchEnquiries();

    }
  }, [userEmail]);

  // Brief loading indicator when filters or category change in Projects tab
  useEffect(() => {
    if (activeTab !== 'Projects') return;
    setFiltersLoading(true);
    const t = setTimeout(() => setFiltersLoading(false), 400);
    return () => clearTimeout(t);
  }, [filters, projectCategory, activeTab]);

  const enquiryUpdates = useEnquiryUpdates(userEmail || null);

  useEffect(() => {
    if (enquiryUpdates.length > 0) {
      const latest = enquiryUpdates[0];
      setNotifications(prev => [{
        id: latest.id ?? Date.now().toString(),
        message: latest.action ?? 'Enquiry updated',
        type: 'enquiry-update',
        unread: true,
      }, ...prev.slice(0, 19)]);
    }
  }, [enquiryUpdates]);

  // Refresh enquiries whenever user opens the My Enquiries tab
  useEffect(() => {
    if (dashboardTab === 'My Enquiries' && userEmail) {
      fetchEnquiries();
    }
  }, [dashboardTab, userEmail]);

  const fetchProperties = async () => {
    setPropertiesLoading(true);
    try {
      const [projectsData, resaleData] = await Promise.all([
        api.getProjects(),
        api.getResaleProperties().catch(() => ({ resaleProperties: [] })),
      ]);

      const mappedProjects = projectsData.projects.map((p: any) => {
        let type = 'Residential';
        if (p.propertyType === 'plot') type = 'Plot';
        if (p.propertyType === 'farmland') type = 'Farm Land';
        if (p.projectType === 'Commercial') type = 'Commercial';

        return {
          id: p.id,
          name: p.name,
          type: type,
          details: {
            location: p.location || p.city,
            description: p.usp,
            price: p.projectSegment
          }
        };
      });

      const mappedResale = (resaleData.resaleProperties ?? []).map((r: any) => ({
        id: r.id,
        name: r.title,
        type: 'Re-Sale',
        details: {
          location: r.location || r.city,
          description: r.description,
          price: r.price,
          city: r.city,
          bedrooms: r.bedrooms,
          bathrooms: r.bathrooms,
          area: r.area,
          propertyType: r.propertyType,
        }
      }));

      setProperties([...mappedProjects, ...mappedResale]);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const data = await api.getAdminSubmissions(userEmail);
      const listings = data.submissions.filter((s: any) => 
        (s.type === 'Farm Land' || s.type === 'Plot' || s.type === 'Residential' || s.type === 'Commercial')
      );
      setMyListings(listings);
    } catch (error) {
      console.error('Failed to fetch my listings:', error);
    }
  };

  const fetchMyResaleListings = async () => {
    try {
      const data = await api.getMyResaleProperties();
      setMyResaleListings(data.resaleProperties ?? []);
    } catch {
      setMyResaleListings([]);
    }
  };

  const handleFloorPlanUpload = useCallback(async (file: File) => {
    setFloorPlanUploading(true);
    setFloorPlanProgress(0);
    setFloorPlanError('');
    setFloorPlanFileName(file.name);
    try {
      const url = await uploadResaleFloorPlan(file, setFloorPlanProgress);
      setResaleForm(f => ({ ...f, floorPlan: url }));
      setFloorPlanProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setFloorPlanError(message);
      setFloorPlanFileName('');
      setFloorPlanProgress(0);
      setResaleForm(f => ({ ...f, floorPlan: '' }));
    } finally {
      setFloorPlanUploading(false);
    }
  }, []);

  const handleResaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResaleSubmitting(true);
    setResaleSubmitMsg(null);
    try {
      const payload = {
        ...resaleForm,
        price: resaleForm.price ? Number(resaleForm.price) : undefined,
        bedrooms: resaleForm.bedrooms ? Number(resaleForm.bedrooms) : undefined,
        bathrooms: resaleForm.bathrooms ? Number(resaleForm.bathrooms) : undefined,
        floor: resaleForm.floor ? Number(resaleForm.floor) : undefined,
        totalFloors: resaleForm.totalFloors ? Number(resaleForm.totalFloors) : undefined,
      };
      if (editingResaleId) {
        await api.updateMyResaleProperty(editingResaleId, payload);
        setResaleSubmitMsg({ type: 'success', text: 'Property updated successfully!' });
      } else {
        await api.submitResaleProperty(payload);
        setResaleSubmitMsg({ type: 'success', text: 'Property submitted for review! You\'ll be notified once approved.' });
      }
      setResaleForm(INITIAL_RESALE_FORM);
      setEditingResaleId(null);
      setFloorPlanFileName('');
      fetchMyResaleListings();
    } catch (err: any) {
      setResaleSubmitMsg({ type: 'error', text: err?.message ?? 'Submission failed. Please try again.' });
    } finally {
      setResaleSubmitting(false);
    }
  };

  const handleDelegateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatingResaleId) return;
    setDelegateSubmitting(true);
    setDelegateMsg(null);
    try {
      await api.delegateResaleProperty(delegatingResaleId, delegateForm.agentName, delegateForm.agentPhone);
      setDelegateMsg({ type: 'success', text: 'Agent assigned successfully!' });
      fetchMyResaleListings();
      setTimeout(() => { setIsDelegateModalOpen(false); setDelegatingResaleId(null); setDelegateForm({ agentName: '', agentPhone: '' }); }, 1500);
    } catch (err: any) {
      setDelegateMsg({ type: 'error', text: err?.message ?? 'Failed to assign agent.' });
    } finally {
      setDelegateSubmitting(false);
    }
  };

  const handleSaveProperty = async (id: string) => {
    if (!userEmail) {
      onLoginClick?.();
      return;
    }
    
    const isSaving = !savedProperties.includes(id);
    
    setSavedProperties(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );

    if (isSaving) {
      const property = properties.find(p => p.id === id);
      if (property) {
        try {
          const newEnquiry = {
            client_name: userName || userEmail.split('@')[0],
            phone: 'Not provided',
            email: userEmail,
            property_id: property.id,
            property_name: property.name,
            property_type: property.type,
            location: property.details?.location || property.details?.city || 'Unknown',
            enquiry_type: 'Save Property',
            source: 'Client Portal'
          };
          await api.createEnquiry(newEnquiry);
          fetchEnquiries();
        } catch (error) {
          console.error('Failed to create enquiry for saved property:', error);
        }
      }
    }
  };

  const handleEnquiry = async (property: any, type: string) => {
    if (!userEmail) {
      onLoginClick?.();
      return;
    }
    try {
      const newEnquiry = {
        client_name: userName || userEmail.split('@')[0],
        phone: 'Not provided', // In a real app, get this from user profile
        email: userEmail,
        property_id: property.id,
        property_name: property.name,
        property_type: property.type,
        location: property.details?.location || property.details?.city || 'Unknown',
        enquiry_type: type,
        source: 'Client Portal'
      };
      
      await api.createEnquiry(newEnquiry);
      fetchEnquiries(); // Refresh the list
      
      alert(`Enquiry sent successfully! A partner will contact you soon.`);
      setSelectedProperty(null);
    } catch (error) {
      console.error('Failed to send enquiry:', error);
      alert('Failed to send enquiry. Please try again.');
    }
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.details?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.details?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    const currentCat = activeTab === 'Home' ? landingCategory : projectCategory;

    if (currentCat === 'Apartments' || currentCat === 'Projects') matchesCategory = p.type === 'Residential';
    else if (currentCat === 'Villas') matchesCategory = p.type === 'Residential';
    else if (currentCat === 'Resale') matchesCategory = p.type === 'Re-Sale';
    else if (currentCat === 'Plots') matchesCategory = p.type === 'Plot';
    else if (currentCat === 'Farm Lands') matchesCategory = p.type === 'Farm Land';
    else if (currentCat === 'Commercial') matchesCategory = p.type === 'Commercial';

    let matchesFilters = true;
    
    if (filters.location && p.details?.city?.toLowerCase() !== filters.location.toLowerCase()) {
      matchesFilters = false;
    }

    if (filters.trendingArea && p.details?.location?.toLowerCase() !== filters.trendingArea.toLowerCase()) {
      matchesFilters = false;
    }

    const activeConfigCat = currentCat === 'Projects' ? 'Apartments' : currentCat;
    
    if (activeConfigCat === 'Apartments') {
      if (adminConfig.Apartments.enableBHK && filters.bhk && p.details?.bhk !== filters.bhk) matchesFilters = false;
      if (adminConfig.Apartments.enablePrice && (filters.priceMin !== 2500000 || filters.priceMax !== 250000000)) {
        const price = Number.parseInt(p.details?.price) || 0;
        if (price < filters.priceMin || price > filters.priceMax) matchesFilters = false;
      }
      if (adminConfig.Apartments.enablePossession && filters.possession && p.details?.possession !== filters.possession) matchesFilters = false;
    } else if (activeConfigCat === 'Villas') {
      if (adminConfig.Villas.enableBHK && filters.bhk && p.details?.bhk !== filters.bhk) matchesFilters = false;
      if (adminConfig.Villas.enablePrice && (filters.priceMin !== 2500000 || filters.priceMax !== 250000000)) {
        const price = Number.parseInt(p.details?.price) || 0;
        if (price < filters.priceMin || price > filters.priceMax) matchesFilters = false;
      }
      if (adminConfig.Villas.enableGated && filters.gated && p.details?.gated !== filters.gated) matchesFilters = false;
    } else if (activeConfigCat === 'Resale') {
      if (adminConfig.Resale.enableAge && filters.age && p.details?.age !== filters.age) matchesFilters = false;
      if (adminConfig.Resale.enableFurnishing && filters.furnishing && p.details?.furnishing !== filters.furnishing) matchesFilters = false;
      if (adminConfig.Resale.enableOwnership && filters.ownership && p.details?.ownership !== filters.ownership) matchesFilters = false;
    } else if (activeConfigCat === 'Plots') {
      if (adminConfig.Plots.enableSize && filters.size && p.details?.size !== filters.size) matchesFilters = false;
      if (adminConfig.Plots.enableApproval && filters.approval && p.details?.approval !== filters.approval) matchesFilters = false;
      if (adminConfig.Plots.enableCorner && filters.corner && p.details?.corner !== filters.corner) matchesFilters = false;
    } else if (activeConfigCat === 'Commercial') {
      if (adminConfig.Commercial.enableType && filters.type && p.details?.commercialType !== filters.type) matchesFilters = false;
      if (adminConfig.Commercial.enableTransaction && filters.transaction && p.details?.transaction !== filters.transaction) matchesFilters = false;
      if (adminConfig.Commercial.enableArea && filters.area && p.details?.area !== filters.area) matchesFilters = false;
    }

    return matchesSearch && matchesCategory && matchesFilters;
  });

  return (
    <React.Fragment>
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sticky nav wrapper — banner + header stick together (not in projects view) */}
      <div className={`${activeTab === 'Projects' ? '' : 'sticky top-0'} z-50`}>
        {/* Coming Soon Banner */}
        <AnimatePresence>
          {showComingSoonBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg shrink-0">🚀</span>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">
                      We're launching in <span className="underline decoration-dotted">{selectedCity}</span> soon!
                    </p>
                    <p className="text-violet-200 text-xs mt-0.5">Currently serving Hyderabad. Be the first to know when we expand.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowComingSoonBanner(false); setSelectedCity('Hyderabad'); setFilters(prev => ({ ...prev, location: '' })); }}
                  className="shrink-0 p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/20 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Navigation */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
        {/* Top Bar */}
        <div className="px-4 md:px-6 py-3 flex justify-between items-center">
          {/* Left: Logo + City selector */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="shrink-0 focus:outline-none"
              aria-label="Go to home"
            >
              <Logo className="h-8" animated={true} />
            </button>
            {/* City selector pill — matches nav pill style */}
            <div className="relative">
              <div className="flex items-center gap-1.5 pl-3 pr-2 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/60 shadow-sm transition-colors cursor-pointer group">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={e => {
                    const city = e.target.value;
                    setSelectedCity(city);
                    if (city && city !== 'Hyderabad') {
                      setShowComingSoonBanner(true);
                      setFilters(prev => ({ ...prev, location: '' }));
                    } else {
                      setShowComingSoonBanner(false);
                      setFilters(prev => ({ ...prev, location: city }));
                      if (city) setActiveTab('Projects');
                    }
                  }}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer appearance-none pr-5 max-w-[110px] md:max-w-[140px]"
                >
                  {CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none absolute right-2" />
              </div>
            </div>
          </div>

          {/* Center: Search bar (only visible when logged in, md+) */}
          {userEmail && (
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2"
                  placeholder="Search properties, locations, or projects..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (activeTab !== 'Projects') setActiveTab('Projects');
                  }}
                />
              </div>
            </div>
          )}

          {/* Right: Get in touch + Auth + Hamburger */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Get in touch — WhatsApp */}
            <a
              href="https://wa.me/919885500336"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Get in touch
            </a>

            {/* Buy / Sell toggle */}
            <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
              <button
                onClick={() => setActiveTab('Projects')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'Projects'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Buy
              </button>
              <a
                href="https://wa.me/919885500336?text=Hi%2C%20I%20want%20to%20list%20my%20property%20on%20Howzy"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-slate-500 hover:text-slate-700 hover:bg-white"
              >
                Sell
              </a>
            </div>

            {userEmail ? (
              /* Logged-in: bell + avatar + standalone hamburger */
              <div className="flex items-center gap-2 md:gap-3">
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    data-testid={TEST_IDS.PORTAL.NOTIFICATIONS_BELL}
                    className="p-2 text-slate-500 hover:text-indigo-600 transition-colors relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => n.unread).length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                        data-testid={TEST_IDS.PORTAL.NOTIFICATIONS_PANEL}
                      >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <h3 className="font-bold text-slate-900">Notifications</h3>
                          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                            {notifications.filter(n => n.unread).length} New
                          </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notification.unread ? 'bg-indigo-50/30' : ''}`}
                                  onClick={() => {
                                    setNotifications(notifications.map(n => n.id === notification.id ? { ...n, unread: false } : n));
                                  }}
                                >
                                  <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 text-indigo-600">
                                      <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-bold text-slate-900">{notification.title}</h4>
                                        <span className="text-xs text-slate-500">{notification.time}</span>
                                      </div>
                                      <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-500">
                              <Bell className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                              <p className="text-sm">No notifications yet</p>
                            </div>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-slate-100 text-center bg-slate-50/50">
                            <button
                              onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                              data-testid={TEST_IDS.PORTAL.NOTIFICATIONS_MARK_ALL_READ}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AvatarDropdown
                  userName={userName}
                  onEditProfile={() => setIsProfileEditOpen(true)}
                  onLogout={onLogout}
                />
                {/* Hamburger for logged-in users */}
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(true); }}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {/* AI chat trigger — desktop only, sits alongside the menu toggle.
                    Hold to record, release to send. */}
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); onAIPressStart(); }}
                  onPointerUp={onAIPressEnd}
                  onPointerLeave={onAIPressEnd}
                  onPointerCancel={onAIPressEnd}
                  style={{ touchAction: 'none' }}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-colors select-none"
                  aria-label="Hold to talk to Howzy AI"
                  title="Hold to talk"
                >
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-wider">AI</span>
                </button>
              </div>
            ) : (
              /* Logged-out: Login + ☰ pill on desktop, hamburger-only on mobile */
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button
                    type="button"
                    data-testid={TEST_IDS.PORTAL.LOGIN_BTN}
                    onClick={onLoginClick}
                    className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Login
                  </button>
                  <div className="hidden sm:block w-px h-6 bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(true); }}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                {/* AI chat trigger — desktop only, sits alongside the menu toggle.
                    Hold to record, release to send. */}
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); onAIPressStart(); }}
                  onPointerUp={onAIPressEnd}
                  onPointerLeave={onAIPressEnd}
                  onPointerCancel={onAIPressEnd}
                  style={{ touchAction: 'none' }}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-sm transition-colors select-none"
                  aria-label="Hold to talk to Howzy AI"
                  title="Hold to talk"
                >
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-bold tracking-wider">AI</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      </div>{/* end sticky nav wrapper */}

      {/* Hamburger Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 z-[60] backdrop-blur-sm"
              onClick={() => { setIsMobileMenuOpen(false); setMobileSubMenu(null); }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-white z-[70] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setMobileSubMenu(null); setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="focus:outline-none"
                  aria-label="Go to home"
                >
                  <Logo className="h-8" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setMobileSubMenu(null); }}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto">

                {/* Login — drawer entry, only when logged out */}
                {!userEmail && (
                  <button
                    type="button"
                    data-testid={TEST_IDS.PORTAL.LOGIN_BTN}
                    onClick={() => { setIsMobileMenuOpen(false); onLoginClick?.(); }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-slate-100"
                  >
                    <User className="w-4 h-4" />
                    Login / Sign up
                  </button>
                )}

                {/* User status card — shown only when logged in */}
                {userEmail && (
                  <div className="mx-4 my-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{userName || 'My Account'}</p>
                      <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                    </div>
                  </div>
                )}

                {/* All Properties — collapsible when logged in, always expanded when logged out */}
                <div className="border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (userEmail) {
                        setMobileSubMenu(prev => prev === 'properties' ? null : 'properties');
                      } else {
                        setIsMobileMenuOpen(false); setActiveTab('Projects'); setProjectCategory('All'); setFilters(prev => ({ ...prev, trendingArea: '' })); window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <span className="flex-1 text-left">All Properties</span>
                    {userEmail && <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileSubMenu === 'properties' ? 'rotate-180' : ''}`} />}
                  </button>
                  <div className={`bg-slate-50 ${userEmail && mobileSubMenu !== 'properties' ? 'hidden' : ''}`}>
                    {[
                      { label: 'New Projects', icon: Building2 },
                      { label: 'Villas', icon: Home },
                      { label: 'Resale Homes', icon: RefreshCw },
                      { label: 'Open Plots', icon: Map },
                      { label: 'Farm Lands', icon: Trees },
                      { label: 'Commercial', icon: Briefcase },
                    ].map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigateToPropertyCategory(label)}
                        className="w-full flex items-center gap-3 px-8 py-3 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <button
                  type="button"
                  onClick={() => navigateFromMenu('Services')}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  Services
                </button>

                {/* About */}
                <button
                  type="button"
                  onClick={() => navigateFromMenu('About')}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <Shield className="w-4 h-4 text-indigo-500" />
                  About
                </button>

                {/* My Account — collapsible when logged in */}
                {userEmail && (
                  <div className="border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setMobileSubMenu(prev => prev === 'account' ? null : 'account')}
                      className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-indigo-500" />
                      <span className="flex-1 text-left">My Account</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${mobileSubMenu === 'account' ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileSubMenu === 'account' && (
                      <div className="bg-slate-50">
                        <button
                          type="button"
                          onClick={() => { setIsMobileMenuOpen(false); setActiveTab('Dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="w-full flex items-center gap-3 px-8 py-3 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          My Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsMobileMenuOpen(false); setIsProfileEditOpen(true); }}
                          className="w-full flex items-center gap-3 px-8 py-3 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <User className="w-3.5 h-3.5" />
                          My Profile
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Logout — inside body, only when logged in */}
                {userEmail && (
                  <button
                    type="button"
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border-b border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                )}
              </div>

              {/* Drawer Footer — social media */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 text-center mb-3">Follow us</p>
                <div className="flex items-center justify-center gap-3">
                  {/* LinkedIn */}
                  <a href="https://www.linkedin.com/company/howzy" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                    className="group flex flex-col items-center gap-1.5">
                    <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-600 group-hover:shadow-sm transition-all">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="4"/><path fill="white" d="M7 10h2v7H7v-7zm1-3a1.1 1.1 0 1 1 0 2.2A1.1 1.1 0 0 1 8 7zm4 3h1.9v1h.02C14.27 10.4 15.1 10 16 10c2.1 0 2.5 1.4 2.5 3.1V17H16.5v-3.5c0-.8-.01-1.9-1.15-1.9-1.16 0-1.34.9-1.34 1.84V17H12v-7z"/></svg>
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">LinkedIn</span>
                  </a>
                  {/* Instagram */}
                  <a href="https://www.instagram.com/howzy.in" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="group flex flex-col items-center gap-1.5">
                    <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:border-pink-300 group-hover:text-pink-500 group-hover:shadow-sm transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <rect width="18" height="18" x="3" y="3" rx="5" ry="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                      </svg>
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">Instagram</span>
                  </a>
                  {/* YouTube */}
                  <a href="https://www.youtube.com/@howzy" target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="group flex flex-col items-center gap-1.5">
                    <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 group-hover:border-red-300 group-hover:text-red-500 group-hover:shadow-sm transition-all">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">YouTube</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8 pb-32 md:pb-8">
        {selectedProperty && (
          <ProjectDetailsPage
            property={selectedProperty}
            similar={properties
              .filter(p =>
                p.id !== selectedProperty.id &&
                p.type === selectedProperty.type &&
                (
                  !selectedProperty.details?.city ||
                  !p.details?.city ||
                  String(p.details.city).toLowerCase() === String(selectedProperty.details.city).toLowerCase() ||
                  String(p.details?.location || '').toLowerCase() === String(selectedProperty.details?.location || '').toLowerCase()
                )
              )
              .slice(0, 6)}
            savedIds={savedProperties}
            onSave={handleSaveProperty}
            onSelectSimilar={(p) => { setSelectedProperty(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onBack={() => setSelectedProperty(null)}
            onEnquiry={handleEnquiry}
          />
        )}
        {!selectedProperty && (<>
        {activeTab === 'Home' && (
          <div className="space-y-12 md:space-y-16 pb-12">
            {/* Category Selector */}
            <div className="-mx-4 px-4 md:-mx-10 md:px-10">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-sm px-4 md:px-8">
                <div className="flex gap-2 md:gap-6 overflow-x-auto py-4 scrollbar-hide md:justify-center">
                  {[
                    { id: 'All', name: 'Explore All', icon: Sparkles, color: 'indigo' },
                    { id: 'Projects', name: 'New Projects', icon: Building2, color: 'blue' },
                    { id: 'Resale', name: 'Resale Homes', icon: RefreshCw, color: 'emerald' },
                    { id: 'Plots', name: 'Open Plots', icon: Map, color: 'amber' },
                    { id: 'Farm Lands', name: 'Farm Lands', icon: Trees, color: 'green' },
                    { id: 'Commercial', name: 'Commercial', icon: Briefcase, color: 'purple' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setLandingCategory(cat.id as any)}
                      data-testid={TEST_IDS.PORTAL.CATEGORY_FILTER(cat.id)}
                      className={`flex flex-col items-center gap-2 min-w-fit transition-all relative group pb-2 pt-1 px-3 ${
                        landingCategory === cat.id
                          ? 'text-indigo-600'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <cat.icon className={`w-6 h-6 transition-transform duration-300 ${
                        landingCategory === cat.id ? 'scale-110' : 'group-hover:scale-110'
                      }`} />
                      <span className={`text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                        landingCategory === cat.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                      }`}>
                        {cat.name}
                      </span>
                      {landingCategory === cat.id && (
                        <motion.div
                          layoutId="activeLandingTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={landingCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-12 md:space-y-16"
              >
                {/* Smart Hero Section */}
                <DynamicHero category={landingCategory} onSearch={setSearchTerm} onExplore={() => setActiveTab('Projects')} />

                {/* Why This Category (Dynamic USPs) */}
                <DynamicUSPs category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Trending Locations */}
                <TrendingLocations
                  category={landingCategory}
                  onExploreMap={() => {
                    setActiveTab('Projects');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onLocationClick={(loc) => {
                    const catMap: Record<string, string> = {
                      All: 'All', Resale: 'Resale', Projects: 'All',
                      Plots: 'Plots', Commercial: 'Commercial', 'Farm Lands': 'Farm Lands'
                    };
                    setProjectCategory((catMap[landingCategory] || 'All') as any);
                    setFilters(prev => ({
                      ...prev,
                      trendingArea: loc,
                      location: '', bhk: '', priceRange: '', possession: '',
                      gated: '', age: '', furnishing: '', ownership: '',
                      size: '', approval: '', corner: '', type: '', transaction: '', area: ''
                    }));
                    setActiveTab('Projects');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Trending Projects */}
                <TrendingProjects category={landingCategory} />

                {landingCategory !== 'All' && (
                  <>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <FeaturedOpportunities 
                      category={landingCategory} 
                      properties={properties} 
                      savedProperties={savedProperties}
                      onSave={handleSaveProperty}
                      onSelect={setSelectedProperty}
                    />
                  </>
                )}

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Lifestyle / Use Case Section */}
                <LifestyleSection category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Process Section */}
                <ProcessSection category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* ROI / Investment Insights */}
                <ROIInsights category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Trust + Verification */}
                <TrustSection />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Dynamic Testimonials */}
                <DynamicTestimonials category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* FAQ Section */}
                <CategoryFAQs category={landingCategory} />

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                {/* Strong Closing CTA */}
                <div className="pt-4">
                  <ClosingCTA category={landingCategory} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'Projects' && (
          <div className="space-y-8">
            {projectCategory === 'All' && !filters.trendingArea ? (
              <div className="space-y-16">
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Explore All Properties</h2>
                  <p className="text-lg text-slate-600">Discover our handpicked selection of premium real estate across all categories.</p>
                </div>

                {propertyCategories.map(cat => {
                  const catProps = properties.filter(p => {
                    if (cat.id === 'Apartments') return p.type === 'Residential' && (!p.details?.propertyType || p.details?.propertyType?.toLowerCase().includes('apartment') || p.details?.propertyType?.toLowerCase().includes('flat'));
                    if (cat.id === 'Villas') return p.type === 'Residential' && p.details?.propertyType?.toLowerCase().includes('villa');
                    if (cat.id === 'Resale') return p.type === 'Re-Sale';
                    if (cat.id === 'Plots') return p.type === 'Plot';
                    if (cat.id === 'Farm Lands') return p.type === 'Farm Land';
                    if (cat.id === 'Commercial') return p.type === 'Commercial';
                    return false;
                  });

                  // Fallback if specific filtering yields nothing but we have generic matches
                  const displayProps = catProps.length > 0 ? catProps : properties.filter(p => {
                    if (cat.id === 'Apartments' || cat.id === 'Villas') return p.type === 'Residential';
                    if (cat.id === 'Resale') return p.type === 'Re-Sale';
                    if (cat.id === 'Plots') return p.type === 'Plot';
                    if (cat.id === 'Farm Lands') return p.type === 'Farm Land';
                    if (cat.id === 'Commercial') return p.type === 'Commercial';
                    return false;
                  });

                  return (
                    <div key={cat.id} className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 bg-${cat.color}-50 text-${cat.color}-600 rounded-xl flex items-center justify-center`}>
                            <cat.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900">{cat.title}</h3>
                            <p className="text-sm text-slate-500">{cat.subtitle}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setProjectCategory(cat.id as any)}
                          className={`hidden sm:flex text-sm font-bold text-${cat.color}-600 hover:text-${cat.color}-700 items-center gap-1 bg-${cat.color}-50 px-4 py-2 rounded-lg transition-colors`}
                        >
                          View All <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {displayProps.length > 0 ? (
                        <>
                          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                            {displayProps.slice(0, 6).map(property => (
                              <div key={property.id} className="min-w-[280px] md:min-w-[340px] max-w-[340px] shrink-0">
                                <PropertyCard 
                                  property={property} 
                                  isSaved={savedProperties.includes(property.id)}
                                  onSave={() => handleSaveProperty(property.id)}
                                  onClick={() => setSelectedProperty(property)}
                                  category={cat.id}
                                />
                              </div>
                            ))}
                            {displayProps.length > 6 && (
                              <div className="min-w-[200px] shrink-0 flex items-center justify-center">
                                <button 
                                  onClick={() => setProjectCategory(cat.id as any)}
                                  className={`flex flex-col items-center gap-3 text-${cat.color}-600 hover:text-${cat.color}-700 transition-colors group`}
                                >
                                  <div className={`w-16 h-16 rounded-full bg-${cat.color}-50 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <ArrowRight className="w-6 h-6" />
                                  </div>
                                  <span className="font-bold">View {displayProps.length - 6} More</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => setProjectCategory(cat.id as any)}
                            className={`sm:hidden w-full text-sm font-bold text-${cat.color}-600 hover:text-${cat.color}-700 flex items-center justify-center gap-1 bg-${cat.color}-50 px-4 py-3 rounded-xl transition-colors`}
                          >
                            View All {cat.title} <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 text-center">
                          <div className={`w-12 h-12 bg-${cat.color}-100 text-${cat.color}-600 rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <cat.icon className="w-6 h-6" />
                          </div>
                          <h4 className="text-slate-900 font-bold mb-1">No {cat.title} Available</h4>
                          <p className="text-sm text-slate-500">Check back later for new listings in this category.</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* If no properties at all, show the categories grid as fallback */}
                {properties.length === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {propertyCategories.map(cat => (
                      <motion.div 
                        key={cat.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setProjectCategory(cat.id as any)}
                        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className={`w-14 h-14 bg-${cat.color}-50 text-${cat.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                          <cat.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{cat.title}</h3>
                        <p className="text-slate-500 mb-6">{cat.subtitle}</p>
                        <button className={`text-${cat.color}-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all`}>
                          View {cat.title} <ArrowRight className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* PRO VERSION ADD-ONS */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Trending in Villas</h4>
                      <p className="text-sm text-slate-600">Most viewed this week</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Premium Properties</h4>
                      <p className="text-sm text-slate-600">Luxury handpicked homes</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <Tag className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Best Deals</h4>
                      <p className="text-sm text-slate-600">Price dropped recently</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <button 
                    onClick={() => { setProjectCategory('All'); setFilters(prev => ({ ...prev, trendingArea: '' })); }}
                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {projectCategory === 'All' ? 'All Properties' : propertyCategories.find(c => c.id === projectCategory)?.title}
                    </h2>
                    <p className="text-slate-500">
                      {filters.trendingArea ? `Showing results in ${filters.trendingArea}` : `Filter and browse available ${projectCategory === 'All' ? 'properties' : projectCategory.toLowerCase()}`}
                    </p>
                  </div>
                </div>

                {/* Horizontal Scroll Tabs for quick switching */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {propertyCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setProjectCategory(cat.id as any)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                        projectCategory === cat.id 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <cat.icon className="w-4 h-4" />
                      {cat.title}
                    </button>
                  ))}
                </div>

                {/* Sentinel for stuck detection */}
                <div ref={filterSentinelRef} className="h-0" />

                {/* Sticky Filters */}
                <div className={`sticky top-0 z-40 transition-all duration-200 ${isFilterStuck ? '-ml-[calc(50vw-50%)] -mr-[calc(50vw-50%)] px-[calc(50vw-50%)] bg-white border-b border-slate-200 shadow-sm' : 'bg-white rounded-xl border border-slate-200'}`}>
                  <div className="max-w-7xl mx-auto px-4 md:px-10 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm shrink-0">
                        <Filter className="w-4 h-4 text-indigo-600" /> Filters
                      </h3>
                    {/* Common Search */}
                    <div className="relative shrink-0 w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search specific area..." 
                        className="bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-48"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Location Filter */}
                    <FilterDropdown
                      label="Location"
                      value={filters.location}
                      options={[
                        { value: 'Hyderabad', label: 'Hyderabad' },
                        { value: 'Bangalore', label: 'Bangalore' },
                        { value: 'Pune', label: 'Pune' },
                        { value: 'Noida', label: 'Noida' },
                        { value: 'Mumbai', label: 'Mumbai' },
                      ]}
                      onChange={(val: string) => setFilters({...filters, location: val})}
                      isOpen={openFilter === 'location'}
                      onToggle={() => setOpenFilter(openFilter === 'location' ? null : 'location')}
                    />

                    {/* Dynamic Filters based on category */}
                    {projectCategory === 'Apartments' && (
                      <>
                        {adminConfig.Apartments.enableBHK && (
                          <FilterDropdown
                            label="BHK Preference"
                            value={filters.bhk}
                            options={[
                              { value: '1', label: '1 BHK' },
                              { value: '2', label: '2 BHK' },
                              { value: '3', label: '3 BHK' },
                              { value: '4+', label: '4+ BHK' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, bhk: val})}
                            isOpen={openFilter === 'apt-bhk'}
                            onToggle={() => setOpenFilter(openFilter === 'apt-bhk' ? null : 'apt-bhk')}
                          />
                        )}

                        {adminConfig.Apartments.enablePossession && (
                          <FilterDropdown
                            label="Possession"
                            value={filters.possession}
                            options={[
                              { value: 'ready', label: 'Ready to Move' },
                              { value: 'under_construction', label: 'Under Construction' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, possession: val})}
                            isOpen={openFilter === 'apt-possession'}
                            onToggle={() => setOpenFilter(openFilter === 'apt-possession' ? null : 'apt-possession')}
                          />
                        )}
                        {adminConfig.Apartments.enablePrice && (
                          <BudgetRangeSlider
                            minVal={filters.priceMin} maxVal={filters.priceMax}
                            onChange={(min, max) => setFilters({...filters, priceMin: min, priceMax: max})}
                          />
                        )}
                      </>
                    )}

                    {projectCategory === 'Villas' && (
                      <>
                        {adminConfig.Villas.enableBHK && (
                          <FilterDropdown
                            label="BHK Preference"
                            value={filters.bhk}
                            options={[
                              { value: '3', label: '3 BHK' },
                              { value: '4', label: '4 BHK' },
                              { value: '5+', label: '5+ BHK' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, bhk: val})}
                            isOpen={openFilter === 'villa-bhk'}
                            onToggle={() => setOpenFilter(openFilter === 'villa-bhk' ? null : 'villa-bhk')}
                          />
                        )}

                        {adminConfig.Villas.enablePrice && (
                          <BudgetRangeSlider
                            minVal={filters.priceMin} maxVal={filters.priceMax}
                            onChange={(min, max) => setFilters({...filters, priceMin: min, priceMax: max})}
                          />
                        )}
                        {adminConfig.Villas.enableGated && (
                          <FilterDropdown
                            label="Gated Community"
                            value={filters.gated}
                            options={[
                              { value: 'yes', label: 'Yes' },
                              { value: 'no', label: 'No' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, gated: val})}
                            isOpen={openFilter === 'villa-gated'}
                            onToggle={() => setOpenFilter(openFilter === 'villa-gated' ? null : 'villa-gated')}
                          />
                        )}
                      </>
                    )}

                    {projectCategory === 'Resale' && (
                      <>
                        {adminConfig.Resale.enableAge && (
                          <FilterDropdown
                            label="Property Age"
                            value={filters.age}
                            options={[
                              { value: '0-1', label: 'Under 1 Year' },
                              { value: '1-5', label: '1 - 5 Years' },
                              { value: '5-10', label: '5 - 10 Years' },
                              { value: '10+', label: '10+ Years' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, age: val})}
                            isOpen={openFilter === 'resale-age'}
                            onToggle={() => setOpenFilter(openFilter === 'resale-age' ? null : 'resale-age')}
                          />
                        )}
                        {adminConfig.Resale.enableFurnishing && (
                          <FilterDropdown
                            label="Furnishing"
                            value={filters.furnishing}
                            options={[
                              { value: 'full', label: 'Fully Furnished' },
                              { value: 'semi', label: 'Semi Furnished' },
                              { value: 'unfurnished', label: 'Unfurnished' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, furnishing: val})}
                            isOpen={openFilter === 'resale-furnishing'}
                            onToggle={() => setOpenFilter(openFilter === 'resale-furnishing' ? null : 'resale-furnishing')}
                          />
                        )}
                        {adminConfig.Resale.enableOwnership && (
                          <FilterDropdown
                            label="Ownership Type"
                            value={filters.ownership}
                            options={[
                              { value: 'freehold', label: 'Freehold' },
                              { value: 'leasehold', label: 'Leasehold' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, ownership: val})}
                            isOpen={openFilter === 'resale-ownership'}
                            onToggle={() => setOpenFilter(openFilter === 'resale-ownership' ? null : 'resale-ownership')}
                          />
                        )}
                      </>
                    )}

                    {projectCategory === 'Plots' && (
                      <>
                        {adminConfig.Plots.enableSize && (
                          <FilterDropdown
                            label="Plot Size"
                            value={filters.size}
                            options={[
                              { value: '0-150', label: 'Under 150 sq.yd' },
                              { value: '150-300', label: '150 - 300 sq.yd' },
                              { value: '300-500', label: '300 - 500 sq.yd' },
                              { value: '500+', label: 'Above 500 sq.yd' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, size: val})}
                            isOpen={openFilter === 'plots-size'}
                            onToggle={() => setOpenFilter(openFilter === 'plots-size' ? null : 'plots-size')}
                          />
                        )}
                        {adminConfig.Plots.enableApproval && (
                          <FilterDropdown
                            label="Approval Type"
                            value={filters.approval}
                            options={[
                              { value: 'hmda', label: 'HMDA Approved' },
                              { value: 'dtcp', label: 'DTCP Approved' },
                              { value: 'rera', label: 'RERA Approved' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, approval: val})}
                            isOpen={openFilter === 'plots-approval'}
                            onToggle={() => setOpenFilter(openFilter === 'plots-approval' ? null : 'plots-approval')}
                          />
                        )}
                        {adminConfig.Plots.enableCorner && (
                          <FilterDropdown
                            label="Corner Plot"
                            value={filters.corner}
                            options={[
                              { value: 'yes', label: 'Yes' },
                              { value: 'no', label: 'No' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, corner: val})}
                            isOpen={openFilter === 'plots-corner'}
                            onToggle={() => setOpenFilter(openFilter === 'plots-corner' ? null : 'plots-corner')}
                          />
                        )}
                      </>
                    )}

                    {projectCategory === 'Commercial' && (
                      <>
                        {adminConfig.Commercial.enableType && (
                          <FilterDropdown
                            label="Property Type"
                            value={filters.type}
                            options={[
                              { value: 'office', label: 'Office Space' },
                              { value: 'shop', label: 'Shop / Retail' },
                              { value: 'warehouse', label: 'Warehouse' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, type: val})}
                            isOpen={openFilter === 'commercial-type'}
                            onToggle={() => setOpenFilter(openFilter === 'commercial-type' ? null : 'commercial-type')}
                          />
                        )}
                        {adminConfig.Commercial.enableTransaction && (
                          <FilterDropdown
                            label="Transaction Type"
                            value={filters.transaction}
                            options={[
                              { value: 'sale', label: 'For Sale' },
                              { value: 'rent', label: 'For Rent' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, transaction: val})}
                            isOpen={openFilter === 'commercial-transaction'}
                            onToggle={() => setOpenFilter(openFilter === 'commercial-transaction' ? null : 'commercial-transaction')}
                          />
                        )}
                        {adminConfig.Commercial.enableArea && (
                          <FilterDropdown
                            label="Area Size"
                            value={filters.area}
                            options={[
                              { value: '0-1000', label: 'Under 1,000 sq.ft' },
                              { value: '1000-5000', label: '1,000 - 5,000 sq.ft' },
                              { value: '5000+', label: 'Above 5,000 sq.ft' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, area: val})}
                            isOpen={openFilter === 'commercial-area'}
                            onToggle={() => setOpenFilter(openFilter === 'commercial-area' ? null : 'commercial-area')}
                          />
                        )}
                      </>
                    )}

                    {projectCategory === 'Farm Lands' && (
                      <>
                        {adminConfig.FarmLands?.enableSize && (
                          <FilterDropdown
                            label="Land Size"
                            value={filters.size}
                            options={[
                              { value: '0-1', label: 'Under 1 Acre' },
                              { value: '1-5', label: '1 - 5 Acres' },
                              { value: '5-10', label: '5 - 10 Acres' },
                              { value: '10+', label: 'Above 10 Acres' },
                            ]}
                            onChange={(val: string) => setFilters({...filters, size: val})}
                            isOpen={openFilter === 'farm-size'}
                            onToggle={() => setOpenFilter(openFilter === 'farm-size' ? null : 'farm-size')}
                          />
                        )}

                        {adminConfig.FarmLands?.enablePrice && (
                          <BudgetRangeSlider
                            minVal={filters.priceMin} maxVal={filters.priceMax}
                            onChange={(min, max) => setFilters({...filters, priceMin: min, priceMax: max})}
                          />
                        )}
                      </>
                    )}
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setProjectCategory('All');
                          setFilters({
                            location: '', bhk: '', priceRange: '', priceMin: 2500000, priceMax: 250000000, possession: '', gated: '', age: '', 
                            furnishing: '', ownership: '', size: '', approval: '', corner: '', 
                            type: '', transaction: '', area: '', trendingArea: ''
                          });
                        }}
                        className="text-sm text-indigo-600 font-medium hover:underline ml-auto shrink-0"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>{/* end sticky white card inner */}
                </div>{/* end sticky bar */}

                {/* Trending Locations */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Trending Locations</h3>
                  <div className="flex flex-wrap gap-2">
                    {(projectCategory === 'Apartments' || projectCategory === 'Villas' ? ['Kokapet', 'Kondapur', 'Neopolis', 'Gachibowli', 'Tellapur'] :
                      projectCategory === 'Resale' ? ['Kondapur', 'Gachibowli', 'Madhapur', 'Jubilee Hills'] :
                      projectCategory === 'Plots' ? ['Shadnagar', 'Sadashivpet', 'Maheshwaram', 'Choutuppal'] :
                      projectCategory === 'Farm Lands' ? ['Moinabad', 'Chevella', 'Shankarpalli', 'Bhongir'] :
                      projectCategory === 'Commercial' ? ['Financial District', 'HITEC City', 'Madhapur', 'Gachibowli'] :
                      ['Kokapet', 'Kondapur', 'Neopolis', 'Gachibowli', 'Tellapur']
                    ).map(loc => (
                      <button
                        key={loc}
                        onClick={() => setFilters({...filters, trendingArea: loc})}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          filters.trendingArea === loc 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listings */}
                {(propertiesLoading || filtersLoading) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="projects-loading-skeleton">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                        <div className="h-48 bg-slate-200" />
                        <div className="p-5 space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                          <div className="h-3 bg-slate-100 rounded w-2/3" />
                          <div className="flex gap-2 pt-2">
                            <div className="h-6 bg-slate-100 rounded-full w-16" />
                            <div className="h-6 bg-slate-100 rounded-full w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredProperties.map(property => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      isSaved={savedProperties.includes(property.id)}
                      onSave={() => handleSaveProperty(property.id)}
                      onClick={() => setSelectedProperty(property)}
                      category={projectCategory}
                    />
                  ))}
                  {filteredProperties.length === 0 && (
                    <div className="col-span-3 p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No {projectCategory.toLowerCase()} found</h3>
                      <p className="text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Dashboard' && userEmail && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {userName ? `Welcome back, ${userName}! 👋` : 'My Dashboard'}
              </h2>
              <p className="text-slate-500">Manage your properties, enquiries, and saved projects.</p>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-px">
              {['My Saved Projects', 'My Enquiries', 'My Listings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setDashboardTab(tab as any)}
                  className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
                    dashboardTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dashboard Content */}
            <div className="pt-4">
              {dashboardTab === 'My Saved Projects' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {properties.filter(p => savedProperties.includes(p.id)).map(property => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      isSaved={true}
                      onSave={() => handleSaveProperty(property.id)}
                      onClick={() => setSelectedProperty(property)}
                      category={property.type}
                    />
                  ))}
                  {savedProperties.length === 0 && (
                    <div className="col-span-3 p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <Heart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No saved properties</h3>
                      <p className="text-slate-500">Click the heart icon on a property to save it here.</p>
                      <button 
                        onClick={() => setActiveTab('Projects')}
                        className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        Browse Projects
                      </button>
                    </div>
                  )}
                </div>
              )}

              {dashboardTab === 'My Enquiries' && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold">Property</th>
                          <th className="p-4 font-semibold">Type</th>
                          <th className="p-4 font-semibold">Enquiry Date</th>
                          <th className="p-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {enquiries.length > 0 ? (
                          enquiries.map((enq) => (
                            <tr key={enq.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-slate-900">{enq.property_name}</div>
                                <div className="text-xs text-slate-500">{enq.property_id}</div>
                              </td>
                              <td className="p-4 text-slate-600">{enq.enquiry_type}</td>
                              <td className="p-4 text-slate-600">{new Date(enq.created_at).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  enq.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  enq.status === 'Contacted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  enq.status === 'Site Visit Scheduled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  enq.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {(enq.status === 'Closed' || enq.status === 'Approved') && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {enq.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                                  {enq.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                              You haven't made any enquiries yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {dashboardTab === 'My Listings' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <p className="text-slate-500">Manage properties you have uploaded.</p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { if (!userEmail) { onLoginClick?.(); return; } setIsResaleModalOpen(true); setResaleSubmitMsg(null); }}
                        className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Add Resale
                      </button>

                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Property Name</th>
                            <th className="p-4 font-semibold">Category</th>
                            <th className="p-4 font-semibold">Type</th>
                            <th className="p-4 font-semibold">Location</th>
                            <th className="p-4 font-semibold">Submitted Date</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {myListings.map((listing) => (
                            <tr key={`listing-${listing.id}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-slate-900">{listing.name}</div>
                                <div className="text-xs text-slate-500">ID: {listing.id}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">{listing.type === 'Farm Land' ? 'Farm Land' : 'Plot'}</span>
                              </td>
                              <td className="p-4 text-slate-600">{listing.type}</td>
                              <td className="p-4 text-slate-600">{listing.details?.location || listing.details?.city || 'N/A'}</td>
                              <td className="p-4 text-slate-600">{listing.date}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  listing.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  listing.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {listing.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {listing.status === 'Rejected' && <X className="w-3.5 h-3.5" />}
                                  {listing.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                                  {listing.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {myResaleListings.map((r: any) => {
                            const badgeCls = r.status === 'Listed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.status === 'Rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200';
                            return (
                              <tr key={`resale-${r.id}`} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                  <div className="font-medium text-slate-900">{r.title}</div>
                                  <div className="text-xs text-slate-500">{r.city || 'N/A'} · ₹{r.price}</div>
                                </td>
                                <td className="p-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium">Re-Sale</span>
                                </td>
                                <td className="p-4 text-slate-600">{r.propertyType}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badgeCls}`}>
                                    {r.status === 'Listed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {r.status === 'Rejected' && <X className="w-3.5 h-3.5" />}
                                    {r.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                                    {r.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2 flex-wrap">
                                    {r.status === 'Pending' && (
                                      <>
                                        <button
                                          data-testid={`edit-resale-${r.id}`}
                                          onClick={() => {
                                            setEditingResaleId(r.id);
                                            setResaleForm({
                                              title: r.title ?? '',
                                              description: r.description ?? '',
                                              price: r.price == null ? '' : String(r.price),
                                              propertyType: r.propertyType ?? 'Apartment',
                                              city: r.city ?? '',
                                              location: r.location ?? '',
                                              area: r.area ?? '',
                                              bedrooms: r.bedrooms == null ? '' : String(r.bedrooms),
                                              bathrooms: r.bathrooms == null ? '' : String(r.bathrooms),
                                              segment: r.segment ?? '',
                                              societyType: r.societyType ?? '',
                                              emiFrom: r.emiFrom ?? '',
                                              ownerName: r.ownerName ?? '',
                                              ownerPhone: r.ownerPhone ?? '',
                                              agentName: r.agentName ?? '',
                                              agentPhone: r.agentPhone ?? '',
                                              address: r.address ?? '',
                                              zone: r.zone ?? '',
                                              cluster: r.cluster ?? '',
                                              state: r.state ?? '',
                                              pincode: r.pincode ?? '',
                                              landmark: r.landmark ?? '',
                                              mapLink: r.mapLink ?? '',
                                              possession: r.possession ?? '',
                                              floor: r.floor == null ? '' : String(r.floor),
                                              totalFloors: r.totalFloors == null ? '' : String(r.totalFloors),
                                              floorPlan: r.floorPlan ?? '',
                                            });
                                            setFloorPlanFileName(r.floorPlan ? 'Existing floor plan' : '');
                                            setResaleSubmitMsg(null);
                                            setIsResaleModalOpen(true);
                                          }}
                                          className="px-3 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          data-testid={`delegate-resale-${r.id}`}
                                          onClick={() => {
                                            setDelegatingResaleId(r.id);
                                            setDelegateForm({ agentName: r.agentName ?? '', agentPhone: r.agentPhone ?? '' });
                                            setDelegateMsg(null);
                                            setIsDelegateModalOpen(true);
                                          }}
                                          className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                                        >
                                          Delegate
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {myListings.length === 0 && myResaleListings.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-500">
                                You haven't uploaded any properties yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Services' && (
          <div className="space-y-10">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
              <p className="text-lg text-slate-600">Comprehensive end-to-end support for all your property needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Loan Provisioning</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Get the best loan deals from top banks with our hassle-free loan provisioning service. We guide you through the entire process, ensuring you get the most favorable terms for your property investment.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Competitive interest rates', 'Quick approval process', 'Minimal documentation', 'Expert guidance'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2">
                  Apply for Loan <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Legal Verification</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Invest with confidence. All our properties undergo rigorous legal checks to ensure they are 100% verified and free from any encumbrances or disputes.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Title deed verification', 'Encumbrance certificate check', 'RERA/DTCP approval validation', 'Transparent documentation'].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-2">
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'About' && (
          <div className="space-y-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">About Howzy</h2>
              <p className="text-lg text-slate-600">Revolutionizing the real estate experience with trust, transparency, and technology.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Introduction</h3>
                <p className="text-slate-600 leading-relaxed">
                  Howzy is a premier proptech platform dedicated to simplifying property discovery, investment, and management. We bridge the gap between buyers, sellers, and trusted partners, offering a seamless and secure real estate journey.
                </p>
              </div>
              <div className="h-64 bg-slate-200 rounded-3xl overflow-hidden">
                <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Office" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                <h3 className="text-xl font-bold text-red-900 mb-4">Market Problems</h3>
                <ul className="space-y-3">
                  {['Lack of transparency in pricing and legalities', 'Fragmented property discovery process', 'Unverified listings and fraudulent agents', 'Complex loan and documentation procedures'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-red-800">
                      <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                <h3 className="text-xl font-bold text-emerald-900 mb-4">Our Solution</h3>
                <ul className="space-y-3">
                  {['100% verified properties with legal checks', 'Unified platform for all property types', 'Direct connection with trusted partners', 'End-to-end services including loans and legal'].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Map className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">NRI Investments</h3>
                <p className="text-slate-600 mb-6">
                  Dedicated support for NRIs to invest safely in Indian real estate with complete transparency and legal assistance.
                </p>
                <button className="text-blue-600 font-bold hover:underline">Explore NRI Services</button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Become a Trusted Partner</h3>
                <p className="text-slate-600 mb-6">
                  Join our network of verified builders, agents, and developers to reach a wider audience of serious buyers.
                </p>
                <button className="text-amber-600 font-bold hover:underline">Join Network</button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Careers</h3>
                <p className="text-slate-600 mb-6">
                  Be part of a dynamic team revolutionizing the proptech industry. Explore exciting career opportunities with us.
                </p>
                <button className="text-purple-600 font-bold hover:underline">View Openings</button>
              </div>
            </div>
          </div>
        )}
        </>)}

      </main>

      <Footer 
        config={footerConfig || adminConfig.footer}
        onCategoryClick={(cat: string) => {
          const mapping: Record<string, any> = {
            "Resale Homes": "Resale",
            "New Projects": "Projects",
            "Plots": "Plots",
            "Commercial Spaces": "Commercial",
            "Farm Lands": "Farm Lands"
          };
          setLandingCategory(mapping[cat] || "All");
          setActiveTab("Home");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onProjectFilterClick={(filter: string) => {
          setActiveTab("Projects");
          // In a real app, we'd set a filter state here
          setFilters(prev => ({ ...prev, type: filter === 'Trending Projects' ? 'Trending' : '' }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLocationClick={(loc: string) => {
          setActiveTab("Projects");
          setFilters(prev => ({ ...prev, location: loc }));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onServiceClick={(service: string) => {
          setActiveTab("Services");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCompanyClick={(item: string) => {
          if (item === 'About HOWZY') setActiveTab("About");
          else if (item === 'Careers') setActiveTab("About");
          else if (item === 'Contact' || item === 'Privacy Policy' || item === 'Terms & Conditions' || item === 'FAQs') setActiveTab("About");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAIClick={() => setIsAIOpen((n) => n + 1)}
        onAIPressStart={onAIPressStart}
        onAIPressEnd={onAIPressEnd}
      />

      <FarmLandOnboardingModal
        isOpen={isFarmLandModalOpen}
        onClose={() => setIsFarmLandModalOpen(false)}
        onSubmit={async (data) => {
          try {
            const submissionData = {
              type: 'Farm Land',
              name: data.farmLandName,
              email: userEmail || 'unknown@example.com',
              details: data
            };
            const res = await api.createSubmission(submissionData);
            setMyListings(prev => [{
              id: res.id,
              type: 'Farm Land',
              name: data.farmLandName,
              email: userEmail || 'unknown@example.com',
              status: 'Pending',
              date: new Date().toISOString().split('T')[0],
              details: data
            }, ...prev]);
          } catch (error) {
            console.error('Failed to create submission:', error);
          }
        }}
      />
      <PlotsOnboardingModal
        isOpen={isPlotsModalOpen}
        onClose={() => setIsPlotsModalOpen(false)}
        onSubmit={async (data) => {
          try {
            const submissionData = {
              type: 'Plot',
              name: data.projectName,
              email: userEmail || 'unknown@example.com',
              details: data
            };
            const res = await api.createSubmission(submissionData);
            setMyListings(prev => [{
              id: res.id,
              type: 'Plot',
              name: data.projectName,
              email: userEmail || 'unknown@example.com',
              status: 'Pending',
              date: new Date().toISOString().split('T')[0],
              details: data
            }, ...prev]);
          } catch (error) {
            console.error('Failed to create submission:', error);
          }
        }}
      />
    </div>

    {/* Resale Property Submission Modal */}
    <AnimatePresence>
      {isResaleModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setIsResaleModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingResaleId ? 'Edit Resale Property' : 'Submit Resale Property'}</h2>
                  <p className="text-sm text-slate-500">{editingResaleId ? 'Update your pending property details' : 'Our team will review and list it within 24–48 hrs'}</p>
                </div>
              </div>
              <button onClick={() => { setIsResaleModalOpen(false); setEditingResaleId(null); setResaleForm(INITIAL_RESALE_FORM); setFloorPlanFileName(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResaleSubmit} className="p-6 space-y-6">
              {resaleSubmitMsg && (
                <div className={`p-4 rounded-xl text-sm font-medium ${resaleSubmitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {resaleSubmitMsg.text}
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Basic Info</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="resale-title" className="block text-sm font-semibold text-slate-700 mb-1.5">Property Title *</label>
                    <input id="resale-title" required value={resaleForm.title} onChange={e => setResaleForm(f => ({...f, title: e.target.value}))}
                      placeholder="e.g. 3BHK Apartment in Kondapur"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-type" className="block text-sm font-semibold text-slate-700 mb-1.5">Property Type *</label>
                      <select id="resale-type" required value={resaleForm.propertyType} onChange={e => setResaleForm(f => ({...f, propertyType: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        {['Apartment','Villa','Plot','Farm Land','Commercial'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resale-segment" className="block text-sm font-semibold text-slate-700 mb-1.5">Segment</label>
                      <select id="resale-segment" value={resaleForm.segment} onChange={e => setResaleForm(f => ({...f, segment: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select Segment</option>
                        {['Premium','Economy','Super Luxury'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-society-type" className="block text-sm font-semibold text-slate-700 mb-1.5">Society Type</label>
                      <select id="resale-society-type" value={resaleForm.societyType} onChange={e => setResaleForm(f => ({...f, societyType: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select Society Type</option>
                        {['Gated Community','Semi Gated','Stand Alone','Villa Community','Ultra-Luxury Gated Community'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resale-price" className="block text-sm font-semibold text-slate-700 mb-1.5">Price *</label>
                      <input id="resale-price" required value={resaleForm.price} onChange={e => setResaleForm(f => ({...f, price: e.target.value}))}
                        placeholder="e.g. 8500000"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-emi" className="block text-sm font-semibold text-slate-700 mb-1.5">EMI From</label>
                      <input id="resale-emi" value={resaleForm.emiFrom} onChange={e => setResaleForm(f => ({...f, emiFrom: e.target.value}))}
                        placeholder="e.g. 20k/month"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label htmlFor="resale-area" className="block text-sm font-semibold text-slate-700 mb-1.5">Area (sq ft)</label>
                      <input id="resale-area" value={resaleForm.area} onChange={e => setResaleForm(f => ({...f, area: e.target.value}))}
                        placeholder="e.g. 1450"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-bedrooms" className="block text-sm font-semibold text-slate-700 mb-1.5">Bedrooms</label>
                      <input id="resale-bedrooms" type="number" min={1} max={10} value={resaleForm.bedrooms} onChange={e => setResaleForm(f => ({...f, bedrooms: e.target.value}))}
                        placeholder="e.g. 3"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label htmlFor="resale-bathrooms" className="block text-sm font-semibold text-slate-700 mb-1.5">Bathrooms</label>
                      <input id="resale-bathrooms" type="number" min={1} max={10} value={resaleForm.bathrooms} onChange={e => setResaleForm(f => ({...f, bathrooms: e.target.value}))}
                        placeholder="e.g. 2"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Location</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-city" className="block text-sm font-semibold text-slate-700 mb-1.5">City *</label>
                      <input id="resale-city" required value={resaleForm.city} onChange={e => setResaleForm(f => ({...f, city: e.target.value}))}
                        placeholder="e.g. Hyderabad"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label htmlFor="resale-cluster" className="block text-sm font-semibold text-slate-700 mb-1.5">Cluster</label>
                      <select id="resale-cluster" value={resaleForm.cluster} onChange={e => setResaleForm(f => ({...f, cluster: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select Cluster</option>
                        {['Neopolis','Kokapet','Gachibowli','Miyapur','Bachupally','LB Nagar','Kothapet','Uppal'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-zone" className="block text-sm font-semibold text-slate-700 mb-1.5">Zone</label>
                      <select id="resale-zone" value={resaleForm.zone} onChange={e => setResaleForm(f => ({...f, zone: e.target.value}))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">Select Zone</option>
                        {['West','East','South','North','Central'].map(z => <option key={z}>{z}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resale-state" className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                      <input id="resale-state" value={resaleForm.state} onChange={e => setResaleForm(f => ({...f, state: e.target.value}))}
                        placeholder="e.g. Telangana"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-pincode" className="block text-sm font-semibold text-slate-700 mb-1.5">Pincode</label>
                      <input id="resale-pincode" value={resaleForm.pincode} onChange={e => setResaleForm(f => ({...f, pincode: e.target.value}))}
                        placeholder="e.g. 500032"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label htmlFor="resale-landmark" className="block text-sm font-semibold text-slate-700 mb-1.5">Landmark</label>
                      <input id="resale-landmark" value={resaleForm.landmark} onChange={e => setResaleForm(f => ({...f, landmark: e.target.value}))}
                        placeholder="e.g. Near HITEC City"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="resale-address" className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                    <input id="resale-address" value={resaleForm.address} onChange={e => setResaleForm(f => ({...f, address: e.target.value}))}
                      placeholder="e.g. Plot 12, Kondapur, Hyderabad"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label htmlFor="resale-location" className="block text-sm font-semibold text-slate-700 mb-1.5">Location / Locality</label>
                    <input id="resale-location" value={resaleForm.location} onChange={e => setResaleForm(f => ({...f, location: e.target.value}))}
                      placeholder="e.g. Kondapur, near HITEC City"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label htmlFor="resale-maplink" className="block text-sm font-semibold text-slate-700 mb-1.5">Map Link</label>
                    <input id="resale-maplink" value={resaleForm.mapLink} onChange={e => setResaleForm(f => ({...f, mapLink: e.target.value}))}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Property Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="resale-floor" className="block text-sm font-semibold text-slate-700 mb-1.5">Floor</label>
                      <input id="resale-floor" type="number" min={0} value={resaleForm.floor} onChange={e => setResaleForm(f => ({...f, floor: e.target.value}))}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                    <div>
                      <label htmlFor="resale-total-floors" className="block text-sm font-semibold text-slate-700 mb-1.5">Total Floors</label>
                      <input id="resale-total-floors" type="number" min={1} value={resaleForm.totalFloors} onChange={e => setResaleForm(f => ({...f, totalFloors: e.target.value}))}
                        placeholder="e.g. 20"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="resale-possession" className="block text-sm font-semibold text-slate-700 mb-1.5">Possession</label>
                    <input id="resale-possession" value={resaleForm.possession} onChange={e => setResaleForm(f => ({...f, possession: e.target.value}))}
                      placeholder="e.g. Ready to Move"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  {/* Floor Plan upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Floor Plan (image/PDF)</label>
                    {resaleForm.floorPlan ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm">
                        <a href={resaleForm.floorPlan} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-medium truncate flex-1 hover:underline">
                          {floorPlanFileName || 'Floor Plan uploaded'}
                        </a>
                        <button type="button" onClick={() => { setResaleForm(f => ({ ...f, floorPlan: '' })); setFloorPlanFileName(''); }}
                          className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className={`w-full flex flex-col gap-1.5 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${floorPlanUploading ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'}`}>
                        <div className="flex items-center gap-3 w-full">
                          {floorPlanUploading
                            ? <><Clock className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" /><span className="text-sm text-slate-500">Uploading… {floorPlanProgress}%</span></>
                            : <><Upload className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="text-sm text-slate-500">Choose image or PDF…</span></>
                          }
                        </div>
                        {floorPlanUploading && (
                          <progress
                            className="w-full h-1.5 [&::-webkit-progress-bar]:bg-amber-100 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:bg-amber-500 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:bg-amber-500"
                            value={floorPlanProgress}
                            max={100}
                            aria-label="Uploading floor plan"
                          />
                        )}
                        {floorPlanError && !floorPlanUploading && (
                          <span className="text-[11px] text-red-600">{floorPlanError}</span>
                        )}
                        <input type="file" accept="image/*,application/pdf" className="hidden" disabled={floorPlanUploading}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFloorPlanUpload(f); e.target.value = ''; }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Ownership & Agent */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Ownership &amp; Agent</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="resale-owner-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Name</label>
                    <input id="resale-owner-name" value={resaleForm.ownerName} onChange={e => setResaleForm(f => ({...f, ownerName: e.target.value}))}
                      placeholder="Owner's name"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label htmlFor="resale-owner-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">Owner Phone</label>
                    <input id="resale-owner-phone" value={resaleForm.ownerPhone} onChange={e => setResaleForm(f => ({...f, ownerPhone: e.target.value}))}
                      placeholder="Owner's phone"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label htmlFor="resale-agent-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Name</label>
                    <input id="resale-agent-name" value={resaleForm.agentName} onChange={e => setResaleForm(f => ({...f, agentName: e.target.value}))}
                      placeholder="Agent's name (optional)"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                  <div>
                    <label htmlFor="resale-agent-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Phone</label>
                    <input id="resale-agent-phone" value={resaleForm.agentPhone} onChange={e => setResaleForm(f => ({...f, agentPhone: e.target.value}))}
                      placeholder="Agent's phone (optional)"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                </div>
              </div>

              {/* Media / Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 border-b border-slate-100 pb-2">Description</h3>
                <textarea id="resale-description" rows={3} value={resaleForm.description} onChange={e => setResaleForm(f => ({...f, description: e.target.value}))}
                  placeholder="Describe the property, highlights, nearby amenities..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              </div>

              <button type="submit" disabled={resaleSubmitting}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {resaleSubmitting
                  ? <><Clock className="w-4 h-4 animate-spin" /> {editingResaleId ? 'Updating...' : 'Submitting...'}</>
                  : <><RefreshCw className="w-4 h-4" /> {editingResaleId ? 'Update Property' : 'Submit for Review'}</>
                }
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Delegate Modal */}
    <AnimatePresence>
      {isDelegateModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setIsDelegateModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Assign Agent</h2>
                <p className="text-sm text-slate-500">Delegate this property to an agent</p>
              </div>
              <button onClick={() => setIsDelegateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDelegateSubmit} className="p-6 space-y-4">
              {delegateMsg && (
                <div className={`p-3 rounded-xl text-sm font-medium ${delegateMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {delegateMsg.text}
                </div>
              )}
              <div>
                <label htmlFor="delegate-agent-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Name</label>
                <input id="delegate-agent-name" required value={delegateForm.agentName} onChange={e => setDelegateForm(f => ({...f, agentName: e.target.value}))}
                  placeholder="Agent's full name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label htmlFor="delegate-agent-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">Agent Phone</label>
                <input id="delegate-agent-phone" required value={delegateForm.agentPhone} onChange={e => setDelegateForm(f => ({...f, agentPhone: e.target.value}))}
                  placeholder="Agent's phone number"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <button type="submit" disabled={delegateSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {delegateSubmitting ? 'Assigning...' : 'Assign Agent'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {isProfileEditOpen && uid && (
        <ClientProfileEditModal
          uid={uid}
          currentName={userName ?? ''}
          currentContactTime={profileContactTime}
          phone={profilePhone}
          onSave={(name) => { onProfileUpdate?.(name); }}
          onClose={() => setIsProfileEditOpen(false)}
        />
      )}
      <ErrorBoundary>
        {(!userRole || userRole === 'client') && (
          <ClientChatWidget
            uid={uid}
            userEmail={userEmail}
            onLoginClick={onLoginClick}
            openSignal={isAIOpen}
            holdStartSignal={aiHoldStart}
            holdEndSignal={aiHoldEnd}
          />
        )}
      </ErrorBoundary>
  </React.Fragment>
  );
}

// --- DYNAMIC LANDING PAGE COMPONENTS ---

const CATEGORY_LANDING_CONTENT: Record<string, any> = {
  All: {
    hero: {
      title: "Find Your Perfect Property with Howzy",
      subtitle: "Explore verified farm lands, plots, and commercial properties. Connect directly with trusted partners.",
      cta: "Explore All",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "100% Verified", desc: "Every listing is manually verified by our experts.", icon: Shield, color: "emerald" },
      { title: "Direct Connect", desc: "No middleman. Talk directly to owners or partners.", icon: MessageCircle, color: "indigo" },
      { title: "Zero Brokerage", desc: "Save thousands on commission fees.", icon: Tag, color: "amber" }
    ],
    lifestyle: {
      title: "Properties for Every Life Stage",
      desc: "Whether you're a first-time buyer or a seasoned investor, we have something for you.",
      items: [
        { title: "For Families", desc: "Spacious villas and apartments in safe communities.", icon: User },
        { title: "For Investors", desc: "High-yield commercial and plot opportunities.", icon: TrendingUp },
        { title: "For NRIs", desc: "Premium managed properties with full legal support.", icon: Globe }
      ]
    },
    process: [
      { step: "01", title: "Discover", desc: "Browse verified listings matching your exact criteria.", icon: Search },
      { step: "02", title: "AI Recommendations", desc: "Shortlist with our agent", icon: Bot },
      { step: "03", title: "Visit & Verify", desc: "Schedule site visits and get expert legal verification.", icon: Shield },
      { step: "04", title: "Close the Deal", desc: "Negotiate directly and handle paperwork seamlessly.", icon: Home }
    ]
  },
  Resale: {
    hero: {
      title: "Move-in Ready Luxury Homes",
      subtitle: "Skip the wait. Explore premium resale properties in prime locations with immediate possession.",
      cta: "View Resale Homes",
      image: "https://images.unsplash.com/photo-1600607687931-cecebd80d62f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "Ready to Move", desc: "No construction delays. Move in today.", icon: Home, color: "emerald" },
      { title: "Cost Advantage", desc: "Better value per square foot compared to new launches.", icon: TrendingDown, color: "indigo" },
      { title: "Prime Locations", desc: "Established neighborhoods with full amenities.", icon: MapPin, color: "amber" }
    ],
    lifestyle: {
      title: "Why Choose Resale?",
      desc: "Get the certainty of a finished product in a mature neighborhood.",
      items: [
        { title: "Immediate ROI", desc: "Start earning rent or living in your home immediately.", icon: DollarSign },
        { title: "See Before Buy", desc: "What you see is exactly what you get.", icon: Eye },
        { title: "Established Community", desc: "Join a vibrant neighborhood from day one.", icon: Users }
      ]
    },
    process: [
      { step: "01", title: "Requirement", desc: "Tell us your preferred location and budget.", icon: Search },
      { step: "02", title: "Curated Tours", desc: "Visit handpicked homes that match your vibe.", icon: Map },
      { step: "03", title: "Legal Check", desc: "Our team verifies all documents for peace of mind.", icon: Shield },
      { step: "04", title: "Possession", desc: "Smooth handover and documentation support.", icon: Key }
    ]
  },
  Projects: {
    hero: {
      title: "Invest in the Future of Living",
      subtitle: "Exclusive access to pre-launch and ongoing premium residential projects from top developers.",
      cta: "Explore Projects",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "Modern Amenities", desc: "Clubhouses, pools, and smart home features.", icon: Sparkles, color: "blue" },
      { title: "Flexible Payment", desc: "Construction-linked plans and easy bank loans.", icon: CreditCard, color: "purple" },
      { title: "High Appreciation", desc: "Early-stage investment for maximum capital gains.", icon: TrendingUp, color: "emerald" }
    ],
    lifestyle: {
      title: "Modern Living Redefined",
      desc: "Experience world-class architecture and lifestyle amenities.",
      items: [
        { title: "Smart Homes", desc: "Integrated technology for comfort and security.", icon: Zap },
        { title: "Green Spaces", desc: "Extensive landscaping and eco-friendly design.", icon: Trees },
        { title: "Community Life", desc: "Engaging social spaces for all age groups.", icon: Users }
      ]
    },
    process: [
      { step: "01", title: "Project Selection", desc: "Compare top developers and project locations.", icon: Layout },
      { step: "02", title: "Model Visit", desc: "Experience the sample flat and site progress.", icon: Eye },
      { step: "03", title: "Booking", desc: "Secure your unit with transparent pricing.", icon: CheckCircle2 },
      { step: "04", title: "Updates", desc: "Get regular construction progress reports.", icon: RefreshCw }
    ]
  },
  Plots: {
    hero: {
      title: "Build Your Dream From Ground Up",
      subtitle: "Premium gated community plots in high-growth corridors. Secure your piece of land today.",
      cta: "Find Your Plot",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "Clear Titles", desc: "100% legal verification and clear documentation.", icon: FileCheck, color: "amber" },
      { title: "High Growth", desc: "Located in rapidly developing infrastructure zones.", icon: TrendingUp, color: "emerald" },
      { title: "Custom Design", desc: "Freedom to build your home exactly how you want.", icon: PenTool, color: "blue" }
    ],
    lifestyle: {
      title: "The Ultimate Asset",
      desc: "Land is the only thing they're not making any more of.",
      items: [
        { title: "Wealth Creation", desc: "Historical data shows land appreciates fastest.", icon: TrendingUp },
        { title: "Legacy Building", desc: "An asset that stays in the family for generations.", icon: Landmark },
        { title: "Creative Freedom", desc: "No restrictions on your architectural vision.", icon: Palette }
      ]
    },
    process: [
      { step: "01", title: "Zone Selection", desc: "Identify high-potential growth corridors.", icon: Map },
      { step: "02", title: "Site Visit", desc: "Walk the land and check the surroundings.", icon: MapPin },
      { step: "03", title: "Verification", desc: "Review layout approvals and title deeds.", icon: Shield },
      { step: "04", title: "Registration", desc: "Hassle-free registration and mutation support.", icon: FileText }
    ]
  },
  'Farm Lands': {
    hero: {
      title: "Escape to Your Own Green Paradise",
      subtitle: "Managed farm lands with weekend cottages. Experience the joy of organic farming and nature.",
      cta: "Explore Farm Lands",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "Managed Farming", desc: "We take care of the crops; you enjoy the harvest.", icon: Leaf, color: "green" },
      { title: "Weekend Retreat", desc: "A perfect getaway from the city's hustle and bustle.", icon: Sun, color: "amber" },
      { title: "Sustainable Living", desc: "Eco-friendly communities with organic produce.", icon: Trees, color: "emerald" }
    ],
    lifestyle: {
      title: "Reconnect with Nature",
      desc: "A lifestyle choice that promotes health and well-being.",
      items: [
        { title: "Organic Produce", desc: "Fresh, chemical-free fruits and vegetables.", icon: Apple },
        { title: "Clean Air", desc: "Breathe easy in a pollution-free environment.", icon: Wind },
        { title: "Quiet Luxury", desc: "The luxury of space, silence, and serenity.", icon: Moon }
      ]
    },
    process: [
      { step: "01", title: "Farm Selection", desc: "Choose your preferred soil and crop type.", icon: Trees },
      { step: "02", title: "Nature Walk", desc: "Explore the community and amenities.", icon: MapPin },
      { step: "03", title: "Agreement", desc: "Transparent lease or purchase agreements.", icon: FileText },
      { step: "04", title: "Harvest", desc: "Start your journey as a weekend farmer.", icon: Leaf }
    ]
  },
  Commercial: {
    hero: {
      title: "Strategic Spaces for Business Growth",
      subtitle: "Prime office spaces, retail outlets, and warehouses in high-traffic commercial hubs.",
      cta: "View Commercial Spaces",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    usps: [
      { title: "High Rental Yield", desc: "Stable income with long-term corporate leases.", icon: TrendingUp, color: "blue" },
      { title: "Strategic Location", desc: "Excellent connectivity and high visibility.", icon: MapPin, color: "purple" },
      { title: "Grade-A Build", desc: "Modern infrastructure with 100% power backup.", icon: Building2, color: "indigo" }
    ],
    lifestyle: {
      title: "Empowering Businesses",
      desc: "The right space can transform your business trajectory.",
      items: [
        { title: "Corporate Hubs", desc: "Be where the action is.", icon: Briefcase },
        { title: "Retail Success", desc: "High footfall locations for maximum sales.", icon: ShoppingBag },
        { title: "Smart Logistics", desc: "Efficient warehousing and distribution centers.", icon: Truck }
      ]
    },
    process: [
      { step: "01", title: "Analysis", desc: "Understand traffic patterns and business needs.", icon: BarChart3 },
      { step: "02", title: "Shortlisting", desc: "Compare multiple grade-A commercial spaces.", icon: Layout },
      { step: "03", title: "Lease Terms", desc: "Expert negotiation for favorable lease terms.", icon: FileText },
      { step: "04", title: "Fit-out", desc: "Support for interior setup and move-in.", icon: Settings }
    ]
  }
};

function DynamicHero({ category, onSearch, onExplore }: any) {
  const content = CATEGORY_LANDING_CONTENT[category] || CATEGORY_LANDING_CONTENT.All;
  const [localSearch, setLocalSearch] = useState('');
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <div ref={containerRef} className="bg-slate-900 rounded-[2rem] p-6 md:p-12 text-white shadow-xl relative overflow-hidden min-h-[400px] flex items-center">
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <motion.div 
          key={category}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: `url(${content.hero.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90"></div>
      </motion.div>
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, -40, 0],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            y: [0, 40, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-20 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300"
            >
              {category === 'All' ? 'Premium Real Estate' : `${category} Specialist`}
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight"
            >
              {content.hero.title.split(' ').map((word: string, i: number) => (
                <motion.span 
                  key={i} 
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={i === 1 ? 'text-indigo-400' : ''}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="text-slate-300 text-lg md:text-xl max-w-2xl font-medium leading-relaxed"
            >
              {content.hero.subtitle}
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-2 bg-white/5 p-2 rounded-2xl backdrop-blur-2xl border border-white/10 shadow-2xl max-w-2xl"
          >
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search location or project..." 
                className="w-full bg-transparent border-none text-white placeholder:text-indigo-300/40 pl-12 pr-4 py-3 focus:outline-none focus:ring-0 text-sm font-medium"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearch(localSearch);
                    onExplore();
                  }
                }}
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSearch(localSearch);
                onExplore();
              }}
              className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2"
            >
              {content.hero.cta} <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function DynamicUSPs({ category }: any) {
  const content = CATEGORY_LANDING_CONTENT[category] || CATEGORY_LANDING_CONTENT.All;
  
  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight"
        >
          Why Choose <span className="text-indigo-600">Howzy</span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 font-medium"
        >
          We bring transparency, trust, and technology to your property search.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
        {content.usps.map((usp: any, i: number) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ y: -8 }}
            className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50/50 transition-colors" />
            <div className={`relative z-10 w-16 h-16 bg-${usp.color}-50 text-${usp.color}-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
              <usp.icon className="w-8 h-8" />
            </div>
            <h3 className="relative z-10 text-2xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">{usp.title}</h3>
            <p className="relative z-10 text-slate-500 text-base leading-relaxed font-medium">{usp.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeaturedOpportunities({ category, properties, savedProperties, onSave, onSelect }: any) {
  const filtered = properties.filter((p: any) => {
    if (category === 'All') return true;
    if (category === 'Projects') return p.type === 'Residential';
    if (category === 'Resale') return p.type === 'Re-Sale';
    if (category === 'Plots') return p.type === 'Plot';
    if (category === 'Farm Lands') return p.type === 'Farm Land';
    if (category === 'Commercial') return p.type === 'Commercial';
    return true;
  }).slice(0, 3);

  return (
    <div className="space-y-12 py-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Featured <span className="text-indigo-600">Opportunities</span></h2>
          <p className="text-xl text-slate-500 font-medium">Handpicked premium listings for you</p>
        </motion.div>
        <motion.button 
          whileHover={{ x: 5 }}
          className="text-indigo-600 font-black flex items-center gap-2 text-lg group"
        >
          View All <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {filtered.map((property: any, i: number) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <PropertyCard 
              property={property} 
              isSaved={savedProperties.includes(property.id)}
              onSave={() => onSave(property.id)}
              onClick={() => onSelect(property)}
              category={property.type}
            />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="col-span-3 p-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-300 text-slate-500"
          >
            <p className="text-xl font-medium">No featured {category.toLowerCase()} available right now. Check back soon!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LifestyleSection({ category }: any) {
  const content = CATEGORY_LANDING_CONTENT[category] || CATEGORY_LANDING_CONTENT.All;

  return (
    <div className="space-y-16 py-12">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
        >
          {content.lifestyle.title}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 font-medium"
        >
          {content.lifestyle.desc}
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {content.lifestyle.items.map((item: any, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10 }}
            className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 group hover:border-indigo-100 transition-all"
          >
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm">
              <item.icon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</h3>
            <p className="text-slate-500 text-lg leading-relaxed font-medium">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProcessSection({ category }: any) {
  const content = CATEGORY_LANDING_CONTENT[category] || CATEGORY_LANDING_CONTENT.All;

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight"
        >
          Your Journey to Ownership
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-500 font-medium"
        >
          A simplified, transparent process tailored for {category.toLowerCase()}.
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 relative">
        <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-indigo-100 to-transparent -z-10"></div>
        {content.process.map((s: any, i: number) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -8 }}
            className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center relative group hover:border-indigo-100 transition-all"
          >
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:bg-indigo-600 transition-colors"
            >
              <s.icon className="w-8 h-8" />
            </motion.div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-indigo-600 text-sm shadow-xl border-2 border-slate-50">{s.step}</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight group-hover:text-indigo-600 transition-colors">{s.title}</h3>
            <p className="text-slate-500 text-base leading-relaxed font-medium">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ROIInsights({ category }: any) {
  if (category === 'All') return null;

  const insights: Record<string, any> = {
    Resale: { title: "Resale Market Trends", value: "+8.5%", label: "Avg. Annual Appreciation", desc: "Prime locations are seeing steady growth due to limited supply.", growth: 85 },
    Projects: { title: "Pre-launch Advantage", value: "15-20%", label: "Expected Capital Gains", desc: "Investing at early stages offers maximum ROI upon completion.", growth: 95 },
    Plots: { title: "Land Appreciation", value: "+12.4%", label: "Year-on-Year Growth", desc: "Open plots in growth corridors outpace other real estate assets.", growth: 90 },
    'Farm Lands': { title: "Agricultural Value", value: "+6.2%", label: "Stable Appreciation", desc: "Farm lands offer long-term security and tax benefits.", growth: 70 },
    Commercial: { title: "Rental Yields", value: "7-9%", label: "Avg. Commercial Yield", desc: "High-traffic hubs offer stable, long-term rental income.", growth: 80 }
  };

  const data = insights[category];
  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-slate-900 rounded-xl p-6 md:p-10 text-white overflow-hidden relative shadow-lg shadow-indigo-500/5"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 blur-[80px] rounded-full -ml-24 -mb-24"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest"
          >
            <TrendingUp className="w-4 h-4" /> Investment Intelligence
          </motion.div>
          <h2 className="text-xl md:text-3xl font-black tracking-tight leading-tight">{data.title}</h2>
          <p className="text-slate-400 text-base font-medium leading-relaxed">{data.desc}</p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-black text-indigo-400 tracking-tighter"
              >
                {data.value}
              </motion.div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{data.label}</div>
            </div>
            <div className="space-y-1">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-black text-emerald-400 tracking-tighter"
              >
                100%
              </motion.div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Titles</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl"
          >
            <h4 className="font-black mb-4 flex items-center gap-2 text-indigo-300 text-base uppercase tracking-widest">
              <Sparkles className="w-5 h-5" /> AI ROI Predictor
            </h4>
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Growth Potential</span>
                  <span>{data.growth}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${data.growth}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Risk Assessment</span>
                  <span>Low</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: '20%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>
            <p className="text-slate-300 italic text-base leading-relaxed border-l-2 border-indigo-500/30 pl-4 py-1">
              "Based on current market data, {category.toLowerCase()} in the North corridor are expected to see a 15% surge in value over the next 18 months due to upcoming infrastructure projects."
            </p>
          </motion.div>
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 bg-indigo-600 rounded-lg font-bold text-sm hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10"
          >
            Get Detailed ROI Report
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function TrustSection() {
  return (
    <div className="space-y-16 py-12">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
        >
          Trusted by <span className="text-indigo-600">5,000+</span> Home Buyers
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 font-medium"
        >
          We prioritize transparency and security in every transaction.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {[
          { label: 'Properties Listed', value: '10,000+', icon: Home, color: 'blue' },
          { label: 'Happy Customers', value: '5,000+', icon: Users, color: 'emerald' },
          { label: 'Average Rating', value: '4.8/5', icon: Star, color: 'amber' },
          { label: 'Verified Partners', value: '1,000+', icon: CheckCircle2, color: 'indigo' }
        ].map((metric, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8 }}
            className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 text-center group hover:border-indigo-100 transition-all"
          >
            <div className={`w-16 h-16 bg-${metric.color}-50 text-${metric.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
              <metric.icon className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{metric.value}</h3>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{metric.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DynamicTestimonials({ category }: any) {
  const testimonials = [
    { author: 'Rahul Sharma', text: 'Found my dream villa in Cybercity through Howzy. The verification process gave me complete peace of mind.', cat: 'Residential' },
    { author: 'Priya Reddy', text: 'The NRI desk was incredibly helpful. They managed everything from legal checks to registration seamlessly.', cat: 'NRI' },
    { author: 'Suresh Kumar', text: 'Best platform for farm land investment. Transparent pricing and direct connection with the developers.', cat: 'Farm Land' },
    { author: 'Anjali Gupta', text: 'Smooth resale transaction. The property was exactly as described and the documentation was perfect.', cat: 'Resale' },
    { author: 'Vikram Singh', text: 'Grade-A commercial spaces with excellent rental yields. Howzy is my go-to for business investments.', cat: 'Commercial' }
  ];

  return (
    <div className="space-y-16 py-12 overflow-hidden">
      <div className="text-center max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
        >
          What Our <span className="text-indigo-600">Clients</span> Say
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-500 font-medium"
        >
          Real stories from real home buyers and investors.
        </motion.p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
        
        <motion.div 
          className="flex gap-8"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.02, y: -5 }}
              className="min-w-[350px] md:min-w-[450px] bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col justify-between group hover:border-indigo-100 transition-all"
            >
              <div className="mb-8">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-lg font-medium leading-relaxed italic">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-white text-lg shadow-lg">
                  {t.author[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base tracking-tight">{t.author}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">{t.cat} Buyer</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function CategoryFAQs({ category }: any) {
  const faqs: Record<string, any[]> = {
    All: [
      { q: 'Are all properties on Howzy verified?', a: 'Yes, every property listed on our platform goes through a rigorous 50-point legal and physical verification process.' },
      { q: 'Do you charge brokerage fees?', a: 'We operate on a transparent flat-fee model or zero brokerage depending on the property type.' }
    ],
    Resale: [
      { q: 'How do you verify resale properties?', a: 'We check title deeds, encumbrance certificates, and tax receipts for the last 30 years.' },
      { q: 'Can I get a loan for resale homes?', a: 'Yes, we have tie-ups with major banks that provide loans for verified resale properties.' }
    ],
    Projects: [
      { q: 'Are these RERA approved?', a: 'We only list RERA-approved projects to ensure your investment is safe and developers are accountable.' },
      { q: 'What are pre-launch offers?', a: 'Pre-launch offers allow you to book at a lower price before the official launch, offering higher ROI.' }
    ],
    Plots: [
      { q: 'What approvals should I check for plots?', a: 'Look for DTCP, HMDA, or local body approvals. We verify these for every plot listed.' },
      { q: 'Is there a minimum plot size?', a: 'Plot sizes vary by layout, typically starting from 150 sq. yds.' }
    ],
    'Farm Lands': [
      { q: 'Can non-farmers buy farm land?', a: 'Regulations vary by state. Our legal team can guide you on the eligibility and process.' },
      { q: 'Is the farm land managed?', a: 'Many of our listings are in managed communities where maintenance and farming are handled by experts.' }
    ],
    Commercial: [
      { q: 'What is the typical lease period?', a: 'Commercial leases usually range from 3 to 9 years with periodic rent escalations.' },
      { q: 'Do you help with tenant finding?', a: 'Yes, we have a dedicated team to help commercial property owners find high-quality corporate tenants.' }
    ]
  };

  const currentFaqs = faqs[category] || faqs.All;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12">
      <div className="text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
        >
          Common <span className="text-indigo-600">Questions</span>
        </motion.h2>
        <p className="text-xl text-slate-500 font-medium">Everything you need to know about your next investment</p>
      </div>

      <div className="space-y-6">
        {currentFaqs.map((faq, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/20"
          >
            <button 
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-10 py-8 flex justify-between items-center text-left group outline-none"
            >
              <span className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-10 pb-8"
                >
                  <p className="text-slate-500 text-lg leading-relaxed font-medium border-t border-slate-50 pt-6">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ClosingCTA({ category }: any) {
  return (
    <div className="py-16">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-500/10 group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 opacity-90"></div>
        
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5, 
                repeat: Infinity, 
                delay: i * 0.5 
              }}
              className="absolute w-24 h-24 bg-white/10 rounded-full blur-2xl"
              style={{ 
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%` 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-6xl font-black tracking-tight leading-tight">Ready to Take the <span className="text-indigo-200">Next Step?</span></h2>
            <p className="text-xl text-indigo-100 font-medium leading-relaxed">Join 5,000+ happy users who found their perfect {category.toLowerCase()} through Howzy. Your journey starts here.</p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 flex items-center gap-3"
            >
              Get Started Now <ArrowRight className="w-6 h-6" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-indigo-500/20 backdrop-blur-xl text-white border-2 border-white/30 px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all"
            >
              Talk to an Expert
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TrendingLocations({ category, onLocationClick, onExploreMap }: { category: string; onLocationClick?: (location: string) => void; onExploreMap?: () => void }) {
  const locations: Record<string, { name: string, desc: string, image: string }[]> = {
    All: [
      { name: 'Kokapet', desc: 'Premium Luxury Hub', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Kondapur', desc: 'IT Corridor Prime', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Neopolis', desc: 'Future Tech City', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
      { name: 'Financial District', desc: 'Corporate Epicenter', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' }
    ],
    Resale: [
      { name: 'Kondapur', desc: 'High Rental Yields', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Gachibowli', desc: 'Established IT Hub', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Madhapur', desc: 'Premium Resale', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Jubilee Hills', desc: 'Luxury Living', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' }
    ],
    Projects: [
      { name: 'Neopolis', desc: 'Future Tech City', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
      { name: 'Kokapet', desc: 'Premium Luxury Hub', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Tellapur', desc: 'Rapidly Growing', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Narsingi', desc: 'Excellent Connectivity', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' }
    ],
    Plots: [
      { name: 'Shadnagar', desc: 'High Appreciation', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Sadashivpet', desc: 'Industrial Corridor', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' },
      { name: 'Maheshwaram', desc: 'Near Pharma City', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Choutuppal', desc: 'Highway Facing', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' }
    ],
    'Farm Lands': [
      { name: 'Moinabad', desc: 'Weekend Getaways', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Chevella', desc: 'Fertile Soil', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' },
      { name: 'Shankarpalli', desc: 'Premium Farms', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Bhongir', desc: 'Scenic Views', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' }
    ],
    Commercial: [
      { name: 'Financial District', desc: 'Corporate Epicenter', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
      { name: 'HITEC City', desc: 'IT Hub', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
      { name: 'Madhapur', desc: 'Premium Retail', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Gachibowli', desc: 'Mixed Use', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' }
    ]
  };

  const currentLocations = locations[category] || locations.All;

  return (
    <div className="space-y-12 py-12">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Trending <span className="text-indigo-600">Locations</span></h2>
          <p className="text-xl text-slate-500 font-medium">Where the world is moving</p>
        </motion.div>
        <motion.button 
          whileHover={{ x: 5 }}
          className="text-indigo-600 font-black flex items-center gap-2 text-lg group"
          onClick={onExploreMap}
          data-testid="trending-locations-explore-map"
        >
          Explore Map <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
        {currentLocations.map((loc, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10 }}
            className="group cursor-pointer"
            data-testid={`trending-location-${loc.name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onLocationClick?.(loc.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLocationClick?.(loc.name); }}
          >
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/20 mb-6">
              <img 
                src={loc.image} 
                alt={loc.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-white font-black text-2xl tracking-tight mb-2">{loc.name}</p>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em]">{loc.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrendingProjects({ category }: any) {
  const projects: Record<string, { name: string, desc: string, image: string }[]> = {
    All: [
      { name: 'The Prestige City', desc: 'Luxury Integrated Township', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' },
      { name: 'My Home Bhooja', desc: 'Premium High-Rise', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Aparna Sarovar', desc: 'Lakeview Residences', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
      { name: 'Lodha Bellezza', desc: 'Ultra Luxury Villas', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' }
    ],
    Resale: [
      { name: 'Lanco Hills', desc: 'Established Community', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'PBEL City', desc: 'Family Friendly', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Golf View', desc: 'Premium Resale', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Cybercity', desc: 'IT Corridor Living', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' }
    ],
    Projects: [
      { name: 'The Prestige City', desc: 'Luxury Integrated Township', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80' },
      { name: 'My Home Bhooja', desc: 'Premium High-Rise', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Aparna Zenith', desc: 'Upcoming Landmark', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { name: 'Rajapushpa', desc: 'Premium Lifestyle', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' }
    ],
    Plots: [
      { name: 'Green Meadows', desc: 'Gated Community', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Sunrise Valley', desc: 'Highway Facing', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' },
      { name: 'Nature Park', desc: 'Eco-friendly Layout', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Royal Enclave', desc: 'Premium Plots', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' }
    ],
    'Farm Lands': [
      { name: 'Organic Farms', desc: 'Managed Farmland', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Weekend Retreat', desc: 'Luxury Farmhouses', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' },
      { name: 'Nature Valley', desc: 'Scenic Views', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' },
      { name: 'Green Acres', desc: 'Fertile Soil', image: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=400&q=80' }
    ],
    Commercial: [
      { name: 'Tech Park One', desc: 'Grade A Offices', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
      { name: 'Business Hub', desc: 'Retail & Office', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
      { name: 'The Galleria', desc: 'Premium Retail', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Corporate Square', desc: 'Mixed Use', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' }
    ]
  };

  const currentProjects = projects[category] || projects.All;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5">Trending Projects</h2>
          <p className="text-slate-500 font-medium text-base">Most searched projects for {category === 'All' ? 'properties' : category.toLowerCase()}</p>
        </motion.div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {currentProjects.map((proj, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="min-w-[240px] md:min-w-[280px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer shrink-0"
          >
            <div className="h-40 relative overflow-hidden">
              <img src={proj.image} alt={proj.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-bold text-lg leading-tight mb-1">{proj.name}</h3>
                <p className="text-indigo-200 text-xs font-medium">{proj.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PropertyCard({ property, isSaved, onSave, onClick, category }: any) {
  const getCategoryDetails = () => {
    const details = property.details || {};
    const cat = category || property.type;
    switch (cat) {
      case 'Apartments':
      case 'Villas':
      case 'Residential':
        return (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {details.bhk && <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-400" /> {details.bhk} BHK</span>}
            {details.area && <span className="flex items-center gap-1"><Map className="w-3 h-3 text-indigo-400" /> {details.area}</span>}
            {details.possession && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> {details.possession}</span>}
          </div>
        );
      case 'Resale':
      case 'Re-Sale':
        return (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {details.bhk && <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-400" /> {details.bhk} BHK</span>}
            {details.age && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 text-indigo-400" /> {details.age}</span>}
            {details.furnishing && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-indigo-400" /> {details.furnishing}</span>}
          </div>
        );
      case 'Plots':
      case 'Plot':
      case 'Farm Lands':
      case 'Farm Land':
        return (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {details.size && <span className="flex items-center gap-1"><Map className="w-3 h-3 text-indigo-400" /> {details.size} SQ.YD</span>}
            {details.approval && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-indigo-400" /> {details.approval.toUpperCase()}</span>}
          </div>
        );
      case 'Commercial':
        return (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {details.commercialType && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-indigo-400" /> {details.commercialType}</span>}
            {details.area && <span className="flex items-center gap-1"><Map className="w-3 h-3 text-indigo-400" /> {details.area}</span>}
          </div>
        );
      default:
        return (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold uppercase tracking-widest">
            {property.type === 'Residential' && <span className="flex items-center gap-1"><Home className="w-3 h-3 text-indigo-400" /> {details.bhk || '3'} BHK</span>}
            {(property.type === 'Plot' || property.type === 'Farm Land') && <span className="flex items-center gap-1"><Map className="w-3 h-3 text-indigo-400" /> {details.size || '200'} SQ.YD</span>}
          </div>
        );
    }
  };

  const getImageForType = (type: string) => {
    switch (type) {
      case 'Farm Land': return '1500382017468-9049fed747ef';
      case 'Plot': return '1524813686514-a57563d77965';
      case 'Commercial': return '1497366216548-37526070297c';
      case 'Re-Sale': return '1560518883-ce09059eeffa';
      default: return '1600596542815-ffad4c1539a9'; // Residential
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group cursor-pointer flex flex-col h-full relative"
      onClick={onClick}
    >
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        <img 
          src={`https://images.unsplash.com/photo-${getImageForType(property.type)}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Shine Effect */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] group-hover:animate-shine"></div>
        </div>

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-xs font-black rounded-full shadow-lg w-max uppercase tracking-wider">
            {property.type}
          </span>
          {category === 'Resale' && (
            <>
              <span className="bg-emerald-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white shadow-lg flex items-center gap-1 w-max uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" /> Resale Verified
              </span>
              <span className="bg-blue-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-white shadow-lg w-max uppercase tracking-wider">
                Ready to Move
              </span>
            </>
          )}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-20 hover:scale-110"
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-black mb-2 uppercase tracking-widest">
          <MapPin className="w-3 h-3" />
          {property.details?.location || property.details?.city || 'Location not specified'}
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-1 tracking-tight group-hover:text-indigo-600 transition-colors">{property.name}</h3>
        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 flex-1 leading-relaxed">
          {property.details?.description || 'A premium property listed by our trusted partners.'}
        </p>
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-auto">
          {getCategoryDetails()}
          <span className="text-lg font-bold text-indigo-600 tracking-tight">
            {property.details?.price || property.details?.budget || 'Price on Request'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface ProjectDetailsPageProps {
  property: any;
  similar: any[];
  savedIds: string[];
  onSave: (id: string) => void;
  onSelectSimilar: (p: any) => void;
  onBack: () => void;
  onEnquiry: (p: any, kind: string) => void;
}

function ProjectDetailsPage({ property, similar, savedIds, onSave, onSelectSimilar, onBack, onEnquiry }: Readonly<ProjectDetailsPageProps>) {
  const isSaved = savedIds.includes(property.id);
  const heroPhoto = property.details?.media?.[0]
    || property.details?.photos?.[0]
    || `https://images.unsplash.com/photo-${property.type === 'Farm Land' ? '1500382017468-9049fed747ef' : '1600596542815-ffad4c1539a9'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80`;

  const detailEntries = Object.entries(property.details || {})
    .filter(([key]) => !['documents', 'media', 'photos', 'remarks', 'description', 'location', 'city', 'amenities'].includes(key))
    .slice(0, 9);

  return (
    <div className="space-y-10">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Hero */}
        <div className="h-64 md:h-96 bg-slate-200 relative">
          <img
            src={heroPhoto}
            alt={property.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                  {property.type}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-medium rounded-lg">
                  ID: {property.id}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">{property.name}</h1>
              <div className="flex items-center gap-2 text-slate-200 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="line-clamp-1">{property.details?.location || property.details?.city || 'Location not specified'}</span>
              </div>
            </div>
            <button
              onClick={() => onSave(property.id)}
              className={`p-3 rounded-full backdrop-blur-md transition-colors self-start sm:self-auto ${
                isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'
              }`}
              aria-label={isSaved ? 'Unsave property' : 'Save property'}
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">About this Property</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {property.details?.description || 'No description provided for this property. Please contact us for more details.'}
              </p>
            </div>

            {detailEntries.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Key Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {detailEntries.map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="block text-xs font-medium text-slate-500 capitalize mb-1">
                        {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="block text-sm font-bold text-slate-900 truncate">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.details?.amenities && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(property.details.amenities)
                    ? property.details.amenities
                    : String(property.details.amenities).split(',')
                  ).map((amenity: string) => {
                    const label = String(amenity).trim();
                    return (
                      <span key={label} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action sidebar */}
          <aside className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="mb-6">
                <span className="block text-sm font-medium text-slate-500 mb-1">Price Range</span>
                <span className="text-3xl font-bold text-slate-900">
                  {property.details?.price || property.details?.budget || 'On Request'}
                </span>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onEnquiry(property, 'General Enquiry')}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
                >
                  <FileText className="w-5 h-5" /> Send Enquiry
                </button>
                <button
                  onClick={() => onEnquiry(property, 'Request Call Back')}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
                >
                  <Phone className="w-5 h-5" /> Request Call Back
                </button>
                <button
                  onClick={() => onEnquiry(property, 'Site Visit')}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-colors border border-slate-200 shadow-sm"
                >
                  <Calendar className="w-5 h-5" /> Schedule Site Visit
                </button>
              </div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-2">Need Help?</h3>
              <p className="text-sm text-indigo-700 mb-4">Our property experts are here to assist you with any questions.</p>
              <a href="tel:+911234567890" className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                <Phone className="w-4 h-4" /> +91 12345 67890
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Similar Projects */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Similar Projects</h2>
            <p className="text-slate-500 text-sm">Recommended properties you may also like</p>
          </div>
        </div>
        {similar.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No similar projects found right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isSaved={savedIds.includes(p.id)}
                onSave={() => onSave(p.id)}
                onClick={() => onSelectSimilar(p)}
                category={p.type}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
