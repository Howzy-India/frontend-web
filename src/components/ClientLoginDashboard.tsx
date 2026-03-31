import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Monitor, Smartphone, Globe, ShieldAlert, CheckCircle2, XCircle, Clock, User, Building2, MapPin, Tag, Mail, Activity, RefreshCw, Wifi } from 'lucide-react';
import { api } from '../services/api';
import AssignmentPanel from './AssignmentPanel';

const POLL_INTERVAL_MS = 30_000;

export default function ClientLoginDashboard() {
  const [logins, setLogins] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, totalLogins: 0, failedAttempts: 0 });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [user360Data, setUser360Data] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [loginsData, statsData] = await Promise.all([
        api.getClientLogins(),
        api.getClientLoginStats(),
      ]);
      setLogins(loginsData.logins);
      setStats(statsData);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Failed to fetch client login data:', error);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const openUser360 = async (email: string) => {
    setSelectedUser(email);
    setIsModalOpen(true);
    try {
      const data = await api.getClient360(email);
      setUser360Data(data);
    } catch (error) {
      console.error('Failed to fetch user 360 data:', error);
    }
  };

  const openTimeline = async (enquiryId: string) => {
    setTimelineModalOpen(true);
    setTimelineLoading(true);
    try {
      const data = await api.getEnquiryTimeline(enquiryId);
      setTimelineData(data.timeline || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      setTimelineData([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  const filteredLogins = logins.filter(login => {
    const matchesSearch = login.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (login.phone && login.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'All' || login.status === statusFilter;
    const matchesDevice = deviceFilter === 'All' || login.device_type === deviceFilter;
    return matchesSearch && matchesStatus && matchesDevice;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Client Login Dashboard</h2>
          <p className="text-slate-500">Monitor client access and platform usage</p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3 h-3" />
            Live · {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString()}` : 'Loading…'}
          </div>
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Users', value: stats.totalUsers, icon: User, color: 'indigo' },
          { title: 'Active Today', value: stats.activeToday, icon: Activity, color: 'emerald' },
          { title: 'Total Logins', value: stats.totalLogins, icon: Globe, color: 'blue' },
          { title: 'Failed Attempts', value: stats.failedAttempts, icon: ShieldAlert, color: 'red' }
        ].map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${metric.color}-50 text-${metric.color}-600`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{metric.title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{metric.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by email or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 appearance-none font-medium text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
          <div className="relative">
            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 appearance-none font-medium text-slate-700"
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
            >
              <option value="All">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Login History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Login Time</th>
                <th className="p-4 font-semibold">Device & Browser</th>
                <th className="p-4 font-semibold">Location / IP</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogins.map((login) => (
                <tr key={login.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{login.email}</div>
                    {login.phone && <div className="text-xs text-slate-500">{login.phone}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-900">{new Date(login.login_time).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-500">{new Date(login.login_time).toLocaleTimeString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {login.device_type === 'Mobile' ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Monitor className="w-4 h-4 text-slate-400" />}
                      <span className="text-sm font-medium text-slate-700">{login.device_type}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{login.browser}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-slate-900">{login.location}</div>
                    <div className="text-xs text-slate-500">{login.ip_address}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      login.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {login.status === 'Success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {login.status}
                    </span>
                    {login.failure_reason && <div className="text-xs text-red-500 mt-1">{login.failure_reason}</div>}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => openUser360(login.email)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                    >
                      360° View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogins.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No login records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360° Intelligence Module Modal */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-600" /> 360° Intelligence View
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{selectedUser}</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                {!user360Data ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <>
                    {/* User Activity Summary */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" /> User Activity Data
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-1">Total Visits</p>
                          <p className="font-bold text-slate-900 text-xl">{user360Data.logins.length}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-1">Last Active</p>
                          <p className="font-bold text-slate-900">
                            {user360Data.logins[0] ? new Date(user360Data.logins[0].login_time).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 font-medium mb-1">Primary Device</p>
                          <p className="font-bold text-slate-900">
                            {user360Data.logins[0]?.device_type || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Property Listings */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" /> Property Listings
                      </h4>
                      {user360Data.listings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {user360Data.listings.map((listing: any) => (
                            <div key={listing.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-slate-900">{listing.name}</h5>
                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${
                                  listing.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {listing.status}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-slate-600 mb-4">
                                <p className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> {listing.type}</p>
                                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {listing.details?.location || listing.details?.city || 'Unknown'}</p>
                              </div>
                              
                              {/* Enquiries on this listing */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-700 mb-2">Enquiries Received</p>
                                {user360Data.enquiriesOnListings.filter((e: any) => e.property_id === listing.id).length > 0 ? (
                                  <div className="space-y-2">
                                    {user360Data.enquiriesOnListings.filter((e: any) => e.property_id === listing.id).map((enq: any) => (
                                      <div key={enq.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100">
                                        <div>
                                          <span className="font-medium text-slate-900">{enq.client_name}</span>
                                          <span className="text-slate-500 ml-2">({enq.enquiry_type})</span>
                                        </div>
                                        <span className="text-slate-400">{new Date(enq.created_at).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500">No enquiries yet.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
                          This user has not listed any properties.
                        </div>
                      )}
                    </div>

                    {/* Enquiries Made */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-600" /> Enquiries Made
                      </h4>
                      {user360Data.enquiriesMade.length > 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                              <tr>
                                <th className="p-3 font-semibold">Property</th>
                                <th className="p-3 font-semibold">Type</th>
                                <th className="p-3 font-semibold">Date</th>
                                <th className="p-3 font-semibold">Status</th>
                                <th className="p-3 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {user360Data.enquiriesMade.map((enq: any) => (
                                <tr key={enq.id}>
                                  <td className="p-3 font-medium text-slate-900">{enq.property_name}</td>
                                  <td className="p-3 text-slate-600">{enq.enquiry_type}</td>
                                  <td className="p-3 text-slate-600">{new Date(enq.created_at).toLocaleDateString()}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg ${
                                      enq.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {enq.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right flex justify-end gap-2">
                                    <button 
                                      onClick={() => openTimeline(enq.id)}
                                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                                    >
                                      Timeline
                                    </button>
                                    {(enq.status === 'Approved' || enq.status === 'Assigned' || enq.status === 'In Progress') && (
                                      <button 
                                        onClick={() => {
                                          setSelectedEnquiryId(enq.id);
                                          setIsAssignmentPanelOpen(true);
                                        }}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                      >
                                        {enq.status === 'Approved' ? 'Assign' : 'Reassign'}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
                          This user has not made any enquiries.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Timeline Modal */}
      <AnimatePresence>
        {timelineModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTimelineModalOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" /> Activity Timeline
                </h3>
                <button
                  onClick={() => setTimelineModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {timelineLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : timelineData.length > 0 ? (
                  <div className="space-y-4">
                    {timelineData.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                          {index !== timelineData.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2" />}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900">{event.action}</span>
                            <span className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</span>
                          </div>
                          {event.details && <p className="text-sm text-slate-600 mt-2">{event.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No timeline events found for this enquiry.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedEnquiryId && (
        <AssignmentPanel
          isOpen={isAssignmentPanelOpen}
          onClose={() => setIsAssignmentPanelOpen(false)}
          enquiryId={selectedEnquiryId}
          onAssigned={() => {
            if (selectedUser) openUser360(selectedUser);
            setIsAssignmentPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
