import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TextInput, Button, Platform, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

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
};

export default function IndexScreen() {
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState('30');
  const [interval, setInterval] = useState('5');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Request permissions on app start
  useEffect(() => {
    async function requestPermissions() {
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        Alert.alert('通知の許可が必要です', '写真リマインダーを使用するには通知の許可が必要です。');
      }

      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('カメラの許可が必要です', '写真リマインダーを使用するにはカメラの許可が必要です。');
      }
    }

    requestPermissions();

    // Set up notification response handler
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Open camera when notification is tapped
      openCamera();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      alert('カメラ機能はモバイルデバイスでのみ利用可能です');
      return;
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      // On mobile, we can use expo-camera to open the camera
      await Camera.openCameraAsync({
        quality: 1,
      });
    } else {
      Alert.alert('カメラの許可が必要です', '写真を撮るにはカメラの許可が必要です。');
    }
  };

  const schedulePhotoReminders = async () => {
    // Validate inputs
    const durationMinutes = parseInt(duration);
    const intervalMinutes = parseInt(interval);

    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      Alert.alert('エラー', '有効な時間（分）を入力してください');
      return;
    }

    if (isNaN(intervalMinutes) || intervalMinutes <= 0) {
      Alert.alert('エラー', '有効な通知間隔（分）を入力してください');
      return;
    }

    if (intervalMinutes > durationMinutes) {
      Alert.alert('エラー', '通知間隔は合計時間より短くする必要があります');
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
      notificationTime.setMinutes(notificationTime.getMinutes() + (i * intervalMinutes));

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "写真を撮る時間です！",
          body: "タップしてカメラを開きます",
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
    };

    try {
      // Get existing reminders
      const existingRemindersJson = await AsyncStorage.getItem('photoReminders');
      const existingReminders: PhotoReminder[] = existingRemindersJson 
        ? JSON.parse(existingRemindersJson) 
        : [];

      // Add new reminder
      const updatedReminders = [...existingReminders, reminder];

      // Save back to storage
      await AsyncStorage.setItem('photoReminders', JSON.stringify(updatedReminders));

      Alert.alert(
        '設定完了',
        `${startTime.toLocaleTimeString()}から${durationMinutes}分間、${intervalMinutes}分ごとに通知します。`
      );
    } catch (error) {
      console.error('Failed to save reminder:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText type="title" style={styles.title}>写真リマインダー設定</ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>開始時間:</ThemedText>
          <Button 
            title={startTime.toLocaleTimeString()} 
            onPress={() => setShowDatePicker(true)} 
          />
          {showDatePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onChangeDate}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>合計時間 (分):</ThemedText>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="30"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>通知間隔 (分):</ThemedText>
          <TextInput
            style={styles.input}
            value={interval}
            onChangeText={setInterval}
            keyboardType="number-pad"
            placeholder="5"
          />
        </View>

        <Button 
          title="リマインダーを設定" 
          onPress={schedulePhotoReminders} 
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
});

