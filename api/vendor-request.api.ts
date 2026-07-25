import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';

export type VendorRequestStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'MORE_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export interface VendorRequest {
  id: string;
  customerId: string;
  status: VendorRequestStatus;
  // Step 1
  shopName?: string;
  ownerName?: string;
  mobileNumber?: string;
  email?: string;
  // Step 2
  shopCategory?: string;
  description?: string;
  gstNumber?: string;
  fssaiNumber?: string;
  businessRegNumber?: string;
  // Step 3
  districtId?: string;
  areaId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadius?: number;
  // Step 4
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  // Step 5
  logoUrl?: string;
  bannerUrl?: string;
  ownerPhotoUrl?: string;
  govtIdUrl?: string;
  gstCertUrl?: string;
  fssaiCertUrl?: string;
  // Meta
  adminRemarks?: string;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  district?: { id: string; name: string };
  area?: { id: string; name: string };
}

export const vendorRequestApi = {
  getMyRequest: async () => {
    const res = await api.get<{ success: boolean; data: VendorRequest | null }>(ENDPOINTS.CUSTOMER.VENDOR_REQUEST.BASE);
    return res.data.data;
  },

  saveDraft: async (data: Partial<VendorRequest>) => {
    const res = await api.post<{ success: boolean; data: VendorRequest }>(ENDPOINTS.CUSTOMER.VENDOR_REQUEST.BASE, data);
    return res.data.data;
  },

  updateDraft: async (data: Partial<VendorRequest>) => {
    const res = await api.put<{ success: boolean; data: VendorRequest }>(ENDPOINTS.CUSTOMER.VENDOR_REQUEST.BASE, data);
    return res.data.data;
  },

  submit: async () => {
    const res = await api.post<{ success: boolean; data: VendorRequest }>(ENDPOINTS.CUSTOMER.VENDOR_REQUEST.SUBMIT, {});
    return res.data.data;
  },
};
