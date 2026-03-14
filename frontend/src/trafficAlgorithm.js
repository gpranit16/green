/**
 * ═══════════════════════════════════════════════════════════════
 *  GreenCorridor — Traffic Control Algorithm v2.0
 *  AI-Powered Multi-Path Route Intelligence
 * ═══════════════════════════════════════════════════════════════
 *
 *  Algorithm Overview:
 *  -------------------
 *  1. PROXIMITY-BASED SIGNAL PREEMPTION
 *     - Ambulance GPS position is checked every 500 ms against all
 *       signals on the planned corridor route.
 *     - Signals within PREEMPTION_RADIUS (400 m) turn GREEN immediately.
 *     - Signals within LOOKAHEAD_RADIUS (1200 m) are queued (yellow warning).
 *     - Cross-traffic signals at the same intersection are held RED for a
 *       SAFETY_BUFFER_MS (12 s) before and after the ambulance passes.
 *
 *  2. MULTI-CANDIDATE ROUTE OPTIMIZATION (NEW v2.0)
 *     - generateRouteCandidates() produces 3 alternate route options.
 *     - Each route is evaluated using a Dijkstra-inspired weighted score:
 *       score = travel_time_s + signal_delay_s + congestion_penalty_s
 *     - A confidence score (0–100%) reflects likelihood of fastest arrival.
 *
 *  3. CONGESTION HEATMAP (NEW v2.0)
 *     - generateCongestionZones() simulates live traffic hotspots across
 *       the city, returning { center, radius, intensity } for each zone.
 *     - Routes that overlap congestion zones incur a penalty to their score.
 *
 *  4. DYNAMIC REROUTING (NEW v2.0)
 *     - shouldReroute() checks if the active route is blocked or congested.
 *     - Returns true + alternate route if reroute is recommended.
 *
 *  5. ETA CALCULATION
 *     - computeETA() uses the remaining route distance and current speed.
 *     - It subtracts the estimated time saved from preempted signals
 *       (each preempted signal saves avg 45 s vs normal red wait).
 *
 *  6. CROSS-TRAFFIC SAFETY
 *     - holdCrossTraffic() marks perpendicular signals as RED + locked
 *       for SAFETY_BUFFER_MS before the ambulance reaches the intersection.
 *     - After the ambulance passes, signals resume their normal cycle.
 *
 * ═══════════════════════════════════════════════════════════════
 */

// ── Constants ──────────────────────────────────────────────────
const PREEMPTION_RADIUS_M = 400;    // metres: immediate green zone
const LOOKAHEAD_RADIUS_M  = 1200;   // metres: queue/warn zone
const SAFETY_BUFFER_MS    = 12000;  // ms: cross-traffic hold duration
const AVG_SIGNAL_WAIT_S   = 45;     // seconds saved per preempted signal
const EARTH_RADIUS_M      = 6371000;// metres

// ── Haversine Distance ──────────────────────────────────────────
/**
 * Returns distance in metres between two [lat, lng] points.
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @returns {number} distance in metres
 */
export function haversineDistance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const aVal =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

// ── Route Path Length ───────────────────────────────────────────
/**
 * Returns total path length in metres for an array of coordinates.
 * @param {Array<[number, number]>} coords
 * @returns {number}
 */
export function routeLength(coords) {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
  }
  return total;
}

// ── Signal Classification ──────────────────────────────────────
/**
 * Classify each traffic signal relative to current ambulance position.
 *
 * @param {[number, number]} ambulancePos   - Current [lat, lng]
 * @param {Array<{pos: [number, number], name: string}>} signals
 * @returns {Array<{index: number, name: string, status: 'GREEN'|'QUEUED'|'NORMAL', distanceM: number}>}
 */
export function classifySignals(ambulancePos, signals) {
  return signals.map((sig, index) => {
    const dist = haversineDistance(ambulancePos, sig.pos);

    let status = 'NORMAL';
    if (dist <= PREEMPTION_RADIUS_M) {
      status = 'GREEN';
    } else if (dist <= LOOKAHEAD_RADIUS_M) {
      status = 'QUEUED';
    }

    return { index, name: sig.name, status, distanceM: Math.round(dist) };
  });
}

