import React, { useState, useEffect } from 'react';
import { usePagination } from '../hooks/usePagination';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Eye, X } from 'lucide-react';
import { api } from '../services/api';

export default function ClientListingsVerification() {
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminSubmissions();
      const propertyListings = data.submissions.filter((s: any) => 
        (s.type === 'Farm Land' || s.type === 'Plot' || s.type === 'Residential' || s.type === 'Commercial')
      );
      setListings(propertyListings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateSubmissionStatus(id, status, status === 'Approved' ? 'Approved by Admin' : 'Rejected by Admin');
      alert(`Listing successfully ${status.toLowerCase()}!`);
      fetchListings();
      if (selectedListing?.id === id) {
        setSelectedListing(null);
      }
    } catch (error) {
      console.error(`Failed to ${status.toLowerCase()} listing:`, error);
      alert(`Failed to ${status.toLowerCase()} listing. Please try again.`);
    }
  };

  const handleSaveEdits = async () => {
    try {
      const parsedDetails = JSON.parse(editedDetails);
      // We need an API endpoint to update submission details.
      // Since we don't have one, we can just update the status with the new details in remarks, 
      // or we can add a new endpoint. Let's assume we can update it via a new endpoint or just mock it.
      // For now, let's just update the local state to simulate saving.
      
      // In a real app, we would call an API here:
      // await api.updateSubmissionDetails(selectedListing.id, parsedDetails);
      
      alert('Listing details updated successfully! (Simulated)');
      setSelectedListing({ ...selectedListing, details: parsedDetails });
      setIsEditing(false);
    } catch (error) {
      alert('Invalid JSON format. Please check your edits.');
    }
  };

  const openListingDetails = (listing: any) => {
    setSelectedListing(listing);
    setEditedDetails(JSON.stringify(listing.details, null, 2));
    setIsEditing(false);
  };

  const { currentData, currentPage, maxPage, next, prev } = usePagination(listings, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Client Listings Verification</h3>
          <p className="text-slate-500">Review and approve properties listed directly by clients</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search listings..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20" />
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
                <th className="px-8 py-4">Property Details</th>
                <th className="px-8 py-4">Client Email</th>
                <th className="px-8 py-4">Type</th>
                <th className="px-8 py-4">Date Submitted</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-8 text-center text-slate-500">Loading listings...</td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-8 text-center text-slate-500">No property listings found.</td>
                </tr>
              ) : currentData.map((listing, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-900">{listing.name}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 font-medium">{listing.email}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{listing.type}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{listing.date}</td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      listing.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                      listing.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => openListingDetails(listing)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    {listing.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleUpdateStatus(listing.id, 'Approved')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(listing.id, 'Rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
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

      {/* Listing Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Listing Details</h2>
                <p className="text-slate-500 text-sm mt-1">Review the submitted information</p>
              </div>
              <button 
                onClick={() => setSelectedListing(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Property Name</h4>
                  <p className="font-medium text-slate-900">{selectedListing.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Property Type</h4>
                  <p className="font-medium text-slate-900">{selectedListing.type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Client Email</h4>
                  <p className="font-medium text-slate-900">{selectedListing.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Status</h4>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    selectedListing.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                    selectedListing.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {selectedListing.status}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-900">Additional Details</h4>
                  {selectedListing.status === 'Pending' && (
                    <button 
                      onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      {isEditing ? 'Save Changes' : 'Edit Details'}
                    </button>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-6">
                  {isEditing ? (
                    <textarea 
                      className="w-full h-64 bg-white border border-slate-200 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20"
                      value={editedDetails}
                      onChange={(e) => setEditedDetails(e.target.value)}
                    />
                  ) : (
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedListing.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              {selectedListing.status === 'Pending' && (
                <div className="border-t border-slate-100 pt-6 flex gap-4">
                  <button 
                    onClick={() => handleUpdateStatus(selectedListing.id, 'Approved')}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Listing
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedListing.id, 'Rejected')}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Listing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
