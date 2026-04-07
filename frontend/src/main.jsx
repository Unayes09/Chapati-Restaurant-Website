import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FullMenu from './components/FullMenu';
import OrderPage from './components/OrderPage';
import ReservationPage from './components/ReservationPage';

const params = new URLSearchParams(window.location.search);
const page = params.get('page');

let Root;

if (page === 'fullmenu') {
  Root = (
    <LanguageProvider>
      <div className="app">
        <Navbar />
        <main>
          <FullMenu />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
} else if (page === 'order') {
  Root = (
    <LanguageProvider>
      <div className="app">
        <Navbar />
        <main>
          <OrderPage />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
} else if (page === 'reservation') {
  Root = (
    <LanguageProvider>
      <div className="app">
        <Navbar />
        <main>
          <ReservationPage />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
} else {
  Root = <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {Root}
  </StrictMode>,
);