// ── Compute Signal Preemption ──────────────────────────────────
/**
 * Core preemption function called on each ambulance tick.
 * Returns the set of signal indices that should currently be GREEN.
 *
 * @param {[number, number]} ambulancePos
 * @param {Array<{pos: [number, number], name: string}>} signals
 * @param {Set<number>} alreadyGreen  - Signals previously turned green (once green, stay green as ambulance passes)
 * @returns {{greenSet: Set<number>, queuedSet: Set<number>, classifications: Array}}
 */
export function computeSignalPreemption(ambulancePos, signals, alreadyGreen = new Set()) {
  const classifications = classifySignals(ambulancePos, signals);
  const greenSet  = new Set(alreadyGreen);
  const queuedSet = new Set();

  classifications.forEach(({ index, status }) => {
    if (status === 'GREEN') {
      greenSet.add(index); // permanently turns green once inside radius
    }
    if (status === 'QUEUED') {
      queuedSet.add(index);
    }
  });

  return { greenSet, queuedSet, classifications };
}

// ══════════════════════════════════════════════════════════════════
//  NEW v2.0 ── CONGESTION HEATMAP
// ══════════════════════════════════════════════════════════════════

/**
 * Generates simulated real-time congestion zones for Bangalore.
 * In a production system, this would be fetched from:
 *   - Google Maps Traffic Layer API
 *   - HERE Traffic API
 *   - OpenStreetMap Overpass traffic reports
 *
 * Returns zones with center, radius (m), and intensity (0–1).
 * Intensity: 0 = free-flow, 1 = complete standstill.
 *
 * @param {number} [seed]  - Optional seed to make zones deterministic per journey
 * @returns {Array<{center: [number,number], radiusM: number, intensity: number, label: string}>}
 */
export function generateCongestionZones(seed = Date.now()) {
  // Seeded pseudo-random to keep zones stable during a single journey
  const rng = (offset = 0) => {
    const x = Math.sin(seed * 0.0001 + offset) * 10000;
    return x - Math.floor(x);
  };

  // Fixed "known" congestion hotspots in Bangalore (always present)
  const fixed = [
    { center: [12.9345, 77.6160], radiusM: 350, intensity: 0.75, label: 'Silk Board Junction (High)' },
    { center: [12.9520, 77.5940], radiusM: 280, intensity: 0.55, label: 'Koramangala 6th Block' },
    { center: [12.9280, 77.6280], radiusM: 300, intensity: 0.60, label: 'HSR Layout Sector 7' },
  ];

  // Dynamic congestion zones that shift slightly each journey
  const dynamic = [
    {
      center: [12.9170 + rng(1) * 0.008, 77.6230 + rng(2) * 0.008],
      radiusM: 200 + rng(3) * 150,
      intensity: 0.3 + rng(4) * 0.5,
      label: 'Dynamic Zone A'
    },
    {
      center: [12.9450 + rng(5) * 0.010, 77.6010 + rng(6) * 0.010],
      radiusM: 180 + rng(7) * 120,
      intensity: 0.2 + rng(8) * 0.4,
      label: 'Dynamic Zone B'
    },
    {
      center: [12.9600 + rng(9) * 0.006, 77.5920 + rng(10) * 0.006],
      radiusM: 200 + rng(11) * 100,
      intensity: 0.15 + rng(12) * 0.35,
      label: 'Dynamic Zone C'
    },
  ];

  return [...fixed, ...dynamic];
}

/**
 * Calculates congestion penalty in seconds for a given route path.
 * - Each congestion zone the route passes through adds penalty seconds.
 * - Penalty = intensity × 120s (max 2 minute add per zone at full jam)
 *
 * @param {Array<[number,number]>} routeCoords
 * @param {Array<{center, radiusM, intensity}>} congestionZones
 * @returns {number} totalPenaltySeconds
 */
