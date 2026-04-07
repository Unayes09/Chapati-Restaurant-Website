import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BookingCard from './BookingCard';

const getParisTodayDateStr = () => {
  const now = new Date();
  const parisNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const yyyy = parisNow.getFullYear();
  const mm = String(parisNow.getMonth() + 1).padStart(2, '0');
  const dd = String(parisNow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const buildTimeSlotOptions = () => {
  const options = [];
  for (let h = 11; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return options;
};

const ReservationsPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const [loading, setLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [filters, setFilters] = useState({
    date: getParisTodayDateStr(),
    dateFrom: '',
    dateTo: '',
    time: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const timeSlotOptions = useMemo(() => buildTimeSlotOptions(), []);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('orderType', 'booking');
      if (filters.dateFrom || filters.dateTo) {
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
      } else if (filters.date) {
        params.append('date', filters.date);
      }
      if (filters.time) params.append('time', filters.time);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(page));
      params.append('limit', String(pagination.limit || 10));

      const res = await axios.get(`${apiUrl}/api/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReservations(res.data.data || []);
      if (res.data.pagination) setPagination(res.data.pagination);
    } catch (err) {
      if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
    } finally {
      setLoading(false);
    }
  }, [apiUrl, filters, onUnauthorized, page, pagination.limit, token]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations, refreshTick]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'date' && value) {
        next.dateFrom = '';
        next.dateTo = '';
      }
      if ((name === 'dateFrom' || name === 'dateTo') && value) {
        next.date = '';
      }
      return next;
    });
    setPage(1);
  };

  return (
    <>
      <section className="admin-controls">
        <div className="search-filters-bar">
          <div className="filter-item">
            <label>Search</label>
            <input
              type="text"
              name="search"
              placeholder="Name, email or phone..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-item">
            <label>Date</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />
          </div>
          <div className="filter-item">
            <label>Date From</label>
            <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
          </div>
          <div className="filter-item">
            <label>Date To</label>
            <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
          </div>
          <div className="filter-item">
            <label>Time</label>
            <select name="time" value={filters.time} onChange={handleFilterChange}>
              <option value="">All Times</option>
              {timeSlotOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setFilters({ date: getParisTodayDateStr(), dateFrom: '', dateTo: '', time: '', search: '' });
              setPage(1);
            }}
          >
            Today
          </button>
        </div>
      </section>

      <header className="dashboard-header-flex">
        <h2>Reservations ({pagination.total})</h2>
        {loading && <span className="loading-indicator">Updating...</span>}
      </header>

      {reservations.length === 0 && !loading ? (
        <div className="empty-state">
          <p>No reservations found.</p>
        </div>
      ) : (
        <div className="bookings-list">
          {reservations.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
            />
          ))}
        </div>
      )}

      <div className="pagination-bar">
        <button
          type="button"
          className="btn-page"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="page-info">
          Page {pagination.page} / {pagination.totalPages}
        </div>
        <button
          type="button"
          className="btn-page"
          disabled={page >= pagination.totalPages || loading}
          onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ReservationsPanel;
