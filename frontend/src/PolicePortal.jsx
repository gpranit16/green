import React, { useState, useEffect } from 'react';
import {
  X, Shield, AlertTriangle, CheckCircle, XCircle, MapPin,
  Clock, Activity, Radio, Ambulance, Building2, Zap, Heart,
  Navigation, BarChart2
} from 'lucide-react';

// ═══════════════════════════════════════════════
// POLICE PORTAL
// Emergency escort coordination dashboard
// Design: dark cinematic, indigo-blue accent
// ═══════════════════════════════════════════════

export default function PolicePortal({ isOpen, onClose, pendingRequest, hospitalApproved, requestStatus, requestHistory = [], notificationStatus, onConfirm, onCancel, onClearActive, onClearHistory }) {
  const [confirmed, setConfirmed]   = useState(false);
  const [activeTab, setActiveTab]   = useState('alerts');
  const [notification, setNotif]    = useState(null);
  const isEscortPending = Boolean(pendingRequest && requestStatus === 'WAITING_POLICE' && hospitalApproved);
  const isEscortConfirmed = Boolean(['ASSIGNED', 'TRACKING', 'ARRIVED'].includes(requestStatus) || confirmed);
  const trackingEmailSent = Boolean(notificationStatus?.trackingStartedAt);

  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
      setActiveTab('alerts');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setConfirmed(true);
    setNotif({ type: 'success', msg: 'Escort confirmed. Ambulance dispatch initiated. Corridor activation in progress.' });
    onConfirm && onConfirm();
    setTimeout(() => setNotif(null), 5000);
  };

  const handleCancel = () => {
    setNotif({ type: 'error', msg: 'Escort cancelled. Request returned to pending queue.' });
    onCancel && onCancel();
    setTimeout(() => setNotif(null), 4000);
  };

  const tabs = [
    { id: 'alerts',    label: 'Alerts' },
    { id: 'corridors', label: 'Active Corridors' },
    { id: 'units',     label: 'Patrol Units' },
  ];

  const corridorHistory = requestHistory
    .filter(item => ['WAITING_POLICE', 'ASSIGNED', 'TRACKING', 'ARRIVED', 'CANCELLED', 'REJECTED'].includes(item.status))
    .slice(0, 12)
    .map(item => ({
      id: String(item._id || '').slice(-6).toUpperCase(),
      route: `${item.location || 'Unknown pickup'} → ${item.hospital || 'Unknown hospital'}`,
      status: item.status === 'ARRIVED' ? 'COMPLETED' : (item.status === 'TRACKING' || item.status === 'ASSIGNED' ? 'ACTIVE' : item.status),
      eta: item.status === 'TRACKING' ? '~in transit' : (item.status === 'ARRIVED' ? 'Arrived' : '—'),
      signal: item.status === 'TRACKING' || item.status === 'ARRIVED' ? 4 : 0,
    }));

  const mockUnits = [
    { id: 'PCR-01', status: 'On Escort', location: 'Koramangala Bridge', officer: 'SI Prakash' },
    { id: 'PCR-04', status: 'Available', location: 'Silk Board Jn', officer: 'SI Meena' },
    { id: 'PCR-07', status: 'Available', location: 'BTM Layout', officer: 'Const. Ravi' },
  ];

  const statusColor = { 'ACTIVE': '#10b981', 'COMPLETED': '#64748b', 'PENDING': '#f97316' };
  const unitColor   = { 'On Escort': '#10b981', 'Available': '#06b6d4', 'Off Duty': '#64748b' };

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
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(59,130,246,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield style={{ width: 18, height: 18, color: '#818cf8' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
                Police Portal
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.5)' }}>
                Traffic Control Unit
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px',
                background: activeTab === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#818cf8' : 'rgba(148,163,184,0.6)',
                fontFamily: 'Inter', fontWeight: 500, fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              {tab.id === 'alerts' && isEscortPending && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#f97316',
                  animation: 'pulse-glow 1.5s ease-in-out infinite', flexShrink: 0,
                }} />
              )}
              {tab.label}
              {tab.id === 'alerts' && isEscortPending && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.65rem', padding: '2px 7px',
                  borderRadius: '50px', background: 'rgba(249,115,22,0.15)',
                  color: '#fb923c', fontWeight: 600,
                }}>1</span>
              )}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div style={{
          margin: '0 12px 16px', padding: '12px', borderRadius: '12px',
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600 }}>ONLINE</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.5)' }}>
            Linked to GreenCorridor
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,14,23,0.95)', flexShrink: 0,
        }}>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0', margin: 0 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pendingRequest && ['ASSIGNED', 'TRACKING', 'ARRIVED'].includes(requestStatus) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '50px',
                background: trackingEmailSent ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.12)',
                border: `1px solid ${trackingEmailSent ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}`,
                color: trackingEmailSent ? '#6ee7b7' : '#fcd34d',
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: trackingEmailSent ? '#10b981' : '#eab308', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                Tracking Email: {trackingEmailSent ? 'SENT' : 'PENDING'}
              </div>
            )}
            <button
              onClick={() => onClearActive && onClearActive()}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', padding: '6px 12px', cursor: 'pointer',
                color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
              }}
            >
              Clear Incoming
            </button>
            {isEscortPending && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '50px',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                color: '#fb923c', fontSize: '0.75rem', fontWeight: 600,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                Hospital Approved — Action Required
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

        {/* Toast */}
        {notification && (
          <div style={{
            position: 'absolute', top: '80px', right: '24px', zIndex: 100,
            padding: '14px 20px', borderRadius: '12px', maxWidth: '380px',
            background: notification.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: notification.type === 'success' ? '#6ee7b7' : '#fca5a5',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
            backdropFilter: 'blur(12px)', fontFamily: 'Inter', fontSize: '0.85rem', lineHeight: 1.5,
          }}>
            {notification.type === 'success'
              ? <CheckCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
              : <XCircle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
            }
            {notification.msg}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#0a0e17' }}>

          {/* ── ALERTS TAB ── */}
          {activeTab === 'alerts' && (
            <div>
              {isEscortPending ? (
                <div style={{
                  borderRadius: '20px', overflow: 'hidden',
                  border: '1px solid rgba(249,115,22,0.25)',
                  boxShadow: '0 0 40px rgba(249,115,22,0.06)',
                }}>
                  {/* Alert header */}
                  <div style={{
                    padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px',
                    background: 'rgba(249,115,22,0.07)', borderBottom: '1px solid rgba(249,115,22,0.12)',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', animation: 'pulse-glow 1s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#fb923c', fontSize: '0.9rem' }}>
                      ESCORT CLEARANCE REQUIRED — HOSPITAL APPROVED
                    </span>
                  </div>

                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Route Info */}
                    <div style={{
                      padding: '16px', borderRadius: '14px', marginBottom: '20px',
                      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '10px' }}>
                        CORRIDOR ROUTE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontFamily: 'Outfit', fontWeight: 600 }}>
                        <MapPin style={{ width: 16, height: 16, color: '#f97316' }} />
                        {pendingRequest.location}
                        <span style={{ color: '#6366f1', fontSize: '1.2rem' }}>→</span>
                        <Building2 style={{ width: 16, height: 16, color: '#a78bfa' }} />
                        {pendingRequest.hospital}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr',
                      gap: '12px', marginBottom: '24px',
                    }}>
                      {[
                        { icon: <Heart style={{ width: 14, height: 14, color: '#ef4444' }} />, label: 'Condition', value: pendingRequest.condition?.toUpperCase() },
                        { icon: <Clock style={{ width: 14, height: 14, color: '#eab308' }} />, label: 'ETA to Hospital', value: '~6 minutes' },
                        { icon: <Radio style={{ width: 14, height: 14, color: '#06b6d4' }} />, label: 'Ambulance ID', value: 'AMB-404' },
                        { icon: <Zap style={{ width: 14, height: 14, color: '#10b981' }} />, label: 'Signals to Clear', value: '4 intersections' },
                      ].map((item, i) => (
                        <div key={i} style={{
                          padding: '12px 14px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.7rem', color: '#64748b' }}>
                            {item.icon} {item.label}
                          </div>
                          <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: '#e2e8f0' }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Required notice */}
                    <div style={{
                      padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                      background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                      display: 'flex', alignItems: 'flex-start', gap: '8px',
                    }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: '#818cf8', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: '0.78rem', color: 'rgba(129,140,248,0.85)', margin: 0, lineHeight: 1.6 }}>
                        Your <strong>confirmation is mandatory</strong>. The ambulance will not be dispatched until police escort is confirmed. Cross-traffic signals will be held automatically once you confirm.
                      </p>
                    </div>

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={handleConfirm} style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: '0 0 30px rgba(99,102,241,0.2)',
                        transition: 'all 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.4)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.2)'}
                      >
                        <Shield style={{ width: 20, height: 20 }} />
                        Confirm Escort & Dispatch
                      </button>
                      <button onClick={handleCancel} style={{
                        padding: '14px 20px', borderRadius: '12px', cursor: 'pointer',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        transition: 'all 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      >
                        <XCircle style={{ width: 18, height: 18 }} />
                        Stand Down
                      </button>
                    </div>
                  </div>
                </div>
              ) : isEscortConfirmed ? (
                <div style={{
                  padding: '60px 40px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center',
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', marginBottom: '20px',
                    background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(99,102,241,0.15)',
                  }}>
                    <Shield style={{ width: 40, height: 40, color: '#818cf8' }} />
                  </div>
                  <h2 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, color: '#818cf8', margin: '0 0 8px' }}>
                    Escort Confirmed
                  </h2>
                  <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Ambulance dispatch initiated. Green corridor activation in progress across all 4 intersections.
                  </p>
                  <div style={{
                    marginBottom: '16px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: trackingEmailSent ? 'rgba(16,185,129,0.08)' : 'rgba(234,179,8,0.12)',
                    border: `1px solid ${trackingEmailSent ? 'rgba(16,185,129,0.2)' : 'rgba(234,179,8,0.22)'}`,
                    color: trackingEmailSent ? '#6ee7b7' : '#fcd34d',
                    fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    ✉️ Tracking notification email: {trackingEmailSent ? 'Sent to user' : 'Pending backend trigger'}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      padding: '14px 20px', borderRadius: '12px',
                      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                      <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: '#10b981' }}>
                        GREEN CORRIDOR ACTIVE
                      </span>
                    </div>
                    <div style={{
                      padding: '14px 20px', borderRadius: '12px',
                      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <Ambulance style={{ width: 16, height: 16, color: '#818cf8' }} />
                      <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: '#818cf8' }}>
                        AMB-404 Dispatched
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '80px 40px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center',
                }}>
                  <Radio style={{ width: 48, height: 48, color: 'rgba(148,163,184,0.2)', marginBottom: '16px' }} />
                  <h3 style={{ fontFamily: 'Outfit', color: 'rgba(148,163,184,0.5)', fontWeight: 600, margin: '0 0 8px' }}>
                    {pendingRequest && !hospitalApproved
                      ? 'Waiting for Hospital Approval...'
                      : 'No Pending Alerts'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(100,116,139,0.6)' }}>
                    {pendingRequest && !hospitalApproved
                      ? 'Escort alert will appear once the destination hospital approves the request.'
                      : 'Escort alerts from hospital-approved emergency requests will appear here.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CORRIDORS TAB ── */}
          {activeTab === 'corridors' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onClearHistory && onClearHistory('terminal')}
                  style={{
                    background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
                    color: '#fdba74', fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  Clear Completed Records
                </button>
                <button
                  onClick={() => onClearHistory && onClearHistory('all')}
                  style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
                    color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
                  }}
                >
                  Clear All Records
                </button>
              </div>

              {corridorHistory.length === 0 && (
                <div style={{
                  padding: '40px 24px', borderRadius: '16px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(148,163,184,0.7)'
                }}>
                  No corridor history yet.
                </div>
              )}

              {corridorHistory.map((c, i) => (
                <div key={i} style={{
                  padding: '20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>#{c.id}</span>
                    <span style={{
                      padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600,
                      background: `${statusColor[c.status] || '#64748b'}15`,
                      color: statusColor[c.status] || '#64748b',
                    }}>{c.status}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 12px' }}>
                    <Navigation style={{ width: 14, height: 14, display: 'inline', marginRight: 6, color: '#6366f1' }} />
                    {c.route}
                  </p>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>ETA</div>
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{c.eta}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Signals Cleared</div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>{c.signal}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── UNITS TAB ── */}
          {activeTab === 'units' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockUnits.map((u, i) => (
                <div key={i} style={{
                  padding: '16px 20px', borderRadius: '14px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '10px',
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Shield style={{ width: 18, height: 18, color: '#818cf8' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>{u.id}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.officer}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600,
                      background: `${unitColor[u.status] || '#64748b'}12`,
                      color: unitColor[u.status] || '#64748b', marginBottom: '4px', display: 'inline-block',
                    }}>{u.status}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <MapPin style={{ width: 11, height: 11 }} />{u.location}
                    </div>
                  </div>
                </div>
              ))}
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
