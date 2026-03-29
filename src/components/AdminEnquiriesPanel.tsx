import React, { useState, useEffect } from 'react';
import { usePagination } from '../hooks/usePagination';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Tag, 
  Eye, 
  Clock, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  User 
} from 'lucide-react';
import { api } from '../services/api';
import AssignmentPanel from './AssignmentPanel';

export default function AdminEnquiriesPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentPanelOpen, setIsAssignmentPanelOpen] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminEnquiries();
      setEnquiries(data.enquiries || []);
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEnquiryDetails = async (enquiry: any) => {
    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
    try {
      const data = await api.getEnquiryTimeline(enquiry.id);
      setTimeline(data.timeline || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      setTimeline([]);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, priority?: string) => {
    try {
      await api.updateEnquiryStatus(id, status, priority);
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry.id === id) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error(`Failed to update enquiry status to ${status}:`, error);
    }
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || enquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { currentData, currentPage, maxPage, next, prev } = usePagination(filteredEnquiries, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Pending':
      case 'Under Review': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Assigned': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'In Progress': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Closed': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hot': return 'bg-red-100 text-red-700';
      case 'Warm': return 'bg-orange-100 text-orange-700';
      case 'Cold': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Enquiries Management</h3>
          <p className="text-slate-500">Review and approve client enquiries before they reach the dashboard</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search enquiries..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                <th className="px-8 py-4">Client Details</th>
                <th className="px-8 py-4">Property Info</th>
                <th className="px-8 py-4">Enquiry Type</th>
                <th className="px-8 py-4">Status & Priority</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-slate-500">Loading enquiries...</td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-slate-500">No enquiries found.</td>
                </tr>
              ) : currentData.map((enquiry, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{enquiry.client_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{enquiry.phone}</div>
                    <div className="text-xs text-slate-400">{new Date(enquiry.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-700">{enquiry.property_name}</div>
                    <div className="text-xs text-slate-500 mt-1">{enquiry.property_type} • {enquiry.location}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                      {enquiry.enquiry_type}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(enquiry.status)}`}>
                        {enquiry.status}
                      </span>
                      {enquiry.priority && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityColor(enquiry.priority)}`}>
                          {enquiry.priority} Lead
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openEnquiryDetails(enquiry)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {enquiry.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(enquiry.id, 'Approved')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(enquiry.id, 'Rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
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

      {/* Enquiry Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEnquiry && (
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Enquiry Details</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Client Info */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" /> Client Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Name</p>
                      <p className="font-bold text-slate-900">{selectedEnquiry.client_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Phone</p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedEnquiry.phone}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-400" /> {selectedEnquiry.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Property Info */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" /> Property Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 font-medium mb-1">Property Name</p>
                      <p className="font-bold text-slate-900">{selectedEnquiry.property_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Type</p>
                      <p className="font-bold text-slate-900">{selectedEnquiry.property_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Location</p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" /> {selectedEnquiry.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enquiry Meta */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" /> Enquiry Meta
                  </h4>
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Type</p>
                      <p className="font-bold text-slate-900">{selectedEnquiry.enquiry_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Source</p>
                      <p className="font-bold text-slate-900">{selectedEnquiry.source}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Date</p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" /> {new Date(selectedEnquiry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                {timeline.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" /> Activity Timeline
                    </h4>
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                            {index !== timeline.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-2" />}
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
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">Set Priority:</span>
                  <select 
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    value={selectedEnquiry.priority || ''}
                    onChange={(e) => handleStatusUpdate(selectedEnquiry.id, selectedEnquiry.status, e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="Hot">Hot Lead</option>
                    <option value="Warm">Warm Lead</option>
                    <option value="Cold">Cold Lead</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  {(selectedEnquiry.status === 'New' || selectedEnquiry.status === 'Pending') && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Under Review')}
                      className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-colors"
                    >
                      Mark Under Review
                    </button>
                  )}
                  {(selectedEnquiry.status === 'New' || selectedEnquiry.status === 'Pending' || selectedEnquiry.status === 'Under Review') && (
                    <>
                      <button 
                        onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Rejected')}
                        className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Approved')}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                      >
                        Approve & Release
                      </button>
                    </>
                  )}
                  {(selectedEnquiry.status === 'Approved' || selectedEnquiry.status === 'Assigned' || selectedEnquiry.status === 'In Progress') && (
                    <button 
                      onClick={() => {
                        setIsModalOpen(false);
                        setIsAssignmentPanelOpen(true);
                      }}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                    >
                      {selectedEnquiry.status === 'Approved' ? 'Assign Lead' : 'Reassign Lead'}
                    </button>
                  )}
                  {selectedEnquiry.status === 'Assigned' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'In Progress')}
                      className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-colors"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {selectedEnquiry.status === 'In Progress' && (
                    <button 
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'Closed')}
                      className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-800/20 hover:bg-slate-900 transition-colors"
                    >
                      Close Enquiry
                    </button>
                  )}
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedEnquiry && (
        <AssignmentPanel
          isOpen={isAssignmentPanelOpen}
          onClose={() => setIsAssignmentPanelOpen(false)}
          enquiryId={selectedEnquiry.id}
          onAssigned={() => {
            fetchEnquiries();
            setIsAssignmentPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
