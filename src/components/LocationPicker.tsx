import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { X, Search, MapPin, Navigation, ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui';
import { useGeofencing } from '@/hooks';
import { cn } from '@/lib/utils';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface LocationResult {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface SelectedLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (location: SelectedLocation) => void;
  initialLocation?: SelectedLocation | null;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const RADIUS_OPTIONS = [50, 100, 200, 500];

export function LocationPicker({
  visible,
  onClose,
  onConfirm,
  initialLocation,
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const { getCurrentLocation } = useGeofencing();

  const [mode, setMode] = useState<'map' | 'search'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState(initialLocation?.name || '');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLocation
      ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
      : null
  );
  const [radius, setRadius] = useState(initialLocation?.radius || 100);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || -34.6037,
    longitude: initialLocation?.longitude || -58.3816,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });

  useEffect(() => {
    if (visible && !initialLocation) {
      loadCurrentLocation();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setMode('map');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible]);

  const loadCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.log('Could not get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Reverse geocode to get address name
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const addr = results[0];
        const addressParts = [];
        if (addr.street) addressParts.push(addr.street);
        if (addr.streetNumber) addressParts[0] = `${addr.street} ${addr.streetNumber}`;
        if (addr.city) addressParts.push(addr.city);

        const addressName = addressParts.join(', ') || 'Ubicación seleccionada';
        setLocationName(addressName);
      }
    } catch (error) {
      console.log('Could not reverse geocode');
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      setSelectedLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Reverse geocode
      const results = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (results && results.length > 0) {
        const addr = results[0];
        setLocationName(addr.name || addr.street || 'Mi ubicación actual');
      } else {
        setLocationName('Mi ubicación actual');
      }

      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Search effect with debounce
  useEffect(() => {
    if (debouncedSearchQuery.length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const searchPlaces = async () => {
      setSearching(true);
      try {
        // Use Expo's Location.geocodeAsync for forward geocoding
        const results = await Location.geocodeAsync(debouncedSearchQuery);

        if (results && results.length > 0) {
          // For each result, get the address using reverse geocoding
          const locationResults: LocationResult[] = await Promise.all(
            results.slice(0, 5).map(async (result) => {
              try {
                const addresses = await Location.reverseGeocodeAsync({
                  latitude: result.latitude,
                  longitude: result.longitude,
                });

                const addr = addresses[0];
                const name = addr?.name || addr?.street || debouncedSearchQuery;
                const addressParts = [];
                if (addr?.street) addressParts.push(addr.street);
                if (addr?.streetNumber) addressParts[0] = `${addr.street} ${addr.streetNumber}`;
                if (addr?.city) addressParts.push(addr.city);
                if (addr?.region) addressParts.push(addr.region);
                if (addr?.country) addressParts.push(addr.country);

                return {
                  name,
                  latitude: result.latitude,
                  longitude: result.longitude,
                  address: addressParts.join(', ') || `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
                };
              } catch {
                return {
                  name: debouncedSearchQuery,
                  latitude: result.latitude,
                  longitude: result.longitude,
                  address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
                };
              }
            })
          );

          setSearchResults(locationResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.log('Geocoding error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    searchPlaces();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
      setSearching(true);
    }
  };

  const handleSelectSearchResult = (result: LocationResult) => {
    setSelectedLocation({
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setLocationName(result.name);

    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);

    setMode('map');
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Seleccioná una ubicación en el mapa');
      return;
    }

    onConfirm({
      name: locationName.trim() || 'Ubicación seleccionada',
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      radius,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Pressable
            className="w-10 h-10 items-center justify-center rounded-full"
            onPress={mode === 'search' ? () => setMode('map') : onClose}
          >
            {mode === 'search' ? (
              <ChevronLeft color="#18181B" size={24} />
            ) : (
              <X color="#18181B" size={24} />
            )}
          </Pressable>

          {mode === 'map' ? (
            <Pressable
              className="flex-1 flex-row items-center bg-secondary rounded-xl px-3 py-2.5 ml-2"
              onPress={() => {
                setMode('search');
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <Search color="#A1A1AA" size={18} />
              <Text className="flex-1 text-base text-muted-foreground ml-2">
                Buscar dirección...
              </Text>
            </Pressable>
          ) : (
            <View className="flex-1 flex-row items-center bg-secondary rounded-xl px-3 ml-2">
              <Search color="#A1A1AA" size={18} />
              <TextInput
                ref={searchInputRef}
                className="flex-1 py-2.5 px-2 text-base text-foreground"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                placeholderTextColor="#A1A1AA"
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoFocus
                returnKeyType="search"
              />
              {searching && <ActivityIndicator size="small" color="#A1A1AA" />}
            </View>
          )}
        </View>

        {mode === 'search' ? (
          // Search Results
          <View className="flex-1">
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
                renderItem={({ item }) => (
                  <Pressable
                    className="flex-row items-start px-4 py-4 border-b border-border active:bg-secondary"
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                      <MapPin color="#18181B" size={18} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-base font-medium text-foreground" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={2}>
                        {item.address}
                      </Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={
                  searchQuery.length >= 3 && !searching ? (
                    <View className="items-center py-12">
                      <Text className="text-muted-foreground">No se encontraron resultados</Text>
                    </View>
                  ) : null
                }
              />
            ) : (
              <View className="px-4 py-6">
                <Pressable
                  className="flex-row items-center py-4 border-b border-border"
                  onPress={() => {
                    handleUseCurrentLocation();
                    setMode('map');
                  }}
                >
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                    <Navigation color="#3B82F6" size={18} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-medium text-foreground">
                      Usar mi ubicación actual
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      Detectar automáticamente
                    </Text>
                  </View>
                </Pressable>

                {searchQuery.length > 0 && searchQuery.length < 3 && (
                  <Text className="text-sm text-muted-foreground text-center mt-6">
                    Escribí al menos 3 caracteres para buscar
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          // Map View
          <>
            <View className="flex-1">
              <MapView
                ref={mapRef}
                style={{ flex: 1, width: '100%', height: '100%' }}
                initialRegion={region}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
                mapType="standard"
              >
                {selectedLocation && (
                  <>
                    <Marker
                      coordinate={selectedLocation}
                      draggable
                      onDragEnd={(e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        setSelectedLocation({ latitude, longitude });
                        // Reverse geocode new position
                        Location.reverseGeocodeAsync({ latitude, longitude }).then((results) => {
                          if (results && results.length > 0) {
                            const addr = results[0];
                            const addressParts = [];
                            if (addr.street) addressParts.push(addr.street);
                            if (addr.streetNumber) addressParts[0] = `${addr.street} ${addr.streetNumber}`;
                            if (addr.city) addressParts.push(addr.city);
                            setLocationName(addressParts.join(', ') || 'Ubicación seleccionada');
                          }
                        });
                      }}
                    />
                    <Circle
                      center={selectedLocation}
                      radius={radius}
                      fillColor="rgba(24, 24, 27, 0.1)"
                      strokeColor="rgba(24, 24, 27, 0.3)"
                      strokeWidth={2}
                    />
                  </>
                )}
              </MapView>

              {/* Use Current Location Button */}
              <Pressable
                className="absolute top-4 right-4 w-12 h-12 bg-background rounded-full items-center justify-center shadow-lg border border-border"
                onPress={handleUseCurrentLocation}
                disabled={loading}
              >
                <Navigation color="#18181B" size={22} />
              </Pressable>

              {/* Instructions or Selected Location Info */}
              {!selectedLocation ? (
                <View className="absolute top-4 left-4 right-20 bg-background/95 rounded-xl p-3 border border-border">
                  <Text className="text-sm text-foreground">
                    Tocá en el mapa para seleccionar la ubicación
                  </Text>
                </View>
              ) : (
                <View className="absolute top-4 left-4 right-20 bg-background/95 rounded-xl p-3 border border-border">
                  <View className="flex-row items-center">
                    <MapPin color="#18181B" size={16} />
                    <Text className="text-sm font-medium text-foreground ml-2 flex-1" numberOfLines={1}>
                      {locationName || 'Ubicación seleccionada'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Controls */}
            <View
              className="px-4 py-4 border-t border-border bg-background"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              {/* Optional Name Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Nombre (opcional)
                </Text>
                <View className="flex-row items-center bg-secondary rounded-xl px-3">
                  <MapPin color="#A1A1AA" size={18} />
                  <TextInput
                    className="flex-1 py-3 px-2 text-base text-foreground"
                    placeholder="Ej: Casa, Trabajo, Gimnasio"
                    placeholderTextColor="#A1A1AA"
                    value={locationName}
                    onChangeText={setLocationName}
                  />
                </View>
              </View>

              {/* Radius Selector */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Radio de detección
                </Text>
                <View className="flex-row items-center justify-between bg-secondary rounded-xl p-1">
                  {RADIUS_OPTIONS.map((r) => (
                    <Pressable
                      key={r}
                      className={cn(
                        'flex-1 py-2.5 rounded-lg items-center',
                        radius === r && 'bg-foreground'
                      )}
                      onPress={() => setRadius(r)}
                    >
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          radius === r ? 'text-background' : 'text-foreground'
                        )}
                      >
                        {r}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Confirm Button */}
              <Button
                title="Confirmar ubicación"
                onPress={handleConfirm}
                disabled={!selectedLocation}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
