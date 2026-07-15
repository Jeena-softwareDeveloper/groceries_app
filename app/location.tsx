import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { Area, District } from '@shared/types';
import { customerApi } from '@/api';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { persistLocation } from '@/hooks/useBootstrap';
import { useAppDispatch } from '@/store/hooks';
import { setLocation } from '@/store/locationSlice';

const mapIllustration = require('@/assets/images/map-illustration.png');

export default function LocationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [mode, setMode] = useState<'manual' | 'current'>('manual');
  
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  const districtsQuery = useQuery({ queryKey: ['districts'], queryFn: customerApi.fetchDistricts });
  const areasQuery = useQuery({
    queryKey: ['areas', selectedDistrict?.id],
    queryFn: () => customerApi.fetchAreas(selectedDistrict!.id),
    enabled: !!selectedDistrict,
  });

  async function handleConfirm() {
    if (!selectedDistrict || !selectedArea) return;
    const payload = {
      districtId: selectedDistrict.id,
      districtName: selectedDistrict.name,
      areaId: selectedArea.id,
      areaName: selectedArea.name,
    };
    await persistLocation(payload);
    dispatch(setLocation(payload));
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : null}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose Location</Text>
        <Pressable style={styles.targetBtn}>
          <Feather name="crosshair" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View style={styles.heroRow}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Where should{"\n"}we <Text style={{ color: colors.primary }}>deliver?</Text></Text>
            <Text style={styles.heroSubtitle}>Select your district and area to see nearby stores</Text>
          </View>
          <View style={styles.heroImgCol}>
            <Image source={mapIllustration} style={styles.heroImg} resizeMode="contain" />
          </View>
        </View>

        {/* SEGMENTED TOGGLE */}
        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleBtn, mode === 'manual' && styles.toggleBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Feather name="map" size={16} color={mode === 'manual' ? colors.white : colors.text} />
            <Text style={[styles.toggleText, mode === 'manual' && styles.toggleTextActive]}>By Location</Text>
          </Pressable>
          <Pressable 
            style={[styles.toggleBtn, mode === 'current' && styles.toggleBtnActive]}
            onPress={() => setMode('current')}
          >
            <Feather name="map-pin" size={16} color={mode === 'current' ? colors.white : colors.text} />
            <Text style={[styles.toggleText, mode === 'current' && styles.toggleTextActive]}>By Current Location</Text>
          </Pressable>
        </View>

        {/* SELECTION FORM */}
        <View style={styles.formContainer}>
          {/* District */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="office-building" size={20} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.inputLabel}>District</Text>
                <Text style={styles.inputHint}>Select your district</Text>
              </View>
            </View>
            <Pressable style={styles.selectorBox} onPress={() => setShowDistrictModal(true)}>
              <View style={styles.selectorLeft}>
                <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} style={styles.selectorIcon} />
                <Text style={[styles.selectorText, !selectedDistrict && { color: colors.textMuted }]}>
                  {selectedDistrict ? selectedDistrict.name : 'Select a district...'}
                </Text>
              </View>
              <Feather name="chevron-down" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Area */}
          <View style={styles.inputGroup}>
            <View style={styles.inputHeader}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.primaryDark} />
              </View>
              <View>
                <Text style={styles.inputLabel}>Area</Text>
                <Text style={styles.inputHint}>Select your area</Text>
              </View>
            </View>
            <Pressable 
              style={[styles.selectorBox, !selectedDistrict && styles.selectorDisabled]} 
              onPress={() => selectedDistrict && setShowAreaModal(true)}
            >
              <View style={styles.selectorLeft}>
                <MaterialCommunityIcons name="office-building-marker" size={20} color={!selectedDistrict ? colors.textMuted : colors.primary} style={styles.selectorIcon} />
                <Text style={[styles.selectorText, !selectedArea && { color: colors.textMuted }]}>
                  {selectedArea ? selectedArea.name : 'Select an area...'}
                </Text>
              </View>
              <Feather name="chevron-down" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* NEARBY AREAS */}
        {selectedDistrict && (
          <View style={styles.nearbySection}>
            <Text style={styles.nearbyTitle}>Nearby areas</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
              {(areasQuery.data || []).slice(0, 4).map(a => (
                <Pressable key={a.id} style={styles.nearbyChip} onPress={() => setSelectedArea(a)}>
                  <MaterialCommunityIcons name="map-marker" size={14} color={colors.primaryDark} />
                  <Text style={styles.nearbyChipText}>{a.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CONFIRMATION BANNER */}
        {selectedDistrict && selectedArea && (
          <View style={styles.confirmBanner}>
            <MaterialCommunityIcons name="store" size={32} color={colors.primaryDark} style={styles.bannerIcon} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerSubtitle}>Showing stores that deliver to</Text>
              <Text style={styles.bannerTitle}>{selectedDistrict.name}, {selectedArea.name}</Text>
            </View>
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.primaryDark} />
          </View>
        )}

        {/* CONTINUE BUTTON */}
        <Pressable 
          style={[styles.continueBtn, (!selectedDistrict || !selectedArea) && styles.continueDisabled]} 
          onPress={handleConfirm}
          disabled={!selectedDistrict || !selectedArea}
        >
          <Feather name="map" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
          <Text style={styles.continueText}>Continue</Text>
          <Feather name="arrow-right" size={20} color={colors.white} style={{ marginLeft: spacing.sm }} />
        </Pressable>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={styles.footerText}>We'll help you find the best shops near you</Text>
        </View>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={showDistrictModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <Pressable onPress={() => setShowDistrictModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>
            {districtsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
            ) : (
              <ScrollView>
                {districtsQuery.data?.map(d => (
                  <Pressable 
                    key={d.id} 
                    style={styles.modalItem} 
                    onPress={() => {
                      setSelectedDistrict(d);
                      setSelectedArea(null);
                      setShowDistrictModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, selectedDistrict?.id === d.id && { color: colors.primary, fontFamily: fonts.bold }]}>{d.name}</Text>
                    {selectedDistrict?.id === d.id && <Feather name="check" size={20} color={colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showAreaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Area</Text>
              <Pressable onPress={() => setShowAreaModal(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </Pressable>
            </View>
            {areasQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 40 }} />
            ) : (
              <ScrollView>
                {areasQuery.data?.map(a => (
                  <Pressable 
                    key={a.id} 
                    style={styles.modalItem} 
                    onPress={() => {
                      setSelectedArea(a);
                      setShowAreaModal(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, selectedArea?.id === a.id && { color: colors.primary, fontFamily: fonts.bold }]}>{a.name}</Text>
                    {selectedArea?.id === a.id && <Feather name="check" size={20} color={colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  backBtn: { padding: spacing.xs },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  targetBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, paddingBottom: 60 },
  
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  heroTextCol: { flex: 1, paddingRight: spacing.md },
  heroTitle: { fontSize: 26, fontFamily: fonts.bold, color: colors.text, lineHeight: 32 },
  heroSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18, fontFamily: fonts.regular },
  heroImgCol: { width: 140, height: 120 },
  heroImg: { width: '100%', height: '100%' },

  toggleContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: radius.full, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radius.full, gap: spacing.sm },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
  toggleTextActive: { color: colors.white },

  formContainer: { gap: spacing.xl },
  inputGroup: {},
  inputHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  inputHint: { fontSize: 13, color: colors.textMuted, marginTop: 2, fontFamily: fonts.regular },
  
  selectorBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  selectorDisabled: { opacity: 0.5 },
  selectorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectorIcon: { marginRight: 4 },
  selectorText: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },

  nearbySection: { marginTop: spacing.xl },
  nearbyTitle: { fontSize: 15, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.md },
  nearbyScroll: { gap: spacing.sm, paddingRight: spacing.lg },
  nearbyChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, gap: 6 },
  nearbyChipText: { fontSize: 12, fontFamily: fonts.medium, color: colors.text },

  confirmBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.xl },
  bannerIcon: { marginRight: spacing.md },
  bannerTextCol: { flex: 1 },
  bannerSubtitle: { fontSize: 12, color: colors.text, fontFamily: fonts.medium },
  bannerTitle: { fontSize: 15, color: colors.primaryDark, fontFamily: fonts.bold, marginTop: 2 },

  continueBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.xl },
  continueDisabled: { opacity: 0.5 },
  continueText: { fontSize: 16, color: colors.white, fontFamily: fonts.bold },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, gap: spacing.sm },
  footerText: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.medium },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '70%', minHeight: '40%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
  modalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { fontSize: 16, fontFamily: fonts.medium, color: colors.text },
});
