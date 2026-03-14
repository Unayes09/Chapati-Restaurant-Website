import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../LanguageContext';

const FullMenu = () => {
  const { lang } = useLanguage();
  const isFr = lang === 'fr';

  const [cart, setCart] = useState({});
  const [coveredSections, setCoveredSections] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('all');
  const menuGridRef = useRef(null);
  const [sagorikaStarter, setSagorikaStarter] = useState('onion-bhaji');
  const [sagorikaMain, setSagorikaMain] = useState('curry');
  const [sagorikaMainDish, setSagorikaMainDish] = useState('chicken-curry');
  const [sagorikaIsLamb, setSagorikaIsLamb] = useState(false);
  const [sagorikaDessert, setSagorikaDessert] = useState('halwa');
  const [naan1495Choice, setNaan1495Choice] = useState('fried-naan');
  const [naan1595Choice, setNaan1595Choice] = useState('chapati-special');

  const categories = useMemo(() => [
    { id: 'all', fr: 'Tout', en: 'All' },
    { id: 'menus', fr: 'Menus', en: 'Menus' },
    { id: 'starters', fr: 'Entrées', en: 'Starters' },
    { id: 'curries', fr: 'Currys', en: 'Curries' },
    { id: 'biryani', fr: 'Biryani', en: 'Biryani' },
    { id: 'vegetarian', fr: 'Végétarien', en: 'Vegetarian' },
    { id: 'naan', fr: 'Naan', en: 'Naan' },
    { id: 'sandwiches', fr: 'Sandwichs', en: 'Sandwiches' },
    { id: 'grills', fr: 'Grillades', en: 'Grills' },
    { id: 'desserts', fr: 'Desserts', en: 'Desserts' },
    { id: 'drinks', fr: 'Boissons', en: 'Drinks' },
  ], []);

  const showSection = (catId) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'menus') return ['menu-sagorika', 'menu-naan-sandwich'].includes(catId);
    if (activeFilter === 'starters') return ['starters', 'sides'].includes(catId);
    if (activeFilter === 'curries') return ['curries', 'specialty-curries'].includes(catId);
    if (activeFilter === 'sandwiches') return ['naan-sandwiches', 'tenders'].includes(catId);
    if (activeFilter === 'drinks') return ['drinks', 'jomo', 'coffee'].includes(catId);
    if (activeFilter === 'vegetarian') return catId === 'vegetarian-vegan';
    return activeFilter === catId;
  };

  useEffect(() => {
    // Scroll to hash with offset
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          const yOffset = -120; // Accounts for sticky navbar and stacking
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 150);
      }
    }

    let rafId;

    // Detect covered sections on mobile
    const handleScroll = () => {
      if (window.innerWidth > 768) {
        if (coveredSections.size > 0) setCoveredSections(new Set());
        return;
      }

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Find ALL sections, but only those that are NOT hidden by filter
        const allSections = Array.from(menuGridRef.current?.querySelectorAll('.full-menu-section') || []);
        const visibleSections = allSections.filter(section => {
          // Check if the section is currently visible (not display: none)
          return window.getComputedStyle(section).display !== 'none';
        });

        // If only one or zero sections are visible, no blur needed
        if (visibleSections.length <= 1) {
          if (coveredSections.size > 0) setCoveredSections(new Set());
          return;
        }

        const newCovered = new Set();
        visibleSections.forEach((section, index) => {
          const nextSection = visibleSections[index + 1];
          if (nextSection) {
            const nextRect = nextSection.getBoundingClientRect();
            // Trigger blur if the next section has reached the sticky threshold
            // 90px (top offset) + buffer
            if (nextRect.top <= 140) { 
              newCovered.add(section.id || `section-${index}`);
            }
          }
        });

        // Only update state if set has changed to avoid unnecessary re-renders
        setCoveredSections(prev => {
          if (prev.size === newCovered.size && [...prev].every(id => newCovered.has(id))) {
            return prev;
          }
          return newCovered;
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [activeFilter, coveredSections.size]); // Re-run when filter changes to update visibility check

  const toggleItem = (id, label, price) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { id, label, price, qty: 1 };
      }
      return next;
    });
  };

  const upsertItem = (id, label, price) => {
    setCart((prev) => {
      const existing = prev[id];
      if (existing && existing.label === label && existing.price === price) return prev;
      return { ...prev, [id]: { id, label, price, qty: 1 } };
    });
  };

  const removeItem = (id) => {
    setCart((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const sagorikaStarterOptions = useMemo(
    () => [
      { value: 'onion-bhaji', fr: 'Onion Bhaji', en: 'Onion Bhaji' },
      { value: 'chicken-tikka', fr: 'Chicken Tikka', en: 'Chicken Tikka' },
    ],
    [],
  );

  const sagorikaMainOptions = useMemo(
    () => [
      { value: 'curry', fr: 'Curry (au choix)', en: 'Curry (your choice)' },
      { value: 'special-curry', fr: 'Curry spécial (au choix)', en: 'Special Curry (your choice)' },
    ],
    [],
  );

  const sagorikaCurries = useMemo(
    () => [
      { value: 'chicken-curry', fr: 'Chicken Curry', en: 'Chicken Curry' },
      { value: 'lamb-curry', fr: 'Lamb Curry', en: 'Lamb Curry' },
      { value: 'chicken-korma', fr: 'Chicken Korma', en: 'Chicken Korma' },
      { value: 'lamb-korma', fr: 'Lamb Korma', en: 'Lamb Korma' },
      { value: 'chicken-dhansak', fr: 'Chicken Dhansak', en: 'Chicken Dhansak' },
      { value: 'lamb-dhansak', fr: 'Lamb Dhansak', en: 'Lamb Dhansak' },
    ],
    [],
  );

  const sagorikaSpecialCurries = useMemo(
    () => [
      { value: 'butter-chicken', fr: 'Butter Chicken', en: 'Butter Chicken' },
      { value: 'chicken-tikka-masala', fr: 'Chicken Tikka Masala', en: 'Chicken Tikka Masala' },
      { value: 'lamb-tikka-masala', fr: 'Lamb Tikka Masala', en: 'Lamb Tikka Masala' },
      { value: 'chicken-jalfrezi', fr: 'Chicken Jalfrezi', en: 'Chicken Jalfrezi' },
      { value: 'lamb-jalfrezi', fr: 'Lamb Jalfrezi', en: 'Lamb Jalfrezi' },
      { value: 'chicken-balti', fr: 'Chicken Balti', en: 'Chicken Balti' },
      { value: 'lamb-balti', fr: 'Lamb Balti', en: 'Lamb Balti' },
    ],
    [],
  );

  const getSagorikaMainDishOptions = (mainValue, isLambValue) => {
    const base = mainValue === 'special-curry' ? sagorikaSpecialCurries : sagorikaCurries;
    if (isLambValue) return base;
    return base.filter((opt) => !opt.value.startsWith('lamb-'));
  };

  const sagorikaDessertOptions = useMemo(
    () => [
      { value: 'halwa', fr: 'Halwa', en: 'Halwa' },
      { value: 'mango-lassi', fr: 'Mango Lassi', en: 'Mango Lassi' },
      { value: 'rose-lassi', fr: 'Rose Lassi', en: 'Rose Lassi' },
      { value: 'nutella-naan', fr: 'Nutella Naan', en: 'Nutella Naan' },
      { value: 'dessert-of-the-day', fr: 'Dessert du jour', en: 'Dessert of the Day' },
    ],
    [],
  );

  const buildSagorikaLabel = (starterValue, mainValue, mainDishValue, isLambValue, dessertValue) => {
    const starterLabel = sagorikaStarterOptions.find((o) => o.value === starterValue)?.[isFr ? 'fr' : 'en'] || '';
    const mainLabel = sagorikaMainOptions.find((o) => o.value === mainValue)?.[isFr ? 'fr' : 'en'] || '';
    const mainDishOptions = getSagorikaMainDishOptions(mainValue, isLambValue);
    const mainDishLabel = mainDishOptions.find((o) => o.value === mainDishValue)?.[isFr ? 'fr' : 'en'] || '';
    const dessertLabel = sagorikaDessertOptions.find((o) => o.value === dessertValue)?.[isFr ? 'fr' : 'en'] || '';
    const optionPart = isLambValue ? `, ${isFr ? 'Option: Agneau +2€' : 'Option: Lamb +€2'}` : '';
    return isFr
      ? `Menu Sagorika (Entrée: ${starterLabel}, Plat: ${mainLabel} – ${mainDishLabel}${optionPart}, Dessert: ${dessertLabel})`
      : `Menu Sagorika (Starter: ${starterLabel}, Main: ${mainLabel} – ${mainDishLabel}${optionPart}, Dessert: ${dessertLabel})`;
  };

  const getSagorikaPrice = (isLambValue) => 24.9 + (isLambValue ? 2 : 0);

  const sagorikaLabel = buildSagorikaLabel(sagorikaStarter, sagorikaMain, sagorikaMainDish, sagorikaIsLamb, sagorikaDessert);
  const sagorikaPrice = getSagorikaPrice(sagorikaIsLamb);

  const naan1495Options = useMemo(
    () => [
      { value: 'fried-naan', fr: 'Fried Naan', en: 'Fried Naan' },
      { value: 'vegetable-naan', fr: 'Vegetable Naan', en: 'Vegetable Naan' },
    ],
    [],
  );

  const naan1595Options = useMemo(
    () => [
      { value: 'chapati-special', fr: 'Chapati Special', en: 'Chapati Special' },
      { value: 'curry-tikka-naan', fr: 'Curry Tikka Naan', en: 'Curry Tikka Naan' },
    ],
    [],
  );

  const naan1495Label = useMemo(() => {
    const choiceLabel = naan1495Options.find((o) => o.value === naan1495Choice)?.[isFr ? 'fr' : 'en'] || '';
    return isFr
      ? `Menu Naan Sandwich (14,95€) – ${choiceLabel}`
      : `Naan Sandwich Menu (€14.95) – ${choiceLabel}`;
  }, [isFr, naan1495Choice, naan1495Options]);

  const naan1595Label = useMemo(() => {
    const choiceLabel = naan1595Options.find((o) => o.value === naan1595Choice)?.[isFr ? 'fr' : 'en'] || '';
    return isFr
      ? `Menu Naan Sandwich (15,95€) – ${choiceLabel}`
      : `Naan Sandwich Menu (€15.95) – ${choiceLabel}`;
  }, [isFr, naan1595Choice, naan1595Options]);

  const totalItems = useMemo(
    () =>
      Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0),
    [cart],
  );

  const handleOrder = () => {
    const items = Object.values(cart).filter((item) => item.qty > 0);
    if (!items.length) return;
    localStorage.setItem('chapatiOrder', JSON.stringify(items));
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'order');
    window.location.href = url.toString();
  };

  return (
    <section className="full-menu" id="full-menu">
      <div className="container full-menu-container">
        <h2 className="full-menu-title">
          {isFr ? 'Carte complète' : 'Full Menu'}
        </h2>
        <p className="full-menu-subtitle">
          {isFr
            ? 'Découvrez l’ensemble de nos plats inspirés de la street food indienne.'
            : 'Discover all our dishes inspired by traditional Indian street food.'}
        </p>

        <div className="full-menu-toolbar">
          <div className="full-menu-filter-container">
            <div className="full-menu-filter-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M7 12H17M11 18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <select 
              className="full-menu-category-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {isFr ? cat.fr : cat.en}
                </option>
              ))}
            </select>
          </div>
          <button
            className="full-menu-order-button"
            disabled={totalItems === 0}
            onClick={handleOrder}
          >
            {isFr
              ? totalItems === 0
                ? 'Commander'
                : `Commander (${totalItems})`
              : totalItems === 0
                ? 'Order'
                : `Order (${totalItems})`}
          </button>
        </div>

        <div ref={menuGridRef}>
          <div className="full-menu-highlight-row">
            {showSection('menu-sagorika') && (
            <div className={`full-menu-section full-menu-highlight ${coveredSections.has('menu-sagorika') ? 'is-covered' : ''}`} id="menu-sagorika">
              <div className="full-menu-item-header">
                <span className="full-menu-section-title">
                  {isFr ? 'MENU SAGORIKA – 24,90 €' : 'MENU SAGORIKA – €24.90'}
                </span>
              </div>
              <p className="full-menu-note">
                {isFr ? 'Entrée + Plat + Dessert' : 'Starter + Main Course + Dessert'}
              </p>

              <div className="full-menu-bundle-controls">
                <div className="full-menu-bundle-row">
                  <span className="full-menu-bundle-label">{isFr ? 'Entrée *' : 'Starter *'}</span>
                  <select
                    className="full-menu-bundle-select"
                    value={sagorikaStarter}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSagorikaStarter(nextValue);
                      if (cart['menu-sagorika']) {
                        upsertItem(
                          'menu-sagorika',
                          buildSagorikaLabel(nextValue, sagorikaMain, sagorikaMainDish, sagorikaIsLamb, sagorikaDessert),
                          getSagorikaPrice(sagorikaIsLamb),
                        );
                      }
                    }}
                  >
                    {sagorikaStarterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isFr ? opt.fr : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="full-menu-bundle-row">
                  <span className="full-menu-bundle-label">{isFr ? 'Plat *' : 'Main *'}</span>
                  <select
                    className="full-menu-bundle-select"
                    value={sagorikaMain}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSagorikaMain(nextValue);
                      const nextOptions = getSagorikaMainDishOptions(nextValue, sagorikaIsLamb);
                      const nextDish = nextOptions[0]?.value || '';
                      setSagorikaMainDish(nextDish);
                      if (cart['menu-sagorika']) {
                        upsertItem(
                          'menu-sagorika',
                          buildSagorikaLabel(sagorikaStarter, nextValue, nextDish, sagorikaIsLamb, sagorikaDessert),
                          getSagorikaPrice(sagorikaIsLamb),
                        );
                      }
                    }}
                  >
                    {sagorikaMainOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isFr ? opt.fr : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="full-menu-bundle-checkbox">
                  <input
                    type="checkbox"
                    checked={sagorikaIsLamb}
                    onChange={(e) => {
                      const nextValue = e.target.checked;
                      setSagorikaIsLamb(nextValue);
                      const nextOptions = getSagorikaMainDishOptions(sagorikaMain, nextValue);
                      const nextDish = nextOptions.some((o) => o.value === sagorikaMainDish)
                        ? sagorikaMainDish
                        : (nextOptions[0]?.value || '');
                      setSagorikaMainDish(nextDish);
                      if (cart['menu-sagorika']) {
                        upsertItem(
                          'menu-sagorika',
                          buildSagorikaLabel(sagorikaStarter, sagorikaMain, nextDish, nextValue, sagorikaDessert),
                          getSagorikaPrice(nextValue),
                        );
                      }
                    }}
                  />
                  <span>{isFr ? 'Option agneau (+2€)' : 'Lamb option (+€2)'}</span>
                </label>

                <div className="full-menu-bundle-row">
                  <span className="full-menu-bundle-label">
                    {sagorikaMain === 'special-curry'
                      ? (isFr ? 'Curry spécial *' : 'Special curry *')
                      : (isFr ? 'Curry *' : 'Curry *')}
                  </span>
                  <select
                    className="full-menu-bundle-select"
                    value={sagorikaMainDish}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSagorikaMainDish(nextValue);
                      if (cart['menu-sagorika']) {
                        upsertItem(
                          'menu-sagorika',
                          buildSagorikaLabel(sagorikaStarter, sagorikaMain, nextValue, sagorikaIsLamb, sagorikaDessert),
                          getSagorikaPrice(sagorikaIsLamb),
                        );
                      }
                    }}
                  >
                    {getSagorikaMainDishOptions(sagorikaMain, sagorikaIsLamb).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isFr ? opt.fr : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="full-menu-bundle-row">
                  <span className="full-menu-bundle-label">{isFr ? 'Dessert *' : 'Dessert *'}</span>
                  <select
                    className="full-menu-bundle-select"
                    value={sagorikaDessert}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSagorikaDessert(nextValue);
                      if (cart['menu-sagorika']) {
                        upsertItem(
                          'menu-sagorika',
                          buildSagorikaLabel(sagorikaStarter, sagorikaMain, sagorikaMainDish, sagorikaIsLamb, nextValue),
                          getSagorikaPrice(sagorikaIsLamb),
                        );
                      }
                    }}
                  >
                    {sagorikaDessertOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isFr ? opt.fr : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="full-menu-bundle-actions">
                  {cart['menu-sagorika'] ? (
                    <button
                      type="button"
                      className="full-menu-bundle-btn is-selected"
                      onClick={() => removeItem('menu-sagorika')}
                    >
                      {isFr ? 'Retirer du panier' : 'Remove from cart'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="full-menu-bundle-btn"
                      onClick={() => upsertItem('menu-sagorika', sagorikaLabel, sagorikaPrice)}
                    >
                      {isFr ? `Ajouter au panier – ${sagorikaPrice.toFixed(2).replace('.', ',')} €` : `Add to cart – €${sagorikaPrice.toFixed(2)}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
            )}

            {showSection('menu-naan-sandwich') && (
            <div className={`full-menu-section full-menu-highlight ${coveredSections.has('menu-naan-sandwich') ? 'is-covered' : ''}`} id="menu-naan-sandwich">
              <div className="full-menu-item-header">
                <span className="full-menu-section-title">
                  {isFr ? 'MENU NAAN SANDWICH' : 'MENU NAAN SANDWICH'}
                </span>
              </div>
              <p className="full-menu-note">
                {isFr
                  ? 'Servi avec frites et une canette de soda.'
                  : 'Includes fries and one can of soda.'}
              </p>
              <div className="full-menu-bundle-controls">
                <div className="full-menu-bundle-split">
                  <div className="full-menu-bundle-split-card">
                    <div className="full-menu-bundle-split-title">
                      {isFr ? '14,95 €' : '€14.95'}
                    </div>
                    <div className="full-menu-bundle-radio-grid">
                      {naan1495Options.map((opt) => (
                        <label key={opt.value} className="full-menu-bundle-radio">
                          <input
                            type="radio"
                            name="naan1495"
                            value={opt.value}
                            checked={naan1495Choice === opt.value}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setNaan1495Choice(nextValue);
                              if (cart['menu-naan-1495']) {
                                const choiceLabel = naan1495Options.find((o) => o.value === nextValue)?.[isFr ? 'fr' : 'en'] || '';
                                const nextLabel = isFr
                                  ? `Menu Naan Sandwich (14,95€) – ${choiceLabel}`
                                  : `Naan Sandwich Menu (€14.95) – ${choiceLabel}`;
                                upsertItem('menu-naan-1495', nextLabel, 14.95);
                              }
                            }}
                          />
                          <span>{isFr ? opt.fr : opt.en}</span>
                        </label>
                      ))}
                    </div>
                    {cart['menu-naan-1495'] ? (
                      <button
                        type="button"
                        className="full-menu-bundle-btn is-selected"
                        onClick={() => removeItem('menu-naan-1495')}
                      >
                        {isFr ? 'Retirer' : 'Remove'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="full-menu-bundle-btn"
                        onClick={() => upsertItem('menu-naan-1495', naan1495Label, 14.95)}
                      >
                        {isFr ? 'Ajouter' : 'Add'}
                      </button>
                    )}
                  </div>

                  <div className="full-menu-bundle-split-card">
                    <div className="full-menu-bundle-split-title">
                      {isFr ? '15,95 €' : '€15.95'}
                    </div>
                    <div className="full-menu-bundle-radio-grid">
                      {naan1595Options.map((opt) => (
                        <label key={opt.value} className="full-menu-bundle-radio">
                          <input
                            type="radio"
                            name="naan1595"
                            value={opt.value}
                            checked={naan1595Choice === opt.value}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              setNaan1595Choice(nextValue);
                              if (cart['menu-naan-1595']) {
                                const choiceLabel = naan1595Options.find((o) => o.value === nextValue)?.[isFr ? 'fr' : 'en'] || '';
                                const nextLabel = isFr
                                  ? `Menu Naan Sandwich (15,95€) – ${choiceLabel}`
                                  : `Naan Sandwich Menu (€15.95) – ${choiceLabel}`;
                                upsertItem('menu-naan-1595', nextLabel, 15.95);
                              }
                            }}
                          />
                          <span>{isFr ? opt.fr : opt.en}</span>
                        </label>
                      ))}
                    </div>
                    {cart['menu-naan-1595'] ? (
                      <button
                        type="button"
                        className="full-menu-bundle-btn is-selected"
                        onClick={() => removeItem('menu-naan-1595')}
                      >
                        {isFr ? 'Retirer' : 'Remove'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="full-menu-bundle-btn"
                        onClick={() => upsertItem('menu-naan-1595', naan1595Label, 15.95)}
                      >
                        {isFr ? 'Ajouter' : 'Add'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="full-menu-grid">
            {/* Column 1 */}
            <div className="full-menu-column">
              {showSection('starters') && (
              <div className={`full-menu-section ${coveredSections.has('starters') ? 'is-covered' : ''}`} id="starters">
                <h3 className="full-menu-section-title">
                  {isFr ? 'ENTRÉES (STARTERS)' : 'APPETIZERS (STARTERS)'}
                </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['onion-bhaji-3'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('onion-bhaji-3', 'Onion Bhaji (3 pieces)', 6.9)
                  }
                >
                  <span>Onion Bhaji (3 pieces)</span>
                  <span>€6.9</span>
                </div>
                <p>
                  {isFr
                    ? "Beignets d'oignon croustillants aux herbes et épices, frits jusqu'à dorure."
                    : 'Crisp onion fritters seasoned with aromatic spices, lightly fried and served warm.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tandoori-1'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tandoori-1',
                      'Chicken Tandoori (1 leg)',
                      8.4,
                    )
                  }
                >
                  <span>Chicken Tandoori</span>
                  <span>€8.4</span>
                </div>
                <p>
                  {isFr
                    ? "Cuisse de poulet marinée au yaourt et aux épices, grillée au four tandoor."
                    : 'Marinated chicken leg infused with yogurt and spices, roasted in a traditional clay oven.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tikka-4'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tikka-4',
                      'Chicken Tikka (4 pieces)',
                      7.4,
                    )
                  }
                >
                  <span>Chicken Tikka (4 pieces)</span>
                  <span>€7.4</span>
                </div>
                <p>
                  {isFr
                    ? 'Morceaux de filet de poulet marinés et grillés au four tandoor.'
                    : 'Tender chicken fillet marinated in spices and grilled in the tandoor.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-tikka-4'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-tikka-4', 'Lamb Tikka (4 pieces)', 9.9)
                  }
                >
                  <span>Lamb Tikka (4 pieces)</span>
                  <span>€9.9</span>
                </div>
                <p>
                  {isFr
                    ? "Morceaux d'agneau marinés et grillés au four tandoor."
                    : 'Succulent lamb marinated with fresh herbs and spices, flame grilled.'}
                </p>
              </div>
              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['shish-kebab'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('shish-kebab', 'Shish Kebab', 10.9)
                  }
                >
                  <span>Shish Kebab</span>
                  <span>€10.9</span>
                </div>
                <p>
                  {isFr
                    ? "Viande d'agneau hachée aux herbes et épices, grillée en brochettes."
                    : 'Minced lamb blended with herbs and traditional spices, grilled to perfection.'}
                </p>
              </div>
            </div>
            )}

            {showSection('curries') && (
            <div className={`full-menu-section ${coveredSections.has('curries') ? 'is-covered' : ''}`} id="curries">
              <h3 className="full-menu-section-title">
                {isFr ? 'CURRYS' : 'CURRIES'}
              </h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Tous les currys sont servis avec du riz basmati.'
                  : 'All curries are served with basmati rice.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-curry'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-curry', 'Chicken Curry', 14.9)
                  }
                >
                  <span>Chicken Curry</span>
                  <span>€14.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet cuisiné dans une sauce curry traditionnelle.'
                    : 'Chicken cooked in a traditional curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-curry'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-curry', 'Lamb Curry', 18.9)
                  }
                >
                  <span>Lamb Curry</span>
                  <span>€18.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau cuisiné dans une sauce curry traditionnelle.'
                    : 'Lamb cooked in a traditional curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-korma'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-korma', 'Chicken Korma', 15.9)
                  }
                >
                  <span>Chicken Korma</span>
                  <span>€15.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet dans une sauce douce et crémeuse aux épices indiennes et à la tomate.'
                    : 'Chicken in a mild, creamy sauce with Indian spices and tomato.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-korma'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-korma', 'Lamb Korma', 18.9)
                  }
                >
                  <span>Lamb Korma</span>
                  <span>€18.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau dans une sauce douce et crémeuse aux épices indiennes et à la tomate.'
                    : 'Lamb in a mild, creamy sauce with Indian spices and tomato.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-dhansak'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-dhansak', 'Chicken Dhansak', 17.9)
                  }
                >
                  <span>Chicken Dhansak</span>
                  <span>€17.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet mijoté avec des lentilles corail dans une sauce curry riche.'
                    : 'Chicken cooked with red lentils in a rich curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-dhansak'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-dhansak', 'Lamb Dhansak', 19.9)
                  }
                >
                  <span>Lamb Dhansak</span>
                  <span>€19.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau mijoté avec des lentilles corail dans une sauce curry riche.'
                    : 'Lamb cooked with red lentils in a rich curry sauce.'}
                </p>
              </div>
            </div>
            )}

            {showSection('biryani') && (
            <div className={`full-menu-section ${coveredSections.has('biryani') ? 'is-covered' : ''}`} id="biryani">
              <h3 className="full-menu-section-title">BIRYANI</h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Riz basmati parfumé cuit avec des épices.'
                  : 'Fragrant basmati rice cooked with spices.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-biryani'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-biryani', 'Chicken Biryani', 16.9)
                  }
                >
                  <span>Chicken Biryani</span>
                  <span>€16.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Riz basmati épicé cuisiné avec du poulet.'
                    : 'Spiced basmati rice cooked with chicken.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-biryani'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-biryani', 'Lamb Biryani', 18.9)
                  }
                >
                  <span>Lamb Biryani</span>
                  <span>€18.9</span>
                </div>
                <p>
                  {isFr
                    ? "Riz basmati épicé cuisiné avec de l'agneau."
                    : 'Spiced basmati rice cooked with lamb.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['vegetable-biryani'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('vegetable-biryani', 'Vegetable Biryani', 16.9)
                  }
                >
                  <span>Vegetable Biryani</span>
                  <span>€16.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Riz basmati épicé cuisiné avec des légumes de saison.'
                    : 'Spiced basmati rice cooked with seasonal vegetables.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['special-biryani'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('special-biryani', 'Special Biryani', 19.9)
                  }
                >
                  <span>Special Biryani</span>
                  <span>€19.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Riz basmati épicé cuisiné avec poulet, agneau et légumes.'
                    : 'Spiced basmati rice cooked with chicken, lamb, and vegetables.'}
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="full-menu-column">
            {showSection('specialty-curries') && (
            <div className={`full-menu-section ${coveredSections.has('specialty-curries') ? 'is-covered' : ''}`} id="specialty-curries">
              <h3 className="full-menu-section-title">
                {isFr ? 'CURRYS SPÉCIAUX' : 'SPECIALTY CURRIES'}
              </h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Servis avec du riz basmati.'
                  : 'Served with basmati rice.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['butter-chicken'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('butter-chicken', 'Butter Chicken', 16.9)
                  }
                >
                  <span>Butter Chicken</span>
                  <span>€16.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet mariné dans une sauce onctueuse au beurre, tomate et épices.'
                    : 'Marinated chicken in a rich butter and tomato spice sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tikka-masala'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tikka-masala',
                      'Chicken Tikka Masala',
                      16.9,
                    )
                  }
                >
                  <span>Chicken Tikka Masala</span>
                  <span>€16.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet mariné grillé dans une sauce tomate épicée.'
                    : 'Grilled marinated chicken in a spiced tomato sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-tikka-masala'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'lamb-tikka-masala',
                      'Lamb Tikka Masala',
                      19.9,
                    )
                  }
                >
                  <span>Lamb Tikka Masala</span>
                  <span>€19.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau mariné grillé dans une sauce tomate épicée.'
                    : 'Grilled marinated lamb in a spiced tomato sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-jalfrezi'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-jalfrezi', 'Chicken Jalfrezi', 18.9)
                  }
                >
                  <span>Chicken Jalfrezi</span>
                  <span>€18.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet cuisiné avec des poivrons dans une sauce curry relevée.'
                    : 'Chicken cooked with bell peppers in a spicy curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-jalfrezi'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-jalfrezi', 'Lamb Jalfrezi', 20.9)
                  }
                >
                  <span>Lamb Jalfrezi</span>
                  <span>€20.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau cuisiné avec des poivrons dans une sauce curry relevée.'
                    : 'Lamb cooked with bell peppers in a spicy curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-balti'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chicken-balti', 'Chicken Balti', 18.9)
                  }
                >
                  <span>Chicken Balti</span>
                  <span>€18.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Poulet aux poivrons, ail, oignons, tomates et épices maison.'
                    : 'Chicken with peppers, garlic, onions, tomatoes, and house spices.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-balti'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('lamb-balti', 'Lamb Balti', 20.9)
                  }
                >
                  <span>Lamb Balti</span>
                  <span>€20.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Agneau aux poivrons, ail, oignons, tomates et épices maison.'
                    : 'Lamb with peppers, garlic, onions, tomatoes, and house spices.'}
                </p>
              </div>
            </div>
            )}

            {showSection('vegetarian-vegan') && (
            <div className={`full-menu-section ${coveredSections.has('vegetarian-vegan') ? 'is-covered' : ''}`} id="vegetarian-vegan">
              <h3 className="full-menu-section-title">
                {isFr ? 'PLATS VÉGÉTARIENS & VEGAN' : 'VEGETARIAN & VEGAN DISHES'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['mixed-vegetable-bhaji'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'mixed-vegetable-bhaji',
                      'Mixed Vegetable Bhaji',
                      13.9,
                    )
                  }
                >
                  <span>Mixed Vegetable Bhaji</span>
                  <span>€13.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Légumes de saison cuisinés aux épices dans une sauce curry légère.'
                    : 'Seasonal vegetables cooked with spices in a light curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['vegetable-curry'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('vegetable-curry', 'Vegetable Curry', 12.8)
                  }
                >
                  <span>Vegetable Curry</span>
                  <span>€12.8</span>
                </div>
                <p>
                  {isFr
                    ? 'Assortiment de légumes cuisinés dans une sauce curry traditionnelle.'
                    : 'Assorted vegetables cooked in a traditional curry sauce.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['saag-paneer'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('saag-paneer', 'Saag Paneer', 13.9)
                  }
                >
                  <span>Saag Paneer</span>
                  <span>€13.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Épinards cuisinés avec du paneer maison aux épices.'
                    : 'Spinach cooked with homemade spiced paneer cheese.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['saag-bhaji'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('saag-bhaji', 'Saag Bhaji', 12.8)
                  }
                >
                  <span>Saag Bhaji</span>
                  <span>€12.8</span>
                </div>
                <p>
                  {isFr
                    ? 'Épinards avec gingembre, ail, oignons, tomates et épices.'
                    : 'Spinach with ginger, garlic, onions, tomatoes, and spices.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['indian-tarka-dal'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('indian-tarka-dal', 'Indian Tarka Dal', 11.9)
                  }
                >
                  <span>Indian Tarka Dal</span>
                  <span>€11.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Lentilles corail cuisinées avec gingembre, ail et oignons légèrement épicés.'
                    : 'Red lentils cooked with ginger, garlic, and lightly spiced onions.'}
                </p>
              </div>
            </div>
            )}

            {showSection('naan') && (
            <div className={`full-menu-section ${coveredSections.has('naan') ? 'is-covered' : ''}`} id="naan">
              <h3 className="full-menu-section-title">NAAN</h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Pain traditionnel cuit au four tandoor.'
                  : 'Traditional flatbread baked in a tandoor oven.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['classic-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('classic-naan', 'Classic Naan', 3.5)
                  }
                >
                  <span>Classic Naan</span>
                  <span>€3.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Pain traditionnel nature.'
                    : 'Plain traditional bread.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['cheese-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('cheese-naan', 'Cheese Naan', 4.0)
                  }
                >
                  <span>Cheese Naan</span>
                  <span>€4.0</span>
                </div>
                <p>
                  {isFr
                    ? 'Naan garni de fromage fondu.'
                    : 'Naan stuffed with melted cheese.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['garlic-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('garlic-naan', 'Garlic Naan', 4.5)
                  }
                >
                  <span>Garlic Naan</span>
                  <span>€4.5</span>
                </div>
                <p>
                  {isFr
                    ? "Naan nappé d'ail frais."
                    : 'Naan topped with fresh garlic.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['garlic-cheese-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'garlic-cheese-naan',
                      'Garlic Cheese Naan',
                      5.0,
                    )
                  }
                >
                  <span>Garlic Cheese Naan</span>
                  <span>€5.0</span>
                </div>
                <p>
                  {isFr
                    ? 'Naan garni de fromage et parfumé à l’ail.'
                    : 'Naan stuffed with cheese and flavored with garlic.'}
                </p>
              </div>
            </div>
            )}
          </div>

          {/* Column 3 */}
          <div className="full-menu-column">
            {showSection('naan-sandwiches') && (
            <div className={`full-menu-section ${coveredSections.has('naan-sandwiches') ? 'is-covered' : ''}`} id="naan-sandwiches">
              <h3 className="full-menu-section-title">
                {isFr ? 'NAAN SANDWICHS' : 'NAAN SANDWICHES'}
              </h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Au choix : sauce curry ou sauce menthe.'
                  : 'Choice of curry sauce or mint sauce.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['fried-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('fried-naan', 'Fried Naan', 9.9)
                  }
                >
                  <span>Fried Naan</span>
                  <span>€9.9</span>
                </div>
                <p>
                  {isFr
                    ? '3 tenders de poulet, cheddar, salade, tomate et oignons.'
                    : '3 chicken tenders, cheddar, lettuce, tomato, and onions.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chapati-special'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('chapati-special', 'Chapati Special', 11.9)
                  }
                >
                  <span>Chapati Special</span>
                  <span>€11.9</span>
                </div>
                <p>
                  {isFr
                    ? '2 steaks de bœuf, 2 tranches de cheddar, œuf, tender de poulet, salade, tomate et oignon.'
                    : '2 beef patties, 2 slices of cheddar, egg, chicken tender, lettuce, tomato, and onion.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['curry-tikka-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'curry-tikka-naan',
                      'Curry Tikka Naan',
                      11.9,
                    )
                  }
                >
                  <span>Curry Tikka Naan</span>
                  <span>€11.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Blanc de poulet curry tikka, cheddar, salade, tomate et oignon.'
                    : 'Curry tikka chicken breast, cheddar, lettuce, tomato, and onion.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['vegetable-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('vegetable-naan', 'Vegetable Naan', 9.9)
                  }
                >
                  <span>Vegetable Naan</span>
                  <span>€9.9</span>
                </div>
                <p>
                  {isFr
                    ? "Onion bhajis, cheddar, salade, tomate et oignon."
                    : 'Onion bhajis, cheddar, lettuce, tomato, and onion.'}
                </p>
              </div>
            </div>
            )}

            {showSection('tenders') && (
            <div className={`full-menu-section ${coveredSections.has('tenders') ? 'is-covered' : ''}`} id="tenders">
              <h3 className="full-menu-section-title">
                {isFr ? 'CHICKEN TENDERS' : 'CHICKEN TENDERS'}
              </h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Servis avec sauce curry.'
                  : 'Served with curry sauce.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tenders-4'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tenders-4',
                      'Chicken Tenders (4 pieces)',
                      7.0,
                    )
                  }
                >
                  <span>4 pieces</span>
                  <span>€7.0</span>
                </div>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tenders-6'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tenders-6',
                      'Chicken Tenders (6 pieces)',
                      9.0,
                    )
                  }
                >
                  <span>6 pieces</span>
                  <span>€9.0</span>
                </div>
              </div>
            </div>
            )}

            {showSection('sides') && (
            <div className={`full-menu-section ${coveredSections.has('sides') ? 'is-covered' : ''}`} id="sides">
              <h3 className="full-menu-section-title">
                {isFr ? 'ACCOMPAGNEMENTS' : 'SIDES'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['basmati-rice'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('basmati-rice', 'Basmati Rice', 3.5)
                  }
                >
                  <span>Basmati Rice</span>
                  <span>€3.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Riz basmati vapeur.'
                    : 'Steamed basmati rice.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['fries'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('fries', 'Fries', 3.4)
                  }
                >
                  <span>Fries</span>
                  <span>€3.4</span>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Column 4 */}
          <div className="full-menu-column">
            {showSection('grills') && (
            <div className={`full-menu-section ${coveredSections.has('grills') ? 'is-covered' : ''}`} id="grills">
              <h3 className="full-menu-section-title">
                {isFr ? 'GRILLADES' : 'GRILLS'}
              </h3>
              <p className="full-menu-note">
                {isFr
                  ? 'Toutes les viandes sont grillées au four tandoor et servies avec salade.'
                  : 'All meats are grilled in a tandoor oven and served with salad.'}
              </p>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tikka-8'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tikka-8',
                      'Chicken Tikka (8 pieces)',
                      14.9,
                    )
                  }
                >
                  <span>Chicken Tikka (8 pieces)</span>
                  <span>€14.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Blanc de poulet mariné grillé au four tandoor.'
                    : 'Marinated chicken breast grilled in a tandoor oven.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['chicken-tandoori-2'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'chicken-tandoori-2',
                      'Chicken Tandoori (2 legs)',
                      16.9,
                    )
                  }
                >
                  <span>Chicken Tandoori (2 legs)</span>
                  <span>€16.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Cuisses de poulet marinées grillées au four tandoor.'
                    : 'Marinated chicken legs grilled in a tandoor oven.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['lamb-tikka-8'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'lamb-tikka-8',
                      'Lamb Tikka (8 pieces)',
                      19.9,
                    )
                  }
                >
                  <span>Lamb Tikka (8 pieces)</span>
                  <span>€19.9</span>
                </div>
                <p>
                  {isFr
                    ? "Agneau mariné grillé au four tandoor."
                    : 'Marinated lamb grilled in a tandoor oven.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['mixed-grill'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('mixed-grill', 'Mixed Grill', 21.9)
                  }
                >
                  <span>Mixed Grill</span>
                  <span>€21.9</span>
                </div>
                <p>
                  {isFr
                    ? 'Chicken tikka, shish kebab, lamb tikka et poulet tandoori.'
                    : 'Chicken tikka, shish kebab, lamb tikka, and tandoori chicken.'}
                </p>
              </div>
            </div>
            )}

            {showSection('desserts') && (
            <div className={`full-menu-section ${coveredSections.has('desserts') ? 'is-covered' : ''}`} id="desserts">
              <h3 className="full-menu-section-title">
                {isFr ? 'DESSERTS' : 'DESSERTS'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['halwa'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('halwa', 'Halwa', 5.5)
                  }
                >
                  <span>Halwa</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Gâteau indien de semoule aux amandes, noix de coco et safran.'
                    : 'Indian semolina cake with almonds, coconut, and saffron.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['mango-lassi'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('mango-lassi', 'Mango Lassi', 5.5)
                  }
                >
                  <span>Mango Lassi</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Boisson traditionnelle au yaourt mixée à la mangue.'
                    : 'Traditional yogurt drink blended with mango.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['rose-lassi'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('rose-lassi', 'Rose Lassi', 5.5)
                  }
                >
                  <span>Rose Lassi</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Boisson traditionnelle au yaourt parfumée au sirop de rose.'
                    : 'Traditional yogurt drink flavored with rose syrup.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['nutella-naan'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('nutella-naan', 'Nutella Naan', 5.5)
                  }
                >
                  <span>Nutella Naan</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Naan chaud nappé de Nutella.'
                    : 'Warm naan bread topped with Nutella.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['dessert-of-the-day'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('dessert-of-the-day', 'Dessert of the Day', null)
                  }
                >
                  <span>Dessert of the Day</span>
                </div>
                <p>
                  {isFr
                    ? 'Veuillez vous renseigner auprès de votre serveur.'
                    : 'Please ask your server.'}
                </p>
              </div>
            </div>
            )}

            {showSection('drinks') && (
            <div className={`full-menu-section ${coveredSections.has('coffee') ? 'is-covered' : ''}`} id="coffee">
              <h3 className="full-menu-section-title">
                {isFr ? 'CAFÉ' : 'COFFEE'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['coffee'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('coffee', 'Coffee', 1.8)
                  }
                >
                  <span>Coffee</span>
                  <span>€1.8</span>
                </div>
                <p>
                  {isFr
                    ? 'Café.'
                    : 'Coffee.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['large-coffee'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('large-coffee', 'Large Coffee', 3.5)
                  }
                >
                  <span>Large Coffee</span>
                  <span>€3.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Grand café.'
                    : 'Large coffee.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['coffee-with-cream'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'coffee-with-cream',
                      'Coffee with Cream',
                      2.8,
                    )
                  }
                >
                  <span>Coffee with Cream</span>
                  <span>€2.8</span>
                </div>
                <p>
                  {isFr
                    ? 'Café avec crème.'
                    : 'Coffee with cream.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['large-coffee-with-cream'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'large-coffee-with-cream',
                      'Large Coffee with Cream',
                      4.8,
                    )
                  }
                >
                  <span>Large Coffee with Cream</span>
                  <span>€4.8</span>
                </div>
                <p>
                  {isFr
                    ? 'Grand café avec crème.'
                    : 'Large coffee with cream.'}
                </p>
              </div>
            </div>
            )}

            {showSection('drinks') && (
            <div className={`full-menu-section ${coveredSections.has('jomo') ? 'is-covered' : ''}`} id="jomo">
              <h3 className="full-menu-section-title">
                {isFr ? 'JOMO (35 cl)' : 'JOMO (35 cl)'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['jomo'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('jomo', 'JOMO', 4.0)
                  }
                >
                  <span>JOMO</span>
                  <span>€4.0</span>
                </div>
                <p>
                  {isFr
                    ? 'Thé glacé bio fabriqué en France. Sain et produit de manière responsable.'
                    : 'Organic iced tea made in France. Healthy and responsibly produced.'}
                </p>
              </div>

              <p className="full-menu-note">
                {isFr ? 'Saveurs :' : 'Flavors:'}
              </p>
              <ul className="full-menu-list">
                <li>
                  {isFr
                    ? 'Thé blanc, pêche & hibiscus'
                    : 'White tea, peach & hibiscus'}
                </li>
                <li>
                  {isFr
                    ? 'Thé maté, fruit de la passion & citron vert'
                    : 'Maté tea, passion fruit & lime'}
                </li>
                <li>
                  {isFr
                    ? 'Thé vert, menthe & citron'
                    : 'Green tea, mint & lemon'}
                </li>
                <li>
                  {isFr
                    ? 'Thé maté, grenade & litchi'
                    : 'Maté tea, pomegranate & lychee'}
                </li>
              </ul>
            </div>
            )}

            {showSection('drinks') && (
            <div className={`full-menu-section ${coveredSections.has('drinks') ? 'is-covered' : ''}`} id="drinks">
              <h3 className="full-menu-section-title">
                {isFr ? 'BOISSONS' : 'DRINKS'}
              </h3>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['mango-or-rose-lassi'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'mango-or-rose-lassi',
                      'Mango or Rose Lassi',
                      5.5,
                    )
                  }
                >
                  <span>Mango or Rose Lassi</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Lassi mangue ou rose.'
                    : 'Mango or rose lassi.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['dremmwel-beer'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'dremmwel-beer',
                      'Dremmwel Beer (Organic Blonde, Alcohol-Free)',
                      5.5,
                    )
                  }
                >
                  <span>Dremmwel Beer (Organic Blonde, Alcohol-Free)</span>
                  <span>€5.5</span>
                </div>
                <p>
                  {isFr
                    ? 'Bière Dremmwel blonde bio, sans alcool.'
                    : 'Dremmwel organic blonde beer, alcohol-free.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['coca-cola-33'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('coca-cola-33', 'Coca-Cola (33 cl)', 2.5)
                  }
                >
                  <span>Coca-Cola (33 cl)</span>
                  <span>€2.5</span>
                </div>
                <p>
                  {isFr ? 'Coca-Cola 33 cl.' : 'Coca-Cola 33 cl.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['coca-cola-zero-33'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'coca-cola-zero-33',
                      'Coca-Cola Zero Sugar (33 cl)',
                      2.5,
                    )
                  }
                >
                  <span>Coca-Cola Zero Sugar (33 cl)</span>
                  <span>€2.5</span>
                </div>
                <p>
                  {isFr ? 'Coca-Cola Zero 33 cl.' : 'Coca-Cola Zero 33 cl.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['fuze-tea-or-tropico-33'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'fuze-tea-or-tropico-33',
                      'Fuze Tea or Tropico (33 cl)',
                      2.5,
                    )
                  }
                >
                  <span>Fuze Tea or Tropico (33 cl)</span>
                  <span>€2.5</span>
                </div>
                <p>
                  {isFr ? 'Fuze Tea ou Tropico 33 cl.' : 'Fuze Tea or Tropico 33 cl.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['sprite-or-fanta-33'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'sprite-or-fanta-33',
                      'Sprite or Fanta (33 cl)',
                      2.5,
                    )
                  }
                >
                  <span>Sprite or Fanta (33 cl)</span>
                  <span>€2.5</span>
                </div>
                <p>
                  {isFr ? 'Sprite ou Fanta 33 cl.' : 'Sprite or Fanta 33 cl.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['apple-juice-25'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem('apple-juice-25', 'Apple Juice (25 cl)', 2.8)
                  }
                >
                  <span>Apple Juice (25 cl)</span>
                  <span>€2.8</span>
                </div>
                <p>
                  {isFr ? 'Jus de pomme 25 cl.' : 'Apple juice 25 cl.'}
                </p>
              </div>

              <div className="full-menu-item">
                <div
                  className={`full-menu-item-header ${
                    cart['still-or-sparkling-water'] ? 'is-selected' : ''
                  }`}
                  onClick={() =>
                    toggleItem(
                      'still-or-sparkling-water',
                      'Still Water (50 cl) or Sparkling Water (33 cl)',
                      2.0,
                    )
                  }
                >
                  <span>Still Water (50 cl) or Sparkling Water (33 cl)</span>
                  <span>€2.0</span>
                </div>
                <p>
                  {isFr
                    ? 'Eau plate 50 cl ou eau pétillante 33 cl.'
                    : 'Still water 50 cl or sparkling water 33 cl.'}
                </p>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default FullMenu;