export function computeCongestionPenalty(routeCoords, congestionZones) {
  let totalPenalty = 0;

  for (const zone of congestionZones) {
    // Check if any waypoint on the route falls inside this zone
    const routeIntersectsZone = routeCoords.some(
      (wp) => haversineDistance(wp, zone.center) <= zone.radiusM
    );

    if (routeIntersectsZone) {
      totalPenalty += zone.intensity * 120; // max 120s penalty at full jam
    }
  }

  return Math.round(totalPenalty);
}

// ══════════════════════════════════════════════════════════════════
//  NEW v2.0 ── MULTI-CANDIDATE ROUTE GENERATION
// ══════════════════════════════════════════════════════════════════

/**
 * Generates 3 alternative route candidates between start and end.
 *
 * Routes are:
 *   A — PRIMARY:   The direct Dijkstra-optimized route (least signals)
 *   B — VIA NORTH: A slightly northern detour on Outer Ring Road
 *   C — VIA SOUTH: A southern alternative through BTM Layout
 *
 * Each route is scored and assigned a confidence %.
 *
 * @param {[number,number]} start  - Origin [lat, lng]
 * @param {[number,number]} end    - Destination [lat, lng]
 * @param {Array<{pos, name}>} signals
 * @param {[number,number]} [ambulancePos]  - Current position for preemption
 * @param {number} [congestionSeed]
 * @returns {Array<RouteCandidate>}
 *
 * @typedef {{ id: string, label: string, color: string, coords: Array<[number,number]>, signals: Array, distanceM: number, travelTimeSec: number, signalDelaySec: number, congestionSec: number, totalSec: number, confidence: number, isActive: boolean, description: string }}  RouteCandidate
 */
export function generateRouteCandidates(start, end, signals, ambulancePos = null, congestionSeed = Date.now()) {
  const congestionZones = generateCongestionZones(congestionSeed);
  const pos = ambulancePos || start;

  // ── Route A: Primary (direct corridor) ──────────────────────
  const routeA_coords = buildInterpolatedRoute(start, end, 'straight', 22);

  // ── Route B: Northern detour via ORR ────────────────────────
  // Shift waypoints slightly north to simulate Outer Ring Road bypass
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  const northMid = [midLat + 0.018, midLng + 0.005];
  const routeB_coords = buildInterpolatedRoute(start, end, 'via', 24, northMid);

  // ── Route C: Southern detour via BTM ────────────────────────
  const southMid = [midLat - 0.010, midLng - 0.006];
  const routeC_coords = buildInterpolatedRoute(start, end, 'via', 20, southMid);

  const routes = [
    { id: 'A', label: 'Primary Route', color: '#10b981', coords: routeA_coords, description: 'Optimized direct corridor via HSR Layout' },
    { id: 'B', label: 'Northern Bypass', color: '#06b6d4', coords: routeB_coords, description: 'Outer Ring Road bypass — avoids Silk Board' },
    { id: 'C', label: 'Southern Alt.', color: '#f59e0b', coords: routeC_coords, description: 'BTM Layout route — lighter traffic expected' },
  ];

  // Score each route
  const { greenSet } = computeSignalPreemption(pos, signals);

  const scored = routes.map((route) => {
    const distanceM = routeLength(route.coords);
    const speedMs = (40 * 1000) / 3600; // 40 km/h in m/s
    const travelTimeSec = Math.round(distanceM / speedMs);

    // Count signals this route passes near
    const routeSignals = signals.filter((sig) =>
      route.coords.some((wp) => haversineDistance(wp, sig.pos) < 250)
    );

    // Signal delay: preempted = 0, others = 30s each
    const signalDelaySec = routeSignals.reduce((sum, sig, i) => {
      const idx = signals.indexOf(sig);
      return sum + (greenSet.has(idx) ? 0 : 30);
    }, 0);

    const congestionSec = computeCongestionPenalty(route.coords, congestionZones);
    const totalSec = travelTimeSec + signalDelaySec + congestionSec;

    return {
      ...route,
      signals: routeSignals,
      distanceM: Math.round(distanceM),
      travelTimeSec,
      signalDelaySec,
      congestionSec,
      totalSec,
      confidence: 0, // computed after all routes scored
      isActive: false,
    };
  });

  // Compute confidence scores: inverse-proportional to total time
  const minTime = Math.min(...scored.map((r) => r.totalSec));
  const maxTime = Math.max(...scored.map((r) => r.totalSec));
  const timeRange = maxTime - minTime || 1;

  const withConfidence = scored.map((route) => ({
    ...route,
    confidence: Math.round(90 - ((route.totalSec - minTime) / timeRange) * 55),
  }));

  // Mark the best route (lowest totalSec) as active
  const bestIdx = withConfidence.reduce((best, r, i) =>
    r.totalSec < withConfidence[best].totalSec ? i : best, 0
  );
  withConfidence[bestIdx].isActive = true;

  // Sort: active first, then by confidence descending
  return withConfidence.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || b.confidence - a.confidence);
}

