import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Area, District } from '@shared/types';
import { fetchAreas, fetchDistricts } from '@/api/auth';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { persistLocation } from '@/hooks/useBootstrap';
import { useAppDispatch } from '@/store/hooks';
import { setLocation } from '@/store/locationSlice';

export default function LocationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  const districtsQuery = useQuery({
    queryKey: ['districts'],
    queryFn: fetchDistricts,
  });

  const areasQuery = useQuery({
    queryKey: ['areas', selectedDistrict?.id],
    queryFn: () => fetchAreas(selectedDistrict!.id),
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

  if (districtsQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Where should we deliver?</Text>
      <Text style={styles.subtitle}>Select your district and area to see nearby stores.</Text>

      <Text style={styles.section}>District</Text>
      <View style={styles.chips}>
        {districtsQuery.data?.map((d) => (
          <Pressable
            key={d.id}
            style={[styles.chip, selectedDistrict?.id === d.id && styles.chipActive]}
            onPress={() => {
              setSelectedDistrict(d);
              setSelectedArea(null);
            }}
          >
            <Text style={[styles.chipText, selectedDistrict?.id === d.id && styles.chipTextActive]}>
              {d.name}
            </Text>
          </Pressable>
        ))}
      </View>

      {selectedDistrict ? (
        <>
          <Text style={styles.section}>Area</Text>
          {areasQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.chips}>
              {areasQuery.data?.map((a) => (
                <Pressable
                  key={a.id}
                  style={[styles.chip, selectedArea?.id === a.id && styles.chipActive]}
                  onPress={() => setSelectedArea(a)}
                >
                  <Text style={[styles.chipText, selectedArea?.id === a.id && styles.chipTextActive]}>
                    {a.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      ) : null}

      <Button
        title="Continue"
        onPress={handleConfirm}
        disabled={!selectedDistrict || !selectedArea}
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.md, marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.white },
});
