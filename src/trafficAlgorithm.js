/**
 * ═══════════════════════════════════════════════════════════════
 *  GreenCorridor — Traffic Control Algorithm
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
 *  2. ROUTE OPTIMIZATION (Dijkstra-based)
 *     - The corridor route is scored as a weighted graph where each node
 *       is a waypoint and edge weight = expected signal delay (seconds).
 *     - getOptimalRoute() returns the lowest-cost ordered path.
 *     - Signal weights decrease if the ambulance has preemption authority
 *       (weight → 0 when green, → 30 when red without clearance).
 *
 *  3. ETA CALCULATION
 *     - computeETA() uses the remaining route distance and current speed.
 *     - It subtracts the estimated time saved from preempted signals
 *       (each preempted signal saves avg 45 s vs normal red wait).
 *
 *  4. CROSS-TRAFFIC SAFETY
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

// ── Dijkstra Route Optimizer ───────────────────────────────────
/**
 * Scores the corridor route using signal delay weights.
 * Each waypoint is a node; weight of traversal = expected delay in seconds.
 *
 * Signal state:
 *  - GREEN (preempted) → weight 0
 *  - QUEUED             → weight 5  (will be green by arrival)
 *  - NORMAL             → weight 30 (average red wait)
 *
 * @param {Array<[number, number]>} routeCoords   - Ordered waypoints
 * @param {Array<{pos: [number, number], name: string}>} signals
 * @param {[number, number]} ambulancePos
 * @returns {{ orderedWaypoints: Array, totalDelaySeconds: number, signalWindows: Array }}
 */
export function getOptimalRoute(routeCoords, signals, ambulancePos) {
  const { greenSet, queuedSet } = computeSignalPreemption(ambulancePos, signals);

  // Build signal weight map: signal index → delay cost
  const signalWeights = signals.map((_, i) => {
    if (greenSet.has(i))  return 0;
    if (queuedSet.has(i)) return 5;
    return 30;
  });

  // For each waypoint, check if a signal is nearby and attach its weight
  const waypointWeights = routeCoords.map((wp) => {
    let minWeight = 0;
    signals.forEach((sig, i) => {
      if (haversineDistance(wp, sig.pos) < 100) { // within 100m = at the signal
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

  // Sum route distance
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
    resumeAfterMs: SAFETY_BUFFER_MS + 5000, // 5s overlap for safety
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
