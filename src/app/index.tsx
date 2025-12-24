import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks';

export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(app)/activity" />;
  }

  return <Redirect href="/(auth)/login" />;
}
