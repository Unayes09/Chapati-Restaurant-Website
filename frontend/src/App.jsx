import React from 'react';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Concept from './components/Concept';
import Menu from './components/Menu';
import Testimonials from './components/Testimonials';
import Partners from './components/Partners';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="app">
        <Navbar />
        <main>
          <Hero />
          <Concept />
          <Menu />
          <Testimonials />
          <Partners />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}

export default App;
