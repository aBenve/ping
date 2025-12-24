import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, Users, Star, ChevronLeft } from 'lucide-react-native';
import { Card, Button, EmptyState, Dialog, useDialog } from '@/components/ui';
import { ContactItem } from '@/components';
import { useContacts } from '@/hooks';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { contacts, trustedContacts, fetchContacts, toggleTrusted, removeContact } = useContacts();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { dialogProps, showConfirm } = useDialog();

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  }, [fetchContacts]);

  const handleToggleTrusted = async (contactId: string, currentValue: boolean) => {
    try {
      await toggleTrusted(contactId, !currentValue);
    } catch (error) {
      console.error('Error toggling trusted:', error);
    }
  };

  const handleRemove = (contactId: string, name: string) => {
    showConfirm(
      'Eliminar contacto',
      `¿Estás seguro de que querés eliminar a ${name}?`,
      async () => {
        try {
          await removeContact(contactId);
        } catch (error) {
          console.error('Error removing contact:', error);
        }
      }
    );
  };

  const regularContacts = contacts.filter((c) => !c.is_trusted);

  const filteredTrusted = trustedContacts.filter((c) => {
    const name = c.contact?.full_name || c.contact?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredRegular = regularContacts.filter((c) => {
    const name = c.contact?.full_name || c.contact?.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center -ml-2 mr-2"
          onPress={() => router.back()}
        >
          <ChevronLeft color="#18181B" size={24} />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-foreground">Contactos</Text>
        <Button
          variant="default"
          size="sm"
          icon={<Plus color="#FFF" size={18} />}
          title="Agregar"
          onPress={() => router.push('/(app)/contacts/add')}
        />
      </View>

      {/* Search */}
      {contacts.length > 0 && (
        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-secondary border border-border rounded-xl px-3">
            <Search color="#A1A1AA" size={20} />
            <TextInput
              className="flex-1 py-3 px-2 text-base text-foreground"
              placeholder="Buscar contacto..."
              placeholderTextColor="#A1A1AA"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {contacts.length === 0 ? (
          <EmptyState
            icon={<Users color="#A1A1AA" size={48} />}
            title="Sin contactos"
            description="Agregá contactos para poder pedirles que te avisen cuando lleguen"
            action={
              <Button
                title="Agregar contacto"
                onPress={() => router.push('/(app)/contacts/add')}
              />
            }
          />
        ) : (
          <>
            {/* Trusted Contacts */}
            {filteredTrusted.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center px-5 mb-2">
                  <Star color="#F59E0B" size={16} fill="#F59E0B" />
                  <Text className="text-sm font-semibold text-muted-foreground ml-2 uppercase tracking-wide">
                    Círculo de confianza ({filteredTrusted.length})
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground px-5 mb-3">
                  Pueden enviarte solicitudes sin aprobación previa
                </Text>
                <Card className="mx-5">
                  {filteredTrusted.map((contact, index) => (
                    <View key={contact.id}>
                      <ContactItem
                        contact={contact}
                        onToggleTrusted={() =>
                          handleToggleTrusted(contact.contact_id, contact.is_trusted)
                        }
                        onRemove={() =>
                          handleRemove(
                            contact.contact_id,
                            contact.contact?.full_name || contact.contact?.username || 'contacto'
                          )
                        }
                      />
                      {index < filteredTrusted.length - 1 && (
                        <View className="h-px bg-border mx-4" />
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* Regular Contacts */}
            {filteredRegular.length > 0 && (
              <View>
                <View className="flex-row items-center px-5 mb-2">
                  <Users color="#A1A1AA" size={16} />
                  <Text className="text-sm font-semibold text-muted-foreground ml-2 uppercase tracking-wide">
                    Contactos ({filteredRegular.length})
                  </Text>
                </View>
                <Card className="mx-5">
                  {filteredRegular.map((contact, index) => (
                    <View key={contact.id}>
                      <ContactItem
                        contact={contact}
                        onToggleTrusted={() =>
                          handleToggleTrusted(contact.contact_id, contact.is_trusted)
                        }
                        onRemove={() =>
                          handleRemove(
                            contact.contact_id,
                            contact.contact?.full_name || contact.contact?.username || 'contacto'
                          )
                        }
                      />
                      {index < filteredRegular.length - 1 && (
                        <View className="h-px bg-border mx-4" />
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* No results */}
            {searchQuery && filteredTrusted.length === 0 && filteredRegular.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-muted-foreground">No se encontraron contactos</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </View>
  );
}
