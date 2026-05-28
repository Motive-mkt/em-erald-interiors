/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SplashGate } from './components/SplashGate';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Contact, Footer } from './components/Contact';
import { AdminPanel } from './components/AdminPanel';
import { 
  db, 
  fetchSiteConfig, 
  fetchServices, 
  fetchGalleryItems,
  SiteConfigDocument,
  ServiceDocument,
  GalleryDocument,
  DEFAULT_CONFIG,
  DEFAULT_SERVICES,
  DEFAULT_GALLERY
} from './lib/firebase';
import { onSnapshot, doc, collection, deleteDoc } from 'firebase/firestore';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // Enterprise Database States
  const [config, setConfig] = useState<SiteConfigDocument | null>(null);
  const [services, setServices] = useState<ServiceDocument[]>([]);
  const [gallery, setGallery] = useState<GalleryDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronize Firestore Elements instantly using Live Document Snapshots
  useEffect(() => {
    // 1. Listen config
    const unsubConfig = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as SiteConfigDocument);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    });

    // 2. Listen services
    const unsubServices = onSnapshot(collection(db, "services"), (snap) => {
      if (!snap.empty) {
        const list: ServiceDocument[] = [];
        snap.forEach((d) => {
          list.push(d.data() as ServiceDocument);
        });
        setServices(list.sort((a,b) => (a.order || 0) - (b.order || 0)));
      } else {
        setServices(DEFAULT_SERVICES);
      }
    });

    // 3. Listen gallery items
    const unsubGallery = onSnapshot(collection(db, "gallery"), (snap) => {
      if (!snap.empty) {
        const list: GalleryDocument[] = [];
        snap.forEach((d) => {
          const item = d.data() as GalleryDocument;
          const isSeededId = ["img-1", "img-2", "img-3", "img-4", "img-5"].includes(d.id || item.id);
          const isSeededUrl = ["serene_bedroom", "sage_dining_room", "modern_home_office", "reading_nook", "kitchen_styling"].includes(item.url);
          if (isSeededId || isSeededUrl) {
            deleteDoc(doc(db, "gallery", d.id)).catch((e) => console.error("Error cleaning seeded gallery item:", e));
          } else {
            list.push({ id: d.id, ...item });
          }
        });
        setGallery(list);
      } else {
        setGallery(DEFAULT_GALLERY);
      }
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubServices();
      unsubGallery();
    };
  }, []);

  return (
    <main className="min-h-screen bg-cream selection:bg-terracotta/30 snap-y snap-proximity overflow-y-auto">
      <SplashGate />
      
      <Hero 
        config={config} 
        onOpenAdmin={() => setIsAdminOpen(true)} 
      />
      
      <div id="main-content">
        <Services 
          services={services} 
          onSelectService={(serviceTitle) => setSelectedService(serviceTitle)} 
        />
        
        <Gallery 
          items={gallery} 
        />
        
        <Testimonials />
        
        <Contact 
          config={config}
          services={services}
          selectedService={selectedService}
          setSelectedService={(serviceTitle) => setSelectedService(serviceTitle)}
        />
      </div>
      
      <Footer />

      {/* Admin Panel Modal Overlay */}
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)}
      />
    </main>
  );
}
