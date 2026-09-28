import React from 'react';
import { useLanguage } from '../LanguageContext';
import curry from '../assets/curry.jpeg';
import naan from '../assets/naan.jpeg';
import biryani from '../assets/biriyani.png';
import feast from '../assets/chapati_food.png';
import photo1 from '../assets/photo_1.jpeg';
import photo2 from '../assets/photo_2.jpeg';
import blog1 from '../assets/blog_1.jfif';
import blog2 from '../assets/blog_2.jfif';

const goTo = (page) => {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.location.href = url.toString();
};

const Landing = () => {
  const { lang } = useLanguage();
  const english = lang === 'en';
  const copy = english ? {
    eyebrow: 'Indian street food in Saint-Malo',
    titleTop: 'Indian street food,',
    titleAccent: 'made with soul.',
    intro: 'A little story of fire, spice and recipes made fresh every day. A generous journey through the flavours of India.',
    primary: 'Explore the menu', secondary: 'Our opening story',
    orderNoteTitle: 'Order online, enjoy your way',
    orderNote: 'Choose curries, biryanis, naan sandwiches, grills and drinks online — then collect your freshly prepared order at Chapati.',
    service: 'Open 7 days a week', date: 'Lunch & dinner · Saint-Malo',
    journey: 'From the first flame to your first bite',
    journeyText: 'Every plate starts with patient preparation and ends with a bold, comforting flavour.',
    cards: [
      ['01', 'Fresh every morning', 'Spices ground, sauces simmered and dough prepared in-house.'],
      ['02', 'The tandoor is lit', 'Naan, grilled favourites and smoky char arrive straight from the fire.'],
      ['03', 'A table made for sharing', 'Come and enjoy generous Indian street food, right here in Saint-Malo.'],
    ],
    taste: 'A first taste of what is coming',
    cta: 'Reserve a table',
    letterTitle: 'A warm welcome, every day',
    letterLeft: ['We are delighted to welcome you all week long, for lunch and dinner.', 'Our kitchen brings together Indian street-food favourites, generous portions and recipes made with care.'],
    letterRight: ['What matters most to us is that you leave happy: welcomed with warmth and delighted by every flavour.', 'We look forward to sharing a beautiful moment around our table.'],
    visitLabel: 'THE PLACE',
    visitTitle: 'A warm room, generous tables.',
    visitBody: 'Come and enjoy a moment at Chapati. Our dining room brings together warm wood, soft light and the lively hum of street food — a friendly place where every guest feels welcomed.',
    visitBullets: [
      'Cosy seating for friends, couples and families',
      'A simple menu of Indian street-food favourites',
      'In the heart of Saint-Malo, close to the ramparts',
    ],
    interiorLabel: 'OVER THE COUNTER',
    interiorTitle: 'The smell of spices, right at the counter.',
    interiorBody: 'Take a look at our open kitchen, where the tandoor glows and every curry is finished to order. A clear view of the craftsmanship behind each dish.',
    interiorBullets: [
      'Tandoor-baked naan, fresh from the fire',
      'Biryanis and curries simmered every morning',
      'A team that cooks the way it likes to eat',
    ],
    newsLabel: 'IN THE PRESS',
    newsTitle: 'They came, they tasted, they wrote about us.',
    newsRead: 'Read article',
    newsItems: [
      {
        tag: 'Le Pays Malouin',
        excerpt: 'Un nouveau restaurant "indian street food" a ouvert ses portes à Saint-Malo cet été.',
        date: 'Read on Facebook',
        url: 'https://www.facebook.com/share/1BT7ewNaCN/?mibextid=wwXIfr',
        image: blog1,
      },
      {
        tag: 'Ouest-France · Saint-Malo',
        excerpt: 'On vous fait découvrir cette nouvelle adresse 😋',
        date: 'Read on Facebook',
        url: 'https://www.facebook.com/share/1C5XPD6sww/?mibextid=wwXIfr',
        image: blog2,
      },
    ],
  } : {
    eyebrow: 'Street food indienne à Saint-Malo',
    titleTop: 'La street food indienne,',
    titleAccent: 'faite avec le cœur.',
    intro: 'Une histoire de feu, d’épices et de recettes préparées chaque jour. Un voyage généreux au cœur des saveurs de l’Inde.',
    primary: 'Voir la carte', secondary: 'Notre histoire',
    orderNoteTitle: 'Commandez en ligne, savourez à votre façon',
    orderNote: 'Choisissez vos currys, biryanis, naan sandwiches, grillades et boissons en ligne — puis récupérez votre commande fraîchement préparée chez Chapati.',
    service: 'Ouvert 7 jours sur 7', date: 'Midi & soir · Saint-Malo',
    journey: 'De la première flamme à votre première bouchée',
    journeyText: 'Chaque assiette commence avec une préparation attentive et se termine par une saveur généreuse.',
    cards: [
      ['01', 'Frais chaque matin', 'Épices moulues, sauces mijotées et pâtes préparées sur place.'],
      ['02', 'Le tandoor s’allume', 'Naans, grillades et saveurs fumées arrivent directement du feu.'],
      ['03', 'Une table faite pour partager', 'Venez savourer une street food indienne généreuse, ici à Saint-Malo.'],
    ],
    taste: 'Un avant-goût de ce qui arrive',
    cta: 'Réserver une table',
    letterTitle: 'Un accueil chaleureux, chaque jour',
    letterLeft: ['Nous sommes heureux de vous accueillir toute la semaine, le midi comme le soir.', 'Notre cuisine rassemble les incontournables de la street food indienne, des portions généreuses et des recettes préparées avec soin.'],
    letterRight: ['Notre souhait est simple : que vous repartiez heureux, touchés par notre accueil et séduits par chaque saveur.', 'Nous avons hâte de partager un beau moment autour de notre table.'],
    visitLabel: 'LE LIEU',
    visitTitle: 'Une salle chaleureuse, des tables généreuses.',
    visitBody: 'Venez profiter d’un moment chez Chapati. Notre salle mêle le bois chaleureux, une lumière douce et le bruit vivant de la street food — un lieu convivial où chaque client se sent accueilli.',
    visitBullets: [
      'Des places cosy pour amis, couples et familles',
      'Un menu simple, fidèle à la street food indienne',
      'Au cœur de Saint-Malo, près des remparts',
    ],
    interiorLabel: 'DERNIER LE COMPTOIR',
    interiorTitle: 'Le parfum des épices, juste devant vous.',
    interiorBody: 'Jetez un œil à notre cuisine ouverte, où le tandoor rougeoie et chaque curry est terminé à la minute. Une vue claire sur le savoir-faire derrière chaque plat.',
    interiorBullets: [
      'Naans cuits au tandoor, à la sortie du feu',
      'Biryanis et currys mijotés chaque matin',
      'Une équipe qui cuisine comme elle aime manger',
    ],
    newsLabel: 'DANS LA PRESSE',
    newsTitle: 'Ils sont venus, ils ont goûté, ils en parlent.',
    newsRead: 'Lire l’article',
    newsItems: [
      {
        tag: 'Le Pays Malouin',
        excerpt: 'Un nouveau restaurant "indian street food" a ouvert ses portes à Saint-Malo cet été.',
        date: 'Lire sur Facebook',
        url: 'https://www.facebook.com/share/1BT7ewNaCN/?mibextid=wwXIfr',
        image: blog1,
      },
      {
        tag: 'Ouest-France · Saint-Malo',
        excerpt: 'On vous fait découvrir cette nouvelle adresse 😋',
        date: 'Lire sur Facebook',
        url: 'https://www.facebook.com/share/1C5XPD6sww/?mibextid=wwXIfr',
        image: blog2,
      },
    ],
  };

  const foodCards = [
    { image: curry, label: 'Curries', icon: '✦' },
    { image: naan, label: 'Naan sandwiches', icon: '≋' },
    { image: biryani, label: 'Biryanis', icon: '✺' },
  ];

  return (
    <div className="launch-home">
      <section className="launch-hero" id="home">
        <div className="launch-hero-shade" />
        <div className="launch-hero-content container">
          <p className="launch-eyebrow reveal-one"><span />{copy.eyebrow}</p>
          <h1 className="reveal-two"><span>{copy.titleTop}</span><em>{copy.titleAccent}</em></h1>
          <p className="launch-intro reveal-three">{copy.intro}</p>
          <div className="launch-actions reveal-four">
            <button className="launch-button" onClick={() => goTo('fullmenu')}>{copy.primary} <b>→</b></button>
            <a href="#story" className="launch-text-link">{copy.secondary} <span>↓</span></a>
          </div>
          <div className="launch-order-note reveal-four">
            <span className="order-note-mark">✦</span>
            <p><strong>{copy.orderNoteTitle}</strong>{copy.orderNote}</p>
          </div>
          <div className="launch-opening reveal-four"><span className="pulse-dot" /> <strong>{copy.service}</strong><i /> {copy.date}</div>
        </div>
        <div className="hero-scroll-cue"><span>Scroll to discover</span><i /></div>
      </section>

      <section className="launch-letter">
        <div className="container">
          <p className="letter-label">CHAPATI · SAINT-MALO</p>
          <h2>{copy.letterTitle}</h2>
          <div className="letter-grid">
            <div>{copy.letterLeft.map((text) => <p key={text}>{text}</p>)}</div>
            <div>{copy.letterRight.map((text) => <p key={text}>{text}</p>)}</div>
          </div>
        </div>
      </section>

      <section className="visit-split">
        <div className="container">
          <div className="visit-split-grid">
            <div className="visit-split-text">
              <p className="visit-label">{copy.visitLabel}</p>
              <h2>{copy.visitTitle}</h2>
              <p className="visit-body">{copy.visitBody}</p>
              <ul className="visit-bullets">
                {copy.visitBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
            <div className="visit-split-image visit-split-image-portrait">
              <img src={photo1} alt="Chapati dining room" />
            </div>
          </div>
        </div>
      </section>

      <section className="interior-split interior-split-reverse">
        <div className="container">
          <div className="visit-split-grid">
            <div className="visit-split-image visit-split-image-landscape">
              <img src={photo2} alt="Chapati kitchen counter" />
            </div>
            <div className="visit-split-text">
              <p className="visit-label">{copy.interiorLabel}</p>
              <h2>{copy.interiorTitle}</h2>
              <p className="visit-body">{copy.interiorBody}</p>
              <ul className="visit-bullets">
                {copy.interiorBullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="launch-story" id="story">
        <div className="container">
          <div className="section-heading">
            <p>CHAPATI · THE STORY</p>
            <h2>{copy.journey}</h2>
            <span>{copy.journeyText}</span>
          </div>
          <div className="story-timeline">
            {copy.cards.map(([number, title, text]) => <article className="story-step" key={number}>
              <div className="story-number">{number}</div><div className="story-line" />
              <h3>{title}</h3><p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className="launch-tastes">
        <div className="container">
          <div className="taste-heading"><p>THE MENU, IN PREVIEW</p><h2>{copy.taste}</h2></div>
          <div className="taste-grid">
            {foodCards.map((item) => <button className="taste-card" onClick={() => goTo('fullmenu')} key={item.label}>
              <img src={item.image} alt={item.label} /><div className="taste-overlay" /><div className="taste-copy"><span>{item.icon}</span><h3>{item.label}</h3><b>Discover <i>→</i></b></div>
            </button>)}
          </div>
        </div>
      </section>

      <section className="news-section">
        <div className="container">
          <div className="news-heading">
            <p>{copy.newsLabel}</p>
            <h2>{copy.newsTitle}</h2>
          </div>
          <div className="news-grid">
            {copy.newsItems.map((item) => (
              <a key={item.tag} href={item.url} className="news-card" target="_blank" rel="noreferrer">
                <div className="news-card-image">
                  <img src={item.image} alt={item.tag} />
                </div>
                <div className="news-card-body">
                  <span className="news-card-tag">{item.tag}</span>
                  <p className="news-card-excerpt">"{item.excerpt}"</p>
                  <span className="news-card-cta">{item.date} <i>→</i></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="launch-closing">
        <div className="launch-closing-image" style={{ backgroundImage: `url(${feast})` }} />
        <div className="launch-closing-shade" />
        <div className="container launch-closing-content"><p>AUTHENTIC · FRESH · HOMEMADE</p><h2>Chapati</h2><button className="launch-button" onClick={() => goTo('reservation')}>{copy.cta} <b>→</b></button></div>
      </section>
    </div>
  );
};

export default Landing;
