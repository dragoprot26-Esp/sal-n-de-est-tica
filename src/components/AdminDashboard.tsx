/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/i18n';
import { downloadSalonQrPdf } from '../utils/helpers';
import { comprimirImagen } from '../img';
import { PublicPage } from './PublicPage';
import { 
  BarChart, Calendar, Settings, ShieldAlert, Check, X, 
  Trash2, Plus, Download, Upload, LogOut, Phone, Users, 
  PlusCircle, Edit2, Lock, Save, ListFilter, Globe, Database, QrCode, Palette, RefreshCw,
  Moon, Sun, Image, CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const {
    language,
    setLanguage,
    activeTenant,
    setActiveTenant,
    tenants,
    services,
    setServices,
    products,
    setProducts,
    collaborators,
    setCollaborators,
    addCollaborator,
    deleteCollaborator,
    editCollaborator,
    appointments,
    setAppointments,
    comments,
    approveComment,
    rejectComment,
    salesHistory,
    exportSalesSpreadsheet,
    downloadBackup,
    restoreBackup,
    phonePrefix,
    setPhonePrefix,
    pendingAccessRequests,
    approveAccessRequest,
    denyAccessRequest,
    setCurrentUser,
    updateTenantTheme,
    updateTenantDetails,
    categories,
    setCategories,
    licenseCode
  } = useApp();

  // Link público real del inquilino (el que debe llevar el QR).
  const publicUrl = licenseCode
    ? `${window.location.origin}/?codigo=${licenseCode}`
    : window.location.origin;

  // Active section inside dashboard
  const [activeTab, setActiveTab] = useState<'sales' | 'turnos' | 'collabs' | 'services' | 'products' | 'reviews' | 'backups' | 'theme' | 'adminTheme'>('sales');

  // Admin Panel Theme state
  const [adminTheme, setAdminThemeState] = useState<'light' | 'medium' | 'dark'>(() => {
    const saved = localStorage.getItem('bella_admin_theme');
    return (saved as any) || 'medium';
  });

  const setAdminTheme = (theme: 'light' | 'medium' | 'dark') => {
    setAdminThemeState(theme);
    localStorage.setItem('bella_admin_theme', theme);
  };

  // Editing item IDs
  const [editingCollabId, setEditingCollabId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // New category state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);

  // QR preview state
  const [viewingQr, setViewingQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const currentUrl = publicUrl; // Link público REAL del inquilino (con ?codigo=)
    QRCode.toDataURL(currentUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e1b18',
        light: '#ffffff'
      }
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error('Error generating base64 QR:', err));
  }, [publicUrl]);  // se regenera cuando ya tenemos el código del inquilino

  // New item modal/form states
  const [newServiceNameEs, setNewServiceNameEs] = useState('');
  const [newServiceNameEn, setNewServiceNameEn] = useState('');
  const [newServiceDescEs, setNewServiceDescEs] = useState('');
  const [newServiceDescEn, setNewServiceDescEn] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [newServiceDuration, setNewServiceDuration] = useState(60);
  const [newServiceCategory, setNewServiceCategory] = useState<string>('facial');

  const [newProdNameEs, setNewProdNameEs] = useState('');
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdDescEs, setNewProdDescEs] = useState('');
  const [newProdDescEn, setNewProdDescEn] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdStock, setNewProdStock] = useState(10);

  const [collabName, setCollabName] = useState('');
  const [collabPhone, setCollabPhone] = useState('');
  const [collabUser, setCollabUser] = useState('');
  const [collabPass, setCollabPass] = useState('');
  const [collabEsAdmin, setCollabEsAdmin] = useState(false);

  // Editing configuration states
  const [editingPrefix, setEditingPrefix] = useState(phonePrefix);
  const [vacuumOnExport, setVacuumOnExport] = useState(false);

  // Editing tenant details states
  const [tenantPhone, setTenantPhone] = useState(activeTenant.phone || '');
  const [tenantAddress, setTenantAddress] = useState(activeTenant.address || '');
  const [tenantLocationUrl, setTenantLocationUrl] = useState(activeTenant.locationUrl || '');
  const [tenantWorkingDays, setTenantWorkingDays] = useState(activeTenant.workingDays || '');
  const [tenantWorkingHours, setTenantWorkingHours] = useState(activeTenant.workingHours || '');

  // State to toggle live public page preview
  const [previewPublic, setPreviewPublic] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Custom Admin Panel input text color state
  const [adminInputTextColor, setAdminInputTextColorState] = useState<string>(() => {
    return localStorage.getItem('bella_admin_input_text_color') || '#1c1917';
  });

  const setAdminInputTextColor = (color: string) => {
    setAdminInputTextColorState(color);
    localStorage.setItem('bella_admin_input_text_color', color);
  };

  useEffect(() => {
    if (activeTenant) {
      setTenantPhone(activeTenant.phone || '');
      setTenantAddress(activeTenant.address || '');
      setTenantLocationUrl(activeTenant.locationUrl || '');
      setTenantWorkingDays(activeTenant.workingDays || '');
      setTenantWorkingHours(activeTenant.workingHours || '');
    }
  }, [activeTenant]);

  // Status message
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Create or Edit Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceNameEs || !newServicePrice) return;

    if (editingServiceId) {
      setServices(prev => prev.map(s => s.id === editingServiceId ? {
        ...s,
        nameEs: newServiceNameEs,
        nameEn: newServiceNameEn || newServiceNameEs,
        descriptionEs: newServiceDescEs,
        descriptionEn: newServiceDescEn || newServiceDescEs,
        price: Number(newServicePrice),
        durationMinutes: Number(newServiceDuration),
        category: newServiceCategory
      } : s));
      triggerToast(language === 'es' ? 'Servicio editado con éxito!' : 'Service updated successfully!');
      setEditingServiceId(null);
    } else {
      const id = `serv-${Date.now()}`;
      const newService = {
        id,
        nameEs: newServiceNameEs,
        nameEn: newServiceNameEn || newServiceNameEs,
        descriptionEs: newServiceDescEs,
        descriptionEn: newServiceDescEn || newServiceDescEs,
        price: Number(newServicePrice),
        durationMinutes: Number(newServiceDuration),
        category: newServiceCategory,
        imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=500'
      };

      setServices(prev => [newService, ...prev]);
      triggerToast(language === 'es' ? 'Servicio agregado con éxito!' : 'Service added successfully!');
    }
    
    // Reset inputs
    setNewServiceNameEs('');
    setNewServiceNameEn('');
    setNewServiceDescEs('');
    setNewServiceDescEn('');
    setNewServicePrice(0);
    setNewServiceDuration(60);
  };

  // Create or Edit Product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdNameEs || !newProdPrice) return;

    if (editingProductId) {
      setProducts(prev => prev.map(p => p.id === editingProductId ? {
        ...p,
        nameEs: newProdNameEs,
        nameEn: newProdNameEn || newProdNameEs,
        descriptionEs: newProdDescEs,
        descriptionEn: newProdDescEn || newProdDescEs,
        price: Number(newProdPrice),
        stock: Number(newProdStock)
      } : p));
      triggerToast(language === 'es' ? 'Producto editado con éxito!' : 'Product updated successfully!');
      setEditingProductId(null);
    } else {
      const id = `prod-${Date.now()}`;
      const newProduct = {
        id,
        nameEs: newProdNameEs,
        nameEn: newProdNameEn || newProdNameEs,
        descriptionEs: newProdDescEs,
        descriptionEn: newProdDescEn || newProdDescEs,
        price: Number(newProdPrice),
        stock: Number(newProdStock),
        imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=300'
      };

      setProducts(prev => [newProduct, ...prev]);
      triggerToast(language === 'es' ? 'Producto agregado con éxito!' : 'Product added successfully!');
    }
    
    setNewProdNameEs('');
    setNewProdNameEn('');
    setNewProdDescEs('');
    setNewProdDescEn('');
    setNewProdPrice(0);
    setNewProdStock(10);
  };

  // Create or Edit Collaborator
  const handleAddCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName || !collabPhone || !collabUser) return;

    if (editingCollabId) {
      const existing = collaborators.find(c => c.id === editingCollabId);
      if (existing) {
        editCollaborator({
          ...existing,
          name: collabName,
          phone: collabPhone,
          username: collabUser.toLowerCase().trim(),
          password: collabPass || existing.password,
          esAdmin: collabEsAdmin
        });
        triggerToast(language === 'es' ? 'Colaborador editado con éxito!' : 'Collaborator edited successfully!');
      }
      setEditingCollabId(null);
    } else {
      if (!collabPass) return;
      addCollaborator(collabName, collabPhone, collabUser, collabPass, collabEsAdmin);
      triggerToast(language === 'es' ? 'Colaborador creado con éxito!' : 'Collaborator created successfully!');
    }

    setCollabName('');
    setCollabPhone('');
    setCollabUser('');
    setCollabPass('');
    setCollabEsAdmin(false);
  };

  // Delete Service / Product
  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    triggerToast(language === 'es' ? 'Servicio eliminado.' : 'Service deleted.');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    triggerToast(language === 'es' ? 'Producto eliminado.' : 'Product deleted.');
  };

  // Save customized Prefix
  const handleSaveConfig = () => {
    setPhonePrefix(editingPrefix);
    triggerToast(language === 'es' ? 'Configuración de prefijo guardada!' : 'Prefix configuration saved!');
  };

  // Save customized Page Theme
  const handleSaveTheme = () => {
    setIsSavingTheme(true);
    setTimeout(() => {
      setIsSavingTheme(false);
      triggerToast(language === 'es' ? '¡Cambios del tema de página guardados con éxito!' : 'Page theme changes saved successfully!');
    }, 1200);
  };

  // Download Salon QR PDF
  const handleQrDownload = async () => {
    await downloadSalonQrPdf(publicUrl, activeTenant.name);
    triggerToast(language === 'es' ? '¡PDF del QR generado con éxito!' : 'QR PDF generated successfully!');
  };

  // File system restore handler
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const ok = restoreBackup(content);
      if (ok) {
        triggerToast(language === 'es' ? 'Copia de seguridad restaurada correctamente!' : 'Backup restored successfully!');
      } else {
        triggerToast(language === 'es' ? 'Error al restaurar: Archivo inválido.' : 'Restore failed: Invalid file.');
      }
    };
    reader.readAsText(file);
  };

  // Date filters helper for Sales History
  const getFilteredSales = (range: 'daily' | 'weekly' | 'monthly' | 'annual') => {
    const now = new Date();
    return salesHistory.filter(sale => {
      const saleDate = new Date(sale.date);
      const diffTime = Math.abs(now.getTime() - saleDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (range === 'daily') return diffDays <= 1;
      if (range === 'weekly') return diffDays <= 7;
      if (range === 'monthly') return diffDays <= 30;
      return diffDays <= 365; // annual
    });
  };

  // Calculations
  const calculateTotalSales = (sales: typeof salesHistory) => {
    return sales.reduce((sum, s) => sum + s.price, 0);
  };

  // Dynamic admin theme styles
  const isDark = adminTheme === 'dark';
  const isLight = adminTheme === 'light';

  const containerBg = isDark ? 'bg-stone-950 text-stone-100' : (isLight ? 'bg-stone-50 text-stone-900' : 'bg-artistic-bg text-artistic-dark');
  const sidebarBg = isDark ? 'bg-stone-900 border-stone-800' : (isLight ? 'bg-white border-stone-100' : 'bg-white border-artistic-border');
  const sidebarBorder = isDark ? 'border-stone-800' : (isLight ? 'border-stone-100' : 'border-artistic-border');

  if (previewPublic) {
    return (
      <div className="relative min-h-screen">
        {/* Floating Header Overlay for Preview Mode */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-stone-900/90 text-stone-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-stone-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-artistic-sage opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-artistic-sage"></span>
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase font-sans">
              {language === 'es' ? 'Vista Previa de Página Pública' : 'Public Page Preview'}
            </span>
          </div>
          <button
            type="button"
            id="close_public_preview_btn"
            onClick={() => setPreviewPublic(false)}
            className="px-4 py-1.5 bg-artistic-sage hover:bg-artistic-dark text-white text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            {language === 'es' ? 'Cerrar / Volver' : 'Close / Go Back'}
          </button>
        </div>

        {/* Public Page content */}
        <PublicPage onOpenLogin={() => {}} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-artistic-sage/20 selection:text-artistic-sage ${containerBg} admin-panel-container`}>
      <style>{`
        /* Dynamic override for legibility in fields across the admin panel */
        .admin-panel-container input,
        .admin-panel-container textarea,
        .admin-panel-container select {
          color: ${adminInputTextColor} !important;
        }
        /* Make sure placeholder text contrast is still clean */
        .admin-panel-container input::placeholder,
        .admin-panel-container textarea::placeholder {
          color: ${isDark ? '#78716c' : '#a8a29e'} !important;
          opacity: 0.8;
        }
      `}</style>
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-xs font-semibold tracking-widest uppercase shadow-xl flex items-center gap-2 border ${isDark ? 'bg-stone-900 text-stone-100 border-stone-700' : 'bg-white text-artistic-sage border-artistic-sage/30'}`}
          >
            <Check className="w-3.5 h-3.5 text-artistic-sage" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Sidebar Navigation */}
      <aside className={`w-full md:w-64 flex flex-col justify-between p-6 space-y-8 border-r ${sidebarBg}`}>
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-artistic-border pb-6">
            <div className="p-2.5 bg-artistic-sage/10 border border-artistic-sage/20 rounded-xl text-artistic-sage">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif italic font-medium tracking-tight text-artistic-dark">{getTranslation(language, 'adminTitle')}</h4>
              <p className="text-[10px] text-artistic-muted uppercase tracking-wider">Suite Premium v1.2</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              id="tab_sales_btn"
              onClick={() => setActiveTab('sales')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'sales' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <BarChart className="w-4 h-4" />
              {getTranslation(language, 'statsTitle')}
            </button>
            <button
              id="tab_turnos_btn"
              onClick={() => setActiveTab('turnos')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'turnos' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              {language === 'es' ? 'Turnos Reservados' : 'Booked Appointments'}
              {appointments.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-auto bg-artistic-sage text-white font-bold px-2 py-0.5 rounded-full text-[9px]">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              id="tab_collabs_btn"
              onClick={() => setActiveTab('collabs')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'collabs' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Users className="w-4 h-4" />
              {getTranslation(language, 'collaboratorsTitle')}
            </button>
            <button
              id="tab_services_btn"
              onClick={() => setActiveTab('services')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'services' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              {getTranslation(language, 'services')}
            </button>
            <button
              id="tab_products_btn"
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'products' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {getTranslation(language, 'products')}
            </button>
            <button
              id="tab_reviews_btn"
              onClick={() => setActiveTab('reviews')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'reviews' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Check className="w-4 h-4" />
              {getTranslation(language, 'commentsApproval')}
              {comments.filter(c => !c.approved).length > 0 && (
                <span className="ml-auto bg-artistic-sage text-white font-bold px-2 py-0.5 rounded-full text-[9px]">
                  {comments.filter(c => !c.approved).length}
                </span>
              )}
            </button>
            <button
              id="tab_backups_btn"
              onClick={() => setActiveTab('backups')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'backups' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Database className="w-4 h-4" />
              {getTranslation(language, 'backupTitle')}
            </button>
            <button
              id="tab_theme_btn"
              onClick={() => setActiveTab('theme')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'theme' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Palette className="w-4 h-4" />
              {getTranslation(language, 'themeTab')}
            </button>
            <button
              id="tab_admin_theme_btn"
              onClick={() => setActiveTab('adminTheme')}
              className={`w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'adminTheme' ? 'bg-artistic-sage text-white shadow-sm font-bold' : 'text-artistic-muted hover:bg-artistic-cream hover:text-artistic-dark'
              }`}
            >
              <Moon className="w-4 h-4" />
              {language === 'es' ? 'Tema Panel' : 'Admin Theme'}
            </button>
            
            <button
              type="button"
              id="sidebar_view_public_page_btn"
              onClick={() => {
                setPreviewPublic(true);
                triggerToast(language === 'es' ? 'Abriendo vista previa...' : 'Opening preview...');
              }}
              className="w-full text-left px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2.5 transition-all text-white bg-artistic-sage hover:bg-artistic-dark shadow-xs font-bold mt-2 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {language === 'es' ? 'Ver Página Pública' : 'View Public Page'}
            </button>
          </nav>
        </div>

        {/* Global actions */}
        <div className="space-y-4 pt-6 border-t border-artistic-border">
          {/* Quick Language Toggle inside Admin */}
          <div className="flex items-center justify-between text-xs text-artistic-muted">
            <span className="font-medium">{getTranslation(language, 'language')}</span>
            <button 
              id="admin_lang_toggle"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="px-2.5 py-1 bg-artistic-cream hover:bg-artistic-cream/80 rounded-full text-[10px] font-bold text-artistic-dark border border-artistic-border transition-all uppercase"
            >
              {language}
            </button>
          </div>

          <button
            id="admin_logout_btn"
            onClick={() => setCurrentUser(null)}
            className="w-full py-2.5 bg-artistic-cream hover:bg-red-50 hover:text-red-700 text-artistic-dark font-semibold rounded-full text-xs transition-all flex items-center justify-center gap-2 border border-artistic-border"
          >
            <LogOut className="w-3.5 h-3.5" />
            {getTranslation(language, 'logout')}
          </button>
        </div>
      </aside>

      {/* Main Panel Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Real-Time Collaborators Sign-In Approval Prompts */}
        <AnimatePresence>
          {pendingAccessRequests.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 bg-gradient-to-r from-artistic-sage/15 via-artistic-sage/10 to-transparent border border-artistic-sage/30 rounded-3xl space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-artistic-sage animate-pulse" />
                <h4 className="font-serif italic font-medium text-artistic-dark text-base">{getTranslation(language, 'activeRequests')}</h4>
                <span className="px-2.5 py-0.5 bg-artistic-sage text-white rounded-full font-semibold text-[9px] uppercase tracking-wider">REAL-TIME</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingAccessRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white border border-artistic-border rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                    <div>
                      <h5 className="font-semibold text-artistic-dark text-xs">{req.name}</h5>
                      <p className="text-[10px] text-artistic-muted mt-0.5">Usuario: @{req.username} • {req.timestamp}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`approve_req_${req.id}`}
                        onClick={() => { approveAccessRequest(req.id); triggerToast(language === 'es' ? 'Acceso Autorizado' : 'Access Authorized'); }}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all"
                        title={getTranslation(language, 'authorize')}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        id={`deny_req_${req.id}`}
                        onClick={() => { denyAccessRequest(req.id); triggerToast(language === 'es' ? 'Acceso Denegado' : 'Access Denied'); }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all"
                        title={getTranslation(language, 'deny')}
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab 1: Sales statistics & calculations */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-artistic-border pb-6">
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'statsTitle')}</h3>
                <p className="text-xs text-artistic-muted">Auditoría detallada de ingresos para el inquilino activo.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 bg-white border border-artistic-border px-3.5 py-2 rounded-full cursor-pointer shadow-xs">
                  <input
                    type="checkbox"
                    id="vacuum_records_checkbox"
                    checked={vacuumOnExport}
                    onChange={(e) => setVacuumOnExport(e.target.checked)}
                    className="rounded text-artistic-sage focus:ring-artistic-sage border-artistic-border bg-white"
                  />
                  <span className="text-[10px] text-artistic-dark font-semibold uppercase tracking-wider">{getTranslation(language, 'exportAndVacuum')}</span>
                </label>
                <button
                  id="export_detailed_csv"
                  onClick={() => { exportSalesSpreadsheet(vacuumOnExport); triggerToast(language === 'es' ? 'Planilla exportada con éxito.' : 'Spreadsheet exported successfully.'); }}
                  className="px-5 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs flex items-center gap-1.5 shadow-md transition-all uppercase tracking-widest"
                >
                  <Download className="w-3.5 h-3.5" />
                  {getTranslation(language, 'exportExcel')}
                </button>
              </div>
            </div>

            {/* Calculations summaries */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider block">{getTranslation(language, 'daily')}</span>
                <p className="text-3xl font-serif font-medium text-artistic-sage">${calculateTotalSales(getFilteredSales('daily')).toLocaleString()}</p>
                <span className="text-[10px] text-artistic-muted block italic">{getFilteredSales('daily').length} operaciones hechas</span>
              </div>
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider block">{getTranslation(language, 'weekly')}</span>
                <p className="text-3xl font-serif font-medium text-artistic-sage">${calculateTotalSales(getFilteredSales('weekly')).toLocaleString()}</p>
                <span className="text-[10px] text-artistic-muted block italic">{getFilteredSales('weekly').length} operaciones hechas</span>
              </div>
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider block">{getTranslation(language, 'monthly')}</span>
                <p className="text-3xl font-serif font-medium text-artistic-sage">${calculateTotalSales(getFilteredSales('monthly')).toLocaleString()}</p>
                <span className="text-[10px] text-artistic-muted block italic">{getFilteredSales('monthly').length} operaciones hechas</span>
              </div>
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider block">{getTranslation(language, 'annual')}</span>
                <p className="text-3xl font-serif font-medium text-artistic-sage">${calculateTotalSales(getFilteredSales('annual')).toLocaleString()}</p>
                <span className="text-[10px] text-artistic-muted block italic">{getFilteredSales('annual').length} operaciones hechas</span>
              </div>
            </div>

            {/* Grid Calculations: detailed data grid */}
            <div className="space-y-3">
              <h4 className="font-serif italic font-medium text-artistic-dark text-base">Planilla de Cálculo Detallada (Detalle de Movimientos)</h4>
              <div className="overflow-x-auto bg-white border border-artistic-border rounded-3xl shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-artistic-cream border-b border-artistic-border text-artistic-muted font-semibold uppercase tracking-wider">
                      <th className="p-4 text-[10px]">ID</th>
                      <th className="p-4 text-[10px]">Fecha</th>
                      <th className="p-4 text-[10px]">Tipo</th>
                      <th className="p-4 text-[10px]">Item (Español)</th>
                      <th className="p-4 text-[10px]">Item (English)</th>
                      <th className="p-4 text-[10px]">Monto</th>
                      <th className="p-4 text-[10px]">Responsable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-artistic-border">
                    {salesHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-artistic-muted italic">No hay registros de ventas en la planilla.</td>
                      </tr>
                    ) : (
                      salesHistory.map(sale => (
                        <tr key={sale.id} className="hover:bg-artistic-cream/40 transition-colors font-mono">
                          <td className="p-4 font-semibold text-artistic-sage text-[11px]">{sale.id}</td>
                          <td className="p-4 text-[11px] text-artistic-muted">{sale.date}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${
                              sale.itemType === 'service' ? 'bg-artistic-sage/10 text-artistic-sage border-artistic-sage/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>
                              {sale.itemType}
                            </span>
                          </td>
                          <td className="p-4 text-artistic-dark font-sans font-medium">{sale.itemNameEs}</td>
                          <td className="p-4 text-artistic-muted font-sans">{sale.itemNameEn}</td>
                          <td className="p-4 text-artistic-dark font-semibold font-mono">${sale.price.toLocaleString()}</td>
                          <td className="p-4 text-artistic-muted font-sans">{sale.completedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Collaborators directory */}
        {activeTab === 'turnos' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-serif italic font-medium text-artistic-dark">
                {language === 'es' ? 'Turnos Reservados' : 'Booked Appointments'}
              </h2>
              <p className="text-xs text-artistic-muted mt-1">
                {language === 'es'
                  ? 'Reservas que hicieron tus clientas desde la página pública.'
                  : 'Bookings made by your clients from the public page.'}
              </p>
            </div>

            {appointments.length === 0 ? (
              <div className="p-10 text-center bg-white border border-artistic-border rounded-2xl">
                <CalendarDays className="w-10 h-10 text-artistic-muted mx-auto mb-3" />
                <p className="text-sm font-semibold text-artistic-dark">
                  {language === 'es' ? 'Todavía no hay turnos reservados' : 'No appointments yet'}
                </p>
                <p className="text-xs text-artistic-muted mt-1">
                  {language === 'es'
                    ? 'Cuando una clienta reserve desde la página pública, va a aparecer acá.'
                    : 'When a client books from the public page, it will show up here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...appointments]
                  .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                  .map(appt => {
                    const serv = services.find(s => s.id === appt.serviceId);
                    const colab = collaborators.find(c => c.id === appt.collaboratorId);
                    const estadoStyle =
                      appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';
                    const estadoLabel =
                      appt.status === 'completed' ? (language === 'es' ? 'Atendido' : 'Completed')
                        : appt.status === 'cancelled' ? (language === 'es' ? 'Cancelado' : 'Cancelled')
                        : (language === 'es' ? 'Pendiente' : 'Pending');
                    return (
                      <div key={appt.id} className="bg-white border border-artistic-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-artistic-dark">{appt.clientName}</span>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${estadoStyle}`}>
                              {estadoLabel}
                            </span>
                          </div>
                          {(appt as any).tipo === 'retiro' ? (
                            <div className="mt-1.5 bg-artistic-cream/50 border border-artistic-border rounded-xl p-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-artistic-sage mb-1">
                                🧺 {language === 'es' ? 'Pedido para retirar' : 'Pickup order'}
                              </p>
                              {((appt as any).items || []).map((it: any) => (
                                <p key={it.productId} className="text-xs text-artistic-dark">
                                  {it.qty}× {language === 'es' ? it.nameEs : it.nameEn}
                                  <span className="text-artistic-muted"> — ${(it.price * it.qty).toLocaleString('es-AR')}</span>
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-artistic-muted mt-1">
                              💅 {serv ? (language === 'es' ? serv.nameEs : serv.nameEn) : (language === 'es' ? 'Servicio' : 'Service')}
                              {colab ? ` · 👤 ${colab.name}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-artistic-muted mt-0.5">
                            📅 {appt.date} · 🕒 {appt.time} · 💵 ${appt.price}
                          </p>
                          {appt.clientPhone && (
                            <a
                              href={`https://wa.me/${String(appt.clientPhone).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mt-1.5"
                            >
                              📱 {appt.clientPhone}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {appt.status !== 'completed' && (
                            <button
                              onClick={() => {
                                setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'completed' } : a));
                                triggerToast(language === 'es' ? '✅ Turno marcado como atendido' : '✅ Marked as completed');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-artistic-sage text-white hover:bg-artistic-dark transition-colors cursor-pointer"
                            >
                              {language === 'es' ? 'Atendido' : 'Complete'}
                            </button>
                          )}
                          {appt.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (!confirm(language === 'es' ? '¿Cancelar este turno?' : 'Cancel this appointment?')) return;
                                setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: 'cancelled' } : a));
                                triggerToast(language === 'es' ? 'Turno cancelado' : 'Appointment cancelled');
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-full border border-artistic-border text-artistic-muted hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                            >
                              {language === 'es' ? 'Cancelar' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collabs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-artistic-border pb-6">
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'collaboratorsTitle')}</h3>
                <p className="text-xs text-artistic-muted">Crea, edita, autoriza y elimina especialistas de estética.</p>
              </div>
            </div>

            {/* Create Collaborator Form */}
            <div className={`p-6 border rounded-3xl shadow-sm ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'}`}>
              <h4 className="font-serif italic font-medium text-base mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-artistic-dark">
                  <Plus className="w-4 h-4 text-artistic-sage" />
                  {editingCollabId ? (language === 'es' ? 'Editar Colaborador' : 'Edit Collaborator') : getTranslation(language, 'addCollaborator')}
                </span>
                {editingCollabId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCollabId(null);
                      setCollabName('');
                      setCollabPhone('');
                      setCollabUser('');
                      setCollabPass('');
                    }}
                    className="text-xs text-red-500 hover:underline cursor-pointer"
                  >
                    {language === 'es' ? 'Cancelar Edición' : 'Cancel Edit'}
                  </button>
                )}
              </h4>

              <form onSubmit={handleAddCollab} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">{getTranslation(language, 'collaboratorName')}</label>
                  <input
                    type="text"
                    required
                    id="new_collab_name"
                    placeholder="Ej: Sofía Martínez"
                    value={collabName}
                    onChange={(e) => setCollabName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">{getTranslation(language, 'collaboratorPhone')}</label>
                  <input
                    type="text"
                    required
                    id="new_collab_phone"
                    placeholder="Ej: 1155442211"
                    value={collabPhone}
                    onChange={(e) => setCollabPhone(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">{getTranslation(language, 'collaboratorUser')}</label>
                  <input
                    type="text"
                    required
                    id="new_collab_username"
                    placeholder="Ej: sofiam"
                    value={collabUser}
                    onChange={(e) => setCollabUser(e.target.value)}
                    disabled={editingCollabId !== null}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${editingCollabId ? 'opacity-65' : ''} ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">
                    {getTranslation(language, 'collaboratorPass')} {editingCollabId && (language === 'es' ? '(Dejar vacío para no cambiar)' : '(Leave empty to keep current)')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      required={editingCollabId === null}
                      id="new_collab_password"
                      placeholder="Ej: clave123"
                      value={collabPass}
                      onChange={(e) => setCollabPass(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                    />
                    <button
                      type="submit"
                      id="submit_add_collab"
                      className="px-5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-xl text-xs transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      {editingCollabId ? (language === 'es' ? 'Guardar' : 'Save') : getTranslation(language, 'add')}
                    </button>
                  </div>
                </div>

                {/* Tilde: Admin 2 (acceso completo, sin esperar aprobación) */}
                <div className="sm:col-span-4">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="collab_es_admin_checkbox"
                      checked={collabEsAdmin}
                      onChange={(e) => setCollabEsAdmin(e.target.checked)}
                      className="mt-0.5 rounded border-artistic-border text-artistic-sage focus:ring-artistic-sage"
                    />
                    <span className="text-xs text-artistic-muted group-hover:text-artistic-dark transition-colors">
                      <span className="font-semibold text-artistic-dark">
                        {language === 'es' ? 'Administrador 2 (acceso completo)' : 'Admin 2 (full access)'}
                      </span>
                      {' — '}
                      {language === 'es'
                        ? 'entra directo con permisos de administrador, sin esperar tu aprobación. Dejalo destildado para un colaborador normal (que sí espera que lo autorices).'
                        : 'logs in directly with admin permissions, no approval needed.'}
                    </span>
                  </label>
                </div>
              </form>
            </div>

            {/* Collaborators List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {collaborators.map(collab => (
                <div key={collab.id} className={`p-6 border rounded-3xl flex flex-col justify-between space-y-4 shadow-xs hover:shadow-sm transition-all ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                  <div className="flex items-center gap-3">
                    <img src={collab.avatarUrl} alt={collab.name} className="w-12 h-12 rounded-full object-cover border border-artistic-border shadow-sm" />
                    <div>
                      <h5 className="font-serif italic font-medium text-sm text-artistic-dark">{collab.name}</h5>
                      <p className="text-[10px] text-artistic-muted mt-0.5">@{collab.username} • {collab.phone}</p>
                    </div>
                  </div>

                  <div className={`border-t pt-3 space-y-1 text-xs ${adminTheme === 'dark' ? 'border-stone-800' : 'border-artistic-border'}`}>
                    <p className="flex justify-between">
                      <span className="text-artistic-muted">Servicios Realizados:</span>
                      <span className="font-semibold">{collab.servicesCompleted}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-artistic-muted">Ingresos Generados:</span>
                      <span className="font-semibold text-artistic-sage">${collab.revenueGenerated.toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-artistic-muted">Biometría:</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${collab.biometricsEnabled ? 'bg-artistic-sage/10 text-artistic-sage border-artistic-sage/20' : 'bg-artistic-cream text-artistic-muted border-artistic-border'}`}>
                        {collab.biometricsEnabled ? 'Activa' : 'Inactiva'}
                      </span>
                    </p>
                  </div>

                  <div className={`flex items-center justify-between border-t pt-3 ${adminTheme === 'dark' ? 'border-stone-800' : 'border-artistic-border'}`}>
                    <button
                      id={`delete_collab_${collab.id}`}
                      onClick={() => deleteCollaborator(collab.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-full transition-colors flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {getTranslation(language, 'delete')}
                    </button>
                    
                    <button
                      id={`edit_collab_btn_${collab.id}`}
                      onClick={() => {
                        setEditingCollabId(collab.id);
                        setCollabName(collab.name);
                        setCollabPhone(collab.phone);
                        setCollabUser(collab.username);
                        setCollabPass('');
                        setCollabEsAdmin(!!(collab as any).esAdmin);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {language === 'es' ? 'Editar' : 'Edit'}
                    </button>
                    
                    <button
                      id={`collab_biometric_toggle_${collab.id}`}
                      onClick={() => {
                        editCollaborator({ ...collab, biometricsEnabled: !collab.biometricsEnabled });
                        triggerToast(language === 'es' ? 'Preferencia de biometría guardada.' : 'Biometric preferences saved.');
                      }}
                      className="text-[10px] font-bold text-artistic-sage hover:text-artistic-dark transition-colors cursor-pointer"
                    >
                      Alternar Biometría
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Services editing & creation */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between border-b pb-6 ${adminTheme === 'dark' ? 'border-stone-800' : 'border-artistic-border'}`}>
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'hoursPricesTitle')}</h3>
                <p className="text-xs text-artistic-muted">Modifica, agrega o elimina servicios de estética, categorías y sus precios.</p>
              </div>
            </div>

            {/* Create Service form */}
            <div className={`p-6 border rounded-3xl shadow-sm ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'}`}>
              <h4 className="font-serif italic font-medium text-artistic-dark text-base mb-4 flex items-center justify-between">
                <span>{editingServiceId ? (language === 'es' ? 'Editar Servicio' : 'Edit Service') : getTranslation(language, 'addService')}</span>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingServiceId(null);
                      setNewServiceNameEs('');
                      setNewServiceNameEn('');
                      setNewServiceDescEs('');
                      setNewServiceDescEn('');
                      setNewServicePrice(0);
                      setNewServiceDuration(60);
                    }}
                    className="text-xs text-red-500 hover:underline cursor-pointer font-sans"
                  >
                    {language === 'es' ? 'Cancelar Edición' : 'Cancel Edit'}
                  </button>
                )}
              </h4>
              
              <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre (ES)</label>
                  <input
                    type="text"
                    required
                    id="new_service_name_es"
                    placeholder="Ej: Shock de Queratina"
                    value={newServiceNameEs}
                    onChange={(e) => setNewServiceNameEs(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre (EN)</label>
                  <input
                    type="text"
                    id="new_service_name_en"
                    placeholder="Ej: Keratin Treatment"
                    value={newServiceNameEn}
                    onChange={(e) => setNewServiceNameEn(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    required
                    id="new_service_price"
                    placeholder="Ej: 32000"
                    value={newServicePrice || ''}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción (ES)</label>
                  <input
                    type="text"
                    id="new_service_desc_es"
                    placeholder="Descripción del servicio para los clientes..."
                    value={newServiceDescEs}
                    onChange={(e) => setNewServiceDescEs(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción (EN)</label>
                  <input
                    type="text"
                    id="new_service_desc_en"
                    placeholder="English description..."
                    value={newServiceDescEn}
                    onChange={(e) => setNewServiceDescEn(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Duración (Minutos)</label>
                  <select
                    id="new_service_duration_select"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100' : 'bg-artistic-bg border-artistic-border text-artistic-dark'}`}
                  >
                    {[30, 45, 60, 75, 90, 120].map(m => (
                      <option key={m} value={m}>{m} min</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider">Categoría</label>
                    <button
                      type="button"
                      id="toggle_add_category_btn"
                      onClick={() => setShowAddCategoryInput(prev => !prev)}
                      className="text-[9px] text-artistic-sage hover:text-artistic-dark font-bold uppercase tracking-wider underline cursor-pointer"
                    >
                      {showAddCategoryInput ? (language === 'es' ? 'Cerrar' : 'Close') : (language === 'es' ? '+ Gestionar' : '+ Manage')}
                    </button>
                  </div>

                  {showAddCategoryInput && (
                    <div className={`mb-3 p-3 border rounded-xl space-y-2 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800' : 'bg-artistic-cream/40 border-artistic-border'}`}>
                      <p className="text-[9px] uppercase font-bold text-artistic-muted tracking-wider">Crear o Eliminar Categorías:</p>
                      
                      {/* Add new input */}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          id="new_category_input_field"
                          placeholder="Nueva categoría..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value.toLowerCase())}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-artistic-border'}`}
                        />
                        <button
                          type="button"
                          id="add_category_confirm_btn"
                          onClick={() => {
                            if (!newCategoryName) return;
                            if (categories.includes(newCategoryName)) {
                              triggerToast(language === 'es' ? 'La categoría ya existe.' : 'Category already exists.');
                              return;
                            }
                            setCategories(prev => [...prev, newCategoryName]);
                            setNewServiceCategory(newCategoryName);
                            setNewCategoryName('');
                            triggerToast(language === 'es' ? 'Categoría agregada!' : 'Category added!');
                          }}
                          className="px-2.5 bg-artistic-sage hover:bg-artistic-dark text-white text-[10px] rounded-lg font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* List of custom categories */}
                      <div className="flex flex-wrap gap-1 pt-1 max-h-24 overflow-y-auto">
                        {categories.map(cat => (
                          <span key={cat} className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[9px] font-medium ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-200' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                            {cat.toUpperCase()}
                            <button
                              type="button"
                              id={`delete_cat_${cat}`}
                              onClick={() => {
                                if (categories.length <= 1) {
                                  triggerToast(language === 'es' ? 'Debe quedar al menos una categoría.' : 'At least one category is required.');
                                  return;
                                }
                                setCategories(prev => prev.filter(c => c !== cat));
                                if (newServiceCategory === cat) {
                                  setNewServiceCategory(categories.find(c => c !== cat) || '');
                                }
                                triggerToast(language === 'es' ? 'Categoría eliminada.' : 'Category deleted.');
                              }}
                              className="text-red-500 hover:text-red-700 font-bold ml-0.5 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <select
                    id="new_service_category_select"
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    id="submit_add_service"
                    className="w-full py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    {editingServiceId ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes') : getTranslation(language, 'add')}
                  </button>
                </div>
              </form>
            </div>

            {/* List with inline price updates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(service => (
                <div key={service.id} className={`p-5 border rounded-3xl flex items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[9px] bg-artistic-sage/10 text-artistic-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-artistic-sage/20">
                      {service.category}
                    </span>
                    <h5 className="font-serif italic font-medium text-sm text-artistic-dark">{language === 'es' ? service.nameEs : service.nameEn}</h5>
                    <p className="text-[10px] text-artistic-muted">{service.durationMinutes} minutos</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] text-artistic-muted block uppercase font-bold text-right tracking-wider">PRECIO</span>
                      <input
                        type="number"
                        id={`service_price_input_${service.id}`}
                        value={service.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setServices(prev => prev.map(s => s.id === service.id ? { ...s, price: val } : s));
                        }}
                        className={`w-24 px-2.5 py-1.5 border rounded text-xs font-semibold text-right focus:outline-none font-mono ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-1'}`}
                      />
                    </div>
                    
                    <button
                      id={`edit_service_btn_${service.id}`}
                      onClick={() => {
                        setEditingServiceId(service.id);
                        setNewServiceNameEs(service.nameEs);
                        setNewServiceNameEn(service.nameEn || '');
                        setNewServiceDescEs(service.descriptionEs || '');
                        setNewServiceDescEn(service.descriptionEn || '');
                        setNewServicePrice(service.price);
                        setNewServiceDuration(service.durationMinutes);
                        setNewServiceCategory(service.category);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors cursor-pointer"
                      title={language === 'es' ? 'Editar Servicio' : 'Edit Service'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`delete_service_btn_${service.id}`}
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Our products list & stock */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between border-b pb-6 ${adminTheme === 'dark' ? 'border-stone-800' : 'border-artistic-border'}`}>
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'ourProducts')}</h3>
                <p className="text-xs text-artistic-muted">Modifica existencias, añade cosméticos premium y cambia precios de venta.</p>
              </div>
            </div>

            {/* Create Product Form */}
            <div className={`p-6 border rounded-3xl shadow-sm ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'}`}>
              <h4 className="font-serif italic font-medium text-artistic-dark text-base mb-4 flex items-center justify-between">
                <span>{editingProductId ? (language === 'es' ? 'Editar Producto' : 'Edit Product') : getTranslation(language, 'addProduct')}</span>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setNewProdNameEs('');
                      setNewProdNameEn('');
                      setNewProdDescEs('');
                      setNewProdDescEn('');
                      setNewProdPrice(0);
                      setNewProdStock(10);
                    }}
                    className="text-xs text-red-500 hover:underline cursor-pointer font-sans"
                  >
                    {language === 'es' ? 'Cancelar Edición' : 'Cancel Edit'}
                  </button>
                )}
              </h4>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre (ES)</label>
                  <input
                    type="text"
                    required
                    id="new_prod_name_es"
                    placeholder="Ej: Aceite Esencial de Romero"
                    value={newProdNameEs}
                    onChange={(e) => setNewProdNameEs(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre (EN)</label>
                  <input
                    type="text"
                    id="new_prod_name_en"
                    placeholder="Ej: Rosemary Essential Oil"
                    value={newProdNameEn}
                    onChange={(e) => setNewProdNameEn(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Precio ($)</label>
                  <input
                    type="number"
                    required
                    id="new_prod_price"
                    placeholder="Ej: 14500"
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción (ES)</label>
                  <input
                    type="text"
                    id="new_prod_desc_es"
                    placeholder="Descripción para venta..."
                    value={newProdDescEs}
                    onChange={(e) => setNewProdDescEs(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción (EN)</label>
                  <input
                    type="text"
                    id="new_prod_desc_en"
                    placeholder="English description..."
                    value={newProdDescEn}
                    onChange={(e) => setNewProdDescEn(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    id="new_prod_stock"
                    placeholder="Ej: 15"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500 focus:ring-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-artistic-sage'}`}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    id="submit_add_product"
                    className="w-full py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs transition-colors uppercase tracking-widest cursor-pointer"
                  >
                    {editingProductId ? (language === 'es' ? 'Guardar Cambios' : 'Save Changes') : getTranslation(language, 'add')}
                  </button>
                </div>
              </form>
            </div>

            {/* Products List & Stock Editors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className={`p-5 border rounded-3xl flex items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all ${adminTheme === 'dark' ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                  <div className="space-y-1.5 flex-1">
                    <h5 className="font-serif italic font-medium text-sm text-artistic-dark">{language === 'es' ? product.nameEs : product.nameEn}</h5>
                    <div className="flex items-center gap-4 text-[10px] text-artistic-muted">
                      <p>Stock:</p>
                      <input
                        type="number"
                        id={`product_stock_input_${product.id}`}
                        value={product.stock}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: val } : p));
                        }}
                        className={`w-14 px-2 py-1 border rounded text-center focus:outline-none ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-1'}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] text-artistic-muted block uppercase font-bold text-right tracking-wider">PRECIO</span>
                      <input
                        type="number"
                        id={`product_price_input_${product.id}`}
                        value={product.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: val } : p));
                        }}
                        className={`w-24 px-2.5 py-1.5 border rounded text-xs font-semibold text-right focus:outline-none font-mono ${adminTheme === 'dark' ? 'bg-stone-950 border-stone-800 text-stone-100 focus:border-stone-500' : 'bg-artistic-bg border-artistic-border text-artistic-dark focus:border-artistic-sage focus:ring-1'}`}
                      />
                    </div>
                    
                    <button
                      id={`edit_product_btn_${product.id}`}
                      onClick={() => {
                        setEditingProductId(product.id);
                        setNewProdNameEs(product.nameEs);
                        setNewProdNameEn(product.nameEn || '');
                        setNewProdDescEs(product.descriptionEs || '');
                        setNewProdDescEn(product.descriptionEn || '');
                        setNewProdPrice(product.price);
                        setNewProdStock(product.stock);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors cursor-pointer"
                      title={language === 'es' ? 'Editar Producto' : 'Edit Product'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`delete_product_btn_${product.id}`}
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Comment Approvals */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-artistic-border pb-6">
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'commentsApproval')}</h3>
                <p className="text-xs text-artistic-muted">Controla qué opiniones y consultas aparecen públicamente en el salón.</p>
              </div>
            </div>

            <div className="space-y-4">
              {comments.filter(c => !c.approved).length === 0 ? (
                <div className="p-8 bg-white border border-artistic-border rounded-3xl text-center text-artistic-muted italic shadow-xs">
                  {getTranslation(language, 'noPendingComments')}
                </div>
              ) : (
                comments.filter(c => !c.approved).map(comment => (
                  <div key={comment.id} className="p-6 bg-white border border-artistic-border rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-serif italic font-semibold text-artistic-dark text-xs">{comment.clientName}</span>
                        <div className="flex">
                          {Array.from({ length: comment.rating }).map((_, i) => (
                            <span key={i} className="text-artistic-sage text-xs">★</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-artistic-muted">{comment.date}</span>
                      </div>
                      <p className="text-xs text-artistic-dark italic">"{comment.text}"</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        id={`approve_comment_${comment.id}`}
                        onClick={() => { approveComment(comment.id); triggerToast(language === 'es' ? 'Comentario aprobado!' : 'Comment approved!'); }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-xs transition-all flex items-center gap-1.5 uppercase tracking-wider"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {getTranslation(language, 'approveBtn')}
                      </button>
                      <button
                        id={`reject_comment_${comment.id}`}
                        onClick={() => { rejectComment(comment.id); triggerToast(language === 'es' ? 'Comentario rechazado.' : 'Comment rejected.'); }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-full text-xs transition-all flex items-center gap-1.5 border border-red-100 uppercase tracking-wider"
                      >
                        <X className="w-3.5 h-3.5" />
                        {getTranslation(language, 'rejectBtn')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Backups and configs */}
        {activeTab === 'backups' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-artistic-border pb-6">
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'configTitle')}</h3>
                <p className="text-xs text-artistic-muted">Exporta tu base completa o actualiza configuraciones clave.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Backups section */}
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-xs">
                <h4 className="font-serif italic font-medium text-artistic-dark text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-artistic-sage" />
                  {getTranslation(language, 'backupTitle')}
                </h4>
                <p className="text-xs text-artistic-muted leading-relaxed">
                  Descarga un archivo JSON con todos tus servicios, productos, colaboradores y reservas, o súbelo para restaurar.
                </p>
                <div className="pt-2 space-y-3">
                  <button
                    id="download_json_backup"
                    onClick={downloadBackup}
                    className="w-full py-3 bg-artistic-bg hover:bg-artistic-cream border border-artistic-border text-artistic-dark font-semibold rounded-full text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                  >
                    <Download className="w-4 h-4 text-artistic-sage" />
                    {getTranslation(language, 'backupBtn')}
                  </button>
                  <label className="w-full py-3 bg-artistic-bg hover:bg-artistic-cream border border-artistic-border text-artistic-dark font-semibold rounded-full text-xs flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-widest">
                    <Upload className="w-4 h-4 text-artistic-sage" />
                    {getTranslation(language, 'restoreBtn')}
                    <input
                      type="file"
                      accept=".json"
                      id="upload_json_backup_input"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Salon QR PDF Section */}
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-xs">
                <h4 className="font-serif italic font-medium text-artistic-dark text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-artistic-sage" />
                  {language === 'es' ? 'Código QR del Salón' : 'Salon QR Code'}
                </h4>
                <p className="text-xs text-artistic-muted leading-relaxed">
                  {language === 'es' 
                    ? 'Descarga el código QR oficial del salón en un PDF de alta calidad, listo para imprimir y exhibir en la recepción.' 
                    : 'Download the official salon QR code in a high-quality PDF, ready to print and display at reception.'}
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    id="admin_download_qr_pdf"
                    onClick={handleQrDownload}
                    className="w-full py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-white" />
                    {getTranslation(language, 'downloadQr')}
                  </button>
                  <button
                    id="admin_view_qr_on_screen"
                    onClick={() => setViewingQr(true)}
                    className="w-full py-3 bg-white hover:bg-artistic-cream border border-artistic-border text-artistic-dark font-semibold rounded-full text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-artistic-sage" />
                    {language === 'es' ? 'Ver Código QR' : 'View QR Code'}
                  </button>
                </div>
              </div>

              {/* Customizable Prefix and Active Tenant Info */}
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-xs">
                <h4 className="font-serif italic font-medium text-artistic-dark text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-artistic-sage" />
                  {getTranslation(language, 'configTitle')}
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-artistic-muted mb-1.5">{getTranslation(language, 'defaultPrefix')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="custom_phone_prefix_input"
                        placeholder="Ej: +549, +34, +1"
                        value={editingPrefix}
                        onChange={(e) => setEditingPrefix(e.target.value)}
                        className="px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                      />
                      <button
                        type="button"
                        id="save_phone_prefix_btn"
                        onClick={handleSaveConfig}
                        className="px-5 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-xl text-xs transition-all uppercase tracking-wider"
                      >
                        {getTranslation(language, 'save')}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-artistic-border/80 pt-4">
                    <p className="text-[11px] text-artistic-muted font-mono">
                      Active Tenant ID: <span className="text-artistic-dark font-mono">{activeTenant.id}</span>
                    </p>
                    <p className="text-[11px] text-artistic-muted font-mono mt-1">
                      Platform URL: <span className="text-artistic-dark font-mono">{window.location.host}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* New section for Local Details and Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Card: Datos del Local */}
              <div className={`p-6 border rounded-3xl space-y-4 shadow-xs ${isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                <h4 className="font-serif italic font-medium text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-artistic-sage" />
                  {language === 'es' ? 'Datos del Local' : 'Salon Details'}
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-artistic-muted'}`}>
                  {language === 'es' 
                    ? 'Configure la información de contacto, dirección física, ubicación geográfica y disponibilidad que se muestra públicamente a los clientes.'
                    : 'Configure contact info, physical address, geographical location and availability displayed publicly to clients.'}
                </p>

                <div className="space-y-3 pt-2">
                  {/* Teléfono */}
                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-artistic-dark'}`}>
                      {language === 'es' ? 'Teléfono del Local' : 'Salon Phone'}
                    </label>
                    <input
                      type="text"
                      id="edit_tenant_phone"
                      placeholder="Ej: 11 5544-3322"
                      value={tenantPhone}
                      onChange={(e) => setTenantPhone(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-artistic-sage transition-all ${
                        isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                      }`}
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-artistic-dark'}`}>
                      {language === 'es' ? 'Dirección' : 'Address'}
                    </label>
                    <input
                      type="text"
                      id="edit_tenant_address"
                      placeholder="Ej: Av. del Libertador 1450"
                      value={tenantAddress}
                      onChange={(e) => setTenantAddress(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-artistic-sage transition-all ${
                        isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                      }`}
                    />
                  </div>

                  {/* Ubicación URL (Google Maps) */}
                  <div>
                    <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-artistic-dark'}`}>
                      {language === 'es' ? 'Enlace de Ubicación (Google Maps)' : 'Location Link (Google Maps)'}
                    </label>
                    <input
                      type="text"
                      id="edit_tenant_location_url"
                      placeholder="https://maps.google.com/?q=..."
                      value={tenantLocationUrl}
                      onChange={(e) => setTenantLocationUrl(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-artistic-sage transition-all ${
                        isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                      }`}
                    />
                  </div>

                  {/* Días y Horarios Disponibles */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-artistic-dark'}`}>
                        {language === 'es' ? 'Días Disponibles' : 'Working Days'}
                      </label>
                      <input
                        type="text"
                        id="edit_tenant_working_days"
                        placeholder="Ej: Lunes a Sábado"
                        value={tenantWorkingDays}
                        onChange={(e) => setTenantWorkingDays(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-artistic-sage transition-all ${
                          isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-stone-300' : 'text-artistic-dark'}`}>
                        {language === 'es' ? 'Horarios Disponibles' : 'Working Hours'}
                      </label>
                      <input
                        type="text"
                        id="edit_tenant_working_hours"
                        placeholder="Ej: 09:00 a 20:00 hs"
                        value={tenantWorkingHours}
                        onChange={(e) => setTenantWorkingHours(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-artistic-sage transition-all ${
                          isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      id="save_tenant_details_btn"
                      onClick={() => {
                        updateTenantDetails({
                          phone: tenantPhone,
                          address: tenantAddress,
                          locationUrl: tenantLocationUrl,
                          workingDays: tenantWorkingDays,
                          workingHours: tenantWorkingHours
                        });
                        triggerToast(language === 'es' ? '¡Datos del local actualizados con éxito!' : 'Salon details updated successfully!');
                      }}
                      className="w-full py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs transition-all uppercase tracking-widest cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {language === 'es' ? 'Guardar Datos del Local' : 'Save Salon Details'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card: Cambiar Idioma */}
              <div className={`p-6 border rounded-3xl space-y-4 shadow-xs flex flex-col justify-between ${isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-artistic-border text-artistic-dark'}`}>
                <div className="space-y-4">
                  <h4 className="font-serif italic font-medium text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-artistic-sage" />
                    {language === 'es' ? 'Cambiar Idioma del Sistema' : 'Change System Language'}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-artistic-muted'}`}>
                    {language === 'es' 
                      ? 'Cambie el idioma del sistema entre Español e Inglés. Esta configuración afectará las interfaces de usuario tanto públicas como del panel de control.'
                      : 'Switch the system language between Spanish and English. This configuration affects both the public and control panel user interfaces.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                      id="lang_switch_es_btn"
                      onClick={() => {
                        setLanguage('es');
                        triggerToast('¡Idioma cambiado a Español!');
                      }}
                      className={`py-6 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        language === 'es' 
                          ? 'border-artistic-sage ring-2 ring-artistic-sage/20 bg-artistic-cream/30 text-artistic-dark font-bold shadow-xs' 
                          : (isDark ? 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400' : 'border-artistic-border hover:bg-artistic-cream/10 text-artistic-muted')
                      }`}
                    >
                      <span className="text-xl">🇪🇸</span>
                      <span className="text-xs font-semibold uppercase tracking-wider">Español</span>
                    </button>

                    <button
                      id="lang_switch_en_btn"
                      onClick={() => {
                        setLanguage('en');
                        triggerToast('Language changed to English!');
                      }}
                      className={`py-6 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        language === 'en' 
                          ? 'border-artistic-sage ring-2 ring-artistic-sage/20 bg-artistic-cream/30 text-artistic-dark font-bold shadow-xs' 
                          : (isDark ? 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400' : 'border-artistic-border hover:bg-artistic-cream/10 text-artistic-muted')
                      }`}
                    >
                      <span className="text-xl">🇺🇸</span>
                      <span className="text-xs font-semibold uppercase tracking-wider">English</span>
                    </button>
                  </div>
                </div>

                <div className={`border-t pt-4 mt-auto ${isDark ? 'border-stone-800/80' : 'border-artistic-border/60'}`}>
                  <p className={`text-[10px] italic leading-relaxed text-center ${isDark ? 'text-stone-500' : 'text-artistic-muted'}`}>
                    {language === 'es' 
                      ? 'Nota: El idioma se guarda en la sesión del cliente actual.' 
                      : 'Note: Language preference is saved in the current client session.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Theme Customization Tab */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            {/* Selector de salón (movido desde la página pública: solo el admin puede cambiarlo) */}
            {tenants.length > 1 && (
              <div className="bg-artistic-cream/60 border border-artistic-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-artistic-dark">
                    {language === 'es' ? 'Salón activo' : 'Active salon'}
                  </p>
                  <p className="text-[11px] text-artistic-muted mt-0.5">
                    {language === 'es'
                      ? 'Elegí sobre qué salón estás trabajando. (Antes estaba en la página pública.)'
                      : 'Choose which salon you are working on.'}
                  </p>
                </div>
                <div className="relative shrink-0">
                  <select
                    id="tenant_select_dropdown_admin"
                    value={activeTenant.id}
                    onChange={(e) => {
                      const target = tenants.find(t => t.id === e.target.value);
                      if (target) setActiveTenant(target);
                    }}
                    className="appearance-none bg-white border border-artistic-border rounded-full px-4 py-2 pr-9 text-xs font-semibold uppercase tracking-wider text-artistic-dark focus:outline-none focus:border-artistic-sage cursor-pointer"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-artistic-muted">▾</div>
                </div>
              </div>
            )}

            <div className="border-b border-artistic-border pb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">
                  {getTranslation(language, 'themeTab')}
                </h3>
                <p className="text-xs text-artistic-muted">
                  {getTranslation(language, 'themeTabSubtitle')}
                </p>
              </div>
              <button
                onClick={() => {
                  updateTenantTheme({
                    logoUrl: '',
                    headerFontFamily: 'serif',
                    headerFontSize: 'text-5xl',
                    headerColor: '#1c1917',
                    subtitleFontSize: 'text-xs',
                    subtitleColor: '#78716c',
                    bgColor: '#fdfcfb',
                    primaryColor: '#8a9a86',
                    textColor: '#44403c',
                  });
                  triggerToast(language === 'es' ? '¡Tema restablecido con éxito!' : 'Theme reset successfully!');
                }}
                className="px-4 py-2 bg-artistic-cream hover:bg-artistic-border text-artistic-dark font-semibold rounded-full text-xs flex items-center gap-1.5 transition-all uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-artistic-sage animate-spin-slow" />
                {getTranslation(language, 'resetTheme')}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Settings: Logo & Typography */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Header Logo upload */}
                <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-xs">
                  <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center gap-2">
                    <Palette className="w-4.5 h-4.5 text-artistic-sage" />
                    {getTranslation(language, 'logoUpload')}
                  </h4>
                  <p className="text-xs text-artistic-muted">
                    {getTranslation(language, 'logoUploadHelp')}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-artistic-cream/30 border border-artistic-border/50 rounded-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-artistic-border flex items-center justify-center overflow-hidden shadow-inner">
                      {activeTenant.theme?.logoUrl ? (
                        <img 
                          src={activeTenant.theme.logoUrl} 
                          alt="Uploaded header" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <img 
                          src={activeTenant.logo} 
                          alt="Default logo" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3 w-full">
                      <label className="inline-block px-5 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs transition-all uppercase tracking-wider cursor-pointer shadow-sm text-center">
                        <Upload className="w-4 h-4 inline-block mr-1 text-white" />
                        {language === 'es' ? 'Seleccionar Imagen' : 'Select Image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              comprimirImagen(file, 1000, 0.72).then((base64) => {
                                if (!base64) return;
                                updateTenantTheme({ logoUrl: base64 });
                                triggerToast(language === 'es' ? '¡Imagen de cabecera cargada con éxito!' : 'Header image uploaded successfully!');
                              });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {activeTenant.theme?.logoUrl && (
                        <button
                          onClick={() => {
                            updateTenantTheme({ logoUrl: '' });
                            triggerToast(language === 'es' ? 'Imagen eliminada, usando logo predeterminado.' : 'Image cleared, using default logo.');
                          }}
                          className="ml-3 inline-block px-5 py-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-semibold rounded-full text-xs transition-all uppercase tracking-wider cursor-pointer"
                        >
                          {language === 'es' ? 'Quitar Imagen' : 'Remove Image'}
                        </button>
                      )}
                      <p className="text-[10px] text-artistic-muted">
                        Formatos soportados: JPG, PNG, WEBP. Recomendado: fondo transparente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Header Typography */}
                <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-6 shadow-xs">
                  <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center gap-2">
                    <Palette className="w-4.5 h-4.5 text-artistic-sage" />
                    {language === 'es' ? 'Configuración de Título y Subtítulo' : 'Title & Subtitle Configuration'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Title Font */}
                    <div>
                      <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                        {getTranslation(language, 'headerFont')}
                      </label>
                      <select
                        value={activeTenant.theme?.headerFontFamily || 'serif'}
                        onChange={(e) => updateTenantTheme({ headerFontFamily: e.target.value })}
                        className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                      >
                        <option value="serif">Playfair Display (Serif Elegante)</option>
                        <option value="sans">Inter (Moderno Minimalista)</option>
                        <option value="space-grotesk">Space Grotesk (Tech Futurista)</option>
                        <option value="mono">JetBrains Mono (Código Brutal)</option>
                      </select>
                    </div>

                    {/* Title Size */}
                    <div>
                      <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                        {getTranslation(language, 'headerFontSize')}
                      </label>
                      <select
                        value={activeTenant.theme?.headerFontSize || 'text-5xl'}
                        onChange={(e) => updateTenantTheme({ headerFontSize: e.target.value })}
                        className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                      >
                        <option value="text-2xl">Extra Pequeño (2XL)</option>
                        <option value="text-3xl">Pequeño (3XL)</option>
                        <option value="text-4xl">Mediano (4XL)</option>
                        <option value="text-5xl">Grande (5XL - Predeterminado)</option>
                        <option value="text-6xl">Muy Grande (6XL)</option>
                        <option value="text-7xl">Gigante (7XL)</option>
                      </select>
                    </div>

                    {/* Title Color */}
                    <div>
                      <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                        {getTranslation(language, 'headerColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeTenant.theme?.headerColor || '#1c1917'}
                          onChange={(e) => updateTenantTheme({ headerColor: e.target.value })}
                          className="w-10 h-10 border border-artistic-border rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTenant.theme?.headerColor || '#1c1917'}
                          onChange={(e) => updateTenantTheme({ headerColor: e.target.value })}
                          className="flex-1 px-4 py-2 bg-artistic-bg border border-artistic-border rounded-xl text-xs font-mono uppercase"
                        />
                      </div>
                    </div>

                    {/* Subtitle Size */}
                    <div>
                      <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                        {getTranslation(language, 'subtitleFontSize')}
                      </label>
                      <select
                        value={activeTenant.theme?.subtitleFontSize || 'text-xs'}
                        onChange={(e) => updateTenantTheme({ subtitleFontSize: e.target.value })}
                        className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                      >
                        <option value="text-[10px]">Micro (10px)</option>
                        <option value="text-xs">Pequeño (12px - Predeterminado)</option>
                        <option value="text-sm">Mediano (14px)</option>
                        <option value="text-base">Grande (16px)</option>
                      </select>
                    </div>

                    {/* Subtitle Color */}
                    <div>
                      <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                        {getTranslation(language, 'subtitleColor')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={activeTenant.theme?.subtitleColor || '#78716c'}
                          onChange={(e) => updateTenantTheme({ subtitleColor: e.target.value })}
                          className="w-10 h-10 border border-artistic-border rounded-xl cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={activeTenant.theme?.subtitleColor || '#78716c'}
                          onChange={(e) => updateTenantTheme({ subtitleColor: e.target.value })}
                          className="flex-1 px-4 py-2 bg-artistic-bg border border-artistic-border rounded-xl text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Settings: Colors (Background, Primary, Text) */}
              <div className="space-y-6">
                <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-6 shadow-xs">
                  <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center gap-2">
                    <Palette className="w-4.5 h-4.5 text-artistic-sage" />
                    {language === 'es' ? 'Paleta de Colores' : 'Color Palette'}
                  </h4>

                  {/* Public Page Background Color */}
                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                      {getTranslation(language, 'bgColor')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeTenant.theme?.bgColor || '#fdfcfb'}
                        onChange={(e) => updateTenantTheme({ bgColor: e.target.value })}
                        className="w-10 h-10 border border-artistic-border rounded-xl cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeTenant.theme?.bgColor || '#fdfcfb'}
                        onChange={(e) => updateTenantTheme({ bgColor: e.target.value })}
                        className="flex-1 px-4 py-2 bg-artistic-bg border border-artistic-border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Primary Button Accent Color */}
                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                      {getTranslation(language, 'primaryColor')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeTenant.theme?.primaryColor || '#8a9a86'}
                        onChange={(e) => updateTenantTheme({ primaryColor: e.target.value })}
                        className="w-10 h-10 border border-artistic-border rounded-xl cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeTenant.theme?.primaryColor || '#8a9a86'}
                        onChange={(e) => updateTenantTheme({ primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 bg-artistic-bg border border-artistic-border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* General Text Color */}
                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-2">
                      {getTranslation(language, 'textColor')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={activeTenant.theme?.textColor || '#44403c'}
                        onChange={(e) => updateTenantTheme({ textColor: e.target.value })}
                        className="w-10 h-10 border border-artistic-border rounded-xl cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeTenant.theme?.textColor || '#44403c'}
                        onChange={(e) => updateTenantTheme({ textColor: e.target.value })}
                        className="flex-1 px-4 py-2 bg-artistic-bg border border-artistic-border rounded-xl text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Preview Banner */}
                  <div className="p-4 bg-artistic-cream rounded-2xl space-y-2 border border-artistic-border/40">
                    <h5 className="font-serif italic text-xs font-medium text-artistic-dark">Vista Previa de Paleta</h5>
                    <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-artistic-border/50">
                      <div 
                        className="flex-1 animate-pulse" 
                        style={{ backgroundColor: activeTenant.theme?.bgColor || '#fdfcfb' }} 
                        title="Fondo"
                      />
                      <div 
                        className="flex-1 animate-pulse" 
                        style={{ backgroundColor: activeTenant.theme?.primaryColor || '#8a9a86' }} 
                        title="Botón/Acento"
                      />
                      <div 
                        className="flex-1 animate-pulse" 
                        style={{ backgroundColor: activeTenant.theme?.textColor || '#44403c' }} 
                        title="Texto General"
                      />
                    </div>
                  </div>

                </div>

                {/* Card: Custom Login Background and transparency */}
                <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-xs">
                  <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center gap-2">
                    <Image className="w-4.5 h-4.5 text-artistic-sage" />
                    {language === 'es' ? 'Fondo del Login' : 'Login Background'}
                  </h4>
                  <p className="text-xs text-artistic-muted leading-relaxed">
                    {language === 'es' 
                      ? 'Establece una imagen de fondo a pantalla completa para la pantalla de inicio de sesión.' 
                      : 'Set a full-screen background image for the login authentication screen.'}
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* File Upload Area */}
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-artistic-border rounded-2xl bg-artistic-cream/10 hover:bg-artistic-cream/30 transition-all text-center relative group">
                      {activeTenant.theme?.loginBgUrl ? (
                        <div className="space-y-2 w-full">
                          <img 
                            src={activeTenant.theme.loginBgUrl} 
                            alt="Login bg thumbnail" 
                            className="w-full h-24 object-cover rounded-xl border border-artistic-border shadow-xs transition-opacity duration-200"
                            style={{ opacity: activeTenant.theme?.loginBgOpacity !== undefined ? activeTenant.theme.loginBgOpacity : 0.6 }}
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateTenantTheme({ loginBgUrl: '' });
                              triggerToast(language === 'es' ? '¡Imagen de fondo eliminada!' : 'Background image removed!');
                            }}
                            className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-100 rounded-xl text-[10px] transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            {language === 'es' ? 'Quitar Fondo' : 'Remove Background'}
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer py-4 w-full flex flex-col items-center justify-center">
                          <Upload className="w-6 h-6 text-artistic-sage mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-semibold text-artistic-dark uppercase tracking-wider block">
                            {language === 'es' ? 'Subir de PC / Móvil' : 'Upload from PC / Mobile'}
                          </span>
                          <span className="text-[10px] text-artistic-muted mt-1 block">JPG, PNG, WEBP</span>
                          <input
                            type="file"
                            accept="image/*"
                            id="login_bg_file_uploader"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                comprimirImagen(file, 1400, 0.72).then((base64) => {
                                  if (!base64) return;
                                  updateTenantTheme({ loginBgUrl: base64 });
                                  triggerToast(language === 'es' ? '¡Imagen de fondo cargada!' : 'Background image uploaded!');
                                });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Transparency slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider">
                          {language === 'es' ? 'Nivel de Transparencia' : 'Transparency Level'}
                        </label>
                        <span className="text-xs font-mono font-bold text-artistic-sage">
                          {Math.round((activeTenant.theme?.loginBgOpacity !== undefined ? (1 - activeTenant.theme.loginBgOpacity) : 0.4) * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-artistic-muted">{language === 'es' ? 'Fuerte' : 'Strong'}</span>
                        <input
                          type="range"
                          id="login_bg_opacity_range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={activeTenant.theme?.loginBgOpacity !== undefined ? (1 - activeTenant.theme.loginBgOpacity) : 0.4}
                          onChange={(e) => {
                            const transparency = parseFloat(e.target.value);
                            updateTenantTheme({ loginBgOpacity: 1 - transparency });
                          }}
                          className="flex-1 accent-artistic-sage h-1.5 bg-artistic-border rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-artistic-muted">{language === 'es' ? 'Suave' : 'Soft'}</span>
                      </div>
                      <p className="text-[9px] italic text-artistic-muted leading-relaxed">
                        {language === 'es' 
                          ? 'Tipo control de volumen: deslice hacia la derecha para hacer el fondo más transparente (suave).' 
                          : 'Volume-style control: slide to the right to make the background more transparent (soft).'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Theme Changes Button Card */}
            <div className={`p-6 border rounded-3xl space-y-4 shadow-md ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'} border-t-4 border-t-artistic-sage/75 mt-6`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-serif italic font-medium text-base text-artistic-dark">
                    {language === 'es' ? 'Guardar Cambios del Tema de Página' : 'Save Page Theme Changes'}
                  </h4>
                  <p className="text-xs text-artistic-muted leading-relaxed">
                    {language === 'es'
                      ? 'Guarda la tipografía, colores, logos e imagen de inicio de sesión actual para que se apliquen en toda la plataforma.'
                      : 'Save the current typography, colors, logos, and login background image to apply them across the entire platform.'}
                  </p>
                </div>
                <button
                  type="button"
                  id="save_theme_changes_btn"
                  disabled={isSavingTheme}
                  onClick={handleSaveTheme}
                  className={`min-w-[200px] py-3 px-6 font-semibold rounded-2xl text-xs uppercase tracking-widest cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 ${
                    isSavingTheme 
                      ? 'bg-artistic-sage/50 text-white cursor-not-allowed'
                      : 'bg-artistic-sage hover:bg-artistic-dark text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSavingTheme ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {language === 'es' ? 'Guardando...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 8: Admin Theme Customization */}
        {activeTab === 'adminTheme' && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between border-b pb-6 ${isDark ? 'border-stone-800' : 'border-artistic-border'}`}>
              <div>
                <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">
                  {language === 'es' ? 'Apariencia del Panel' : 'Panel Appearance'}
                </h3>
                <p className="text-xs text-artistic-muted">
                  {language === 'es' 
                    ? 'Configura el estilo visual y el tema cromático exclusivo de tu panel de administración.' 
                    : 'Configure the visual style and exclusive color theme of your administration panel.'}
                </p>
              </div>
            </div>

            <div className="max-w-2xl">
              <div className={`p-6 border rounded-3xl space-y-6 shadow-xs ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'}`}>
                <div className="space-y-1.5">
                  <h4 className="font-serif italic font-medium text-base text-artistic-dark">
                    {language === 'es' ? 'Seleccionar Tema del Administrador' : 'Select Admin Theme'}
                  </h4>
                  <p className="text-xs text-artistic-muted">
                    {language === 'es' 
                      ? 'Cambia instantáneamente la paleta de colores de todo el panel de control privado.' 
                      : 'Change the color palette of the entire private control panel instantly.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Theme 1: Light */}
                  <button
                    onClick={() => {
                      setAdminTheme('light');
                      triggerToast(language === 'es' ? '¡Tema claro aplicado!' : 'Light theme applied!');
                    }}
                    className={`p-5 rounded-2xl border text-left space-y-3 transition-all cursor-pointer relative ${
                      adminTheme === 'light' 
                        ? 'border-artistic-sage ring-2 ring-artistic-sage/20 bg-white text-stone-900 shadow-xs' 
                        : (isDark ? 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400' : 'border-artistic-border hover:bg-artistic-cream/30 bg-white text-artistic-muted')
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {language === 'es' ? 'Claro' : 'Light'}
                      </span>
                      {adminTheme === 'light' && (
                        <span className="w-2 h-2 rounded-full bg-artistic-sage" />
                      )}
                    </div>
                    <div className="h-10 rounded bg-stone-100 border border-stone-200 flex items-center px-2.5">
                      <div className="w-3 h-3 rounded-full bg-stone-400" />
                    </div>
                    <p className="text-[10px] text-artistic-muted">Perfecto para ambientes luminosos.</p>
                  </button>

                  {/* Theme 2: Medium (Artistic Default) */}
                  <button
                    onClick={() => {
                      setAdminTheme('medium');
                      triggerToast(language === 'es' ? '¡Tema medio aplicado!' : 'Medium theme applied!');
                    }}
                    className={`p-5 rounded-2xl border text-left space-y-3 transition-all cursor-pointer relative ${
                      adminTheme === 'medium' 
                        ? 'border-artistic-sage ring-2 ring-artistic-sage/20 bg-[#fdfcfb] text-artistic-dark shadow-xs' 
                        : (isDark ? 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400' : 'border-artistic-border hover:bg-artistic-cream/30 bg-white text-artistic-muted')
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {language === 'es' ? 'Medio' : 'Medium'}
                      </span>
                      {adminTheme === 'medium' && (
                        <span className="w-2 h-2 rounded-full bg-artistic-sage" />
                      )}
                    </div>
                    <div className="h-10 rounded bg-artistic-bg border border-artistic-border flex items-center px-2.5">
                      <div className="w-3 h-3 rounded-full bg-artistic-sage" />
                    </div>
                    <p className="text-[10px] text-artistic-muted">Estilo artesanal y elegante.</p>
                  </button>

                  {/* Theme 3: Dark */}
                  <button
                    onClick={() => {
                      setAdminTheme('dark');
                      triggerToast(language === 'es' ? '¡Tema oscuro aplicado!' : 'Dark theme applied!');
                    }}
                    className={`p-5 rounded-2xl border text-left space-y-3 transition-all cursor-pointer relative ${
                      adminTheme === 'dark' 
                        ? 'border-artistic-sage ring-2 ring-artistic-sage/20 bg-stone-900 text-stone-100 shadow-xs' 
                        : (isDark ? 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400' : 'border-artistic-border hover:bg-artistic-cream/30 bg-white text-artistic-muted')
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {language === 'es' ? 'Oscuro' : 'Dark'}
                      </span>
                      {adminTheme === 'dark' && (
                        <span className="w-2 h-2 rounded-full bg-artistic-sage" />
                      )}
                    </div>
                    <div className="h-10 rounded bg-stone-950 border border-stone-800 flex items-center px-2.5">
                      <div className="w-3 h-3 rounded-full bg-stone-600" />
                    </div>
                    <p className="text-[10px] text-artistic-muted">Suave para trabajar de noche.</p>
                  </button>
                </div>

                {/* Section: Custom Input Text Color */}
                <div className={`border-t pt-6 space-y-4 ${isDark ? 'border-stone-800' : 'border-artistic-border/40'}`}>
                  <div className="space-y-1">
                    <h5 className="font-serif italic font-medium text-sm text-artistic-dark">
                      {language === 'es' ? 'Color de Letra para los Campos' : 'Field Text Color'}
                    </h5>
                    <p className="text-[11px] text-artistic-muted">
                      {language === 'es' 
                        ? 'Personaliza el color del texto dentro de todos los campos de entrada, áreas de texto y menús desplegables del panel para garantizar una visibilidad perfecta.'
                        : 'Customize the text color inside all input fields, textareas, and dropdown menus of the panel to guarantee perfect legibility.'}
                    </p>
                  </div>

                  {/* Preset Colors Grid */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted">
                      {language === 'es' ? 'Paleta de Colores Predefinidos' : 'Preset Colors Menu'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Negro', nameEn: 'Black', value: '#000000' },
                        { name: 'Gris Oscuro', nameEn: 'Dark Gray', value: '#1c1917' },
                        { name: 'Gris Medio', nameEn: 'Medium Gray', value: '#44403c' },
                        { name: 'Blanco', nameEn: 'White', value: '#ffffff' },
                        { name: 'Marrón Tierra', nameEn: 'Earth Brown', value: '#78350f' },
                        { name: 'Verde Oliva', nameEn: 'Olive Green', value: '#14532d' },
                        { name: 'Azul Marino', nameEn: 'Navy Blue', value: '#1e3a8a' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setAdminInputTextColor(item.value);
                            triggerToast(language === 'es' ? `¡Color de campos cambiado a ${item.name}! ` : `Field text color changed to ${item.nameEn}!`);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer ${
                            adminInputTextColor.toLowerCase() === item.value.toLowerCase()
                              ? 'border-artistic-sage bg-artistic-cream text-artistic-dark font-semibold ring-1 ring-artistic-sage/30'
                              : (isDark ? 'border-stone-800 hover:bg-stone-800 text-stone-300 bg-stone-900' : 'border-artistic-border hover:bg-artistic-cream/20 text-artistic-muted bg-white')
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-md border border-stone-300" style={{ backgroundColor: item.value }} />
                          {language === 'es' ? item.name : item.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Selector */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted">
                      {language === 'es' ? 'Color de Campo Personalizado (Hex / Picker)' : 'Custom Field Color (Hex / Picker)'}
                    </label>
                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="relative w-10 h-10 shrink-0 border border-artistic-border rounded-xl overflow-hidden shadow-inner">
                        <input
                          type="color"
                          id="admin_input_text_color_picker"
                          value={adminInputTextColor}
                          onChange={(e) => setAdminInputTextColor(e.target.value)}
                          className="absolute inset-0 w-[200%] h-[200%] -translate-x-[25%] -translate-y-[25%] cursor-pointer bg-transparent border-0 p-0"
                        />
                      </div>
                      <input
                        type="text"
                        id="admin_input_text_color_hex"
                        value={adminInputTextColor}
                        onChange={(e) => setAdminInputTextColor(e.target.value)}
                        className={`flex-1 px-4 py-2 border rounded-xl text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-artistic-sage ${
                          isDark ? 'bg-stone-950 border-stone-800 text-stone-200' : 'bg-artistic-bg border-artistic-border text-artistic-dark'
                        }`}
                        placeholder="#1C1917"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Section: Preview Public Page Card */}
              <div className={`p-6 border rounded-3xl space-y-4 shadow-md ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-artistic-border'} border-t-4 border-t-artistic-sage/75 mt-6`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-artistic-sage/10 text-artistic-sage shrink-0">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-serif italic font-medium text-base text-artistic-dark">
                      {language === 'es' ? 'Vista Previa de la Página Pública' : 'Public Page Preview'}
                    </h4>
                    <p className="text-xs text-artistic-muted leading-relaxed">
                      {language === 'es'
                        ? 'Explora la tienda online en vivo para tus clientes con la configuración actual de logos, tipografía y paleta de colores. Podrás volver aquí con un solo clic.'
                        : 'Explore the live storefront for your clients with the current logos, typography, and color palette. You can return here with a single click.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    id="open_public_preview_btn"
                    onClick={() => {
                      setPreviewPublic(true);
                      triggerToast(language === 'es' ? 'Abriendo vista previa...' : 'Opening preview...');
                    }}
                    className="flex-1 py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-2xl text-xs transition-all uppercase tracking-widest cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Globe className="w-4 h-4" />
                    {language === 'es' ? 'Ver Página Pública' : 'View Public Page'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        <AnimatePresence>
          {viewingQr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
              onClick={() => setViewingQr(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className={`p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl relative ${adminTheme === 'dark' ? 'bg-stone-900 border border-stone-800 text-stone-100' : 'bg-white text-artistic-dark'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setViewingQr(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="space-y-2">
                  <h4 className="font-serif italic font-semibold text-lg text-artistic-dark">
                    {activeTenant.name}
                  </h4>
                  <p className="text-xs text-artistic-muted">
                    {language === 'es' ? 'Escanea con tu celular para acceder' : 'Scan with your mobile to access'}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl inline-block border border-artistic-border/40 shadow-inner">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Salon QR Code" className="w-56 h-56 mx-auto object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-xs text-artistic-muted italic animate-pulse">
                      Generating...
                    </div>
                  )}
                </div>
                <div className="pt-2 text-[10px] text-artistic-muted font-mono break-all select-all selection:bg-artistic-sage/20 selection:text-artistic-sage">
                  {window.location.origin}
                </div>
                <button
                  onClick={handleQrDownload}
                  className="w-full py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {getTranslation(language, 'downloadQr')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
