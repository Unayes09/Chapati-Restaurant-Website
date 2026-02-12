import React from 'react';
import { useLanguage } from '../LanguageContext';

const Testimonials = () => {
  const { t } = useLanguage();

  return (
    <section className="testimonials section-padding">
      <div className="container">
        <h2 className="text-center">{t.testimonials.title}</h2>
        <div className="testimonials-grid">
          {t.testimonials.reviews.map((review, index) => (
            <div key={index} className="testimonial-card">
              <div className="stars">★★★★★</div>
              <p className="review-text">"{review.text}"</p>
              <p className="author">{review.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
