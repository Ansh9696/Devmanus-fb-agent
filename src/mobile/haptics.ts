import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativeMobile } from "./storage";

export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await Haptics.impact({ style });
  } catch {
    /* ignored on unsupported devices */
  }
}

export async function triggerHapticNotification(type: NotificationType = NotificationType.Success): Promise<void> {
  if (!isNativeMobile()) return;
  try {
    await Haptics.notification({ type });
  } catch {
    /* ignored */
  }
}
