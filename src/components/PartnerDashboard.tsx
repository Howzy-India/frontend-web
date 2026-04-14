import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  LogOut,
  Activity,
  UserPlus,
  Construction,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  MapPin,
  Camera,
  Phone,
  Trash2,
  Eye,
} from 'lucide-react';
import Logo from './Logo';
import BuilderOnboardingModal from './BuilderOnboardingModal';
import PartnerOnboardingModal from './PartnerOnboardingModal';
import FarmLandOnboardingModal from './FarmLandOnboardingModal';
import PlotsOnboardingModal from './PlotsOnboardingModal';
import AttendanceModal from './AttendanceModal';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import CreateProjectModal from './CreateProjectModal';
import AssignedLeadsTable from './AssignedLeadsTable';

interface PartnerDashboardProps {
  onLogout: () => void;
  userEmail?: string;
}

export default function PartnerDashboard({ onLogout, userEmail = '' }: PartnerDashboardProps) {
  const { user } = useAuth();
  const userRole = user?.role ?? 'howzer_sourcing';
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isFarmLandModalOpen, setIsFarmLandModalOpen] = useState(false);
  const [isPlotsModalOpen, setIsPlotsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; data: any } | null>(null);
  const [viewingProject, setViewingProject] = useState<Record<string, unknown> | null>(null);
  const [projectToastMsg, setProjectToastMsg] = useState('');
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [myOnboardedProjects, setMyOnboardedProjects] = useState<any[]>([]);
  
  // Attendance State
  const [attendance, setAttendance] = useState<any | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out'>('in');
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assigned-leads'>('dashboard');
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);

  const reloadOnboardedProjects = () => {
    api.getMyOnboardedProjects()
      .then(data => setMyOnboardedProjects(data.projects || []))
      .catch(() => {});
  };

  const handleDeleteProject = async (rawId: string) => {
    if (!confirm('Delete this project submission? This cannot be undone.')) return;
    try {
      await api.deleteProject(rawId);
      setProjectToastMsg('Project deleted.');
      setTimeout(() => setProjectToastMsg(''), 3000);
      reloadOnboardedProjects();
    } catch {
      setProjectToastMsg('Failed to delete project.');
      setTimeout(() => setProjectToastMsg(''), 3000);
    }
  };

  // Merge onboarded projects (PostgreSQL) + partner submissions (Firestore) into one list
  const allSubmissions = [
    ...myOnboardedProjects.map((p: any) => {
      const isPending = p.status === 'PENDING_APPROVAL';
      return {
        id: `proj-${p.id}`,
        rawId: p.uniqueId ?? String(p.id),
        name: p.name,
        subId: p.uniqueId,
        type: 'Project',
        date: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
        status: isPending ? 'Pending' : (p.status === 'ACTIVE' ? 'Approved' : 'Rejected'),
        rawProject: p,
        canEdit: isPending,
        canDelete: isPending,
      };
    }),
    ...mySubmissions.map((s: any) => ({
      id: s.id,
      rawId: null as string | null,
      name: s.name,
      subId: s.details?.partnerId,
      type: s.type,
      date: s.date,
      status: s.status as string,
      rawProject: null as any,
      canEdit: s.status === 'Pending',
      canDelete: false,
    })),
  ];

  useEffect(() => {
    // Always use partner-specific endpoint (authenticated)
    api.getPartnerSubmissions()
      .then(data => setMySubmissions(data.submissions || []))
      .catch(() => {});
    api.getPartnerAssignedEnquiries()
      .then(data => setAssignedLeads(data.enquiries || []))
      .catch(() => {});
    reloadOnboardedProjects();
    // Load today's attendance from API
    if (userEmail) {
      api.getTodayAttendance(userEmail)
        .then(data => setAttendance(data.record ?? null))
        .catch(() => {});
    }
  }, [userEmail]);

  // Location Tracking Effect
  useEffect(() => {
    let watchId: number;
    if (attendance?.status === 'Working' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          api.logLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            userEmail,
          }).catch(() => {});
        },
        (error) => console.error('Location tracking error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [attendance, userEmail]);

  const handleAttendanceSubmit = async (data: { photo: string; location: { lat: number; lng: number } }) => {
    try {
      if (attendanceType === 'in') {
        await api.punchIn({ photo: data.photo, location: data.location, userEmail });
      } else {
        await api.punchOut({ photo: data.photo, location: data.location, userEmail });
      }
      // Refresh attendance state from API
      if (userEmail) {
        const result = await api.getTodayAttendance(userEmail);
        setAttendance(result.record ?? null);
      }
      setIsAttendanceModalOpen(false);
    } catch (error) {
      console.error('Attendance error:', error);
    }
  };

  // howzer_sourcing: Project / FarmLand / Plots only; howzer_sales: Partner only
  const showBuilderOnboarding = userRole === 'howzer_sourcing';
  const showPartnerOnboarding = userRole === 'howzer_sales';

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.updatePartnerEnquiryStatus(id, status);
      const data = await api.getPartnerAssignedEnquiries();
      setAssignedLeads(data.enquiries || []);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center">
          <Logo className="h-8" animated={true} />
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md ml-2"
          >
            Howzer
          </motion.span>
          {userEmail && (
            <span className="ml-4 text-sm font-medium text-slate-500 hidden sm:inline-block">
              Logged in as: <span className="text-indigo-600">{userEmail}</span>
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Attendance Button */}
          {(!attendance || attendance.status === 'Working') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAttendanceType(!attendance ? 'in' : 'out');
                setIsAttendanceModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${
                !attendance 
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              {!attendance ? 'Punch In' : 'Punch Out'}
            </motion.button>
          )}
          {attendance?.status === 'Completed' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 text-slate-500 border border-slate-200">
              <CheckCircle2 className="w-4 h-4" />
              Shift Completed
            </div>
          )}

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-100 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Tabs Navigation */}
        <div className="flex space-x-4 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Dashboard
            {activeTab === 'dashboard' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('assigned-leads')}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${
              activeTab === 'assigned-leads' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Assigned Leads
            {activeTab === 'assigned-leads' && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
            )}
          </button>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {showPartnerOnboarding && (
                <StatCard 
                  title="Partners Onboarded" 
                  value="124" 
                  trend="+12" 
                  icon={Users} 
                  color="emerald" 
                />
              )}
              {showBuilderOnboarding && (
                <StatCard 
                  title="Projects Onboard" 
                  value={myOnboardedProjects.length.toString()} 
                  trend={`+${myOnboardedProjects.filter((p: any) => p.status === 'PENDING_APPROVAL').length}`}
                  icon={Building2} 
                  color="indigo" 
                />
              )}
              {showBuilderOnboarding && (
                <StatCard 
                  title="Projects Listed" 
                  value="156" 
                  trend="+24" 
                  icon={Activity} 
                  color="amber" 
                />
              )}
              <StatCard 
                title="Pending Approvals" 
                value={(mySubmissions.filter(s => s.status === 'Pending').length + myOnboardedProjects.filter((p: any) => p.status === 'PENDING_APPROVAL').length).toString()} 
                trend="0" 
                icon={UserPlus} 
                color="blue" 
              />
            </div>

            {/* Onboarding Section */}
            <div className={`grid grid-cols-1 ${showBuilderOnboarding && showPartnerOnboarding ? 'md:grid-cols-2' : ''} gap-6`}>
              {showPartnerOnboarding && (
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                    <UserPlus className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Onboard Partner</h3>
                    <p className="text-indigo-100 mb-6 max-w-xs">
                      Invite and register a new Howzy Partner to your franchise network.
                    </p>
                    <button 
                      onClick={() => setIsPartnerModalOpen(true)}
                      className="flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      Start Onboarding <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {showBuilderOnboarding && (
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Onboard Project</h3>
                    <p className="text-emerald-100 mb-6 max-w-xs">
                      Submit a new real estate project for super admin approval.
                    </p>
                    <button 
                      onClick={() => setIsProjectModalOpen(true)}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                      Submit Project <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {showBuilderOnboarding && (
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                    <MapPin className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Onboard Farm Land</h3>
                    <p className="text-amber-100 mb-6 max-w-xs">
                      Submit farm land details for verification and listing.
                    </p>
                    <button 
                      onClick={() => setIsFarmLandModalOpen(true)}
                      className="flex items-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-xl font-bold hover:bg-amber-50 transition-colors shadow-sm"
                    >
                      Start Onboarding <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {showBuilderOnboarding && (
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Onboard Plots</h3>
                    <p className="text-blue-100 mb-6 max-w-xs">
                      Submit plot project details for verification and listing.
                    </p>
                    <button 
                      onClick={() => setIsPlotsModalOpen(true)}
                      className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm"
                    >
                      Start Onboarding <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* My Submissions Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">My Onboarding Submissions</h3>
                  <p className="text-sm text-slate-500 mt-1">Track the status of your uploaded partners, builders and onboarded projects.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Type</th>
                      <th className="p-4 font-semibold">Date Submitted</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allSubmissions.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{row.name}</div>
                          {row.subId && (
                            <div className="text-xs text-indigo-600 font-medium mt-0.5">{row.subId}</div>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">{row.type}</td>
                        <td className="p-4 text-slate-600">{row.date}</td>
                        <td className="p-4">
                          <div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              row.status === 'Rejected'  ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {row.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {row.status === 'Rejected'  && <XCircle className="w-3.5 h-3.5" />}
                              {row.status === 'Pending'   && <Clock className="w-3.5 h-3.5" />}
                              {row.status === 'Pending' ? 'Pending Approval' : row.status}
                            </span>
                            {row.status === 'Rejected' && row.rawProject?.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1 max-w-xs" title={row.rawProject.rejectionReason}>
                                Reason: {row.rawProject.rejectionReason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {row.rawProject && (
                              <button
                                onClick={() => setViewingProject(row.rawProject as Record<string, unknown>)}
                                title="View project"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                            )}
                            {row.canEdit && row.rawProject && (
                              <button
                                onClick={() => setEditingProject({ id: row.rawId!, data: row.rawProject })}
                                title="Edit project"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            {row.canEdit && !row.rawProject && (
                              <button
                                onClick={() => row.type === 'Builder' ? setIsBuilderModalOpen(true) : setIsPartnerModalOpen(true)}
                                title="Edit project"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                              </button>
                            )}
                            {row.canDelete && row.rawId && (
                              <button
                                onClick={() => handleDeleteProject(row.rawId as string)}
                                title="Delete project"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allSubmissions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No submissions found for your account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <AssignedLeadsTable assignedLeads={assignedLeads} onStatusUpdate={handleStatusUpdate} />
        )}
      </main>

      <BuilderOnboardingModal 
        isOpen={isBuilderModalOpen} 
        onClose={() => setIsBuilderModalOpen(false)} 
        onSubmit={async (data) => {
          try {
            const submissionData = {
              type: 'Builder',
              name: data.builderName,
              email: userEmail || 'unknown@example.com',
              details: data
            };
            const res = await api.createSubmission(submissionData);
            setMySubmissions(prev => [{
              id: res.id,
              type: 'Builder',
              name: data.builderName,
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
      <PartnerOnboardingModal 
        isOpen={isPartnerModalOpen} 
        onClose={() => setIsPartnerModalOpen(false)} 
        onSubmit={async (data) => {
          try {
            const submissionData = {
              type: 'Partner',
              name: data.partnerName,
              email: userEmail || 'unknown@example.com',
              details: data
            };
            const res = await api.createSubmission(submissionData);
            setMySubmissions(prev => [{
              id: res.id,
              type: 'Partner',
              name: data.partnerName,
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
            setMySubmissions(prev => [{
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
            setMySubmissions(prev => [{
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
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        type={attendanceType}
        onSubmit={handleAttendanceSubmit}
      />
      {isProjectModalOpen && (
        <CreateProjectModal
          propertyType="PROJECT"
          userRole={userRole}
          onClose={() => setIsProjectModalOpen(false)}
          onSuccess={() => {
            setIsProjectModalOpen(false);
            setProjectToastMsg('Project submitted for approval!');
            setTimeout(() => setProjectToastMsg(''), 4000);
            reloadOnboardedProjects();
          }}
        />
      )}
      {editingProject && (
        <CreateProjectModal
          propertyType="PROJECT"
          userRole={userRole}
          projectId={editingProject.id}
          initialData={editingProject.data}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null);
            setProjectToastMsg('Project updated successfully!');
            setTimeout(() => setProjectToastMsg(''), 4000);
            reloadOnboardedProjects();
          }}
        />
      )}
      {viewingProject && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setViewingProject(null)}
          onKeyDown={e => e.key === 'Escape' && setViewingProject(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Project Details"
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 overflow-y-auto max-h-[80vh]"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Project Details</h2>
              <button onClick={() => setViewingProject(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {([
                ['Project Name', viewingProject.name as string],
                ['Developer', viewingProject.developerName as string],
                ['Type', viewingProject.propertyType as string],
                ['Status', viewingProject.status as string],
                ['Zone', viewingProject.zone as string],
                ['Cluster / Location', viewingProject.location as string],
                ['City', viewingProject.city as string],
                ['State', viewingProject.state as string],
                ['RERA', viewingProject.reraNumber as string],
                ['Submitted On', viewingProject.createdAt ? new Date(viewingProject.createdAt as string).toLocaleString() : '—'],
              ] as [string, string][]).map(([label, value]) => value ? (
                <div key={label} className="flex gap-3">
                  <span className="w-40 shrink-0 font-medium text-slate-500">{label}</span>
                  <span className="text-slate-800">{value}</span>
                </div>
              ) : null)}
            </div>
          </div>
        </div>
      )}
      {projectToastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          {projectToastMsg}
          <button onClick={() => setProjectToastMsg('')} className="ml-4 text-white/70 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 hover:shadow-lg transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
          {trend}
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 font-mono">{value}</p>
    </motion.div>
  );
}
