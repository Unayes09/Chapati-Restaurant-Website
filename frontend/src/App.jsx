import React from 'react';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import Testimonials from './components/Testimonials';
import Partners from './components/Partners';
import Footer from './components/Footer';
import ClosedDayBanner from './components/ClosedDayBanner';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="app">
        <ClosedDayBanner />
        <Navbar />
        <main>
          <Landing />
          <Testimonials />
          <Partners />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

export default App;
