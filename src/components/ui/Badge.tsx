import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
}

function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-foreground',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    outline: 'bg-transparent border border-border',
  };

  const textVariants = {
    default: 'text-background',
    secondary: 'text-foreground',
    success: 'text-white',
    warning: 'text-white',
    destructive: 'text-white',
    outline: 'text-foreground',
  };

  return (
    <View
      className={cn(
        'px-2.5 py-0.5 rounded-full self-start',
        variants[variant],
        className
      )}
    >
      <Text className={cn('text-xs font-medium', textVariants[variant])}>
        {children}
      </Text>
    </View>
  );
}

export { Badge };
