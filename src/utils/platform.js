// Returns true when running as a native Capacitor APK (Android).
// Returns false when accessed via a web browser (PWA/webapp).
export const isNative = () => !!(window.Capacitor?.isNativePlatform?.())
