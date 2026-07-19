/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tenant, Service, Product, Collaborator, Comment, Appointment, SaleRecord } from '../types';

export const initialTenants: Tenant[] = [
  {
    id: 'bella-vista',
    name: 'BellaVista Estética',
    tagline: 'Tratamientos de vanguardia para resaltar tu bienestar y elegancia natural.',
    logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=200',
    address: 'Av. del Libertador 1450, Buenos Aires, Argentina',
    locationUrl: 'https://maps.google.com/?q=Av.+del+Libertador+1450,+Buenos+Aires',
    phonePrefix: '+549',
    rating: 4.9,
    phone: '11 5544-3322',
    workingDays: 'Lunes a Sábado',
    workingHours: '09:00 a 20:00 hs'
  },
  {
    id: 'glow-studio',
    name: 'Glow Studio',
    tagline: 'El arte de cuidar tu piel y relajar tu mente en un ambiente exclusivo.',
    logo: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=200',
    address: 'Calle Serrano 45, Madrid, España',
    locationUrl: 'https://maps.google.com/?q=Calle+Serrano+45,+Madrid',
    phonePrefix: '+34',
    rating: 4.8,
    phone: '911 234 567',
    workingDays: 'Lunes a Viernes',
    workingHours: '10:00 a 19:00 hs'
  }
];

export const initialServices: Service[] = [
  {
    id: 'facial-gold',
    nameEs: 'Limpieza Facial Profunda Gold',
    nameEn: 'Deep Gold Facial Cleansing',
    descriptionEs: 'Tratamiento rejuvenecedor con mascarilla de oro coloidal, exfoliación ultrasónica e hidratación profunda.',
    descriptionEn: 'Rejuvenating treatment with colloidal gold mask, ultrasonic exfoliation, and deep hydration.',
    price: 45000,
    durationMinutes: 60,
    category: 'facial',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'massage-relax',
    nameEs: 'Masaje Descontracturante & Piedras Calientes',
    nameEn: 'Relaxing Decontracting Massage & Hot Stones',
    descriptionEs: 'Terapia corporal completa con aceites esenciales orgánicos y piedras volcánicas calientes para liberar tensiones.',
    descriptionEn: 'Full body therapy with organic essential oils and hot volcanic stones to release muscle tension.',
    price: 52000,
    durationMinutes: 75,
    category: 'corporal',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'unas-sculpt',
    nameEs: 'Esculpidas en Gel Premium + Nail Art',
    nameEn: 'Premium Sculpted Gel Nails + Nail Art',
    descriptionEs: 'Manicuría de primer nivel con extensión en gel esculpido, esmaltado semipermanente y diseños personalizados.',
    descriptionEn: 'First-class manicure with sculpted gel extension, semi-permanent polish, and personalized designs.',
    price: 28000,
    durationMinutes: 90,
    category: 'unas',
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'lashes-lifting',
    nameEs: 'Lifting de Pestañas + Nutrición Queratina',
    nameEn: 'Lash Lift & Keratin Nourishment',
    descriptionEs: 'Curvatura natural de tus propias pestañas desde la raíz con aplicación de tinte y shock de queratina protectora.',
    descriptionEn: 'Natural curvature of your lashes from the root with tint application and protective keratin shock.',
    price: 22000,
    durationMinutes: 45,
    category: 'facial',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'makeup-social',
    nameEs: 'Maquillaje Social de Alta Definición (HD)',
    nameEn: 'High Definition (HD) Social Makeup',
    descriptionEs: 'Preparación de piel y maquillaje profesional ideal para eventos especiales, con productos premium de larga duración.',
    descriptionEn: 'Skin preparation and professional makeup ideal for special events, using long-lasting premium products.',
    price: 35000,
    durationMinutes: 60,
    category: 'maquillaje',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=500'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'serum-vitc',
    nameEs: 'Sérum Iluminador Vitamina C 15%',
    nameEn: 'Illuminating Vitamin C 15% Serum',
    descriptionEs: 'Potente antioxidante que unifica el tono de la piel, aporta luminosidad extrema y estimula el colágeno.',
    descriptionEn: 'Powerful antioxidant that evens out skin tone, provides extreme radiance, and stimulates collagen.',
    price: 18500,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'cream-hyaluronic',
    nameEs: 'Crema Hidratante Multipéptidos & Ácido Hialurónico',
    nameEn: 'Multipeptide & Hyaluronic Acid Moisturizer',
    descriptionEs: 'Fórmula ultra hidratante de rápida absorción que rellena líneas de expresión y restaura la barrera cutánea.',
    descriptionEn: 'Ultra-hydrating, fast-absorbing formula that plumps fine lines and restores the skin barrier.',
    price: 24000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=300'
  },
  {
    id: 'oil-argan',
    nameEs: 'Aceite de Argán Orgánico Elixir Corporal',
    nameEn: 'Organic Argan Oil Body Elixir',
    descriptionEs: 'Aceite 100% puro prensado en frío, ideal para nutrir intensamente la piel corporal seca y aportar brillo sedoso.',
    descriptionEn: '100% pure cold-pressed oil, ideal for deeply nourishing dry skin and adding silky radiance.',
    price: 16200,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=300'
  }
];

