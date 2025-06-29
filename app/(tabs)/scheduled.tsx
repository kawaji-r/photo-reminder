import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { PhotoReminder } from "./index";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ScheduledScreen() {
  const { t, formatString } = useLanguage();
  const [reminders, setReminders] = useState<PhotoReminder[]>([]);

  const loadReminders = useCallback(async () => {
    try {
      const remindersJson = await AsyncStorage.getItem("photoReminders");
      if (remindersJson) {
        const parsedReminders: PhotoReminder[] = JSON.parse(remindersJson);

        // Convert string dates back to Date objects
        const processedReminders = parsedReminders.map((reminder) => ({
          ...reminder,
          startTime: new Date(reminder.startTime),
        }));

        // Filter out reminders that have already ended
        const currentTime = new Date();
        const activeReminders = processedReminders.filter((reminder) => {
          const endTime = new Date(reminder.startTime);
          endTime.setMinutes(endTime.getMinutes() + reminder.duration);
          return endTime > currentTime;
        });

        setReminders(activeReminders);
      }
    } catch (error) {
      console.error("Failed to load reminders:", error);
      Alert.alert(t("error"), t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const deleteReminder = async (reminder: PhotoReminder) => {
    try {
      // Cancel all notifications for this reminder
      for (const id of reminder.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      // Remove from state
      const updatedReminders = reminders.filter((r) => r.id !== reminder.id);
      setReminders(updatedReminders);

      // Save to storage
      await AsyncStorage.setItem(
        "photoReminders",
        JSON.stringify(updatedReminders)
      );
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      Alert.alert(t("error"), t("deleteError"));
    }
  };

  const confirmDelete = (reminder: PhotoReminder) => {
    Alert.alert(
      t("deleteReminder"),
      t("deleteConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => deleteReminder(reminder),
        },
      ]
    );
  };

  const renderReminderItem = ({ item }: { item: PhotoReminder }) => {
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    };

    const startTimeStr = formatDateTime(item.startTime);
    const endTime = new Date(item.startTime);
    endTime.setMinutes(endTime.getMinutes() + item.duration);
    const endTimeStr = formatDateTime(endTime);

    return (
      <TouchableOpacity
        style={styles.reminderItem}
        onLongPress={() => confirmDelete(item)}
      >
        <ThemedText type="defaultSemiBold" style={styles.reminderTime}>
          {startTimeStr}
          {"\n"}〜 {endTimeStr}
        </ThemedText>
        {item.reminderTitle ? (
          <ThemedText style={styles.reminderTitle}>{item.reminderTitle}</ThemedText>
        ) : null}
        {item.reminderContent ? (
          <ThemedText style={styles.reminderContent}>{item.reminderContent}</ThemedText>
        ) : null}
        <ThemedText>{formatString(t("totalDurationDisplay"), item.duration.toString())}</ThemedText>
        <ThemedText>{formatString(t("intervalDisplay"), item.interval.toString())}</ThemedText>
        <ThemedText style={styles.deleteHint}>{t("deleteHint")}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        {t("scheduledReminders")}
      </ThemedText>

      {reminders.length === 0 ? (
        <ThemedText style={styles.emptyMessage}>
          {t("noReminders")}
        </ThemedText>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderReminderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginTop: 60,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  reminderItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  reminderTime: {
    fontSize: 18,
    marginBottom: 5,
  },
  emptyMessage: {
    textAlign: "center",
    marginTop: 40,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  reminderContent: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteHint: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "right",
  },
});
