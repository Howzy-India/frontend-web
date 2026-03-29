import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, Save } from 'lucide-react';

interface PlotsOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function PlotsOnboardingModal({ isOpen, onClose, onSubmit }: PlotsOnboardingModalProps) {
  const [formData, setFormData] = useState({
    builderName: '',
    contactNumber: '',
    projectName: '',
    city: '',
    area: '',
    gpsCoordinates: '',
    totalLayoutArea: '',
    numberOfPlots: '',
    plotSizeSqYards: '',
    plotSizeSqFt: '',
    approvalDetails: '',
    roadWidthDetails: '',
    pricePerSqYard: '',
    availabilityStatus: 'Available',
  });

  const [amenities, setAmenities] = useState<string[]>([]);

  const handleAmenityChange = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amenities,
      type: 'Plot',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      id: Date.now().toString(),
    });
    onClose();
  };

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
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Onboard Plots</h2>
                <p className="text-xs font-medium text-slate-500">Submit plot project details for verification</p>
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
            <form id="plots-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Builder Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Builder Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Builder / Developer Name</label>
                    <input required name="builderName" value={formData.builderName} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <input required name="contactNumber" value={formData.contactNumber} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                    <input required name="projectName" value={formData.projectName} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input required name="city" value={formData.city} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
                    <input required name="area" value={formData.area} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Google Map Location</label>
                    <input required name="gpsCoordinates" value={formData.gpsCoordinates} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Layout Details */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Layout Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Layout Area</label>
                    <input required name="totalLayoutArea" value={formData.totalLayoutArea} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Plots</label>
                    <input required name="numberOfPlots" value={formData.numberOfPlots} onChange={handleChange} type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plot Size (Sq Yards)</label>
                    <input required name="plotSizeSqYards" value={formData.plotSizeSqYards} onChange={handleChange} type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plot Size (Sq Ft)</label>
                    <input required name="plotSizeSqFt" value={formData.plotSizeSqFt} onChange={handleChange} type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Approval & Infrastructure */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Approval & Infrastructure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DTCP / HMDA / RERA Approval Details</label>
                    <input required name="approvalDetails" value={formData.approvalDetails} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Road Width Details</label>
                    <input required name="roadWidthDetails" value={formData.roadWidthDetails} onChange={handleChange} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-3">
                      {['Gated Community', 'Street Lights', 'Drainage', 'Parks', 'Security', 'Clubhouse'].map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100">
                          <input 
                            type="checkbox" 
                            checked={amenities.includes(amenity)}
                            onChange={() => handleAmenityChange(amenity)}
                            className="rounded text-indigo-600 focus:ring-indigo-500" 
                          />
                          <span className="text-sm text-slate-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Status */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Pricing & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price per Sq Yard (₹)</label>
                    <input required name="pricePerSqYard" value={formData.pricePerSqYard} onChange={handleChange} type="number" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Availability Status</label>
                    <select required name="availabilityStatus" value={formData.availabilityStatus} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                      <option value="Available">Available</option>
                      <option value="Limited">Limited</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Documents & Media Upload */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-100 pb-2">Documents & Media Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Approval Documents Upload</label>
                    <input type="file" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Layout Map Upload</label>
                    <input type="file" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Site Photos Upload</label>
                    <input type="file" multiple className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Drone Video Upload (Optional)</label>
                    <input type="file" accept="video/*" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plots-form"
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Submit for Verification
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
