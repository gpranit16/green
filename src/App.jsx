import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ambulance, BrainCircuit, TrafficCone, Building2 as Hospital, Map as MapIcon, Database, Server, Smartphone, Zap, Activity } from 'lucide-react';

const TOTAL_FRAMES = 80;
const FRAME_PATH = '/frames/Flow_delpmaspu__';

// Preload all frames
function useFrameLoader() {
  const [images, setImages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const imgs = [];
    let loadedCount = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const idx = String(i).padStart(3, '0');
      img.src = `${FRAME_PATH}${idx}.jpg`;
      img.onload = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
        if (loadedCount === TOTAL_FRAMES) {
          setLoaded(true);
        }
      };
      imgs.push(img);
    }
    setImages(imgs);
  }, []);

  return { images, loaded, progress };
}

// Intersection observer hook
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

// Scroll progress hook
function useScrollProgress() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(y);
      setScrollPercent(maxScroll > 0 ? y / maxScroll : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollY, scrollPercent };
}

// ═══════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════
function LoadingScreen({ progress }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0a0e17',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Zap style={{ width: 32, height: 32, color: '#10b981' }} />
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem', color: 'white' }}>
          GreenCorridor
        </span>
      </div>
      <div style={{
        width: '240px', height: '4px', borderRadius: '2px',
        background: 'rgba(255,255,255,0.1)', overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`, height: '100%', borderRadius: '2px',
          background: 'linear-gradient(90deg, #10b981, #06b6d4)',
          transition: 'width 0.2s',
          boxShadow: '0 0 10px rgba(16,185,129,0.4)'
        }} />
      </div>
      <span style={{ color: 'rgba(226,232,240,0.5)', fontSize: '0.875rem', fontFamily: 'Inter' }}>
        Loading cinematic experience... {progress}%
      </span>
    </div>
  );
}

// ═══════════════════════════════
// NAVBAR
// ═══════════════════════════════
function Navbar({ scrollPercent }) {
  return (
    <nav className="navbar" style={{ opacity: scrollPercent > 0.02 ? 1 : 0.8 }}>
      <div className="navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap style={{ width: 22, height: 22, color: '#10b981' }} />
          <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>
            GreenCorridor
          </span>
        </div>
        <div className="nav-links">
          <a href="#animation">Experience</a>
          <a href="#challenge">The Problem</a>
          <a href="#corridor">Solution</a>
          <a href="#impact">Impact</a>
          <a href="#portals">Portals</a>
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════
// HERO SECTION
// ═══════════════════════════════
function HeroSection({ scrollY }) {
  const parallaxY = scrollY * 0.3;
  const scale = 1 + scrollY * 0.0002;
  const opacity = Math.max(0, 1 - scrollY / 700);

  return (
    <section className="scroll-section bg-stars" style={{ minHeight: '110vh' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(16,185,129,0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        textAlign: 'center', maxWidth: '900px', padding: '0 24px',
        transform: `translateY(${-parallaxY}px) scale(${scale})`,
        opacity,
        transition: 'opacity 0.1s'
      }}>
        {/* Badge */}
        <div className="animate-float-slow" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '50px', marginBottom: '28px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          color: '#10b981', fontSize: '0.875rem', fontWeight: 600,
          backdropFilter: 'blur(8px)'
        }}>
          <Activity style={{ width: 16, height: 16 }} className="animate-pulse" />
          Live in Bangalore
        </div>

        {/* Title */}
        <h1 className="hero-title text-glow-strong" style={{
          fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', marginBottom: '24px',
          transform: `perspective(800px) rotateX(${scrollY * 0.01}deg)`
        }}>
          Dynamic Green<br />Corridor System
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle" style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.35rem)', maxWidth: '700px',
          margin: '0 auto 40px', lineHeight: 1.7
        }}>
          AI-powered traffic signal coordination enabling ambulances to reach hospitals faster during critical emergencies.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary">
            <Ambulance style={{ width: 20, height: 20 }} />
            Request Ambulance
          </button>
          <button className="btn-secondary">
            <MapIcon style={{ width: 20, height: 20, color: '#10b981' }} />
            View Live Simulation
          </button>
        </div>
      </div>

      {/* Scroll indicator — fixed to viewport bottom, fades on scroll */}
      {scrollY < 300 && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          opacity: Math.max(0, 0.7 - scrollY / 300), animation: 'float 2s ease-in-out infinite',
          zIndex: 10, pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(226,232,240,0.6)' }}>
            Scroll to Explore
          </span>
          <div style={{
            width: '24px', height: '40px', borderRadius: '12px',
            border: '1.5px solid rgba(255,255,255,0.3)', position: 'relative'
          }}>
            <div style={{
              width: '4px', height: '8px', borderRadius: '2px',
              background: '#10b981', position: 'absolute',
              left: '50%', top: '8px', transform: 'translateX(-50%)',
              animation: 'float 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════
// FRAME ANIMATION SECTION
// ═══════════════════════════════
function FrameAnimationSection({ images, loaded }) {
  const sectionRef = useRef(null);
  const [displayFrame, setDisplayFrame] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!loaded || images.length === 0) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;

      // Show overlay when top has scrolled past viewport top AND bottom is still below viewport top
      const inView = sectionTop <= 0 && sectionBottom > 0;
      setIsInView(inView);

      if (inView) {
        const sectionHeight = sectionRef.current.offsetHeight;
        const scrollInSection = -sectionTop;
        const progress = Math.min(1, Math.max(0, scrollInSection / Math.max(1, sectionHeight)));

        const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)));
        setDisplayFrame(frameIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [loaded, images]);

  const getFrameSrc = (idx) => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, idx));
    return `${FRAME_PATH}${String(clamped).padStart(3, '0')}.jpg`;
  };

  return (
    <>
      {/* Scroll spacer — creates scroll height for the animation */}
      <section
        id="animation"
        ref={sectionRef}
        style={{ height: '400vh', position: 'relative' }}
      />

      {/* Fixed overlay — appears when scrolling through the animation section */}
      {loaded && isInView && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 50,
          background: 'var(--color-bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 40%, var(--color-bg-dark) 100%)',
            zIndex: 2,
          }} />

          {/* Frame image */}
          <img
            src={getFrameSrc(displayFrame)}
            alt={`Ambulance frame ${displayFrame + 1}`}
            style={{
              maxWidth: '90%',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow:
                '0 0 60px rgba(16, 185, 129, 0.1), 0 0 120px rgba(6, 182, 212, 0.05), 0 25px 50px rgba(0, 0, 0, 0.5)',
              objectFit: 'contain',
              zIndex: 1,
            }}
          />
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════
// CHALLENGE SECTION (City)
// ═══════════════════════════════
function ChallengeSection() {
  const [ref, isVisible] = useInView(0.1);

  return (
    <section id="challenge" ref={ref} className="scroll-section bg-grid" style={{ padding: '120px 0', minHeight: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px', alignItems: 'center' }}>

          {/* Text side */}
          <div className={`section-reveal ${isVisible ? 'visible' : ''}`}>
            <h2 style={{
              fontFamily: 'Outfit', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800,
              marginBottom: '24px', lineHeight: 1.15
            }}>
              The Challenge in Cities <br />
              <span className="gradient-text-red">Like Bangalore</span>
            </h2>
            <p style={{
              fontSize: '1.1rem', color: 'rgba(226,232,240,0.6)', lineHeight: 1.8,
              marginBottom: '32px'
            }}>
              Traffic congestion in metropolitan areas is costing lives. Ambulances routinely face delays of 15–30 minutes just navigating through gridlocked intersections, drastically reducing the "golden hour" survival rate for critical patients.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                'Traditional sirens are ineffective in dense traffic.',
                'Manual intervention by traffic police is slow and uncoordinated.',
                'Patients lose critical minutes during the "golden hour".'
              ].map((item, i) => (
                <li key={i} className={`section-reveal stagger-${i + 1} ${isVisible ? 'visible' : ''}`} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  color: 'rgba(226,232,240,0.7)', fontSize: '1rem'
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)'
                  }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Congestion visualization */}
          <div className={`section-reveal stagger-2 ${isVisible ? 'visible' : ''}`}>
            <div className="glass-panel" style={{
              padding: '40px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.05), transparent)',
                pointerEvents: 'none'
              }} />

              {/* Congestion bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[100, 75, 88, 100, 65].map((w, i) => (
                  <div key={i} className="congestion-line" style={{
                    width: `${w}%`, animationDelay: `${i * 0.3}s`
                  }} />
                ))}
              </div>

              {/* Ambulance stuck overlay */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', padding: '16px 24px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#ef4444', 
                  animation: 'pulse-glow 1.5s ease-in-out infinite'
                }} />
                <Ambulance style={{ width: 20, height: 20, color: '#ef4444' }} />
                <span style={{ fontWeight: 700, color: '#fca5a5' }}>Ambulance Delayed — 22 mins</span>
              </div>

              {/* Mini traffic lights showing red */}
              <div style={{
                display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '24px'
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="traffic-light">
                    <div className="traffic-bulb red-active" />
                    <div className="traffic-bulb" />
                    <div className="traffic-bulb" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════
// GREEN CORRIDOR ACTIVATION
// ═══════════════════════════════
function CorridorSection() {
  const [ref, isVisible] = useInView(0.1);
  const sectionRef = useRef(null);
  const [greenCount, setGreenCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, 1 - rect.top / window.innerHeight));
      setGreenCount(Math.floor(progress * 5));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const steps = [
    { icon: Smartphone, label: 'User', sub: 'Requests Help' },
    { icon: Ambulance, label: 'Ambulance', sub: 'Dispatched' },
    { icon: BrainCircuit, label: 'AI Routing', sub: 'Calculates Path' },
    { icon: TrafficCone, label: 'Traffic Control', sub: 'Signals Green' },
    { icon: Hospital, label: 'Hospital', sub: 'Ready for Patient' }
  ];

  return (
    <section id="corridor" ref={(el) => { ref.current = el; sectionRef.current = el; }} className="scroll-section bg-grid" style={{ padding: '120px 0', minHeight: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>

        {/* Title */}
        <div className={`section-reveal ${isVisible ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontFamily: 'Outfit', fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800, marginBottom: '16px'
          }}>
            Green Corridor <span className="gradient-text-emerald">Activation</span>
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.6)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            AI orchestrates seamless signal preemption as the ambulance approaches each intersection.
          </p>
        </div>

        {/* Traffic lights turning green */}
        <div className={`section-reveal stagger-2 ${isVisible ? 'visible' : ''}`} style={{ marginBottom: '80px' }}>
          <div className="glass-panel" style={{ padding: '40px', overflow: 'hidden' }}>
            {/* Road */}
            <div style={{ position: 'relative', height: '80px', marginBottom: '24px' }}>
              {/* Road background */}
              <div style={{
                position: 'absolute', top: '50%', left: '0', right: '0',
                height: '8px', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.06)', borderRadius: '4px'
              }} />
              {/* Green corridor path */}
              <div style={{
                position: 'absolute', top: '50%', left: '0',
                width: `${Math.min(100, greenCount * 22)}%`,
                height: '8px', transform: 'translateY(-50%)',
                borderRadius: '4px', transition: 'width 0.6s ease'
              }} className="corridor-line" />

              {/* Ambulance icon on the path */}
              <div style={{
                position: 'absolute', top: '50%',
                left: `${Math.min(88, greenCount * 20)}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.6s ease',
                background: 'white', borderRadius: '8px',
                padding: '8px', boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                zIndex: 10
              }}>
                <Ambulance style={{ width: 20, height: 20, color: '#ef4444' }} />
              </div>

              {/* Traffic lights along the road */}
              {[20, 40, 60, 80].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '-4px', left: `${pos}%`,
                  transform: 'translateX(-50%)'
                }}>
                  <div className="traffic-light">
                    <div className={`traffic-bulb ${i >= greenCount ? 'red-active' : ''}`} />
                    <div className="traffic-bulb" />
                    <div className={`traffic-bulb ${i < greenCount ? 'green-active' : ''}`} />
                  </div>
                  {i < greenCount && (
                    <div style={{
                      marginTop: '4px', fontSize: '0.6rem', color: '#10b981',
                      textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap'
                    }}>
                      AI Preempted
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Status bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', borderRadius: '12px',
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'rgba(226,232,240,0.7)' }}>
                Ambulance ID: <strong style={{ color: 'white' }}>AMB-404</strong>
              </span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                ETA: 4 mins • Saved: 12 mins
              </span>
            </div>
          </div>
        </div>

        {/* Smart Flow Steps */}
        <div className={`section-reveal stagger-3 ${isVisible ? 'visible' : ''}`}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: '16px', flexWrap: 'wrap', position: 'relative'
          }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: '36px', left: '60px', right: '60px',
              height: '2px', background: 'linear-gradient(90deg, rgba(16,185,129,0.2), rgba(6,182,212,0.3), rgba(16,185,129,0.2))',
              zIndex: 0
            }} />

            {steps.map((step, i) => (
              <div key={i} className="flow-step" style={{ zIndex: 1, flex: '1 1 120px' }}>
                <div className="flow-icon-box">
                  <step.icon style={{ width: 28, height: 28 }} />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem' }}>{step.label}</h3>
                <span style={{ fontSize: '0.75rem', color: 'rgba(226,232,240,0.5)' }}>{step.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════
// IMPACT SECTION
// ═══════════════════════════════
function ImpactSection() {
  const [ref, isVisible] = useInView(0.1);

  const stats = [
    { value: '40%', label: 'Faster Transit', color: '#10b981', desc: 'Reduction in average emergency vehicle travel time.' },
    { value: '100+', label: 'Signals Synced', color: '#06b6d4', desc: 'Traffic intersections communicating with AI routing.' },
    { value: '~15m', label: 'Golden Minutes Saved', color: '#8b5cf6', desc: 'Crucial time reclaimed for patient care.' }
  ];

  const techStack = [
    { icon: Server, name: 'Node.js' },
    { icon: Smartphone, name: 'React' },
    { icon: Database, name: 'MongoDB' },
    { icon: Zap, name: 'WebSockets' },
    { icon: MapIcon, name: 'Google Maps' },
    { icon: BrainCircuit, name: 'TensorFlow' }
  ];

  return (
    <section id="impact" ref={ref} className="scroll-section" style={{ padding: '120px 0', minHeight: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>

        <div className={`section-reveal ${isVisible ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontFamily: 'Outfit', fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800, marginBottom: '16px'
          }}>
            Proven <span className="gradient-text-emerald">Impact</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px', marginBottom: '64px'
        }}>
          {stats.map((stat, i) => (
            <div key={i} className={`stat-card section-reveal stagger-${i + 1} ${isVisible ? 'visible' : ''}`}>
              <div className="stat-number" style={{ color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>
                {stat.label}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(226,232,240,0.5)', lineHeight: 1.6 }}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className={`section-reveal stagger-4 ${isVisible ? 'visible' : ''}`}>
          <div className="glass-panel" style={{
            padding: '32px', display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', gap: '40px', alignItems: 'center'
          }}>
            {techStack.map((tech, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                color: 'rgba(226,232,240,0.5)', transition: 'color 0.3s',
                cursor: 'default'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(226,232,240,0.5)'}
              >
                <tech.icon style={{ width: 20, height: 20 }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════
// PORTALS SECTION
// ═══════════════════════════════
function PortalsSection() {
  const [ref, isVisible] = useInView(0.1);

  const portals = [
    { title: 'User Portal', icon: Smartphone, desc: 'Request emergency vehicles, track arrival time, and provide pre-arrival medical details.', gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
    { title: 'Ambulance Portal', icon: Ambulance, desc: 'Turn-by-turn AI synced navigation, auto-preemption triggers, and hospital communication.', gradient: 'linear-gradient(135deg, #10b981, #06b6d4)' },
    { title: 'Traffic Control Portal', icon: TrafficCone, desc: 'City-wide dashboard to monitor active corridors, override signals, and view analytics.', gradient: 'linear-gradient(135deg, #f97316, #eab308)' },
    { title: 'Hospital Portal', icon: Hospital, desc: 'Live ETA of incoming patients, vital stats relay, and resource management dashboard.', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }
  ];

  return (
    <section id="portals" ref={ref} className="scroll-section" style={{ padding: '120px 0', minHeight: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>

        <div className={`section-reveal ${isVisible ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{
            fontFamily: 'Outfit', fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 800, marginBottom: '16px'
          }}>
            Integrated <span className="gradient-text-emerald">Ecosystem</span>
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.6)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Dedicated interfaces for every stakeholder in the emergency response network.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {portals.map((portal, i) => (
            <div
              key={i}
              className={`portal-card section-reveal stagger-${i + 1} ${isVisible ? 'visible' : ''}`}
              style={{ '--card-accent': portal.gradient.match(/#[a-f0-9]+/i)?.[0] || '#10b981' }}
            >
              <div className="portal-icon-box" style={{ background: portal.gradient }}>
                <portal.icon style={{ width: 26, height: 26 }} />
              </div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.25rem', marginBottom: '12px' }}>
                {portal.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(226,232,240,0.5)', lineHeight: 1.7, marginBottom: '20px' }}>
                {portal.desc}
              </p>
              <span style={{
                fontSize: '0.85rem', fontWeight: 700, color: '#10b981',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                Launch Portal →
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════
// FINALE SECTION
// ═══════════════════════════════
function FinaleSection({ images, loaded }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!loaded || images.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const lastFrame = images[images.length - 1];
    if (lastFrame && lastFrame.complete) {
      canvas.width = lastFrame.naturalWidth;
      canvas.height = lastFrame.naturalHeight;
      ctx.drawImage(lastFrame, 0, 0);
    }
  }, [loaded, images]);

  return (
    <section className="scroll-section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Last frame as background */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', opacity: 0.25, filter: 'blur(4px)'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, var(--color-bg-dark) 20%, transparent 80%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        maxWidth: '700px', padding: '0 24px'
      }}>
        <div className="text-glow-strong" style={{
          fontFamily: 'Outfit', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 800, marginBottom: '20px', lineHeight: 1.15
        }}>
          Every Second <span className="gradient-text-emerald">Counts</span>
        </div>
        <p style={{
          color: 'rgba(226,232,240,0.6)', fontSize: '1.1rem', lineHeight: 1.7,
          marginBottom: '32px'
        }}>
          The Dynamic Green Corridor System ensures that when lives are on the line, technology clears the way.
        </p>
        <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '18px 40px' }}>
          <Zap style={{ width: 22, height: 22 }} />
          Join the Mission
        </button>
      </div>
    </section>
  );
}

// ═══════════════════════════════
// FOOTER
// ═══════════════════════════════
function Footer() {
  return (
    <footer style={{
      padding: '40px 24px', textAlign: 'center',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      color: 'rgba(226,232,240,0.3)', fontSize: '0.85rem',
      fontFamily: 'Inter'
    }}>
      <p>© {new Date().getFullYear()} Dynamic Green Corridor System. Built for Smart City Hackathon.</p>
    </footer>
  );
}

// ═══════════════════════════════
// MAIN APP
// ═══════════════════════════════
export default function App() {
  const { images, loaded, progress } = useFrameLoader();
  const { scrollY, scrollPercent } = useScrollProgress();

  return (
    <>
      {!loaded && <LoadingScreen progress={progress} />}

      {/* Scroll progress bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollPercent * 100}%` }} />

      <Navbar scrollPercent={scrollPercent} />

      <main>
        <HeroSection scrollY={scrollY} />
        <FrameAnimationSection images={images} loaded={loaded} />
        <ChallengeSection />
        <CorridorSection />
        <ImpactSection />
        <PortalsSection />
        <FinaleSection images={images} loaded={loaded} />
      </main>

      <Footer />
    </>
  );
}
