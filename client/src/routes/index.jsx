import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/templates/AppLayout';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import FrontDeskPage from '../pages/FrontDeskPage';
import ReservationsPage from '../pages/ReservationsPage';
import GuestsPage from '../pages/GuestsPage';
import GuestDetailPage from '../pages/GuestDetailPage';
import BillingPage from '../pages/BillingPage';
import InvoicePage from '../pages/InvoicePage';
import RestaurantPage from '../pages/RestaurantPage';
import HousekeepingPage from '../pages/HousekeepingPage';
import StaffPage from '../pages/StaffPage';
import InventoryPage from '../pages/InventoryPage';
import RatesPage from '../pages/RatesPage';
import ReportsPage from '../pages/ReportsPage';
import ShiftHandoverPage from '../pages/ShiftHandoverPage';
import AcceptHandoverPage from '../pages/AcceptHandoverPage';
import SettingsPage from '../pages/SettingsPage';
import ChannelManagerPage from '../pages/ChannelManagerPage';
import OtaBookingsPage from '../pages/OtaBookingsPage';
import ReconciliationPage from '../pages/ReconciliationPage';
import LaundryPage from '../pages/LaundryPage';
import CheckoutHistoryPage from '../pages/CheckoutHistoryPage';

const R = ['admin', 'manager', 'front_desk'];
const ALL = ['admin', 'manager', 'front_desk', 'housekeeping', 'restaurant', 'staff'];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-handover" element={
        <ProtectedRoute roles={R}><AcceptHandoverPage /></ProtectedRoute>
      } />
      <Route path="/billing/:id/invoice" element={
        <ProtectedRoute roles={R}><InvoicePage /></ProtectedRoute>
      } />
      <Route path="/billing/group/:groupId/invoice" element={
        <ProtectedRoute roles={R}><InvoicePage /></ProtectedRoute>
      } />

      <Route path="/" element={
        <ProtectedRoute roles={ALL}><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/front-desk" replace />} />
        <Route path="front-desk" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><FrontDeskPage /></ProtectedRoute>
        } />
        <Route path="reservations" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><ReservationsPage /></ProtectedRoute>
        } />
        <Route path="guests" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk', 'housekeeping']}><GuestsPage /></ProtectedRoute>
        } />
        <Route path="guests/:id" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk', 'housekeeping']}><GuestDetailPage /></ProtectedRoute>
        } />
        <Route path="billing" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><BillingPage /></ProtectedRoute>
        } />
        <Route path="restaurant" element={
          <ProtectedRoute roles={['admin', 'manager', 'restaurant']}><RestaurantPage /></ProtectedRoute>
        } />
        <Route path="laundry" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk', 'housekeeping']}><LaundryPage /></ProtectedRoute>
        } />
        <Route path="housekeeping" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk', 'housekeeping']}><HousekeepingPage /></ProtectedRoute>
        } />
        <Route path="staff" element={
          <ProtectedRoute roles={['admin', 'manager']}><StaffPage /></ProtectedRoute>
        } />
        <Route path="inventory" element={
          <ProtectedRoute roles={['admin', 'manager', 'housekeeping', 'restaurant']}><InventoryPage /></ProtectedRoute>
        } />
        <Route path="rates" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><RatesPage /></ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><ReportsPage /></ProtectedRoute>
        } />
        <Route path="shift-handover" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><ShiftHandoverPage /></ProtectedRoute>
        } />
        <Route path="checkout-history" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><CheckoutHistoryPage /></ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute roles={['admin']}><SettingsPage /></ProtectedRoute>
        } />
        {/* OTA Integration Pages */}
        <Route path="channel-manager" element={
          <ProtectedRoute roles={['admin', 'manager']}><ChannelManagerPage /></ProtectedRoute>
        } />
        <Route path="ota-bookings" element={
          <ProtectedRoute roles={['admin', 'manager', 'front_desk']}><OtaBookingsPage /></ProtectedRoute>
        } />
        <Route path="reconciliation" element={
          <ProtectedRoute roles={['admin', 'manager']}><ReconciliationPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
