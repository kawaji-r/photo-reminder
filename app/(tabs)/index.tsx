import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Button,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { useLanguage } from "@/app/context/LanguageContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

// Set the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define the reminder type
export type PhotoReminder = {
  id: string;
  startTime: Date;
  duration: number; // in minutes
  interval: number; // in minutes
  notificationIds: string[];
  reminderTitle?: string;
  reminderContent?: string;
};

const formatTime = (date: Date) => {
  if (Platform.OS === "android") {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // iOS uses different locales
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }
};

export default function IndexScreen() {
  const { language, setLanguage, t, formatString } = useLanguage();
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState("30");
  const [interval, setInterval] = useState("5");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderContent, setReminderContent] = useState("");
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'jp' : 'en');
  };

  // Request permissions on app start
  useEffect(() => {
    async function requestPermissions() {
      const { status: notificationStatus } =
        await Notifications.requestPermissionsAsync();
      if (notificationStatus !== "granted") {
        Alert.alert(
          t("notificationPermissionRequired"),
          t("permissionMessage")
        );
      }
    }

    requestPermissions();
  }, [t]);

  const schedulePhotoReminders = async () => {
    // Validate inputs
    const durationMinutes = parseInt(duration);
    const intervalMinutes = parseInt(interval);

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      Alert.alert(t("error"), t("validDurationError"));
      return;
    }

    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      Alert.alert(t("error"), t("validIntervalError"));
      return;
    }

    if (intervalMinutes > durationMinutes) {
      Alert.alert(t("error"), t("intervalShorterError"));
      return;
    }

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Calculate how many notifications to schedule
    const notificationCount = Math.floor(durationMinutes / intervalMinutes);
    const notificationIds: string[] = [];

    // Schedule notifications
    for (let i = 0; i < notificationCount; i++) {
      const notificationTime = new Date(startTime);
      notificationTime.setMinutes(
        notificationTime.getMinutes() + i * intervalMinutes
      );

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderTitle || (language === 'en' ? "Time to take photos!" : "写真を撮る時間です！"),
          body: reminderContent || (language === 'en' ? "Don't forget to capture the moment!" : "忘れずに想い出を残しましょう！"),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });

      notificationIds.push(id);
    }

    // Save the reminder to storage
    const reminder: PhotoReminder = {
      id: Date.now().toString(),
      startTime: new Date(startTime),
      duration: durationMinutes,
      interval: intervalMinutes,
      notificationIds,
      reminderTitle: reminderTitle,
      reminderContent: reminderContent,
    };

    try {
      // Get existing reminders
      const existingRemindersJson = await AsyncStorage.getItem("photoReminders");
      const existingReminders: PhotoReminder[] = existingRemindersJson
        ? JSON.parse(existingRemindersJson)
        : [];

      // Add new reminder
      const updatedReminders = [...existingReminders, reminder];

      // Save back to storage
      await AsyncStorage.setItem(
        "photoReminders",
        JSON.stringify(updatedReminders)
      );

      Alert.alert(
        t("setupComplete"),
        formatString(
          t("setupMessage"),
          intervalMinutes.toString(),
          durationMinutes.toString(),
          startTime.toLocaleDateString(),
          formatTime(startTime)
        )
      );
    } catch (error) {
      console.error("Failed to save reminder:", error);
      Alert.alert(t("error"), t("saveError"));
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  // Get theme colors
  const backgroundColor = useThemeColor(
    { light: "rgba(255,255,255,0.9)", dark: "rgba(30,30,30,0.9)" },
    "background"
  );
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({ light: "#ddd", dark: "#333" }, "border");
  const placeholderColor = useThemeColor({ light: "#aaa", dark: "#666" }, "text");

  // Create dynamic styles
  const dynamicStyles = {
    input: {
      backgroundColor,
      color: textColor,
      borderColor,
    },
    dateTimeButton: {
      backgroundColor,
      borderColor,
    },
  };

  return (
    <ThemedView style={staticStyles.container}>
      {/* キーボードが画面を隠す問題を解消 */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={staticStyles.scrollContent}
          keyboardShouldPersistTaps="never"
        >
          <View style={staticStyles.titleContainer}>
            <ThemedText type="title" style={staticStyles.title}>
              {t("photoReminderSettings")}
            </ThemedText>
            <TouchableOpacity
              style={staticStyles.languageToggle}
              onPress={toggleLanguage}
            >
              <ThemedText style={staticStyles.languageText}>
                {language === 'en' ? 'EN' : 'JP'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={staticStyles.formGroup}>
            <ThemedText style={staticStyles.label}>{t("startDateTime")}</ThemedText>
            <View style={staticStyles.dateTimeRow}>
              <Pressable
                onPress={() => {
                  setDatePickerMode("date");
                  setShowDatePicker(true);
                }}
              >
                <ThemedView
                  style={[
                    staticStyles.dateTimeButton,
                    dynamicStyles.dateTimeButton,
                  ]}
                >
                  <ThemedText style={staticStyles.dateTimeText}>
                    {startTime.toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDatePickerMode("time");
                  setShowDatePicker(true);
                }}
              >
                <ThemedView
                  style={[
                    staticStyles.dateTimeButton,
                    dynamicStyles.dateTimeButton,
                  ]}
                >
                  <ThemedText style={staticStyles.dateTimeText}>
                    {formatTime(startTime)}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={startTime}
                mode={datePickerMode}
                is24Hour={true}
                display="default"
                onChange={onChangeDate}
              />
            )}
          </View>

          <View style={staticStyles.formGroup}>
            <ThemedText style={staticStyles.label}>{t("totalDuration")}</ThemedText>
            <TextInput
              testID="duration-input"
              style={[staticStyles.input, dynamicStyles.input]}
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="30"
              placeholderTextColor={placeholderColor}
            />
          </View>

          <View style={staticStyles.formGroup}>
            <ThemedText style={staticStyles.label}>{t("notificationInterval")}</ThemedText>
            <TextInput
              style={[staticStyles.input, dynamicStyles.input]}
              value={interval}
              onChangeText={setInterval}
              keyboardType="number-pad"
              placeholder="5"
              placeholderTextColor={placeholderColor}
            />
          </View>
          <View style={staticStyles.formGroup}>
            <ThemedText style={staticStyles.label}>{t("reminderTitle")}</ThemedText>
            <TextInput
              testID="reminderTitle-input"
              style={[staticStyles.input, dynamicStyles.input]}
              value={reminderTitle}
              onChangeText={setReminderTitle}
              placeholder={t("titlePlaceholder")}
              placeholderTextColor={placeholderColor}
            />
          </View>
          <View style={staticStyles.formGroup}>
            <ThemedText style={staticStyles.label}>{t("reminderContent")}</ThemedText>
            <TextInput
              testID="reminderContent-input"
              style={[staticStyles.input, dynamicStyles.input]}
              value={reminderContent}
              onChangeText={setReminderContent}
              placeholder={t("contentPlaceholder")}
              placeholderTextColor={placeholderColor}
            />
          </View>
          <Button title={t("setReminder")} onPress={schedulePhotoReminders} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingTop: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
  },
  languageToggle: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  languageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateTimeText: {
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
  },
});
