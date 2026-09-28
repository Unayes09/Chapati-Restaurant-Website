import React from 'react';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
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
