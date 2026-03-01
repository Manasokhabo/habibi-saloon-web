import { Service, Review } from './types';

export const SALON_NAME = "Ganapati Telecom";
export const OWNER_WHATSAPP = "8240005330";
export const SALON_ADDRESS = "Infrastructure Supply & Road Safety Solutions, India";

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Concrete Mixer Machine',
    price: 75000,
    duration: 'Per Unit',
    description: 'Heavy-duty concrete mixer machine designed for efficient on-site construction and high-performance material blending.',
    category: 'Construction Machinery',
    image: 'https://images.unsplash.com/photo-1581091870627-3a7d9d7f3c52?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's2',
    name: 'Rock Drill Machine',
    price: 120000,
    duration: 'Per Unit',
    description: 'High-performance rock drill machine suitable for mining, road cutting, and infrastructure foundation work.',
    category: 'Construction Machinery',
    image: 'https://images.unsplash.com/photo-1541976076758-347942db1977?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's3',
    name: 'W-Beam Crash Barrier',
    price: 2100,
    duration: 'Per Meter',
    description: 'Galvanized W-beam crash barrier system engineered for maximum highway impact resistance and road safety compliance.',
    category: 'Road Safety Equipment',
    image: 'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's4',
    name: 'uPVC Pipes',
    price: 350,
    duration: 'Per Length',
    description: 'Durable, corrosion-resistant unplasticized PVC pipes suitable for drainage, industrial, and structural applications.',
    category: 'Industrial Materials',
    image: 'https://images.unsplash.com/photo-1581093588401-22d72b3d4a7a?auto=format&fit=crop&q=80&w=400'
  }
];

export const PACKAGES: Service[] = [
  {
    id: 'p1',
    name: 'Highway Safety Package',
    price: 500000,
    duration: 'Project Based',
    description: 'Complete road safety solution including W-beam crash barriers, guardrails, and installation support for highway development.',
    category: 'Infrastructure Package',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p2',
    name: 'Construction Equipment Bundle',
    price: 850000,
    duration: 'Project Based',
    description: 'Comprehensive construction machinery bundle including concrete mixer, vibrating equipment, and drill systems.',
    category: 'Infrastructure Package',
    image: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p3',
    name: 'Industrial Supply Package',
    price: 300000,
    duration: 'Bulk Supply',
    description: 'Bulk supply of uPVC pipes, MS angle structures, and interlink chains for industrial and structural applications.',
    category: 'Infrastructure Package',
    image: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&q=80&w=400'
  }
];

export const FALLBACK_REVIEWS: Review[] = [
  { id: 'r1', clientName: 'A.K. Infrastructure Pvt Ltd', comment: 'Reliable supplier with consistent product quality and timely delivery.', rating: 5, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=AK' },
  { id: 'r2', clientName: 'Highway Development Corp', comment: 'Crash barrier materials met all required safety standards. Highly professional service.', rating: 5, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=HD' },
  { id: 'r3', clientName: 'Eastern Civil Projects', comment: 'Strong sourcing capability and competitive pricing. A dependable partner.', rating: 5, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=EC' },
  { id: 'r4', clientName: 'Urban Road Builders', comment: 'Excellent coordination and timely project material supply.', rating: 5, avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=UR' }
];

export const TIMESLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', 
  '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
];
