import React, { useState, useEffect } from 'react';
import {
  X, Building2, AlertTriangle, CheckCircle, XCircle, Clock,
  MapPin, Phone, Heart, Activity, ChevronRight, Zap, Ambulance,
  User, Shield
} from 'lucide-react';

// ═══════════════════════════════════════════════
// HOSPITAL PORTAL
// Real-time incoming ambulance request management
// Design: matches GreenCorridor dark cinematic system
// ═══════════════════════════════════════════════

export default function HospitalPortal({ isOpen, onClose, pendingRequest, onAccept, onReject }) {
  const [activeTab, setActiveTab]   = useState('requests');
  const [notification, setNotif]    = useState(null);
  const [accepted, setAccepted]     = useState(false);
  const [showBell, setShowBell]     = useState(false);

  // Flash notification bell when new request arrives
  useEffect(() => {
    if (pendingRequest && !accepted) {
      setShowBell(true);
      const t = setTimeout(() => setShowBell(false), 3000);
      return () => clearTimeout(t);
    }
  }, [pendingRequest]);

  // Reset when portal reopens
  useEffect(() => {
    if (isOpen) {
      setAccepted(false);
      setActiveTab('requests');
    }
  }, [isOpen]);

  const handleAccept = () => {
    setAccepted(true);
    setNotif({ type: 'success', msg: 'Request accepted. Police notified automatically.' });
    onAccept && onAccept();
    setTimeout(() => setNotif(null), 4000);
  };

  const handleReject = () => {
    setNotif({ type: 'error', msg: 'Request rejected. Patient will be routed to next available hospital.' });
    onReject && onReject();
    setTimeout(() => setNotif(null), 4000);
  };

  const priorityColor = {
    critical: '#ef4444',
    moderate: '#f97316',
    mild: '#10b981',
  };

  const tabs = [
    { id: 'requests', label: 'Incoming Requests' },
    { id: 'active',   label: 'Active Cases' },
    { id: 'resources', label: 'Resources' },
  ];

  const mockActive = [
    { id: 'C-2201', condition: 'critical', eta: '2 min', nurse: 'Dr. Priya S.', bed: 'ER-3' },
    { id: 'C-2198', condition: 'moderate', eta: 'Arrived', nurse: 'Dr. Arjun M.', bed: 'ER-7' },
  ];

  const mockResources = [
    { label: 'ICU Beds',   used: 8,  total: 12 },
    { label: 'ER Bays',    used: 5,  total: 10 },
    { label: 'Ventilators', used: 3, total: 8  },
    { label: 'Surgeons on call', used: 2, total: 4 },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
      display: isOpen ? 'flex' : 'none', alignItems: 'stretch',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '240px', background: 'rgba(10,14,23,0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 style={{ width: 18, height: 18, color: '#a78bfa' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                Hospital Portal
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.5)' }}>
                Koramangala Med Center
              </div>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px',
                background: activeTab === tab.id
                  ? 'rgba(139,92,246,0.12)'
                  : 'transparent',
                color: activeTab === tab.id ? '#a78bfa' : 'rgba(148,163,184,0.6)',
                fontFamily: 'Inter', fontWeight: 500, fontSize: '0.875rem',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              {tab.id === 'requests' && pendingRequest && !accepted && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                  flexShrink: 0,
                }} />
              )}
              {tab.label}
              {tab.id === 'requests' && pendingRequest && !accepted && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', padding: '2px 7px',
                  borderRadius: '50px', background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444', fontWeight: 600,
                }}>1</span>
              )}
            </button>
          ))}
        </nav>

        {/* Status indicator */}
        <div style={{
          margin: '0 12px 16px', padding: '12px',
          borderRadius: '12px', background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>ONLINE</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.5)' }}>
            Connected to GreenCorridor
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,14,23,0.95)', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0', margin: 0 }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pendingRequest && !accepted && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '50px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
                animation: showBell ? 'pulse-glow 0.5s ease-in-out 3' : 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                New Request Incoming
              </div>
            )}
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
            }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div style={{
            position: 'absolute', top: '80px', right: '24px', zIndex: 100,
            padding: '14px 20px', borderRadius: '12px', maxWidth: '340px',
            background: notification.type === 'success'
              ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: notification.type === 'success' ? '#6ee7b7' : '#fca5a5',
            display: 'flex', alignItems: 'center', gap: '10px',
            backdropFilter: 'blur(12px)', fontFamily: 'Inter', fontSize: '0.85rem',
          }}>
            {notification.type === 'success'
              ? <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
              : <XCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
            }
            {notification.msg}
          </div>
        )}

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0a0e17' }}>

          {/* ── REQUESTS TAB ── */}
          {activeTab === 'requests' && (
            <div>
              {pendingRequest && !accepted ? (
                <div style={{
                  borderRadius: '20px', overflow: 'hidden',
                  border: '1px solid rgba(239,68,68,0.2)',
                  boxShadow: '0 0 40px rgba(239,68,68,0.06)',
                }}>
                  {/* Request header */}
                  <div style={{
                    padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.1)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                      <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#fca5a5', fontSize: '0.9rem' }}>
                        INCOMING EMERGENCY REQUEST
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Just now</span>
                  </div>

                  {/* Request details */}
                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      gap: '16px', marginBottom: '24px',
                    }}>
                      {[
                        { icon: <MapPin style={{ width: 14, height: 14, color: '#f97316' }} />, label: 'Emergency Location', value: pendingRequest.location },
                        { icon: <Building2 style={{ width: 14, height: 14, color: '#a78bfa' }} />, label: 'Requested Hospital', value: pendingRequest.hospital },
                        { icon: <Heart style={{ width: 14, height: 14, color: '#ef4444' }} />, label: 'Patient Condition', value: pendingRequest.condition?.toUpperCase() },
                        { icon: <Phone style={{ width: 14, height: 14, color: '#06b6d4' }} />, label: 'Contact Number', value: pendingRequest.contact || '+91 98XXXXX210' },
                        { icon: <User style={{ width: 14, height: 14, color: '#10b981' }} />, label: 'Patient Name', value: pendingRequest.patientName || 'Not provided' },
                        { icon: <Clock style={{ width: 14, height: 14, color: '#eab308' }} />, label: 'Est. Arrival', value: '6 minutes' },
                      ].map((item, i) => (
                        <div key={i} style={{
                          padding: '14px 16px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.7rem', color: '#64748b' }}>
                            {item.icon} {item.label}
                          </div>
                          <div style={{
                            fontFamily: item.label === 'Patient Condition' ? 'Outfit' : 'Inter',
                            fontWeight: 600, fontSize: '0.9rem',
                            color: item.label === 'Patient Condition'
                              ? priorityColor[pendingRequest.condition] || '#e2e8f0'
                              : '#e2e8f0',
                          }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={handleAccept} style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: '0 0 30px rgba(16,185,129,0.2)',
                        transition: 'all 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(16,185,129,0.4)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.2)'}
                      >
                        <CheckCircle style={{ width: 20, height: 20 }} />
                        Accept Request
                      </button>
                      <button onClick={handleReject} style={{
                        flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                      }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      >
                        <XCircle style={{ width: 20, height: 20 }} />
                        Redirect Patient
                      </button>
                    </div>

                    {/* Warning note */}
                    <div style={{
                      marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
                      background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)',
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                    }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: '#eab308', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: '0.78rem', color: 'rgba(234,179,8,0.8)', margin: 0, lineHeight: 1.6 }}>
                        Your acceptance is <strong>mandatory</strong> before the police escort and ambulance dispatch can begin. Rejection will auto-route to the next available hospital.
                      </p>
                    </div>
                  </div>
                </div>
              ) : accepted ? (
                <div style={{
                  padding: '60px 40px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center',
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', marginBottom: '20px',
                    background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(16,185,129,0.15)',
                  }}>
                    <CheckCircle style={{ width: 40, height: 40, color: '#10b981' }} />
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: '0 0 8px' }}>
                    Request Accepted
                  </h2>
                  <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Police portal has been notified. Awaiting escort confirmation before ambulance dispatch.
                  </p>
                  <div style={{
                    padding: '16px 24px', borderRadius: '12px',
                    background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}>
                    <Ambulance style={{ width: 20, height: 20, color: '#10b981' }} />
                    <span style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: '#10b981' }}>
                      ER Bay {Math.floor(Math.random() * 8 + 1)} prepared • Trauma team alerted
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '80px 40px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center',
                }}>
                  <Activity style={{ width: 48, height: 48, color: 'rgba(148,163,184,0.2)', marginBottom: '16px' }} />
                  <h3 style={{ fontFamily: 'Outfit', color: 'rgba(148,163,184,0.5)', fontWeight: 600, margin: '0 0 8px' }}>
                    No Pending Requests
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(100,116,139,0.6)' }}>
                    Incoming ambulance requests will appear here in real time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVE CASES TAB ── */}
          {activeTab === 'active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {mockActive.map((c, i) => (
                <div key={i} style={{
                  padding: '20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: priorityColor[c.condition],
                        boxShadow: `0 0 8px ${priorityColor[c.condition]}80`,
                      }} />
                      <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>#{c.id}</span>
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600,
                      background: `${priorityColor[c.condition]}15`, color: priorityColor[c.condition],
                      textTransform: 'uppercase',
                    }}>{c.condition}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {[
                      { label: 'ETA', value: c.eta },
                      { label: 'Attending', value: c.nurse },
                      { label: 'Assigned Bed', value: c.bed },
                    ].map((d, j) => (
                      <div key={j}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>{d.label}</div>
                        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── RESOURCES TAB ── */}
          {activeTab === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '20px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: '20px', color: '#e2e8f0' }}>
                  Resource Availability
                </h3>
                {mockResources.map((r, i) => {
                  const pct = Math.round((r.used / r.total) * 100);
                  const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f97316' : '#10b981';
                  return (
                    <div key={i} style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500 }}>{r.label}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.used}/{r.total}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`, height: '100%', borderRadius: '3px',
                          background: barColor, transition: 'width 0.6s ease',
                          boxShadow: `0 0 8px ${barColor}60`,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
