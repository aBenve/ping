import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, Button } from '@/components/ui'
import { useAuth } from '@/hooks'
import { colors } from '@/constants'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const displayName = user?.full_name || user?.username || 'Usuario'
  const initial = displayName.charAt(0).toUpperCase()

  async function handleSignOut() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error) {
              console.error('Error signing out:', error)
            }
          }
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
        </View>

        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>Conectado via Supabase Auth</Text>
          </View>
          
          {user?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Miembro desde</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-AR') : '-'}
            </Text>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <Card variant="outlined">
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notificaciones</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            
            <View style={styles.menuDivider} />
            
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>📍</Text>
              <Text style={styles.menuText}>Permisos de ubicación</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            
            <View style={styles.menuDivider} />
            
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>📖</Text>
              <Text style={styles.menuText}>Historial de alertas</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          
          <Card variant="outlined">
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>❓</Text>
              <Text style={styles.menuText}>Ayuda</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            
            <View style={styles.menuDivider} />
            
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>📝</Text>
              <Text style={styles.menuText}>Términos y condiciones</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
            
            <View style={styles.menuDivider} />
            
            <Pressable style={styles.menuItem}>
              <Text style={styles.menuIcon}>🔒</Text>
              <Text style={styles.menuText}>Privacidad</Text>
              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          </Card>
        </View>

        <Button
          title="Cerrar sesión"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <Text style={styles.version}>Versión 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
  },
  content: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary[700],
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: colors.gray[500],
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: 14,
    color: colors.gray[900],
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray[900],
  },
  menuArrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
  signOutButton: {
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 24,
  },
})
