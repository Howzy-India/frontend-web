import React from 'react';
import { Phone, Clock } from 'lucide-react';

interface AssignedLead {
  id: string;
  client_name?: string;
  name?: string;
  property_name?: string;
  enquiry_type?: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
}

interface AssignedLeadsTableProps {
  assignedLeads: AssignedLead[];
  onStatusUpdate: (id: string, status: string) => void;
  title?: string;
}

export default function AssignedLeadsTable({
  assignedLeads,
  onStatusUpdate,
  title = 'Assigned Leads',
}: AssignedLeadsTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
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
                      onChange={(e) => onStatusUpdate(lead.id, e.target.value)}
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
  );
}
