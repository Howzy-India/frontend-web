import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Clock, Eye, Filter, Search, Map, Trees, FileText, Image as ImageIcon, Video, X, UserPlus, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function AdminVerificationPanel() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Farm Land' | 'Plot' | 'Partner' | 'Builder'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await api.getAdminSubmissions();
      // Filter only Farm Land, Plot, Partner, and Builder submissions
      const filtered = data.submissions.filter((s: any) => s.type === 'Farm Land' || s.type === 'Plot' || s.type === 'Partner' || s.type === 'Builder');
      setSubmissions(filtered);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesTab = activeTab === 'All' || sub.type === activeTab;
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sub.details?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.details?.builderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.details?.partnerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.updateSubmissionStatus(id, newStatus, remarks);
      setSubmissions(prev => prev.map(sub => 
        sub.id === id ? { ...sub, status: newStatus, details: { ...sub.details, remarks } } : sub
      ));
      setSelectedSubmission(null);
      setRemarks('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Verification Panel</h3>
          <p className="text-slate-500">Review and approve Farm Land, Plot, Partner, and Builder onboarding submissions.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {['All', 'Farm Land', 'Plot', 'Partner', 'Builder'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search submissions..." 
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Listing Name</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Submitted By</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{sub.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {sub.type === 'Farm Land' ? <Trees className="w-4 h-4 text-amber-500" /> : 
                         sub.type === 'Plot' ? <Map className="w-4 h-4 text-blue-500" /> : 
                         sub.type === 'Builder' ? <Building2 className="w-4 h-4 text-emerald-500" /> :
                         <UserPlus className="w-4 h-4 text-indigo-500" />}
                        <span className="text-slate-600">{sub.type}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{sub.details?.ownerName || sub.details?.builderName || sub.details?.partnerName || sub.email}</td>
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
                      <button 
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setRemarks(sub.details?.remarks || '');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedSubmission.type === 'Farm Land' ? 'bg-amber-100 text-amber-600' : 
                    selectedSubmission.type === 'Plot' ? 'bg-blue-100 text-blue-600' :
                    selectedSubmission.type === 'Builder' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    {selectedSubmission.type === 'Farm Land' ? <Trees className="w-5 h-5" /> : 
                     selectedSubmission.type === 'Plot' ? <Map className="w-5 h-5" /> :
                     selectedSubmission.type === 'Builder' ? <Building2 className="w-5 h-5" /> :
                     <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Review {selectedSubmission.type}</h2>
                    <p className="text-xs font-medium text-slate-500">{selectedSubmission.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Details Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Basic Information</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedSubmission.details || {})
                          .filter(([key]) => !['documents', 'media', 'remarks'].includes(key))
                          .map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-xs font-medium text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-sm font-bold text-slate-900">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Documents & Media Section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Uploaded Documents</h3>
                      <div className="space-y-2">
                        {selectedSubmission.details?.documents?.map((doc: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-medium text-slate-700">{doc}</span>
                            <button className="ml-auto text-xs font-bold text-indigo-600 hover:underline">View</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Media</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedSubmission.details?.media?.map((media: string, i: number) => (
                          <div key={i} className="relative aspect-video bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden group">
                            {media.endsWith('.mp4') ? <Video className="w-6 h-6 text-slate-400" /> : <ImageIcon className="w-6 h-6 text-slate-400" />}
                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button className="text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">View</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verification Actions */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Verification Actions</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Verification Remarks</label>
                          <textarea 
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                            placeholder="Add notes about the verification..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleStatusChange(selectedSubmission.id, 'Approved')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button 
                            onClick={() => handleStatusChange(selectedSubmission.id, 'Rejected')}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
