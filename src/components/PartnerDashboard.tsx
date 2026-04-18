import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Building, 
  Sparkles, 
  Users, 
  MapPin, 
  CheckCircle, 
  Wallet,
  LogOut,
  Menu,
  X,
  Search,
  Filter,
  PhoneCall,
  MessageCircle,
  CalendarClock,
  Map,
  Trees,
  Bell,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Calendar as CalendarIcon,
  UserPlus,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Logo from './Logo';
import AssignedLeadsTable from './AssignedLeadsTable';
import GoogleCalendarWidget from './GoogleCalendarWidget';
import TasksWidget from './TasksWidget';
import { api } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

const maskContact = (contact: string | undefined) => {
  if (!contact) return 'N/A';
  
  const digitCount = (contact.match(/\d/g) || []).length;
  if (digitCount <= 4) return contact;
  
  let maskedCount = 0;
  const digitsToMask = digitCount - 4;
  
  return contact.replaceAll(/\d/g, (match) => {
    if (maskedCount < digitsToMask) {
      maskedCount++;
      return '*';
    }
    return match;
  });
};

interface PartnerDashboardProps {
  readonly onLogout: () => void;
}

export default function PartnerDashboard({ onLogout }: PartnerDashboardProps) {
  const [activeTab, setActiveTab] = useState('listed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newLeadToast] = useState<any>(null);
  const [upcomingProjects, setUpcomingProjects] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>({ totalEarningValue: '₹0', totalBookingsMonth: 0, bookings: [] });
  const [listedPlots, setListedPlots] = useState<any[]>([]);
  const [listedFarmLands, setListedFarmLands] = useState<any[]>([]);

  const firestoreNotifications = useNotifications('pilot');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, leadsData, assignedLeadsData] = await Promise.all([
          api.getProjects(),
          api.getLeads(),
          api.getPilotAssignedEnquiries()
        ]);
        setProjects(projectsData.projects);
        setLeads(leadsData.leads);
        setAssignedLeads(assignedLeadsData.enquiries || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchData();

    api.getProjects({ type: 'Plot' }).then(d => setListedPlots(d.projects ?? [])).catch(() => {});
    api.getProjects({ type: 'Farm Land' }).then(d => setListedFarmLands(d.projects ?? [])).catch(() => {});
    api.getProjects().then(d => {
      const upcoming = (d.projects ?? []).filter((p: any) => p.status === 'Upcoming' || p.projectStatus === 'Upcoming');
      setUpcomingProjects(upcoming);
    }).catch(() => {});
    api.getEarnings().then(d => setEarnings(d)).catch(() => {});
  }, []);

  const unreadCount = firestoreNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setShowNotifications(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.updateEnquiryStatus(id, status);
      const data = await api.getPilotAssignedEnquiries();
      setAssignedLeads(data.enquiries || []);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleUploadDeed = (leadId: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, documentUploaded: true } : lead
    ));
  };

  const handleCreateLead = async (newLead: any) => {
    try {
      const res = await api.createLead(newLead);
      setLeads([{ ...newLead, id: res.id }, ...leads]);
    } catch (error) {
      console.error("Failed to create lead", error);
    }
  };

  const handleUpdateLead = (id: string, updates: any) => {
    setLeads(leads.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ));
  };

  const tabs = [
    { id: 'listed', label: 'Listed Projects', icon: Building },
    { id: 'plots', label: 'Listed Plots', icon: Map },
    { id: 'farmlands', label: 'Listed Farm Lands', icon: Trees },
    { id: 'upcoming', label: 'Upcoming Projects', icon: Sparkles },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'assigned-leads', label: 'My Assigned Leads', icon: UserPlus },
    { id: 'visited', label: 'Site Visited Clients', icon: MapPin },
    { id: 'booked', label: 'Booked Clients', icon: CheckCircle },
    { id: 'earnings', label: 'Earnings', icon: Wallet },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out shadow-lg md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex items-center mb-8">
            <Logo className="h-8" animated={true} />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md ml-2"
            >
              Pilot
            </motion.span>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
                  <span>{tab.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-6 md:p-10 pt-20 md:pt-10">
        <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 pl-12 md:pl-0">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl transition-all ${
                showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-6 h-6" />
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
                    className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      <button 
                        onClick={markAllAsRead}
                        className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-700 tracking-wider"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {firestoreNotifications.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                          {firestoreNotifications.map((notification) => {
                            const getNotifIcon = () => { if (notification.type === 'alert') return AlertTriangle; if (notification.type === 'success') return CheckCircle2; return Megaphone; };
                            const Icon = getNotifIcon();
                            const getColorClass = () => { if (notification.type === 'alert') return 'bg-amber-100 text-amber-600'; if (notification.type === 'success') return 'bg-emerald-100 text-emerald-600'; return 'bg-indigo-100 text-indigo-600'; };
                            const colorClass = getColorClass();
                            return (
                              <div 
                                key={notification.id} 
                                className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                                  notification.read ? '' : 'bg-indigo-50/30'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{notification.type}</p>
                                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">{notification.message}</p>
                                  <p className="text-[9px] text-slate-400 mt-1">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs text-slate-500">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="max-w-6xl mx-auto"
          >
            {activeTab === 'listed' && <ListedProjectsView projects={projects.filter(p => p.propertyType === 'project')} loading={projectsLoading} />}
            {activeTab === 'plots' && <ListedPlotsView projects={listedPlots} />}
            {activeTab === 'farmlands' && <ListedFarmLandsView projects={listedFarmLands} />}
            {activeTab === 'upcoming' && <UpcomingProjectsView projects={upcomingProjects} />}
            {activeTab === 'leads' && <LeadsView leads={leads} projects={projects} onUploadDeed={handleUploadDeed} onCreateLead={handleCreateLead} onUpdateLead={handleUpdateLead} />}
            {activeTab === 'assigned-leads' && <AssignedLeadsTable assignedLeads={assignedLeads} onStatusUpdate={handleStatusUpdate} title="My Assigned Leads" />}
            {activeTab === 'visited' && <SiteVisitedView leads={leads} projects={projects} />}
            {activeTab === 'booked' && <BookedClientsView leads={leads} projects={projects} onUploadDeed={handleUploadDeed} />}
            {activeTab === 'earnings' && <EarningsView earnings={earnings} />}
            {activeTab === 'calendar' && (
              <div className="h-[600px]">
                <GoogleCalendarWidget />
              </div>
            )}
            {activeTab === 'tasks' && <TasksWidget />}
          </motion.div>
        </AnimatePresence>

        {/* New Lead Toast Notification */}
        <AnimatePresence>
          {newLeadToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-6 left-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 min-w-[300px]"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">{newLeadToast.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {newLeadToast.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Sub-components for each view

function PropertyTable({ data, columns, onRowClick, loading = false }: { readonly data: any[], readonly columns: any[], readonly onRowClick?: (row: any) => void, readonly loading?: boolean }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className={`p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}
                  onClick={() => col.sortable && requestSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-400 flex flex-col">
                        {(() => {
                          const isActive = sortConfig !== null && sortConfig.key === col.key;
                          if (!isActive) return <ArrowUpDown className="w-3 h-3" />;
                          return sortConfig.direction === 'asc'
                            ? <ChevronUp className="w-3 h-3 text-indigo-600" />
                            : <ChevronDown className="w-3 h-3 text-indigo-600" />;
                        })()}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row, i) => (
              <tr 
                key={row.id || i} 
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 text-sm text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400 text-sm">
                    <svg className="animate-spin w-5 h-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading properties…
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-slate-500">
                  No properties found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListedProjectsView({ projects = [], loading = false }: { projects?: any[]; loading?: boolean }) {
  const [locationFilter, setLocationFilter] = useState("All");
  const [projectTypeFilter, setProjectTypeFilter] = useState("All");
  const [projectSegmentFilter, setProjectSegmentFilter] = useState("All");
  const [possessionFilter, setPossessionFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  const uniqueLocations = ["All", ...Array.from(new Set(projects.map(p => p.location)))];
  const uniqueProjectTypes = ["All", "Highraise", "Gated", "Semi gated", "Standalone"];
  const uniqueProjectSegments = ["All", "Luxury", "Premium", "Mid range"];
  const uniquePossessions = ["All", "RTMI", "Under Construction"];
  
  const filteredProjects = projects.filter(project => {
    const matchesLocation = locationFilter === "All" || project.location === locationFilter;
    const matchesType = projectTypeFilter === "All" || project.projectType === projectTypeFilter;
    const matchesSegment = projectSegmentFilter === "All" || project.projectSegment === projectSegmentFilter;
    const matchesPossession = possessionFilter === "All" || project.possession === possessionFilter;
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.developerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesType && matchesSegment && matchesPossession && matchesSearch;
  });

  const columns = [
    { 
      key: 'uniqueId', 
      label: 'ID / RERA', 
      sortable: true,
      render: (p: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-indigo-700">{p.uniqueId}</span>
          <span className="text-xs text-slate-500 font-mono">RERA: {p.reraNumber}</span>
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Project Details', 
      sortable: true,
      render: (p: any) => (
        <div>
          <div className="font-semibold text-slate-900">{p.name}</div>
          <div className="text-xs text-indigo-600">By {p.developerName}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <MapPin className="w-3 h-3" /> {p.location}
          </div>
        </div>
      )
    },
    {
      key: 'attributes',
      label: 'Attributes',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {p.projectType && <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.projectType}</span>}
          {p.projectSegment && <span className="text-[10px] uppercase font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{p.projectSegment}</span>}
          {p.possession && <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{p.possession}</span>}
        </div>
      )
    },
    {
      key: 'availability',
      label: 'Availability',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.availability ? (
            <>
              <span className="text-slate-600">2BHK: <span className="font-mono font-medium text-slate-900">{p.availability['2BHK']}</span></span>
              <span className="text-slate-600">3BHK: <span className="font-mono font-medium text-slate-900">{p.availability['3BHK']}</span></span>
            </>
          ) : (
            <span className="text-slate-400">N/A</span>
          )}
        </div>
      )
    },
    {
      key: 'builderPoc',
      label: 'Builder POC',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.builderPoc ? (
            <>
              <span className="font-medium text-slate-900">{p.builderPoc.name}</span>
              <span className="font-mono text-slate-500">{maskContact(p.builderPoc.contact)}</span>
            </>
          ) : (
            <span className="text-slate-400">Not Assigned</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row justify-end items-start md:items-end gap-4">
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects or developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mr-2">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors shadow-sm"
          >
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
            ))}
          </select>

          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors shadow-sm"
          >
            {uniqueProjectTypes.map(type => (
              <option key={type} value={type}>{type === "All" ? "All Types" : type}</option>
            ))}
          </select>

          <select
            value={projectSegmentFilter}
            onChange={(e) => setProjectSegmentFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors shadow-sm"
          >
            {uniqueProjectSegments.map(segment => (
              <option key={segment} value={segment}>{segment === "All" ? "All Segments" : segment}</option>
            ))}
          </select>

          <select
            value={possessionFilter}
            onChange={(e) => setPossessionFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-colors shadow-sm"
          >
            {uniquePossessions.map(possession => (
              <option key={possession} value={possession}>{possession === "All" ? "All Possessions" : possession}</option>
            ))}
          </select>
        </div>
      </div>

      <PropertyTable data={filteredProjects} columns={columns} onRowClick={setSelectedProject} />

      <AnimatePresence>
        {selectedProject && (
          <>
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setSelectedProject(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedProject.name}</h3>
                  <p className="text-sm text-slate-500">By {selectedProject.developerName}</p>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Project Details</h4>
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">ID</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.uniqueId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">RERA</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.reraNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Location</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Type</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.projectType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Segment</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.projectSegment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Possession</span>
                          <span className="text-sm font-bold text-slate-900">{selectedProject.possession}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Unique Selling Proposition</h4>
                      <div className="bg-indigo-50 text-indigo-700 rounded-xl p-4 text-sm font-medium">
                        {selectedProject.usp || "Not specified"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Availability</h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        {selectedProject.availability ? (
                          <div className="space-y-2">
                            {Object.entries(selectedProject.availability).map(([type, count]: any) => (
                              <div key={type} className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700">{type}</span>
                                <span className="px-2 py-1 bg-white rounded border border-slate-200 text-sm font-bold text-slate-900">{count} Units</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">Availability information not provided</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Builder POC</h4>
                      <div className="bg-slate-50 rounded-xl p-4">
                        {selectedProject.builderPoc ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                {selectedProject.builderPoc.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{selectedProject.builderPoc.name}</p>
                                <p className="text-xs font-mono text-slate-500">{selectedProject.builderPoc.contact}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No POC assigned</p>
                        )}
                      </div>
                    </div>
                    
                    {selectedProject.mapLink && (
                      <a 
                        href={selectedProject.mapLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors"
                      >
                        <MapPin className="w-4 h-4" /> View on Map
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ListedPlotsView({ projects = [] }: { projects?: any[] }) {
  const [locationFilter, setLocationFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const uniqueLocations = ["All", ...Array.from(new Set(projects.map(p => p.location)))];
  
  const filteredPlots = projects.filter(plot => {
    const matchesLocation = locationFilter === "All" || plot.location === locationFilter;
    const matchesSearch = plot.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          plot.developerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const columns = [
    { 
      key: 'uniqueId', 
      label: 'ID / RERA', 
      sortable: true,
      render: (p: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-indigo-700">{p.uniqueId}</span>
          <span className="text-xs text-slate-500 font-mono">RERA: {p.reraNumber}</span>
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Plot Details', 
      sortable: true,
      render: (p: any) => (
        <div>
          <div className="font-semibold text-slate-900">{p.name}</div>
          <div className="text-xs text-indigo-600">By {p.developerName}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <MapPin className="w-3 h-3" /> {p.location}
          </div>
        </div>
      )
    },
    {
      key: 'usp',
      label: 'USP',
      sortable: false,
      render: (p: any) => (
        <div className="text-xs text-slate-600 max-w-[200px] truncate" title={p.usp}>
          {p.usp}
        </div>
      )
    },
    {
      key: 'availability',
      label: 'Availability',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.availability ? Object.entries(p.availability).map(([size, count]) => (
            <span key={size} className="text-slate-600">{size}: <span className="font-mono font-medium text-slate-900">{count as React.ReactNode}</span></span>
          )) : <span className="text-slate-400">N/A</span>}
        </div>
      )
    },
    {
      key: 'builderPoc',
      label: 'Builder POC',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.builderPoc ? (
            <>
              <span className="font-medium text-slate-900">{p.builderPoc.name}</span>
              <span className="font-mono text-slate-500">{maskContact(p.builderPoc.contact)}</span>
            </>
          ) : (
            <span className="text-slate-400">Not Assigned</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-end gap-4 mb-8">
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plots or developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm"
            />
          </div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm"
          >
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
            ))}
          </select>
        </div>
      </div>

      <PropertyTable data={filteredPlots} columns={columns} />
    </div>
  );
}

function ListedFarmLandsView({ projects = [] }: { projects?: any[] }) {
  const [locationFilter, setLocationFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const uniqueLocations = ["All", ...Array.from(new Set(projects.map(p => p.location)))];
  
  const filteredFarmLands = projects.filter(farm => {
    const matchesLocation = locationFilter === "All" || farm.location === locationFilter;
    const matchesSearch = farm.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          farm.developerName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesSearch;
  });

  const columns = [
    { 
      key: 'uniqueId', 
      label: 'ID / RERA', 
      sortable: true,
      render: (p: any) => (
        <div className="flex flex-col gap-1">
          <span className="font-mono font-bold text-emerald-700">{p.uniqueId}</span>
          <span className="text-xs text-slate-500 font-mono">RERA: {p.reraNumber}</span>
        </div>
      )
    },
    { 
      key: 'name', 
      label: 'Farm Land Details', 
      sortable: true,
      render: (p: any) => (
        <div>
          <div className="font-semibold text-slate-900">{p.name}</div>
          <div className="text-xs text-emerald-600">By {p.developerName}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <MapPin className="w-3 h-3" /> {p.location}
          </div>
        </div>
      )
    },
    {
      key: 'usp',
      label: 'USP',
      sortable: false,
      render: (p: any) => (
        <div className="text-xs text-slate-600 max-w-[200px] truncate" title={p.usp}>
          {p.usp}
        </div>
      )
    },
    {
      key: 'availability',
      label: 'Availability',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.availability ? Object.entries(p.availability).map(([size, count]) => (
            <span key={size} className="text-slate-600">{size}: <span className="font-mono font-medium text-slate-900">{count as React.ReactNode}</span></span>
          )) : <span className="text-slate-400">N/A</span>}
        </div>
      )
    },
    {
      key: 'builderPoc',
      label: 'Builder POC',
      sortable: false,
      render: (p: any) => (
        <div className="flex flex-col gap-1 text-xs">
          {p.builderPoc ? (
            <>
              <span className="font-medium text-slate-900">{p.builderPoc.name}</span>
              <span className="font-mono text-slate-500">{maskContact(p.builderPoc.contact)}</span>
            </>
          ) : (
            <span className="text-slate-400">Not Assigned</span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-end items-start md:items-end gap-4 mb-8">
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search farm lands or developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors shadow-sm"
            />
          </div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors shadow-sm"
          >
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
            ))}
          </select>
        </div>
      </div>

      <PropertyTable data={filteredFarmLands} columns={columns} />
    </div>
  );
}

function UpcomingProjectsView({ projects = [] }: { projects?: any[] }) {
  const [locationFilter, setLocationFilter] = useState("All");
  const uniqueLocations = ["All", ...Array.from(new Set(projects.map(p => p.location)))];
  
  const filteredProjects = projects.filter(project => 
    locationFilter === "All" || project.location === locationFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-end items-start sm:items-end gap-4 mb-8">
        
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors shadow-sm w-full sm:w-auto"
        >
          {uniqueLocations.map(loc => (
            <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
          ))}
        </select>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(project => (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              key={project.id} 
              className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden group shadow-sm hover:shadow-xl transition-all"
            >
              {/* Blurred background image */}
              <div className="absolute inset-0 z-0 bg-slate-100">
                <img 
                  src={`https://picsum.photos/seed/${project.id}/800/600`} 
                  alt="Upcoming" 
                  className="w-full h-full object-cover blur-md opacity-40 group-hover:opacity-60 transition-opacity"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="relative z-10 p-8 h-full flex flex-col justify-center items-center text-center bg-white/40 backdrop-blur-sm">
                <Sparkles className="w-12 h-12 text-indigo-600 mb-4 animate-pulse drop-shadow-md" />
                <h3 className="text-2xl font-bold text-slate-900 mb-1 drop-shadow-sm">{project.builderName}</h3>
                <p className="text-sm text-slate-800 font-medium mb-4 drop-shadow-sm flex items-center justify-center gap-1 bg-white/50 px-3 py-1 rounded-full backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5"/> {project.location}
                </p>
                <p className="text-xl text-emerald-700 font-semibold mb-6 drop-shadow-sm">{project.teaser}</p>
                
                <div className="bg-white/90 backdrop-blur-xl p-4 rounded-xl border border-slate-200 shadow-lg">
                  <p className="text-slate-700 blur-[4px] select-none transition-all duration-500 group-hover:blur-[2px] font-medium">
                    {project.details}
                  </p>
                  <p className="text-xs text-indigo-600 mt-2 font-mono uppercase tracking-widest font-bold">Classified</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No upcoming projects</h3>
          <p className="text-slate-500">No upcoming projects found in this location.</p>
        </div>
      )}
    </div>
  );
}

function AddLeadModal({ onClose, onSubmit }: { onClose: () => void, onSubmit: (lead: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    budget: '',
    locationPreferred: '',
    lookingBhk: '2BHK'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead = {
      id: `lead-${Date.now()}`,
      ...formData,
      milestone: 'Briefing call',
      documentUploaded: false
    };
    onSubmit(newLead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Add New Lead</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Contact Number</label>
            <input 
              required
              type="tel" 
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Budget</label>
              <input 
                required
                type="text" 
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="e.g. 85L - 1.2Cr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Looking BHK</label>
              <select 
                value={formData.lookingBhk}
                onChange={(e) => setFormData({...formData, lookingBhk: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="1BHK">1 BHK</option>
                <option value="2BHK">2 BHK</option>
                <option value="3BHK">3 BHK</option>
                <option value="4BHK">4 BHK</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Preferred Location</label>
            <input 
              required
              type="text" 
              value={formData.locationPreferred}
              onChange={(e) => setFormData({...formData, locationPreferred: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. Gachibowli, Hyderabad"
            />
          </div>

          <div className="pt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Create Lead
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LeadsView({ leads, projects = [], onUploadDeed, onCreateLead, onUpdateLead }: { leads: any[], projects?: any[], onUploadDeed: (id: string) => void, onCreateLead: (newLead: any) => void, onUpdateLead: (id: string, updates: any) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [bhkFilter, setBhkFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [reminderLead, setReminderLead] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [reminderToast, setReminderToast] = useState<{leadName: string, date: string, note?: string} | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSetReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (reminderLead && reminderDate) {
      const lead = leads.find(l => l.name === reminderLead);
      if (lead) {
        onUpdateLead(lead.id, {
          followUpDate: reminderDate,
          followUpNote: reminderNote
        });
      }

      setReminderToast({ 
        leadName: reminderLead, 
        date: new Date(reminderDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        note: reminderNote
      });
      setReminderLead(null);
      setReminderDate("");
      setReminderNote("");
      
      setTimeout(() => {
        setReminderToast(null);
      }, 4000);
    }
  };

  const getConversionProgress = (milestone: string) => {
    switch (milestone) {
      case "Briefing call": return 25;
      case "Site visit": return 50;
      case "10% advance stage": return 75;
      case "Booking done": return 100;
      default: return 0;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.includes(searchQuery);
    const matchesStatus =
      statusFilter === "All" || lead.milestone === statusFilter;
    const matchesBhk = bhkFilter === "All" || lead.lookingBhk === bhkFilter;
    const matchesLocation =
      locationFilter === "All" || lead.locationPreferred === locationFilter;

    return matchesSearch && matchesStatus && matchesBhk && matchesLocation;
  });

  const uniqueStatuses = ["All", ...Array.from(new Set(leads.map(l => l.milestone)))];
  const uniqueBhks = ["All", ...Array.from(new Set(leads.map(l => l.lookingBhk)))];
  const uniqueLocations = ["All", ...Array.from(new Set(leads.map(l => l.locationPreferred)))];

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-end mb-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-md shadow-indigo-600/20"
        >
          + Add New Lead
        </motion.button>
      </div>

      {isAddModalOpen && (
        <AddLeadModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSubmit={(newLead) => {
            onCreateLead(newLead);
            setIsAddModalOpen(false);
          }} 
        />
      )}

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>
        <div className="flex flex-wrap md:flex-nowrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status === "All" ? "All Statuses" : status}</option>
            ))}
          </select>
          <select
            value={bhkFilter}
            onChange={(e) => setBhkFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            {uniqueBhks.map(bhk => (
              <option key={bhk} value={bhk}>{bhk === "All" ? "All BHK" : bhk}</option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          >
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc === "All" ? "All Locations" : loc}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Client Details</th>
                <th className="p-4 font-semibold">Requirements</th>
                <th className="p-4 font-semibold">Milestone</th>
                <th className="p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-500 font-mono">
                          {lead.contact}
                        </p>
                        <div className="flex items-center gap-1">
                          <a 
                            href={`tel:${lead.contact.replace(/[^0-9+]/g, '')}`}
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                            title="Call Direct"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                          <a 
                            href={`https://wa.me/${lead.contact.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                            title="WhatsApp Message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <button 
                            onClick={() => setReminderLead(lead.name)}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-md transition-colors"
                            title="Set Follow-up Reminder"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">
                        {lead.lookingBhk} • {lead.locationPreferred}
                      </p>
                      <p className="text-xs text-emerald-600 font-mono mt-1 font-semibold">
                        {lead.budget}
                      </p>
                      {(lead as any).followUpDate && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            Follow-up: {new Date((lead as any).followUpDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          {(lead as any).followUpNote && (
                            <p className="text-[10px] text-amber-600 mt-1 italic">
                              "{(lead as any).followUpNote}"
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          lead.milestone === "Booking done"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : lead.milestone === "10% advance stage"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {lead.milestone}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setReminderLead(lead.name)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                        Set Reminder
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calling Toast Overlay */}
      <AnimatePresence>
        {reminderToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 min-w-[300px]"
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center relative">
              <CalendarClock className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <p className="font-semibold text-sm">Reminder Set</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Follow up with <span className="text-white font-medium">{reminderToast.leadName}</span> on {reminderToast.date}
              </p>
              {reminderToast.note && (
                <p className="text-xs text-amber-200 mt-1 italic border-l-2 border-amber-500/50 pl-2">
                  "{reminderToast.note}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {reminderLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-indigo-600" />
                  Set Follow-up
                </h3>
                <button 
                  onClick={() => setReminderLead(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSetReminder} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Client Name
                  </label>
                  <input 
                    type="text" 
                    value={reminderLead} 
                    disabled 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Note / Update
                  </label>
                  <textarea 
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="Add details about the follow-up..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-4 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none h-24"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setReminderLead(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-md shadow-indigo-600/20"
                  >
                    Save Reminder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SiteVisitedView({ leads, projects = [] }: { leads: any[], projects?: any[] }) {
  const visitedLeads = leads.filter((l) =>
    ["Site visit", "10% advance stage", "Booking done"].includes(l.milestone),
  );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visitedLeads.map((lead) => (
          <motion.div
            whileHover={{ y: -4 }}
            key={lead.id}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {lead.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{lead.contact}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Project</span>
                <span className="text-slate-900 font-medium">{projects.find(p => p.id === lead.projectId)?.name || lead.projectId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Status</span>
                <span className="text-indigo-600 font-medium">{lead.milestone}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BookedClientsView({ leads, projects = [], onUploadDeed }: { leads: any[], projects?: any[], onUploadDeed: (id: string) => void }) {
  const bookedLeads = leads.filter(l => l.milestone === 'Booking done');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookedLeads.map(lead => (
          <motion.div 
            whileHover={{ y: -4 }}
            key={lead.id} 
            className="bg-white border border-emerald-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4" />
            <CheckCircle className="absolute top-4 right-4 w-6 h-6 text-emerald-500" />
            
            <h3 className="font-semibold text-xl text-slate-900 mb-1">{lead.name}</h3>
            <p className="text-sm text-slate-600 mb-4 font-medium">{projects.find(p => p.id === lead.projectId)?.name || lead.projectId}</p>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
              <p className="text-xs text-slate-500 uppercase mb-1 font-semibold">Ticket Value</p>
              <p className="text-lg font-mono text-emerald-600 font-bold">{lead.budget}</p>
            </div>

            {!lead.documentUploaded ? (
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  id={`upload-booked-${lead.id}`} 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      onUploadDeed(lead.id);
                    }
                  }}
                />
                <motion.label 
                  htmlFor={`upload-booked-${lead.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full block text-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer font-medium"
                >
                  Upload 10% Deed
                </motion.label>
              </div>
            ) : (
              <div className="w-full text-center text-sm bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 border border-emerald-100">
                <CheckCircle className="w-4 h-4" /> Document Uploaded
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EarningsView({ earnings = { totalEarningValue: '₹0', totalBookingsMonth: 0, bookings: [] } }: { earnings?: any }) {
  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-500 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-indigo-600/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <h3 className="text-indigo-100 font-medium mb-2 relative z-10">Total Earnings (This Month)</h3>
          <p className="text-5xl font-bold text-white font-mono relative z-10">{earnings.totalEarningValue}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-center shadow-sm"
        >
          <h3 className="text-slate-500 font-medium mb-2">Total Bookings</h3>
          <p className="text-5xl font-bold text-slate-900 font-mono">{earnings.totalBookingsMonth}</p>
        </motion.div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Booking Details & Invoice Stages</h3>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Client & Property</th>
                <th className="p-4 font-semibold">Ticket Value</th>
                <th className="p-4 font-semibold">Invoice Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earnings.bookings.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{booking.clientName}</p>
                    <p className="text-sm text-slate-500 font-medium">{booking.propertyName}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-emerald-600 font-mono font-semibold">{booking.ticketValue}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      booking.invoiceStage === 'Invoice released' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      booking.invoiceStage === 'Successful' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {booking.invoiceStage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
