import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAdminLanguage } from './AdminLanguageContext.jsx';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import BookingCard from './components/BookingCard';
import LoginForm from './components/LoginForm';
import ReservationsPanel from './components/ReservationsPanel';
import MessagesPanel from './components/MessagesPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Loud alert beep length (s) + gap (ms) between repeats while a new order modal is open */
const ORDER_ALERT_BEEP_S = 0.72;
const ORDER_ALERT_GAP_MS = 1000;
const ORDER_ALERT_CYCLE_MS = ORDER_ALERT_BEEP_S * 1000 + ORDER_ALERT_GAP_MS;
const NEW_ORDER_ALERT_TIMEOUT_MS = 60_000;

function App() {
  const { t } = useAdminLanguage();
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
  const [incomingOrderQueue, setIncomingOrderQueue] = useState([]);
  const [alertBooking, setAlertBooking] = useState(null);
  const [newOrderMinutes, setNewOrderMinutes] = useState('30');
  const [alertLoadFailed, setAlertLoadFailed] = useState(false);
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
      setError(err.response?.data?.error || t('errors.loginFailed'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setIsLoggedIn(false);
    setBookings([]);
    setIncomingOrderQueue([]);
    setAlertBooking(null);
    setAlertLoadFailed(false);
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

  const playOrderAlertBeep = useCallback(async () => {
    if (!soundEnabledRef.current) return;
    const ctx = await ensureAudioContext();
    if (!ctx) return;

    try {
      const duration = ORDER_ALERT_BEEP_S;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.value = 784;
      osc2.frequency.value = 988;
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.72, now + 0.04);
      gain.gain.setValueAtTime(0.72, now + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
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

  const queueHeadId = incomingOrderQueue[0]?.id;

  useEffect(() => {
    if (!queueHeadId || !token) {
      setAlertBooking(null);
      setAlertLoadFailed(false);
      return;
    }

    let cancelled = false;
    setAlertLoadFailed(false);

    (async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/bookings?id=${encodeURIComponent(queueHeadId)}&limit=1&page=1`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const list = Array.isArray(res.data) ? res.data : res.data.data || [];
        const b = list[0];
        if (cancelled) return;
        if (b) {
          setAlertBooking(b);
          setNewOrderMinutes(String(b.pickupRequestedInMinutes || 30));
          setAlertLoadFailed(false);
        } else {
          setAlertBooking(null);
          setAlertLoadFailed(true);
        }
      } catch {
        if (!cancelled) {
          setAlertBooking(null);
          setAlertLoadFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [queueHeadId, token]);

  useEffect(() => {
    if (!alertBooking?._id) return;
    if (alertBooking.status !== 'pending') {
      const headId = String(alertBooking._id);
      setAlertBooking(null);
      setIncomingOrderQueue((q) => {
        if (!q.length || String(q[0].id) !== headId) return q;
        return q.slice(1);
      });
    }
  }, [alertBooking]);

  useEffect(() => {
    if (!alertBooking || alertBooking.status !== 'pending') return;
    const id = String(alertBooking._id);
    const timer = setTimeout(() => {
      setAlertBooking(null);
      setIncomingOrderQueue((q) => {
        if (!q.length || String(q[0].id) !== id) return q;
        return q.slice(1);
      });
      window.alert(t('orders.newOrderTimeout'));
    }, NEW_ORDER_ALERT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [alertBooking, t]);

  useEffect(() => {
    if (!soundEnabled || !alertBooking || alertBooking.status !== 'pending') return;
    let cancelled = false;
    const fire = () => {
      if (!cancelled) void playOrderAlertBeep();
    };
    fire();
    const intervalId = setInterval(fire, ORDER_ALERT_CYCLE_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [soundEnabled, alertBooking, playOrderAlertBeep]);

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchBookings();
    }
  }, [token, fetchBookings]);

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { transports: ['websocket'] });

    socket.on('new_order', (payload) => {
      fetchBookings();
      const rawId = payload?.id;
      const id = rawId != null ? String(rawId) : '';
      if (!id) return;
      setIncomingOrderQueue((prev) => {
        if (prev.some((p) => String(p.id) === id)) return prev;
        return [...prev, { id, orderCode: payload?.orderCode, createdAt: payload?.createdAt }];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, fetchBookings]);

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
      alert(t('orders.updateFailed', { msg: err.response?.data?.error || err.message }));
      throw err;
    }
  };

  const confirmNewOrderAlertReceive = async () => {
    if (!alertBooking?._id) return;
    try {
      await axios.patch(`${API_URL}/api/bookings/${alertBooking._id}/receive`, {
        confirmedMinutes: Number(newOrderMinutes),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlertBooking(null);
      setIncomingOrderQueue((q) => q.slice(1));
      fetchBookings();
    } catch (err) {
      alert(t('orders.receiveFailed', { msg: err.response?.data?.error || err.message }));
    }
  };

  const rejectNewOrderAlert = async () => {
    if (!alertBooking?._id) return;
    try {
      await rejectOrder(alertBooking._id);
      setAlertBooking(null);
      setIncomingOrderQueue((q) => q.slice(1));
    } catch {
      /* rejectOrder already alerted */
    }
  };

  const skipFailedOrderAlert = () => {
    setAlertBooking(null);
    setIncomingOrderQueue((q) => q.slice(1));
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
      alert(t('orders.receiveFailed', { msg: err.response?.data?.error || err.message }));
    }
  };

  const markCollected = async (id) => {
    try {
      await axios.patch(`${API_URL}/api/bookings/${id}/collected`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      alert(t('orders.updateFailed', { msg: err.response?.data?.error || err.message }));
    }
  };

  const handleSidebarNavigate = (tab) => {
    if (tab === 'orders') {
      setActiveTab('orders');
      setFilters((prev) => ({ ...prev, orderType: 'pickup' }));
      setPage(1);
      return;
    }
    setActiveTab(tab);
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
    <div className="admin-app admin-app--dashboard">
      <AdminSidebar activeTab={activeTab} onNavigate={handleSidebarNavigate} />
      <div className="admin-dashboard-body">
        <Navbar onLogout={handleLogout} onRefresh={handleRefresh} sectionKey={activeTab} />
        <main className="dashboard-main">
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
              <label>{t('common.search')}</label>
              <input 
                type="text" 
                name="search" 
                placeholder={t('orders.searchPh')} 
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>{t('orders.type')}</label>
              <select name="orderType" value={filters.orderType} onChange={handleFilterChange}>
                <option value="pickup">{t('orders.pickupOrders')}</option>
                <option value="booking">{t('orders.tableBookings')}</option>
                <option value="">{t('common.all')}</option>
              </select>
            </div>
            <div className="filter-item">
              <label>{t('common.status')}</label>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">{t('common.all')}</option>
                <option value="pending">{t('bookingStatus.pending')}</option>
                <option value="received">{t('bookingStatus.received')}</option>
                <option value="collected">{t('bookingStatus.collected')}</option>
                <option value="rejected">{t('bookingStatus.rejected')}</option>
                <option value="confirmed">{t('bookingStatus.confirmed')}</option>
              </select>
            </div>
            <div className="filter-item">
              <label>{t('orders.orderCode')}</label>
              <input
                type="text"
                name="code"
                placeholder={t('orders.orderCodePh')}
                value={filters.code}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>{t('orders.createdDate')}</label>
              <input
                type="date"
                name="createdDate"
                value={filters.createdDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>{t('common.date')}</label>
              <input 
                type="date" 
                name="date" 
                value={filters.date}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <label>{t('common.time')}</label>
              <select name="time" value={filters.time} onChange={handleFilterChange}>
                <option value="">{t('common.allTimes')}</option>
                {timeSlotOptions.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label>{t('orders.tableSize')}</label>
              <select name="tableSize" value={filters.tableSize} onChange={handleFilterChange}>
                <option value="">{t('orders.allSizes')}</option>
                <option value="2">2 {t('common.persons')}</option>
                <option value="4">4 {t('common.persons')}</option>
                <option value="6">6 {t('common.persons')}</option>
                <option value="8">8 {t('common.persons')}</option>
              </select>
            </div>
            <button
              className="btn-reset-filters"
              onClick={() => {
                setFilters({ orderType: 'pickup', status: '', code: '', createdDate: '', date: '', time: '', tableSize: '', search: '' });
                setPage(1);
              }}
            >
              {t('common.reset')}
            </button>
          </div>
        </section>

        <header className="dashboard-header-flex">
          <h2>{t('orders.recentTitle', { n: pagination.total })}</h2>
          {loading && <span className="loading-indicator">{t('common.updating')}</span>}
          {!soundEnabled && (
            <button
              type="button"
              className="btn-enable-sound"
              onClick={handleEnableSound}
              data-tooltip={t('orders.enableSoundTip')}
            >
              {t('orders.enableSound')}
            </button>
          )}
        </header>

        {bookings.length === 0 && !loading ? (
          <div className="empty-state">
            <p>{t('orders.empty')}</p>
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
        )}
        </main>
      </div>

      {showReceiveModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h3>{t('orders.receiveTitle')}</h3>
              <button type="button" onClick={() => setShowReceiveModal(false)}>&times;</button>
            </header>
            <div className="modal-form-group">
              <label>{t('common.order')}</label>
              <div style={{ fontWeight: 800 }}>
                {receiveTarget?.orderCode || receiveTarget?._id}
              </div>
            </div>
            <div className="modal-form-group">
              <label>{t('common.requested')}</label>
              <div style={{ fontWeight: 700, color: '#636e72' }}>
                {receiveTarget?.pickupRequestedInMinutes ? `${receiveTarget.pickupRequestedInMinutes} ${t('common.min')}` : '-'}
              </div>
            </div>
            <div className="modal-form-group">
              <label>{t('common.confirmPickupIn')}</label>
              <select value={receiveMinutes} onChange={(e) => setReceiveMinutes(e.target.value)}>
                <option value="15">15 {t('common.min')}</option>
                <option value="30">30 {t('common.min')}</option>
                <option value="45">45 {t('common.min')}</option>
                <option value="60">60 {t('common.min')}</option>
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowReceiveModal(false)} className="btn-cancel">{t('common.cancel')}</button>
              <button type="button" onClick={confirmReceive} className="btn-save">{t('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {incomingOrderQueue.length > 0 && (
        <div
          className="admin-modal-overlay admin-modal-overlay--order-alert"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="new-order-alert-title"
        >
          <div className="admin-modal admin-modal--order-alert">
            <header>
              <h3 id="new-order-alert-title">{t('orders.newOrderTitle')}</h3>
            </header>
            {incomingOrderQueue.length > 1 && (
              <p className="new-order-alert-queue">
                {t('orders.newOrderQueueHint', { n: incomingOrderQueue.length - 1 })}
              </p>
            )}
            {!soundEnabled && (
              <p className="new-order-alert-meta" style={{ color: '#c27c00', fontWeight: 700 }}>
                {t('orders.enableSoundTip')}
              </p>
            )}
            {alertLoadFailed ? (
              <>
                <p className="new-order-alert-meta">{t('orders.newOrderNotFound')}</p>
                <div className="modal-actions">
                  <button type="button" className="btn-save" onClick={skipFailedOrderAlert}>
                    {t('common.close')}
                  </button>
                </div>
              </>
            ) : !alertBooking ? (
              <p className="new-order-alert-meta">{t('orders.newOrderLoading')}</p>
            ) : (
              <>
                <div className="modal-form-group">
                  <label>{t('common.order')}</label>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{alertBooking.orderCode || alertBooking._id}</div>
                </div>
                <div className="new-order-alert-meta">
                  <strong>{alertBooking.customer?.name || '—'}</strong>
                  {' · '}
                  {alertBooking.customer?.phone || '—'}
                  <br />
                  {alertBooking.customer?.email || '—'}
                </div>
                {alertBooking.status === 'pending' ? (
                  <>
                    {alertBooking.additionalInfo ? (
                      <div className="modal-form-group">
                        <label>{t('bookingCard.note')}</label>
                        <div className="new-order-alert-meta" style={{ whiteSpace: 'pre-wrap' }}>
                          {alertBooking.additionalInfo}
                        </div>
                      </div>
                    ) : null}
                    <div className="modal-form-group">
                      <label>{t('common.requested')}</label>
                      <div style={{ fontWeight: 700 }}>
                        {alertBooking.pickupRequestedInMinutes != null
                          ? `${alertBooking.pickupRequestedInMinutes} ${t('common.min')}`
                          : '—'}
                      </div>
                    </div>
                    {Array.isArray(alertBooking.items) && alertBooking.items.length > 0 ? (
                      <div className="modal-form-group">
                        <label>{t('bookingCard.items')}</label>
                        <ul className="new-order-alert-items">
                          {alertBooking.items.map((it) => {
                            const qty = Number(it.qty) || 0;
                            const line = (Number(it.price) || 0) * qty;
                            return (
                              <li key={it.id || `${it.label}-${qty}`}>
                                <span>
                                  {qty}× {it.label}
                                </span>
                                <span>{line > 0 ? `€${line.toFixed(2)}` : ''}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                    <p className="new-order-alert-total">
                      {t('common.total')}: €
                      {(() => {
                        if (typeof alertBooking.totalAmount === 'number') {
                          return alertBooking.totalAmount.toFixed(2);
                        }
                        const items = Array.isArray(alertBooking.items) ? alertBooking.items : [];
                        const sum = items.reduce(
                          (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0),
                          0,
                        );
                        return sum.toFixed(2);
                      })()}
                    </p>
                    <div className="modal-form-group">
                      <label>{t('common.confirmPickupIn')}</label>
                      <select value={newOrderMinutes} onChange={(e) => setNewOrderMinutes(e.target.value)}>
                        <option value="15">15 {t('common.min')}</option>
                        <option value="30">30 {t('common.min')}</option>
                        <option value="45">45 {t('common.min')}</option>
                        <option value="60">60 {t('common.min')}</option>
                      </select>
                    </div>
                    <div className="modal-actions modal-actions--stack">
                      <button type="button" className="btn-reject-order" onClick={rejectNewOrderAlert}>
                        {t('orders.newOrderReject')}
                      </button>
                      <button type="button" className="btn-accept-order" onClick={confirmNewOrderAlertReceive}>
                        {t('orders.newOrderAccept')}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="new-order-alert-meta">{t('orders.newOrderLoading')}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
