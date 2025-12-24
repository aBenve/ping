import { useState } from 'react';
import { View, TextInput, Text, TextInputProps, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  className?: string;
  containerClassName?: string;
}

function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  className,
  containerClassName,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>
      )}

      <View
        className={cn(
          'flex-row items-center bg-secondary border border-border rounded-xl min-h-[48px]',
          isFocused && 'border-foreground bg-background',
          error && 'border-destructive'
        )}
      >
        {leftIcon && <View className="pl-3">{leftIcon}</View>}

        <TextInput
          className={cn(
            'flex-1 text-base text-foreground px-4 py-3',
            leftIcon && 'pl-2',
            rightIcon && 'pr-2',
            className
          )}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            className="pr-3"
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {error && <Text className="text-xs text-destructive mt-1">{error}</Text>}
      {hint && !error && (
        <Text className="text-xs text-muted-foreground mt-1">{hint}</Text>
      )}
    </View>
  );
}

export { Input };
