/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/i18n';
import { Product } from '../types';
import {
  Calendar, Clock, Sparkles, ShoppingBag, MessageSquare,
  Share2, MapPin, Star, ChevronRight, User, Phone, Globe, Check, X, Copy, Plus, Minus, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicPageProps {
  onOpenLogin: () => void;
}

export const PublicPage: React.FC<PublicPageProps> = ({ onOpenLogin }) => {
  const {
    language,
    setLanguage,
    activeTenant,
    setActiveTenant,
    tenants,
    services,
    products,
    collaborators,
    publicCollabs,
    addAppointment,
    comments,
    addComment,
    phonePrefix,
    categories
  } = useApp();

  // Profesionales para elegir en la reserva: los que manda la página pública.
  // Si el dueño está viendo su propia página (todavía sin datos públicos),
  // usamos los del panel para que igual pueda probar.
  const profesionales = (publicCollabs && publicCollabs.length) ? publicCollabs : collaborators;

  // Booking states
  const [selectedService, setSelectedService] = useState('');
  const [selectedCollab, setSelectedCollab] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Canasto de productos + turno de retiro
  const [canasto, setCanasto] = useState<{ productId: string; nameEs: string; nameEn: string; price: number; qty: number }[]>([]);
  const [isCanastoOpen, setIsCanastoOpen] = useState(false);
  const [retiroFecha, setRetiroFecha] = useState('');
  const [retiroHora, setRetiroHora] = useState('');

  // Review states
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Status banners / toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedCollab || !bookingDate || !bookingTime || !clientName || !clientPhone) {
      showToast(getTranslation(language, 'requiredFields'), 'error');
      return;
    }

    if (clientPhone.length < 6) {
      showToast(getTranslation(language, 'invalidPhone'), 'error');
      return;
    }

    // Capture booking
    addAppointment({
      tenantId: activeTenant.id,
      serviceId: selectedService,
      collaboratorId: selectedCollab,
      date: bookingDate,
      time: bookingTime,
      clientName,
      clientPhone: `${phonePrefix} ${clientPhone}`,
      price: services.find(s => s.id === selectedService)?.price || 0
    });

    showToast(getTranslation(language, 'bookingSuccess'), 'success');
    setIsBookingModalOpen(false);

    // Reset booking state
    setSelectedService('');
    setSelectedCollab('');
    setBookingDate('');
    setBookingTime('');
    setClientName('');
    setClientPhone('');
  };

  // ── CANASTO DE PRODUCTOS (pedido con turno de retiro) ───────────────
  const agregarAlCanasto = (product: Product) => {
    setCanasto(prev => {
      const existe = prev.find(i => i.productId === product.id);
      if (existe) return prev.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        productId: product.id,
        nameEs: product.nameEs,
        nameEn: product.nameEn,
        price: product.price,
        qty: 1
      }];
    });
    showToast(language === 'es' ? '🧺 Agregado al canasto' : '🧺 Added to basket', 'success');
  };

  const cambiarCantidad = (productId: string, delta: number) => {
    setCanasto(prev => prev
      .map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  };

  const totalCanasto = canasto.reduce((acc, i) => acc + i.price * i.qty, 0);
  const unidadesCanasto = canasto.reduce((acc, i) => acc + i.qty, 0);

  const handleConfirmarRetiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canasto.length) return;
    if (!retiroFecha || !retiroHora || !clientName || !clientPhone) {
      showToast(getTranslation(language, 'requiredFields'), 'error');
      return;
    }
    if (clientPhone.length < 6) {
      showToast(getTranslation(language, 'invalidPhone'), 'error');
      return;
    }

    // El pedido se guarda como un turno de RETIRO (va a la nube y al panel).
    addAppointment({
      tenantId: activeTenant.id,
      serviceId: '',
      collaboratorId: '',
      date: retiroFecha,
      time: retiroHora,
      clientName,
      clientPhone: `${phonePrefix} ${clientPhone}`,
      price: totalCanasto,
      tipo: 'retiro',
      items: canasto
    } as any);

    showToast(
      language === 'es'
        ? '✅ ¡Pedido confirmado! Te esperamos para el retiro.'
        : '✅ Order confirmed! See you at pickup time.',
      'success'
    );
    setCanasto([]);
    setIsCanastoOpen(false);
    setRetiroFecha('');
    setRetiroHora('');
    setClientName('');
    setClientPhone('');
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewText) {
      showToast(getTranslation(language, 'requiredFields'), 'error');
      return;
    }

    addComment({
      tenantId: activeTenant.id,
      clientName: reviewName,
      text: reviewText,
      rating: reviewRating
    });

    showToast(getTranslation(language, 'commentSuccess'), 'success');
    setReviewName('');
    setReviewText('');
    setReviewRating(5);
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    showToast(getTranslation(language, 'copiedUrl'), 'success');
  };

  // Filter services
  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  // Approved comments only
  const approvedComments = comments.filter(c => c.tenantId === activeTenant.id && c.approved);

  const theme = activeTenant.theme || {};
  const logoUrl = theme.logoUrl || '';
  const headerFontFamily = theme.headerFontFamily || 'serif';
  const headerFontSize = theme.headerFontSize || 'text-5xl';
  const headerColor = theme.headerColor || '#1c1917';
  const subtitleFontSize = theme.subtitleFontSize || 'text-xs';
  const subtitleColor = theme.subtitleColor || '#78716c';
  const bgColor = theme.bgColor || '#fdfcfb';
  const primaryColor = theme.primaryColor || '#8a9a86';
  const textColor = theme.textColor || '#44403c';

  const fontMap: Record<string, string> = {
    serif: '"Playfair Display", "Georgia", serif',
    sans: '"Plus Jakarta Sans", "Inter", sans-serif',
    'space-grotesk': '"Space Grotesk", sans-serif',
    mono: '"JetBrains Mono", monospace'
  };

  const titleSizeMap: Record<string, string> = {
    'text-2xl': '1.5rem',
    'text-3xl': '1.875rem',
    'text-4xl': '2.25rem',
    'text-5xl': '3rem',
    'text-6xl': '3.75rem',
    'text-7xl': '4.5rem'
  };

  const subtitleSizeMap: Record<string, string> = {
    'text-[10px]': '10px',
    'text-xs': '12px',
    'text-sm': '14px',
    'text-base': '16px'
  };

  return (
    <div 
      className="min-h-screen font-sans antialiased selection:bg-artistic-sage/20 selection:text-artistic-sage transition-colors duration-300 relative z-0 overflow-hidden"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        '--color-artistic-bg': bgColor,
        '--color-artistic-dark': textColor,
        '--color-artistic-sage': primaryColor,
        '--color-artistic-muted': subtitleColor,
      } as React.CSSProperties}
    >
      {/* Background Image Layer */}
      {theme.loginBgUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-300 bg-no-repeat"
          style={{ 
            backgroundImage: `url(${theme.loginBgUrl})`,
            opacity: theme.loginBgOpacity !== undefined ? theme.loginBgOpacity : 0.6,
            zIndex: 0
          }}
        />
      )}

      {/* Content wrapper to ensure it stands above the background */}
      <div className="relative z-10">
        {/* Dynamic Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl border text-sm font-medium flex items-center gap-2 ${
              toastType === 'success' 
                ? 'bg-white border-artistic-sage text-artistic-sage shadow-md' 
                : 'bg-red-50 border-red-200 text-red-800 shadow-md'
            }`}
          >
            <Check className="w-4 h-4 text-artistic-sage" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern High-End Nav Bar */}
      <header className="sticky top-0 z-40 bg-artistic-bg/90 backdrop-blur-md border-b border-artistic-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoUrl || activeTenant.logo} 
              alt={activeTenant.name} 
              className="w-10 h-10 rounded-full object-cover border border-artistic-border shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-serif italic font-medium tracking-tight text-xl text-artistic-dark">{activeTenant.name}</h1>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-artistic-muted">
                <Star className="w-3 h-3 fill-artistic-sage stroke-artistic-sage" />
                <span>{activeTenant.rating}</span>
                <span className="mx-1">•</span>
                <span>{activeTenant.id.replace('-', ' ')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* El selector de salón se movió al Panel Admin → Tema de Página
                (el cliente no debe poder cambiar de local desde la vidriera). */}

            {/* Language Switcher */}
            <button
              id="language_toggle_btn"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="p-2 bg-white hover:bg-artistic-cream border border-artistic-border rounded-full text-xs font-medium text-artistic-dark transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-artistic-sage" />
              <span className="uppercase tracking-wider">{language}</span>
            </button>

            {/* Admin Panel Link */}
            <button
              id="login_trigger_nav"
              onClick={onOpenLogin}
              className="px-4 py-1.5 bg-artistic-dark hover:bg-artistic-sage text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            >
              {getTranslation(language, 'adminPanel')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 bg-gradient-to-b from-artistic-cream/60 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Centered Brand Emblem / Logo from Local or Default */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <img 
              src={logoUrl || activeTenant.logo} 
              alt={activeTenant.name} 
              className="w-24 h-24 rounded-full object-cover border border-artistic-border/80 shadow-md p-1 bg-white hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-artistic-sage/10 border border-artistic-sage/20 rounded-full text-xs font-medium uppercase tracking-widest text-artistic-sage"
          >
            <Sparkles className="w-3.5 h-3.5 text-artistic-sage" />
            {language === 'es' ? 'Experiencia de Lujo & Belleza' : 'Luxury & Beauty Experience'}
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-light italic leading-tight tracking-tight"
            style={{
              fontFamily: fontMap[headerFontFamily],
              fontSize: titleSizeMap[headerFontSize],
              color: headerColor
            }}
          >
            {activeTenant.name}
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto font-light leading-relaxed"
            style={{
              fontSize: subtitleSizeMap[subtitleFontSize],
              color: subtitleColor
            }}
          >
            {activeTenant.tagline}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-6"
          >
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-8 py-3.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full shadow-lg hover:shadow-xl uppercase tracking-widest text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              {getTranslation(language, 'bookTurn')}
            </button>
            <button
              id="share_button_hero"
              onClick={() => setIsShareModalOpen(true)}
              className="p-3.5 bg-white hover:bg-artistic-cream border border-artistic-border rounded-full transition-all shadow-sm hover:shadow-md flex items-center justify-center cursor-pointer"
              title={getTranslation(language, 'share')}
            >
              <Share2 className="w-4 h-4 text-artistic-sage" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 py-16" id="services_catalog_sec">
        <div className="text-center space-y-3 mb-12">
          <h3 className="text-3xl sm:text-4xl font-light italic font-serif text-artistic-dark">{getTranslation(language, 'ourServices')}</h3>
          <p className="text-sm text-artistic-muted max-w-xl mx-auto">{getTranslation(language, 'servicesSubtitle')}</p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {['all', ...categories].map(cat => (
              <button
                key={cat}
                id={`cat_filter_${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all border ${
                  activeCategory === cat 
                    ? 'bg-artistic-sage text-white border-artistic-sage' 
                    : 'bg-white text-artistic-muted border-artistic-border hover:bg-artistic-cream'
                }`}
              >
                {cat === 'all' ? (language === 'es' ? 'Todos' : 'All') : cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Services Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <motion.div 
              layout 
              key={service.id}
              className="bg-white border border-artistic-border rounded-3xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden bg-artistic-cream/30">
                <img 
                  src={service.imageUrl} 
                  alt={language === 'es' ? service.nameEs : service.nameEn} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[9px] font-bold tracking-widest text-artistic-sage uppercase border border-artistic-border/40">
                  {service.category}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-serif font-medium text-artistic-dark text-lg">
                    {language === 'es' ? service.nameEs : service.nameEn}
                  </h4>
                  <p className="text-xs text-artistic-muted leading-relaxed">
                    {language === 'es' ? service.descriptionEs : service.descriptionEn}
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-artistic-border mt-5">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-artistic-muted block tracking-widest">PRECIO</span>
                    <span className="font-serif font-semibold text-xl text-artistic-sage">${service.price.toLocaleString('es-AR')}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService(service.id);
                      setIsBookingModalOpen(true);
                    }}
                    className="px-4 py-2 bg-artistic-cream hover:bg-artistic-sage hover:text-white text-artistic-dark rounded-full text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {getTranslation(language, 'bookTurn')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Visual elegant separator instead of the booking form */}
      <div className="max-w-2xl mx-auto py-8">
        <div className="h-px bg-linear-to-r from-transparent via-artistic-border to-transparent" />
      </div>

      {/* Products Shop Section */}
      <section className="max-w-7xl mx-auto px-4 py-16" id="products_showcase_sec">
        <div className="text-center space-y-3 mb-12">
          <h3 className="text-3xl sm:text-4xl font-light italic font-serif text-artistic-dark">{getTranslation(language, 'ourProducts')}</h3>
          <p className="text-sm text-artistic-muted max-w-xl mx-auto">{getTranslation(language, 'productsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-artistic-border rounded-3xl p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="aspect-square w-full rounded-2xl overflow-hidden bg-artistic-cream/20 border border-artistic-border/40">
                  <img 
                    src={product.imageUrl} 
                    alt={language === 'es' ? product.nameEs : product.nameEn} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif font-medium text-artistic-dark text-base line-clamp-1">
                    {language === 'es' ? product.nameEs : product.nameEn}
                  </h4>
                  <p className="text-xs text-artistic-muted line-clamp-2 leading-relaxed">
                    {language === 'es' ? product.descriptionEs : product.descriptionEn}
                  </p>
                </div>
              </div>
              <div className="pt-4 mt-5 border-t border-artistic-border flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-artistic-muted uppercase font-bold block tracking-wider">STOCK: {product.stock} units</span>
                  <span className="font-serif font-semibold text-xl text-artistic-sage">${product.price.toLocaleString('es-AR')}</span>
                </div>
                <button
                  id={`reserve_product_${product.id}`}
                  onClick={() => agregarAlCanasto(product)}
                  className="px-5 py-2.5 bg-artistic-dark hover:bg-artistic-sage text-white rounded-full text-[10px] font-semibold uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-artistic-cream/20 border-t border-artistic-border py-16 px-4" id="reviews_comments_sec">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Approved Reviews Showcase */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <h3 className="text-3xl font-light italic font-serif text-artistic-dark">{getTranslation(language, 'comments')}</h3>
              <p className="text-xs text-artistic-muted">{getTranslation(language, 'ratingLabel')}: {activeTenant.rating} / 5</p>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {approvedComments.length === 0 ? (
                <div className="p-8 bg-white border border-artistic-border rounded-2xl text-center text-artistic-muted text-sm">
                  {language === 'es' ? 'Aún no hay comentarios aprobados para este local.' : 'No approved comments yet for this salon.'}
                </div>
              ) : (
                approvedComments.map(comment => (
                  <div key={comment.id} className="p-5 bg-white border border-artistic-border rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-artistic-dark text-sm flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-artistic-sage/10 border border-artistic-sage/20 text-artistic-sage text-xs font-extrabold flex items-center justify-center">
                          {comment.clientName.substring(0, 2).toUpperCase()}
                        </span>
                        {comment.clientName}
                      </h5>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: comment.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-artistic-sage stroke-artistic-sage" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-artistic-muted leading-relaxed italic">
                      "{comment.text}"
                    </p>
                    <span className="text-[10px] text-artistic-muted block text-right">{comment.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Review Form */}
          <div className="lg:col-span-5 bg-white border border-artistic-border rounded-3xl p-6 shadow-sm self-start">
            <h4 className="font-serif font-medium text-artistic-dark text-lg mb-4 flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-artistic-sage" />
              {getTranslation(language, 'writeCommentTitle')}
            </h4>

            <form onSubmit={handleSendComment} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1">{getTranslation(language, 'clientNameLabel')}</label>
                <input
                  type="text"
                  required
                  id="review_client_name"
                  placeholder="Ej: Gabriela Díaz"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1">{getTranslation(language, 'leaveRating')}</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      id={`star_rating_${val}`}
                      onClick={() => setReviewRating(val)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${val <= reviewRating ? 'fill-artistic-sage stroke-artistic-sage text-artistic-sage' : 'text-stone-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1">{language === 'es' ? 'Mensaje o Consulta' : 'Message or Inquiry'}</label>
                <textarea
                  required
                  rows={4}
                  id="review_text_area"
                  placeholder={getTranslation(language, 'yourComment')}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                id="submit_review_comment"
                className="w-full py-3 bg-artistic-dark hover:bg-artistic-sage hover:text-white text-white font-semibold rounded-full uppercase tracking-widest text-[10px] transition-all"
              >
                {getTranslation(language, 'sendComment')}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Location / Sharing Sticky Bar Footer */}
      <footer className="bg-artistic-dark text-artistic-cream/70 py-16 px-4 border-t border-artistic-dark">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="font-serif italic font-medium text-white text-xl tracking-wide">{activeTenant.name}</h4>
            <p className="text-xs text-artistic-cream/60 leading-relaxed max-w-sm">
              {activeTenant.tagline}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-white uppercase px-2 py-0.5 bg-artistic-sage/20 text-artistic-cream border border-artistic-sage/30 rounded">
                PWA Active
              </span>
              <span className="text-[10px] text-artistic-cream/40">v1.2.0 • Offline Ready</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{getTranslation(language, 'locationTitle')}</h4>
            <p className="text-xs flex items-start gap-1.5 leading-relaxed text-artistic-cream/60">
              <MapPin className="w-4 h-4 text-artistic-sage shrink-0 mt-0.5" />
              <span>{activeTenant.address}</span>
            </p>
            <p className="text-xs flex items-center gap-1.5 text-artistic-cream/60">
              <Phone className="w-4 h-4 text-artistic-sage shrink-0" />
              <span>{activeTenant.phonePrefix} {activeTenant.phone || '11 5544-3322'}</span>
            </p>
            <p className="text-xs flex items-start gap-1.5 text-artistic-cream/60 leading-relaxed">
              <Clock className="w-4 h-4 text-artistic-sage shrink-0 mt-0.5" />
              <div>
                <div>{activeTenant.workingDays || 'Lunes a Sábado'}</div>
                <div className="text-[11px] text-artistic-cream/40">{activeTenant.workingHours || '09:00 a 20:00 hs'}</div>
              </div>
            </p>
            <a 
              href={activeTenant.locationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-white hover:text-white/80 underline underline-offset-4 decoration-artistic-sage/70 pt-2"
            >
              {language === 'es' ? 'Ver en Google Maps' : 'View on Google Maps'}
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider">{language === 'es' ? 'SOPORTE DE LICENCIA' : 'LICENSE SUPPORT'}</h4>
            <p className="text-xs leading-relaxed text-artistic-cream/50">
              {language === 'es' 
                ? 'Sistema de reservas multi-inquilino de estética con verificación automatizada de licencias.' 
                : 'Aesthetics multi-tenant booking system with automated license verification.'}
            </p>
            <div className="text-[11px] text-artistic-cream/40 font-mono">
              License ID: bella-licencia-2026
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal container */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white border border-artistic-border rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-artistic-muted hover:text-artistic-dark hover:bg-artistic-cream rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-2 mb-8">
                  <div className="mx-auto w-12 h-12 bg-artistic-sage/10 border border-artistic-sage/20 rounded-full flex items-center justify-center text-artistic-sage mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-3xl font-light italic font-serif text-artistic-dark">{getTranslation(language, 'reserveAppointment')}</h3>
                  <p className="text-xs text-artistic-muted">Completa los datos para agendar tu especialista en estética.</p>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Select Service */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5">{getTranslation(language, 'selectService')} *</label>
                      <select
                        required
                        id="appointment_service_select"
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-sm focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                      >
                        <option value="">-- {getTranslation(language, 'selectService')} --</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>
                            {language === 'es' ? s.nameEs : s.nameEn} (${s.price.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Select Specialist */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5">{getTranslation(language, 'selectCollaborator')} *</label>
                      <select
                        required
                        id="appointment_collaborator_select"
                        value={selectedCollab}
                        onChange={(e) => setSelectedCollab(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-sm focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                      >
                        <option value="">-- {getTranslation(language, 'selectCollaborator')} --</option>
                        {profesionales.map((col: any) => (
                          <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Select Date */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-artistic-sage" />
                        {getTranslation(language, 'selectDate')} *
                      </label>
                      <input
                        type="date"
                        required
                        id="appointment_date_input"
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-sm focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                      />
                    </div>

                    {/* Select Time */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-artistic-sage" />
                        {getTranslation(language, 'selectTime')} *
                      </label>
                      <select
                        required
                        id="appointment_time_select"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-sm focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                      >
                        <option value="">-- {getTranslation(language, 'selectTime')} --</option>
                        {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(t => (
                          <option key={t} value={t}>{t} hs</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-artistic-border pt-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-artistic-sage" />
                        {getTranslation(language, 'clientNameLabel')} *
                      </label>
                      <input
                        type="text"
                        required
                        id="appointment_client_name"
                        placeholder="Natalia Rossi"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-sm focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-artistic-sage" />
                        {getTranslation(language, 'clientPhoneLabel')} *
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-artistic-border focus-within:border-artistic-sage focus-within:ring-1 focus-within:ring-artistic-sage transition-all">
                        <div className="bg-artistic-cream px-4 py-2.5 text-xs font-bold text-artistic-dark flex items-center border-r border-artistic-border">
                          {phonePrefix}
                        </div>
                        <input
                          type="tel"
                          required
                          id="appointment_client_phone"
                          placeholder="1155442211"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-2.5 bg-white text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="px-6 py-3 border border-artistic-border text-artistic-muted hover:text-artistic-dark font-semibold rounded-full text-xs transition-all uppercase tracking-widest cursor-pointer"
                    >
                      {getTranslation(language, 'cancel')}
                    </button>
                    <button
                      type="submit"
                      id="submit_appointment_booking"
                      className="px-8 py-3 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-xs cursor-pointer"
                    >
                      {getTranslation(language, 'confirmBooking')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal container */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white border border-artistic-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-artistic-muted hover:text-artistic-dark hover:bg-artistic-cream rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-2 mb-6">
                  <div className="mx-auto w-12 h-12 bg-artistic-sage/10 border border-artistic-sage/20 rounded-full flex items-center justify-center text-artistic-sage mb-3">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium italic text-artistic-dark">{getTranslation(language, 'shareTitle')}</h3>
                  <p className="text-xs text-artistic-muted">{language === 'es' ? 'Elige tu medio preferido para recomendarnos' : 'Choose your preferred way to recommend us'}</p>
                </div>

                <div className="space-y-6">
                  {/* Social sharing options */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getTranslation(language, 'shareText') + ' ' + window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-4 bg-[#25D366]/5 hover:bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl text-center transition-all group"
                    >
                      <span className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center text-lg font-bold shadow-sm mb-2 group-hover:scale-105 transition-transform">
                        W
                      </span>
                      <span className="text-xs font-semibold text-stone-700">WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                      href={`https://telegram.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(getTranslation(language, 'shareText'))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-4 bg-[#0088cc]/5 hover:bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-2xl text-center transition-all group"
                    >
                      <span className="w-10 h-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-lg font-bold shadow-sm mb-2 group-hover:scale-105 transition-transform">
                        T
                      </span>
                      <span className="text-xs font-semibold text-stone-700">Telegram</span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-4 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-2xl text-center transition-all group"
                    >
                      <span className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-lg font-bold shadow-sm mb-2 group-hover:scale-105 transition-transform">
                        F
                      </span>
                      <span className="text-xs font-semibold text-stone-700">Facebook</span>
                    </a>

                    {/* X / Twitter */}
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(getTranslation(language, 'shareText'))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center justify-center p-4 bg-stone-900/5 hover:bg-stone-900/10 border border-stone-900/20 rounded-2xl text-center transition-all group"
                    >
                      <span className="w-10 h-10 rounded-full bg-stone-950 text-white flex items-center justify-center text-sm font-extrabold shadow-sm mb-2 group-hover:scale-105 transition-transform">
                        X
                      </span>
                      <span className="text-xs font-semibold text-stone-700">X / Twitter</span>
                    </a>
                  </div>

                  {/* Copy Link Input & Button */}
                  <div className="space-y-2 border-t border-artistic-border pt-5">
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark">{language === 'es' ? 'Copiar Enlace' : 'Copy Link'}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={window.location.href}
                        className="flex-1 px-4 py-2.5 bg-artistic-bg border border-artistic-border rounded-xl text-xs text-artistic-muted focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-5 py-2.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {language === 'es' ? 'Copiar' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CANASTO: botón flotante ── */}
      {canasto.length > 0 && !isCanastoOpen && (
        <button
          id="open_canasto_btn"
          onClick={() => setIsCanastoOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-artistic-sage hover:bg-artistic-dark text-white rounded-full shadow-2xl px-5 py-4 flex items-center gap-3 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-sm font-semibold">
            {unidadesCanasto} {language === 'es' ? (unidadesCanasto === 1 ? 'producto' : 'productos') : 'items'}
          </span>
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">
            ${totalCanasto.toLocaleString('es-AR')}
          </span>
        </button>
      )}

      {/* ── CANASTO: modal con turno de retiro ── */}
      <AnimatePresence>
        {isCanastoOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto border border-artistic-border shadow-2xl"
            >
              {/* Encabezado */}
              <div className="sticky top-0 bg-white border-b border-artistic-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif italic font-medium text-xl text-artistic-dark">
                    {language === 'es' ? 'Tu canasto' : 'Your basket'}
                  </h3>
                  <p className="text-[11px] text-artistic-muted">
                    {language === 'es' ? 'Elegí día y hora para retirarlo' : 'Choose pickup date and time'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCanastoOpen(false)}
                  className="p-2 rounded-full hover:bg-artistic-cream text-artistic-muted hover:text-artistic-dark cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Items */}
                <div className="space-y-3">
                  {canasto.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 bg-artistic-cream/40 border border-artistic-border rounded-2xl p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-artistic-dark truncate">
                          {language === 'es' ? item.nameEs : item.nameEn}
                        </p>
                        <p className="text-xs text-artistic-muted">
                          ${item.price.toLocaleString('es-AR')} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => cambiarCantidad(item.productId, -1)} className="p-1.5 rounded-full border border-artistic-border hover:bg-white text-artistic-muted cursor-pointer">
                          {item.qty === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm font-bold text-artistic-dark w-5 text-center">{item.qty}</span>
                        <button onClick={() => cambiarCantidad(item.productId, 1)} className="p-1.5 rounded-full border border-artistic-border hover:bg-white text-artistic-muted cursor-pointer">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-artistic-sage w-20 text-right shrink-0">
                        ${(item.price * item.qty).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-artistic-border pt-4">
                  <span className="text-sm font-semibold uppercase tracking-wider text-artistic-muted">Total</span>
                  <span className="font-serif font-semibold text-2xl text-artistic-sage">
                    ${totalCanasto.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* Formulario de retiro */}
                <form onSubmit={handleConfirmarRetiro} className="space-y-4 border-t border-artistic-border pt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-artistic-dark flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-artistic-sage" />
                    {language === 'es' ? 'Turno de retiro' : 'Pickup appointment'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted mb-1">
                        {language === 'es' ? 'Día' : 'Date'}
                      </label>
                      <input
                        type="date"
                        required
                        value={retiroFecha}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setRetiroFecha(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-artistic-border rounded-xl text-sm text-artistic-dark focus:outline-none focus:border-artistic-sage"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted mb-1">
                        {language === 'es' ? 'Hora' : 'Time'}
                      </label>
                      <input
                        type="time"
                        required
                        value={retiroHora}
                        onChange={(e) => setRetiroHora(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-artistic-border rounded-xl text-sm text-artistic-dark focus:outline-none focus:border-artistic-sage"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted mb-1">
                      {language === 'es' ? 'Tu nombre' : 'Your name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={language === 'es' ? 'Ej: Sofía Martínez' : 'Ex: Sophie Martin'}
                      className="w-full px-3 py-2.5 bg-white border border-artistic-border rounded-xl text-sm text-artistic-dark placeholder-stone-400 focus:outline-none focus:border-artistic-sage"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-muted mb-1">
                      {language === 'es' ? 'Tu WhatsApp' : 'Your WhatsApp'}
                    </label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2.5 bg-artistic-cream border border-artistic-border rounded-xl text-sm text-artistic-muted font-mono shrink-0">
                        {phonePrefix}
                      </span>
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="1155550000"
                        className="flex-1 px-3 py-2.5 bg-white border border-artistic-border rounded-xl text-sm text-artistic-dark placeholder-stone-400 focus:outline-none focus:border-artistic-sage"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="confirmar_retiro_btn"
                    className="w-full py-3.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {language === 'es' ? 'Confirmar pedido' : 'Confirm order'}
                  </button>

                  <p className="text-[10px] text-center text-artistic-muted leading-relaxed">
                    {language === 'es'
                      ? 'Te esperamos el día y hora que elegiste para retirar tu pedido.'
                      : 'We will be waiting for you at the chosen date and time.'}
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
