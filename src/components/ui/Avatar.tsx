import { View, Text, Image } from 'react-native';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        className={cn('rounded-full bg-muted', sizes[size], className)}
      />
    );
  }

  return (
    <View
      className={cn(
        'rounded-full bg-secondary items-center justify-center',
        sizes[size],
        className
      )}
    >
      <Text className={cn('font-semibold text-muted-foreground', textSizes[size])}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

export { Avatar };
