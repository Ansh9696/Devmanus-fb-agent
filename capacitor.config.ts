import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.devmanus.autoposter",
  appName: "Devmanus FB Auto-Poster",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#10B981",
      sound: "beep.wav",
    },
  },
};

export default config;
