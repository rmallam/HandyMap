import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

export const isNativePlatform = Capacitor.isNativePlatform();
export const currentPlatform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'

/**
 * Initialize native device settings (Status Bar, Hardware Back Button, Notification Channels)
 */
export async function initNativeDevice(onBackButton?: () => void): Promise<void> {
  if (!isNativePlatform) return;

  try {
    // 1. Configure native Status Bar
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Dark });
      if (currentPlatform === 'android') {
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    }

    // 2. Android Hardware Back Button listener
    if (Capacitor.isPluginAvailable('App') && onBackButton) {
      App.addListener('backButton', () => {
        onBackButton();
      });
    }

    // 3. Register Native Notification Channel for Android
    if (Capacitor.isPluginAvailable('LocalNotifications') && currentPlatform === 'android') {
      await LocalNotifications.createChannel({
        id: 'handymap_digest',
        name: 'Daily Job Alerts & Route Reminders',
        description: 'Morning digest and urgent customer leads',
        importance: 5,
        visibility: 1,
        vibration: true
      });
    }
  } catch (err) {
    console.warn('Native device init error:', err);
  }
}

/**
 * High-accuracy device GPS tracking using native hardware GPS on iOS/Android
 */
export async function getNativeCurrentPosition(): Promise<[number, number] | null> {
  if (isNativePlatform && Capacitor.isPluginAvailable('Geolocation')) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') return null;
      }
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      });
      return [position.coords.latitude, position.coords.longitude];
    } catch (err) {
      console.warn('Native GPS error, falling back to browser:', err);
    }
  }

  // Fallback to browser Geolocation
  if ('geolocation' in navigator) {
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve([pos.coords.latitude, pos.coords.longitude]),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  return null;
}

/**
 * Tactile Haptic Vibration feedback (Light, Medium, Heavy, Success, Warning)
 */
export async function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light'): Promise<void> {
  if (!isNativePlatform || !Capacitor.isPluginAvailable('Haptics')) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
    }
  } catch (err) {
    console.warn('Haptic trigger error:', err);
  }
}

/**
 * Native push / local notification dispatch for Morning Daily Digest & Urgent Reminders
 */
export async function scheduleNativeNotification(
  title: string,
  body: string,
  id: number = Math.floor(Math.random() * 100000),
  atDate?: Date
): Promise<boolean> {
  if (isNativePlatform && Capacitor.isPluginAvailable('LocalNotifications')) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return false;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: atDate ? { at: atDate } : undefined,
            channelId: 'handymap_digest',
            smallIcon: 'ic_stat_notification',
            iconColor: '#2563eb'
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('Native LocalNotification error:', err);
    }
  }

  // Fallback to Web Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
    return true;
  }

  return false;
}

/**
 * Native OS Share sheet (e.g. AirDrop, WhatsApp, Mail, Messages)
 */
export async function nativeShare(title: string, text: string, url?: string): Promise<boolean> {
  if (isNativePlatform && Capacitor.isPluginAvailable('Share')) {
    try {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share with Client / Contractor'
      });
      return true;
    } catch (err) {
      console.warn('Native share error:', err);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User cancelled
    }
  }

  return false;
}
