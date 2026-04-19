import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAdminLanguage } from '../AdminLanguageContext.jsx';
import AnalyticsHintSurface from './AnalyticsHintSurface.jsx';

const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const STATUS_ORDER = ['pending', 'confirmed', 'received', 'collected', 'rejected'];
const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  received: '#06b6d4',
  collected: '#22c55e',
  rejected: '#ef4444',
};

const defaultStatusCounts = () =>
  STATUS_ORDER.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});

const mergeStatus = (obj) => ({ ...defaultStatusCounts(), ...(obj || {}) });

const AnalyticsPanel = ({ token, apiUrl, onUnauthorized, refreshTick }) => {
  const { t } = useAdminLanguage();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totals: { orders: 0, reservations: 0, messages: 0 },
    days: [],
    insights: null,
  });
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

  const ins = stats.insights || {};
  const pickupByStatus = useMemo(() => mergeStatus(stats.insights?.pickupByStatus), [stats.insights]);
  const tableByStatus = useMemo(() => mergeStatus(stats.insights?.tableBookingByStatus), [stats.insights]);
  const hourly = useMemo(() => {
    const h = stats.insights?.hourlyOrdersParis;
    return Array.isArray(h) ? h : [];
  }, [stats.insights]);
  const topItems = Array.isArray(ins.topItems) ? ins.topItems : [];
  const tableSizes = Array.isArray(ins.tableSizeBreakdown) ? ins.tableSizeBreakdown : [];
  const msgStatus = ins.messagesByStatus || { new: 0, read: 0 };
  const mix = ins.mix || { pickupCount: 0, tableBookingCount: 0, pickupSharePct: 0, tableSharePct: 0 };

  const chartDays = useMemo(() => {
    const days = Array.isArray(stats.days) ? stats.days : [];
    return days.slice(Math.max(0, days.length - 14));
  }, [stats.days]);

  const maxY = useMemo(() => {
    const vals = chartDays.flatMap((d) => [toNumber(d.orders), toNumber(d.reservations), toNumber(d.messages)]);
    return Math.max(1, ...vals);
  }, [chartDays]);

  const maxHourly = useMemo(() => {
    const m = Math.max(1, ...hourly.map((h) => toNumber(h.count)));
    return m;
  }, [hourly]);

  const dailyTotals = useMemo(
    () =>
      chartDays.map((d) => ({
        date: d.date,
        total: toNumber(d.orders) + toNumber(d.reservations) + toNumber(d.messages),
      })),
    [chartDays],
  );

  const maxDailyTotal = useMemo(() => Math.max(1, ...dailyTotals.map((d) => d.total)), [dailyTotals]);

  const pickupStatusTotal = useMemo(() => STATUS_ORDER.reduce((s, k) => s + toNumber(pickupByStatus[k]), 0), [pickupByStatus]);
  const tableStatusTotal = useMemo(() => STATUS_ORDER.reduce((s, k) => s + toNumber(tableByStatus[k]), 0), [tableByStatus]);

  const donutAngles = useMemo(() => {
    const p = toNumber(mix.pickupCount);
    const tbl = toNumber(mix.tableBookingCount);
    const sum = p + tbl;
    if (sum <= 0) return { pickupSweep: 0, tableSweep: 0, hasData: false };
    const pickupSweep = (p / sum) * 2 * Math.PI;
    return { pickupSweep, tableSweep: 2 * Math.PI - pickupSweep, hasData: true, p, tableCount: tbl, sum };
  }, [mix.pickupCount, mix.tableBookingCount]);

  const runCleanup = async (resource) => {
    const days = Number(keepDays[resource]);
    if (!Number.isFinite(days)) return;
    const resourceLabel = t(`analytics.resources.${resource}`);
    const ok = window.confirm(t('analytics.cleanupConfirm', { resource: resourceLabel, days: String(days) }));
    if (!ok) return;
    setCleanupResult('');
    try {
      const res = await axios.post(
        `${apiUrl}/api/admin/cleanup`,
        { resource, keepDays: days },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCleanupResult(t('analytics.cleanupResult', { resource: resourceLabel, n: String(res.data.deletedCount) }));
      fetchStats();
    } catch (err) {
      if (err.response?.status === 401 && onUnauthorized) onUnauthorized();
      setCleanupResult(t('analytics.cleanupFailed'));
    }
  };

  const polarToCartesian = (cx, cy, r, angle) => ({
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  });

  const arcPath = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const large = endAngle - startAngle <= Math.PI ? 0 : 1;
    return `M ${cx} ${cy} L ${end.x} ${end.y} A ${r} ${r} 0 ${large} 0 ${start.x} ${start.y} Z`;
  };

  const kpiRevenueHelp = `${t('analytics.hints.kpiRevenue')} ${t('analytics.hints.kpiAvgOrder')}`;

  return (
    <>
      <header className="dashboard-header-flex">
        <h2>{t('analytics.title')}</h2>
        {loading && <span className="loading-indicator">{t('common.updating')}</span>}
      </header>

      <div className="analytics-kpi-grid">
        <AnalyticsHintSurface help={kpiRevenueHelp} className="analytics-kpi-card analytics-kpi-card--revenue">
          <div className="analytics-kpi-label">{t('analytics.kpiRevenueLabel')}</div>
          <div className="analytics-kpi-value">€{toNumber(ins.revenuePickup30d).toFixed(2)}</div>
          <div className="analytics-kpi-meta">
            {t('analytics.kpiRevenueMeta', { avg: toNumber(ins.avgPickupOrderValue).toFixed(2) })}
          </div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.kpiBasket')} className="analytics-kpi-card">
          <div className="analytics-kpi-label">{t('analytics.kpiBasketLabel')}</div>
          <div className="analytics-kpi-value">{toNumber(ins.avgItemLinesPerPickup).toFixed(1)}</div>
          <div className="analytics-kpi-meta">{t('analytics.kpiBasketMeta')}</div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.kpiMessages')} className="analytics-kpi-card">
          <div className="analytics-kpi-label">{t('analytics.kpiMessagesLabel')}</div>
          <div className="analytics-kpi-value">{toNumber(stats.totals?.messages)}</div>
          <div className="analytics-kpi-meta">
            {t('analytics.kpiMessagesMeta', { new: String(toNumber(msgStatus.new)), read: String(toNumber(msgStatus.read)) })}
          </div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.kpiVolume')} className="analytics-kpi-card">
          <div className="analytics-kpi-label">{t('analytics.kpiVolumeLabel')}</div>
          <div className="analytics-kpi-value">{toNumber(stats.totals?.orders) + toNumber(stats.totals?.reservations)}</div>
          <div className="analytics-kpi-meta">
            {t('analytics.kpiVolumeMeta', {
              pickup: String(toNumber(stats.totals?.orders)),
              table: String(toNumber(stats.totals?.reservations)),
            })}
          </div>
        </AnalyticsHintSurface>
      </div>

      <div className="analytics-grid">
        <AnalyticsHintSurface help={t('analytics.hints.cardOrders30')} className="analytics-card">
          <div className="analytics-label">{t('analytics.cardOrders30')}</div>
          <div className="analytics-value">{toNumber(stats.totals?.orders)}</div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.cardRes30')} className="analytics-card">
          <div className="analytics-label">{t('analytics.cardRes30')}</div>
          <div className="analytics-value">{toNumber(stats.totals?.reservations)}</div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.cardMsg30')} className="analytics-card">
          <div className="analytics-label">{t('analytics.cardMsg30')}</div>
          <div className="analytics-value">{toNumber(stats.totals?.messages)}</div>
        </AnalyticsHintSurface>
      </div>

      <div className="analytics-split">
        <AnalyticsHintSurface help={t('analytics.hints.mixDonut')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.mixTitle')}</div>
              <div className="analytics-sub">{t('analytics.mixSub')}</div>
            </div>
            <div className="analytics-legend">
              <span className="legend-dot legend-orders" /> {t('analytics.mixPickupPct', { n: mix.pickupSharePct ?? 0 })}
              <span className="legend-dot legend-reservations" /> {t('analytics.mixTablePct', { n: mix.tableSharePct ?? 0 })}
            </div>
          </div>
          <div className="analytics-donut-row">
            <svg viewBox="0 0 200 200" width="160" height="160" role="img" aria-label={t('analytics.mixTitle')}>
              {!donutAngles.hasData ? (
                <text x="100" y="105" textAnchor="middle" className="chart-empty-label">
                  {t('common.noData')}
                </text>
              ) : donutAngles.pickupSweep >= 2 * Math.PI - 0.001 || donutAngles.pickupSweep <= 0.001 ? (
                <>
                  <circle cx="100" cy="100" r="78" fill={donutAngles.pickupSweep <= 0.001 ? '#2563eb' : '#16a34a'} opacity="0.92" />
                  <circle cx="100" cy="100" r="44" fill="white" />
                  <text x="100" y="96" textAnchor="middle" className="donut-center-n">
                    {donutAngles.sum}
                  </text>
                  <text x="100" y="114" textAnchor="middle" className="donut-center-s">
                    {t('common.total')}
                  </text>
                </>
              ) : (
                <>
                  <path d={arcPath(100, 100, 78, 0, donutAngles.pickupSweep)} fill="#16a34a" opacity="0.92" />
                  <path
                    d={arcPath(100, 100, 78, donutAngles.pickupSweep, 2 * Math.PI)}
                    fill="#2563eb"
                    opacity="0.92"
                  />
                  <circle cx="100" cy="100" r="44" fill="white" />
                  <text x="100" y="96" textAnchor="middle" className="donut-center-n">
                    {donutAngles.sum}
                  </text>
                  <text x="100" y="114" textAnchor="middle" className="donut-center-s">
                    {t('common.total')}
                  </text>
                </>
              )}
            </svg>
            <ul className="analytics-mix-list">
              <li>{t('analytics.mixPickupOrders', { n: String(toNumber(mix.pickupCount)) })}</li>
              <li>{t('analytics.mixTableBookings', { n: String(toNumber(mix.tableBookingCount)) })}</li>
            </ul>
          </div>
        </AnalyticsHintSurface>

        <AnalyticsHintSurface help={t('analytics.hints.inbox')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.inboxTitle')}</div>
              <div className="analytics-sub">{t('analytics.inboxSub')}</div>
            </div>
          </div>
          <div className="analytics-msg-bars">
            <div className="analytics-msg-row">
              <span>{t('analytics.inboxNew')}</span>
              <div className="analytics-msg-track">
                <div
                  className="analytics-msg-fill analytics-msg-fill--new"
                  style={{
                    width: `${Math.min(100, (toNumber(msgStatus.new) / Math.max(1, toNumber(msgStatus.new) + toNumber(msgStatus.read))) * 100)}%`,
                  }}
                />
              </div>
              <strong>{toNumber(msgStatus.new)}</strong>
            </div>
            <div className="analytics-msg-row">
              <span>{t('analytics.inboxRead')}</span>
              <div className="analytics-msg-track">
                <div
                  className="analytics-msg-fill analytics-msg-fill--read"
                  style={{
                    width: `${Math.min(100, (toNumber(msgStatus.read) / Math.max(1, toNumber(msgStatus.new) + toNumber(msgStatus.read))) * 100)}%`,
                  }}
                />
              </div>
              <strong>{toNumber(msgStatus.read)}</strong>
            </div>
          </div>
        </AnalyticsHintSurface>
      </div>

      <div className="analytics-split">
        <AnalyticsHintSurface help={t('analytics.hints.pickupStatus')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.pickupPipeTitle')}</div>
              <div className="analytics-sub">{t('analytics.pickupPipeSub')}</div>
            </div>
          </div>
          <div className="analytics-hbar-wrap">
            {pickupStatusTotal === 0 ? (
              <p className="chart-empty-label">{t('analytics.emptyPickup')}</p>
            ) : (
              <div className="analytics-hbar">
                {STATUS_ORDER.map((k) => {
                  const c = toNumber(pickupByStatus[k]);
                  if (c === 0) return null;
                  const w = (c / pickupStatusTotal) * 100;
                  return (
                    <div
                      key={k}
                      className="analytics-hbar-seg"
                      style={{ width: `${w}%`, background: STATUS_COLORS[k] }}
                      title={`${t(`bookingStatus.${k}`)}: ${c}`}
                    />
                  );
                })}
              </div>
            )}
            <div className="analytics-hbar-legend">
              {STATUS_ORDER.map((k) => (
                <span key={k} className="analytics-hbar-key">
                  <i style={{ background: STATUS_COLORS[k] }} /> {t(`bookingStatus.${k}`)}{' '}
                  <b>{toNumber(pickupByStatus[k])}</b>
                </span>
              ))}
            </div>
          </div>
        </AnalyticsHintSurface>

        <AnalyticsHintSurface help={t('analytics.hints.tableStatus')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.tablePipeTitle')}</div>
              <div className="analytics-sub">{t('analytics.tablePipeSub')}</div>
            </div>
          </div>
          <div className="analytics-hbar-wrap">
            {tableStatusTotal === 0 ? (
              <p className="chart-empty-label">{t('analytics.emptyTable')}</p>
            ) : (
              <div className="analytics-hbar">
                {STATUS_ORDER.map((k) => {
                  const c = toNumber(tableByStatus[k]);
                  if (c === 0) return null;
                  const w = (c / tableStatusTotal) * 100;
                  return (
                    <div
                      key={k}
                      className="analytics-hbar-seg"
                      style={{ width: `${w}%`, background: STATUS_COLORS[k] }}
                      title={`${t(`bookingStatus.${k}`)}: ${c}`}
                    />
                  );
                })}
              </div>
            )}
            <div className="analytics-hbar-legend">
              {STATUS_ORDER.map((k) => (
                <span key={k} className="analytics-hbar-key">
                  <i style={{ background: STATUS_COLORS[k] }} /> {t(`bookingStatus.${k}`)}{' '}
                  <b>{toNumber(tableByStatus[k])}</b>
                </span>
              ))}
            </div>
          </div>
        </AnalyticsHintSurface>
      </div>

      <div className="analytics-split">
        <AnalyticsHintSurface help={t('analytics.hints.rushHours')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.rushTitle')}</div>
              <div className="analytics-sub">{t('analytics.rushSub')}</div>
            </div>
          </div>
          <div className="analytics-hour-chart">
            <svg viewBox="0 0 720 200" width="100%" height="200" role="img" aria-label={t('analytics.rushTitle')}>
              {hourly.map((slot) => {
                const h = toNumber(slot.count);
                const barH = (h / maxHourly) * 150;
                const x = 8 + slot.hour * 29.5;
                return (
                  <g key={slot.hour}>
                    <rect x={x} y={170 - barH} width="20" height={barH} rx="4" className="bar-hourly" />
                    <text x={x + 10} y="188" textAnchor="middle" className="chart-x">
                      {slot.hour % 3 === 0 ? slot.hour : ''}
                    </text>
                  </g>
                );
              })}
              <line x1="4" y1="170" x2="716" y2="170" className="chart-axis" />
            </svg>
          </div>
        </AnalyticsHintSurface>

        <AnalyticsHintSurface help={t('analytics.hints.partySize')} className="analytics-chart-card analytics-card-rise">
          <div className="analytics-chart-header">
            <div>
              <div className="analytics-label">{t('analytics.partyTitle')}</div>
              <div className="analytics-sub">{t('analytics.partySub')}</div>
            </div>
          </div>
          {tableSizes.length === 0 ? (
            <p className="chart-empty-label">{t('analytics.emptyParty')}</p>
          ) : (
            <ul className="analytics-size-list">
              {tableSizes.map((row) => {
                const maxC = Math.max(...tableSizes.map((r) => toNumber(r.count)), 1);
                const pct = (toNumber(row.count) / maxC) * 100;
                return (
                  <li key={row.size}>
                    <span className="analytics-size-label">
                      {row.size} {t('common.guests')}
                    </span>
                    <div className="analytics-size-track">
                      <div className="analytics-size-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="analytics-size-n">{row.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </AnalyticsHintSurface>
      </div>

      <AnalyticsHintSurface help={t('analytics.hints.topMenu')} className="analytics-chart-card analytics-card-rise">
        <div className="analytics-chart-header">
          <div>
            <div className="analytics-label">{t('analytics.topMenuTitle')}</div>
            <div className="analytics-sub">{t('analytics.topMenuSub')}</div>
          </div>
        </div>
        {topItems.length === 0 ? (
          <p className="chart-empty-label">{t('analytics.emptyLines')}</p>
        ) : (
          <div className="analytics-top-grid">
            {topItems.map((it, i) => {
              const maxQ = Math.max(...topItems.map((x) => toNumber(x.qty)), 1);
              const pct = (toNumber(it.qty) / maxQ) * 100;
              return (
                <div key={it.label + i} className="analytics-top-row">
                  <span className="analytics-top-rank">{i + 1}</span>
                  <div className="analytics-top-body">
                    <div className="analytics-top-name">{it.label}</div>
                    <div className="analytics-top-track">
                      <div className="analytics-top-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="analytics-top-qty">
                    <strong>{toNumber(it.qty)}</strong>
                    <small>{t('analytics.topOrdersSuffix', { n: it.orders })}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AnalyticsHintSurface>

      <AnalyticsHintSurface help={t('analytics.hints.trend14')} className="analytics-chart-card analytics-card-rise">
        <div className="analytics-chart-header">
          <div>
            <div className="analytics-label">{t('analytics.trendTitle')}</div>
            <div className="analytics-sub">{t('analytics.trendSub')}</div>
          </div>
        </div>
        <div className="analytics-chart">
          <svg viewBox="0 0 700 200" width="100%" height="200" role="img" aria-label={t('analytics.trendTitle')}>
            <polyline
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3"
              strokeLinejoin="round"
              points={dailyTotals
                .map((d, idx) => {
                  const span = Math.max(1, dailyTotals.length - 1);
                  const x = 24 + idx * (652 / span);
                  const y = 170 - (d.total / maxDailyTotal) * 150;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
            {dailyTotals.map((d, idx) => {
              const span = Math.max(1, dailyTotals.length - 1);
              const x = 24 + idx * (652 / span);
              const y = 170 - (d.total / maxDailyTotal) * 150;
              return <circle key={d.date || idx} cx={x} cy={y} r="4" fill="#7c3aed" className="trend-dot" />;
            })}
            <line x1="10" y1="170" x2="690" y2="170" className="chart-axis" />
          </svg>
        </div>
      </AnalyticsHintSurface>

      <AnalyticsHintSurface help={t('analytics.hints.bars14')} className="analytics-chart-card analytics-card-rise">
        <div className="analytics-chart-header">
          <div>
            <div className="analytics-label">{t('analytics.bars14Title')}</div>
            <div className="analytics-sub">{t('analytics.bars14Sub')}</div>
          </div>
          <div className="analytics-legend">
            <span className="legend-dot legend-orders" /> {t('analytics.legendOrders')}
            <span className="legend-dot legend-reservations" /> {t('analytics.legendRes')}
            <span className="legend-dot legend-messages" /> {t('analytics.legendMsg')}
          </div>
        </div>

        <div className="analytics-chart">
          <svg viewBox="0 0 700 220" width="100%" height="220" role="img" aria-label={t('analytics.bars14Title')}>
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
      </AnalyticsHintSurface>

      <header className="dashboard-header-flex">
        <h2>{t('analytics.toolsTitle')}</h2>
      </header>

      <div className="tools-grid">
        <AnalyticsHintSurface help={t('analytics.hints.tools')} className="tools-card">
          <div className="tools-title">{t('analytics.cleanupOrders')}</div>
          <div className="tools-row">
            <select value={keepDays.orders} onChange={(e) => setKeepDays((p) => ({ ...p, orders: e.target.value }))}>
              <option value="15">{t('analytics.keep15')}</option>
              <option value="30">{t('analytics.keep30')}</option>
              <option value="60">{t('analytics.keep60')}</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('orders')}>
              {t('analytics.deleteOlder')}
            </button>
          </div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.tools')} className="tools-card">
          <div className="tools-title">{t('analytics.cleanupReservations')}</div>
          <div className="tools-row">
            <select value={keepDays.reservations} onChange={(e) => setKeepDays((p) => ({ ...p, reservations: e.target.value }))}>
              <option value="15">{t('analytics.keep15')}</option>
              <option value="30">{t('analytics.keep30')}</option>
              <option value="60">{t('analytics.keep60')}</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('reservations')}>
              {t('analytics.deleteOlder')}
            </button>
          </div>
        </AnalyticsHintSurface>
        <AnalyticsHintSurface help={t('analytics.hints.tools')} className="tools-card">
          <div className="tools-title">{t('analytics.cleanupMessages')}</div>
          <div className="tools-row">
            <select value={keepDays.messages} onChange={(e) => setKeepDays((p) => ({ ...p, messages: e.target.value }))}>
              <option value="15">{t('analytics.keep15')}</option>
              <option value="30">{t('analytics.keep30')}</option>
              <option value="60">{t('analytics.keep60')}</option>
            </select>
            <button type="button" className="btn-tools" onClick={() => runCleanup('messages')}>
              {t('analytics.deleteOlder')}
            </button>
          </div>
        </AnalyticsHintSurface>
      </div>

      {cleanupResult && <div className="tools-result">{cleanupResult}</div>}
    </>
  );
};

export default AnalyticsPanel;