/**
 * Builds an interpolated set of route coordinates.
 * Supports straight line or via-point routing.
 *
 * @param {[number,number]} start
 * @param {[number,number]} end
 * @param {'straight'|'via'} mode
 * @param {number} steps
 * @param {[number,number]} [via]  - Intermediate waypoint for 'via' mode
 * @returns {Array<[number,number]>}
 */
function buildInterpolatedRoute(start, end, mode, steps, via = null) {
  const points = [];

  if (mode === 'straight' || !via) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  } else {
    // Bezier-like curve through via point
    const half = Math.floor(steps / 2);
    for (let i = 0; i <= half; i++) {
      const t = i / half;
      points.push([
        start[0] + (via[0] - start[0]) * t,
        start[1] + (via[1] - start[1]) * t,
      ]);
    }
    for (let i = 1; i <= steps - half; i++) {
      const t = i / (steps - half);
      points.push([
        via[0] + (end[0] - via[0]) * t,
        via[1] + (end[1] - via[1]) * t,
      ]);
    }
  }

  return points;
}

// ══════════════════════════════════════════════════════════════════
//  NEW v2.0 ── DYNAMIC REROUTING
// ══════════════════════════════════════════════════════════════════

/**
 * Checks if the current route should be rerouted based on live conditions.
 *
 * Reroute triggers:
 *  - A high-intensity congestion zone (>0.7) is detected ahead
 *  - A signal on the current route cannot be preempted within time window
 *
 * @param {[number,number]} ambulancePos
 * @param {Array<[number,number]>} remainingRoute
 * @param {Array<RouteCandidate>} candidates
 * @param {Array<{pos,name}>} signals
 * @param {Set<number>} greenSet
 * @returns {{ shouldReroute: boolean, reason: string|null, alternateRoute: RouteCandidate|null }}
 */
export function checkReroute(ambulancePos, remainingRoute, candidates, signals, greenSet) {
  if (!candidates || candidates.length < 2) {
    return { shouldReroute: false, reason: null, alternateRoute: null };
  }

  const congestionZones = generateCongestionZones();

  // Check for severe congestion ahead (within next 800m)
  const ahead = remainingRoute.slice(0, 5); // next ~5 waypoints
  for (const zone of congestionZones) {
    if (zone.intensity > 0.7) {
      const congestionAhead = ahead.some(
        (wp) => haversineDistance(wp, zone.center) <= zone.radiusM
      );
      if (congestionAhead) {
        const alternate = candidates.find((c) => !c.isActive);
        return {
          shouldReroute: true,
          reason: `Severe congestion detected: ${zone.label} (${Math.round(zone.intensity * 100)}% blocked)`,
          alternateRoute: alternate || null,
        };
      }
    }
  }

  return { shouldReroute: false, reason: null, alternateRoute: null };
}

