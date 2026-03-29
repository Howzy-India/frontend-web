import React, { useState, useEffect } from 'react';
import { usePagination } from '../hooks/usePagination';
import { Search, Filter, MoreVertical, UserPlus, Network } from 'lucide-react';
import { api } from '../services/api';

export default function LeadAllocationManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data.leads);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsLoading(true);
    try {
      const res = await api.autoAssignLeads();
      alert(`Successfully assigned ${res.assignedCount} leads!`);
      fetchLeads();
    } catch (error) {
      console.error('Failed to auto-assign leads:', error);
      alert('Failed to auto-assign leads.');
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.location_preferred?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentData, currentPage, maxPage, next, prev } = usePagination(filteredLeads, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Lead Allocation Manager</h3>
          <p className="text-slate-500">Manually assign or reassign leads to partners</p>
        </div>
        <button 
          onClick={handleAutoAssign}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          <Network className="w-4 h-4" />
          {isLoading ? 'Assigning...' : 'Auto-Assign Leads'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20" 
              />
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
                <th className="px-8 py-4">Client Details</th>
                <th className="px-8 py-4">Requirements</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Assigned Partner</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-slate-500">Loading leads...</td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-8 text-center text-slate-500">No leads found.</td>
                </tr>
              ) : currentData.map((lead, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900">{lead.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{lead.contact}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-700">{lead.looking_bhk || 'N/A'}</div>
                    <div className="text-xs text-slate-500 mt-1">{lead.budget} • {lead.location_preferred}</div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{lead.status}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      !lead.assigned_to
                        ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}>
                      {lead.assigned_to || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Assign Partner">
                      <UserPlus className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
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
