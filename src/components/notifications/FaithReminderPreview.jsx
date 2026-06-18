import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { GlassSurface } from "../ui/Glass";
import { AppLogo } from "../common/AppLogo";
import { theme } from "../../constants/theme";
import { FAITH_REMINDER_PREVIEWS } from "../../constants/faithNotifications";

export const FaithReminderPreview = ({ items = FAITH_REMINDER_PREVIEWS }) => (
  <>
    {items.map((notification) => (
      <GlassSurface
        key={notification.title}
        style={styles.card}
      >
        <View style={styles.inner}>
          <View style={styles.appIcon}>
            <AppLogo size={28} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.body}>{notification.body}</Text>
          </View>
          <Text style={styles.time}>now</Text>
        </View>
      </GlassSurface>
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.sm,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    marginTop: 2,
  },
  time: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
});
