/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicPage } from './components/PublicPage';
import { AdminDashboard } from './components/AdminDashboard';
import { CollaboratorDashboard } from './components/CollaboratorDashboard';
import { LoginModal } from './components/LoginModal';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';

function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#2D2926', color: '#FAF9F6', fontFamily: 'serif' }}>
      <div className="max-w-md w-full text-center rounded-3xl p-10 border" style={{ background: '#3a352f', borderColor: 'rgba(255,255,255,0.12)' }}>
        <div className="text-5xl mb-4">🌸</div>
        <h1 className="text-2xl font-medium italic mb-3">En Mantenimiento</h1>
        <p className="text-sm leading-relaxed" style={{ color: '#d9d4cb' }}>
          Estamos trabajando para brindarte una mejor experiencia. Nuestra página vuelve muy pronto.
          <br /><br />¡Gracias por tu paciencia! Saludos cordiales. 🌸
        </p>
        <div className="mt-6 h-1 w-16 rounded-full mx-auto" style={{ background: '#5A5A40' }}></div>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser, bloqueada, publicCode } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);

  // Kill switch: visitante en una pública bloqueada → cartel "En Mantenimiento".
  if (bloqueada && publicCode && !currentUser) {
    return <MaintenanceScreen />;
  }

  // If a session is active, render their dashboard
  if (currentUser) {
    if (currentUser.role === 'admin') {
      return (
        <div className="relative">
          {/* Quick Floating Back Button to jump back to public storefront */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                // We don't log out, we just let them view public storefront while keeping session active if they want,
                // or we can simulate jumping back easily by offering a clear indicator.
                // Let's keep it simple: the dashboard has a "Volver al Sitio Público" or logout button, which handles it.
              }}
            >
            </a>
          </div>
          <AdminDashboard />
        </div>
      );
    } else {
      return <CollaboratorDashboard />;
    }
  }

  // Otherwise render the Gorgeous Public Aesthetics Storefront
  return (
    <>
      <PublicPage onOpenLogin={() => setLoginOpen(true)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

