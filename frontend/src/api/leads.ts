import apiClient from './client';

export type PublicEnquiry = {
  name: string;
  mobile: string;
  email: string;
  interested_course: string;
  message: string;
};

export function listLeads() {
  return apiClient.get('/leads/');
}

export function updateLead(leadId: number, updates: { status: string }) {
  return apiClient.patch(`/leads/${leadId}/`, updates);
}

export function convertLead(leadId: number) {
  return apiClient.post(`/leads/${leadId}/convert/`);
}

export function createPublicEnquiry(enquiry: PublicEnquiry) {
  return apiClient.post('/leads/public_enquiry/', enquiry);
}
