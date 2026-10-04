import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatRange = (start, end, locale) => {
  const fmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  const a = fmt.format(new Date(`${start}T00:00:00`));
  if (start === end) return a;
  const b = fmt.format(new Date(`${end}T00:00:00`));
  return `${a} → ${b}`;
};

const ClosedDaysPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const { t, lang } = useAdminLanguage();
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB';

  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draft, setDraft] = useState({ startDate: todayIso(), endDate: todayIso(), reason: '' });
  const [saving, setSaving] = useState(false);

  const fetchRanges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${apiUrl}/api/closed-days/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) setRanges(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        onUnauthorized?.();
        return;
      }
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl, onUnauthorized]);

  useEffect(() => {
    fetchRanges();
  }, [fetchRanges, refreshTick]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!draft.startDate || !draft.endDate) {
      setError(t('closedDays.errors.datesRequired'));
      return;
    }
    if (draft.endDate < draft.startDate) {
      setError(t('closedDays.errors.endBeforeStart'));
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${apiUrl}/api/closed-days`,
        { startDate: draft.startDate, endDate: draft.endDate, reason: draft.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDraft({ startDate: todayIso(), endDate: todayIso(), reason: '' });
      setSuccess(t('closedDays.saved'));
      await fetchRanges();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('closedDays.confirmDelete'))) return;
    setError('');
    try {
      await axios.delete(`${apiUrl}/api/closed-days/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRanges();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="closed-days-panel">
      <header className="closed-days-header">
        <h2>{t('closedDays.title')}</h2>
        <p>{t('closedDays.subtitle')}</p>
      </header>

      <form className="closed-days-form" onSubmit={handleSubmit}>
        <div className="closed-days-field">
          <label htmlFor="closed-start">{t('closedDays.startDate')}</label>
          <input
            id="closed-start"
            type="date"
            value={draft.startDate}
            min={todayIso()}
            onChange={(e) => setDraft((prev) => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        <div className="closed-days-field">
          <label htmlFor="closed-end">{t('closedDays.endDate')}</label>
          <input
            id="closed-end"
            type="date"
            value={draft.endDate}
            min={draft.startDate || todayIso()}
            onChange={(e) => setDraft((prev) => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
        <div className="closed-days-field closed-days-field-grow">
          <label htmlFor="closed-reason">{t('closedDays.reason')}</label>
          <input
            id="closed-reason"
            type="text"
            value={draft.reason}
            maxLength={280}
            placeholder={t('closedDays.reasonPh')}
            onChange={(e) => setDraft((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </div>
        <button type="submit" className="closed-days-save" disabled={saving}>
          {saving ? t('closedDays.saving') : t('closedDays.add')}
        </button>
      </form>

      {error && <div className="closed-days-error">{error}</div>}
      {success && <div className="closed-days-success">{success}</div>}

      <div className="closed-days-list">
        {loading ? (
          <p className="closed-days-empty">{t('closedDays.loading')}</p>
        ) : ranges.length === 0 ? (
          <p className="closed-days-empty">{t('closedDays.empty')}</p>
        ) : (
          <ul>
            {ranges.map((range) => (
              <li key={range.id} className="closed-days-item">
                <div className="closed-days-item-main">
                  <strong>{formatRange(range.startDate, range.endDate, locale)}</strong>
                  {range.reason ? <span className="closed-days-item-reason">{range.reason}</span> : null}
                </div>
                <button
                  type="button"
                  className="closed-days-delete"
                  onClick={() => handleDelete(range.id)}
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClosedDaysPanel;
