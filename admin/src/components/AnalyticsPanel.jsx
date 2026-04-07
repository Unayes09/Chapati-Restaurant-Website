import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const AnalyticsPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totals: { orders: 0, reservations: 0, messages: 0 }, days: [] });
  const [cleanupResult, setCleanupResult] = useState('');
  const [keepDays, setKeepDays] = useState({ orders: '30', reservations: '30', messages: '30' });

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (err) {
      if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
    } finally {
      setLoading(false);
    }
  }, [apiUrl, onUnauthorized, token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshTick]);

  const chartDays = useMemo(() => {
    const days = Array.isArray(stats.days) ? stats.days : [];
    return days.slice(Math.max(0, days.length - 14));
  }, [stats.days]);

  const maxY = useMemo(() => {
    const vals = chartDays.flatMap((d) => [toNumber(d.orders), toNumber(d.reservations), toNumber(d.messages)]);
    return Math.max(1, ...vals);
  }, [chartDays]);

  const runCleanup = async (resource) => {
    const days = Number(keepDays[resource]);
    if (!Number.isFinite(days)) return;
    const ok = window.confirm(`Delete all ${resource} older than ${days} days?`);
    if (!ok) return;
    setCleanupResult('');
    try {
      const res = await axios.post(
        `${apiUrl}/api/admin/cleanup`,
        { resource, keepDays: days },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCleanupResult(`${resource}: deleted ${res.data.deletedCount}`);
      fetchStats();
    } catch (err) {
      if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
      setCleanupResult('Cleanup failed');
    }
  };

  return (
    <>
      <header className="dashboard-header-flex">
        <h2>Analytics</h2>
        {loading && <span className="loading-indicator">Updating...</span>}
      </header>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-label">Last 30 days Orders</div>
          <div className="analytics-value">{toNumber(stats.totals?.orders)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Last 30 days Reservations</div>
          <div className="analytics-value">{toNumber(stats.totals?.reservations)}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Last 30 days Messages</div>
          <div className="analytics-value">{toNumber(stats.totals?.messages)}</div>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="analytics-chart-header">
          <div>
            <div className="analytics-label">Last 14 days</div>
            <div className="analytics-sub">Paris time grouping</div>
          </div>
          <div className="analytics-legend">
            <span className="legend-dot legend-orders"></span> Orders
            <span className="legend-dot legend-reservations"></span> Reservations
            <span className="legend-dot legend-messages"></span> Messages
          </div>
        </div>

        <div className="analytics-chart">
          <svg viewBox="0 0 700 220" width="100%" height="220" role="img" aria-label="Activity chart">
            {chartDays.map((d, idx) => {
              const xBase = 20 + idx * 48;
              const barW = 10;
              const gap = 6;
              const hOrders = (toNumber(d.orders) / maxY) * 160;
              const hRes = (toNumber(d.reservations) / maxY) * 160;
              const hMsg = (toNumber(d.messages) / maxY) * 160;
              const yBase = 190;
              return (
                <g key={d.date || idx}>
                  <rect x={xBase} y={yBase - hOrders} width={barW} height={hOrders} rx="2" className="bar-orders" />
                  <rect x={xBase + barW + gap} y={yBase - hRes} width={barW} height={hRes} rx="2" className="bar-reservations" />
                  <rect x={xBase + (barW + gap) * 2} y={yBase - hMsg} width={barW} height={hMsg} rx="2" className="bar-messages" />
                  <text x={xBase + 12} y={210} textAnchor="middle" className="chart-x">
                    {String(d.date || '').slice(8, 10)}
                  </text>
                </g>
              );
            })}
            <line x1="10" y1="190" x2="690" y2="190" className="chart-axis" />
          </svg>
        </div>
      </div>

      <header className="dashboard-header-flex">
        <h2>Tools</h2>
      </header>

      <div className="tools-grid">
        <div className="tools-card">
          <div className="tools-title">Cleanup Orders</div>
          <div className="tools-row">
            <select value={keepDays.orders} onChange={(e) => setKeepDays((p) => ({ ...p, orders: e.target.value }))}>
              <option value="15">Keep last 15 days</option>
              <option value="30">Keep last 30 days</option>
              <option value="60">Keep last 60 days</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('orders')}>
              Delete older
            </button>
          </div>
        </div>
        <div className="tools-card">
          <div className="tools-title">Cleanup Reservations</div>
          <div className="tools-row">
            <select value={keepDays.reservations} onChange={(e) => setKeepDays((p) => ({ ...p, reservations: e.target.value }))}>
              <option value="15">Keep last 15 days</option>
              <option value="30">Keep last 30 days</option>
              <option value="60">Keep last 60 days</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('reservations')}>
              Delete older
            </button>
          </div>
        </div>
        <div className="tools-card">
          <div className="tools-title">Cleanup Messages</div>
          <div className="tools-row">
            <select value={keepDays.messages} onChange={(e) => setKeepDays((p) => ({ ...p, messages: e.target.value }))}>
              <option value="15">Keep last 15 days</option>
              <option value="30">Keep last 30 days</option>
              <option value="60">Keep last 60 days</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('messages')}>
              Delete older
            </button>
          </div>
        </div>
      </div>

      {cleanupResult && <div className="tools-result">{cleanupResult}</div>}
    </>
  );
};

export default AnalyticsPanel;