export const initialCollaborators: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'Sofía Martínez',
    phone: '1154889922',
    username: 'sofia',
    password: '123',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
    status: 'approved',
    biometricsEnabled: true,
    servicesCompleted: 24,
    revenueGenerated: 840000
  },
  {
    id: 'collab-2',
    name: 'Lucas Gómez',
    phone: '1165338877',
    username: 'lucas',
    password: '123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    status: 'approved',
    biometricsEnabled: false,
    servicesCompleted: 15,
    revenueGenerated: 495000
  },
  {
    id: 'collab-3',
    name: 'Valentina Rossi',
    phone: '1172883344',
    username: 'valentina',
    password: '123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    status: 'approved',
    biometricsEnabled: true,
    servicesCompleted: 31,
    revenueGenerated: 920000
  }
];

export const initialComments: Comment[] = [
  {
    id: 'comment-1',
    tenantId: 'bella-vista',
    clientName: 'María Eugenia Rossi',
    text: 'La limpieza facial gold me dejó la piel súper luminosa y suave. El ambiente es increíblemente relajante, ¡recomiendo un 100%!',
    rating: 5,
    date: '2026-07-15',
    approved: true
  },
  {
    id: 'comment-2',
    tenantId: 'bella-vista',
    clientName: 'Fernando Soler',
    text: 'Increíble el masaje descontracturante con piedras calientes de Lucas. Salí como nuevo, una atención de primer nivel.',
    rating: 5,
    date: '2026-07-16',
    approved: true
  },
  {
    id: 'comment-3',
    tenantId: 'bella-vista',
    clientName: 'Carla Benítez',
    text: 'Me encantaron las uñas en gel esculpido que me hizo Sofía. Diseños muy delicados y hermosos.',
    rating: 5,
    date: '2026-07-18',
    approved: true
  },
  {
    id: 'comment-pending-1',
    tenantId: 'bella-vista',
    clientName: 'Gabriela Díaz',
    text: '¿Tienen disponibilidad los sábados por la tarde? Me gustaría agendar el lifting de pestañas.',
    rating: 4,
    date: '2026-07-19',
    approved: false
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'appt-1',
    tenantId: 'bella-vista',
    serviceId: 'facial-gold',
    collaboratorId: 'collab-1',
    date: '2026-07-19',
    time: '10:00',
    clientName: 'Natalia Ortega',
    clientPhone: '1145332211',
    status: 'completed',
    price: 45000
  },
  {
    id: 'appt-2',
    tenantId: 'bella-vista',
    serviceId: 'massage-relax',
    collaboratorId: 'collab-2',
    date: '2026-07-19',
    time: '11:30',
    clientName: 'Roberto Paz',
    clientPhone: '1198442233',
    status: 'completed',
    price: 52000
  },
  {
    id: 'appt-3',
    tenantId: 'bella-vista',
    serviceId: 'unas-sculpt',
    collaboratorId: 'collab-3',
    date: '2026-07-20',
    time: '15:00',
    clientName: 'Jimena Castro',
    clientPhone: '1133221144',
    status: 'pending',
    price: 28000
  },
  {
    id: 'appt-4',
    tenantId: 'bella-vista',
    serviceId: 'lashes-lifting',
    collaboratorId: 'collab-1',
    date: '2026-07-21',
    time: '09:00',
    clientName: 'Anabella Domínguez',
    clientPhone: '1155443322',
    status: 'pending',
    price: 22000
  }
];

export const initialSalesHistory: SaleRecord[] = [
  {
    id: 'sale-1',
    date: '2026-07-19 10:00',
    itemType: 'service',
    itemNameEs: 'Limpieza Facial Profunda Gold',
    itemNameEn: 'Deep Gold Facial Cleansing',
    price: 45000,
    completedBy: 'Sofía Martínez'
  },
  {
    id: 'sale-2',
    date: '2026-07-19 11:30',
    itemType: 'service',
    itemNameEs: 'Masaje Descontracturante & Piedras Calientes',
    itemNameEn: 'Relaxing Decontracting Massage & Hot Stones',
    price: 52000,
    completedBy: 'Lucas Gómez'
  },
  {
    id: 'sale-3',
    date: '2026-07-18 16:45',
    itemType: 'product',
    itemNameEs: 'Sérum Iluminador Vitamina C 15%',
    itemNameEn: 'Illuminating Vitamin C 15% Serum',
    price: 18500,
    completedBy: 'Admin'
  },
  {
    id: 'sale-4',
    date: '2026-07-17 14:20',
    itemType: 'product',
    itemNameEs: 'Crema Hidratante Multipéptidos & Ácido Hialurónico',
    itemNameEn: 'Multipeptide & Hyaluronic Acid Moisturizer',
    price: 24000,
    completedBy: 'Sofía Martínez'
  }
];
