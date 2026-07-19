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

function AppContent() {
  const { currentUser } = useApp();
  const [loginOpen, setLoginOpen] = useState(false);

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

