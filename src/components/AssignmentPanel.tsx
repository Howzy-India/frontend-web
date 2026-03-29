import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Briefcase, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface AssignmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: string;
  onAssigned: () => void;
}

export default function AssignmentPanel({ isOpen, onClose, enquiryId, onAssigned }: AssignmentPanelProps) {
  const [salesTeam, setSalesTeam] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedSales, setSelectedSales] = useState<any | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setError(null);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [salesData, partnersData] = await Promise.all([
        api.getSalesTeam(),
        api.getPartners()
      ]);
      setSalesTeam(salesData.sales || []);
      setPartners(partnersData.partners || []);
    } catch (error) {
      console.error('Failed to fetch assignment data:', error);
      setError('Failed to load assignment data.');
    }
  };

  const handleAssign = async () => {
    if (!selectedSales && !selectedPartner) {
      setError('Please select at least one Sales member or Partner to assign.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.assignEnquiry(enquiryId, {
        salesId: selectedSales?.id,
        salesName: selectedSales?.name,
        partnerId: selectedPartner?.id,
        partnerName: selectedPartner?.name,
        notes
      });
      onAssigned();
      onClose();
    } catch (error) {
      console.error('Failed to assign enquiry:', error);
      setError('Failed to assign enquiry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Assign Lead</h3>
              <p className="text-sm text-slate-500">Select internal sales or partner to handle this enquiry</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {/* Internal Sales Team */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Internal Sales Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {salesTeam.map(sales => (
                  <div 
                    key={sales.id}
                    onClick={() => setSelectedSales(selectedSales?.id === sales.id ? null : sales)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedSales?.id === sales.id 
                        ? 'border-indigo-600 bg-indigo-50/50' 
                        : 'border-slate-100 hover:border-indigo-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-900">{sales.name}</div>
                      {selectedSales?.id === sales.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {sales.region}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {sales.activeLeads} Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Howzy Partners */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Howzy Partners
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {partners.map(partner => (
                  <div 
                    key={partner.id}
                    onClick={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPartner?.id === partner.id 
                        ? 'border-emerald-600 bg-emerald-50/50' 
                        : 'border-slate-100 hover:border-emerald-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-slate-900">{partner.name}</div>
                      {selectedPartner?.id === partner.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {partner.location}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {partner.expertise}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Internal Notes
              </h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any instructions or notes for the assignee..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <button
              onClick={async () => {
                // We don't use confirm() as per instructions, but we can just execute it or use a custom modal.
                // For simplicity, we'll just execute it.
                setIsLoading(true);
                try {
                  await api.assignEnquiry(enquiryId, {
                    salesId: null,
                    salesName: null,
                    partnerId: null,
                    partnerName: null,
                    notes: 'Assignments removed'
                  });
                  onAssigned();
                  onClose();
                } catch (error) {
                  console.error('Failed to remove assignments:', error);
                  setError('Failed to remove assignments.');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
            >
              Remove Assignments
            </button>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssign}
                disabled={isLoading || (!selectedSales && !selectedPartner)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
