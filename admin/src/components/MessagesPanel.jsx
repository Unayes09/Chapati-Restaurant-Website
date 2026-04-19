import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';

const formatParisDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const buildPreview = (value) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return { preview: '', isTruncated: false };
  const words = text.split(' ');
  const maxWords = 4;
  if (words.length <= maxWords) return { preview: text, isTruncated: false };
  return { preview: words.slice(0, maxWords).join(' '), isTruncated: true };
};

const MessagesPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const { t } = useAdminLanguage();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selectedId, setSelectedId] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      params.append('page', String(page));
      params.append('limit', String(pagination.limit || 10));

      const res = await axios.get(`${apiUrl}/api/messages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filters, onUnauthorized, page, pagination.limit, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages, refreshTick]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`${apiUrl}/api/messages/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchMessages();
    } catch {
      return;
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm(t('messages.deleteConfirm'))) return;
    try {
      await axios.delete(`${apiUrl}/api/messages/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedId((prev) => (prev === id ? '' : prev));
      fetchMessages();
    } catch {
      return;
    }
  };

  const rows = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        dateTime: formatParisDateTime(m.createdAt),
        ...buildPreview(m.message),
      })),
    [messages],
  );

  const selectedMessage = useMemo(() => messages.find((m) => m._id === selectedId), [messages, selectedId]);

  return (
    <>
      <section className="admin-controls">
        <div className="search-filters-bar">
          <div className="filter-item">
            <label>{t('common.search')}</label>
            <input
              type="text"
              name="search"
              placeholder={t('messages.searchPh')}
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>{t('common.status')}</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">{t('common.all')}</option>
              <option value="new">{t('messageStatus.new')}</option>
              <option value="read">{t('messageStatus.read')}</option>
            </select>
          </div>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setFilters({ search: '', status: '' });
              setPage(1);
            }}
          >
            {t('common.reset')}
          </button>
        </div>
      </section>

      <header className="dashboard-header-flex">
        <h2>{t('messages.title', { n: pagination.total })}</h2>
        {loading && <span className="loading-indicator">{t('common.updating')}</span>}
      </header>

      {rows.length === 0 && !loading ? (
        <div className="empty-state">
          <p>{t('messages.empty')}</p>
        </div>
      ) : (
        <>
          <div className="messages-table">
            <div className="messages-head">
              <div>{t('messages.colDate')}</div>
              <div>{t('messages.colName')}</div>
              <div>{t('messages.colEmail')}</div>
              <div>{t('messages.colPhone')}</div>
              <div>{t('messages.colMessage')}</div>
              <div>{t('messages.colActions')}</div>
            </div>
            {rows.map((m) => (
              <div key={m._id} className={`messages-row ${m.status === 'new' ? 'is-new' : ''}`}>
                <div>{m.dateTime}</div>
                <div className="messages-strong">{m.name}</div>
                <div className="messages-link">
                  <a href={`mailto:${m.email}`}>{m.email}</a>
                </div>
                <div className="messages-link">
                  <a href={`tel:${m.phone}`}>{m.phone || '-'}</a>
                </div>
                <div className="messages-message">
                  <button
                    type="button"
                    className="messages-expand"
                    onClick={() => setSelectedId((prev) => (prev === m._id ? '' : m._id))}
                    aria-expanded={selectedId === m._id}
                  >
                    {`${m.preview}${m.isTruncated ? '…' : ''}`}
                  </button>
                </div>
                <div className="messages-actions">
                  {m.status === 'new' && (
                    <button type="button" className="btn-mini" onClick={() => markRead(m._id)}>
                      {t('messages.markRead')}
                    </button>
                  )}
                  <button type="button" className="btn-mini btn-mini-danger" onClick={() => deleteMessage(m._id)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedMessage && (
            <div className="message-details-panel">
              <div className="message-details-header">
                <div className="message-details-title">{t('messages.detailsTitle')}</div>
                <button type="button" className="btn-mini" onClick={() => setSelectedId('')}>
                  {t('common.close')}
                </button>
              </div>
              <div className="message-details-grid">
                <div>
                  <div className="message-details-label">{t('messages.colName')}</div>
                  <div className="message-details-value">{selectedMessage.name}</div>
                </div>
                <div>
                  <div className="message-details-label">{t('messages.colEmail')}</div>
                  <div className="message-details-value">
                    <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                  </div>
                </div>
                <div>
                  <div className="message-details-label">{t('messages.colPhone')}</div>
                  <div className="message-details-value">
                    <a href={`tel:${selectedMessage.phone}`}>{selectedMessage.phone || '-'}</a>
                  </div>
                </div>
                <div>
                  <div className="message-details-label">{t('messages.colDate')}</div>
                  <div className="message-details-value">{formatParisDateTime(selectedMessage.createdAt)}</div>
                </div>
              </div>
              <div className="message-details-body">{selectedMessage.message}</div>
              <div className="message-details-actions">
                {selectedMessage.status === 'new' && (
                  <button type="button" className="btn-mini" onClick={() => markRead(selectedMessage._id)}>
                    {t('messages.markRead')}
                  </button>
                )}
                <button type="button" className="btn-mini btn-mini-danger" onClick={() => deleteMessage(selectedMessage._id)}>
                  {t('common.delete')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="pagination-bar">
        <button type="button" className="btn-page" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          {t('common.prev')}
        </button>
        <div className="page-info">
          {t('common.page')} {pagination.page} / {pagination.totalPages}
        </div>
        <button
          type="button"
          className="btn-page"
          disabled={page >= pagination.totalPages || loading}
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
        >
          {t('common.next')}
        </button>
      </div>
    </>
  );
};

export default MessagesPanel;
