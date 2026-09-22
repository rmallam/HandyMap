import { Job, OptimizedRoute, RouteStop } from '../types';
import { calculateDistanceKm } from '../utils/helpers';

interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    geometry: {
      coordinates: [number, number][]; // [lon, lat]
    };
    distance: number; // meters
    duration: number; // seconds
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

/**
 * Solve Traveling Salesperson Problem (TSP) using Nearest Neighbor + 2-Opt
 */
export function optimizeStopSequence(
  startCoordinates: [number, number],
  jobs: Job[]
): Job[] {
  if (jobs.length <= 1) return [...jobs];

  const unvisited = [...jobs];
  const ordered: Job[] = [];
  let currentLoc = startCoordinates;

  // 1. Nearest Neighbor Heuristic
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistanceKm(
        currentLoc[0],
        currentLoc[1],
        unvisited[i].coordinates[0],
        unvisited[i].coordinates[1]
      );
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    const nextStop = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextStop);
    currentLoc = nextStop.coordinates;
  }

  // 2. 2-Opt Heuristic to eliminate cross-overs (if jobs >= 4)
  if (ordered.length >= 4) {
    let improved = true;
    let iterations = 0;
    const maxIterations = 50;

    const totalPathDist = (path: Job[]) => {
      let d = calculateDistanceKm(
        startCoordinates[0],
        startCoordinates[1],
        path[0].coordinates[0],
        path[0].coordinates[1]
      );
      for (let i = 0; i < path.length - 1; i++) {
        d += calculateDistanceKm(
          path[i].coordinates[0],
          path[i].coordinates[1],
          path[i + 1].coordinates[0],
          path[i + 1].coordinates[1]
        );
      }
      return d;
    };

    let bestDist = totalPathDist(ordered);

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < ordered.length - 1; i++) {
        for (let k = i + 1; k < ordered.length; k++) {
          // 2-opt swap
          const newRoute = [
            ...ordered.slice(0, i),
            ...ordered.slice(i, k + 1).reverse(),
            ...ordered.slice(k + 1)
          ];
          const newDist = totalPathDist(newRoute);
          if (newDist < bestDist - 0.05) {
            ordered.splice(0, ordered.length, ...newRoute);
            bestDist = newDist;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
  }

  return ordered;
}

/**
 * Fetch real-world road route from OSRM or fallback to direct calculation
 */
export async function calculateOptimizedRoute(
  startLocation: { name: string; coordinates: [number, number] },
  jobs: Job[],
  filterType: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all' = 'quotes_only',
  startTime?: Date
): Promise<OptimizedRoute> {
  if (jobs.length === 0) {
    return {
      id: `route-${Date.now()}`,
      startLocation,
      stops: [],
      totalDistanceKm: 0,
      totalDurationMin: 0,
      polylineCoordinates: [startLocation.coordinates],
      generatedAt: new Date().toISOString(),
      filterUsed: filterType
    };
  }

  // 1. Order stops optimally
  const orderedJobs = optimizeStopSequence(startLocation.coordinates, jobs);

  // 2. Build coordinates for routing: [lon, lat]
  const allPoints: [number, number][] = [
    startLocation.coordinates,
    ...orderedJobs.map(j => j.coordinates)
  ];

  // Try fetching real road geometry from OSRM
  let polylineCoords: [number, number][] = [];
  let legDistances: number[] = [];
  let legDurations: number[] = [];
  let totalDistKm = 0;
  let totalDurMin = 0;

  try {
    const osrmCoordsString = allPoints
      .map(([lat, lon]) => `${lon},${lat}`)
      .join(';');

    const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoordsString}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if (response.ok) {
      const data: OSRMRouteResponse = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM coordinates are [lon, lat] -> convert to [lat, lon]
        polylineCoords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
        totalDistKm = Math.round((route.distance / 1000) * 10) / 10;
        totalDurMin = Math.round(route.duration / 60);

        if (route.legs) {
          legDistances = route.legs.map(l => Math.round((l.distance / 1000) * 10) / 10);
          legDurations = route.legs.map(l => Math.round(l.duration / 60));
        }
      }
    }
  } catch {
    // If offline or network error, fallback gracefully to straight line interpolation
  }

  // Fallback calculation if OSRM was unavailable
  if (polylineCoords.length === 0) {
    polylineCoords = [...allPoints];
    legDistances = [];
    legDurations = [];
    totalDistKm = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const dist = calculateDistanceKm(
        allPoints[i][0],
        allPoints[i][1],
        allPoints[i + 1][0],
        allPoints[i + 1][1]
      );
      // Multiply straight-line distance by 1.3 to approximate actual road network distance
      const roadDist = Math.round(dist * 1.3 * 10) / 10;
      // Assume average city driving speed of 35 km/h + traffic
      const durationMin = Math.max(5, Math.round((roadDist / 35) * 60));

      legDistances.push(roadDist);
      legDurations.push(durationMin);
      totalDistKm += roadDist;
      totalDurMin += durationMin;
    }
  }

  // 3. Build scheduled RouteStop array with realistic ETAs
  let currentTime = startTime ? new Date(startTime) : new Date();
  
  // If current time is past 6pm, default itinerary start to 8:30am today/tomorrow
  if (currentTime.getHours() >= 18 || currentTime.getHours() < 7) {
    currentTime.setHours(8, 30, 0, 0);
  }

  const stops: RouteStop[] = orderedJobs.map((job, idx) => {
    const driveDurationMin = legDurations[idx] || 15;
    const driveDistanceKm = legDistances[idx] || 5;

    // Add driving time to arrive
    currentTime = new Date(currentTime.getTime() + driveDurationMin * 60 * 1000);
    const etaFormatted = currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Add estimated stay duration on-site (quote visit ~35-45m, repair ~60-120m)
    const onSiteStayMinutes = job.estimatedDurationMinutes || 45;
    currentTime = new Date(currentTime.getTime() + onSiteStayMinutes * 60 * 1000);

    return {
      id: `stop-${idx + 1}-${job.id}`,
      job,
      stopOrder: idx + 1,
      eta: etaFormatted,
      distanceFromPrevKm: driveDistanceKm,
      durationFromPrevMin: driveDurationMin,
      isCompleted: false
    };
  });

  return {
    id: `route-${Date.now()}`,
    startLocation,
    stops,
    totalDistanceKm: Math.round(totalDistKm * 10) / 10,
    totalDurationMin: totalDurMin,
    polylineCoordinates: polylineCoords,
    generatedAt: new Date().toISOString(),
    filterUsed: filterType
  };
}
