/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  validarLicencia, asegurarCuentaSeguraDueno, asegurarCuentaSeguraColab,
  cloudLoad, cloudSave, signOutGlobal, estaLogueado,
  bellaPublica, bellaAgregarTurno, bellaAgregarResena, bellaVersion, CloudData
} from '../cloud';
import {
  Language, Tenant, Service, Product, Collaborator,
  Appointment, Comment, SaleRecord, ThemeConfig
} from '../types';
import { 
  initialTenants, initialServices, initialProducts, 
  initialCollaborators, initialComments, initialAppointments, initialSalesHistory 
} from '../data/initialData';

interface AppContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTenant: Tenant;
  setActiveTenant: (tenant: Tenant) => void;
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  collaborators: Collaborator[];
  setCollaborators: React.Dispatch<React.SetStateAction<Collaborator[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  salesHistory: SaleRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;

  // Auth & Biometrics
  currentUser: { role: 'admin' | 'collaborator'; id: string; name: string; username: string } | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<{ role: 'admin' | 'collaborator'; id: string; name: string; username: string } | null>>;
  licenseCode: string;
  publicCode: string;
  loginDueno: (codigo: string, usuario: string, pass: string) => Promise<{ ok: boolean; msg?: string }>;
  loginColab: (codigo: string, usuario: string, pass: string) => Promise<{ ok: boolean; msg?: string }>;
  logout: () => void;
  pendingAccessRequests: { id: string; name: string; username: string; timestamp: string }[];
  setPendingAccessRequests: React.Dispatch<React.SetStateAction<{ id: string; name: string; username: string; timestamp: string }[]>>;
  
  phonePrefix: string;
  setPhonePrefix: (prefix: string) => void;
  
  // Custom functions
  addAppointment: (appt: Omit<Appointment, 'id'>) => void;
  addComment: (comment: Omit<Comment, 'id' | 'approved' | 'date'>) => void;
  approveComment: (id: string) => void;
  rejectComment: (id: string) => void;
  
  addCollaborator: (name: string, phone: string, user: string, pass: string) => void;
  deleteCollaborator: (id: string) => void;
  editCollaborator: (collab: Collaborator) => void;
  
  requestCollaboratorAccess: (username: string) => Promise<boolean>;
  approveAccessRequest: (reqId: string) => void;
  denyAccessRequest: (reqId: string) => void;
  
  biometricsEnabledUsers: string[]; // usernames that enabled biometrics
  toggleBiometricsForUser: (username: string, enabled: boolean) => void;

  exportSalesSpreadsheet: (vacuumAfterExport: boolean) => void;
  downloadBackup: () => void;
  restoreBackup: (fileContent: string) => boolean;
  updateTenantTheme: (theme: ThemeConfig) => void;
  updateTenantDetails: (details: Partial<Tenant>) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('bella_tenants');
    return saved ? JSON.parse(saved) : initialTenants;
  });
  const [activeTenant, setActiveTenantState] = useState<Tenant>(tenants[0]);

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('bella_services');
    return saved ? JSON.parse(saved) : initialServices;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('bella_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('bella_collaborators');
    return saved ? JSON.parse(saved) : initialCollaborators;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('bella_appointments');
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('bella_comments');
    return saved ? JSON.parse(saved) : initialComments;
  });

  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('bella_sales');
    return saved ? JSON.parse(saved) : initialSalesHistory;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('bella_categories');
    return saved ? JSON.parse(saved) : ['facial', 'corporal', 'unas', 'cabello', 'maquillaje'];
  });

  const [currentUser, setCurrentUser] = useState<{ role: 'admin' | 'collaborator'; id: string; name: string; username: string } | null>(null);
  const [pendingAccessRequests, setPendingAccessRequests] = useState<{ id: string; name: string; username: string; timestamp: string }[]>([]);
  
  const [phonePrefix, setPhonePrefixState] = useState<string>('+549');

  const [biometricsEnabledUsers, setBiometricsEnabledUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem('bella_biometrics_users');
    return saved ? JSON.parse(saved) : [];
  });

  // Molde CyC: código de licencia (panel) y código público (?codigo=)
  const [licenseCode, setLicenseCode] = useState<string>('');
  const [publicCode, setPublicCode] = useState<string>('');
  const hydratingRef = React.useRef(false);
  const saveTimerRef = React.useRef<any>(null);

  // Keep Active Tenant prefix synced
  useEffect(() => {
    if (activeTenant) {
      setPhonePrefixState(activeTenant.phonePrefix);
    }
  }, [activeTenant]);

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('bella_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('bella_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('bella_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('bella_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem('bella_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('bella_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('bella_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('bella_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('bella_biometrics_users', JSON.stringify(biometricsEnabledUsers));
  }, [biometricsEnabledUsers]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const setActiveTenant = (t: Tenant) => {
    setActiveTenantState(t);
  };

  const setPhonePrefix = (prefix: string) => {
    setPhonePrefixState(prefix);
    setTenants(prev => prev.map(t => t.id === activeTenant.id ? { ...t, phonePrefix: prefix } : t));
    setActiveTenantState(prev => ({ ...prev, phonePrefix: prefix }));
  };

  // Add booking appointment
  const addAppointment = (appt: Omit<Appointment, 'id'>) => {
    const id = `appt-${Date.now()}`;
    const newAppt: Appointment = {
      ...appt,
      id,
      status: 'pending'
    };
    setAppointments(prev => [newAppt, ...prev]);
    // Vista pública: el turno del cliente se persiste en la nube del local.
    if (publicCode) { bellaAgregarTurno(publicCode, newAppt); }

    // Also simulate a completed or pending sale when it gets scheduled, or wait until completed.
    // Let's also register it in sales history if marked completed immediately, or keep the history updated.
    // Let's add it to the sales records when it is completed. To simulate organic activity, we let the admin complete it.
  };

  // Add Comment from Client
  const addComment = (comment: Omit<Comment, 'id' | 'approved' | 'date'>) => {
    const id = `comment-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const newComment: Comment = {
      ...comment,
      id,
      date,
      approved: false
    };
    setComments(prev => [newComment, ...prev]);
    // Vista pública: la opinión del cliente se envía a la nube (queda pendiente de aprobar).
    if (publicCode) { bellaAgregarResena(publicCode, newComment); }
  };

  // Approve Comment
  const approveComment = (id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, approved: true } : c));
  };

  // Reject Comment
  const rejectComment = (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  // Create Collaborator
  const addCollaborator = (name: string, phone: string, user: string, pass: string) => {
    const id = `collab-${Date.now()}`;
    const newCollab: Collaborator = {
      id,
      name,
      phone,
      username: user.toLowerCase().trim(),
      password: pass,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?auto=format&fit=crop&q=80&w=150`,
      status: 'approved',
      biometricsEnabled: false,
      servicesCompleted: 0,
      revenueGenerated: 0
    };
    setCollaborators(prev => [...prev, newCollab]);
  };

  // Delete Collaborator
  const deleteCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  // Edit Collaborator
  const editCollaborator = (updated: Collaborator) => {
    setCollaborators(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  // Collaborator Authorization Request Flow
  const requestCollaboratorAccess = (username: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const collab = collaborators.find(c => c.username === username.toLowerCase().trim());
      if (!collab) {
        resolve(false);
        return;
      }

      // Add to pending authorization requests
      const requestId = `req-${Date.now()}`;
      const newRequest = {
        id: requestId,
        name: collab.name,
        username: collab.username,
        timestamp: new Date().toLocaleTimeString()
      };

      setPendingAccessRequests(prev => [...prev, newRequest]);

      // We will poll/check periodically if the admin accepts this request.
      // For high fidelity simulation, let's keep track of request status via state.
      // When the admin authorizes or denies, we resolve the promise.
      // We will check every 500ms if the request is still in pendingAccessRequests.
      // If it is removed and the collaborator gets set to 'approved', we resolve true.
      // If it is denied, we resolve false.
      const interval = setInterval(() => {
        setPendingAccessRequests(currentRequests => {
          const exists = currentRequests.find(r => r.id === requestId);
          if (!exists) {
            clearInterval(interval);
            // Check if user is approved
            setCollaborators(latestCollabs => {
              const currentStatus = latestCollabs.find(c => c.username === collab.username)?.status;
              if (currentStatus === 'approved') {
                resolve(true);
              } else {
                resolve(false);
              }
              return latestCollabs;
            });
          }
          return currentRequests;
        });
      }, 500);

      // Timeout after 45 seconds to prevent memory hanging
      setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, 45000);
    });
  };

  const approveAccessRequest = (reqId: string) => {
    const req = pendingAccessRequests.find(r => r.id === reqId);
    if (req) {
      // Mark collaborator approved
      setCollaborators(prev => prev.map(c => c.username === req.username ? { ...c, status: 'approved' } : c));
      // Remove from requests list
      setPendingAccessRequests(prev => prev.filter(r => r.id !== reqId));
    }
  };

  const denyAccessRequest = (reqId: string) => {
    const req = pendingAccessRequests.find(r => r.id === reqId);
    if (req) {
      setCollaborators(prev => prev.map(c => c.username === req.username ? { ...c, status: 'rejected' } : c));
      setPendingAccessRequests(prev => prev.filter(r => r.id !== reqId));
    }
  };

  // Toggle biometric status for a user locally
  const toggleBiometricsForUser = (username: string, enabled: boolean) => {
    setBiometricsEnabledUsers(prev => {
      const exists = prev.includes(username);
      if (enabled && !exists) {
        return [...prev, username];
      } else if (!enabled && exists) {
        return prev.filter(u => u !== username);
      }
      return prev;
    });
  };

  // Exporta el historial de ventas como Excel (.xlsx) — formato Bar-Cel (SheetJS)
  const exportSalesSpreadsheet = (vacuumAfterExport: boolean) => {
    // Filas como objetos (encabezados = claves), igual que Bar-Cel.
    const rows = salesHistory.map(sale => ({
      'ID': sale.id,
      'Fecha': sale.date,
      'Tipo de Item': sale.itemType,
      'Item (ES)': sale.itemNameEs,
      'Item (EN)': sale.itemNameEn,
      'Monto': Number(sale.price) || 0,
      'Concretado Por': sale.completedBy
    }));

    const nombreBase = `planilla_ventas_${activeTenant.id}_${new Date().toISOString().split('T')[0]}`;
    try {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'ID': '', 'Fecha': '', 'Tipo de Item': '', 'Item (ES)': '', 'Item (EN)': '', 'Monto': '', 'Concretado Por': '' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      XLSX.writeFile(wb, `${nombreBase}.xlsx`);
    } catch (e) {
      // Respaldo: si la librería Excel fallara, cae a CSV.
      const headers = ['ID', 'Fecha', 'Tipo de Item', 'Item (ES)', 'Item (EN)', 'Monto', 'Concretado Por'];
      const csv = [headers.join(','), ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${nombreBase}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    if (vacuumAfterExport) {
      setSalesHistory([]);
      // Reset collaborator stats
      setCollaborators(prev => prev.map(c => ({
        ...c,
        servicesCompleted: 0,
        revenueGenerated: 0
      })));
    }
  };

  // Download complete application database backup (JSON)
  const downloadBackup = () => {
    const backupData = {
      tenants,
      services,
      products,
      collaborators,
      appointments,
      comments,
      salesHistory,
      phonePrefix,
      biometricsEnabledUsers,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `backup_salon_estetica_${activeTenant.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Restore application backup
  const restoreBackup = (fileContent: string): boolean => {
    try {
      const parsed = JSON.parse(fileContent);
      if (parsed.tenants && parsed.services && parsed.products) {
        setTenants(parsed.tenants);
        setServices(parsed.services);
        setProducts(parsed.products);
        if (parsed.collaborators) setCollaborators(parsed.collaborators);
        if (parsed.appointments) setAppointments(parsed.appointments);
        if (parsed.comments) setComments(parsed.comments);
        if (parsed.salesHistory) setSalesHistory(parsed.salesHistory);
        if (parsed.phonePrefix) setPhonePrefixState(parsed.phonePrefix);
        if (parsed.biometricsEnabledUsers) setBiometricsEnabledUsers(parsed.biometricsEnabledUsers);
        
        // auto select restored active tenant
        const restoredTenant = parsed.tenants.find((t: Tenant) => t.id === activeTenant.id) || parsed.tenants[0];
        setActiveTenantState(restoredTenant);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const updateTenantTheme = (newTheme: ThemeConfig) => {
    setTenants(prev => prev.map(t => t.id === activeTenant.id ? { ...t, theme: { ...(t.theme || {}), ...newTheme } } : t));
    setActiveTenantState(prev => {
      const updated = { ...prev, theme: { ...(prev.theme || {}), ...newTheme } };
      return updated;
    });
  };

  const updateTenantDetails = (details: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === activeTenant.id ? { ...t, ...details } : t));
    setActiveTenantState(prev => ({ ...prev, ...details }));
  };

  // ── Nube (molde CyC): login real + sincronización ────────────────────
  const snapshot = (): CloudData => ({
    tenants, services, products, collaborators, appointments, comments,
    salesHistory, phonePrefix, biometricsEnabledUsers, categories
  } as any);

  const hydrate = (d: CloudData | null) => {
    if (!d) return;
    const dd = d as any;
    hydratingRef.current = true;
    if (dd.tenants) { setTenants(dd.tenants); if (dd.tenants[0]) setActiveTenantState(dd.tenants[0]); }
    if (dd.services) setServices(dd.services);
    if (dd.products) setProducts(dd.products);
    if (dd.collaborators) setCollaborators(dd.collaborators);
    if (dd.appointments) setAppointments(dd.appointments);
    if (dd.comments) setComments(dd.comments);
    if (dd.salesHistory) setSalesHistory(dd.salesHistory);
    if (dd.categories) setCategories(dd.categories);
    if (dd.phonePrefix) setPhonePrefixState(dd.phonePrefix);
    if (dd.biometricsEnabledUsers) setBiometricsEnabledUsers(dd.biometricsEnabledUsers);
    setTimeout(() => { hydratingRef.current = false; }, 500);
  };

  const loginDueno = async (codigo: string, usuario: string, pass: string): Promise<{ ok: boolean; msg?: string }> => {
    codigo = (codigo || '').trim().toUpperCase();
    const lic = await validarLicencia(codigo);
    if (!lic) return { ok: false, msg: 'Licencia inválida, inactiva o vencida.' };
    const r = await asegurarCuentaSeguraDueno((usuario || '').trim() || 'dueno', pass, codigo);
    if (!r.ok) return { ok: false, msg: r.msg };
    setLicenseCode(codigo);
    localStorage.setItem('bella_codigo', codigo);
    const d = await cloudLoad(codigo);
    if (d && ((d as any).tenants || (d as any).services)) { hydrate(d); }
    else { await cloudSave(codigo, snapshot()); }
    return { ok: true };
  };

  const loginColab = async (codigo: string, usuario: string, pass: string): Promise<{ ok: boolean; msg?: string }> => {
    codigo = (codigo || '').trim().toUpperCase();
    const lic = await validarLicencia(codigo);
    if (!lic) return { ok: false, msg: 'Licencia inválida.' };
    const r = await asegurarCuentaSeguraColab((usuario || '').trim(), pass, codigo);
    if (!r.ok) return { ok: false, msg: r.msg };
    setLicenseCode(codigo);
    localStorage.setItem('bella_codigo', codigo);
    const d = await cloudLoad(codigo);
    if (d) hydrate(d);
    return { ok: true };
  };

  const logout = () => {
    signOutGlobal();
    setCurrentUser(null);
    setLicenseCode('');
    localStorage.removeItem('bella_codigo');
  };

  // Auto-guardado en la nube (con debounce) cuando cambian los datos sincronizados
  useEffect(() => {
    if (!licenseCode || !currentUser || hydratingRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { cloudSave(licenseCode, snapshot()); }, 1200);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [tenants, services, products, collaborators, appointments, comments, salesHistory, categories, phonePrefix, biometricsEnabledUsers, licenseCode, currentUser]);

  // Restaurar código al abrir (si había sesión válida). No aplica en la vista pública.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('codigo')) return;
    const cod = localStorage.getItem('bella_codigo');
    if (cod && estaLogueado()) {
      setLicenseCode(cod);
      cloudLoad(cod).then((d) => { if (d) hydrate(d); });
    }
  }, []);

  // Vista pública por ?codigo=: carga la página del salón desde la nube + live-sync (30s).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('codigo') || params.get('local') || '').trim().toUpperCase();
    if (!code) return;
    setPublicCode(code);
    let lastVer = '';
    const cargar = async () => {
      const d = await bellaPublica(code);
      if (!d) return;
      const dd = d as any;
      hydratingRef.current = true;
      if (dd.tenants) { setTenants(dd.tenants); if (dd.tenants[0]) setActiveTenantState(dd.tenants[0]); }
      if (dd.services) setServices(dd.services);
      if (dd.products) setProducts(dd.products);
      if (dd.comments) setComments(dd.comments);
      setTimeout(() => { hydratingRef.current = false; }, 300);
    };
    cargar();
    const iv = setInterval(async () => {
      const ver = await bellaVersion(code);
      if (!ver || ver === lastVer) return;
      lastVer = ver;
      cargar();
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  // Panel: live-sync liviano (trae turnos/opiniones nuevas sin pisar lo que edita el admin).
  useEffect(() => {
    if (!licenseCode || !currentUser) return;
    let lastVer = '';
    const iv = setInterval(async () => {
      if (hydratingRef.current) return;
      const ver = await bellaVersion(licenseCode);
      if (!ver || ver === lastVer) return;
      lastVer = ver;
      const d = await cloudLoad(licenseCode);
      if (!d) return;
      const dd = d as any;
      hydratingRef.current = true;
      if (Array.isArray(dd.appointments)) {
        setAppointments((prev: any[]) => {
          const ids = new Set(prev.map((a) => a.id));
          const nuevos = dd.appointments.filter((a: any) => !ids.has(a.id));
          return nuevos.length ? [...nuevos, ...prev] : prev;
        });
      }
      if (Array.isArray(dd.comments)) {
        setComments((prev: any[]) => {
          const ids = new Set(prev.map((c) => c.id));
          const nuevos = dd.comments.filter((c: any) => !ids.has(c.id));
          return nuevos.length ? [...nuevos, ...prev] : prev;
        });
      }
      setTimeout(() => { hydratingRef.current = false; }, 300);
    }, 30000);
    return () => clearInterval(iv);
  }, [licenseCode, currentUser]);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      licenseCode,
      publicCode,
      loginDueno,
      loginColab,
      logout,
      activeTenant,
      setActiveTenant,
      tenants,
      setTenants,
      services,
      setServices,
      products,
      setProducts,
      collaborators,
      setCollaborators,
      appointments,
      setAppointments,
      comments,
      setComments,
      salesHistory,
      setSalesHistory,
      categories,
      setCategories,
      currentUser,
      setCurrentUser,
      pendingAccessRequests,
      setPendingAccessRequests,
      phonePrefix,
      setPhonePrefix,
      addAppointment,
      addComment,
      approveComment,
      rejectComment,
      addCollaborator,
      deleteCollaborator,
      editCollaborator,
      requestCollaboratorAccess,
      approveAccessRequest,
      denyAccessRequest,
      biometricsEnabledUsers,
      toggleBiometricsForUser,
      exportSalesSpreadsheet,
      downloadBackup,
      restoreBackup,
      updateTenantTheme,
      updateTenantDetails
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
