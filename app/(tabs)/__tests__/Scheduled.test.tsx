import React from 'react';
import { render } from '@testing-library/react-native';
import ScheduledScreen from '../scheduled';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Mock AsyncStorage and Notifications
jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-notifications');

describe('ScheduledScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter out expired reminders', async () => {
    const currentDate = new Date();
    const pastDate = new Date(currentDate.getTime() - 1000 * 60 * 60); // 1 hour ago
    const futureDate = new Date(currentDate.getTime() + 1000 * 60 * 60); // 1 hour from now

    const mockReminders = [
      {
        id: '1',
        startTime: pastDate.toISOString(),
        duration: 30, // minutes
        interval: 5,
        notificationIds: ['n1']
      },
      {
        id: '2',
        startTime: futureDate.toISOString(),
        duration: 60,
        interval: 10,
        notificationIds: ['n2']
      }
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockReminders));

    const { findAllByText, queryByText } = render(<ScheduledScreen />);

    // Wait for async operations
    await findAllByText('設定済みリマインダー');

    // Should show future reminder
    expect(queryByText(new RegExp(futureDate.getHours().toString()))).toBeTruthy();
    // Should not show past reminder
    expect(queryByText(new RegExp(pastDate.getHours().toString()))).toBeNull();
  });

  it('should show empty message when no active reminders', async () => {
    const currentDate = new Date();
    const pastDate = new Date(currentDate.getTime() - 1000 * 60 * 60); // 1 hour ago

    const mockReminders = [
      {
        id: '1',
        startTime: pastDate.toISOString(),
        duration: 30, // minutes
        interval: 5,
        notificationIds: ['n1']
      },
    ];

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockReminders));

    const { findByText } = render(<ScheduledScreen />);
    expect(await findByText('設定済みのリマインダーはありません')).toBeTruthy();
  });
});
