import React, { useState, useEffect, useRef } from 'react';
import {
  X, Building2, AlertTriangle, CheckCircle, XCircle, Clock,
  MapPin, Phone, Heart, Activity, Zap, Ambulance,
  User, Shield, Thermometer, Droplets, Wind, Brain,
  BedDouble, UserCheck, BarChart2, ChevronRight, Radio,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';

// ═══════════════════════════════════════════════
// HOSPITAL PORTAL — Full-Featured Smart ER System
// ═══════════════════════════════════════════════

const DOCTORS = [
  { id: 1, name: 'Dr. Priya Nair',      specialty: 'Trauma Surgery',    status: 'available' },
  { id: 2, name: 'Dr. Karan Mehta',     specialty: 'Cardiology',        status: 'available' },
  { id: 3, name: 'Dr. Sunita Reddy',    specialty: 'Emergency Medicine', status: 'available' },
  { id: 4, name: 'Dr. Arjun Sharma',    specialty: 'Neurology',          status: 'busy' },
];

const ROOM_OPTIONS = [
  { id: 'trauma_1', label: 'Trauma Bay 1', type: 'trauma' },
  { id: 'icu_3',    label: 'ICU Room 3',   type: 'icu'    },
  { id: 'ot_2',     label: 'OT Room 2',    type: 'ot'     },
  { id: 'er_5',     label: 'ER Bay 5',     type: 'er'     },
];

// Simulate live patient vitals streaming from ambulance
function generateVital(base, variance, time) {
  const noise = Math.sin(time * 0.3) * variance * 0.5 + (Math.random() - 0.5) * variance;
  return Math.round(base + noise);
}

function useVitals(active) {
  const [vitals, setVitals] = useState({
    heartRate: 105, spo2: 94, bp_sys: 138, bp_dia: 88, respRate: 22, temp: 37.8,
  });
  const [trend, setTrend] = useState({ heartRate: 0, spo2: 0 });
  const tickRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      setVitals((prev) => {
        const next = {
          heartRate: generateVital(105, 12, t),
          spo2:      Math.min(100, generateVital(94, 3, t * 0.7)),
          bp_sys:    generateVital(138, 10, t * 0.5),
          bp_dia:    generateVital(88,  6,  t * 0.5),
          respRate:  generateVital(22,  4,  t * 1.2),
          temp:      parseFloat((37.8 + Math.sin(t * 0.1) * 0.3).toFixed(1)),
        };
        setTrend({
          heartRate: next.heartRate > prev.heartRate ? 1 : next.heartRate < prev.heartRate ? -1 : 0,
          spo2:      next.spo2 > prev.spo2 ? 1 : next.spo2 < prev.spo2 ? -1 : 0,
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [active]);

  return { vitals, trend };
}

function TrendIcon({ dir }) {
  if (dir > 0) return <TrendingUp style={{ width: 12, height: 12, color: '#f97316' }} />;
  if (dir < 0) return <TrendingDown style={{ width: 12, height: 12, color: '#10b981' }} />;
  return <Minus style={{ width: 12, height: 12, color: '#64748b' }} />;
}

function VitalCard({ icon, label, value, unit, status, trend }) {
  const colors = { normal: '#10b981', warning: '#f97316', critical: '#ef4444' };
  const c = colors[status] || '#94a3b8';
  return (
    <div style={{
      padding: '12px 14px', borderRadius: '12px',
      background: `${c}0a`, border: `1px solid ${c}25`,
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.65rem', color: '#64748b' }}>
        {icon}{label}
        {trend !== undefined && <span style={{ marginLeft: 'auto' }}><TrendIcon dir={trend} /></span>}
      </div>
      <div style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 800, color: c, lineHeight: 1 }}>
        {value}
        <span style={{ fontSize: '0.65rem', fontWeight: 400, color: '#64748b', marginLeft: '3px' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '0.6rem', color: c, fontWeight: 600, textTransform: 'uppercase' }}>{status}</div>
    </div>
  );
}

function ETACountdown({ etaMinutes, isActive }) {
  const [secsLeft, setSecsLeft] = useState(etaMinutes * 60);
  useEffect(() => {
    if (!isActive) return;
    setSecsLeft(etaMinutes * 60);
    const interval = setInterval(() => {
      setSecsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, etaMinutes]);

  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const pct  = Math.max(0, (secsLeft / (etaMinutes * 60)) * 100);

  return (
    <div style={{
      padding: '16px', borderRadius: '14px',
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <Clock style={{ width: 14, height: 14, color: '#f87171' }} />
        <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, letterSpacing: '0.08em' }}>PATIENT ETA</span>
        <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s infinite' }} />
      </div>
      <div style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 800, color: '#fca5a5', letterSpacing: '-0.02em' }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div style={{ marginTop: '8px', height: 4, borderRadius: 2, background: 'rgba(239,68,68,0.1)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#ef4444', borderRadius: 2, transition: 'width 1s linear' }} />
      </div>
      <div style={{ marginTop: '4px', fontSize: '0.62rem', color: '#64748b' }}>
        Patient arriving in {mins}m {secs}s · AMB-404 en route
      </div>
    </div>
  );
}

function PreArrivalChecklist({ condition, assignedRoom, assignedDoctor }) {
  const roomLabel = ROOM_OPTIONS.find(r => r.id === assignedRoom)?.label || 'ER Bay 5';
  const doctorName = DOCTORS.find(d => d.id === assignedDoctor)?.name || 'Dr. Priya Nair';

  const checklist = [
    { id: 1, label: `${roomLabel} sanitized & cleared`,              done: true  },
    { id: 2, label: `${doctorName} alerted and en route`,            done: !!assignedDoctor },
    { id: 3, label: 'Blood type cross-match ordered (A+/O− standby)', done: true  },
    { id: 4, label: 'IV lines and crash cart prepared',              done: true  },
    { id: 5, label: condition === 'critical' ? 'Defibrillator & intubation kit ready' : 'Monitoring kit ready', done: true },
    { id: 6, label: 'Trauma team paged (ETA < 5min)',                done: condition === 'critical' },
    { id: 7, label: 'Radiology on standby for CT scan',             done: false },
  ];

  const done = checklist.filter(c => c.done).length;

  return (
    <div style={{
      padding: '16px', borderRadius: '14px',
      background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle style={{ width: 14, height: 14, color: '#10b981' }} />
          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, letterSpacing: '0.08em' }}>PRE-ARRIVAL CHECKLIST</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>{done}/{checklist.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {checklist.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
              background: item.done ? '#10b981' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${item.done ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.done && <span style={{ fontSize: '9px', color: 'white' }}>✓</span>}
            </div>
            <span style={{ fontSize: '0.75rem', color: item.done ? '#94a3b8' : '#475569', textDecoration: item.done ? 'none' : 'none' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HospitalPortal({
  isOpen, onClose, pendingRequest, requestStatus,
  requestHistory = [], notificationStatus, onAccept, onReject, onClearActive, onClearHistory
}) {
  const [activeTab, setActiveTab]         = useState('requests');
  const [notification, setNotif]          = useState(null);
  const [showBell, setShowBell]           = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [assignedRoom, setAssignedRoom]   = useState('trauma_1');
  const [selectedCase, setSelectedCase]   = useState(null);  // for clickable records
  const [bedResources, setBedResources]   = useState([
    { label: 'ICU Beds',        used: 8,  total: 12, icon: '🛏️' },
    { label: 'ER Bays',         used: 5,  total: 10, icon: '🏥' },
    { label: 'Ventilators',     used: 3,  total: 8,  icon: '💨' },
    { label: 'Surgeons on call', used: 2, total: 4,  icon: '👨‍⚕️' },
  ]);

  const isPendingForHospital = Boolean(pendingRequest && requestStatus === 'WAITING_HOSPITAL');
  const isAccepted = Boolean(
    pendingRequest && ['WAITING_POLICE', 'ASSIGNED', 'TRACKING', 'ARRIVED'].includes(requestStatus)
  );
  const isTracking = Boolean(pendingRequest && ['TRACKING', 'ARRIVED'].includes(requestStatus));
  const isArrived  = requestStatus === 'ARRIVED';
  const hospitalEmailSent = Boolean(notificationStatus?.hospitalApprovedAt);

  // Live vitals — only stream when ambulance is en route
  const { vitals, trend } = useVitals(isTracking);

  // Flash notification bell
  useEffect(() => {
    if (isPendingForHospital) {
      setShowBell(true);
      const t = setTimeout(() => setShowBell(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isPendingForHospital]);

  useEffect(() => {
    if (isOpen) setActiveTab('requests');
  }, [isOpen]);

  // Auto-switch to live tracking tab when ambulance dispatched
  useEffect(() => {
    if (isTracking) setActiveTab('live');
  }, [isTracking]);

  const handleAccept = () => {
    if (!assignedDoctor) {
      setNotif({ type: 'error', msg: 'Please assign a doctor before accepting.' });
      setTimeout(() => setNotif(null), 3000);
      return;
    }
    const doc = DOCTORS.find(d => d.id === Number(assignedDoctor));
    const room = ROOM_OPTIONS.find(r => r.id === assignedRoom);
    setNotif({ type: 'success', msg: `Accepted! ${doc?.name} assigned. ${room?.label} prepared. Police notified.` });
    onAccept && onAccept();
    setTimeout(() => setNotif(null), 5000);
  };

  const handleReject = () => {
    setNotif({ type: 'error', msg: 'Request rejected. Routing to next available hospital.' });
    onReject && onReject();
    setAssignedDoctor('');
    setTimeout(() => setNotif(null), 4000);
  };

  const toggleBed = (idx) => {
    setBedResources(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const newUsed = r.used < r.total ? r.used + 1 : r.used - 1;
      return { ...r, used: Math.max(0, newUsed) };
    }));
  };

  const priorityColor = { critical: '#ef4444', moderate: '#f97316', mild: '#10b981' };

  const vitals_status = {
    heartRate: vitals.heartRate > 120 || vitals.heartRate < 60 ? 'critical' : vitals.heartRate > 100 ? 'warning' : 'normal',
    spo2:      vitals.spo2 < 90 ? 'critical' : vitals.spo2 < 95 ? 'warning' : 'normal',
    bp:        vitals.bp_sys > 160 ? 'critical' : vitals.bp_sys > 140 ? 'warning' : 'normal',
    respRate:  vitals.respRate > 25 ? 'warning' : 'normal',
    temp:      vitals.temp > 38.5 ? 'warning' : 'normal',
  };

  const hospitalCapacity = Math.round(
    (bedResources.reduce((s, r) => s + r.used, 0) /
     bedResources.reduce((s, r) => s + r.total, 0)) * 100
  );
  const capacityColor = hospitalCapacity > 80 ? '#ef4444' : hospitalCapacity > 60 ? '#f97316' : '#10b981';

  const tabs = [
    { id: 'requests', label: 'Incoming Requests' },
    { id: 'live',     label: isTracking ? '🔴 Live Vitals' : 'Live Vitals' },
    { id: 'active',   label: 'Active Cases' },
    { id: 'resources', label: 'Resources' },
  ];

  const formatWhen = (isoDate) => {
    if (!isoDate) return '—';
    const dt = new Date(isoDate);
    if (Number.isNaN(dt.getTime())) return '—';
    return dt.toLocaleString();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)',
      display: isOpen ? 'flex' : 'none', alignItems: 'stretch',
    }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: '240px', background: 'rgba(10,14,23,0.98)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 style={{ width: 18, height: 18, color: '#a78bfa' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>Hospital Portal</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(148,163,184,0.5)' }}>Koramangala Med Center</div>
            </div>
          </div>
        </div>

        {/* Hospital Capacity Indicator */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: '6px', letterSpacing: '0.08em' }}>HOSPITAL CAPACITY</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <div style={{ width: `${hospitalCapacity}%`, height: '100%', background: capacityColor, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: capacityColor }}>{hospitalCapacity}%</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: capacityColor, fontWeight: 600 }}>
            {hospitalCapacity > 80 ? '🔴 HIGH LOAD' : hospitalCapacity > 60 ? '🟠 MODERATE' : '🟢 NORMAL'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '14px 12px', flex: 1 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                borderRadius: '10px', border: 'none', cursor: 'pointer',
                marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px',
                background: activeTab === tab.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                color: activeTab === tab.id ? '#a78bfa' : 'rgba(148,163,184,0.6)',
                fontFamily: 'Inter', fontWeight: 500, fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
            >
              {tab.id === 'requests' && isPendingForHospital && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1.5s ease-in-out infinite', flexShrink: 0 }} />
              )}
              {tab.label}
              {tab.id === 'requests' && isPendingForHospital && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '50px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600 }}>1</span>
              )}
            </button>
          ))}
        </nav>

        {/* Status indicator */}
        <div style={{ margin: '0 12px 16px', padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>ONLINE</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(148,163,184,0.5)' }}>Connected to GreenCorridor</div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '0 28px', height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(10,14,23,0.95)', flexShrink: 0,
        }}>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0', margin: 0 }}>
            {tabs.find(t => t.id === activeTab)?.label?.replace('🔴 ', '')}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {(isAccepted || isPendingForHospital) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '50px',
                background: hospitalEmailSent ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.12)',
                border: `1px solid ${hospitalEmailSent ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)'}`,
                color: hospitalEmailSent ? '#6ee7b7' : '#fcd34d',
                fontSize: '0.72rem', fontWeight: 700,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: hospitalEmailSent ? '#10b981' : '#eab308', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                Hospital Email: {hospitalEmailSent ? 'SENT' : 'PENDING'}
              </div>
            )}
            {isPendingForHospital && (
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
            {isTracking && !isArrived && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '50px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                AMB-404 En Route
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

        {/* Toast notification */}
        {notification && (
          <div style={{
            position: 'absolute', top: '80px', right: '24px', zIndex: 100,
            padding: '14px 20px', borderRadius: '12px', maxWidth: '360px',
            background: notification.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: notification.type === 'success' ? '#6ee7b7' : '#fca5a5',
            display: 'flex', alignItems: 'center', gap: '10px',
            backdropFilter: 'blur(12px)', fontFamily: 'Inter', fontSize: '0.85rem',
          }}>
            {notification.type === 'success' ? <CheckCircle style={{ width: 18, height: 18, flexShrink: 0 }} /> : <XCircle style={{ width: 18, height: 18, flexShrink: 0 }} />}
            {notification.msg}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0a0e17' }}>

          {/* ══ REQUESTS TAB ══ */}
          {activeTab === 'requests' && (
            <div>
              {isPendingForHospital ? (
                <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 0 40px rgba(239,68,68,0.06)' }}>
                  {/* Header */}
                  <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#fca5a5', fontSize: '0.9rem' }}>INCOMING EMERGENCY REQUEST</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b' }}>Just now</span>
                  </div>

                  <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                    {/* Request details grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                      {[
                        { icon: <MapPin style={{ width: 13, height: 13, color: '#f97316' }} />, label: 'Emergency Location', value: pendingRequest.location },
                        { icon: <Building2 style={{ width: 13, height: 13, color: '#a78bfa' }} />, label: 'Requested Hospital', value: pendingRequest.hospital },
                        { icon: <Heart style={{ width: 13, height: 13, color: '#ef4444' }} />, label: 'Patient Condition', value: pendingRequest.condition?.toUpperCase(), highlight: true },
                        { icon: <Phone style={{ width: 13, height: 13, color: '#06b6d4' }} />, label: 'Contact Number', value: pendingRequest.contact || '+91 98XXXXX210' },
                        { icon: <User style={{ width: 13, height: 13, color: '#10b981' }} />, label: 'Patient Name', value: pendingRequest.patientName || 'Not provided' },
                        { icon: <Clock style={{ width: 13, height: 13, color: '#eab308' }} />, label: 'Est. Arrival', value: '~6 minutes' },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '13px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.67rem', color: '#64748b' }}>
                            {item.icon} {item.label}
                          </div>
                          <div style={{
                            fontWeight: 600, fontSize: '0.88rem',
                            color: item.highlight ? (priorityColor[pendingRequest.condition] || '#e2e8f0') : '#e2e8f0',
                            fontFamily: item.highlight ? 'Outfit' : 'Inter',
                          }}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Doctor Assignment */}
                    <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <UserCheck style={{ width: 14, height: 14, color: '#818cf8' }} />
                        <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, letterSpacing: '0.08em' }}>ASSIGN DOCTOR</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#ef4444', fontWeight: 600 }}>Required *</span>
                      </div>
                      <select
                        value={assignedDoctor}
                        onChange={e => setAssignedDoctor(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: '10px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.3)',
                          color: assignedDoctor ? '#e2e8f0' : '#64748b', fontSize: '0.875rem',
                          fontFamily: 'Inter', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        <option value="" style={{ background: '#0f141e', color: '#64748b' }}>Select an available doctor...</option>
                        {DOCTORS.map(d => (
                          <option key={d.id} value={d.id} disabled={d.status === 'busy'} style={{ background: '#0f141e', color: d.status === 'busy' ? '#475569' : '#e2e8f0' }}>
                            {d.name} — {d.specialty} {d.status === 'busy' ? '(In procedure)' : '✓ Available'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Room assignment */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '8px', letterSpacing: '0.08em' }}>ASSIGN ROOM / AREA</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {ROOM_OPTIONS.map(room => (
                          <button
                            key={room.id}
                            onClick={() => setAssignedRoom(room.id)}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                              border: assignedRoom === room.id ? '1.5px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                              background: assignedRoom === room.id ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                              color: assignedRoom === room.id ? '#6ee7b7' : '#64748b',
                              fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Inter',
                            }}
                          >
                            {room.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={handleAccept} style={{
                        flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                        cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', boxShadow: '0 0 30px rgba(16,185,129,0.2)', transition: 'all 0.2s',
                      }}>
                        <CheckCircle style={{ width: 20, height: 20 }} /> Accept Request
                      </button>
                      <button onClick={handleReject} style={{
                        flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                        background: 'rgba(239,68,68,0.08)', color: '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      }}>
                        <XCircle style={{ width: 20, height: 20 }} /> Redirect Patient
                      </button>
                    </div>

                    <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: '#eab308', flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: '0.75rem', color: 'rgba(234,179,8,0.8)', margin: 0, lineHeight: 1.6 }}>
                        Your acceptance is <strong>mandatory</strong> before police escort and dispatch can begin.
                      </p>
                    </div>
                  </div>
                </div>

              ) : isAccepted ? (
                // Post-accept view: checklist + ETA + assignment confirmation
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle style={{ width: 22, height: 22, color: '#10b981' }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>Request Accepted</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        {DOCTORS.find(d => d.id === Number(assignedDoctor))?.name || 'Doctor'} · {ROOM_OPTIONS.find(r => r.id === assignedRoom)?.label || 'Room'} · Police notified
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'right' }}>STATUS</div>
                      <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>{requestStatus?.replace('_', ' ')}</div>
                      {hospitalEmailSent && (
                        <div style={{ fontSize: '0.62rem', color: '#6ee7b7', fontWeight: 600, marginTop: '4px' }}>✉️ Acceptance email sent</div>
                      )}
                    </div>
                  </div>

                  {isTracking && <ETACountdown etaMinutes={6} isActive={isTracking && !isArrived} />}

                  <PreArrivalChecklist
                    condition={pendingRequest?.condition}
                    assignedRoom={assignedRoom}
                    assignedDoctor={Number(assignedDoctor)}
                  />
                </div>
              ) : (
                <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Activity style={{ width: 48, height: 48, color: 'rgba(148,163,184,0.2)', marginBottom: '16px' }} />
                  <h3 style={{ fontFamily: 'Outfit', color: 'rgba(148,163,184,0.5)', fontWeight: 600, margin: '0 0 8px' }}>No Pending Requests</h3>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(100,116,139,0.6)' }}>Incoming ambulance requests will appear here in real time.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ LIVE VITALS TAB ══ */}
          {activeTab === 'live' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {isTracking ? (
                <>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse-glow 1s infinite', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: '#fca5a5', fontSize: '0.85rem' }}>LIVE PATIENT VITALS — STREAMING FROM AMB-404</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#64748b' }}>Updates every 1.5s</span>
                  </div>

                  {isArrived && (
                    <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600 }}>
                      ✅ Patient has arrived. Vitals shown are final readings from the ambulance.
                    </div>
                  )}

                  {/* 6 vital cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <VitalCard icon={<Heart style={{ width: 12, height: 12 }} />} label="Heart Rate" value={vitals.heartRate} unit="bpm" status={vitals_status.heartRate} trend={trend.heartRate} />
                    <VitalCard icon={<Droplets style={{ width: 12, height: 12 }} />} label="SpO₂" value={vitals.spo2} unit="%" status={vitals_status.spo2} trend={trend.spo2} />
                    <VitalCard icon={<Activity style={{ width: 12, height: 12 }} />} label="Blood Pressure" value={`${vitals.bp_sys}/${vitals.bp_dia}`} unit="mmHg" status={vitals_status.bp} />
                    <VitalCard icon={<Wind style={{ width: 12, height: 12 }} />} label="Resp. Rate" value={vitals.respRate} unit="/min" status={vitals_status.respRate} />
                    <VitalCard icon={<Thermometer style={{ width: 12, height: 12 }} />} label="Temperature" value={vitals.temp} unit="°C" status={vitals_status.temp} />
                    <VitalCard icon={<Brain style={{ width: 12, height: 12 }} />} label="GCS Score" value="13" unit="/15" status="warning" />
                  </div>

                  {/* Condition assessment */}
                  <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '10px', letterSpacing: '0.08em' }}>AI TRIAGE ASSESSMENT</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Suggested Treatment', value: pendingRequest?.condition === 'critical' ? 'Immediate intubation + vasopressors' : 'IV fluids + monitoring' },
                        { label: 'Assigned Doctor',      value: DOCTORS.find(d => d.id === Number(assignedDoctor))?.name || 'Unassigned' },
                        { label: 'Prepared Room',        value: ROOM_OPTIONS.find(r => r.id === assignedRoom)?.label || 'ER Bay 5' },
                        { label: 'Blood Type Standby',   value: 'O− Universal (confirmed)' },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.62rem', color: '#475569', marginBottom: '3px' }}>{item.label}</div>
                          <div style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isArrived && <ETACountdown etaMinutes={6} isActive={true} />}
                </>
              ) : (
                <div style={{ padding: '80px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Activity style={{ width: 48, height: 48, color: 'rgba(148,163,184,0.15)', marginBottom: '16px' }} />
                  <h3 style={{ fontFamily: 'Outfit', color: 'rgba(148,163,184,0.4)', fontWeight: 600, margin: '0 0 8px' }}>No Active Journey</h3>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(100,116,139,0.5)' }}>Live vitals will stream here once the ambulance is dispatched.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ ACTIVE CASES TAB ══ */}
          {activeTab === 'active' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <button onClick={() => onClearHistory && onClearHistory('terminal')} style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fdba74', fontSize: '0.75rem', fontWeight: 600 }}>
                  Clear Completed
                </button>
                <button onClick={() => onClearHistory && onClearHistory('all')} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '7px 12px', cursor: 'pointer', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600 }}>
                  Clear All
                </button>
              </div>

              {/* Hint */}
              {requestHistory.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '-4px' }}>Click any record to view full journey details.</div>
              )}

              {requestHistory.length === 0 ? (
                <div style={{ padding: '40px 24px', borderRadius: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(148,163,184,0.5)' }}>
                  No journey records yet.
                </div>
              ) : requestHistory.map((c, i) => {
                const pColor = priorityColor[c.condition] || '#64748b';
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedCase(c)}
                    style={{
                      padding: '18px 20px', borderRadius: '16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: pColor, boxShadow: `0 0 8px ${pColor}80` }} />
                        <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>#{String(c._id || i).slice(-6).toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 600, background: `${pColor}15`, color: pColor, textTransform: 'uppercase' }}>{c.status || 'UNKNOWN'}</span>
                        <ChevronRight style={{ width: 14, height: 14, color: '#475569' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Condition', value: (c.condition || '—').toUpperCase() },
                        { label: 'Hospital', value: c.hospital || '—' },
                        { label: 'Updated', value: formatWhen(c.updatedAt) },
                      ].map((d, j) => (
                        <div key={j}>
                          <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: '3px' }}>{d.label}</div>
                          <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{d.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ RESOURCES TAB ══ */}
          {activeTab === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0', fontSize: '1rem' }}>Bed & Resource Management</h3>
                <p style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '20px' }}>Click a resource to toggle used/available status.</p>
                {bedResources.map((r, i) => {
                  const pct = Math.round((r.used / r.total) * 100);
                  const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f97316' : '#10b981';
                  return (
                    <div key={i} style={{ marginBottom: '18px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => toggleBed(i)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{r.icon}</span>{r.label}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: barColor, fontWeight: 700 }}>{r.used}/{r.total}</span>
                          <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '50px', background: `${barColor}15`, color: barColor, fontWeight: 600 }}>
                            {pct > 80 ? 'CRITICAL' : pct > 60 ? 'BUSY' : 'AVAILABLE'}
                          </span>
                        </div>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: barColor, transition: 'width 0.4s ease', boxShadow: `0 0 8px ${barColor}60` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Doctors on duty */}
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: '14px', color: '#a5b4fc', fontSize: '0.95rem' }}>Doctors On Duty</h3>
                {DOCTORS.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: doc.status === 'available' ? '#10b981' : '#f97316', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{doc.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{doc.specialty}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: '50px', background: doc.status === 'available' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)', color: doc.status === 'available' ? '#10b981' : '#f97316', fontWeight: 600, textTransform: 'uppercase' }}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CASE DETAIL OVERLAY ── */}
      {selectedCase && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => e.target === e.currentTarget && setSelectedCase(null)}
        >
          <div style={{
            width: '520px', background: 'linear-gradient(145deg, rgba(15,20,30,0.99), rgba(8,12,20,1))',
            borderRadius: '20px', border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 0 80px rgba(139,92,246,0.08), 0 30px 60px rgba(0,0,0,0.6)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#e2e8f0' }}>
                  Journey #{String(selectedCase._id || '').slice(-6).toUpperCase() || 'DETAIL'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Full case record</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  padding: '5px 14px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700,
                  background: `${priorityColor[selectedCase.condition] || '#64748b'}18`,
                  color: priorityColor[selectedCase.condition] || '#64748b',
                  textTransform: 'uppercase',
                  border: `1px solid ${priorityColor[selectedCase.condition] || '#64748b'}35`,
                }}>
                  {selectedCase.status || 'UNKNOWN'}
                </span>
                <button
                  onClick={() => setSelectedCase(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Grid of key details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { icon: <User style={{ width: 12, height: 12, color: '#10b981' }} />, label: 'Patient Name', value: selectedCase.patientName || 'Not provided' },
                  { icon: <Heart style={{ width: 12, height: 12, color: '#ef4444' }} />, label: 'Condition', value: (selectedCase.condition || '—').toUpperCase(), bold: true, color: priorityColor[selectedCase.condition] },
                  { icon: <MapPin style={{ width: 12, height: 12, color: '#f97316' }} />, label: 'Pickup Location', value: selectedCase.location || '—' },
                  { icon: <Building2 style={{ width: 12, height: 12, color: '#a78bfa' }} />, label: 'Hospital', value: selectedCase.hospital || '—' },
                  { icon: <Phone style={{ width: 12, height: 12, color: '#06b6d4' }} />, label: 'Contact', value: selectedCase.contact || '+91 98XXXXX210' },
                  { icon: <Shield style={{ width: 12, height: 12, color: '#818cf8' }} />, label: 'Assigned Doctor', value: DOCTORS.find(d => d.id === Number(selectedCase.assignedDoctor))?.name || 'Auto-assigned' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.62rem', color: '#64748b', marginBottom: '5px' }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: item.color || '#e2e8f0', fontFamily: item.bold ? 'Outfit' : 'Inter' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Timestamps */}
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '3px' }}>REQUEST CREATED</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{formatWhen(selectedCase.createdAt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#475569', marginBottom: '3px' }}>LAST UPDATED</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{formatWhen(selectedCase.updatedAt)}</div>
                </div>
              </div>

              {/* Journey outcome */}
              <div style={{
                padding: '14px 16px', borderRadius: '12px',
                background: selectedCase.status === 'ARRIVED' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.05)',
                border: `1px solid ${selectedCase.status === 'ARRIVED' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)'}`,
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                {selectedCase.status === 'ARRIVED'
                  ? <CheckCircle style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
                  : <AlertTriangle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
                }
                <span style={{ fontSize: '0.8rem', color: selectedCase.status === 'ARRIVED' ? '#6ee7b7' : '#fca5a5', fontWeight: 600 }}>
                  {selectedCase.status === 'ARRIVED'
                    ? 'Journey completed successfully. Patient delivered to hospital.'
                    : selectedCase.status === 'REJECTED'
                    ? 'Request was rejected. Patient routed to next available hospital.'
                    : `Current status: ${selectedCase.status?.replace('_', ' ')}`
                  }
                </span>
              </div>

              <button
                onClick={() => setSelectedCase(null)}
                style={{ padding: '12px', borderRadius: '12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
