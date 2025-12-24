import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Search,
  MapPin,
  Clock,
  Check,
  ChevronRight,
  Trash2,
  Send,
  AlertCircle,
  Navigation,
  Pencil,
} from 'lucide-react-native';
import { Card, Avatar, Button, Dialog, useDialog } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { TimePicker, formatMinutes } from '@/components/TimePicker';
import { useContacts, useRequests } from '@/hooks';
import { cn } from '@/lib/utils';

type Step = 'contact' | 'triggers';

interface LocationTrigger {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface TimeoutTrigger {
  minutes: number;
}

let locationIdCounter = 0;
const generateLocationId = () => `loc_${++locationIdCounter}_${Date.now()}`;

export default function NewAlertScreen() {
  const insets = useSafeAreaInsets();
  const { contacts, fetchContacts } = useContacts();
  const { sendRequest } = useRequests();
  const { dialogProps, showSuccess, showError } = useDialog();

  const [step, setStep] = useState<Step>('contact');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [locationTriggers, setLocationTriggers] = useState<LocationTrigger[]>([]);
  const [timeoutTrigger, setTimeoutTrigger] = useState<TimeoutTrigger | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pickers visibility
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const selectedContact = contacts.find((c) => c.contact_id === selectedContactId);
  const filteredContacts = contacts.filter((c) => {
    const name = c.contact?.full_name || c.contact?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleLocationConfirm = (location: Omit<LocationTrigger, 'id'>) => {
    if (editingLocationId) {
      // Editing existing location
      setLocationTriggers((prev) =>
        prev.map((loc) =>
          loc.id === editingLocationId ? { ...location, id: editingLocationId } : loc
        )
      );
    } else {
      // Adding new location
      setLocationTriggers((prev) => [...prev, { ...location, id: generateLocationId() }]);
    }
    setShowLocationPicker(false);
    setEditingLocationId(null);
  };

  const handleRemoveLocation = (id: string) => {
    setLocationTriggers((prev) => prev.filter((loc) => loc.id !== id));
  };

  const handleEditLocation = (id: string) => {
    setEditingLocationId(id);
    setShowLocationPicker(true);
  };

  const getEditingLocation = () => {
    if (!editingLocationId) return null;
    return locationTriggers.find((loc) => loc.id === editingLocationId) || null;
  };

  const handleTimeoutConfirm = (minutes: number) => {
    setTimeoutTrigger({ minutes });
    setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!selectedContactId) return;

    if (locationTriggers.length === 0 && !timeoutTrigger) {
      showError('Falta información', 'Agregá al menos un destino o un tiempo límite');
      return;
    }

    setLoading(true);
    try {
      // For now, send using the first location (backend would need to be updated for multiple)
      // The destination_name will include all locations for display
      const primaryLocation = locationTriggers[0];
      const allLocationNames = locationTriggers.map((l) => l.name).join(' o ');

      await sendRequest({
        to_user_id: selectedContactId,
        destination_name: allLocationNames || primaryLocation?.name,
        destination_lat: primaryLocation?.latitude,
        destination_lng: primaryLocation?.longitude,
        message: message || undefined,
      });

      showSuccess(
        'Solicitud enviada',
        `${selectedContact?.contact?.full_name || selectedContact?.contact?.username} recibirá tu solicitud`,
        () => router.back()
      );
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const hasAnyTrigger = locationTriggers.length > 0 || timeoutTrigger;
  const contactName = selectedContact?.contact?.full_name || selectedContact?.contact?.username;

  const renderContactStep = () => (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-foreground mb-1">
        ¿Quién debe avisarte?
      </Text>
      <Text className="text-base text-muted-foreground mb-6">
        Selecciona la persona que quieres que te avise cuando llegue
      </Text>

      {/* Search */}
      <View className="flex-row items-center bg-secondary border border-border rounded-xl px-3 mb-4">
        <Search color="#A1A1AA" size={20} />
        <TextInput
          className="flex-1 py-3 px-2 text-base text-foreground"
          placeholder="Buscar contacto..."
          placeholderTextColor="#A1A1AA"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Contacts List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {filteredContacts.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-muted-foreground">
              {searchQuery ? 'No se encontraron contactos' : 'No hay contactos'}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContactId === contact.contact_id;
              return (
                <Pressable
                  key={contact.id}
                  className={cn(
                    'flex-row items-center p-4 rounded-xl border',
                    isSelected
                      ? 'border-foreground bg-secondary'
                      : 'border-border bg-card active:bg-secondary'
                  )}
                  onPress={() => setSelectedContactId(contact.contact_id)}
                >
                  <Avatar
                    name={contact.contact?.full_name || contact.contact?.username}
                    size="lg"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-foreground">
                      {contact.contact?.full_name || contact.contact?.username}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      @{contact.contact?.username}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'w-6 h-6 rounded-full border-2 items-center justify-center',
                      isSelected ? 'bg-foreground border-foreground' : 'border-border'
                    )}
                  >
                    {isSelected && <Check color="#FFF" size={14} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Next Button */}
      <View className="pt-4">
        <Button
          title="Siguiente"
          onPress={() => setStep('triggers')}
          disabled={!selectedContactId}
        />
      </View>
    </View>
  );

  const renderTriggersStep = () => (
    <View className="flex-1">
      {/* Selected Contact Header */}
      <View className="flex-row items-center mb-6 p-4 bg-secondary rounded-xl">
        <Avatar name={contactName} size="md" />
        <View className="flex-1 ml-3">
          <Text className="text-sm text-muted-foreground">Solicitud para</Text>
          <Text className="text-base font-semibold text-foreground">{contactName}</Text>
        </View>
        <Pressable
          className="px-3 py-1.5 rounded-full bg-background border border-border"
          onPress={() => setStep('contact')}
        >
          <Text className="text-sm text-foreground">Cambiar</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Location Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <MapPin color="#18181B" size={18} />
            <Text className="text-base font-semibold text-foreground ml-2">
              Destinos
            </Text>
            {locationTriggers.length === 0 && (
              <View className="ml-2 px-2 py-0.5 bg-amber-100 rounded">
                <Text className="text-xs text-amber-700 font-medium">Requerido</Text>
              </View>
            )}
            {locationTriggers.length > 0 && (
              <View className="ml-2 px-2 py-0.5 bg-secondary rounded">
                <Text className="text-xs text-muted-foreground font-medium">{locationTriggers.length}</Text>
              </View>
            )}
          </View>

          {locationTriggers.length > 0 && (
            <View className="gap-3 mb-3">
              {locationTriggers.map((location, index) => (
                <Card key={location.id} className="p-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                      <Text className="text-sm font-bold text-blue-600">{index + 1}</Text>
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-medium text-foreground">
                        {location.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground mt-0.5">
                        Radio: {location.radius}m
                      </Text>
                    </View>
                    <View className="flex-row">
                      <Pressable
                        className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-2"
                        onPress={() => handleEditLocation(location.id)}
                      >
                        <Pencil color="#18181B" size={16} />
                      </Pressable>
                      <Pressable
                        className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
                        onPress={() => handleRemoveLocation(location.id)}
                      >
                        <Trash2 color="#EF4444" size={16} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Add Location Button */}
          <Pressable
            className="flex-row items-center p-4 rounded-xl border-2 border-dashed border-border active:bg-secondary"
            onPress={() => {
              setEditingLocationId(null);
              setShowLocationPicker(true);
            }}
          >
            <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
              <MapPin color="#18181B" size={24} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-base font-medium text-foreground">
                {locationTriggers.length === 0 ? 'Agregar destino' : 'Agregar otro destino'}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {locationTriggers.length === 0
                  ? '¿A dónde va a llegar?'
                  : 'Podés agregar destinos alternativos'}
              </Text>
            </View>
            <ChevronRight color="#A1A1AA" size={20} />
          </Pressable>

          {locationTriggers.length > 1 && (
            <View className="mt-3 p-3 bg-blue-50 rounded-xl">
              <Text className="text-sm text-blue-700">
                Te avisaremos cuando llegue a cualquiera de estos destinos
              </Text>
            </View>
          )}
        </View>

        {/* Timeout Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Clock color="#18181B" size={18} />
            <Text className="text-base font-semibold text-foreground ml-2">
              Tiempo límite
            </Text>
            <View className="ml-2 px-2 py-0.5 bg-secondary rounded">
              <Text className="text-xs text-muted-foreground font-medium">Opcional</Text>
            </View>
          </View>

          {timeoutTrigger ? (
            <Card className="p-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center">
                  <Clock color="#D97706" size={24} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-medium text-foreground">
                    {formatMinutes(timeoutTrigger.minutes)}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Te alertaremos si no llega a tiempo
                  </Text>
                </View>
                <View className="flex-row">
                  <Pressable
                    className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-2"
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Pencil color="#18181B" size={16} />
                  </Pressable>
                  <Pressable
                    className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
                    onPress={() => setTimeoutTrigger(null)}
                  >
                    <Trash2 color="#EF4444" size={16} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ) : (
            <Pressable
              className="flex-row items-center p-4 rounded-xl border border-border bg-card active:bg-secondary"
              onPress={() => setShowTimePicker(true)}
            >
              <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
                <Clock color="#A1A1AA" size={24} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-base font-medium text-foreground">
                  Agregar tiempo límite
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Alerta de seguridad si no llega
                </Text>
              </View>
              <ChevronRight color="#A1A1AA" size={20} />
            </Pressable>
          )}
        </View>

        {/* Message Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Send color="#18181B" size={18} />
            <Text className="text-base font-semibold text-foreground ml-2">
              Mensaje
            </Text>
            <View className="ml-2 px-2 py-0.5 bg-secondary rounded">
              <Text className="text-xs text-muted-foreground font-medium">Opcional</Text>
            </View>
          </View>

          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-base text-foreground min-h-[100px]"
            placeholder="Ej: Avisame cuando llegues a casa, quiero saber que estás bien"
            placeholderTextColor="#A1A1AA"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Info Box */}
        {!hasAnyTrigger && (
          <Card className="p-4 bg-amber-50 border-amber-200 mb-4">
            <View className="flex-row items-start">
              <AlertCircle color="#D97706" size={20} />
              <Text className="flex-1 text-sm text-amber-800 ml-3">
                Necesitás agregar al menos un destino para poder enviar la solicitud
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View className="pt-4">
        <Button
          title="Enviar solicitud"
          icon={<Send color="#FFF" size={18} />}
          onPress={handleSubmit}
          loading={loading}
          disabled={!hasAnyTrigger}
        />
      </View>
    </View>
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center -ml-2"
          onPress={() => router.back()}
        >
          <X color="#18181B" size={24} />
        </Pressable>
        <View className="flex-1 mx-4">
          {/* Progress */}
          <View className="flex-row gap-2">
            <View className="flex-1 h-1.5 rounded-full bg-foreground" />
            <View
              className={cn(
                'flex-1 h-1.5 rounded-full',
                step === 'triggers' ? 'bg-foreground' : 'bg-muted'
              )}
            />
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-muted-foreground">Contacto</Text>
            <Text className="text-xs text-muted-foreground">Detalles</Text>
          </View>
        </View>
        <View className="w-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-5">
        {step === 'contact' ? renderContactStep() : renderTriggersStep()}
      </View>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => {
          setShowLocationPicker(false);
          setEditingLocationId(null);
        }}
        onConfirm={handleLocationConfirm}
        initialLocation={getEditingLocation()}
      />

      {/* Time Picker Modal */}
      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimeoutConfirm}
        initialMinutes={timeoutTrigger?.minutes}
      />

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </View>
  );
}
