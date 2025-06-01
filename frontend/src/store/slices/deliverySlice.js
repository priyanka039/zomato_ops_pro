import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  partners: [],
  loading: false,
  error: null,
  currentDelivery: null,
  availablePartners: [],
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    fetchPartnersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPartnersSuccess: (state, action) => {
      state.loading = false;
      state.partners = action.payload;
    },
    fetchPartnersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentDelivery: (state, action) => {
      state.currentDelivery = action.payload;
    },
    updatePartnerStatus: (state, action) => {
      const { partnerId, isAvailable } = action.payload;
      const partner = state.partners.find(p => p.id === partnerId);
      if (partner) {
        partner.isAvailable = isAvailable;
      }
    },
    setAvailablePartners: (state, action) => {
      state.availablePartners = action.payload;
    },
    updateDeliveryStatus: (state, action) => {
      if (state.currentDelivery?.id === action.payload.orderId) {
        state.currentDelivery.status = action.payload.status;
      }
    },
  },
});

export const {
  fetchPartnersStart,
  fetchPartnersSuccess,
  fetchPartnersFailure,
  setCurrentDelivery,
  updatePartnerStatus,
  setAvailablePartners,
  updateDeliveryStatus,
} = deliverySlice.actions;

export default deliverySlice.reducer; 