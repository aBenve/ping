import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12 px-6', className)}>
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-foreground text-center mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted-foreground text-center mb-4 max-w-[280px]">
          {description}
        </Text>
      )}
      {action && <View className="mt-2">{action}</View>}
    </View>
  );
}

export { EmptyState };
