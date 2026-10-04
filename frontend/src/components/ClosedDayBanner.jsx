import React from 'react';
import { useLanguage } from '../LanguageContext';
import { useClosedDays } from '../hooks/useClosedDays';

const formatDate = (iso, locale) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(`${iso}T00:00:00`)
  );
};

const ClosedDayBanner = () => {
  const { lang } = useLanguage();
  const isFr = lang === 'fr';
  const locale = isFr ? 'fr-FR' : 'en-GB';
  const { active, loading } = useClosedDays();

  if (loading || !active) return null;

  const start = formatDate(active.startDate, locale);
  const end = active.startDate === active.endDate ? null : formatDate(active.endDate, locale);

  const headline = end
    ? isFr ? `Nous sommes fermés du ${start} au ${end}.` : `We are closed from ${start} to ${end}.`
    : isFr ? `Nous sommes fermés le ${start}.` : `We are closed on ${start}.`;

  const note = isFr
    ? 'Aucune réservation ni commande ne peut être passée pendant cette période.'
    : 'No reservations or pickup orders can be placed during this period.';

  return (
    <div className="closed-day-banner" role="status" aria-live="polite">
      <div className="closed-day-banner-inner">
        <span className="closed-day-banner-icon" aria-hidden>✕</span>
        <p>
          <strong>{headline}</strong>
          {active.reason ? <span className="closed-day-banner-reason"> — {active.reason}</span> : null}
          <span className="closed-day-banner-note"> {note}</span>
        </p>
      </div>
    </div>
  );
};

export default ClosedDayBanner;
