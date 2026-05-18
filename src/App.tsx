/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SplashGate } from './components/SplashGate';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Contact, Footer } from './components/Contact';

export default function App() {
  return (
    <main className="min-h-screen bg-cream selection:bg-terracotta/30 snap-y snap-proximity overflow-y-auto">
      <SplashGate />
      <Hero />
      <div id="main-content">
        <Services />
        <Gallery />
        <Testimonials />
        <Contact />
      </div>
      <Footer />
    </main>
  );
}

