import { View, ActivityIndicator, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants'

interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Loading({ message, fullScreen = false }: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: colors.gray[600],
  },
})
