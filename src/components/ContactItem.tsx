import { View, Text, StyleSheet, Pressable, Switch } from 'react-native'
import { colors } from '@/constants'
import { ContactWithProfile } from '@/types/database'

interface ContactItemProps {
  contact: ContactWithProfile
  onPress?: () => void
  onToggleTrusted?: (value: boolean) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}

export function ContactItem({
  contact,
  onPress,
  onToggleTrusted,
  selectable,
  selected,
  onSelect,
}: ContactItemProps) {
  const profile = contact.contact
  const displayName = profile?.full_name || profile?.username || 'Unknown'
  const initial = displayName.charAt(0).toUpperCase()

  const content = (
    <View style={styles.container}>
      {selectable && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
      
      <View style={[styles.avatar, contact.is_trusted && styles.avatarTrusted]}>
        <Text style={styles.avatarText}>{initial}</Text>
        {contact.is_trusted && (
          <View style={styles.trustedBadge}>
            <Text style={styles.trustedBadgeText}>⭐</Text>
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.username}>@{profile?.username}</Text>
      </View>

      {onToggleTrusted && (
        <View style={styles.trustToggle}>
          <Text style={styles.trustLabel}>Confianza</Text>
          <Switch
            value={contact.is_trusted}
            onValueChange={onToggleTrusted}
            trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
            thumbColor={contact.is_trusted ? colors.primary[600] : colors.gray[100]}
          />
        </View>
      )}
    </View>
  )

  if (onPress || onSelect) {
    return (
      <Pressable 
        onPress={onSelect || onPress} 
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  pressed: {
    backgroundColor: colors.gray[50],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTrusted: {
    backgroundColor: colors.primary[100],
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
  },
  trustedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustedBadgeText: {
    fontSize: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  username: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  trustToggle: {
    alignItems: 'center',
  },
  trustLabel: {
    fontSize: 10,
    color: colors.gray[500],
    marginBottom: 4,
  },
})
