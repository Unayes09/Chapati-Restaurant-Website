import React from 'react';

const LoginForm = ({ loginData, onChange, onSubmit, error }) => {
  return (
    <div className="login-wrapper">
      <div className="login-visual">
        <div className="visual-content">
          <h2>Chapati 35</h2>
          <p>Management Portal</p>
        </div>
      </div>
      <div className="login-form-side">
        <div className="form-container-inner">
          <header>
            <h1>Admin Login</h1>
            <p>Welcome back! Please enter your details.</p>
          </header>
          
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={onSubmit}>
            <div className="input-group-modern">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                placeholder="admin@chapati35.com"
                required 
                value={loginData.email}
                onChange={onChange}
              />
            </div>
            <div className="input-group-modern">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                placeholder="••••••••"
                required 
                value={loginData.password}
                onChange={onChange}
              />
            </div>
            <button type="submit" className="btn-submit-login">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
