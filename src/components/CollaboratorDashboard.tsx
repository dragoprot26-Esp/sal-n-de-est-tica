/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/i18n';
import {
  Calendar, Check, User, Image, Settings, Sparkles,
  ShoppingBag, LogOut, Globe, Fingerprint, TrendingUp, Info,
  Plus, Trash2, Pencil, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Service, Product } from '../types';
import { comprimirImagen } from '../img';

export const CollaboratorDashboard: React.FC = () => {
  const {
    language,
    setLanguage,
    currentUser,
    setCurrentUser,
    services,
    setServices,
    products,
    setProducts,
    categories,
    collaborators,
    setCollaborators,
    appointments,
    setAppointments,
    salesHistory,
    setSalesHistory,
    biometricsEnabledUsers,
    toggleBiometricsForUser
  } = useApp();

  // Find active collaborator record
  const currentCollab = collaborators.find(c => c.username === currentUser?.username) || {
    id: currentUser?.id || 'collab-1',
    name: currentUser?.name || 'Colaborador',
    phone: '',
    username: currentUser?.username || 'collab',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    status: 'approved',
    biometricsEnabled: false,
    servicesCompleted: 0,
    revenueGenerated: 0
  };

  // Tabs: dashboard (mi perfil), services, products, appointments (turnos)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'turnos' | 'retiros' | 'services' | 'products'>('dashboard');

  // Profile editing
  const [avatarInput, setAvatarInput] = useState(currentCollab.avatarUrl);
  const [phoneInput, setPhoneInput] = useState(currentCollab.phone);
  const [nameInput, setNameInput] = useState(currentCollab.name);

  // Status Toast
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Complete an appointment
  const handleCompleteAppointment = (apptId: string) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;

    // Mark appointment as completed
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'completed' } : a));

    // Find the service name
    const service = services.find(s => s.id === appt.serviceId);
    const serviceNameEs = service ? service.nameEs : 'Servicio Especial';
    const serviceNameEn = service ? service.nameEn : 'Special Service';
    const price = appt.price;

    // Register sale record in global sales history
    const id = `sale-${Date.now()}`;
    const newSale = {
      id,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      itemType: 'service' as const,
      itemNameEs: serviceNameEs,
      itemNameEn: serviceNameEn,
      price,
      completedBy: currentCollab.name
    };

    setSalesHistory(prev => [newSale, ...prev]);

    // Update collaborator statistics
    setCollaborators(prev => prev.map(c => {
      if (c.id === currentCollab.id) {
        return {
          ...c,
          servicesCompleted: (c.servicesCompleted ?? 0) + 1,
          revenueGenerated: (c.revenueGenerated ?? 0) + price
        };
      }
      return c;
    }));

    triggerToast(language === 'es' ? '¡Turno concretado con éxito!' : 'Appointment completed successfully!');
  };

  // Save personal collaborator settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCollaborators(prev => prev.map(c => {
      if (c.id === currentCollab.id) {
        return {
          ...c,
          name: nameInput,
          phone: phoneInput,
          avatarUrl: avatarInput
        };
      }
      return c;
    }));

    // Update session user name too
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        name: nameInput
      });
    }

    triggerToast(language === 'es' ? 'Ajustes guardados correctamente!' : 'Settings saved successfully!');
  };

  // Toggle biometrics for fast log in
  const isBiometricActive = biometricsEnabledUsers.includes(currentCollab.username);
  
  const handleToggleBiometrics = () => {
    const nextState = !isBiometricActive;
    toggleBiometricsForUser(currentCollab.username, nextState);
    triggerToast(nextState 
      ? (language === 'es' ? 'Biometría activada en este navegador.' : 'Biometrics enabled on this browser.')
      : (language === 'es' ? 'Biometría desactivada.' : 'Biometrics disabled.')
    );
  };

  // Filter appointments specifically assigned to this collaborator
  const myAppointments = appointments.filter(a => a.collaboratorId === currentCollab.id);

  // Pedidos de retiro (canasto de productos). No se asignan a un profesional,
  // así que los ve TODO el equipo para prepararlos y entregarlos.
  const retiros = appointments.filter(a => (a as any).tipo === 'retiro');
  const retirosPendientes = retiros.filter(a => a.status === 'pending').length;

  const marcarRetiroEntregado = (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    triggerToast(language === 'es' ? '✅ Pedido entregado' : '✅ Delivered');
  };

  // ── Gestión de SERVICIOS (alta / edición / borrado) ────────────────
  const emptyService = { nameEs: '', nameEn: '', descEs: '', price: 0, duration: 60, category: (categories && categories[0]) || 'FACIAL', imageUrl: '' };
  const [svcForm, setSvcForm] = useState(emptyService);
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcForm.nameEs.trim() || svcForm.price <= 0) {
      triggerToast(language === 'es' ? 'Poné nombre y precio del servicio.' : 'Add a name and price.');
      return;
    }
    const img = svcForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=400';
    if (editingSvcId) {
      setServices((prev: Service[]) => prev.map(s => s.id === editingSvcId ? {
        ...s, nameEs: svcForm.nameEs, nameEn: svcForm.nameEn || svcForm.nameEs,
        descriptionEs: svcForm.descEs, descriptionEn: svcForm.descEs,
        price: svcForm.price, durationMinutes: svcForm.duration, category: svcForm.category, imageUrl: img
      } : s));
      triggerToast(language === 'es' ? 'Servicio actualizado.' : 'Service updated.');
    } else {
      const nuevo: Service = {
        id: `service-${Date.now()}`, nameEs: svcForm.nameEs, nameEn: svcForm.nameEn || svcForm.nameEs,
        descriptionEs: svcForm.descEs, descriptionEn: svcForm.descEs,
        price: svcForm.price, durationMinutes: svcForm.duration, category: svcForm.category, imageUrl: img
      };
      setServices((prev: Service[]) => [nuevo, ...prev]);
      triggerToast(language === 'es' ? '¡Servicio agregado!' : 'Service added!');
    }
    setSvcForm(emptyService);
    setEditingSvcId(null);
  };

  const handleEditService = (s: Service) => {
    setEditingSvcId(s.id);
    setSvcForm({ nameEs: s.nameEs, nameEn: s.nameEn, descEs: s.descriptionEs, price: s.price, duration: s.durationMinutes, category: s.category, imageUrl: s.imageUrl });
    setActiveTab('services');
  };

  const handleDeleteService = (id: string) => {
    setServices((prev: Service[]) => prev.filter(s => s.id !== id));
    if (editingSvcId === id) { setEditingSvcId(null); setSvcForm(emptyService); }
    triggerToast(language === 'es' ? 'Servicio eliminado.' : 'Service deleted.');
  };

  // ── Gestión de PRODUCTOS (alta / edición / borrado) ────────────────
  const emptyProduct = { nameEs: '', nameEn: '', descEs: '', price: 0, stock: 0, imageUrl: '' };
  const [prodForm, setProdForm] = useState(emptyProduct);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.nameEs.trim() || prodForm.price <= 0) {
      triggerToast(language === 'es' ? 'Poné nombre y precio del producto.' : 'Add a name and price.');
      return;
    }
    const img = prodForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=400';
    if (editingProdId) {
      setProducts((prev: Product[]) => prev.map(p => p.id === editingProdId ? {
        ...p, nameEs: prodForm.nameEs, nameEn: prodForm.nameEn || prodForm.nameEs,
        descriptionEs: prodForm.descEs, descriptionEn: prodForm.descEs,
        price: prodForm.price, stock: prodForm.stock, imageUrl: img
      } : p));
      triggerToast(language === 'es' ? 'Producto actualizado.' : 'Product updated.');
    } else {
      const nuevo: Product = {
        id: `product-${Date.now()}`, nameEs: prodForm.nameEs, nameEn: prodForm.nameEn || prodForm.nameEs,
        descriptionEs: prodForm.descEs, descriptionEn: prodForm.descEs,
        price: prodForm.price, stock: prodForm.stock, imageUrl: img
      };
      setProducts((prev: Product[]) => [nuevo, ...prev]);
      triggerToast(language === 'es' ? '¡Producto agregado!' : 'Product added!');
    }
    setProdForm(emptyProduct);
    setEditingProdId(null);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProdId(p.id);
    setProdForm({ nameEs: p.nameEs, nameEn: p.nameEn, descEs: p.descriptionEs, price: p.price, stock: p.stock, imageUrl: p.imageUrl });
    setActiveTab('products');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev: Product[]) => prev.filter(p => p.id !== id));
    if (editingProdId === id) { setEditingProdId(null); setProdForm(emptyProduct); }
    triggerToast(language === 'es' ? 'Producto eliminado.' : 'Product deleted.');
  };

  const inputCls = 'w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage';

  return (
    <div className="min-h-screen bg-artistic-bg text-artistic-dark flex flex-col md:flex-row font-sans selection:bg-artistic-sage/20 selection:text-artistic-sage">
      
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-artistic-sage text-white text-xs font-semibold tracking-wider shadow-lg flex items-center gap-2 border border-artistic-border"
          >
            <Check className="w-3.5 h-3.5" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaborator Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-artistic-border flex flex-col justify-between p-5 space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-artistic-border pb-5">
            <img 
              src={currentCollab.avatarUrl} 
              alt={currentCollab.name} 
              className="w-10 h-10 rounded-full object-cover border border-artistic-border shadow-sm"
            />
            <div>
              <h4 className="font-serif font-medium tracking-tight text-artistic-dark line-clamp-1">{currentCollab.name}</h4>
              <p className="text-[9px] text-artistic-sage uppercase font-bold tracking-wider">{getTranslation(language, 'collaboratorPanel')}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              id="collab_tab_dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'dashboard' ? 'bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage font-semibold' : 'text-artistic-muted hover:bg-artistic-cream/70 hover:text-artistic-dark'
              }`}
            >
              <User className="w-4 h-4" />
              {language === 'es' ? 'Mi Perfil' : 'My Profile'}
            </button>
            <button
              id="collab_tab_turnos"
              onClick={() => setActiveTab('turnos')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'turnos' ? 'bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage font-semibold' : 'text-artistic-muted hover:bg-artistic-cream/70 hover:text-artistic-dark'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {language === 'es' ? 'Mis Turnos' : 'My Bookings'}
              {myAppointments.filter(a => a.status === 'pending').length > 0 && (
                <span className="ml-auto bg-artistic-sage text-white font-semibold px-2 py-0.5 rounded-full text-[9px]">
                  {myAppointments.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              id="collab_tab_retiros"
              onClick={() => setActiveTab('retiros')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'retiros' ? 'bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage font-semibold' : 'text-artistic-muted hover:bg-artistic-cream/70 hover:text-artistic-dark'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {language === 'es' ? 'Retiros' : 'Pickups'}
              {retirosPendientes > 0 && (
                <span className="ml-auto bg-artistic-sage text-white font-semibold px-2 py-0.5 rounded-full text-[9px]">
                  {retirosPendientes}
                </span>
              )}
            </button>
            <button
              id="collab_tab_services"
              onClick={() => setActiveTab('services')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'services' ? 'bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage font-semibold' : 'text-artistic-muted hover:bg-artistic-cream/70 hover:text-artistic-dark'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {getTranslation(language, 'services')}
            </button>
            <button
              id="collab_tab_products"
              onClick={() => setActiveTab('products')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'products' ? 'bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage font-semibold' : 'text-artistic-muted hover:bg-artistic-cream/70 hover:text-artistic-dark'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {getTranslation(language, 'products')}
            </button>
          </nav>
        </div>

        {/* Global actions */}
        <div className="space-y-4 pt-5 border-t border-artistic-border">
          <div className="flex items-center justify-between text-xs text-artistic-muted">
            <span>{getTranslation(language, 'language')}</span>
            <button 
              id="collab_lang_toggle"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="px-2.5 py-1 bg-artistic-cream hover:bg-artistic-border rounded-lg text-[10px] font-bold text-artistic-dark transition-all uppercase"
            >
              {language}
            </button>
          </div>

          <button
            id="collab_logout_btn"
            onClick={() => setCurrentUser(null)}
            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-full text-xs transition-all flex items-center justify-center gap-2 border border-red-100 uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            {getTranslation(language, 'logout')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 space-y-8 max-w-7xl mx-auto overflow-x-hidden">
        
        {/* Tab 1: Profile & Metrics & Settings */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'welcome')}, {currentCollab.name}</h3>
              <p className="text-xs text-artistic-muted mt-1">{getTranslation(language, 'collabSubtitle')}</p>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-artistic-sage" />
                  {getTranslation(language, 'myServicesCompleted')}
                </span>
                <p className="text-3xl font-serif font-medium text-artistic-dark">{currentCollab.servicesCompleted ?? 0}</p>
                <span className="text-[10px] text-artistic-muted block italic">Tratamientos finalizados con éxito</span>
              </div>

              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-1.5 shadow-xs hover:shadow-sm transition-all">
                <span className="text-[10px] font-bold text-artistic-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-artistic-sage" />
                  {getTranslation(language, 'myRevenue')}
                </span>
                <p className="text-3xl font-serif font-medium text-artistic-sage">${(currentCollab.revenueGenerated ?? 0).toLocaleString()}</p>
                <span className="text-[10px] text-artistic-muted block italic">Comisión y valor total de tratamientos</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Profile Config Form */}
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-sm">
                <h4 className="font-serif italic font-medium text-artistic-dark text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-artistic-sage" />
                  {getTranslation(language, 'collabSettings')}
                </h4>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">{getTranslation(language, 'collaboratorName')}</label>
                    <input
                      type="text"
                      required
                      id="collab_name_input"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">{getTranslation(language, 'collaboratorPhone')}</label>
                    <input
                      type="text"
                      required
                      id="collab_phone_input"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5 flex items-center gap-1">
                      <Image className="w-3.5 h-3.5 text-artistic-sage" />
                      {getTranslation(language, 'logoSettings')}
                    </label>

                    {/* Subir foto desde la PC o el celular */}
                    <div className="flex items-center gap-3 mb-2.5">
                      <img
                        src={avatarInput || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'}
                        alt="Mi foto"
                        className="w-14 h-14 rounded-full object-cover border border-artistic-border shadow-sm bg-artistic-cream shrink-0"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="collab_avatar_file"
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          comprimirImagen(file, 400, 0.75).then((base64) => {
                            setAvatarInput(base64);
                            triggerToast(language === 'es' ? 'Foto cargada. Tocá Guardar.' : 'Photo loaded. Press Save.');
                          });
                        }}
                        className="text-[11px] text-artistic-muted file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-artistic-sage file:text-white file:text-[10px] file:font-semibold file:uppercase file:tracking-wider file:cursor-pointer cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-artistic-muted mb-2 italic">
                      {language === 'es'
                        ? 'Elegí una foto de tu galería o sacala con la cámara. También podés pegar un enlace abajo.'
                        : 'Pick a photo from your gallery or camera. You can also paste a link below.'}
                    </p>
                    <input
                      type="text"
                      id="collab_avatar_input"
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                      placeholder="https://... (opcional)"
                      className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage"
                    />
                  </div>

                  <button
                    type="submit"
                    id="collab_save_settings_btn"
                    className="w-full py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs transition-colors uppercase tracking-widest"
                  >
                    {getTranslation(language, 'save')}
                  </button>
                </form>
              </div>

              {/* Fast Biometric Configuration */}
              <div className="p-6 bg-white border border-artistic-border rounded-3xl space-y-4 shadow-sm">
                <h4 className="font-serif italic font-medium text-artistic-dark text-sm flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-artistic-sage" />
                  {getTranslation(language, 'biometricsStatus')}
                </h4>
                <p className="text-xs text-artistic-muted leading-relaxed">
                  Configura el acceso rápido con huella o datos biométricos simulados. Podrás ingresar con un solo toque desde este mismo navegador web.
                </p>

                <div className="p-4 bg-artistic-cream/60 border border-artistic-border rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-artistic-muted block uppercase font-bold tracking-wider">ESTADO ACTUAL</span>
                    <span className={`text-xs font-semibold ${isBiometricActive ? 'text-artistic-sage font-semibold' : 'text-artistic-muted'}`}>
                      {isBiometricActive 
                        ? getTranslation(language, 'biometricsStatusActive') 
                        : getTranslation(language, 'biometricsStatusInactive')}
                    </span>
                  </div>

                  <button
                    id="collab_biometric_toggle_action"
                    onClick={handleToggleBiometrics}
                    className={`p-3 rounded-full border transition-all ${
                      isBiometricActive 
                        ? 'bg-artistic-sage text-white border-artistic-sage' 
                        : 'bg-white border-artistic-border text-artistic-muted hover:text-artistic-dark'
                    }`}
                  >
                    <Fingerprint className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-1.5 text-[10px] text-artistic-muted">
                  <Info className="w-3.5 h-3.5 text-artistic-sage shrink-0" />
                  <span>Para ingresar rápido la próxima vez, activa esta opción.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Turnos (My assigned appointments) */}
        {activeTab === 'turnos' && (
          <div className="space-y-6">
            <div className="border-b border-artistic-border pb-6">
              <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{language === 'es' ? 'Mis Turnos Asignados' : 'My Assigned Bookings'}</h3>
              <p className="text-xs text-artistic-muted mt-1">Revisa y concreta las citas de tus clientes asignadas a tu agenda.</p>
            </div>

            <div className="space-y-4">
              {myAppointments.length === 0 ? (
                <div className="p-8 bg-white border border-artistic-border rounded-3xl text-center text-artistic-muted italic shadow-xs">
                  {language === 'es' ? 'No tienes turnos agendados en tu cuenta.' : 'No scheduled bookings in your account.'}
                </div>
              ) : (
                myAppointments.map(appt => {
                  const service = services.find(s => s.id === appt.serviceId);
                  const serviceName = service ? (language === 'es' ? service.nameEs : service.nameEn) : 'Tratamiento';
                  
                  return (
                    <div key={appt.id} className="p-6 bg-white border border-artistic-border rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${
                            appt.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-artistic-sage/10 text-artistic-sage border-artistic-sage/20'
                          }`}>
                            {appt.status}
                          </span>
                          <span className="text-xs font-serif font-medium text-artistic-dark">{appt.date} • {appt.time} hs</span>
                        </div>

                        <h4 className="font-serif italic font-medium text-artistic-dark text-lg">{serviceName}</h4>
                        <div className="text-[11px] text-artistic-muted space-y-0.5">
                          <p>Cliente: <span className="text-artistic-dark font-medium">{appt.clientName}</span></p>
                          <p>Contacto: <span className="text-artistic-dark font-medium">{appt.clientPhone}</span></p>
                          <p>Monto: <span className="text-artistic-sage font-semibold font-mono">${appt.price.toLocaleString()}</span></p>
                        </div>
                      </div>

                      {appt.status === 'pending' && (
                        <button
                          id={`complete_appt_action_${appt.id}`}
                          onClick={() => handleCompleteAppointment(appt.id)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-xs transition-colors flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Concretar Turno
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab: Retiros (pedidos de productos del canasto, compartidos con el equipo) */}
        {activeTab === 'retiros' && (
          <div className="space-y-6">
            <div className="border-b border-artistic-border pb-6">
              <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{language === 'es' ? 'Pedidos para Retirar' : 'Pickup Orders'}</h3>
              <p className="text-xs text-artistic-muted mt-1">{language === 'es' ? 'Productos que las clientas encargaron para pasar a buscar. Preparalos y marcá "Entregado".' : 'Products clients ordered for pickup. Prepare them and mark "Delivered".'}</p>
            </div>

            <div className="space-y-4">
              {retiros.length === 0 ? (
                <div className="p-8 bg-white border border-artistic-border rounded-3xl text-center text-artistic-muted italic shadow-xs">
                  {language === 'es' ? 'No hay pedidos de retiro por ahora.' : 'No pickup orders yet.'}
                </div>
              ) : (
                retiros.map(appt => {
                  const items = (appt as any).items || [];
                  return (
                    <div key={appt.id} className="p-6 bg-white border border-artistic-border rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${
                            appt.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-artistic-sage/10 text-artistic-sage border-artistic-sage/20'
                          }`}>
                            {appt.status === 'completed' ? (language === 'es' ? 'Entregado' : 'Delivered') : (language === 'es' ? 'Pendiente' : 'Pending')}
                          </span>
                          <span className="text-xs font-serif font-medium text-artistic-dark">{appt.clientName}</span>
                        </div>

                        <div className="bg-artistic-cream/50 border border-artistic-border rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-artistic-sage mb-1">🧺 {language === 'es' ? 'Pedido' : 'Order'}</p>
                          {items.length === 0 ? (
                            <p className="text-xs text-artistic-muted italic">{language === 'es' ? '(sin detalle de productos)' : '(no product detail)'}</p>
                          ) : items.map((it: any) => (
                            <p key={it.productId} className="text-xs text-artistic-dark">
                              {it.qty}× {language === 'es' ? it.nameEs : it.nameEn}
                              <span className="text-artistic-muted"> — ${(it.price * it.qty).toLocaleString('es-AR')}</span>
                            </p>
                          ))}
                        </div>

                        <div className="text-[11px] text-artistic-muted space-y-0.5">
                          {(appt.date || appt.time) && <p>📅 {appt.date} {appt.time && `· 🕒 ${appt.time} hs`}</p>}
                          <p>Total: <span className="text-artistic-sage font-semibold font-mono">${(appt.price || 0).toLocaleString('es-AR')}</span></p>
                        </div>

                        {appt.clientPhone && (
                          <a
                            href={`https://wa.me/${String(appt.clientPhone).replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            📱 {appt.clientPhone}
                          </a>
                        )}
                      </div>

                      {appt.status !== 'completed' && (
                        <button
                          id={`deliver_pickup_${appt.id}`}
                          onClick={() => marcarRetiroEntregado(appt.id)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-xs transition-colors flex items-center gap-1.5 uppercase tracking-wider shrink-0"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          {language === 'es' ? 'Entregado' : 'Delivered'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Catalog Browse (Services) */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="border-b border-artistic-border pb-6">
              <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'services')}</h3>
              <p className="text-xs text-artistic-muted mt-1">Agregá, editá o quitá servicios del salón. Los cambios se sincronizan con el resto.</p>
            </div>

            {/* Alta / edición de servicio */}
            <form onSubmit={handleSaveService} className="p-6 bg-white border border-artistic-border rounded-3xl shadow-sm space-y-4">
              <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-artistic-sage" />{editingSvcId ? 'Editar servicio' : 'Agregar servicio'}</span>
                {editingSvcId && (
                  <button type="button" onClick={() => { setEditingSvcId(null); setSvcForm(emptyService); }} className="text-[11px] text-red-500 hover:underline flex items-center gap-1"><X className="w-3.5 h-3.5" />Cancelar</button>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre</label>
                  <input type="text" value={svcForm.nameEs} onChange={e => setSvcForm({ ...svcForm, nameEs: e.target.value })} placeholder="Ej: Limpieza facial" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Precio ($)</label>
                  <input type="number" value={svcForm.price || ''} onChange={e => setSvcForm({ ...svcForm, price: Number(e.target.value) })} placeholder="32000" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción</label>
                  <input type="text" value={svcForm.descEs} onChange={e => setSvcForm({ ...svcForm, descEs: e.target.value })} placeholder="Breve descripción para la clienta" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Duración</label>
                  <select value={svcForm.duration} onChange={e => setSvcForm({ ...svcForm, duration: Number(e.target.value) })} className={inputCls}>
                    {[30, 45, 60, 75, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Categoría</label>
                  <input type="text" list="cat_list" value={svcForm.category} onChange={e => setSvcForm({ ...svcForm, category: e.target.value.toUpperCase() })} placeholder="FACIAL" className={inputCls} />
                  <datalist id="cat_list">{(categories || []).map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Imagen (URL, opcional)</label>
                  <input type="url" value={svcForm.imageUrl} onChange={e => setSvcForm({ ...svcForm, imageUrl: e.target.value })} placeholder="https://..." className={inputCls} />
                </div>
              </div>
              <button type="submit" className="px-6 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />{editingSvcId ? 'Guardar cambios' : 'Agregar servicio'}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map(service => (
                <div key={service.id} className="p-5 bg-white border border-artistic-border rounded-3xl flex items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all">
                  <div>
                    <span className="text-[9px] bg-artistic-sage/10 text-artistic-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-artistic-sage/20">
                      {service.category}
                    </span>
                    <h5 className="font-serif italic font-medium text-artistic-dark text-sm mt-1.5">{language === 'es' ? service.nameEs : service.nameEn}</h5>
                    <p className="text-[10px] text-artistic-muted">{service.durationMinutes} minutos</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="font-semibold font-mono text-artistic-sage text-sm">${service.price.toLocaleString()}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleEditService(service)} title="Editar" className="p-1.5 bg-artistic-cream hover:bg-artistic-border rounded-lg text-artistic-dark transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteService(service.id)} title="Eliminar" className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Catalog Browse (Products) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="border-b border-artistic-border pb-6">
              <h3 className="text-2xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'products')}</h3>
              <p className="text-xs text-artistic-muted mt-1">Agregá, editá o quitá productos y su stock. Los cambios se sincronizan con el resto.</p>
            </div>

            {/* Alta / edición de producto */}
            <form onSubmit={handleSaveProduct} className="p-6 bg-white border border-artistic-border rounded-3xl shadow-sm space-y-4">
              <h4 className="font-serif italic font-medium text-artistic-dark text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-artistic-sage" />{editingProdId ? 'Editar producto' : 'Agregar producto'}</span>
                {editingProdId && (
                  <button type="button" onClick={() => { setEditingProdId(null); setProdForm(emptyProduct); }} className="text-[11px] text-red-500 hover:underline flex items-center gap-1"><X className="w-3.5 h-3.5" />Cancelar</button>
                )}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Nombre</label>
                  <input type="text" value={prodForm.nameEs} onChange={e => setProdForm({ ...prodForm, nameEs: e.target.value })} placeholder="Ej: Sérum Vitamina C" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Precio ($)</label>
                  <input type="number" value={prodForm.price || ''} onChange={e => setProdForm({ ...prodForm, price: Number(e.target.value) })} placeholder="18500" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Descripción</label>
                  <input type="text" value={prodForm.descEs} onChange={e => setProdForm({ ...prodForm, descEs: e.target.value })} placeholder="Breve descripción del producto" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Stock (unidades)</label>
                  <input type="number" value={prodForm.stock || ''} onChange={e => setProdForm({ ...prodForm, stock: Number(e.target.value) })} placeholder="12" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-artistic-muted uppercase font-semibold tracking-wider mb-1.5">Imagen (URL, opcional)</label>
                  <input type="url" value={prodForm.imageUrl} onChange={e => setProdForm({ ...prodForm, imageUrl: e.target.value })} placeholder="https://..." className={inputCls} />
                </div>
              </div>
              <button type="submit" className="px-6 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs uppercase tracking-widest transition-colors flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />{editingProdId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className="p-5 bg-white border border-artistic-border rounded-3xl space-y-3 shadow-xs hover:shadow-sm transition-all">
                  <h5 className="font-serif italic font-medium text-artistic-dark text-sm">{language === 'es' ? product.nameEs : product.nameEn}</h5>
                  <p className="text-artistic-muted text-[11px] line-clamp-2">{language === 'es' ? product.descriptionEs : product.descriptionEn}</p>
                  <div className="pt-2.5 border-t border-artistic-border flex items-center justify-between text-xs">
                    <span className="text-artistic-muted">Stock: {product.stock} un.</span>
                    <span className="font-semibold font-mono text-artistic-sage">${product.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button onClick={() => handleEditProduct(product)} title="Editar" className="p-1.5 bg-artistic-cream hover:bg-artistic-border rounded-lg text-artistic-dark transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteProduct(product.id)} title="Eliminar" className="p-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-red-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
