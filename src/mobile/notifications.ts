import { LocalNotifications } from "@capacitor/local-notifications";
import { isNativeMobile } from "./storage";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeMobile()) return false;
  try {
    const status = await LocalNotifications.requestPermissions();
    return status.display === "granted";
  } catch {
    return false;
  }
}

export async function sendMobileNotification(title: string, body: string): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: new Date(Date.now() + 100) },
          sound: "beep.wav",
        },
      ],
    });
  } catch {
    /* ignored */
  }
}
