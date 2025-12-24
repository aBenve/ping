import { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Car, Clock, MapPin, Check, AlertTriangle, Send, X, Hourglass, Trash2, Calendar, User } from 'lucide-react-native';
import { Card, Avatar, Badge, Button, EmptyState, BottomSheet, Dialog, useDialog } from '@/components/ui';
import { useStore } from '@/stores/useStore';
import { useAuth } from '@/hooks';
import { supabase } from '@/lib/supabase';

interface SentRequest {
  id: string;
  to_user: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
  destination_name: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  created_alert_id: string | null;
  alert?: {
    status: string;
    triggered_at: string | null;
  } | null;
}

interface RecentActivity {
  id: string;
  type: 'arrived' | 'my_arrival' | 'fallback' | 'rejected';
  user_name: string;
  destination: string;
  timestamp: string;
  request_id?: string;
}

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeAlert } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SentRequest | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { dialogProps, showConfirm, showSuccess, showError } = useDialog();

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch ALL sent requests (to show pending, accepted, and recently rejected/expired)
    const { data: requests, error: reqError } = await supabase
      .from('requests')
      .select(`
        id,
        destination_name,
        status,
        created_at,
        created_alert_id,
        to_user:profiles!to_user_id(id, username, full_name)
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (reqError) {
      console.error('Error fetching requests:', reqError);
    }

    if (requests) {
      // For accepted requests, fetch alert status
      const requestsWithAlerts = await Promise.all(
        requests.map(async (req: any) => {
          // Handle Supabase returning single object or array for foreign key
          const toUser = Array.isArray(req.to_user) ? req.to_user[0] : req.to_user;

          if (req.created_alert_id) {
            const { data: alert } = await supabase
              .from('alerts')
              .select('status, triggered_at')
              .eq('id', req.created_alert_id)
              .single();
            return { ...req, to_user: toUser, alert };
          }
          return { ...req, to_user: toUser };
        })
      );
      setSentRequests(requestsWithAlerts as SentRequest[]);
    }

    // Fetch recent activity (completed alerts where I'm recipient)
    const { data: recipientAlerts, error: alertError } = await supabase
      .from('alert_recipients')
      .select(`
        notified_at,
        alert:alerts(
          id,
          destination_name,
          status,
          triggered_at,
          user:profiles!user_id(full_name, username)
        )
      `)
      .eq('recipient_id', user.id)
      .not('notified_at', 'is', null)
      .order('notified_at', { ascending: false })
      .limit(10);

    if (alertError) {
      console.error('Error fetching recipient alerts:', alertError);
    }

    if (recipientAlerts) {
      const activities: RecentActivity[] = recipientAlerts
        .filter((r: any) => r.alert && r.alert.status !== 'active')
        .map((r: any) => ({
          id: r.alert.id,
          type: r.alert.status === 'completed' ? 'arrived' : 'fallback',
          user_name: r.alert.user?.full_name || r.alert.user?.username || 'Usuario',
          destination: r.alert.destination_name || 'Destino',
          timestamp: r.alert.triggered_at || r.notified_at || new Date().toISOString(),
        }));
      setRecentActivity(activities);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleOpenDetail = (request: SentRequest) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedRequest(null), 200);
  };

  const handleDeleteRequest = () => {
    if (!selectedRequest) return;

    showConfirm(
      'Eliminar solicitud',
      '¿Estás seguro de que querés eliminar esta solicitud?',
      async () => {
        setDeleting(true);
        try {
          const { error } = await supabase
            .from('requests')
            .delete()
            .eq('id', selectedRequest.id);

          if (error) throw error;

          handleCloseDetail();
          await fetchData();
          showSuccess('Eliminada', 'La solicitud fue eliminada');
        } catch (error: any) {
          showError('Error', error.message || 'No se pudo eliminar la solicitud');
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Separate requests into categories
  const pendingRequests = sentRequests.filter((r) => r.status === 'pending');
  const activeRequests = sentRequests.filter(
    (r) => r.status === 'accepted' && r.alert?.status === 'active'
  );
  const completedRequests = sentRequests.filter(
    (r) => r.status === 'accepted' && r.alert?.status && r.alert.status !== 'active'
  );
  const rejectedRequests = sentRequests.filter(
    (r) => r.status === 'rejected' || r.status === 'expired'
  );

  // Combine all "in course" requests
  const inCourseRequests = [...pendingRequests, ...activeRequests];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-2xl font-bold text-foreground">Actividad</Text>
        <Button
          variant="default"
          size="sm"
          icon={<Plus color="#FFF" size={18} />}
          title="Nueva"
          onPress={() => router.push('/activity/new')}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* In Course Requests Section (Pending + Active) */}
        {inCourseRequests.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              En curso
            </Text>
            <View className="gap-3">
              {inCourseRequests.map((request) => (
                <Pressable key={request.id} onPress={() => handleOpenDetail(request)}>
                  <Card className="p-4">
                    <View className="flex-row items-center">
                      <Avatar
                        name={request.to_user?.full_name || request.to_user?.username}
                        size="lg"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-base font-semibold text-foreground">
                          {request.to_user?.full_name || request.to_user?.username}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          {request.status === 'pending' ? (
                            <>
                              <Hourglass color="#F59E0B" size={14} />
                              <Text className="text-sm text-amber-500 ml-1">
                                Esperando respuesta
                              </Text>
                            </>
                          ) : (
                            <>
                              <Car color="#3B82F6" size={14} />
                              <Text className="text-sm text-blue-500 ml-1">
                                En camino
                              </Text>
                            </>
                          )}
                        </View>
                        {request.destination_name && (
                          <View className="flex-row items-center mt-1">
                            <MapPin color="#A1A1AA" size={14} />
                            <Text className="text-sm text-muted-foreground ml-1">
                              {request.destination_name}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {getTimeAgo(request.created_at)}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Rejected/Expired Requests Section */}
        {rejectedRequests.length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Rechazadas
            </Text>
            <View className="gap-2">
              {rejectedRequests.slice(0, 3).map((request) => (
                <Pressable key={request.id} onPress={() => handleOpenDetail(request)}>
                  <View className="flex-row items-center py-3 px-4 bg-secondary/50 rounded-xl">
                    <Avatar
                      name={request.to_user?.full_name || request.to_user?.username}
                      size="sm"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-sm text-muted-foreground">
                        <Text className="font-medium text-foreground">
                          {request.to_user?.full_name || request.to_user?.username}
                        </Text>
                        {request.status === 'rejected' ? ' rechazó tu solicitud' : ' no respondió a tiempo'}
                      </Text>
                    </View>
                    <X color="#EF4444" size={16} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* My Active Alert */}
        {activeAlert && (
          <View className="px-5 mb-6">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Mi alerta activa
            </Text>
            <Card className="p-4 border-foreground">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-foreground items-center justify-center">
                  <MapPin color="#FFF" size={20} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-semibold text-foreground">
                    {activeAlert.destination_name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {activeAlert.recipients?.length || 0} personas recibirán aviso
                  </Text>
                </View>
                <Button
                  variant="outline"
                  size="sm"
                  title="Cancelar"
                  onPress={() => {/* TODO: cancel alert */}}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View className="px-5">
            <Text className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Reciente
            </Text>
            <View className="gap-2">
              {recentActivity.map((activity) => (
                <View
                  key={activity.id}
                  className="flex-row items-center py-3 border-b border-border"
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      activity.type === 'arrived' ? 'bg-green-100' : 'bg-orange-100'
                    }`}
                  >
                    {activity.type === 'arrived' ? (
                      <Check color="#16A34A" size={16} />
                    ) : (
                      <AlertTriangle color="#EA580C" size={16} />
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-foreground">
                      {activity.type === 'arrived' ? (
                        <>
                          <Text className="font-semibold">{activity.user_name}</Text>
                          {' llegó a '}
                          {activity.destination}
                        </>
                      ) : (
                        <>
                          <Text className="font-semibold">{activity.user_name}</Text>
                          {' no llegó a tiempo'}
                        </>
                      )}
                    </Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">
                    {formatTime(activity.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {inCourseRequests.length === 0 &&
         rejectedRequests.length === 0 &&
         !activeAlert &&
         recentActivity.length === 0 && (
          <EmptyState
            icon={<Send color="#A1A1AA" size={48} />}
            title="No hay actividad"
            description="Pide a alguien que te avise cuando llegue, o crea tu propia alerta"
            action={
              <Button
                title="Crear nueva alerta"
                onPress={() => router.push('/activity/new')}
              />
            }
          />
        )}
      </ScrollView>

      {/* Request Detail Sheet */}
      <BottomSheet
        visible={showDetail}
        onClose={handleCloseDetail}
        title="Detalle de solicitud"
        snapPoints={[0.55]}
      >
        {selectedRequest && (
          <ScrollView className="flex-1 px-5 py-4">
            {/* Contact Info */}
            <View className="flex-row items-center mb-6">
              <Avatar
                name={selectedRequest.to_user?.full_name || selectedRequest.to_user?.username}
                size="xl"
              />
              <View className="flex-1 ml-4">
                <Text className="text-xl font-bold text-foreground">
                  {selectedRequest.to_user?.full_name || selectedRequest.to_user?.username}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  @{selectedRequest.to_user?.username}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View className="flex-row items-center mb-4">
              <View
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  selectedRequest.status === 'pending'
                    ? 'bg-amber-100'
                    : selectedRequest.status === 'accepted'
                    ? 'bg-blue-100'
                    : 'bg-red-100'
                }`}
              >
                {selectedRequest.status === 'pending' && <Hourglass color="#D97706" size={14} />}
                {selectedRequest.status === 'accepted' && <Car color="#3B82F6" size={14} />}
                {(selectedRequest.status === 'rejected' || selectedRequest.status === 'expired') && (
                  <X color="#EF4444" size={14} />
                )}
                <Text
                  className={`text-sm font-medium ml-1 ${
                    selectedRequest.status === 'pending'
                      ? 'text-amber-700'
                      : selectedRequest.status === 'accepted'
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }`}
                >
                  {selectedRequest.status === 'pending' && 'Esperando respuesta'}
                  {selectedRequest.status === 'accepted' && 'En camino'}
                  {selectedRequest.status === 'rejected' && 'Rechazada'}
                  {selectedRequest.status === 'expired' && 'Expirada'}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View className="gap-4">
              {selectedRequest.destination_name && (
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                    <MapPin color="#18181B" size={18} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-muted-foreground">Destino</Text>
                    <Text className="text-base text-foreground">{selectedRequest.destination_name}</Text>
                  </View>
                </View>
              )}

              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                  <Calendar color="#18181B" size={18} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm text-muted-foreground">Enviada</Text>
                  <Text className="text-base text-foreground">{formatDate(selectedRequest.created_at)}</Text>
                </View>
              </View>

              {selectedRequest.alert?.triggered_at && (
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                    <Check color="#16A34A" size={18} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-muted-foreground">Llegó</Text>
                    <Text className="text-base text-foreground">{formatDate(selectedRequest.alert.triggered_at)}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Delete Button */}
            <View className="mt-8">
              <Button
                variant="destructive"
                title="Eliminar solicitud"
                icon={<Trash2 color="#FFF" size={18} />}
                onPress={handleDeleteRequest}
                loading={deleting}
              />
            </View>
          </ScrollView>
        )}
      </BottomSheet>

      {/* Custom Dialog */}
      <Dialog {...dialogProps} />
    </View>
  );
}
