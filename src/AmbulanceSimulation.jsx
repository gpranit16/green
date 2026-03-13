import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Ambulance, Phone, MapPin, Activity, Clock, Navigation, Shield, Radio, AlertTriangle, Heart, Zap, Building2, ChevronDown, CheckCircle, RotateCcw } from 'lucide-react';
import { computeSignalPreemption, computeETA, haversineDistance } from './trafficAlgorithm';

// ── Bangalore route ──────────────────────────────────────────
const ROUTE_COORDS = [
  [12.9170, 77.6230], [12.9190, 77.6210], [12.9215, 77.6185],
  [12.9240, 77.6160], [12.9268, 77.6138], [12.9295, 77.6115],
  [12.9320, 77.6090], [12.9345, 77.6065], [12.9370, 77.6040],
  [12.9395, 77.6020], [12.9420, 77.6000], [12.9445, 77.5980],
  [12.9470, 77.5960], [12.9495, 77.5945], [12.9520, 77.5930],
  [12.9545, 77.5920], [12.9570, 77.5910], [12.9595, 77.5905],
  [12.9620, 77.5900], [12.9645, 77.5898], [12.9665, 77.5895],
  [12.9685, 77.5893], [12.9700, 77.5890],
];

const USER_LOCATION     = [12.9170, 77.6230];
const HOSPITAL_LOCATION = [12.9700, 77.5890];

const TRAFFIC_SIGNALS = [
  { pos: [12.9240, 77.6160], name: 'BTM Layout Signal' },
  { pos: [12.9370, 77.6040], name: 'HSR Layout Junction' },
  { pos: [12.9470, 77.5960], name: 'Koramangala Signal' },
  { pos: [12.9570, 77.5910], name: 'Hospital Road Signal' },
];

// ── Hospital Options ─────────────────────────────────────────
const HOSPITAL_OPTIONS = [
  'Manipal Hospital, Old Airport Road',
  'Apollo Hospital, Bannerghatta Road',
  'Fortis Hospital, Bangalore',
  'Narayana Health, Bommasandra',
  'Cloudnine Hospital, Bellandur',
  'Columbia Asia Hospital, Whitefield',
  'Sakra World Hospital, Marathahalli',
  'BGS Gleneagles Hospital, Kengeri',
  'Other (type below)',
];

// ── Map Icons ──────────────────────────────────────────────────
const createAmbulanceIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(16,185,129,0.6),0 0 40px rgba(16,185,129,0.3);border:2px solid rgba(255,255,255,0.3);"><span style="font-size:20px">🚑</span></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

const createUserIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(249,115,22,0.5);border:2px solid rgba(255,255,255,0.3);"><span style="font-size:16px">📍</span></div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const createHospitalIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(6,182,212,0.5);border:2px solid rgba(255,255,255,0.3);"><span style="font-size:18px">🏥</span></div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

function MapFollower({ position, isTracking }) {
  const map = useMap();

  useEffect(() => {
    if (isTracking) {
      const t = setTimeout(() => map.invalidateSize(), 550); // wait for width transition 0.5s
      return () => clearTimeout(t);
    }
  }, [isTracking, map]);

  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.5 });
  }, [position, map]);
  return null;
}

// ── PHASES ────────────────────────────────────────────────────
const PHASE = {
  FORM:             'form',
  WAITING_HOSPITAL: 'waiting_hospital',
  WAITING_POLICE:   'waiting_police',
  ASSIGNED:         'assigned',
  TRACKING:         'tracking',
  ARRIVED:          'arrived',
};

// ── Shared input styles ───────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e8f0', fontSize: '0.95rem', outline: 'none',
  fontFamily: 'Inter', boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px',
  display: 'flex', alignItems: 'center', gap: '6px',
};

