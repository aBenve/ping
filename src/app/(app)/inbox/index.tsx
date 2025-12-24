import { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inbox as InboxIcon, MapPin, MessageSquare, Check, X, Radio, Navigation, User } from 'lucide-react-native';
import { Card, Avatar, Button, EmptyState, Badge, Dialog, useDialog } from '@/components/ui';
import { useAuth, useRequests, useGeofencing } from '@/hooks';
import { supabase } from '@/lib/supabase';

interface MyActiveAlert {
  id: string;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  status: string;
  created_at: string;
  recipients: {
    recipient: {
      id: string;
      username: string;
      full_name: string | null;
    };
  }[];
}

export default function InboxScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { pendingRequests, fetchPendingRequests, respondToRequest } = useRequests();
  const { startGeofencing, stopGeofencing } = useGeofencing();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [myActiveAlerts, setMyActiveAlerts] = useState<MyActiveAlert[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { dialogProps, showSuccess, showError, showConfirm } = useDialog();

  const fetchMyActiveAlerts = useCallback(async () => {
    if (!user) return;

    // Fetch alerts where I am the user (person being tracked)
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        id,
        destination_name,
        destination_lat,
        destination_lng,
        status,
        created_at,
        recipients:alert_recipients(
          recipient:profiles!recipient_id(id, username, full_name)
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my active alerts:', error);
      return;
    }

    if (data) {
      setMyActiveAlerts(data as MyActiveAlert[]);
    }
  }, [user]);

  useEffect(() => {
    fetchPendingRequests();
    fetchMyActiveAlerts();
  }, [fetchPendingRequests, fetchMyActiveAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPendingRequests(), fetchMyActiveAlerts()]);
    setRefreshing(false);
  };

  const handleCancelAlert = async (alertId: string) => {
    showConfirm(
      'Cancelar alerta',
      '¿Estás seguro de que quieres cancelar esta alerta? Ya no te van a monitorear.',
      async () => {
        setCancellingId(alertId);
        try {
          // Stop geofencing first
          await stopGeofencing();

          const { error } = await supabase
            .from('alerts')
            .update({ status: 'cancelled' })
            .eq('id', alertId);

          if (error) throw error;
          await fetchMyActiveAlerts();
        } catch (error: any) {
          showError('Error', error.message || 'No se pudo cancelar la alerta');
        } finally {
          setCancellingId(null);
        }
      },
      undefined,
      'Sí, cancelar',
      'No'
    );
  };

  const handleAccept = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      const result = await respondToRequest(requestId, 'accept');

      // Start geofencing if we have valid location data
      if (result.alert && result.alert.destination_lat !== 0 && result.alert.destination_lng !== 0) {
        try {
          await startGeofencing({
            alertId: result.alert.id,
            latitude: result.alert.destination_lat,
            longitude: result.alert.destination_lng,
            radius: result.alert.destination_radius,
          });
        } catch (geoError: any) {
          console.error('Error starting geofencing:', geoError);
          // Show warning but don't fail the whole operation
          showError(
            'Permisos de ubicación',
            'No pudimos iniciar el monitoreo de ubicación. Asegurate de tener los permisos activados.'
          );
          return;
        }
      }

      await fetchMyActiveAlerts();
      showSuccess('Solicitud aceptada', 'Tu ubicación será monitoreada hasta que llegues al destino.');
    } catch (error: any) {
      showError('Error', error.message || 'No se pudo aceptar la solicitud');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    showConfirm(
      'Rechazar solicitud',
      '¿Estás seguro de que quieres rechazar esta solicitud?',
      async () => {
        setLoadingId(requestId);
        try {
          await respondToRequest(requestId, 'reject');
        } catch (error: any) {
          showError('Error', error.message || 'No se pudo rechazar la solicitud');
        } finally {
          setLoadingId(null);
        }
      },
      undefined,
      'Rechazar',
      'Cancelar'
    );
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-foreground">Inbox</Text>
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* My Active Alerts - alerts where others are tracking me */}
        {myActiveAlerts.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Te están monitoreando
            </Text>
            <View className="gap-3">
              {myActiveAlerts.map((alert) => {
                const recipientNames = alert.recipients
                  .map((r) => r.recipient?.full_name || r.recipient?.username)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <Card key={alert.id} className="p-4 border-blue-500 bg-blue-50">
                    <View className="flex-row items-start">
                      <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center">
                        <Radio color="#FFF" size={20} />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-base font-semibold text-foreground">
                          Alerta activa
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin color="#3B82F6" size={14} />
                          <Text className="text-sm text-blue-600 ml-1">
                            {alert.destination_name}
                          </Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <User color="#A1A1AA" size={14} />
                          <Text className="text-sm text-muted-foreground ml-1">
                            {recipientNames || 'Sin destinatarios'} recibirá aviso
                          </Text>
                        </View>

                        <View className="flex-row gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            title="Cancelar alerta"
                            onPress={() => handleCancelAlert(alert.id)}
                            loading={cancellingId === alert.id}
                            disabled={cancellingId === alert.id}
                          />
                        </View>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Solicitudes pendientes
            </Text>
            <View className="gap-3">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <View className="flex-row items-start">
                    <Avatar
                      name={request.from_user?.full_name || request.from_user?.username}
                      size="lg"
                    />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-semibold text-foreground">
                          {request.from_user?.full_name || request.from_user?.username}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {getTimeAgo(request.created_at)}
                        </Text>
                      </View>
                      <Text className="text-sm text-muted-foreground mt-0.5">
                        Te pide que avises cuando llegues
                      </Text>

                      {request.destination_name && (
                        <View className="flex-row items-center mt-2">
                          <MapPin color="#A1A1AA" size={14} />
                          <Text className="text-sm text-foreground ml-1">
                            {request.destination_name}
                          </Text>
                        </View>
                      )}

                      {request.message && (
                        <View className="flex-row items-start mt-2 bg-secondary p-2 rounded-lg">
                          <MessageSquare color="#A1A1AA" size={14} />
                          <Text className="text-sm text-muted-foreground ml-2 flex-1">
                            "{request.message}"
                          </Text>
                        </View>
                      )}

                      {/* Action buttons */}
                      <View className="flex-row gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          icon={<X color="#18181B" size={16} />}
                          title="Rechazar"
                          onPress={() => handleReject(request.id)}
                          disabled={loadingId === request.id}
                        />
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          icon={<Check color="#FFF" size={16} />}
                          title="Aceptar"
                          onPress={() => handleAccept(request.id)}
                          loading={loadingId === request.id}
                          disabled={loadingId === request.id}
                        />
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {pendingRequests.length === 0 && myActiveAlerts.length === 0 && (
          <EmptyState
            icon={<InboxIcon color="#A1A1AA" size={48} />}
            title="No hay nada aquí"
            description="Cuando alguien te pida que avises cuando llegues, o tengas alertas activas, aparecerán aquí"
          />
        )}
      </ScrollView>

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </View>
  );
}
