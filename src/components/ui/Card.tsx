import { View, StyleSheet, ViewStyle, Pressable } from 'react-native'
import { colors } from '@/constants'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
  variant?: 'default' | 'outlined' | 'elevated'
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
  const content = (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  )

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
  },
  default: {
    backgroundColor: colors.white,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  elevated: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
})
