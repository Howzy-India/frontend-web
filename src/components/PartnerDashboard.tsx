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
  Phone
} from 'lucide-react';
import Logo from './Logo';
import BuilderOnboardingModal from './BuilderOnboardingModal';
import PartnerOnboardingModal from './PartnerOnboardingModal';
import FarmLandOnboardingModal from './FarmLandOnboardingModal';
import PlotsOnboardingModal from './PlotsOnboardingModal';
import AttendanceModal from './AttendanceModal';
import { getTodayAttendance, saveAttendanceRecord, saveLocationLog, AttendanceRecord } from '../utils/attendanceStore';
import { api } from '../services/api';

interface PartnerDashboardProps {
  onLogout: () => void;
  userEmail?: string;
}

export default function PartnerDashboard({ onLogout, userEmail = '' }: PartnerDashboardProps) {
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isFarmLandModalOpen, setIsFarmLandModalOpen] = useState(false);
  const [isPlotsModalOpen, setIsPlotsModalOpen] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  
  // Attendance State
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out'>('in');
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assigned-leads'>('dashboard');
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);

  useEffect(() => {
    if (userEmail) {
      setAttendance(getTodayAttendance(userEmail));
      api.getSubmissions(userEmail).then(data => setMySubmissions(data.submissions || []));
      api.getPartnerAssignedEnquiries().then(data => setAssignedLeads(data.enquiries || []));
    } else {
      api.getSubmissions().then(data => setMySubmissions(data.submissions || []));
      api.getPartnerAssignedEnquiries().then(data => setAssignedLeads(data.enquiries || []));
    }
  }, [userEmail]);

  // Location Tracking Effect
  useEffect(() => {
    let watchId: number;
    if (attendance?.status === 'Working' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          saveLocationLog({
            id: Date.now().toString(),
            userEmail,
            timestamp: new Date().toISOString(),
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Location tracking error:', error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [attendance, userEmail]);

  const handleAttendanceSubmit = (data: { photo: string; location: { lat: number; lng: number } }) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (attendanceType === 'in') {
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        userEmail,
        date: today,
        punchInTime: now.toISOString(),
        punchOutTime: null,
        punchInLocation: data.location,
        punchOutLocation: null,
        punchInPhoto: data.photo,
        punchOutPhoto: null,
        status: 'Working'
      };
      saveAttendanceRecord(newRecord);
      setAttendance(newRecord);
    } else if (attendance && attendanceType === 'out') {
      const updatedRecord: AttendanceRecord = {
        ...attendance,
        punchOutTime: now.toISOString(),
        punchOutLocation: data.location,
        punchOutPhoto: data.photo,
        status: 'Completed'
      };
      saveAttendanceRecord(updatedRecord);
      setAttendance(updatedRecord);
    }
  };

  const showBuilderOnboarding = userEmail === '1234@gmail.com' || (!userEmail.includes('1234') && !userEmail.includes('45678'));
  const showPartnerOnboarding = userEmail === '45678@gmail.com' || (!userEmail.includes('1234') && !userEmail.includes('45678'));

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await api.updateEnquiryStatus(id, status);
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
                  title="Builders Onboarded" 
                  value="42" 
                  trend="+3" 
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
                value={mySubmissions.filter(s => s.status === 'Pending').length.toString()} 
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
                    <Construction className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                      <Construction className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Onboard Builder</h3>
                    <p className="text-emerald-100 mb-6 max-w-xs">
                      Register a new builder or developer to list their properties on Howzy.
                    </p>
                    <button 
                      onClick={() => setIsBuilderModalOpen(true)}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                      Start Onboarding <ArrowRight className="w-4 h-4" />
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
                  <p className="text-sm text-slate-500 mt-1">Track the status of your uploaded partners and builders.</p>
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
                    {mySubmissions.length > 0 ? (
                      mySubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-slate-900">{sub.name}</div>
                            {sub.details?.partnerId && (
                              <div className="text-xs text-indigo-600 font-medium mt-0.5">{sub.details.partnerId}</div>
                            )}
                          </td>
                          <td className="p-4 text-slate-600">{sub.type}</td>
                          <td className="p-4 text-slate-600">{sub.date}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              sub.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              sub.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {sub.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {sub.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                              {sub.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {sub.status === 'Pending' && (
                              <button 
                                onClick={() => {
                                  if (sub.type === 'Builder') {
                                    setIsBuilderModalOpen(true);
                                  } else {
                                    setIsPartnerModalOpen(true);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assigned Leads</h3>
                <p className="text-sm text-slate-500 mt-1">Manage and track enquiries assigned to you.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Client Name</th>
                    <th className="p-4 font-semibold">Property Details</th>
                    <th className="p-4 font-semibold">Contact Info</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Assigned Date</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignedLeads.length > 0 ? (
                    assignedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{lead.client_name || lead.name}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-900">{lead.property_name}</div>
                          <div className="text-xs text-slate-500">{lead.enquiry_type}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-600">{lead.email}</div>
                          <div className="text-slate-600">{lead.phone}</div>
                        </td>
                        <td className="p-4">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none ${
                              lead.status === 'Assigned' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              lead.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              lead.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="p-4 text-slate-600">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Log Call"
                            >
                              <Phone className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Schedule Follow-up"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No assigned leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
