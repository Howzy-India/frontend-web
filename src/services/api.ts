export const api = {
  async getProjects() {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },
  
  async getLeads() {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error('Failed to fetch leads');
    return res.json();
  },

  async createLead(leadData: any) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    });
    if (!res.ok) throw new Error('Failed to create lead');
    return res.json();
  },

  async autoAssignLeads() {
    const res = await fetch('/api/leads/auto-assign', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to auto-assign leads');
    return res.json();
  },

  async getEarnings() {
    const res = await fetch('/api/earnings');
    if (!res.ok) throw new Error('Failed to fetch earnings');
    return res.json();
  },

  async getSubmissions(email?: string) {
    const url = email ? `/api/submissions?email=${encodeURIComponent(email)}` : '/api/submissions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  },

  async createSubmission(submissionData: any) {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    if (!res.ok) throw new Error('Failed to create submission');
    return res.json();
  },

  async updateSubmissionStatus(id: string, status: string, remarks: string) {
    const res = await fetch(`/api/submissions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, remarks })
    });
    if (!res.ok) throw new Error('Failed to update submission status');
    return res.json();
  },

  async getAdminEnquiries() {
    const res = await fetch('/api/enquiries');
    if (!res.ok) throw new Error('Failed to fetch enquiries');
    return res.json();
  },

  async getSalesTeam() {
    const res = await fetch('/api/admin/sales-team');
    if (!res.ok) throw new Error('Failed to fetch sales team');
    return res.json();
  },

  async getPartners() {
    const res = await fetch('/api/admin/partners');
    if (!res.ok) throw new Error('Failed to fetch partners');
    return res.json();
  },

  async assignEnquiry(id: string, assignmentData: any) {
    const res = await fetch(`/api/admin/enquiries/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentData),
    });
    if (!res.ok) throw new Error('Failed to assign enquiry');
    return res.json();
  },

  async getEnquiryTimeline(id: string) {
    const res = await fetch(`/api/enquiries/${id}/timeline`);
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  async getPilotAssignedEnquiries() {
    const res = await fetch('/api/pilot/assigned-enquiries');
    if (!res.ok) throw new Error('Failed to fetch assigned enquiries');
    return res.json();
  },

  async getPartnerAssignedEnquiries() {
    const res = await fetch('/api/partner/assigned-enquiries');
    if (!res.ok) throw new Error('Failed to fetch assigned enquiries');
    return res.json();
  },

  async createEnquiry(enquiryData: any) {
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiryData)
    });
    if (!res.ok) throw new Error('Failed to create enquiry');
    return res.json();
  },

  async updateEnquiryStatus(id: number, status: string, priority?: string) {
    const res = await fetch(`/api/enquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, priority })
    });
    if (!res.ok) throw new Error('Failed to update enquiry status');
    return res.json();
  },

  async getClientEnquiries(email: string) {
    const res = await fetch(`/api/client/enquiries?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to fetch client enquiries');
    return res.json();
  },

  async trackClientLogin(loginData: any) {
    const res = await fetch('/api/client/login-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    if (!res.ok) throw new Error('Failed to track login');
    return res.json();
  },

  async getClientLogins() {
    const res = await fetch('/api/admin/client-logins');
    if (!res.ok) throw new Error('Failed to fetch client logins');
    return res.json();
  },

  async getClient360(email: string) {
    const res = await fetch(`/api/admin/client-360/${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Failed to fetch client 360 view');
    return res.json();
  }
};
