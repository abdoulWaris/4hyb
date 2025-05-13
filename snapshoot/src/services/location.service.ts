import { Preferences } from "@capacitor/preferences";

// Keys for storage
const LOCATION_ENABLED_KEY = "location_enabled";

export interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Mock Geolocation implementation
const Geolocation = {
  checkPermissions: async () => ({
    location: "granted",
  }),
  requestPermissions: async () => ({
    location: "granted",
  }),
  getCurrentPosition: async (options?: any): Promise<Position> => {
    console.warn("Geolocation module not installed, returning mock data");
    return {
      coords: {
        latitude: 48.8584,
        longitude: 2.2945,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
  },
};

/**
 * Check if location services are enabled
 * @returns Promise with boolean indicating if location is enabled
 */
export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    const result = await Preferences.get({ key: LOCATION_ENABLED_KEY });
    return result.value === "true";
  } catch (error) {
    console.error("Error checking location enabled:", error);
    return false;
  }
};

/**
 * Enable or disable location services
 * @param enabled Whether location services should be enabled
 */
export const setLocationEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await Preferences.set({
      key: LOCATION_ENABLED_KEY,
      value: String(enabled),
    });
  } catch (error) {
    console.error("Error setting location enabled:", error);
    throw error;
  }
};

/**
 * Request location permissions from the user
 * @returns Promise with the permission status
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const status = await Geolocation.checkPermissions();

    if (status.location === "granted") {
      return true;
    }

    const requestResult = await Geolocation.requestPermissions();
    return requestResult.location === "granted";
  } catch (error) {
    console.error("Error requesting location permissions:", error);
    return false;
  }
};

/**
 * Get the current location
 * @returns Promise with the location data
 */
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    // Check if location is enabled in app settings
    const enabled = await isLocationEnabled();
    if (!enabled) {
      return null;
    }

    // Check permissions
    const permissionStatus = await Geolocation.checkPermissions();

    if (permissionStatus.location !== "granted") {
      const requestResult = await Geolocation.requestPermissions();
      if (requestResult.location !== "granted") {
        return null;
      }
    }

    // Get current position
    const position: Position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Get a human-readable location name based on coordinates
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns Promise with the location name
 */
export const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Using a mock value to avoid API call in this demo
    return "Lyon, France";
  } catch (error) {
    console.error("Error getting location name:", error);
    return "Unknown location";
  }
};
