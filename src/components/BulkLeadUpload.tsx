import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

export default function BulkLeadUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
      setErrors([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadStatus('validating');
    
    // Simulate validation and upload
    setTimeout(async () => {
      // Mock validation logic
      if (file.name.includes('error')) {
        setUploadStatus('error');
        setErrors([
          'Row 2: Duplicate mobile number found',
          'Row 9: Invalid partner name "John Doe"',
          'Row 15: Missing required field "Interested Property Type"'
        ]);
        setIsUploading(false);
      } else {
        try {
          await api.createLead({
            name: 'Bulk Uploaded Lead 1',
            budget: '50L - 1Cr',
            location_preferred: 'Gachibowli',
            looking_bhk: '3 BHK',
            contact: '9876543210',
            milestone: 'New',
            project_id: 'P1',
            document_uploaded: false,
            status: 'New'
          });
          await api.createLead({
            name: 'Bulk Uploaded Lead 2',
            budget: '1Cr - 2Cr',
            location_preferred: 'Jubilee Hills',
            looking_bhk: '4 BHK',
            contact: '9876543211',
            milestone: 'New',
            project_id: 'P2',
            document_uploaded: false,
            status: 'New'
          });
          setUploadStatus('success');
        } catch (error) {
          console.error('Failed to create bulk leads:', error);
          setUploadStatus('error');
          setErrors(['Failed to save leads to the database.']);
        } finally {
          setIsUploading(false);
        }
      }
    }, 2000);
  };

  const downloadTemplate = () => {
    // In a real app, this would trigger a download of an actual Excel file
    const csvContent = "Lead ID,Client Name,Mobile Number,Email ID,City,Interested Property Type,Budget Range,Preferred Location,Lead Source,Assigned Partner,Remarks\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Lead_Upload_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Lead Allocation</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Upload and assign leads to partners via Excel</p>
        </div>
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 p-8">
        <div className="max-w-2xl mx-auto">
          <div 
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
              file ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              id="lead-file-upload" 
              className="hidden" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
            />
            <label htmlFor="lead-file-upload" className="cursor-pointer flex flex-col items-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                file ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <Network className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                {file ? file.name : 'Drag & drop your Excel file here'}
              </h4>
              <p className="text-sm text-slate-500 mb-6">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Supports .xlsx, .xls, .csv up to 10MB'}
              </p>
              <div className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                {file ? 'Change File' : 'Browse Files'}
              </div>
            </label>
          </div>

          <AnimatePresence mode="wait">
            {file && uploadStatus === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-8 flex justify-end"
              >
                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload & Allocate'}
                </button>
              </motion.div>
            )}

            {uploadStatus === 'validating' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4"
              >
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shrink-0" />
                <div>
                  <h5 className="font-bold text-blue-900">Validating Leads...</h5>
                  <p className="text-sm text-blue-700 mt-1">Checking for duplicates and assigning partners.</p>
                </div>
              </motion.div>
            )}

            {uploadStatus === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-4"
              >
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-900">Upload & Allocation Successful!</h5>
                  <p className="text-sm text-emerald-700 mt-1">
                    Leads have been imported and automatically assigned to the designated partners. They will appear in their dashboards immediately.
                  </p>
                </div>
              </motion.div>
            )}

            {uploadStatus === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4"
              >
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div className="w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-red-900">Validation Errors Found</h5>
                      <p className="text-sm text-red-700 mt-1">Please fix the following errors and re-upload.</p>
                    </div>
                    <button className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">
                      Download Error Log
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {errors.map((err, i) => (
                      <div key={i} className="text-sm text-red-800 bg-red-100/50 px-3 py-2 rounded-lg">
                        {err}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
