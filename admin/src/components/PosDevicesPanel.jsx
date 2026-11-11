import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const PosDevicesPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const { t, lang } = useAdminLanguage();
  const [devices, setDevices] = useState([]);
  const [draft, setDraft] = useState({ firebaseId: '', label: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const authConfig = useCallback(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const handleApiError = useCallback(
    (err) => {
      if (err.response?.status === 401) {
        onUnauthorized?.();
        return;
      }
      setError(err.response?.data?.error || err.message);
    },
    [onUnauthorized],
  );

  const fetchDevices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${apiUrl}/api/admin/pos-devices`, authConfig());
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl, authConfig, handleApiError]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices, refreshTick]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const firebaseId = draft.firebaseId.trim();
    if (!firebaseId) {
      setError(t('posDevices.errors.idRequired'));
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(
        `${apiUrl}/api/admin/pos-devices`,
        { firebaseId, label: draft.label.trim() || undefined },
        authConfig(),
      );
      setDraft({ firebaseId: '', label: '' });
      setSuccess(t('posDevices.saved'));
      await fetchDevices();
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDevice = async (device) => {
    setBusyId(device._id);
    setError('');
    try {
      await axios.patch(
        `${apiUrl}/api/admin/pos-devices/${device._id}`,
        { active: !device.active },
        authConfig(),
      );
      await fetchDevices();
    } catch (err) {
      handleApiError(err);
    } finally {
      setBusyId('');
    }
  };

  const deleteDevice = async (device) => {
    if (!window.confirm(t('posDevices.confirmDelete', { label: device.label }))) return;
    setBusyId(device._id);
    setError('');
    try {
      await axios.delete(`${apiUrl}/api/admin/pos-devices/${device._id}`, authConfig());
      await fetchDevices();
    } catch (err) {
      handleApiError(err);
    } finally {
      setBusyId('');
    }
  };

  const copyId = async (firebaseId) => {
    try {
      await navigator.clipboard.writeText(firebaseId);
      setSuccess(t('posDevices.copied'));
    } catch {
      setError(t('posDevices.errors.copyFailed'));
    }
  };

  const dateFormatter = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <section className="pos-devices-panel">
      <header className="pos-devices-header">
        <div>
          <h2>{t('posDevices.title')}</h2>
          <p>{t('posDevices.subtitle')}</p>
        </div>
        <span className="pos-devices-count">
          {t('posDevices.activeCount', { n: devices.filter((device) => device.active).length })}
        </span>
      </header>

      <form className="pos-devices-form" onSubmit={handleSubmit}>
        <div className="pos-devices-field">
          <label htmlFor="pos-device-label">{t('posDevices.label')}</label>
          <input
            id="pos-device-label"
            type="text"
            maxLength={100}
            value={draft.label}
            placeholder={t('posDevices.labelPh')}
            onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
          />
        </div>
        <div className="pos-devices-field pos-devices-field-id">
          <label htmlFor="pos-device-id">{t('posDevices.firebaseId')}</label>
          <input
            id="pos-device-id"
            type="text"
            maxLength={2048}
            value={draft.firebaseId}
            placeholder={t('posDevices.firebaseIdPh')}
            autoComplete="off"
            spellCheck="false"
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, firebaseId: event.target.value }))
            }
            required
          />
        </div>
        <button className="pos-devices-add" type="submit" disabled={saving}>
          {saving ? t('posDevices.saving') : t('posDevices.add')}
        </button>
      </form>

      {error && <div className="pos-devices-alert pos-devices-alert-error">{error}</div>}
      {success && <div className="pos-devices-alert pos-devices-alert-success">{success}</div>}

      <div className="pos-devices-list">
        {loading ? (
          <p className="pos-devices-empty">{t('posDevices.loading')}</p>
        ) : devices.length === 0 ? (
          <p className="pos-devices-empty">{t('posDevices.empty')}</p>
        ) : (
          devices.map((device) => (
            <article className="pos-device-card" key={device._id}>
              <div className="pos-device-main">
                <div className="pos-device-title-row">
                  <h3>{device.label || t('posDevices.defaultLabel')}</h3>
                  <span className={`pos-device-status ${device.active ? 'is-active' : 'is-disabled'}`}>
                    {device.active ? t('posDevices.active') : t('posDevices.disabled')}
                  </span>
                </div>
                <div className="pos-device-id-row">
                  <code>{device.firebaseId}</code>
                  <button type="button" onClick={() => copyId(device.firebaseId)}>
                    {t('posDevices.copy')}
                  </button>
                </div>
                <small>
                  {t('posDevices.added', {
                    date: device.createdAt
                      ? dateFormatter.format(new Date(device.createdAt))
                      : t('common.noData'),
                  })}
                </small>
              </div>
              <div className="pos-device-actions">
                <button
                  type="button"
                  className="pos-device-toggle"
                  disabled={busyId === device._id}
                  onClick={() => toggleDevice(device)}
                >
                  {device.active ? t('posDevices.disable') : t('posDevices.enable')}
                </button>
                <button
                  type="button"
                  className="pos-device-delete"
                  disabled={busyId === device._id}
                  onClick={() => deleteDevice(device)}
                >
                  {t('common.delete')}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default PosDevicesPanel;
