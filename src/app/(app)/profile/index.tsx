import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bell,
  MapPin,
  History,
  HelpCircle,
  FileText,
  Shield,
  Users,
  ChevronRight,
  LogOut,
  QrCode,
  Share2,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card, Avatar, Button, Dialog, useDialog } from '@/components/ui';
import { useAuth } from '@/hooks';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width - 120, 200);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable
      className="flex-row items-center py-3.5 active:opacity-70"
      onPress={onPress}
    >
      <View className="w-8">{icon}</View>
      <Text className="flex-1 text-base text-foreground">{label}</Text>
      <ChevronRight color="#A1A1AA" size={20} />
    </Pressable>
  );
}

function MenuDivider() {
  return <View className="h-px bg-border" />;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { dialogProps, showConfirm } = useDialog();
  const [showQR, setShowQR] = useState(false);

  const displayName = user?.full_name || user?.username || 'Usuario';
  const qrValue = user?.username ? `ping://add/${user.username}` : '';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Agregame en Ping! Mi usuario es @${user?.username}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  function handleSignOut() {
    showConfirm(
      'Cerrar sesión',
      '¿Estás seguro de que querés cerrar sesión?',
      async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('Error signing out:', error);
        }
      },
      undefined,
      'Cerrar sesión',
      'Cancelar'
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-foreground">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8">
        {/* Profile Section */}
        <View className="items-center py-6">
          <Avatar name={displayName} size="xl" />
          <Text className="text-xl font-bold text-foreground mt-3">{displayName}</Text>
          <Text className="text-sm text-muted-foreground">@{user?.username}</Text>
        </View>

        {/* QR Code Section */}
        <Card className="mb-6 p-4">
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowQR(!showQR)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                <QrCode color="#FFF" size={20} />
              </View>
              <View className="ml-3">
                <Text className="text-base font-semibold text-foreground">Mi código QR</Text>
                <Text className="text-sm text-muted-foreground">
                  Para que otros te agreguen
                </Text>
              </View>
            </View>
            <ChevronRight
              color="#A1A1AA"
              size={20}
              style={{ transform: [{ rotate: showQR ? '90deg' : '0deg' }] }}
            />
          </Pressable>

          {showQR && qrValue && (
            <View className="items-center mt-4 pt-4 border-t border-border">
              <View className="bg-white p-4 rounded-2xl">
                <QRCode
                  value={qrValue}
                  size={QR_SIZE}
                  backgroundColor="white"
                  color="#18181B"
                />
              </View>
              <Text className="text-sm text-muted-foreground mt-3 text-center">
                Escaneá este código desde la app Ping
              </Text>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                icon={<Share2 color="#18181B" size={16} />}
                title="Compartir usuario"
                onPress={handleShare}
              />
            </View>
          )}
        </Card>

        {/* Main Menu */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            General
          </Text>
          <Card className="px-4 py-0">
            <MenuItem
              icon={<Users color="#18181B" size={20} />}
              label="Contactos"
              onPress={() => router.push('/contacts')}
            />
            <MenuDivider />
            <MenuItem
              icon={<MapPin color="#18181B" size={20} />}
              label="Lugares guardados"
              onPress={() => {}}
            />
            <MenuDivider />
            <MenuItem
              icon={<History color="#18181B" size={20} />}
              label="Historial"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Settings Menu */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Configuración
          </Text>
          <Card className="px-4 py-0">
            <MenuItem
              icon={<Bell color="#18181B" size={20} />}
              label="Notificaciones"
              onPress={() => {}}
            />
            <MenuDivider />
            <MenuItem
              icon={<MapPin color="#18181B" size={20} />}
              label="Permisos de ubicación"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Support Menu */}
        <View className="mb-8">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Soporte
          </Text>
          <Card className="px-4 py-0">
            <MenuItem
              icon={<HelpCircle color="#18181B" size={20} />}
              label="Ayuda"
              onPress={() => {}}
            />
            <MenuDivider />
            <MenuItem
              icon={<FileText color="#18181B" size={20} />}
              label="Términos y condiciones"
              onPress={() => {}}
            />
            <MenuDivider />
            <MenuItem
              icon={<Shield color="#18181B" size={20} />}
              label="Privacidad"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <Button
          variant="destructive"
          title="Cerrar sesión"
          icon={<LogOut color="#FFF" size={18} />}
          onPress={handleSignOut}
          className="mb-6"
        />

        <Text className="text-center text-xs text-muted-foreground">
          Versión 1.0.0
        </Text>
      </ScrollView>

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </View>
  );
}
