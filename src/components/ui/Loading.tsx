import { View, ActivityIndicator, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

function Loading({ message, fullScreen = false, className }: LoadingProps) {
  return (
    <View
      className={cn(
        'items-center justify-center p-5',
        fullScreen && 'flex-1 bg-background',
        className
      )}
    >
      <ActivityIndicator size="large" color="#18181B" />
      {message && (
        <Text className="mt-3 text-sm text-muted-foreground">{message}</Text>
      )}
    </View>
  );
}

export { Loading };
