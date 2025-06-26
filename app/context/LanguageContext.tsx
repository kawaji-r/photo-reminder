import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define language strings
export const translations = {
  en: {
    // Index screen
    photoReminderSettings: "Photo Reminder Settings",
    startDateTime: "Start Date/Time:",
    totalDuration: "Total Duration (minutes):",
    notificationInterval: "Notification Interval (minutes):",
    reminderTitle: "Reminder Title:",
    reminderContent: "Reminder Content:",
    setReminder: "Set Reminder",
    titlePlaceholder: "Example: Dinner with friends",
    contentPlaceholder: "Example: Don't forget to take photos of this rare meetup!",
    
    // Alerts
    notificationPermissionRequired: "Notification Permission Required",
    permissionMessage: "Photo reminder requires notification permissions to work properly.",
    error: "Error",
    validDurationError: "Please enter a valid duration (minutes)",
    validIntervalError: "Please enter a valid notification interval (minutes)",
    intervalShorterError: "Notification interval must be shorter than the total duration",
    setupComplete: "Setup Complete",
    setupMessage: "Notifications will be sent every {0} minutes for a total of {1} minutes, starting from {2} {3}.",
    saveError: "Failed to save settings",
    
    // Scheduled screen
    scheduledReminders: "Scheduled Reminders",
    noReminders: "No scheduled reminders",
    totalDurationDisplay: "Total Duration: {0} minutes",
    intervalDisplay: "Notification Interval: Every {0} minutes",
    deleteHint: "(Long press to delete)",
    deleteReminder: "Delete Reminder",
    deleteConfirm: "Are you sure you want to delete this reminder?",
    cancel: "Cancel",
    delete: "Delete",
    loadError: "Failed to load reminders",
    deleteError: "Failed to delete reminder",
  },
  jp: {
    // Index screen
    photoReminderSettings: "写真リマインダー設定",
    startDateTime: "開始日時:",
    totalDuration: "合計時間 (分):",
    notificationInterval: "通知間隔 (分):",
    reminderTitle: "リマインダータイトル:",
    reminderContent: "リマインダー内容:",
    setReminder: "リマインダーを設定",
    titlePlaceholder: "例: 友だちとご飯",
    contentPlaceholder: "例: なかなか会えないから絶対に写真を忘れない！",
    
    // Alerts
    notificationPermissionRequired: "通知の許可が必要です",
    permissionMessage: "写真リマインダーを使用するには通知の許可が必要です。",
    error: "エラー",
    validDurationError: "有効な時間（分）を入力してください",
    validIntervalError: "有効な通知間隔（分）を入力してください",
    intervalShorterError: "通知間隔は合計時間より短くする必要があります",
    setupComplete: "設定完了",
    setupMessage: "{2} {3}から{1}分間、{0}分ごとに通知します。",
    saveError: "設定の保存に失敗しました",
    
    // Scheduled screen
    scheduledReminders: "設定済みリマインダー",
    noReminders: "設定済みのリマインダーはありません",
    totalDurationDisplay: "合計時間: {0}分",
    intervalDisplay: "通知間隔: {0}分ごと",
    deleteHint: "(長押しで削除)",
    deleteReminder: "リマインダーを削除",
    deleteConfirm: "本当にこのリマインダーを削除しますか？",
    cancel: "キャンセル",
    delete: "削除",
    loadError: "リマインダーの読み込みに失敗しました",
    deleteError: "リマインダーの削除に失敗しました",
  }
};

type LanguageContextType = {
  language: 'en' | 'jp';
  setLanguage: (lang: 'en' | 'jp') => void;
  t: (key: keyof typeof translations.en) => string;
  formatString: (str: string, ...args: any[]) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguageState] = useState<'en' | 'jp'>('en');

  useEffect(() => {
    // Load saved language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage === 'en' || savedLanguage === 'jp') {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      }
    };
    
    loadLanguage();
  }, []);

  const setLanguage = async (lang: 'en' | 'jp') => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || key;
  };

  const formatString = (str: string, ...args: any[]): string => {
    return str.replace(/{(\d+)}/g, (match, number) => {
      return typeof args[number] !== 'undefined' ? args[number] : match;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatString }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
