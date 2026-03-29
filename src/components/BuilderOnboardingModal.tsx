import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Save, ArrowRight } from 'lucide-react';

interface BuilderOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function BuilderOnboardingModal({ isOpen, onClose, onSubmit }: BuilderOnboardingModalProps) {
  const [formData, setFormData] = useState({
    builderName: '',
    propertyName: '',
    reraNumber: '',
    totalUnits: '',
    projectLocation: '',
    possession: '',
    propertyType: '',
    pocDetails: '',
    videoLinks: '',
    walkthroughLink: '',
    brochureLink: '',
    siteLocation: '',
    projectUsp: '',
    sqftCosting: '',
    twoBhkStartsFrom: '',
    threeBhkStartsFrom: '',
    financeCrmName: '',
    financeCrmContact: '',
    projectHeadName: '',
    projectHeadContact: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Builder Onboarding</h2>
                <p className="text-xs font-medium text-slate-500">Register a new builder and property</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <form className="space-y-8">
              
              {/* Basic Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name of the Builder</label>
                    <input type="text" name="builderName" value={formData.builderName} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Prestige Group" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name of the Property</label>
                    <input type="text" name="propertyName" value={formData.propertyName} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Prestige Falcon City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">RERA Number</label>
                    <input type="text" name="reraNumber" value={formData.reraNumber} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="PRM/KA/RERA/..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Units</label>
                    <input type="number" name="totalUnits" value={formData.totalUnits} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Location</label>
                    <input type="text" name="projectLocation" value={formData.projectLocation} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="City, Area" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Possession (in months)</label>
                    <input type="number" name="possession" value={formData.possession} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 24" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
                    <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white">
                      <option value="">Select Type</option>
                      <option value="standalone">Standalone</option>
                      <option value="gated">Gated Community</option>
                      <option value="highrise">Highrise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">POC Details</label>
                    <input type="text" name="pocDetails" value={formData.pocDetails} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Name & Contact" />
                  </div>
                </div>
              </div>

              {/* Media & Links */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Media & Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Video Links</label>
                    <input type="url" name="videoLinks" value={formData.videoLinks} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">3D Walkthrough Link</label>
                    <input type="url" name="walkthroughLink" value={formData.walkthroughLink} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brochure Link</label>
                    <input type="url" name="brochureLink" value={formData.brochureLink} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Site Location (Maps Link)</label>
                    <input type="url" name="siteLocation" value={formData.siteLocation} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="https://maps.google.com/..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project USP</label>
                    <textarea name="projectUsp" value={formData.projectUsp} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" placeholder="Unique Selling Propositions..."></textarea>
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Pricing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sqft Costing (₹)</label>
                    <input type="number" name="sqftCosting" value={formData.sqftCosting} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 5000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">2BHK Starts From (₹)</label>
                    <input type="text" name="twoBhkStartsFrom" value={formData.twoBhkStartsFrom} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 65 Lakhs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">3BHK Starts From (₹)</label>
                    <input type="text" name="threeBhkStartsFrom" value={formData.threeBhkStartsFrom} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. 85 Lakhs" />
                  </div>
                </div>
              </div>

              {/* Key Contacts */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Key Contacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Finance CRM</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                        <input type="text" name="financeCrmName" value={formData.financeCrmName} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Finance CRM Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Contact</label>
                        <input type="text" name="financeCrmContact" value={formData.financeCrmContact} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Phone / Email" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">Project Head</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                        <input type="text" name="projectHeadName" value={formData.projectHeadName} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Project Head Name" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Contact</label>
                        <input type="text" name="projectHeadContact" value={formData.projectHeadContact} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="Phone / Email" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Builder
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
