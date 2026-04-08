import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api/v1/public',
  headers: { 'Content-Type': 'application/json' },
});

export const getHotelInfo = () => api.get('/hotel-info');
export const getRoomTypes = () => api.get('/rooms');
export const getRoomTypeDetail = (type) => api.get(`/rooms/${type}`);
export const checkAvailability = (checkIn, checkOut, roomType) =>
  api.get('/availability', { params: { check_in: checkIn, check_out: checkOut, room_type: roomType || undefined } });
export const createBooking = (data) => api.post('/booking', data);
export const lookupBooking = (ref, email) => api.get(`/booking/${ref}`, { params: { email } });

export default api;
