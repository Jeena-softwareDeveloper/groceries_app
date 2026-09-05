import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Area, District } from '@shared/types';
import { customerApi } from '@/api';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { persistLocation, persistGPSLocation } from '@/hooks/useBootstrap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLocation, setGPSLocation, setShowLocationModal } from '@/store/locationSlice';
import * as Location from 'expo-location';
import { resolveAddressFromCoords } from '@/utils/geocode';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationScreenProps {
  isModalComponent?: boolean;
  onClose?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocationScreen({ isModalComponent = false, onClose }: LocationScreenProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { districtId, latitude, longitude, displayName } = useAppSelector((s) => s.location);
  const hasLocation = !!districtId || !!latitude;

  // State
  const [step, setStep] = useState<'home' | 'district' | 'area'>('home');
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [districtSearch, setDistrictSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsResult, setGpsResult] = useState<{ districtName: string; areaName: string } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Slide-up animation for the sheet
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);

  // Block Android hardware back button if location is mandatory and not set
  useEffect(() => {
    if (!hasLocation) {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (step !== 'home') {
          setStep('home');
          return true;
        }
        return true;
      });
      return () => subscription.remove();
    }
  }, [hasLocation, step]);

  // Queries
  const districtsQuery = useQuery({
    queryKey: ['districts'],
    queryFn: customerApi.fetchDistricts,
  });
  const areasQuery = useQuery({
    queryKey: ['areas', selectedDistrict?.id],
    queryFn: () => customerApi.fetchAreas(selectedDistrict!.id),
    enabled: !!selectedDistrict,
  });

  // Filtered lists
  const filteredDistricts = (districtsQuery.data || []).filter((d) =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );
  const filteredAreas = (areasQuery.data || []).filter((a) =>
    a.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  function handleClose(force = false) {
    if (!hasLocation && !force) return;
    if (onClose) onClose();
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  async function handleConfirm(district: District, area: Area) {
    const payload = {
      districtId: district.id,
      districtName: district.name,
      areaId: area.id,
      areaName: area.name,
      latitude: area.latitude ?? district.latitude ?? null,
      longitude: area.longitude ?? district.longitude ?? null,
    };
    await persistLocation(payload);
    dispatch(setLocation(payload));
    dispatch(setShowLocationModal(false));
    handleClose(true);
  }

  async function handleManualAddressConfirm() {
    const trimmed = manualAddress.trim();
    if (!trimmed) return;
    
    setIsLocating(true);
    setGpsError('');
    try {
      const results = await Location.geocodeAsync(trimmed);
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        await persistGPSLocation({ latitude, longitude, displayName: trimmed });
        dispatch(setGPSLocation({ latitude, longitude, displayName: trimmed }));
        dispatch(setShowLocationModal(false));
        handleClose(true);
      } else {
        setGpsError('Could not find this address. Please try again.');
      }
    } catch (e) {
      setGpsError('Network error. Please select from the list.');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleGPS() {
    setIsLocating(true);
    setGpsError('');
    setGpsResult(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Location permission denied. Please select manually.');
        setIsLocating(false);
        return;
      }

      // Check if location services are turned on in device settings
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        setGpsError('Please turn on GPS/Location services in device settings.');
        setIsLocating(false);
        return;
      }

      // Fresh high-accuracy GPS fix; fall back to last known if the satellite lock is slow
      let loc: Location.LocationObject | null = null;
      try {
        loc = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('GPS timeout')), 12000)
          ),
        ]);
      } catch {
        loc = await Location.getLastKnownPositionAsync();
      }

      if (!loc) {
        setGpsError('Could not get GPS. Please try again or select manually.');
        setIsLocating(false);
        return;
      }

      const accuracy = loc.coords.accuracy ?? 999;
      if (accuracy > 150) {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown && (lastKnown.coords.accuracy ?? 999) < accuracy) {
          loc = lastKnown;
        }
      }

      const userLat = loc.coords.latitude;
      const userLng = loc.coords.longitude;

      const displayName = await resolveAddressFromCoords(userLat, userLng);

      // ── Step 2: Store GPS location directly (no DB lookup needed) ──────────
      await persistGPSLocation({ latitude: userLat, longitude: userLng, displayName });
      dispatch(setGPSLocation({ latitude: userLat, longitude: userLng, displayName }));
      dispatch(setShowLocationModal(false));
      setGpsResult({ districtName: '', areaName: displayName });
      setTimeout(() => handleClose(true), 1200);
    } catch (e) {
      console.error('[GPS Error]', e);
      setGpsError('GPS detection failed. Please select manually.');
    } finally {
      setIsLocating(false);
    }
  }

  // ─── Sub-screens ─────────────────────────────────────────────────────────────

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.sheetBody} style={{ flexGrow: 0 }} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Delivery Location</Text>
            <Text style={styles.sheetSubtitle}>
              {hasLocation ? 'Where should we deliver?' : 'Select location to continue'}
            </Text>
          </View>
          {hasLocation && (
            <Pressable onPress={() => handleClose()} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* GPS Button */}
        <Pressable
          style={[styles.gpsBtn, isLocating && { opacity: 0.7 }]}
          onPress={handleGPS}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : gpsResult ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.white} />
          ) : (
            <Ionicons name="locate" size={22} color={colors.white} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsBtnText}>
              {isLocating
                ? 'Detecting your location…'
                : gpsResult
                ? `${gpsResult.areaName}, ${gpsResult.districtName}`
                : 'Use Current Location'}
            </Text>
            {!isLocating && !gpsResult && (
              <Text style={styles.gpsBtnSub}>Auto-detect via GPS</Text>
            )}
          </View>
          {!isLocating && !gpsResult && (
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
          )}
        </Pressable>

        {gpsError ? (
          <Text style={styles.gpsError}>{gpsError}</Text>
        ) : null}

        {latitude && longitude && displayName && !isLocating && !gpsResult && !gpsError ? (
          <View style={styles.currentLocationBox}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.currentLocationText} numberOfLines={2}>
              {displayName}
            </Text>
          </View>
        ) : null}

        {/* Manual Address Input */}
        {!showManualInput ? (
          <Pressable
            style={styles.manualAddressToggle}
            onPress={() => setShowManualInput(true)}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
            <Text style={styles.manualAddressToggleText}>Type your address manually</Text>
          </Pressable>
        ) : (
          <View style={styles.manualAddressBox}>
            <Text style={styles.fieldLabel}>Your Address</Text>
            <View style={styles.manualInputRow}>
              <TextInput
                style={styles.manualInput}
                placeholder="e.g. Anna Nagar, Chennai"
                placeholderTextColor={colors.textMuted}
                value={manualAddress}
                onChangeText={setManualAddress}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleManualAddressConfirm}
              />
              {manualAddress.length > 0 && (
                <Pressable
                  style={styles.manualConfirmBtn}
                  onPress={handleManualAddressConfirm}
                >
                  <Feather name="check" size={18} color="#fff" />
                </Pressable>
              )}
            </View>
            <Pressable onPress={() => { setShowManualInput(false); setManualAddress(''); }}>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, fontFamily: fonts.regular }}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or select manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* District selector */}
        <Text style={styles.fieldLabel}>District</Text>
        <Pressable
          style={styles.selectorBox}
          onPress={() => { setDistrictSearch(''); setStep('district'); }}
        >
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={[styles.selectorText, !selectedDistrict && styles.placeholder]}>
            {selectedDistrict ? selectedDistrict.name : 'Select district…'}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Area selector */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Area / Locality</Text>
        <Pressable
          style={[styles.selectorBox, !selectedDistrict && styles.selectorDisabled]}
          onPress={() => {
            if (!selectedDistrict) return;
            setAreaSearch('');
            setStep('area');
          }}
        >
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={18}
            color={selectedDistrict ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.selectorText, !selectedArea && styles.placeholder]}>
            {selectedArea ? selectedArea.name : 'Select area…'}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>

        {/* Confirm button */}
        <Pressable
          style={[
            styles.confirmBtn,
            (!selectedDistrict || !selectedArea) && styles.confirmDisabled,
          ]}
          onPress={() => selectedDistrict && selectedArea && handleConfirm(selectedDistrict, selectedArea)}
          disabled={!selectedDistrict || !selectedArea}
        >
          <Text style={styles.confirmText}>
            {selectedDistrict && selectedArea
              ? `Deliver to ${selectedArea.name}, ${selectedDistrict.name}`
              : 'Confirm Location'}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.white} />
        </Pressable>
      </ScrollView>
    );
  }

  function renderDistrictPicker() {
    return (
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Pressable onPress={() => setStep('home')} style={styles.backBtn} hitSlop={10}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.pickerTitle}>Select District</Text>
        </View>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search district…"
            placeholderTextColor={colors.textMuted}
            value={districtSearch}
            onChangeText={setDistrictSearch}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {districtSearch.length > 0 && (
            <Pressable onPress={() => setDistrictSearch('')} hitSlop={8}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {districtsQuery.isLoading ? (
          <LoadingState fullScreen={false} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.listContent}
          >
            {filteredDistricts.map((d) => (
              <Pressable
                key={d.id}
                style={styles.listItem}
                onPress={() => {
                  setSelectedDistrict(d);
                  setSelectedArea(null);
                  setStep('home');
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={selectedDistrict?.id === d.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.listItemText,
                    selectedDistrict?.id === d.id && { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  {d.name}
                </Text>
                {selectedDistrict?.id === d.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
            {filteredDistricts.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No districts found for "{districtSearch}"</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  function renderAreaPicker() {
    return (
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <Pressable onPress={() => setStep('home')} style={styles.backBtn} hitSlop={10}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.pickerTitle}>Select Area</Text>
            {selectedDistrict && (
              <Text style={styles.pickerSubtitle}>in {selectedDistrict.name}</Text>
            )}
          </View>
        </View>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search area in ${selectedDistrict?.name || ''}…`}
            placeholderTextColor={colors.textMuted}
            value={areaSearch}
            onChangeText={setAreaSearch}
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {areaSearch.length > 0 && (
            <Pressable onPress={() => setAreaSearch('')} hitSlop={8}>
              <Feather name="x-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {areasQuery.isLoading ? (
          <LoadingState fullScreen={false} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.listContent}
          >
            {filteredAreas.map((a) => (
              <Pressable
                key={a.id}
                style={styles.listItem}
                onPress={() => {
                  setSelectedArea(a);
                  setStep('home');
                }}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={18}
                  color={selectedArea?.id === a.id ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.listItemText,
                    selectedArea?.id === a.id && { color: colors.primary, fontFamily: fonts.bold },
                  ]}
                >
                  {a.name}
                </Text>
                {selectedArea?.id === a.id && (
                  <Feather name="check" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
            {filteredAreas.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No areas found for "{areaSearch}"</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const content =
    step === 'district'
      ? renderDistrictPicker()
      : step === 'area'
      ? renderAreaPicker()
      : renderHome();

  if (isModalComponent) {
    return (
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (hasLocation) handleClose();
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <Animated.View
            style={[
              styles.sheet,
              step !== 'home' && styles.sheetExpanded,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {content}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeFull}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  sheetExpanded: {
    height: '88%',
    maxHeight: '92%',
  },
  safeFull: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Home step ──
  sheetBody: {
    padding: spacing.lg,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },

  // GPS
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  gpsBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#fff',
  },
  gpsBtnSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  gpsError: {
    fontSize: 13,
    color: colors.error,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  currentLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebfdf5', // slight green tint
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  currentLocationText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#065f46',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  // Selector
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
    backgroundColor: '#FAFAFA',
  },
  selectorDisabled: {
    opacity: 0.45,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  placeholder: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
  },

  // Confirm button
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: spacing.xl,
    gap: spacing.sm,
    elevation: 2,
  },
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: '#fff',
  },

  // ── Picker steps ──
  pickerSheet: {
    flex: 1,
    minHeight: 450,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  pickerSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  listContent: {
    paddingBottom: 60,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: spacing.md,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  
  // Manual Address Input Styles
  manualAddressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  manualAddressToggleText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  manualAddressBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  manualConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

