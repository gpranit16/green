import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Ambulance, Phone, MapPin, Activity, Clock, Navigation, Shield, Radio, ChevronRight, AlertTriangle, Heart, Zap } from 'lucide-react';

// ── Bangalore route coordinates (real roads: Silk Board → Koramangala → Hospital) ──
const ROUTE_COORDS = [
  [12.9170, 77.6230], // Silk Board Junction
  [12.9190, 77.6210],
  [12.9215, 77.6185],
  [12.9240, 77.6160], // Moving through BTM
  [12.9268, 77.6138],
  [12.9295, 77.6115],
  [12.9320, 77.6090],
  [12.9345, 77.6065],
  [12.9370, 77.6040], // HSR Layout area
  [12.9395, 77.6020],
  [12.9420, 77.6000],
  [12.9445, 77.5980],
  [12.9470, 77.5960], // Koramangala
  [12.9495, 77.5945],
  [12.9520, 77.5930],
  [12.9545, 77.5920],
  [12.9570, 77.5910],
  [12.9595, 77.5905],
  [12.9620, 77.5900],
  [12.9645, 77.5898],
  [12.9665, 77.5895], // Near hospital
  [12.9685, 77.5893],
  [12.9700, 77.5890], // Hospital destination
];

const USER_LOCATION = [12.9170, 77.6230]; // Silk Board area
const HOSPITAL_LOCATION = [12.9700, 77.5890];
const AMBULANCE_START = [12.9350, 77.5850]; // Starting from a depot

// Traffic signal positions along the corridor
const TRAFFIC_SIGNALS = [
  { pos: [12.9240, 77.6160], name: 'BTM Layout Signal' },
  { pos: [12.9370, 77.6040], name: 'HSR Layout Junction' },
  { pos: [12.9470, 77.5960], name: 'Koramangala Signal' },
  { pos: [12.9570, 77.5910], name: 'Hospital Road Signal' },
];

