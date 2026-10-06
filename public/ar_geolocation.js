import {
  reportGeolocationError,
  reportGeolocationSample,
  reportGeolocationStatus,
} from "./ar_diagnostics.js";

// Tuning values for initial GPS localization. GPS is stopped after a fix is
// selected and is never used to move the scene during the XR session.
export const GPS_LOCALIZATION_CONFIG = Object.freeze({
  targetAccuracyMeters: 15,
  maximumAccuracyMeters: 35,
  stableClusterRadiusMeters: 12,
  requiredStableSamples: 4,
  maximumWaitMs: 18000,
  maximumAgeMs: 1500,
});

let activeWatchId = null;
let activeTimeoutId = null;

function stopWatch() {
  if (activeWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
  }
  activeWatchId = null;

  if (activeTimeoutId !== null) {
    window.clearTimeout(activeTimeoutId);
  }
  activeTimeoutId = null;
}

function distanceMeters(first, second) {
  const meanLatitude = ((first.latitude + second.latitude) / 2) * Math.PI / 180;
  const northMeters = (first.latitude - second.latitude) * 111320;
  const eastMeters =
    (first.longitude - second.longitude) * 111320 * Math.cos(meanLatitude);
  return Math.hypot(northMeters, eastMeters);
}

function bestConsistentCluster(samples) {
  let bestCluster = [];

  for (const pivot of samples) {
    const cluster = samples.filter(
      (sample) =>
        distanceMeters(sample, pivot) <=
        GPS_LOCALIZATION_CONFIG.stableClusterRadiusMeters,
    );

    if (
      cluster.length > bestCluster.length ||
      (cluster.length === bestCluster.length &&
        cluster.reduce((sum, sample) => sum + sample.accuracy, 0) <
          bestCluster.reduce((sum, sample) => sum + sample.accuracy, 0))
    ) {
      bestCluster = cluster;
    }
  }

  return bestCluster;
}

function weightedLocation(samples) {
  const weights = samples.map((sample) => 1 / Math.max(sample.accuracy, 1) ** 2);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const latitude = samples.reduce(
    (sum, sample, index) => sum + sample.latitude * weights[index],
    0,
  ) / totalWeight;
  const longitude = samples.reduce(
    (sum, sample, index) => sum + sample.longitude * weights[index],
    0,
  ) / totalWeight;
  const spreadMeters = Math.max(
    ...samples.map((sample) =>
      distanceMeters(sample, { latitude, longitude }),
    ),
  );
  const accuracy = Math.sqrt(1 / totalWeight);

  return { latitude, longitude, accuracy, spreadMeters };
}

function makeLocation(samples, cluster, source) {
  const selectedSamples = cluster.length ? cluster : samples;
  const estimate = weightedLocation(selectedSamples);
  const newestSample = selectedSamples.reduce((newest, sample) =>
    sample.timestamp > newest.timestamp ? sample : newest,
  );

  return {
    // Keep the existing five-decimal origin precision used by the app.
    latitude: Number(estimate.latitude.toFixed(5)),
    longitude: Number(estimate.longitude.toFixed(5)),
    accuracy: estimate.accuracy,
    timestamp: newestSample.timestamp,
    sampleCount: selectedSamples.length,
    spreadMeters: estimate.spreadMeters,
    source,
    status: source === "stable cluster" ? "STABLE" : "APPROXIMATE",
  };
}

export function acquireStableLocation(onStatus = () => {}) {
  stopWatch();

  if (!navigator.geolocation) {
    const error = new Error("Geolocation API is unavailable");
    reportGeolocationError(error);
    reportGeolocationStatus("UNAVAILABLE");
    onStatus({ status: "UNAVAILABLE", goodSampleCount: 0 });
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    const samples = [];
    const observations = [];
    let settled = false;

    const settle = (location) => {
      if (settled) return;
      settled = true;
      stopWatch();
      reportGeolocationStatus(location.status, location);
      onStatus({ status: location.status, location });
      resolve(location);
    };

    const fail = (error) => {
      if (settled) return;
      settled = true;
      stopWatch();
      reportGeolocationStatus("ERROR");
      reportGeolocationError(error);
      onStatus({ status: "ERROR", error });
      reject(error);
    };

    reportGeolocationStatus("ACQUIRING");
    onStatus({ status: "ACQUIRING", goodSampleCount: 0 });

    try {
      activeWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = position.coords;
          const accuracy = Number(coords.accuracy);
          const latitude = Number(coords.latitude);
          const longitude = Number(coords.longitude);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(accuracy) ||
            accuracy <= 0
          ) {
            return;
          }

          const sample = {
            latitude,
            longitude,
            accuracy,
            timestamp: Number(position.timestamp) || Date.now(),
          };

          observations.push(sample);
          observations.splice(0, Math.max(0, observations.length - 12));

          if (accuracy <= GPS_LOCALIZATION_CONFIG.maximumAccuracyMeters) {
            samples.push(sample);
            // Bound memory and make the consistency window recent.
            samples.splice(0, Math.max(0, samples.length - 12));
          }

          const cluster = bestConsistentCluster(samples);
          const preview = cluster.length
            ? weightedLocation(cluster)
            : null;
          reportGeolocationSample({
            accuracy,
            sampleCount: samples.length,
            spreadMeters: preview ? preview.spreadMeters : null,
          });
          onStatus({
            status: "ACQUIRING",
            goodSampleCount: cluster.length,
            sampleCount: samples.length,
            accuracy,
            spreadMeters: preview ? preview.spreadMeters : null,
          });

          if (
            cluster.length >=
              GPS_LOCALIZATION_CONFIG.requiredStableSamples &&
            preview.accuracy <=
              GPS_LOCALIZATION_CONFIG.targetAccuracyMeters &&
            preview.spreadMeters <=
              GPS_LOCALIZATION_CONFIG.stableClusterRadiusMeters
          ) {
            settle(makeLocation(samples, cluster, "stable cluster"));
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            fail(error);
          } else {
            reportGeolocationError(error);
            onStatus({
              status: "ACQUIRING",
              goodSampleCount: samples.length,
              warning: error.message,
            });
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: GPS_LOCALIZATION_CONFIG.maximumAgeMs,
          timeout: GPS_LOCALIZATION_CONFIG.maximumWaitMs,
        },
      );
    } catch (error) {
      fail(error);
      return;
    }

    activeTimeoutId = window.setTimeout(() => {
      if (!observations.length) {
        fail(new Error("No usable GPS fix received before timeout"));
        return;
      }

      const cluster = bestConsistentCluster(samples);
      const usableCluster = cluster.length
        ? cluster
        : [observations.reduce((best, sample) =>
            sample.accuracy < best.accuracy ? sample : best,
          )];
      const approximate = makeLocation(observations, usableCluster, "timeout fallback");
      settle(approximate);
    }, GPS_LOCALIZATION_CONFIG.maximumWaitMs);
  });
}

