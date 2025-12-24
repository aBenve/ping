import { forwardRef } from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children?: React.ReactNode;
  title?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  className?: string;
  icon?: React.ReactNode;
  testID?: string;
}

const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      title,
      variant = 'default',
      size = 'md',
      disabled = false,
      loading = false,
      onPress,
      className,
      icon,
      testID,
    },
    ref
  ) => {
    const baseStyles =
      'flex-row items-center justify-center rounded-xl active:opacity-80';

    const variants = {
      default: 'bg-foreground',
      secondary: 'bg-secondary',
      outline: 'border border-border bg-transparent',
      ghost: 'bg-transparent',
      destructive: 'bg-destructive',
    };

    const sizes = {
      sm: 'h-9 px-4',
      md: 'h-12 px-6',
      lg: 'h-14 px-8',
      icon: 'h-11 w-11',
    };

    const textVariants = {
      default: 'text-background',
      secondary: 'text-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
      destructive: 'text-white',
    };

    const textSizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      icon: 'text-base',
    };

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        testID={testID}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          disabled && 'opacity-50',
          className
        )}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'default' || variant === 'destructive' ? '#fff' : '#000'}
          />
        ) : (
          <>
            {icon && <View className={title || children ? 'mr-2' : ''}>{icon}</View>}
            {(title || children) && (
              <Text
                className={cn(
                  'font-semibold',
                  textVariants[variant],
                  textSizes[size]
                )}
              >
                {title || children}
              </Text>
            )}
          </>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export { Button };
