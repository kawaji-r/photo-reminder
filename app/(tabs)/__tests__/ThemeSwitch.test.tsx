import React from 'react';
import { render } from '@testing-library/react-native';
import IndexScreen from '../index';
import { useColorScheme } from '@/hooks/useColorScheme';

// Mock the useColorScheme hook
jest.mock('@/hooks/useColorScheme');

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('Theme Switch Behavior', () => {
  it('renders correctly in light theme', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { getByTestId } = render(<IndexScreen />);

    const input = getByTestId('duration-input');
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderColor: '#ddd'
        })
      ])
    );
  });

  it('renders correctly in dark theme', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { getByTestId } = render(<IndexScreen />);

    const input = getByTestId('duration-input');
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: 'rgba(30,30,30,0.9)',
          borderColor: '#333'
        })
      ])
    );
  });

  it('does not throw errors when switching themes', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { rerender } = render(<IndexScreen />);

    // Switch to dark theme
    expect(() => {
      mockUseColorScheme.mockReturnValue('dark');
      rerender(<IndexScreen />);
    }).not.toThrow();

    // Switch back to light theme
    expect(() => {
      mockUseColorScheme.mockReturnValue('light');
      rerender(<IndexScreen />);
    }).not.toThrow();
  });
});
