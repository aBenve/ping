import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = [0.5],
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const sheetHeight = SCREEN_HEIGHT * snapPoints[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 150,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Backdrop */}
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity: backdropOpacity }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl"
          style={[
            {
              maxHeight: sheetHeight,
              transform: [{ translateY }],
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Handle */}
          <View
            className="items-center pt-3 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-10 h-1 rounded-full bg-muted" />
          </View>

          {/* Header */}
          {title && (
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-border">
              <Text className="text-lg font-semibold text-foreground">{title}</Text>
              <Pressable
                className="w-8 h-8 rounded-full bg-secondary items-center justify-center"
                onPress={onClose}
              >
                <X color="#18181B" size={18} />
              </Pressable>
            </View>
          )}

          {/* Content */}
          <View className="flex-1">{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
