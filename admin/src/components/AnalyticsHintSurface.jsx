import React from 'react';

/**
 * Shows explanatory text on hover or keyboard focus (entire surface is focusable).
 */
const AnalyticsHintSurface = ({ help, children, className = '' }) => (
  <div className={`analytics-hint-surface ${className}`.trim()} tabIndex={0}>
    <div className="analytics-hint-pop">{help}</div>
    {children}
  </div>
);

export default AnalyticsHintSurface;
