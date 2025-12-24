import { View, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

function Card({ children, className, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn(
          'rounded-2xl bg-card border border-border p-4 active:opacity-90',
          className
        )}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cn('rounded-2xl bg-card border border-border p-4', className)}>
      {children}
    </View>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('pb-3', className)}>{children}</View>;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('', className)}>
      {typeof children === 'string' ? (
        <View className="text-lg font-semibold text-foreground">{children}</View>
      ) : (
        children
      )}
    </View>
  );
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('', className)}>{children}</View>;
}

function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn('pt-3 flex-row', className)}>{children}</View>;
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
