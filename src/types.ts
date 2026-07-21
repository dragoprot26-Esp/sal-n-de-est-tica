/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'es' | 'en';

export interface ThemeConfig {
  logoUrl?: string; // base64 representation of local image/logo
  headerFontFamily?: string; // 'serif' | 'sans' | 'mono' | 'space' | 'playfair' | 'inter' | 'space-grotesk'
  headerFontSize?: string; // e.g. 'text-3xl' | 'text-4xl' | 'text-5xl' | 'text-6xl'
  headerColor?: string; // hex
  subtitleFontSize?: string; // e.g. 'text-xs' | 'text-sm' | 'text-base'
  subtitleColor?: string; // hex
  bgColor?: string; // hex for public page background
  primaryColor?: string; // hex for buttons/accent, e.g. artistic-sage
  textColor?: string; // hex for general text on public page, e.g. artistic-dark
  loginBgUrl?: string; // base64 representation of local background image for login
  loginBgOpacity?: number; // float value from 0 to 1
}

export interface Tenant {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  address: string;
  locationUrl: string;
  phonePrefix: string; // e.g. "+549"
  rating: number;
  theme?: ThemeConfig;
  phone?: string;
  workingDays?: string;
  workingHours?: string;
}

export interface Service {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  durationMinutes: number;
  category: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface Collaborator {
  id: string;
  name: string;
  phone: string;
  username: string;
  password?: string; // stored for simulation
  avatarUrl: string;
  status: 'active' | 'pending_approval' | 'approved' | 'rejected' | 'offline';
  biometricsEnabled: boolean;
  servicesCompleted: number;
  revenueGenerated: number;
}

export interface Appointment {
  id: string;
  tenantId: string;
  serviceId: string;
  collaboratorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  clientName: string;
  clientPhone: string;
  status: 'pending' | 'completed' | 'cancelled';
  price: number; // captured at booking
  // Tipo de reserva: 'servicio' (turno con profesional) o 'retiro' (pedido de productos)
  tipo?: 'servicio' | 'retiro';
  // Solo para pedidos de retiro: qué productos encargó la clienta
  items?: { productId: string; nameEs: string; nameEn: string; price: number; qty: number }[];
}

export interface Comment {
  id: string;
  tenantId: string;
  clientName: string;
  text: string;
  rating: number;
  date: string;
  approved: boolean;
}

export interface SaleRecord {
  id: string;
  date: string; // YYYY-MM-DD HH:MM
  itemType: 'service' | 'product';
  itemNameEs: string;
  itemNameEn: string;
  price: number;
  completedBy: string; // Collaborator name or 'Admin'
}
