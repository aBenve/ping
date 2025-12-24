import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ChevronLeft, AtSign, UserPlus, QrCode, Camera, Info } from 'lucide-react-native';
import { Button, Card, Dialog, useDialog } from '@/components/ui';
import { useContacts, useAuth } from '@/hooks';
import { cn } from '@/lib/utils';

const { width } = Dimensions.get('window');
const QR_SIZE = width - 80;

type Tab = 'username' | 'qr';

export default function AddContactScreen() {
  const insets = useSafeAreaInsets();
  const { addContact } = useContacts();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('username');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { dialogProps, showSuccess, showError } = useDialog();

  const handleAdd = async (usernameToAdd: string) => {
    if (!usernameToAdd.trim()) {
      showError('Error', 'Ingresá un username');
      return;
    }

    // Prevent adding yourself
    if (usernameToAdd.toLowerCase() === user?.username?.toLowerCase()) {
      showError('Error', 'No podés agregarte a vos mismo');
      return;
    }

    setLoading(true);
    try {
      await addContact(usernameToAdd.trim());
      showSuccess('Contacto agregado', `${usernameToAdd} fue agregado a tus contactos`, () => {
        router.back();
      });
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo agregar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Expected format: ping://add/username
    const match = data.match(/^ping:\/\/add\/([a-z0-9_]+)$/i);
    if (match) {
      const scannedUsername = match[1].toLowerCase();
      handleAdd(scannedUsername);
    } else {
      showError('Código inválido', 'Este código QR no es válido para agregar contactos');
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const renderUsernameTab = () => (
    <View className="flex-1 px-5">
      {/* Username Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-foreground mb-2">Username</Text>
        <View className="flex-row items-center bg-secondary border border-border rounded-xl px-4">
          <AtSign color="#A1A1AA" size={20} />
          <TextInput
            className="flex-1 py-4 px-2 text-base text-foreground"
            placeholder="juanperez"
            placeholderTextColor="#A1A1AA"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>
      </View>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
        <View className="flex-row items-start">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
            <Info color="#3B82F6" size={16} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-sm text-blue-700 leading-5">
              Tu contacto debe tener la app instalada para recibir notificaciones.
            </Text>
          </View>
        </View>
      </Card>

      {/* Add Button */}
      <Button
        title="Agregar contacto"
        icon={<UserPlus color="#FFF" size={18} />}
        onPress={() => handleAdd(username)}
        loading={loading}
        disabled={!username.trim()}
      />
    </View>
  );

  const renderQRTab = () => {
    if (!permission) {
      return (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-muted-foreground">Cargando cámara...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4">
            <Camera color="#A1A1AA" size={40} />
          </View>
          <Text className="text-lg font-semibold text-foreground text-center mb-2">
            Acceso a la cámara
          </Text>
          <Text className="text-base text-muted-foreground text-center mb-6">
            Necesitamos acceso a la cámara para escanear códigos QR
          </Text>
          <Button title="Permitir acceso" onPress={requestPermission} />
        </View>
      );
    }

    return (
      <View className="flex-1 items-center px-5">
        <Text className="text-base text-muted-foreground text-center mb-6">
          Escaneá el código QR de tu contacto
        </Text>

        {/* QR Scanner */}
        <View
          style={{ width: QR_SIZE, height: QR_SIZE }}
          className="rounded-3xl overflow-hidden bg-black"
        >
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />

          {/* Corner markers */}
          <View className="absolute inset-0">
            {/* Top Left */}
            <View className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-xl" />
            {/* Top Right */}
            <View className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-xl" />
            {/* Bottom Left */}
            <View className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-xl" />
            {/* Bottom Right */}
            <View className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-white rounded-br-xl" />
          </View>
        </View>

        {scanned && (
          <View className="mt-6">
            <Button
              variant="outline"
              title="Escanear de nuevo"
              onPress={() => setScanned(false)}
            />
          </View>
        )}

        {/* My QR Code hint */}
        <View className="mt-8 p-4 bg-secondary rounded-xl">
          <Text className="text-sm text-muted-foreground text-center">
            Tu código QR está en tu perfil para que otros te agreguen
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          className="w-10 h-10 rounded-full items-center justify-center -ml-2"
          onPress={() => router.back()}
        >
          <ChevronLeft color="#18181B" size={24} />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-foreground ml-2">Agregar contacto</Text>
      </View>

      {/* Tabs */}
      <View className="px-5 mb-6">
        <View className="flex-row bg-secondary rounded-xl p-1">
          <Pressable
            className={cn(
              'flex-1 flex-row items-center justify-center py-3 rounded-lg',
              tab === 'username' && 'bg-background'
            )}
            onPress={() => setTab('username')}
          >
            <AtSign color={tab === 'username' ? '#18181B' : '#A1A1AA'} size={18} />
            <Text
              className={cn(
                'text-sm font-medium ml-2',
                tab === 'username' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Username
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              'flex-1 flex-row items-center justify-center py-3 rounded-lg',
              tab === 'qr' && 'bg-background'
            )}
            onPress={() => setTab('qr')}
          >
            <QrCode color={tab === 'qr' ? '#18181B' : '#A1A1AA'} size={18} />
            <Text
              className={cn(
                'text-sm font-medium ml-2',
                tab === 'qr' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Escanear QR
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {tab === 'username' ? renderUsernameTab() : renderQRTab()}

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </KeyboardAvoidingView>
  );
}
