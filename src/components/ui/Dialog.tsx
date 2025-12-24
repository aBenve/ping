import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react-native';
import { Button } from './Button';

const { width } = Dimensions.get('window');

type DialogVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface DialogAction {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'destructive';
}

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: DialogVariant;
  actions?: DialogAction[];
  showCloseButton?: boolean;
}

const variantConfig = {
  default: {
    icon: null,
    iconBg: 'bg-secondary',
    iconColor: '#18181B',
  },
  success: {
    icon: Check,
    iconBg: 'bg-green-100',
    iconColor: '#16A34A',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: '#D97706',
  },
  error: {
    icon: AlertCircle,
    iconBg: 'bg-red-100',
    iconColor: '#DC2626',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: '#2563EB',
  },
};

export function Dialog({
  visible,
  onClose,
  title,
  description,
  variant = 'default',
  actions = [{ label: 'Aceptar', onPress: () => {}, variant: 'default' }],
  showCloseButton = false,
}: DialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleAction = (action: DialogAction) => {
    action.onPress();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center px-6">
        {/* Backdrop */}
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
        />

        {/* Dialog */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            width: width - 48,
            maxWidth: 400,
          }}
          className="bg-background rounded-2xl overflow-hidden shadow-xl"
        >
          {/* Close button */}
          {showCloseButton && (
            <Pressable
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-secondary items-center justify-center"
              onPress={onClose}
            >
              <X color="#A1A1AA" size={18} />
            </Pressable>
          )}

          {/* Content */}
          <View className="p-6">
            {/* Icon */}
            {IconComponent && (
              <View className="items-center mb-4">
                <View className={`w-14 h-14 rounded-full items-center justify-center ${config.iconBg}`}>
                  <IconComponent color={config.iconColor} size={28} />
                </View>
              </View>
            )}

            {/* Title */}
            <Text className="text-xl font-bold text-foreground text-center mb-2">
              {title}
            </Text>

            {/* Description */}
            {description && (
              <Text className="text-base text-muted-foreground text-center leading-6">
                {description}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View className="px-6 pb-6">
            <View className={`${actions.length > 1 ? 'flex-row gap-3' : ''}`}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  title={action.label}
                  variant={action.variant || 'default'}
                  onPress={() => handleAction(action)}
                  className={actions.length > 1 ? 'flex-1' : ''}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Hook for easier dialog management
import { useState, useCallback } from 'react';

interface DialogState {
  visible: boolean;
  title: string;
  description?: string;
  variant?: DialogVariant;
  actions?: DialogAction[];
}

export function useDialog() {
  const [state, setState] = useState<DialogState>({
    visible: false,
    title: '',
  });

  const showDialog = useCallback((options: Omit<DialogState, 'visible'>) => {
    setState({ ...options, visible: true });
  }, []);

  const hideDialog = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((title: string, description?: string, onConfirm?: () => void) => {
    showDialog({
      title,
      description,
      variant: 'success',
      actions: [{ label: 'Aceptar', onPress: onConfirm || (() => {}), variant: 'default' }],
    });
  }, [showDialog]);

  const showError = useCallback((title: string, description?: string) => {
    showDialog({
      title,
      description,
      variant: 'error',
      actions: [{ label: 'Aceptar', onPress: () => {}, variant: 'default' }],
    });
  }, [showDialog]);

  const showConfirm = useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar'
  ) => {
    showDialog({
      title,
      description,
      variant: 'warning',
      actions: [
        { label: cancelLabel, onPress: onCancel || (() => {}), variant: 'outline' },
        { label: confirmLabel, onPress: onConfirm, variant: 'destructive' },
      ],
    });
  }, [showDialog]);

  return {
    dialogProps: {
      ...state,
      onClose: hideDialog,
    },
    showDialog,
    hideDialog,
    showSuccess,
    showError,
    showConfirm,
  };
}
