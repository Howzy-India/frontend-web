import React, { useState, useEffect } from 'react';
import { usePagination } from '../hooks/usePagination';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { TEST_IDS } from '../constants/testIds';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Map, 
  Trees, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ShieldCheck,
  Briefcase,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Bell,
  AlertTriangle,
  UserPlus,
  CheckCircle,
  CheckCircle2,
  Megaphone,
  Send,
  Share2,
  MapPin,
  Upload,
  FileSpreadsheet,
  UserCheck,
  Network,
  Inbox,
  Sparkles,
  Monitor,
  Home,
  Plus,
  Mail,
  Phone,
  RefreshCw,
  Globe,
  TrendingDown,
  MessageCircle,
  Tag,
  ChevronDown,
  Eye,
  Key,
  Zap,
  Layout,
  FileCheck,
  PenTool,
  Landmark,
  Palette,
  Leaf,
  Sun,
  Apple,
  Wind,
  Moon,
  ShoppingBag,
  Truck,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Logo from './Logo';
import { api } from '../services/api';
import AdminVerificationPanel from './AdminVerificationPanel';
import BulkPropertyUpload from './BulkPropertyUpload';
import BulkLeadUpload from './BulkLeadUpload';
import ClientListingsVerification from './ClientListingsVerification';
import LeadAllocationManager from './LeadAllocationManager';
import AdminEnquiriesPanel from './AdminEnquiriesPanel';
import ClientLoginDashboard from './ClientLoginDashboard';
import ClientRegistrationsPanel from './ClientRegistrationsPanel';
import { getAttendanceRecords, getLocationLogs, AttendanceRecord, LocationLog } from '../utils/attendanceStore';

interface SuperAdminDashboardProps {
  onLogout: () => void;
  footerConfig?: any;
  onFooterConfigChange?: (config: any) => void;
}

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  status: 'active' | 'disabled';
  createdAt?: string;
}

const PLATFORM_STATS = [
  { title: "Total Revenue", value: "₹12.4 Cr", trend: "+15.2%", icon: DollarSign, color: "emerald" },
  { title: "Total Partners", value: "1,240", trend: "+42", icon: Users, color: "indigo" },
  { title: "Active Projects", value: "86", trend: "+4", icon: Building2, color: "amber" },
  { title: "Total Leads", value: "4,820", trend: "+124", icon: Activity, color: "blue" },
];

const REVENUE_CHART_DATA = [
  { month: 'Jan', revenue: 4500000 },
  { month: 'Feb', revenue: 5200000 },
  { month: 'Mar', revenue: 4800000 },
  { month: 'Apr', revenue: 6100000 },
  { month: 'May', revenue: 5900000 },
  { month: 'Jun', revenue: 7200000 },
];

const PROPERTY_DISTRIBUTION = [
  { name: 'Projects', value: 45, color: '#4f46e5' },
  { name: 'Plots', value: 30, color: '#10b981' },
  { name: 'Farm Lands', value: 25, color: '#f59e0b' },
];


const HOWZERS_DATA = [
  { name: "Howzy Hyderabad", owner: "Kiran Reddy", agents: 450, revenue: "₹4.2 Cr", status: "Active" },
  { name: "Howzy Bangalore", owner: "Anitha Rao", agents: 320, revenue: "₹3.8 Cr", status: "Active" },
  { name: "Howzy Chennai", owner: "Vijay Kumar", agents: 210, revenue: "₹2.1 Cr", status: "Active" },
  { name: "Howzy Pune", owner: "Sanjay Patil", agents: 180, revenue: "₹1.5 Cr", status: "Pending" },
  { name: "Howzy Vizag", owner: "Ravi Teja", agents: 80, revenue: "₹0.8 Cr", status: "Active" },
];


const PARTNERS_DATA = [
  { name: "Rahul Sharma", franchise: "Hyderabad", status: "Active", deals: 24, earnings: "₹12.5L" },
  { name: "Priya Singh", franchise: "Bangalore", status: "Active", deals: 18, earnings: "₹8.2L" },
  { name: "Amit Patel", franchise: "Pune", status: "Inactive", deals: 5, earnings: "₹1.5L" },
  { name: "Sneha Reddy", franchise: "Hyderabad", status: "Active", deals: 32, earnings: "₹18.4L" },
  { name: "Vikram Rao", franchise: "Chennai", status: "Active", deals: 12, earnings: "₹4.8L" },
];

