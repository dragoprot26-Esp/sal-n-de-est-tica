/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTranslation } from '../utils/i18n';
import { Shield, Key, User, Lock, Fingerprint, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    setCurrentUser,
    collaborators,
    requestCollaboratorAccess,
    biometricsEnabledUsers,
    toggleBiometricsForUser,
    activeTenant,
    loginDueno,
    loginColab
  } = useApp();

  const [role, setRole] = useState<'admin' | 'collaborator'>('admin');
  const [license, setLicense] = useState(''); // Código de licencia real
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [biometricsChecked, setBiometricsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [collabWaiting, setCollabWaiting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!license.trim() || !password) {
      setErrorMsg(getTranslation(language, 'licenseError'));
      setLoading(false);
      return;
    }

    if (role === 'admin') {
      // Login real: valida licencia contra Supabase + cuenta segura (Auth).
      const res = await loginDueno(license, username, password);
      if (res.ok) {
        setCurrentUser({
          role: 'admin',
          id: 'admin-1',
          name: 'Administrador Principal',
          username: (username || 'admin').toLowerCase().trim() || 'admin'
        });
        if (biometricsChecked) {
          toggleBiometricsForUser('admin', true);
        }
        setLoading(false);
        onClose();
      } else {
        setErrorMsg(res.msg || getTranslation(language, 'credentialsError'));
        setLoading(false);
      }
    } else {
      // Colaborador: login real (cuenta segura) + flujo de aprobación del dueño.
      const res = await loginColab(license, username, password);
      if (!res.ok) {
        setErrorMsg(res.msg || getTranslation(language, 'credentialsError'));
        setLoading(false);
        return;
      }
      const foundCollab = collaborators.find(
        c => c.username === username.toLowerCase().trim()
      );

      if (foundCollab) {
        // Triggers the real-time request to the admin
        setCollabWaiting(true);
        const approved = await requestCollaboratorAccess(foundCollab.username);
        
        if (approved) {
          setCurrentUser({
            role: 'collaborator',
            id: foundCollab.id,
            name: foundCollab.name,
            username: foundCollab.username
          });
          if (biometricsChecked) {
            toggleBiometricsForUser(foundCollab.username, true);
          }
          setCollabWaiting(false);
          setLoading(false);
          onClose();
        } else {
          setErrorMsg(language === 'es' ? 'Acceso rechazado por el Administrador.' : 'Access denied by Administrator.');
          setCollabWaiting(false);
          setLoading(false);
        }
      } else {
        setErrorMsg(getTranslation(language, 'credentialsError'));
        setLoading(false);
      }
    }
  };

  // Simulate Biometric login
  const handleBiometricLogin = () => {
    setErrorMsg('');
    
    // Look if any enabled user is in our local storage
    if (biometricsEnabledUsers.length === 0) {
      setErrorMsg(getTranslation(language, 'biometricsNotSupported'));
      return;
    }

    setLoading(true);

    // Let's prompt a simulated biometric success
    setTimeout(async () => {
      // Find the first enabled user for simulation
      const defaultUser = biometricsEnabledUsers[0];
      
      if (defaultUser === 'admin') {
        setCurrentUser({
          role: 'admin',
          id: 'admin-1',
          name: 'Administrador Principal',
          username: 'admin'
        });
        setLoading(false);
        onClose();
      } else {
        const collab = collaborators.find(c => c.username === defaultUser);
        if (collab) {
          setCollabWaiting(true);
          const approved = await requestCollaboratorAccess(collab.username);
          if (approved) {
            setCurrentUser({
              role: 'collaborator',
              id: collab.id,
              name: collab.name,
              username: collab.username
            });
            setCollabWaiting(false);
            setLoading(false);
            onClose();
          } else {
            setErrorMsg(language === 'es' ? 'Acceso biométrico rechazado por el Admin.' : 'Biometric access denied by Admin.');
            setCollabWaiting(false);
            setLoading(false);
          }
        } else {
          setErrorMsg(getTranslation(language, 'biometricsNotSupported'));
          setLoading(false);
        }
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {activeTenant?.theme?.loginBgUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-300"
          style={{ 
            backgroundImage: `url(${activeTenant.theme.loginBgUrl})`,
            opacity: activeTenant.theme.loginBgOpacity !== undefined ? activeTenant.theme.loginBgOpacity : 0.6
          }}
        />
      )}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md overflow-hidden bg-white border border-artistic-border text-artistic-dark rounded-3xl shadow-2xl"
      >
        {/* Close Button */}
        <button 
          id="close_login_modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-artistic-cream text-artistic-muted hover:text-artistic-dark transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="p-6 text-center border-b border-artistic-border/80 bg-gradient-to-b from-artistic-cream to-transparent">
          <div className="inline-flex items-center justify-center p-3 mb-3 bg-artistic-sage/10 border border-artistic-sage/20 rounded-2xl text-artistic-sage">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-serif font-medium italic tracking-tight text-artistic-dark">{getTranslation(language, 'loginTitle')}</h3>
          <p className="text-xs text-artistic-muted mt-1">BellaVita Aesthetics Platform</p>
        </div>

        <div className="p-6">
          {collabWaiting ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="w-12 h-12 text-artistic-sage animate-spin mb-4" />
              <p className="font-serif italic font-medium text-artistic-dark text-lg">
                {language === 'es' ? 'Solicitando Autorización...' : 'Requesting Authorization...'}
              </p>
              <p className="text-sm text-artistic-muted mt-2 max-w-xs">
                {getTranslation(language, 'pendingApprovalMsg')}
              </p>
              <div className="mt-6 px-4 py-2 bg-artistic-cream/80 rounded-xl text-xs text-artistic-muted border border-artistic-border">
                {language === 'es' ? 'Tip: Abre el Panel Admin en otra pestaña para autorizar.' : 'Tip: Open the Admin Panel in another tab to authorize.'}
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role selector */}
              <div className="grid grid-cols-2 p-1 bg-artistic-cream rounded-full border border-artistic-border">
                <button
                  type="button"
                  id="role_admin_btn"
                  onClick={() => { setRole('admin'); setUsername('admin'); setPassword(''); }}
                  className={`py-2 text-xs font-semibold rounded-full transition-all ${
                    role === 'admin' 
                      ? 'bg-artistic-sage text-white shadow-sm' 
                      : 'text-artistic-muted hover:text-artistic-dark'
                  }`}
                >
                  {getTranslation(language, 'adminPanel')}
                </button>
                <button
                  type="button"
                  id="role_collab_btn"
                  onClick={() => { setRole('collaborator'); setUsername(''); setPassword(''); }}
                  className={`py-2 text-xs font-semibold rounded-full transition-all ${
                    role === 'collaborator' 
                      ? 'bg-artistic-sage text-white shadow-sm' 
                      : 'text-artistic-muted hover:text-artistic-dark'
                  }`}
                >
                  {getTranslation(language, 'collaboratorPanel')}
                </button>
              </div>

              {/* License field */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-artistic-sage" />
                  {getTranslation(language, 'licenseLabel')}
                </label>
                <input
                  type="text"
                  required
                  id="login_license"
                  placeholder={getTranslation(language, 'licensePlaceholder')}
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-artistic-dark placeholder-stone-400 focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage text-sm transition-all"
                />
              </div>

              {/* Username field */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-artistic-sage" />
                  {getTranslation(language, 'usernameLabel')}
                </label>
                <input
                  type="text"
                  required
                  id="login_username"
                  placeholder="Ej: sofia, admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-artistic-dark placeholder-stone-400 focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage text-sm transition-all"
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-artistic-dark mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-artistic-sage" />
                  {getTranslation(language, 'passwordLabel')}
                </label>
                <input
                  type="password"
                  required
                  id="login_password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-artistic-border rounded-xl text-artistic-dark placeholder-stone-400 focus:outline-none focus:border-artistic-sage focus:ring-1 focus:ring-artistic-sage text-sm transition-all"
                />
              </div>

              {/* Biometrics Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer group mt-2">
                <input 
                  type="checkbox" 
                  id="biometrics_toggle_checkbox"
                  checked={biometricsChecked} 
                  onChange={(e) => setBiometricsChecked(e.target.checked)}
                  className="mt-0.5 rounded border-artistic-border bg-white text-artistic-sage focus:ring-artistic-sage" 
                />
                <span className="text-xs text-artistic-muted group-hover:text-artistic-dark transition-colors">
                  {getTranslation(language, 'biometricTilde')}
                </span>
              </label>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  id="submit_login_btn"
                  disabled={loading}
                  className="w-full py-3.5 bg-artistic-sage hover:bg-artistic-dark text-white font-semibold rounded-full text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {getTranslation(language, 'loginBtn')}
                </button>

                {/* Biometric login button if enabled */}
                {biometricsEnabledUsers.length > 0 && (
                  <button
                    type="button"
                    id="biometric_login_action"
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-artistic-cream border border-artistic-border text-artistic-dark hover:text-artistic-dark font-semibold rounded-full text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Fingerprint className="w-4 h-4 text-artistic-sage" />
                    {getTranslation(language, 'biometricLoginBtn')}
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Preset Helper Card */}
          <div className="mt-6 p-4 bg-artistic-cream/60 border border-artistic-border rounded-2xl text-[11px] text-artistic-muted space-y-1">
            <p className="font-semibold text-artistic-dark">Acceso real (Supabase):</p>
            <p>🔑 Ingresá tu <span className="text-artistic-sage font-semibold">código de licencia</span> (te lo da el administrador de CyC).</p>
            <p>💼 Elegí tu usuario y una <span className="text-artistic-dark font-semibold">contraseña de 6+ caracteres</span> (la primera vez queda registrada).</p>
            <p>💅 Los colaboradores entran con su usuario y clave, y el dueño autoriza el ingreso.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
