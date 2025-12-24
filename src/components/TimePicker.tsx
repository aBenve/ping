import { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
  initialMinutes?: number;
}

const TIME_OPTIONS = [
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '45 minutos', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1.5 horas', value: 90 },
  { label: '2 horas', value: 120 },
  { label: '3 horas', value: 180 },
  { label: '4 horas', value: 240 },
  { label: '6 horas', value: 360 },
  { label: '12 horas', value: 720 },
  { label: '24 horas', value: 1440 },
];

export function TimePicker({
  visible,
  onClose,
  onConfirm,
  initialMinutes = 60,
}: TimePickerProps) {
  const insets = useSafeAreaInsets();
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);

  const handleConfirm = () => {
    onConfirm(selectedMinutes);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: insets.top + 10 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable
            className="w-10 h-10 items-center justify-center rounded-full"
            onPress={onClose}
          >
            <X color="#18181B" size={24} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            Tiempo de espera
          </Text>
          <View className="w-10" />
        </View>

        {/* Description */}
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-2">
            <Clock color="#18181B" size={20} />
            <Text className="text-base font-medium text-foreground ml-2">
              Fallback de seguridad
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            Si la persona no llega en este tiempo, recibirás una alerta con su
            última ubicación conocida.
          </Text>
        </View>

        {/* Options */}
        <ScrollView className="flex-1 px-4">
          <View className="gap-2">
            {TIME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                className={cn(
                  'py-4 px-4 rounded-xl border',
                  selectedMinutes === option.value
                    ? 'border-foreground bg-secondary'
                    : 'border-border bg-card'
                )}
                onPress={() => setSelectedMinutes(option.value)}
              >
                <Text
                  className={cn(
                    'text-base text-center',
                    selectedMinutes === option.value
                      ? 'font-semibold text-foreground'
                      : 'text-foreground'
                  )}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View
          className="px-4 py-4 border-t border-border"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Button title="Confirmar" onPress={handleConfirm} />
        </View>
      </View>
    </Modal>
  );
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutos`;
  }
  const hours = minutes / 60;
  if (hours === 1) {
    return '1 hora';
  }
  if (Number.isInteger(hours)) {
    return `${hours} horas`;
  }
  return `${hours} horas`;
}