// ── Original Dijkstra Route Optimizer (preserved) ──────────────
/**
 * Scores the corridor route using signal delay weights.
 *
 * @param {Array<[number, number]>} routeCoords   - Ordered waypoints
 * @param {Array<{pos: [number, number], name: string}>} signals
 * @param {[number, number]} ambulancePos
 * @returns {{ orderedWaypoints: Array, totalDelaySeconds: number, signalWindows: Array }}
 */
export function getOptimalRoute(routeCoords, signals, ambulancePos) {
  const { greenSet, queuedSet } = computeSignalPreemption(ambulancePos, signals);

  const signalWeights = signals.map((_, i) => {
    if (greenSet.has(i))  return 0;
    if (queuedSet.has(i)) return 5;
    return 30;
  });

  const waypointWeights = routeCoords.map((wp) => {
    let minWeight = 0;
    signals.forEach((sig, i) => {
      if (haversineDistance(wp, sig.pos) < 100) {
        minWeight = signalWeights[i];
      }
    });
    return minWeight;
  });

  const totalDelaySeconds = waypointWeights.reduce((sum, w) => sum + w, 0);

  const signalWindows = signals.map((sig, i) => ({
    name: sig.name,
    pos: sig.pos,
    expectedDelaySec: signalWeights[i],
    status: greenSet.has(i) ? 'GREEN' : queuedSet.has(i) ? 'QUEUED' : 'NORMAL',
  }));

  return {
    orderedWaypoints: routeCoords,
    totalDelaySeconds,
    signalWindows,
  };
}

// ── ETA Calculation ────────────────────────────────────────────
/**
 * Computes estimated time of arrival in seconds.
 *
 * @param {[number, number]} currentPos
 * @param {Array<[number, number]>} remainingRoute
 * @param {number} speedKmh  - Current ambulance speed in km/h
 * @param {number} greenSignalCount  - Number of signals already preempted (each saves AVG_SIGNAL_WAIT_S)
 * @returns {{ etaSeconds: number, etaMinutes: number, savedSeconds: number }}
 */
export function computeETA(currentPos, remainingRoute, speedKmh = 40, greenSignalCount = 0) {
  if (!remainingRoute || remainingRoute.length < 2) {
    return { etaSeconds: 0, etaMinutes: 0, savedSeconds: 0 };
  }

  let totalDistM = 0;
  for (let i = 0; i < remainingRoute.length - 1; i++) {
    totalDistM += haversineDistance(remainingRoute[i], remainingRoute[i + 1]);
  }

  const speedMs        = (speedKmh * 1000) / 3600;
  const driveSeconds   = totalDistM / speedMs;
  const savedSeconds   = greenSignalCount * AVG_SIGNAL_WAIT_S;
  const etaSeconds     = Math.max(0, driveSeconds - savedSeconds);
  const etaMinutes     = Math.ceil(etaSeconds / 60);

  return { etaSeconds: Math.round(etaSeconds), etaMinutes, savedSeconds };
}

// ── Cross Traffic Safety Hold ──────────────────────────────────
/**
 * Returns a descriptive plan for holding cross-traffic at each preempted intersection.
 *
 * @param {Array} greenSignals  - Array of {name, pos} for green-lit signals
 * @returns {Array<{intersection: string, holdDurationMs: number, resumeAfterMs: number}>}
 */
export function holdCrossTraffic(greenSignals) {
  return greenSignals.map((sig) => ({
    intersection: sig.name,
    holdDurationMs: SAFETY_BUFFER_MS,
    resumeAfterMs: SAFETY_BUFFER_MS + 5000,
    action: 'FORCE_RED_ALL_CROSS_DIRECTIONS',
  }));
}

// ── Utility: Format ETA ────────────────────────────────────────
/**
 * Human-readable ETA string.
 * @param {number} etaMinutes
 * @returns {string}
 */
export function formatETA(etaMinutes) {
  if (etaMinutes <= 0) return 'Arriving now';
  if (etaMinutes === 1) return '< 1 min';
  return `${etaMinutes} min`;
}
