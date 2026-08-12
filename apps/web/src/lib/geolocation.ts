export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Este dispositivo no soporta geolocalización."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message || "No se pudo obtener tu ubicación.")),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
