import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  lightBorderColor?: string;
  darkBorderColor?: string;
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor,
  lightBorderColor,
  darkBorderColor,
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const borderColor = useThemeColor(
    { light: lightBorderColor, dark: darkBorderColor }, 
    'border'
  );

  const viewStyles = [style];
  if (backgroundColor) viewStyles.push({ backgroundColor });
  if (borderColor) viewStyles.push({ borderColor });

  return <View style={viewStyles} {...otherProps} />;
}
