import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import IndexScreen from '../index';

describe('Option Settings Behavior', () => {
  it('allows user to input reminder title and content', () => {
    const { getByTestId } = render(<IndexScreen />);
    // Assuming the text inputs have testIDs 'reminderTitle-input' and 'reminderContent-input'
    const titleInput = getByTestId('reminderTitle-input');
    const contentInput = getByTestId('reminderContent-input');

    fireEvent.changeText(titleInput, 'Test Reminder Title');
    fireEvent.changeText(contentInput, 'Test Reminder Content');

    expect(titleInput.props.value).toBe('Test Reminder Title');
    expect(contentInput.props.value).toBe('Test Reminder Content');
  });
});