export default function SuperAdminDashboard({ onLogout, footerConfig, onFooterConfigChange }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [listedPlots, setListedPlots] = useState<any[]>([]);
  const [listedFarmLands, setListedFarmLands] = useState<any[]>([]);
  const [socialMediaLeads, setSocialMediaLeads] = useState<any[]>([]);

  const { user } = useAuth();
  const userRole = user?.role ?? 'admin';

  const adminNotifications = useNotifications('admin');

  useEffect(() => {
    setNotifications(adminNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.message,
      message: n.message,
      time: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'just now',
      unread: !n.read,
      icon: Bell,
      color: 'indigo',
    })));
  }, [adminNotifications]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, leadsData] = await Promise.all([
          api.getProjects(),
          api.getLeads()
        ]);
        setProjects(projectsData.projects);
        setLeads(leadsData.leads);
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();

    api.getProjects({ type: 'Plot' }).then(d => setListedPlots(d.projects ?? [])).catch(() => {});
    api.getProjects({ type: 'Farm Land' }).then(d => setListedFarmLands(d.projects ?? [])).catch(() => {});
    api.getLeads().then(d => {
      const smLeads = (d.leads ?? []).filter((l: any) => l.campaign_source || l.campaignSource);
      setSocialMediaLeads(smLeads);
    }).catch(() => {});
  }, []);

  const refreshProjects = React.useCallback(async () => {
    try {
      const [all, plots, farmlands] = await Promise.all([
        api.getProjects(),
        api.getProjects({ type: 'Plot' }),
        api.getProjects({ type: 'Farm Land' }),
      ]);
      setProjects(all.projects ?? []);
      setListedPlots(plots.projects ?? []);
      setListedFarmLands(farmlands.projects ?? []);
    } catch (error) {
      console.error("Failed to refresh projects", error);
    }
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const tabGroups = React.useMemo(() => [
    {
      label: 'Dashboard',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Lead Management',
      items: [
        { id: 'enquiries', label: 'Enquiries', icon: Inbox },
        { id: 'leads', label: 'Global Leads', icon: Briefcase },
        { id: 'social-leads', label: 'Social Media Leads', icon: Share2 },
        { id: 'lead-allocation', label: 'Lead Allocation', icon: Network },
        { id: 'bulk-lead-upload', label: 'Bulk Lead Upload', icon: Upload },
      ],
    },
    {
      label: 'Client Management',
      items: [
        { id: 'client-logins', label: 'Client Logins', icon: Monitor },
        { id: 'client-registrations', label: 'Client Registrations', icon: UserPlus },
        { id: 'client-listings', label: 'Client Listings', icon: UserCheck },
      ],
    },
    {
      label: 'Property Management',
      items: [
        { id: 'projects', label: 'All Projects', icon: Building2 },
        { id: 'plots', label: 'All Plots', icon: Map },
        { id: 'farmlands', label: 'All Farm Lands', icon: Trees },
        { id: 'bulk-property-upload', label: 'Bulk Property Upload', icon: FileSpreadsheet },
        { id: 'resale', label: 'Resale Properties', icon: RefreshCw },
      ],
    },
    {
      label: 'Partner Ecosystem',
      items: [
        { id: 'agents', label: 'Partner Management', icon: Users },
        { id: 'admin-users', label: 'Admin Users', icon: ShieldCheck },
      ],
    },
    {
      label: 'Activity Tracking',
      items: [
        { id: 'attendance', label: 'Attendance & Tracking', icon: MapPin },
        { id: 'verification', label: 'Verification Panel', icon: CheckCircle },
      ],
    },
    {
      label: 'Communication',
      items: [
        { id: 'alerts', label: 'Messages & Alerts', icon: Megaphone },
      ],
    },
    {
      label: 'Configuration',
      items: [
        { id: 'properties-config', label: 'Properties Config', icon: Settings },
        { id: 'category-cms', label: 'Category CMS', icon: Sparkles },
        { id: 'footer-cms', label: 'Footer CMS', icon: Layout },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
  ], []);

  // Flat list derived from groups — used for header label lookup
  const tabs = React.useMemo(
    () => tabGroups.flatMap(g => g.items),
    [tabGroups]
  );


  const handleBroadcast = React.useCallback(async (notification: any) => {
    await addDoc(collection(db, 'notifications'), {
      room: 'pilot',
      type: 'broadcast',
      message: notification.message,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, []);

  const activeView = React.useMemo(() => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'enquiries': return <AdminEnquiriesPanel />;
      case 'client-logins': return <ClientLoginDashboard />;
      case 'client-registrations': return <ClientRegistrationsPanel isSuperAdmin={userRole === 'super_admin'} />;
      case 'leads': return <GlobalLeadsView leads={leads} />;
      case 'social-leads': return <SocialMediaLeadsView leads={socialMediaLeads} />;
      case 'lead-allocation': return <LeadAllocationManager />;
      case 'bulk-lead-upload': return <BulkLeadUpload />;
      case 'projects': return <AllPropertiesView type="Projects" data={projects.filter(p => p.propertyType === 'project')} userRole={userRole} onPropertyAdded={refreshProjects} />;
      case 'plots': return <AllPropertiesView type="Plots" data={projects.filter(p => p.propertyType === 'plot')} userRole={userRole} onPropertyAdded={refreshProjects} />;
      case 'farmlands': return <AllPropertiesView type="Farm Lands" data={projects.filter(p => p.propertyType === 'farmland')} userRole={userRole} onPropertyAdded={refreshProjects} />;
      case 'bulk-property-upload': return <BulkPropertyUpload />;
      case 'client-listings': return <ClientListingsVerification />;
      case 'resale': return <ResalePropertiesAdmin userRole={userRole} />;
      case 'agents': return <PilotManagement />;
      case 'admin-users': return <AdminUsersManagement />;
      case 'attendance': return <AttendanceTrackingView />;
      case 'verification': return <AdminVerificationPanel />;
      case 'alerts': return <MessagesAndAlertsView onBroadcast={handleBroadcast} />;
      case 'properties-config': return <PropertiesConfigView />;
      case 'category-cms': return <CategoryCMSView />;
      case 'footer-cms': return <FooterCMSView config={footerConfig} onChange={onFooterConfigChange} />;
      case 'settings': return <SystemSettings />;
      default: return null;
    }
  }, [activeTab, handleBroadcast, leads, projects, userRole, refreshProjects]);

  return (
    <div data-testid={TEST_IDS.SUPER_ADMIN.CONTAINER} className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        data-testid={TEST_IDS.SUPER_ADMIN.SIDEBAR_TOGGLE}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
      </button>

      {/* Sidebar */}
      <aside data-testid={TEST_IDS.SUPER_ADMIN.SIDEBAR} className={`
        fixed md:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center mb-10">
            <Logo className="h-10" animated={true} />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-600 mt-1 bg-indigo-50 px-2 py-1 rounded-md ml-2"
            >
              Super Admin
            </motion.span>
          </div>

          <nav className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {tabGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
                <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        key={tab.id}
                        data-testid={TEST_IDS.SUPER_ADMIN.NAV_TAB(tab.id)}
                        onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="text-sm">{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                  SA
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Super Admin</p>
                  <p className="text-[10px] text-slate-500">admin@howzy.com</p>
                </div>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              data-testid={TEST_IDS.SUPER_ADMIN.LOGOUT_BTN}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main data-testid={TEST_IDS.SUPER_ADMIN.CONTENT_AREA} className="flex-1 h-screen overflow-y-auto bg-slate-50/50">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 pl-12 md:pl-0">
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search platform..."
                className="bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm w-64 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-all ${
                  showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-white border border-slate-200 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-700 tracking-wider"
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notification) => {
                              const Icon = notification.icon;
                              return (
                                <div 
                                  key={notification.id} 
                                  className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                                    notification.unread ? 'bg-indigo-50/30' : ''
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    notification.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                    notification.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                                    notification.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-sm font-bold text-slate-900 truncate">{notification.title}</p>
                                      <span className="text-[10px] text-slate-400 font-medium">{notification.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{notification.message}</p>
                                  </div>
                                  {notification.unread && (
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bell className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-900">No notifications</p>
                            <p className="text-xs text-slate-500 mt-1">We'll alert you when something happens</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeView}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ResalePropertiesAdmin({ userRole }: { readonly userRole: string }) {
  const [resaleList, setResaleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [actionMsg, setActionMsg] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', price: '', propertyType: 'Apartment', city: '', location: '', area: '', bedrooms: '', bathrooms: '', description: '' });
  const [addSubmitting, setAddSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apiService = React.useMemo(() => require('../services/api').api, []);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (cityFilter) params.city = cityFilter;
      const data = await apiService.getAdminResaleProperties(params);
      setResaleList(data.resaleProperties ?? []);
    } catch {
      setResaleList([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cityFilter, apiService]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleStatus = async (id: string, status: 'Listed' | 'Rejected', remarks?: string) => {
    try {
      await apiService.updateResaleStatus(id, status, remarks);
      setActionMsg({ id, type: 'success', text: `Marked as ${status}` });
      fetchList();
    } catch (e: any) {
      setActionMsg({ id, type: 'error', text: e?.message ?? 'Failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('Delete this resale property permanently?')) return;
    try {
      await apiService.deleteResaleProperty(id);
      fetchList();
    } catch (e: any) {
      setActionMsg({ id, type: 'error', text: e?.message ?? 'Delete failed' });
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    try {
      await apiService.createAdminResaleProperty({
        ...addForm,
        bedrooms: addForm.bedrooms ? Number(addForm.bedrooms) : undefined,
        bathrooms: addForm.bathrooms ? Number(addForm.bathrooms) : undefined,
      });
      setShowAddForm(false);
      setAddForm({ title: '', price: '', propertyType: 'Apartment', city: '', location: '', area: '', bedrooms: '', bathrooms: '', description: '' });
      fetchList();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to add');
    } finally {
      setAddSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
    let cls: string;
    if (s === 'Listed') {
      cls = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (s === 'Rejected') {
      cls = 'bg-red-50 text-red-700 border-red-200';
    } else {
      cls = 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-6 h-6 text-amber-600" /> Resale Properties</h2>
          <p className="text-slate-500 text-sm mt-1">Review client submissions and manage listed resale properties</p>
        </div>
        <button onClick={() => setShowAddForm(v => !v)} data-testid={TEST_IDS.SUPER_ADMIN.RESALE_ADD_TOGGLE} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Directly
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-4">Add Resale Property (Listed immediately)</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="add-resale-title" className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
              <input id="add-resale-title" data-testid={TEST_IDS.SUPER_ADMIN.RESALE_TITLE_INPUT} required value={addForm.title} onChange={e => setAddForm(f => ({...f, title: e.target.value}))} placeholder="3BHK Apartment in Kondapur" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-type" className="block text-xs font-semibold text-slate-600 mb-1">Type *</label>
              <select id="add-resale-type" data-testid={TEST_IDS.SUPER_ADMIN.RESALE_TYPE_SELECT} required value={addForm.propertyType} onChange={e => setAddForm(f => ({...f, propertyType: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                {['Apartment','Villa','Independent House','Plot','Commercial'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="add-resale-price" className="block text-xs font-semibold text-slate-600 mb-1">Price *</label>
              <input id="add-resale-price" data-testid={TEST_IDS.SUPER_ADMIN.RESALE_PRICE_INPUT} required value={addForm.price} onChange={e => setAddForm(f => ({...f, price: e.target.value}))} placeholder="₹85 Lakhs" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-city" className="block text-xs font-semibold text-slate-600 mb-1">City *</label>
              <input id="add-resale-city" required value={addForm.city} onChange={e => setAddForm(f => ({...f, city: e.target.value}))} placeholder="Hyderabad" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-location" className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
              <input id="add-resale-location" value={addForm.location} onChange={e => setAddForm(f => ({...f, location: e.target.value}))} placeholder="Kondapur, near HITEC City" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-area" className="block text-xs font-semibold text-slate-600 mb-1">Area (sq ft)</label>
              <input id="add-resale-area" value={addForm.area} onChange={e => setAddForm(f => ({...f, area: e.target.value}))} placeholder="1450" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-bedrooms" className="block text-xs font-semibold text-slate-600 mb-1">Bedrooms</label>
              <input id="add-resale-bedrooms" type="number" value={addForm.bedrooms} onChange={e => setAddForm(f => ({...f, bedrooms: e.target.value}))} placeholder="3" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label htmlFor="add-resale-bathrooms" className="block text-xs font-semibold text-slate-600 mb-1">Bathrooms</label>
              <input id="add-resale-bathrooms" type="number" value={addForm.bathrooms} onChange={e => setAddForm(f => ({...f, bathrooms: e.target.value}))} placeholder="2" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="add-resale-description" className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea id="add-resale-description" rows={2} value={addForm.description} onChange={e => setAddForm(f => ({...f, description: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" data-testid={TEST_IDS.SUPER_ADMIN.RESALE_SUBMIT_BTN} disabled={addSubmitting} className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors">
                {addSubmitting ? 'Adding…' : 'Add & List'}
              </button>
              <button type="button" data-testid={TEST_IDS.SUPER_ADMIN.RESALE_CANCEL_BTN} onClick={() => setShowAddForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select data-testid={TEST_IDS.SUPER_ADMIN.RESALE_STATUS_FILTER} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Listed">Listed</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input value={cityFilter} onChange={e => setCityFilter(e.target.value)} placeholder="Filter by city…" className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        )}
        {!loading && resaleList.length === 0 && (
          <div className="p-12 text-center text-slate-400">No resale properties found.</div>
        )}
        {!loading && resaleList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Property</th>
                  <th className="p-4 font-semibold">Type / City</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Submitted By</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resaleList.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{r.title}</div>
                      <div className="text-xs text-slate-400">{r.location || r.city}</div>
                      {actionMsg?.id === r.id && (
                        <div className={`text-xs mt-1 font-medium ${actionMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{actionMsg.text}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">{r.propertyType}</div>
                      <div className="text-xs text-slate-400">{r.city}</div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{r.price}</td>
                    <td className="p-4">
                      <div className="text-sm text-slate-700">{r.submittedBy}</div>
                      <div className="text-xs text-slate-400 capitalize">{r.submittedByRole}</div>
                    </td>
                    <td className="p-4">{statusBadge(r.status)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {r.status === 'Pending' && (
                          <>
                            <button onClick={() => handleStatus(r.id, 'Listed')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => { const rm = globalThis.prompt('Rejection reason (optional):') ?? undefined; handleStatus(r.id, 'Rejected', rm); }} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {r.status === 'Listed' && (
                          <button onClick={() => handleStatus(r.id, 'Rejected', 'Delisted by admin')} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-bold hover:bg-slate-200 transition-colors">
                            Delist
                          </button>
                        )}
                        {r.status === 'Rejected' && (
                          <button onClick={() => handleStatus(r.id, 'Listed')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-bold hover:bg-emerald-100 transition-colors">
                            Re-List
                          </button>
                        )}
                        {userRole === 'super_admin' && (
                          <button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-1">
                            <X className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryCMSView() {
  const [selectedCategory, setSelectedCategory] = useState('Resale');
  const [activeSubTab, setActiveSubTab] = useState('Hero');

  const categories = ['Resale', 'Projects', 'Plots', 'Farm Lands', 'Commercial'];
  const subTabs = ['Hero', 'USPs', 'Lifestyle', 'Process', 'ROI'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Category Landing Page CMS</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage dynamic content for each property category</p>
        </div>
        <button 
          onClick={() => alert('CMS changes saved successfully!')}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Save All Changes
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        <div className="flex border-b border-slate-100">
          {subTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-8 py-4 font-bold text-sm transition-all relative ${
                activeSubTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeSubTab === tab && (
                <motion.div layoutId="subTab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory + activeSubTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {activeSubTab === 'Hero' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Hero Title</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20" defaultValue="Move-in Ready Luxury Homes" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Hero Subtitle</label>
                      <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 h-24" defaultValue="Skip the wait. Explore premium resale properties in prime locations with immediate possession." />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">CTA Text</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20" defaultValue="View Resale Homes" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Hero Background Image URL</label>
                    <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 relative group">
                      <img src="https://images.unsplash.com/photo-1600607687931-cecebd80d62f?auto=format&fit=crop&w=800&q=80" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Change Image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'USPs' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">USP {i}</span>
                        <button className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                        <Home className="w-5 h-5 text-slate-600" />
                      </div>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" defaultValue="Ready to Move" />
                      <textarea className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs h-20" defaultValue="No construction delays. Move in today." />
                    </div>
                  ))}
                  <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all">
                    <Plus className="w-6 h-6" />
                    <span className="font-bold text-sm">Add USP</span>
                  </button>
                </div>
              )}

              {activeSubTab === 'ROI' && (
                <div className="max-w-2xl space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ROI Value</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" defaultValue="+8.5%" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">ROI Label</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3" defaultValue="Avg. Annual Appreciation" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ROI Description</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-24" defaultValue="Prime locations are seeing steady growth due to limited supply." />
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <h5 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Recommendation Logic
                    </h5>
                    <p className="text-sm text-indigo-700 mb-4">This text is dynamically generated based on market data. You can override it here.</p>
                    <textarea className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm h-24" placeholder="Enter custom AI recommendation..." />
                  </div>
                </div>
              )}

              {/* Other tabs would follow similar patterns */}
              {(activeSubTab === 'Lifestyle' || activeSubTab === 'Process') && (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400">
                  <Layout className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">Content Editor for {activeSubTab} coming soon.</p>
                  <p className="text-sm">This section will allow you to manage the {activeSubTab.toLowerCase()} items for {selectedCategory}.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const MessagesAndAlertsView = React.memo(function MessagesAndAlertsView({ onBroadcast }: { onBroadcast: (notif: any) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleSend = () => {
    if (!title || !message) return;
    setIsSending(true);
    
    // Simulate network delay
    setTimeout(() => {
      onBroadcast({
        title,
        message,
        type,
        icon: type === 'alert' ? 'AlertTriangle' : type === 'success' ? 'CheckCircle' : 'Megaphone',
        color: type === 'alert' ? 'amber' : type === 'success' ? 'emerald' : 'indigo'
      });
      
      setIsSending(false);
      setSentCount(prev => prev + 1);
      setTitle('');
      setMessage('');
      
      // Auto-hide success message after 3s
      setTimeout(() => setSentCount(0), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Broadcast to All Partners</h3>
            <p className="text-sm text-slate-500">Send a platform-wide notification to all registered pilots instantly.</p>
          </div>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Notification Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., New Training Session Available"
              className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the detailed message for pilots..."
              className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Notification Type</label>
            <div className="flex gap-4">
              {['info', 'alert', 'success'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    type === t 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={!title || !message || isSending}
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSending ? 'Sending Broadcast...' : 'Send to All Partners'}</span>
            </motion.button>
            
            <AnimatePresence>
              {sentCount > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-600 text-xs font-bold mt-4 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Broadcast sent successfully to all active pilots!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Broadcast History</h3>
        <div className="space-y-4">
          {[
            { title: "System Maintenance", time: "2 days ago", reach: "1,240 pilots", type: "alert" },
            { title: "New Commission Structure", time: "1 week ago", reach: "1,180 pilots", type: "success" },
            { title: "Welcome to Howzy Partner", time: "2 weeks ago", reach: "1,050 partners", type: "info" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'alert' ? 'bg-amber-500' : 
                  item.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`} />
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{item.time} • Reached {item.reach}</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const AdminOverview = React.memo(function AdminOverview() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLATFORM_STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenue Growth</h3>
              <p className="text-sm text-slate-500">Platform-wide revenue performance</p>
            </div>
            <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-600 py-2 px-3">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_CHART_DATA}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `₹${v/10000000}Cr`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Property Mix</h3>
          <p className="text-sm text-slate-500 mb-8">Distribution of listings</p>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PROPERTY_DISTRIBUTION}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {PROPERTY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">100%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
            </div>
          </div>
          <div className="space-y-3 mt-6">
            {PROPERTY_DISTRIBUTION.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-slate-900">Recent Platform Activity</h3>
          <button className="text-indigo-600 text-sm font-bold hover:underline">View All Logs</button>
        </div>
        <div className="space-y-6">
          {[
            { user: "Partner 007", action: "Closed a deal", target: "Prestige High Fields", time: "2 mins ago", icon: CheckCircle },
            { user: "Howzer HYD", action: "Added new partner", target: "Suresh Kumar", time: "15 mins ago", icon: UserPlus },
            { user: "System", action: "New project approved", target: "My Home Sayuk", time: "1 hour ago", icon: Building2 },
            { user: "Howzer BLR", action: "Revenue payout requested", target: "₹4.5L", time: "3 hours ago", icon: DollarSign },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <activity.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    <span className="text-indigo-600">{activity.user}</span> {activity.action} <span className="text-slate-500">{activity.target}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{activity.time}</p>
                </div>
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const StatCard = React.memo(function StatCard({ title, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 font-mono">{value}</h4>
    </motion.div>
  );
});

const PilotManagement = React.memo(function PilotManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPartners = React.useMemo(() => {
    return PARTNERS_DATA.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.franchise.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);
  
  const { currentData: paginatedPartners, currentPage, maxPage, next, prev } = usePagination(filteredPartners, 10);

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Partner Directory</h3>
          <p className="text-sm text-slate-500">Total 1,240 partners across all Howzers</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search partners..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="px-8 py-4">Partner Name</th>
              <th className="px-8 py-4">Howzer</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4">Total Deals</th>
              <th className="px-8 py-4">Earnings</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedPartners.map((agent, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {agent.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">{agent.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium">{agent.franchise}</td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    agent.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {agent.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-900">{agent.deals}</td>
                <td className="px-8 py-5 text-sm font-mono font-bold text-emerald-600">{agent.earnings}</td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {maxPage > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {currentPage} of {maxPage}</span>
          <div className="flex gap-2">
            <button onClick={prev} disabled={currentPage === 1} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Prev</button>
            <button onClick={next} disabled={currentPage === maxPage} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
});

const PROPERTY_TYPE_MAP: Record<string, 'project' | 'plot' | 'farmland'> = {
  Projects: 'project',
  Plots: 'plot',
  'Farm Lands': 'farmland',
};

const AllPropertiesView = React.memo(function AllPropertiesView({
  type,
  data,
  userRole,
  onPropertyAdded,
}: {
  type: string;
  data: any[];
  userRole?: string;
  onPropertyAdded?: () => void;
}) {
  const { currentData: displayData, currentPage, maxPage, next, prev } = usePagination(data, 10);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    developerName: '',
    city: '',
    reraNumber: '',
    usp: '',
    projectType: '',
  });

  const propertyType = PROPERTY_TYPE_MAP[type] ?? 'project';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    try {
      const result = await api.addProperty({ ...formData, propertyType });
      if (result.pending) {
        setToastMsg('Submitted for approval. Super admin will review it.');
      } else {
        setToastMsg(`${type.slice(0, -1)} added successfully!`);
        onPropertyAdded?.();
      }
      setShowModal(false);
      setFormData({ name: '', location: '', developerName: '', city: '', reraNumber: '', usp: '', projectType: '' });
    } catch {
      setToastMsg('Failed to add property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in">
          {toastMsg}
          <button onClick={() => setToastMsg('')} className="ml-4 text-white/70 hover:text-white">✕</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Global {type}</h3>
          <p className="text-slate-500">Monitoring all {type.toLowerCase()} across the platform</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all">
            Export Report
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            + Add New {type.slice(0, -1)}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-slate-900">
                {userRole === 'super_admin' ? `Add ${type.slice(0, -1)}` : `Submit ${type.slice(0, -1)} for Approval`}
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {userRole !== 'super_admin' && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-5">
                As admin, this property will be submitted for super admin approval before being listed.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                  placeholder={`${type.slice(0, -1)} name`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Location</label>
                  <input name="location" value={formData.location} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                    placeholder="Location" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">City</label>
                  <input name="city" value={formData.city} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                    placeholder="City" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Developer Name</label>
                <input name="developerName" value={formData.developerName} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                  placeholder="Developer / Builder" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">RERA Number</label>
                  <input name="reraNumber" value={formData.reraNumber} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                    placeholder="RERA/P123..." />
                </div>
                {propertyType === 'project' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Project Type</label>
                    <select name="projectType" value={formData.projectType} onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none bg-white">
                      <option value="">Select type</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Mixed">Mixed Use</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">USP</label>
                <input name="usp" value={formData.usp} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                  placeholder="Unique selling point" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-60">
                  {submitting ? 'Submitting…' : userRole === 'super_admin' ? `Add ${type === 'Farm Lands' ? 'Farm Land' : type.slice(0, -1)}` : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                <th className="px-8 py-4">Property Name</th>
                <th className="px-8 py-4">Developer</th>
                <th className="px-8 py-4">Location</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 text-sm">
                    No {type.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                displayData.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-900">{item.name}</span>
                    </td>
                    <td className="px-8 py-5 text-sm text-indigo-600 font-medium">{item.developerName || item.builderName}</td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">{item.location}</td>
                    <td className="px-8 py-5">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold">
                        {item.status ?? 'Listed'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>
      {maxPage > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {currentPage} of {maxPage}</span>
          <div className="flex gap-2">
            <button onClick={prev} disabled={currentPage === 1} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Prev</button>
            <button onClick={next} disabled={currentPage === maxPage} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
});

const GlobalLeadsView = React.memo(function GlobalLeadsView({ leads }: { leads: any[] }) {
  const { currentData: displayLeads, currentPage, maxPage, next, prev } = usePagination(leads, 10);

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100">
        <h3 className="text-xl font-bold text-slate-900">Platform-wide Leads</h3>
        <p className="text-sm text-slate-500">Real-time lead generation across all regions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
              <th className="px-8 py-4">Lead Name</th>
              <th className="px-8 py-4">Assigned Pilot</th>
              <th className="px-8 py-4">Partner</th>
              <th className="px-8 py-4">Stage</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {displayLeads.map((lead, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5">
                  <span className="font-bold text-slate-900">{lead.name}</span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-600 font-medium">Partner 007</td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium">Hyderabad</td>
                <td className="px-8 py-5">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold">
                    {lead.milestone}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {maxPage > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {currentPage} of {maxPage}</span>
          <div className="flex gap-2">
            <button onClick={prev} disabled={currentPage === 1} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Prev</button>
            <button onClick={next} disabled={currentPage === maxPage} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
});

const AdminUsersManagement = React.memo(function AdminUsersManagement() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getAdminUsers();
      setUsers(response.users ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async () => {
    if (!form.displayName || !form.email || !form.password) return;
    setSaving(true);
    setError(null);
    try {
      await api.createAdminUser({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setForm({ displayName: '', email: '', password: '' });
      await loadUsers();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create admin user');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (uid: string, data: { displayName?: string; email?: string; password?: string; status?: 'active' | 'disabled' }) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateAdminUser(uid, data);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update admin user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid: string, email: string) => {
    if (!window.confirm(`Delete admin user ${email}? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.deleteAdminUser(uid);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete admin user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Create Admin User</h3>
        <p className="text-sm text-slate-500 mb-6">Only super admins can create and manage admin accounts.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Full Name"
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Temporary Password"
            className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm"
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleCreate}
            disabled={saving || !form.displayName || !form.email || !form.password}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Create Admin'}
          </button>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
      </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Admin Users</h3>
          <button
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                <th className="px-8 py-4">Name</th>
                <th className="px-8 py-4">Email</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td className="px-8 py-6 text-sm text-slate-500" colSpan={5}>Loading admin users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="px-8 py-6 text-sm text-slate-500" colSpan={5}>No admin users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">{user.displayName || '-'}</td>
                    <td className="px-8 py-5 text-sm text-slate-600">{user.email}</td>
                    <td className="px-8 py-5 text-sm text-slate-600">{user.role}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            const nextName = window.prompt('Update display name', user.displayName ?? '');
                            if (nextName && nextName.trim() && nextName !== user.displayName) {
                              void handleUpdate(user.uid, { displayName: nextName.trim() });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                        >
                          Edit Name
                        </button>
                        <button
                          onClick={() => {
                            const nextEmail = window.prompt('Update email', user.email ?? '');
                            if (nextEmail && nextEmail.trim() && nextEmail !== user.email) {
                              void handleUpdate(user.uid, { email: nextEmail.trim() });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                        >
                          Edit Email
                        </button>
                        <button
                          onClick={() => {
                            const nextPassword = window.prompt('Set new password (min 6 chars)');
                            if (nextPassword && nextPassword.trim().length >= 6) {
                              void handleUpdate(user.uid, { password: nextPassword.trim() });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => void handleUpdate(user.uid, { status: user.status === 'active' ? 'disabled' : 'active' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${user.status === 'active' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                        >
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => void handleDelete(user.uid, user.email)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

const SystemSettings = React.memo(function SystemSettings() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Platform Configuration</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
              <p className="text-xs text-slate-500">Disable platform access for all users</p>
            </div>
            <button className="w-12 h-6 bg-slate-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Automatic Payouts</p>
              <p className="text-xs text-slate-500">Process franchise payouts automatically every month</p>
            </div>
            <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Lead Auto-Assignment</p>
              <p className="text-xs text-slate-500">Use AI to assign leads to best performing pilots</p>
            </div>
            <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Security & Access</h3>
        <div className="space-y-4">
          <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-all">
            Manage Super Admin Roles
          </button>
          <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-all">
            View Audit Logs
          </button>
          <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-700 transition-all">
            API Configuration
          </button>
        </div>
      </div>
    </div>
  );
});

const SocialMediaLeadsView = React.memo(function SocialMediaLeadsView({ leads: socialMediaLeads }: { leads: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  const uniqueStatuses = ['All', ...Array.from(new Set(socialMediaLeads.map(l => l.status)))];
  const uniqueSources = ['All', ...Array.from(new Set(socialMediaLeads.map(l => l.campaignSource)))];

  const filteredLeads = socialMediaLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || lead.campaignSource === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  const { currentData, next, prev, currentPage, maxPage } = usePagination(filteredLeads, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads or campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            {uniqueSources.map(s => <option key={s} value={s}>{s} Source</option>)}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          >
            {uniqueStatuses.map(s => <option key={s} value={s}>{s} Status</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Details</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Info</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Requirements</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentData.map((lead, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{lead.contact}</div>
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-indigo-600">{lead.campaignSource}</div>
                    <div className="text-xs text-slate-500 mt-1">{lead.campaignName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{lead.date}</div>
                  </td>
                  <td className="p-6">
                    <div className="font-bold text-slate-700">{lead.budget}</div>
                    <div className="text-xs text-slate-500 mt-1">{lead.locationPreferred}</div>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.assignedTo === 'Unassigned' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}>
                      {lead.assignedTo}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.status === 'New' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      lead.status === 'Qualified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {maxPage > 1 && (
        <div className="flex justify-between items-center px-4">
          <p className="text-sm text-slate-500 font-medium">Page {currentPage} of {maxPage}</p>
          <div className="flex gap-2">
            <button onClick={prev} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-50 font-bold text-sm hover:bg-slate-50 transition-colors">Prev</button>
            <button onClick={next} disabled={currentPage === maxPage} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl disabled:opacity-50 font-bold text-sm hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
});

const AttendanceTrackingView = React.memo(() => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [logs, setLogs] = useState<LocationLog[]>([]);

  useEffect(() => {
    setRecords(getAttendanceRecords());
    setLogs(getLocationLogs());
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Attendance & Tracking</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor partner and builder daily activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Report */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h4 className="font-bold text-slate-900">Daily Attendance Report</h4>
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Punch In</th>
                  <th className="pb-4">Punch Out</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {records.length > 0 ? records.map(record => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-medium text-slate-900">{record.userEmail}</td>
                    <td className="py-4 text-slate-500">{record.date}</td>
                    <td className="py-4 text-slate-500">
                      {record.punchInTime ? new Date(record.punchInTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-4 text-slate-500">
                      {record.punchOutTime ? new Date(record.punchOutTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        record.status === 'Working' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No attendance records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Tracking Timeline */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h4 className="font-bold text-slate-900">Location Tracking Logs</h4>
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar relative">
            {logs.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {logs.slice().reverse().map((log, index) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-600 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 text-sm">{log.userEmail}</div>
                        <time className="font-medium text-indigo-600 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</time>
                      </div>
                      <div className="text-slate-500 text-xs">
                        Lat: {log.lat.toFixed(4)}, Lng: {log.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">No location logs found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const PropertiesConfigView = React.memo(() => {
  const [adminConfig, setAdminConfig] = React.useState({
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
    }
  });

  const handleToggle = (category: string, filter: string) => {
    setAdminConfig(prev => ({
      ...prev,
      [category as keyof typeof prev]: {
        ...prev[category as keyof typeof prev],
        [filter]: !prev[category as keyof typeof prev][filter as keyof typeof prev[keyof typeof prev]]
      }
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to the backend
    alert('Configuration saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Properties Configuration</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage filters and settings for each property category</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(adminConfig).map(([category, filters]) => (
          <div key={category} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-lg">{category} Filters</h4>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(filters).map(([filterKey, isEnabled]) => (
                <div key={filterKey} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{filterKey.replace('enable', '')}</p>
                      <p className="text-xs text-slate-500">Toggle visibility for users</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isEnabled}
                      onChange={() => handleToggle(category, filterKey)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const FooterCMSView = React.memo(({ config, onChange }: { config?: any, onChange?: (config: any) => void }) => {
  const defaultFooterConfig = {
    categories: [
      { label: 'Resale Homes', value: 'Resale' },
      { label: 'New Projects', value: 'Projects' },
      { label: 'Plots', value: 'Plots' },
      { label: 'Commercial Spaces', value: 'Commercial' },
      { label: 'Farm Lands', value: 'Farm Lands' }
    ],
    projectFilters: [
      { label: 'Trending Projects', filter: 'Trending' },
      { label: 'Luxury Projects', filter: 'Luxury' },
      { label: 'Budget Homes', filter: 'Budget' },
      { label: 'Ready to Move', filter: 'Ready' },
      { label: 'New Launches', filter: 'New' }
    ],
    locations: [
      { label: 'Gachibowli', value: 'Gachibowli' },
      { label: 'Hitech City', value: 'Hitech City' },
      { label: 'Kondapur', value: 'Kondapur' },
      { label: 'Whitefield', value: 'Whitefield' },
      { label: 'Noida Extension', value: 'Noida Extension' }
    ],
    services: [
      { label: 'Home Loans', action: 'Home Loans' },
      { label: 'Instant Property Evaluation', action: 'Instant Property Evaluation' },
      { label: 'Documentation Support', action: 'Documentation Support' },
      { label: 'Schedule Site Visit', action: 'Schedule Site Visit' }
    ],
    company: [
      { label: 'About HOWZY', link: 'About HOWZY' },
      { label: 'Why HOWZY', link: 'Why HOWZY' },
      { label: 'Careers', link: 'Careers' },
      { label: 'Blog', link: 'Blog' }
    ],
    partners: [
      { label: 'Channel Partner Program', link: 'Channel Partner Program' },
      { label: 'List Your Property', link: 'List Your Property' },
      { label: 'Contact Us', link: 'Contact Us' },
      { label: 'FAQs', link: 'FAQs' }
    ],
    legal: [
      { label: 'Privacy Policy', link: 'Privacy Policy' },
      { label: 'Terms & Conditions', link: 'Terms & Conditions' }
    ],
    contact: {
      phone: '+91 98765 43210',
      email: 'hello@howzy.com',
      address: '123, Tech Park, Hitech City, Hyderabad',
      timing: '10 AM – 7 PM'
    }
  };

  const [footerConfig, setFooterConfig] = useState(config || defaultFooterConfig);

  const handleSave = () => {
    if (onChange) {
      // Transform the data back to the format Footer expects
      const transformedConfig = {
        categories: footerConfig.categories.map((c: any) => c.label),
        projectFilters: footerConfig.projectFilters.map((c: any) => c.label),
        locations: footerConfig.locations.map((c: any) => c.label),
        services: footerConfig.services.map((c: any) => c.label),
        company: footerConfig.company.map((c: any) => c.label),
        partners: footerConfig.partners.map((c: any) => c.label),
        legal: footerConfig.legal.map((c: any) => c.label),
        contact: {
          call: footerConfig.contact.phone,
          email: footerConfig.contact.email,
          location: footerConfig.contact.address,
          time: footerConfig.contact.timing
        }
      };
      onChange(transformedConfig);
    }
    alert('Footer configuration saved successfully!');
  };

  const updateField = (section: string, index: number, field: string, value: string) => {
    setFooterConfig((prev: any) => {
      const newSection = [...prev[section]];
      newSection[index] = { ...newSection[index], [field]: value };
      return { ...prev, [section]: newSection };
    });
  };

  const updateContact = (field: string, value: string) => {
    setFooterConfig((prev: any) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Footer CMS</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage all footer links, sections, and contact information</p>
        </div>
        <button 
          onClick={handleSave}
          className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Save Footer Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Explore Categories</h4>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.categories.map((cat: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={cat.label} 
                  onChange={(e) => updateField('categories', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={cat.value} 
                  onChange={(e) => updateField('categories', i, 'value', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Value"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Project Filters Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Project Filters</h4>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.projectFilters.map((filter: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={filter.label} 
                  onChange={(e) => updateField('projectFilters', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={filter.filter} 
                  onChange={(e) => updateField('projectFilters', i, 'filter', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Filter Key"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Locations Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Trending Locations</h4>
            <MapPin className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.locations.map((loc: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={loc.label} 
                  onChange={(e) => updateField('locations', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={loc.value} 
                  onChange={(e) => updateField('locations', i, 'value', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Value"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Services</h4>
            <Briefcase className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.services.map((service: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={service.label} 
                  onChange={(e) => updateField('services', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={service.action} 
                  onChange={(e) => updateField('services', i, 'action', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Action"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Company Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Company Links</h4>
            <Home className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.company.map((item: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.label} 
                  onChange={(e) => updateField('company', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={item.link} 
                  onChange={(e) => updateField('company', i, 'link', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Link"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Partners Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Partners & Support</h4>
            <MessageCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.partners.map((item: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.label} 
                  onChange={(e) => updateField('partners', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={item.link} 
                  onChange={(e) => updateField('partners', i, 'link', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Link"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Legal Links</h4>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            {footerConfig.legal.map((item: any, i: number) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.label} 
                  onChange={(e) => updateField('legal', i, 'label', e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Label"
                />
                <input 
                  type="text" 
                  value={item.link} 
                  onChange={(e) => updateField('legal', i, 'link', e.target.value)}
                  className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Link"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Contact Details</h4>
            <Phone className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Phone Number</label>
              <input 
                type="text" 
                value={footerConfig.contact.phone} 
                onChange={(e) => updateContact('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Email Address</label>
              <input 
                type="text" 
                value={footerConfig.contact.email} 
                onChange={(e) => updateContact('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Office Address</label>
              <input 
                type="text" 
                value={footerConfig.contact.address} 
                onChange={(e) => updateContact('address', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1">Working Hours</label>
              <input 
                type="text" 
                value={footerConfig.contact.timing} 
                onChange={(e) => updateContact('timing', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
