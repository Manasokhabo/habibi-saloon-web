import { Service, Review } from './types';

export const SALON_NAME = "Habibi Styling Saloon";
export const OWNER_WHATSAPP = "8240005330";
export const SALON_ADDRESS = "Plot 14, Royal Palm Avenue, Sector 62, Electronic City, Bangalore, 560100";

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Classic Habibi Haircut',
    price: 499,
    duration: '45 mins',
    description: 'Our signature precision haircut followed by royal styling and hair wash.',
    category: 'Hair',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's2',
    name: 'Sheikh Beard Shape',
    price: 299,
    duration: '30 mins',
    description: 'Detailed beard shaping with professional trimming and edging for a sharp look.',
    category: 'Beard',
    image: 'https://images.unsplash.com/photo-1621605815841-2c77d74421f1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's3',
    name: 'Habibi Gold Spa',
    price: 899,
    duration: '60 mins',
    description: 'Relaxing deep tissue scalp massage with premium oils and luxury steam treatment.',
    category: 'Spa',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's4',
    name: 'Oasis Facial',
    price: 649,
    duration: '40 mins',
    description: 'Skin rejuvenation treatment including deep exfoliation and mineral-rich masking.',
    category: 'Spa',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=400'
  }
];

export const PACKAGES: Service[] = [
  {
    id: 'p1',
    name: 'Sultan Grooming Combo',
    price: 1299,
    duration: '90 mins',
    description: 'The ultimate combo: classic haircut, beard styling, and a relaxing head massage.',
    category: 'Package',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p2',
    name: 'Desert Glow Package',
    price: 1499,
    duration: '100 mins',
    description: 'Premium haircut paired with our deep-cleansing facial for a refreshed radiance.',
    category: 'Package',
    image: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p3',
    name: 'Habibi Royal Wellness',
    price: 2499,
    duration: '150 mins',
    description: 'A total transformation: Haircut, beard spa, luxury facial, and deep scalp ritual.',
    category: 'Package',
    image: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&q=80&w=400'
  }
];

export const FALLBACK_REVIEWS: Review[] = [
  { id: 'r1', clientName: 'Aman Deep', comment: 'Best grooming experience in the city. The royal treatment is real!', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aman' },
  { id: 'r2', clientName: 'Sanjay Kumar', comment: 'The AI Stylist gave me the perfect recommendation. Love the new look!', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay' },
  { id: 'r3', clientName: 'Rahul V.', comment: 'Professional staff and luxury environment. Truly Habibi style!', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul' },
  { id: 'r4', clientName: 'Vikram Singh', comment: 'Incredible attention to detail. The beard shaping is world-class.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
  { id: 'r5', clientName: 'Arjun Mehta', comment: 'The Sultan package is worth every rupee. Felt like royalty.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' },
  { id: 'r6', clientName: 'Pritam S.', comment: 'Clean, modern, and high-tech. Best saloon I have visited.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pritam' },
  { id: 'r7', clientName: 'Rohan Das', comment: 'Absolute masters of the fade. The vibe here is unbeatable.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { id: 'r8', clientName: 'Sameer Khan', comment: 'Precision like no other. They really take their time to get it right.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sameer' },
  { id: 'r9', clientName: 'Kunal Singh', comment: 'Great service and friendly staff. Highly recommended for premium grooming.', rating: 5, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kunal' }
];

export const TIMESLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', 
  '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
];