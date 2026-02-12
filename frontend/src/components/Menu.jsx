import React from 'react';
import { useLanguage } from '../LanguageContext';

const Menu = () => {
  const { t } = useLanguage();

  return (
    <section className="menu" id="menu">
      <div className="menu-overlay">
        <div className="container">
          <div className="menu-header text-center">
            <span className="label">{t.menu.label}</span>
            <h2>{t.menu.title}</h2>
            <h3>{t.menu.subtitle}</h3>
            <p>{t.menu.description}</p>
          </div>

          <div className="menu-categories text-center">
            <h4>{t.menu.categories.main}</h4>
            <p className="sub-label">{t.menu.categories.sub}</p>
          </div>

          <div className="menu-grid">
            {t.menu.items.map((item, index) => (
              <div key={index} className="menu-card">
                <div className="menu-card-image">
                  <img src={`https://images.unsplash.com/photo-${index === 0 ? '1585937421612-70a008356fbe' : index === 1 ? '1604329760661-e71dc83f8f26' : '1585032226651-759b368d7246'}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} alt={item.title} />
                </div>
                <div className="menu-card-content">
                  <h4>{item.title}</h4>
                  <button className="btn-primary">{item.button}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Menu;
