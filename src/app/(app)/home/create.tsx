import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import { Button, Input, Card } from '@/components/ui'
import { ContactItem } from '@/components'
import { useAlerts, useContacts, useGeofencing } from '@/hooks'
import { colors, config } from '@/constants'

type Step = 'destination' | 'contacts' | 'fallback'

export default function CreateAlertScreen() {
  const { createAlert } = useAlerts()
  const { contacts, fetchContacts } = useContacts()
  const { getCurrentLocation } = useGeofencing()
  
  const [step, setStep] = useState<Step>('destination')
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [destinationName, setDestinationName] = useState('')
  const [destinationLat, setDestinationLat] = useState<number | null>(null)
  const [destinationLng, setDestinationLng] = useState<number | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [fallbackMinutes, setFallbackMinutes] = useState(60)

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  async function handleUseCurrentLocation() {
    try {
      const location = await getCurrentLocation()
      setDestinationLat(location.latitude)
      setDestinationLng(location.longitude)
      if (!destinationName) {
        setDestinationName('Mi ubicación actual')
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación')
    }
  }

  function toggleContact(contactId: string) {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  async function handleCreate() {
    if (!destinationLat || !destinationLng) {
      Alert.alert('Error', 'Seleccioná una ubicación de destino')
      return
    }

    if (selectedContacts.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos un contacto')
      return
    }

    setLoading(true)
    try {
      await createAlert({
        destination_name: destinationName || 'Destino',
        destination_lat: destinationLat,
        destination_lng: destinationLng,
        fallback_minutes: fallbackMinutes,
        recipient_ids: selectedContacts,
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la alerta')
    } finally {
      setLoading(false)
    }
  }

  function renderStep() {
    switch (step) {
      case 'destination':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿A dónde vas?</Text>
            
            <Input
              label="Nombre del destino"
              placeholder="Casa, Trabajo, etc."
              value={destinationName}
              onChangeText={setDestinationName}
            />

            <Pressable style={styles.locationButton} onPress={handleUseCurrentLocation}>
              <Text style={styles.locationButtonIcon}>📍</Text>
              <Text style={styles.locationButtonText}>Usar ubicación actual</Text>
            </Pressable>

            {destinationLat && destinationLng && (
              <Card variant="outlined" style={styles.locationCard}>
                <Text style={styles.locationCardText}>
                  📍 Ubicación seleccionada
                </Text>
                <Text style={styles.locationCoords}>
                  {destinationLat.toFixed(4)}, {destinationLng.toFixed(4)}
                </Text>
              </Card>
            )}

            <View style={styles.stepActions}>
              <Button
                title="Siguiente →"
                onPress={() => setStep('contacts')}
                disabled={!destinationLat || !destinationLng}
                testID="btn-next-step1"
              />
            </View>
          </View>
        )

      case 'contacts':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¿A quién avisamos?</Text>
            <Text style={styles.stepSubtitle}>
              Seleccioná los contactos que recibirán la notificación
            </Text>

            {contacts.length === 0 ? (
              <Card variant="outlined" style={styles.emptyContacts}>
                <Text style={styles.emptyContactsText}>
                  No tenés contactos agregados. Agregá contactos desde la pestaña Contactos.
                </Text>
              </Card>
            ) : (
              <View style={styles.contactsList}>
                {contacts.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    selectable
                    selected={selectedContacts.includes(contact.contact_id)}
                    onSelect={() => toggleContact(contact.contact_id)}
                  />
                ))}
              </View>
            )}

            <View style={styles.stepActions}>
              <Button
                title="← Atrás"
                variant="outline"
                onPress={() => setStep('destination')}
                style={styles.backButton}
              />
              <Button
                title="Siguiente →"
                onPress={() => setStep('fallback')}
                disabled={selectedContacts.length === 0}
                style={styles.nextButton}
                testID="btn-next-step2"
              />
            </View>
          </View>
        )

      case 'fallback':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Si no llego, avisar en:</Text>
            <Text style={styles.stepSubtitle}>
              Si no detectamos que llegaste en este tiempo, notificaremos a tus contactos
            </Text>

            <View style={styles.fallbackOptions}>
              {config.fallbackOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.fallbackOption,
                    fallbackMinutes === option.value && styles.fallbackOptionSelected,
                  ]}
                  onPress={() => setFallbackMinutes(option.value)}
                >
                  <Text
                    style={[
                      styles.fallbackOptionText,
                      fallbackMinutes === option.value && styles.fallbackOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Card variant="outlined" style={styles.infoCard}>
              <Text style={styles.infoCardIcon}>ℹ️</Text>
              <Text style={styles.infoCardText}>
                Si no detectamos que llegaste en {config.fallbackOptions.find(o => o.value === fallbackMinutes)?.label}, 
                notificaremos a tus contactos con tu última ubicación conocida.
              </Text>
            </Card>

            <View style={styles.stepActions}>
              <Button
                title="← Atrás"
                variant="outline"
                onPress={() => setStep('contacts')}
                style={styles.backButton}
              />
              <Button
                title="Activar 🚀"
                onPress={handleCreate}
                loading={loading}
                style={styles.nextButton}
                testID="btn-activate"
              />
            </View>
          </View>
        )
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progress}>
        {(['destination', 'contacts', 'fallback'] as Step[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressStep,
              step === s && styles.progressStepActive,
              (['destination', 'contacts', 'fallback'] as Step[]).indexOf(step) > i && styles.progressStepCompleted,
            ]}
          />
        ))}
      </View>

      {renderStep()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
  },
  progressStepActive: {
    backgroundColor: colors.primary[600],
  },
  progressStepCompleted: {
    backgroundColor: colors.primary[300],
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
    lineHeight: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginTop: 8,
  },
  locationButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  locationButtonText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '600',
  },
  locationCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationCardText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  locationCoords: {
    fontSize: 12,
    color: colors.gray[500],
  },
  contactsList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  emptyContacts: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyContactsText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
  fallbackOptions: {
    gap: 12,
    marginBottom: 24,
  },
  fallbackOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  fallbackOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  fallbackOptionText: {
    fontSize: 16,
    color: colors.gray[700],
    textAlign: 'center',
  },
  fallbackOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoCardIcon: {
    fontSize: 16,
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
})
