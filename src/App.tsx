/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SplashGate } from './components/SplashGate';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Contact, Footer } from './components/Contact';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';
import { 
  db, 
  SiteConfigDocument,
  ServiceDocument,
  GalleryDocument,
  DEFAULT_CONFIG,
  DEFAULT_SERVICES,
  DEFAULT_GALLERY
} from './lib/firebase';
import { onSnapshot, doc, collection, deleteDoc, updateDoc } from 'firebase/firestore';

function AppRoutes() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState('');

  // Enterprise Database States
  const [config, setConfig] = useState<SiteConfigDocument | null>(null);
  const [services, setServices] = useState<ServiceDocument[]>([]);
  const [gallery, setGallery] = useState<GalleryDocument[]>([]);
  const [, setLoading] = useState(true);

  // Synchronize Firestore Elements instantly using Live Document Snapshots
  useEffect(() => {
    // 1. Listen config
    const unsubConfig = onSnapshot(doc(db, "config", "general"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteConfigDocument;
        setConfig(data);
        
        // One-time check to clear any pre-loaded legacy logo from the database
        if (localStorage.getItem('emerald_logo_cleared_v2') !== 'true') {
          if (data.logoUrl) {
            updateDoc(doc(db, "config", "general"), { logoUrl: "" })
              .then(() => {
                console.log("One-time cleanup: Cleared remote legacy logo URL so the owner can configure it themselves.");
                localStorage.setItem('emerald_logo_cleared_v2', 'true');
              })
              .catch((err) => {
                console.error("Failed to clear remote legacy logo:", err);
              });
          } else {
            localStorage.setItem('emerald_logo_cleared_v2', 'true');
          }
        }
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
    <Routes>
      <Route 
        path="/" 
        element={
          <main className="min-h-screen bg-cream selection:bg-terracotta/30 snap-y snap-proximity overflow-y-auto">
            <SplashGate />
            
            <Hero 
              config={config} 
              onOpenAdmin={() => navigate('/admin')} 
            />
            
            <div id="main-content">
              <Services 
                config={config}
                services={services} 
                onSelectService={(serviceTitle) => setSelectedService(serviceTitle)} 
              />
              
              <Gallery 
                config={config}
                items={gallery} 
              />
              
              <Testimonials 
                config={config}
              />
              
              <Contact 
                config={config}
                services={services}
                selectedService={selectedService}
                setSelectedService={(serviceTitle) => setSelectedService(serviceTitle)}
              />
            </div>
            
            <Footer />
          </main>
        } 
      />

      <Route 
        path="/admin" 
        element={
          <AdminPanel 
            isOpen={true} 
            onClose={() => navigate('/')} 
          />
        } 
      />

      <Route 
        path="/profile" 
        element={
          <Profile />
        } 
      />

      {/* Fallback redirects to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