// Custom ambulance icon
const createAmbulanceIcon = () => L.divIcon({
  className: 'ambulance-map-marker',
  html: `<div style="
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.3);
    animation: pulse-glow 1.5s ease-in-out infinite;
    border: 2px solid rgba(255,255,255,0.3);
  ">
    <span style="font-size: 20px;">🚑</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const createUserIcon = () => L.divIcon({
  className: 'user-map-marker',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #f97316, #ea580c);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 15px rgba(249,115,22,0.5);
    border: 2px solid rgba(255,255,255,0.3);
  ">
    <span style="font-size: 16px;">📍</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const createHospitalIcon = () => L.divIcon({
  className: 'hospital-map-marker',
  html: `<div style="
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #0891b2);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 15px rgba(6,182,212,0.5);
    border: 2px solid rgba(255,255,255,0.3);
  ">
    <span style="font-size: 18px;">🏥</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Map auto-panner that follows the ambulance
function MapFollower({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, map]);
  return null;
}

// ── SIMULATION PHASES ──
const PHASE = {
  FORM: 'form',
  FINDING: 'finding',
  ASSIGNED: 'assigned',
  TRACKING: 'tracking',
  ARRIVED: 'arrived',
};

export default function AmbulanceSimulation({ isOpen, onClose }) {
  const [phase, setPhase] = useState(PHASE.FORM);
  const [formData, setFormData] = useState({
    location: 'Silk Board Junction, Bangalore',
    condition: 'critical',
    contact: '',
  });
  const [ambulancePos, setAmbulancePos] = useState(ROUTE_COORDS[0]);
  const [routeProgress, setRouteProgress] = useState(0);
  const [eta, setEta] = useState(6);
  const [distance, setDistance] = useState(4.2);
  const [greenSignals, setGreenSignals] = useState([]);
  const [corridorActive, setCorridorActive] = useState(false);
  const animRef = useRef(null);
  const progressRef = useRef(0);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPhase(PHASE.FORM);
      setRouteProgress(0);
      setEta(6);
      setDistance(4.2);
      setGreenSignals([]);
      setCorridorActive(false);
      setAmbulancePos(ROUTE_COORDS[0]);
      progressRef.current = 0;
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen]);

  // Handle form submit → start simulation
  const handleSubmit = (e) => {
    e.preventDefault();
    setPhase(PHASE.FINDING);

    // Phase 1: Finding ambulance (2s)
    setTimeout(() => {
      setPhase(PHASE.ASSIGNED);

      // Phase 2: Assigned (2s) → start tracking
      setTimeout(() => {
        setPhase(PHASE.TRACKING);
        setCorridorActive(true);

        // Activate signals progressively
        TRAFFIC_SIGNALS.forEach((_, i) => {
          setTimeout(() => {
            setGreenSignals((prev) => [...prev, i]);
          }, (i + 1) * 2500);
        });

        // Start ambulance movement animation
        startAmbulanceMovement();
      }, 2500);
    }, 2500);
  };

  const startAmbulanceMovement = () => {
    const totalSteps = ROUTE_COORDS.length - 1;
    const animDuration = 25000; // 25s to complete
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / animDuration);

      // Ease-in-out for natural movement
      const easedT = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

      const exactIndex = easedT * totalSteps;
      const idx = Math.min(Math.floor(exactIndex), totalSteps - 1);
      const frac = exactIndex - idx;

      // Interpolate between route points
      const lat = ROUTE_COORDS[idx][0] + (ROUTE_COORDS[idx + 1][0] - ROUTE_COORDS[idx][0]) * frac;
      const lng = ROUTE_COORDS[idx][1] + (ROUTE_COORDS[idx + 1][1] - ROUTE_COORDS[idx][1]) * frac;

      setAmbulancePos([lat, lng]);
      setRouteProgress(easedT);
      setEta(Math.max(0, Math.round(6 * (1 - easedT))));
      setDistance(Math.max(0, (4.2 * (1 - easedT)).toFixed(1)));
      progressRef.current = easedT;

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase(PHASE.ARRIVED);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  if (!isOpen) return null;

  // Completed corridor portion of route
  const completedRoute = ROUTE_COORDS.slice(0, Math.max(1, Math.ceil(routeProgress * (ROUTE_COORDS.length - 1)) + 1));
  const remainingRoute = ROUTE_COORDS.slice(Math.max(0, Math.ceil(routeProgress * (ROUTE_COORDS.length - 1))));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div style={{
        width: phase === PHASE.TRACKING || phase === PHASE.ARRIVED ? '95vw' : '520px',
        maxHeight: '92vh',
        background: 'linear-gradient(145deg, rgba(15,20,30,0.97), rgba(8,12,20,0.99))',
        borderRadius: '20px',
        border: '1px solid rgba(16,185,129,0.15)',
        boxShadow: '0 0 80px rgba(16,185,129,0.08), 0 30px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        transition: 'width 0.5s ease-in-out',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* ── HEADER ── */}
        <div style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(16,185,129,0.03)',
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
                {phase === PHASE.FORM && 'Request Emergency Ambulance'}
                {phase === PHASE.FINDING && 'AI Dispatch Activating...'}
                {phase === PHASE.ASSIGNED && 'Ambulance Assigned'}
                {phase === PHASE.TRACKING && 'Live Tracking — Green Corridor Active'}
                {phase === PHASE.ARRIVED && '🎉 Ambulance Arrived!'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.7)' }}>
                Dynamic Green Corridor System
              </span>
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

        {/* ── FORM PHASE ── */}
        {phase === PHASE.FORM && (
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Location */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: 14, height: 14, color: '#10b981' }} /> Emergency Location
              </label>
              <input
                type="text" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location..."
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Condition */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone style={{ width: 14, height: 14, color: '#06b6d4' }} /> Contact Number
              </label>
              <input
                type="tel" value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button type="submit" style={{
              padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white', fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 0 30px rgba(16,185,129,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(16,185,129,0.4)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.2)'; }}
            >
              <Zap style={{ width: 20, height: 20 }} /> Request Emergency Dispatch
            </button>
          </form>
        )}

        {/* ── FINDING PHASE ── */}
        {phase === PHASE.FINDING && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              border: '3px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: '#e2e8f0', fontWeight: 600 }}>
              Finding nearest available ambulance...
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
              AI is scanning 12 active units in your area
            </p>
            <div style={{
              marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'center',
            }}>
              {['Scanning GPS...', 'Checking availability...', 'Optimizing route...'].map((t, i) => (
                <span key={i} style={{
                  padding: '6px 14px', borderRadius: '50px', fontSize: '0.75rem',
                  background: 'rgba(16,185,129,0.1)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.15)',
                  animation: `fadeInUp 0.5s ease ${i * 0.3}s both`,
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── ASSIGNED PHASE ── */}
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
              Ambulance Assigned
            </h3>
            <p style={{ fontSize: '1rem', color: '#e2e8f0' }}>
              ETA <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>6 minutes</span>
            </p>
            <div style={{
              marginTop: '24px', padding: '16px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left',
            }}>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>AMBULANCE ID</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600 }}>AMB-404</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>DRIVER</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600 }}>Rajesh Kumar</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>VEHICLE</span><br /><span style={{ color: '#e2e8f0', fontWeight: 600 }}>Force Traveller</span></div>
              <div><span style={{ fontSize: '0.7rem', color: '#64748b' }}>PRIORITY</span><br /><span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 CRITICAL</span></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '16px' }}>
              ⚡ Activating Green Corridor...
            </p>
          </div>
        )}

        {/* ── TRACKING PHASE ── */}
        {(phase === PHASE.TRACKING || phase === PHASE.ARRIVED) && (
          <div style={{ display: 'flex', flex: 1, minHeight: '75vh' }}>
            {/* Map */}
            <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer
                center={[12.9400, 77.6050]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; CARTO'
                />
                <MapFollower position={ambulancePos} />

                {/* Remaining route (dim) */}
                <Polyline positions={remainingRoute} pathOptions={{
                  color: 'rgba(100,116,139,0.4)', weight: 4, dashArray: '8,8',
                }} />

                {/* Completed corridor (glowing green) */}
                {corridorActive && completedRoute.length > 1 && (
                  <>
                    <Polyline positions={completedRoute} pathOptions={{
                      color: '#10b981', weight: 6, opacity: 0.9,
                    }} />
                    <Polyline positions={completedRoute} pathOptions={{
                      color: '#10b981', weight: 16, opacity: 0.15,
                    }} />
                  </>
                )}

                {/* Full route glow */}
                <Polyline positions={ROUTE_COORDS} pathOptions={{
                  color: '#10b981', weight: 20, opacity: 0.05,
                }} />

                {/* Traffic signals */}
                {TRAFFIC_SIGNALS.map((sig, i) => (
                  <CircleMarker
                    key={i} center={sig.pos} radius={8}
                    pathOptions={{
                      color: greenSignals.includes(i) ? '#10b981' : '#ef4444',
                      fillColor: greenSignals.includes(i) ? '#10b981' : '#ef4444',
                      fillOpacity: 0.8, weight: 2,
                    }}
                  >
                    <Popup><b>{sig.name}</b><br />{greenSignals.includes(i) ? '🟢 Green — Corridor Active' : '🔴 Red — Waiting'}</Popup>
                  </CircleMarker>
                ))}

                {/* User marker */}
                <Marker position={USER_LOCATION} icon={createUserIcon()}>
                  <Popup>📍 Emergency Location<br />Silk Board Junction</Popup>
                </Marker>

                {/* Hospital marker */}
                <Marker position={HOSPITAL_LOCATION} icon={createHospitalIcon()}>
                  <Popup>🏥 Destination Hospital<br />Koramangala Medical Center</Popup>
                </Marker>

                {/* Ambulance marker */}
                <Marker position={ambulancePos} icon={createAmbulanceIcon()}>
                  <Popup>🚑 AMB-404<br />Driver: Rajesh Kumar</Popup>
                </Marker>
              </MapContainer>

              {/* Green Corridor overlay badge */}
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
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                    animation: 'pulse-glow 1s ease-in-out infinite',
                  }} />
                </div>
              )}

              {/* Arrived overlay */}
              {phase === PHASE.ARRIVED && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  zIndex: 1000, padding: '30px 50px', borderRadius: '20px',
                  background: 'rgba(10,14,23,0.9)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', color: '#10b981', fontWeight: 700, margin: '0 0 8px' }}>
                    Ambulance Arrived!
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Patient pickup in progress
                  </p>
                </div>
              )}
            </div>

            {/* Right tracking panel */}
            <div style={{
              width: '320px', padding: '20px', overflowY: 'auto',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}>
              {/* ETA card */}
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

              {/* Info grid */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: '14px',
              }}>
                <h4 style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, letterSpacing: '0.1em' }}>AMBULANCE DETAILS</h4>
                {[
                  { label: 'Ambulance ID', value: 'AMB-404', icon: <Ambulance style={{ width: 14, height: 14, color: '#10b981' }} /> },
                  { label: 'Driver', value: 'Rajesh Kumar', icon: <Navigation style={{ width: 14, height: 14, color: '#06b6d4' }} /> },
                  { label: 'Distance', value: `${distance} km`, icon: <MapPin style={{ width: 14, height: 14, color: '#f97316' }} /> },
                  { label: 'Speed', value: '45 km/h', icon: <Activity style={{ width: 14, height: 14, color: '#8b5cf6' }} /> },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Green Corridor signals */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h4 style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px', letterSpacing: '0.1em' }}>
                  CORRIDOR SIGNALS
                </h4>
                {TRAFFIC_SIGNALS.map((sig, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 0', borderBottom: i < TRAFFIC_SIGNALS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: greenSignals.includes(i) ? '#10b981' : '#ef4444',
                      boxShadow: greenSignals.includes(i) ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
                    }} />
                    <span style={{ fontSize: '0.8rem', color: greenSignals.includes(i) ? '#e2e8f0' : '#64748b', flex: 1 }}>
                      {sig.name}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', padding: '2px 8px', borderRadius: '50px',
                      background: greenSignals.includes(i) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: greenSignals.includes(i) ? '#10b981' : '#ef4444',
                    }}>
                      {greenSignals.includes(i) ? 'GREEN' : 'RED'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Route progress */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h4 style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 12px', letterSpacing: '0.1em' }}>
                  ROUTE PROGRESS
                </h4>
                <div style={{
                  height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${routeProgress * 100}%`, height: '100%',
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                    borderRadius: '3px', transition: 'width 0.3s',
                    boxShadow: '0 0 10px rgba(16,185,129,0.4)',
                  }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginTop: '8px',
                  fontSize: '0.7rem', color: '#64748b',
                }}>
                  <span>📍 Pickup</span>
                  <span>{Math.round(routeProgress * 100)}%</span>
                  <span>🏥 Hospital</span>
                </div>
              </div>

              {/* Hospital info */}
              <div style={{
                padding: '16px', borderRadius: '14px',
                background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)',
              }}>
                <h4 style={{ fontSize: '0.75rem', color: '#06b6d4', margin: '0 0 8px', letterSpacing: '0.1em' }}>
                  DESTINATION HOSPITAL
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600, margin: '0 0 4px' }}>
                  Koramangala Medical Center
                </p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Emergency dept notified • Bed ready
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .leaflet-container { background: #0a0e17 !important; }
      `}</style>
    </div>
  );
}
