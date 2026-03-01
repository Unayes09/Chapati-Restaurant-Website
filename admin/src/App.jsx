import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import BookingCard from './components/BookingCard';
import LoginForm from './components/LoginForm';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exclusions, setExclusions] = useState([]);
  const [filters, setFilters] = useState({
    date: '',
    time: '',
    tableSize: '',
    search: ''
  });
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [newExclusion, setNewExclusion] = useState({
    date: '',
    type: 'full_day',
    slots: []
  });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchBookings();
      fetchExclusions();
    }
  }, [token, filters]);

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
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchExclusions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/exclusions`);
      setExclusions(res.data);
    } catch (err) {
      console.error('Fetch exclusions failed', err);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.time) params.append('time', filters.time);
      if (filters.tableSize) params.append('tableSize', filters.tableSize);
      if (filters.search) params.append('search', filters.search);

      const res = await axios.get(`${API_URL}/api/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setBookings(res.data);
    } catch (err) {
      console.error('Fetch bookings failed', err);
      if (err.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleSetExclusion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/exclusions`, newExclusion, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchExclusions();
      setShowExclusionModal(false);
      setNewExclusion({ date: '', type: 'full_day', slots: [] });
    } catch (err) {
      alert('Failed to set exclusion: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteExclusion = async (id) => {
    if (!window.confirm('Remove this exclusion?')) return;
    try {
      await axios.delete(`${API_URL}/api/exclusions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchExclusions();
    } catch (err) {
      alert('Failed to delete exclusion');
    }
  };

  const handleSlotToggle = (slot) => {
    const currentSlots = [...newExclusion.slots];
    if (currentSlots.includes(slot)) {
      setNewExclusion({ ...newExclusion, slots: currentSlots.filter(s => s !== slot) });
    } else {
      setNewExclusion({ ...newExclusion, slots: [...currentSlots, slot] });
    }
  };

  const timeSlotOptions = [];
  for (let h = 11; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeSlotOptions.push(time);
    }
  }

  const updateBookingStatus = async (id, status) => {
    try {
      const endpoint = status === 'confirmed' ? 'confirm' : 'reject';
      await axios.patch(`${API_URL}/api/bookings/${id}/${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
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
      <Navbar onLogout={handleLogout} onRefresh={fetchBookings} />
      
      <main className="dashboard-main">
        <section className="admin-controls">
          <div className="search-filters-bar">
            <div className="filter-item">
              <label>Search Customer</label>
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
            <button className="btn-reset-filters" onClick={() => setFilters({ date: '', time: '', tableSize: '', search: '' })}>
              Reset
            </button>
          </div>

          <div className="exclusion-management-bar">
            <h3>Reservation Controls</h3>
            <button className="btn-add-exclusion" onClick={() => setShowExclusionModal(true)}>
              + Off Day/Time
            </button>
          </div>

          {exclusions.length > 0 && (
            <div className="active-exclusions">
              <h4>Active Restrictions</h4>
              <div className="exclusions-list">
                {exclusions.map(ex => (
                  <div key={ex._id} className="exclusion-tag">
                    <span>{ex.date} ({ex.type === 'full_day' ? 'Full Day Off' : `${ex.slots.length} Slots Off`})</span>
                    <button onClick={() => handleDeleteExclusion(ex._id)}>&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <header className="dashboard-header-flex">
          <h2>Recent Bookings ({bookings.length})</h2>
          {loading && <span className="loading-indicator">Updating...</span>}
        </header>

        {bookings.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No bookings found with current filters.</p>
          </div>
        ) : (
          <div className="bookings-grid-masonry">
            {bookings.map((booking) => (
              <BookingCard 
                key={booking._id} 
                booking={booking} 
                onUpdateStatus={updateBookingStatus} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Exclusion Modal */}
      {showExclusionModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <header>
              <h3>Add Restriction</h3>
              <button onClick={() => setShowExclusionModal(false)}>&times;</button>
            </header>
            <form onSubmit={handleSetExclusion}>
              <div className="modal-form-group">
                <label>Select Date</label>
                <input 
                  type="date" 
                  required 
                  value={newExclusion.date} 
                  onChange={(e) => setNewExclusion({ ...newExclusion, date: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Restriction Type</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      name="type" 
                      value="full_day" 
                      checked={newExclusion.type === 'full_day'} 
                      onChange={() => setNewExclusion({ ...newExclusion, type: 'full_day' })}
                    /> Full Day Off
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="type" 
                      value="partial" 
                      checked={newExclusion.type === 'partial'} 
                      onChange={() => setNewExclusion({ ...newExclusion, type: 'partial' })}
                    /> Specific Slots Off
                  </label>
                </div>
              </div>

              {newExclusion.type === 'partial' && (
                <div className="modal-form-group">
                  <label>Select Slots to Disable</label>
                  <div className="slots-grid">
                    {timeSlotOptions.map(slot => (
                      <button 
                        key={slot} 
                        type="button"
                        className={`slot-toggle-btn ${newExclusion.slots.includes(slot) ? 'active' : ''}`}
                        onClick={() => handleSlotToggle(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowExclusionModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save" disabled={!newExclusion.date}>Save Restriction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