export default function AmbulanceSimulation({ isOpen, onClose, onSubmitRequest, hospitalApproved, policeApproved, pendingRequest }) {
  const [phase, setPhase]             = useState(PHASE.FORM);
  const [formData, setFormData]       = useState({
    location: 'Silk Board Junction, Bangalore',
    condition: 'critical',
    contact: '',
    patientName: '',
    hospital: '',
    customHospital: '',
  });
  const [showCustomHospital, setShowCustomHospital] = useState(false);
  const [ambulancePos, setAmbulancePos]   = useState(ROUTE_COORDS[0]);
  const [routeProgress, setRouteProgress] = useState(0);
  const [eta, setEta]                     = useState(6);
  const [distance, setDistance]           = useState(4.2);
  const [greenSignals, setGreenSignals]   = useState([]);
  const [greenSet, setGreenSet]           = useState(new Set());
  const [corridorActive, setCorridorActive] = useState(false);
  const animRef   = useRef(null);
  const progressRef = useRef(0);

  // Reset ONLY if opening and there is NO active global request
  useEffect(() => {
    if (isOpen && !pendingRequest && phase !== PHASE.FORM) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setPhase(PHASE.FORM);
      setRouteProgress(0);
      setEta(6);
      setDistance(4.2);
      setGreenSignals([]);
      setGreenSet(new Set());
      setCorridorActive(false);
      setAmbulancePos(ROUTE_COORDS[0]);
      progressRef.current = 0;
      setFormData({ location: 'Silk Board Junction, Bangalore', condition: 'critical', contact: '', patientName: '', hospital: '', customHospital: '' });
      setShowCustomHospital(false);
    }
  }, [isOpen, pendingRequest, phase]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  // React to hospital approval (from parent state)
  useEffect(() => {
    if (hospitalApproved && phase === PHASE.WAITING_HOSPITAL) {
      setPhase(PHASE.WAITING_POLICE);
    }
  }, [hospitalApproved, phase]);

  // React to police approval
  useEffect(() => {
    if (policeApproved && phase === PHASE.WAITING_POLICE) {
      setPhase(PHASE.ASSIGNED);
      setTimeout(() => {
        setPhase(PHASE.TRACKING);
        setCorridorActive(true);
        startAmbulanceMovement();
      }, 2500);
    }
  }, [policeApproved, phase]);

  const resolvedHospital = formData.hospital === 'Other (type below)'
    ? formData.customHospital || 'Custom Hospital'
    : formData.hospital;

  const handleSubmit = (e) => {
    e.preventDefault();
    const hospital = resolvedHospital;
    // Send to parent for Hospital/Police portals
    onSubmitRequest && onSubmitRequest({
      location: formData.location,
      condition: formData.condition,
      contact: formData.contact,
      patientName: formData.patientName,
      hospital,
    });
    setPhase(PHASE.WAITING_HOSPITAL);
  };

  const startAmbulanceMovement = () => {
    const totalSteps = ROUTE_COORDS.length - 1;
    const animDuration = 25000;
    const startTime = performance.now();
    let currentGreenSet = new Set();
    
    // Clear any existing animation before starting a new one
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / animDuration);
      const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const exactIndex = easedT * totalSteps;
      const idx = Math.min(Math.floor(exactIndex), totalSteps - 1);
      const frac = exactIndex - idx;

      const lat = ROUTE_COORDS[idx][0] + (ROUTE_COORDS[idx + 1][0] - ROUTE_COORDS[idx][0]) * frac;
      const lng = ROUTE_COORDS[idx][1] + (ROUTE_COORDS[idx + 1][1] - ROUTE_COORDS[idx][1]) * frac;
      const pos = [lat, lng];

      setAmbulancePos(pos);
      setRouteProgress(easedT);

      // Use traffic algorithm to determine green signals
      const { greenSet: newGreenSet } = computeSignalPreemption(pos, TRAFFIC_SIGNALS, currentGreenSet);
      currentGreenSet = newGreenSet;
      setGreenSet(new Set(newGreenSet));
      setGreenSignals(Array.from(newGreenSet));

      // ETA via algorithm
      const remaining = ROUTE_COORDS.slice(Math.max(0, idx));
      const { etaMinutes } = computeETA(pos, remaining, 40, newGreenSet.size);
      setEta(Math.max(0, etaMinutes));
      setDistance(Math.max(0, parseFloat((4.2 * (1 - easedT)).toFixed(1))));
      progressRef.current = easedT;

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase(PHASE.ARRIVED);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const completedRoute = ROUTE_COORDS.slice(0, Math.max(1, Math.ceil(routeProgress * (ROUTE_COORDS.length - 1)) + 1));
  const remainingRoute = ROUTE_COORDS.slice(Math.max(0, Math.ceil(routeProgress * (ROUTE_COORDS.length - 1))));

  const isTracking = phase === PHASE.TRACKING || phase === PHASE.ARRIVED;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: isOpen ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div style={{
        width: isTracking ? '95vw' : '540px',
        maxHeight: '92vh',
        background: 'linear-gradient(145deg, rgba(15,20,30,0.97), rgba(8,12,20,0.99))',
        borderRadius: '20px', border: '1px solid rgba(16,185,129,0.15)',
        boxShadow: '0 0 80px rgba(16,185,129,0.08), 0 30px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden', transition: 'width 0.5s ease-in-out',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(16,185,129,0.03)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ambulance style={{ width: 22, height: 22, color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                {phase === PHASE.FORM             && 'Request Emergency Ambulance'}
                {phase === PHASE.WAITING_HOSPITAL && '⏳ Waiting for Hospital Approval'}
                {phase === PHASE.WAITING_POLICE   && '🚔 Police Escort Confirmation'}
                {phase === PHASE.ASSIGNED         && 'Ambulance Assigned'}
                {phase === PHASE.TRACKING         && 'Live Tracking — Green Corridor Active'}
                {phase === PHASE.ARRIVED          && '🎉 Ambulance Arrived!'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.7)' }}>Dynamic Green Corridor System</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', width: 36, height: 36, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
          }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* ── FORM ── */}
        {phase === PHASE.FORM && (
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
            {/* Location */}
            <div>
              <label style={labelStyle}>
                <MapPin style={{ width: 14, height: 14, color: '#10b981' }} /> Emergency Location
              </label>
              <input type="text" value={formData.location} required
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter your current location..." style={inputStyle} />
            </div>

            {/* Patient Name */}
            <div>
              <label style={labelStyle}>
                <Activity style={{ width: 14, height: 14, color: '#a78bfa' }} /> Patient Name (optional)
              </label>
              <input type="text" value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Full name of patient" style={inputStyle} />
            </div>

            {/* Hospital Dropdown */}
            <div>
              <label style={labelStyle}>
                <Building2 style={{ width: 14, height: 14, color: '#06b6d4' }} /> Select Hospital <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  required
                  value={formData.hospital}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, hospital: val, customHospital: '' });
                    setShowCustomHospital(val === 'Other (type below)');
                  }}
                  style={{
                    ...inputStyle,
                    appearance: 'none', WebkitAppearance: 'none',
                    paddingRight: '40px', cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>Choose a hospital...</option>
                  {HOSPITAL_OPTIONS.map(h => (
                    <option key={h} value={h} style={{ background: '#0f141e', color: '#e2e8f0' }}>{h}</option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  width: 16, height: 16, color: '#64748b', pointerEvents: 'none',
                }} />
              </div>
              {showCustomHospital && (
                <input type="text" value={formData.customHospital}
                  onChange={(e) => setFormData({ ...formData, customHospital: e.target.value })}
                  placeholder="Type hospital name..." required
                  style={{ ...inputStyle, marginTop: '8px' }} />
              )}
            </div>

            {/* Condition */}
            <div>
              <label style={labelStyle}>
                <Heart style={{ width: 14, height: 14, color: '#f97316' }} /> Patient Condition
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['critical', 'moderate', 'mild'].map((c) => (
                  <button key={c} type="button"
                    onClick={() => setFormData({ ...formData, condition: c })}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                      border: formData.condition === c ? '1.5px solid' : '1px solid rgba(255,255,255,0.08)',
                      borderColor: formData.condition === c
                        ? (c === 'critical' ? '#ef4444' : c === 'moderate' ? '#f97316' : '#10b981')
                        : 'rgba(255,255,255,0.08)',
                      background: formData.condition === c
                        ? (c === 'critical' ? 'rgba(239,68,68,0.1)' : c === 'moderate' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)')
                        : 'rgba(255,255,255,0.02)',
                      color: formData.condition === c ? '#e2e8f0' : '#64748b',
                      fontFamily: 'Inter', fontSize: '0.85rem', fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {c === 'critical' && '🔴 '}{c === 'moderate' && '🟡 '}{c === 'mild' && '🟢 '}
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <label style={labelStyle}>
                <Phone style={{ width: 14, height: 14, color: '#06b6d4' }} /> Contact Number
              </label>
              <input type="tel" value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+91 98765 43210" style={inputStyle} />
            </div>

            {/* Info note */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <AlertTriangle style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.75rem', color: 'rgba(100,116,139,0.8)', margin: 0, lineHeight: 1.6 }}>
                Your request will be reviewed and approved by the selected hospital, then confirmed by the police before the ambulance is dispatched.
              </p>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', padding: '14px', fontSize: '1rem' }}>
              <Zap style={{ width: 20, height: 20 }} /> Submit Emergency Request
            </button>
          </form>
        )}

        {/* ── WAITING HOSPITAL ── */}
        {phase === PHASE.WAITING_HOSPITAL && (
          <div style={{ padding: '60px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto',
              border: '3px solid rgba(139,92,246,0.3)', borderTopColor: '#a78bfa',
              animation: 'spin 1.2s linear infinite',
            }} />
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#a78bfa', fontWeight: 700, margin: '0 0 8px' }}>
                Waiting for Hospital Approval
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                Your request has been sent to <strong style={{ color: '#e2e8f0' }}>{resolvedHospital}</strong>.<br />
                The hospital must accept before police escort can proceed.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Request transmitted', 'Awaiting doctor on-call', 'ER resource check...'].map((t, i) => (
                <span key={i} style={{
                  padding: '6px 14px', borderRadius: '50px', fontSize: '0.75rem',
                  background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                  border: '1px solid rgba(139,92,246,0.15)',
                  animation: `fadeInUp 0.5s ease ${i * 0.3}s both`,
                }}>{t}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(100,116,139,0.6)', marginTop: 8 }}>
              → Open the <strong style={{ color: '#a78bfa' }}>Hospital Portal</strong> from the landing page to approve this request.
            </p>
          </div>
        )}

        {/* ── WAITING POLICE ── */}
        {phase === PHASE.WAITING_POLICE && (
          <div style={{ padding: '60px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(99,102,241,0.15)',
            }}>
              <Shield style={{ width: 40, height: 40, color: '#818cf8' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#818cf8', fontWeight: 700, margin: '0 0 8px' }}>
                ✅ Hospital Approved!
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
                <strong style={{ color: '#10b981' }}>Hospital has accepted your request.</strong><br />
                Police escort confirmation is pending before dispatch.
              </p>
            </div>
            <div style={{
              padding: '14px 20px', borderRadius: '12px', width: '100%', maxWidth: '360px',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', animation: 'pulse-glow 1s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: '#818cf8', textAlign: 'left' }}>
                Police Traffic Unit notified. Awaiting escort confirmation...
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(100,116,139,0.6)', marginTop: 4 }}>
              → Open the <strong style={{ color: '#818cf8' }}>Police Portal</strong> from the landing page to confirm escort.
            </p>
          </div>
        )}

        {/* ── ASSIGNED ── */}
        {phase === PHASE.ASSIGNED && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(16,185,129,0.2)',
            }}>
              <span style={{ fontSize: '36px' }}>🚑</span>
            </div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', color: '#10b981', fontWeight: 700, margin: '0 0 8px' }}>
              Police Confirmed! Ambulance Dispatched
            </h3>
            <p style={{ fontSize: '1rem', color: '#e2e8f0' }}>
              ETA <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>6 minutes</span>
            </p>
            <div style={{
              marginTop: '20px', padding: '16px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', textAlign: 'left',
            }}>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>AMBULANCE</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600 }}>AMB-404</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>DRIVER</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600 }}>Rajesh Kumar</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>HOSPITAL</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem' }}>{resolvedHospital}</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>PRIORITY</span><br /><span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 {formData.condition.toUpperCase()}</span></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '16px' }}>
              ⚡ Activating Green Corridor...
            </p>
          </div>
        )}

        {/* ── TRACKING ── */}
        {isTracking && (
          <div style={{ display: 'flex', flex: 1, minHeight: '75vh' }}>
            {/* Map */}
            <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer center={[12.9400, 77.6050]} zoom={14}
                style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
                <MapFollower position={ambulancePos} isTracking={isTracking} />
                <Polyline positions={remainingRoute} pathOptions={{ color: 'rgba(100,116,139,0.4)', weight: 4, dashArray: '8,8' }} />
                {corridorActive && completedRoute.length > 1 && (<>
                  <Polyline positions={completedRoute} pathOptions={{ color: '#10b981', weight: 6, opacity: 0.9 }} />
                  <Polyline positions={completedRoute} pathOptions={{ color: '#10b981', weight: 16, opacity: 0.15 }} />
                </>)}
                <Polyline positions={ROUTE_COORDS} pathOptions={{ color: '#10b981', weight: 20, opacity: 0.05 }} />
                {TRAFFIC_SIGNALS.map((sig, i) => (
                  <CircleMarker key={i} center={sig.pos} radius={8}
                    pathOptions={{ color: greenSignals.includes(i) ? '#10b981' : '#ef4444', fillColor: greenSignals.includes(i) ? '#10b981' : '#ef4444', fillOpacity: 0.8, weight: 2 }}>
                    <Popup><b>{sig.name}</b><br />{greenSignals.includes(i) ? '🟢 GREEN — Corridor Active' : '🔴 RED — Waiting'}</Popup>
                  </CircleMarker>
                ))}
                <Marker position={USER_LOCATION} icon={createUserIcon()}>
                  <Popup>📍 Emergency Location<br />Silk Board Junction</Popup>
                </Marker>
                <Marker position={HOSPITAL_LOCATION} icon={createHospitalIcon()}>
                  <Popup>🏥 {resolvedHospital}</Popup>
                </Marker>
                <Marker position={ambulancePos} icon={createAmbulanceIcon()}>
                  <Popup>🚑 AMB-404<br />Driver: Rajesh Kumar</Popup>
                </Marker>
              </MapContainer>

              {corridorActive && phase === PHASE.TRACKING && (
                <div style={{
                  position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
                  zIndex: 1000, padding: '10px 24px', borderRadius: '50px',
                  background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}>
                  <Shield style={{ width: 18, height: 18 }} />
                  GREEN CORRIDOR ACTIVE
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                </div>
              )}

              {phase === PHASE.ARRIVED && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  zIndex: 1000, padding: '30px 50px', borderRadius: '20px',
                  background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', color: '#10b981', fontWeight: 700, margin: '0 0 8px' }}>
                    Ambulance Arrived!
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 16px' }}>Patient pickup in progress</p>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    ✅ {greenSignals.length} signals preempted · ~{greenSignals.length * 45}s saved
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{
              width: '300px', padding: '20px', overflowY: 'auto',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', gap: '14px',
            }}>
              {/* ETA */}
              <div style={{
                padding: '20px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
                border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center',
              }}>
                <Clock style={{ width: 24, height: 24, color: '#10b981', margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, color: '#10b981' }}>
                  {eta} <span style={{ fontSize: '1rem', color: '#64748b' }}>min</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ESTIMATED ARRIVAL</span>
              </div>

              {/* Details */}
              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#64748b', margin: 0, letterSpacing: '0.1em' }}>AMBULANCE DETAILS</h4>
                {[
                  { label: 'Ambulance ID', value: 'AMB-404', icon: <Ambulance style={{ width: 14, height: 14, color: '#10b981' }} /> },
                  { label: 'Driver', value: 'Rajesh Kumar', icon: <Navigation style={{ width: 14, height: 14, color: '#06b6d4' }} /> },
                  { label: 'Distance', value: `${distance} km`, icon: <MapPin style={{ width: 14, height: 14, color: '#f97316' }} /> },
                  { label: 'Speed', value: '40 km/h', icon: <Activity style={{ width: 14, height: 14, color: '#8b5cf6' }} /> },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8' }}>
                      {item.icon}{item.label}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Hospital */}
              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#06b6d4', margin: '0 0 8px', letterSpacing: '0.1em' }}>DESTINATION</h4>
                <p style={{ fontSize: '0.875rem', color: '#e2e8f0', fontWeight: 600, margin: '0 0 4px' }}>{resolvedHospital}</p>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>Emergency dept notified • Bed ready</p>
              </div>

              {/* Signals */}
              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 12px', letterSpacing: '0.1em' }}>CORRIDOR SIGNALS</h4>
                {TRAFFIC_SIGNALS.map((sig, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 0', borderBottom: i < TRAFFIC_SIGNALS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: greenSignals.includes(i) ? '#10b981' : '#ef4444', boxShadow: greenSignals.includes(i) ? '0 0 8px rgba(16,185,129,0.5)' : 'none', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: greenSignals.includes(i) ? '#e2e8f0' : '#64748b', flex: 1 }}>{sig.name}</span>
                    <span style={{
                      fontSize: '0.6rem', padding: '2px 7px', borderRadius: '50px',
                      background: greenSignals.includes(i) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: greenSignals.includes(i) ? '#10b981' : '#ef4444',
                    }}>{greenSignals.includes(i) ? 'GREEN' : 'RED'}</span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 12px', letterSpacing: '0.1em' }}>ROUTE PROGRESS</h4>
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${routeProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '3px', transition: 'width 0.3s', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.68rem', color: '#64748b' }}>
                  <span>📍 Pickup</span>
                  <span>{Math.round(routeProgress * 100)}%</span>
                  <span>🏥 Hospital</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .leaflet-container { background: #0a0e17 !important; }
        select option { background: #0f141e; color: #e2e8f0; }
      `}</style>
    </div>
  );
}
