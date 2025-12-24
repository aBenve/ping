import { View, Text, Pressable, Switch } from 'react-native';
import { Star, Trash2, Check } from 'lucide-react-native';
import { Avatar } from '@/components/ui';
import { ContactWithProfile } from '@/types/database';
import { cn } from '@/lib/utils';

interface ContactItemProps {
  contact: ContactWithProfile;
  onPress?: () => void;
  onToggleTrusted?: (value: boolean) => void;
  onRemove?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  showActions?: boolean;
}

export function ContactItem({
  contact,
  onPress,
  onToggleTrusted,
  onRemove,
  selectable,
  selected,
  onSelect,
  showActions = true,
}: ContactItemProps) {
  const profile = contact.contact;
  const displayName = profile?.full_name || profile?.username || 'Unknown';

  const content = (
    <View className="flex-row items-center py-3 px-4">
      {selectable && (
        <View
          className={cn(
            'w-6 h-6 rounded-full border-2 items-center justify-center mr-3',
            selected ? 'bg-foreground border-foreground' : 'border-border'
          )}
        >
          {selected && <Check color="#FFF" size={14} />}
        </View>
      )}

      <View className="relative">
        <Avatar name={displayName} size="md" />
        {contact.is_trusted && (
          <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-400 items-center justify-center border-2 border-background">
            <Star color="#FFF" size={10} fill="#FFF" />
          </View>
        )}
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-foreground">{displayName}</Text>
        <Text className="text-sm text-muted-foreground">@{profile?.username}</Text>
      </View>

      {showActions && onToggleTrusted && (
        <Pressable
          className={cn(
            'px-3 py-1.5 rounded-full mr-2',
            contact.is_trusted ? 'bg-amber-100' : 'bg-secondary'
          )}
          onPress={() => onToggleTrusted(!contact.is_trusted)}
        >
          <View className="flex-row items-center">
            <Star
              color={contact.is_trusted ? '#F59E0B' : '#A1A1AA'}
              size={14}
              fill={contact.is_trusted ? '#F59E0B' : 'none'}
            />
            <Text
              className={cn(
                'text-xs font-medium ml-1',
                contact.is_trusted ? 'text-amber-600' : 'text-muted-foreground'
              )}
            >
              {contact.is_trusted ? 'Confianza' : 'Normal'}
            </Text>
          </View>
        </Pressable>
      )}

      {showActions && onRemove && (
        <Pressable
          className="w-9 h-9 rounded-full items-center justify-center active:bg-red-50"
          onPress={onRemove}
        >
          <Trash2 color="#EF4444" size={18} />
        </Pressable>
      )}
    </View>
  );

  if (onPress || onSelect) {
    return (
      <Pressable
        onPress={onSelect || onPress}
        className="active:bg-secondary"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
