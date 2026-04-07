import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import BookingCard from './components/BookingCard';
import LoginForm from './components/LoginForm';
import ReservationsPanel from './components/ReservationsPanel';
import MessagesPanel from './components/MessagesPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [activeTab, setActiveTab] = useState('orders');
  const [refreshTick, setRefreshTick] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    orderType: 'pickup',
    status: '',
    code: '',
    createdDate: '',
    date: '',
    time: '',
    tableSize: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiveMinutes, setReceiveMinutes] = useState('30');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, loginData);
      const { token } = res.data;
      localStorage.setItem('adminToken', token);
      setToken(token);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setIsLoggedIn(false);
    setBookings([]);
    setSoundEnabled(false);
    audioCtxRef.current = null;
    soundEnabledRef.current = false;
  };

  const handleRefresh = () => {
    setRefreshTick((t) => t + 1);
    if (activeTab === 'orders') {
      fetchBookings();
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.orderType) params.append('orderType', filters.orderType);
      if (filters.status) params.append('status', filters.status);
      if (filters.code) params.append('code', filters.code);
      if (filters.createdDate) params.append('createdDate', filters.createdDate);
      if (filters.date) params.append('date', filters.date);
      if (filters.time) params.append('time', filters.time);
      if (filters.tableSize) params.append('tableSize', filters.tableSize);
      if (filters.search) params.append('search', filters.search);
      params.append('page', String(page));
      params.append('limit', String(pagination.limit || 10));

      const res = await axios.get(`${API_URL}/api/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(res.data)) {
        setBookings(res.data);
        setPagination((prev) => ({ ...prev, page: 1, totalPages: 1 }));
      } else {
        setBookings(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Fetch bookings failed', err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }, [filters, page, pagination.limit, token]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const ensureAudioContext = useCallback(async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    if (audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch {
        return audioCtxRef.current;
      }
    }

    return audioCtxRef.current;
  }, []);

  const playBeep = useCallback(async ({ seconds = 1.0 } = {}) => {
    if (!soundEnabledRef.current) return;
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 880;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + seconds);
    } catch {
      return;
    }
  }, [ensureAudioContext]);

  const handleEnableSound = async () => {
    setSoundEnabled(true);
    soundEnabledRef.current = true;
    await ensureAudioContext();
    await playBeep({ seconds: 0.25 });
  };

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchBookings();
    }
  }, [token, fetchBookings]);

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { transports: ['websocket'] });

    socket.on('new_order', () => {
      playBeep({ seconds: 1.0 });
      fetchBookings();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, fetchBookings, playBeep]);

  const timeSlotOptions = [];
  for (let h = 11; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeSlotOptions.push(time);
    }
  }

  const rejectOrder = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/bookings/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const openReceiveModal = (booking) => {
    setReceiveTarget(booking);
    setReceiveMinutes(String(booking.pickupRequestedInMinutes || 30));
    setShowReceiveModal(true);
  };

  const confirmReceive = async () => {
    if (!receiveTarget?._id) return;
    try {
      await axios.patch(`${API_URL}/api/bookings/${receiveTarget._id}/receive`, {
        confirmedMinutes: Number(receiveMinutes),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowReceiveModal(false);
      setReceiveTarget(null);
      fetchBookings();
    } catch (err) {
      alert('Receive failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const markCollected = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/bookings/${id}/collected`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-app">
        <LoginForm 
          loginData={loginData}
          onChange={handleLoginChange}
          onSubmit={handleLogin}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="admin-app">
      <Navbar onLogout={handleLogout} onRefresh={handleRefresh} />
      
      <main className="dashboard-main">
        <div className="admin-top-tabs">
          <button
            type="button"
            className={`admin-top-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              setFilters((prev) => ({ ...prev, orderType: 'pickup' }));
              setPage(1);
            }}
          >
            Orders
          </button>
          <button
            type="button"
            className={`admin-top-tab ${activeTab === 'reservations' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            Reservations
          </button>
          <button
            type="button"
            className={`admin-top-tab ${activeTab === 'messages' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
          <button
            type="button"
            className={`admin-top-tab ${activeTab === 'analytics' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'reservations' ? (
          <ReservationsPanel token={token} apiUrl={API_URL} onUnauthorized={handleLogout} refreshTick={refreshTick} />
        ) : activeTab === 'messages' ? (
          <MessagesPanel token={token} apiUrl={API_URL} onUnauthorized={handleLogout} refreshTick={refreshTick} />
        ) : activeTab === 'analytics' ? (
          <AnalyticsPanel token={token} apiUrl={API_URL} onUnauthorized={handleLogout} refreshTick={refreshTick} />
        ) : (
        <>
        <section className="admin-controls">
          <div className="search-filters-bar">
            <div className="filter-item">
              <label>Search</label>
              <input 
                type="text" 
                name="search" 
                placeholder="Name, email, phone or code..." 
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Type</label>
              <select name="orderType" value={filters.orderType} onChange={handleFilterChange}>
                <option value="pickup">Pickup Orders</option>
                <option value="booking">Table Bookings</option>
                <option value="">All</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="received">received</option>
                <option value="collected">collected</option>
                <option value="rejected">rejected</option>
                <option value="confirmed">confirmed</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Order Code</label>
              <input
                type="text"
                name="code"
                placeholder="e.g. CH-1234"
                value={filters.code}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Created Date</label>
              <input
                type="date"
                name="createdDate"
                value={filters.createdDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>Time</label>
              <select name="time" value={filters.time} onChange={handleFilterChange}>
                <option value="">All Times</option>
                {timeSlotOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="filter-item">
              <label>Table Size</label>
              <select name="tableSize" value={filters.tableSize} onChange={handleFilterChange}>
                <option value="">All Sizes</option>
                <option value="2">2 Persons</option>
                <option value="4">4 Persons</option>
                <option value="6">6 Persons</option>
                <option value="8">8 Persons</option>
              </select>
            </div>
            <button
              className="btn-reset-filters"
              onClick={() => {
                setFilters({ orderType: 'pickup', status: '', code: '', createdDate: '', date: '', time: '', tableSize: '', search: '' });
                setPage(1);
              }}
            >
              Reset
            </button>
          </div>
        </section>

        <header className="dashboard-header-flex">
          <h2>Recent Orders ({pagination.total})</h2>
          {loading && <span className="loading-indicator">Updating...</span>}
          {!soundEnabled && (
            <button
              type="button"
              className="btn-enable-sound"
              onClick={handleEnableSound}
              data-tooltip="Enable this once to allow sound notifications when new order comes."
            >
              Enable Sound
            </button>
          )}
        </header>

        {bookings.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No bookings found with current filters.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <BookingCard 
                key={booking._id} 
                booking={booking} 
                onReceive={openReceiveModal}
                onReject={rejectOrder}
                onCollected={markCollected}
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
        )}
      </main>

      {showReceiveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h3>Receive Order</h3>
              <button onClick={() => setShowReceiveModal(false)}>&times;</button>
            </header>
            <div className="modal-form-group">
              <label>Order</label>
              <div style={{ fontWeight: 800 }}>
                {receiveTarget?.orderCode || receiveTarget?._id}
              </div>
            </div>
            <div className="modal-form-group">
              <label>Requested</label>
              <div style={{ fontWeight: 700, color: '#636e72' }}>
                {receiveTarget?.pickupRequestedInMinutes ? `${receiveTarget.pickupRequestedInMinutes} min` : '-'}
              </div>
            </div>
            <div className="modal-form-group">
              <label>Confirm pickup in</label>
              <select value={receiveMinutes} onChange={(e) => setReceiveMinutes(e.target.value)}>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowReceiveModal(false)} className="btn-cancel">Cancel</button>
              <button type="button" onClick={confirmReceive} className="btn-save">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
