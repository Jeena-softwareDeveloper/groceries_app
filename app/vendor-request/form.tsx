import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { vendorRequestApi, type VendorRequest } from '@/api/vendor-request.api';
import { api } from '@/api/client';
import { colors, spacing, radius, fonts, typography } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { Input, Select, Button, Typography, Badge, SuccessState } from '@/components/ui';



// ─── Types & Constants ──────────────────────────────────────────────────────

const SHOP_CATEGORIES = [
  'Grocery', 'Fruits & Vegetables', 'Dairy & Eggs', 'Bakery', 'Meat & Seafood',
  'Beverages', 'Snacks & Namkeen', 'Personal Care', 'Home & Kitchen',
  'Organic & Natural', 'Baby & Kids', 'Pet Supplies', 'Other',
];

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'user' },
  { id: 2, title: 'Business', icon: 'briefcase' },
  { id: 3, title: 'Location', icon: 'map-pin' },
  { id: 4, title: 'Banking', icon: 'credit-card' },
  { id: 5, title: 'Documents', icon: 'file-text' },
  { id: 6, title: 'Review', icon: 'check-square' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────


function DocUploader({
  label, value, onChange, optional,
}: {
  label: string; value: string; onChange: (url: string) => void; optional?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      // 1. Get signature from backend
      const sigRes = await api.get<{ data: { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string } }>('/upload/signature?folder=districtmart/vendors');
      const { signature, timestamp, cloudName, apiKey, folder: uploadFolder } = sigRes.data.data;

      // 2. Prepare form data for Cloudinary
      const form = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        form.append('file', blob, 'upload.jpg');
      } else {
        form.append('file', { uri: asset.uri, name: 'upload.jpg', type: 'image/jpeg' } as any);
      }
      form.append('api_key', apiKey);
      form.append('timestamp', timestamp.toString());
      form.append('signature', signature);
      form.append('folder', uploadFolder);

      // 3. Upload directly to Cloudinary
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });

      if (!uploadRes.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const uploadData = await uploadRes.json();
      onChange(uploadData.secure_url);
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Could not upload the image. Please try again.');
      else Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optionalTag}>(Optional)</Text> : null}
      </Text>
      <TouchableOpacity style={styles.uploader} onPress={handlePick} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : value ? (
          <View style={styles.uploaderDone}>
            <Image source={{ uri: value }} style={styles.uploaderThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.uploaderDoneText}>✓ Uploaded</Text>
              <Text style={styles.uploaderChange}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <View style={styles.uploaderEmpty}>
            <Feather name="upload" size={20} color={colors.textMuted} />
            <Text style={styles.uploaderHint}>Tap to upload {label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────────────

export default function VendorRequestFormScreen() {
  const router = useRouter();
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const { districtId } = useAppSelector((s) => s.location);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const [form, setForm] = useState<Partial<VendorRequest>>({
    shopName: '',
    ownerName: user?.name ?? '',
    mobileNumber: user?.phone ?? '',
    email: user?.email ?? '',
    shopCategory: '',
    description: '',
    gstNumber: '',
    fssaiNumber: '',
    businessRegNumber: '',
    districtId: districtId ?? '',
    areaId: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    deliveryRadius: 5,
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    logoUrl: '',
    bannerUrl: '',
    ownerPhotoUrl: '',
    govtIdUrl: '',
    gstCertUrl: '',
    fssaiCertUrl: '',
  });

  function set(key: keyof VendorRequest, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Load existing draft
  useEffect(() => {
    vendorRequestApi.getMyRequest().then((r) => {
      if (r) {
        setForm((prev) => ({ ...prev, ...r }));
        if (r.status === 'DRAFT') setStep(1);
      }
    }).catch(() => {});
  }, []);

  // Load districts
  useEffect(() => {
    api.get('/customer/districts').then((r: any) => setDistricts(r.data?.data ?? [])).catch(() => {});
  }, []);

  // Load areas when district changes
  useEffect(() => {
    if (form.districtId) {
      api.get(`/customer/areas?districtId=${form.districtId}`).then((r: any) => setAreas(r.data?.data ?? [])).catch(() => {});
    }
  }, [form.districtId]);

  async function saveAndNext() {
    setSaving(true);
    try {
      if (accessToken && user) {
        await vendorRequestApi.saveDraft(form).catch(() => {});
      }
      setStep((s) => Math.min(s + 1, STEPS.length));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!termsAccepted) {
      if (Platform.OS === 'web') window.alert('Please accept the Terms & Conditions to continue.');
      else Alert.alert('Terms Required', 'Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!accessToken || !user) {
      if (Platform.OS === 'web') {
        if (window.confirm('Please log in to submit your application.')) router.push('/(auth)/login');
      } else {
        Alert.alert('Session Expired', 'Please log in again to continue.', [
          { text: 'Login', onPress: () => router.push('/(auth)/login') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }
      return;
    }
    setSubmitting(true);
    try {
      await vendorRequestApi.saveDraft(form);
      await vendorRequestApi.submit();
      setIsSubmitted(true);
    } catch (e: any) {
      const msg = e.response?.data?.message || (e instanceof Error ? e.message : 'Could not submit. Try again.');
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')) {
        if (Platform.OS === 'web') {
          if (window.confirm('Session Expired. Please log in again.')) router.push('/(auth)/login');
        } else {
          Alert.alert('Session Expired', 'Please log in again to continue.', [
            { text: 'Login', onPress: () => router.push('/(auth)/login') },
            { text: 'Cancel', style: 'cancel' }
          ]);
        }
      } else {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Submission Failed', msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (!form.shopName?.trim()) return 'Shop Name is required';
      if (!form.ownerName?.trim()) return 'Owner Name is required';
      const mobile = form.mobileNumber?.replace(/\D/g, '') ?? '';
      if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    }
    if (step === 2) {
      if (!form.shopCategory) return 'Please select a shop category';
    }
    if (step === 3) {
      if (!form.districtId) return 'Please select a district';
      if (areas.length > 0 && !form.areaId) return 'Please select an area';
      if (!form.address?.trim() || form.address.trim().length < 5) return 'Shop address is required';
    }
    if (step === 4) {
      if (!form.accountHolderName?.trim()) return 'Account holder name is required';
      if (!form.bankName?.trim()) return 'Bank name is required';
      const accountNumber = form.accountNumber?.replace(/\s/g, '') ?? '';
      if (!/^\d{9,18}$/.test(accountNumber)) return 'Enter a valid bank account number (9-18 digits)';
      const ifsc = (form.ifscCode ?? '').trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return 'Enter a valid IFSC code';
    }
    if (step === 5) {
      // Images are optional for now so the user can skip them
    }

    return null;
  }

  async function handleNext() {
    const error = validateCurrentStep();
    if (error) { 
      if (Platform.OS === 'web') window.alert(error);
      else Alert.alert('Validation Error', error); 
      return; 
    }
    await saveAndNext();
  }

  // ─── Step renderers ───────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <>
        <Input label="Shop Name" value={form.shopName ?? ''} onChangeText={(v) => set('shopName', v)} placeholder="e.g. Fresh Mart" />
        <Input label="Owner Name" value={form.ownerName ?? ''} onChangeText={(v) => set('ownerName', v)} />
        <Input label="Mobile Number" value={form.mobileNumber ?? ''} onChangeText={(v) => set('mobileNumber', v)} keyboardType="phone-pad" />
        <Input label="Email Address (Optional)" value={form.email ?? ''} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
      </>
    );
  }


  function renderStep2() {
    return (
      <>
        <Select 
          label="Shop Category" 
          options={SHOP_CATEGORIES.map(c => ({ label: c, value: c }))} 
          value={form.shopCategory ?? ''} 
          onChange={(v) => set('shopCategory', v)} 
        />
        <Input label="Shop Description (Optional)" value={form.description ?? ''} onChangeText={(v) => set('description', v)} multiline />
        <Input label="GST Number (Optional)" value={form.gstNumber ?? ''} onChangeText={(v) => set('gstNumber', v)} />
        <Input label="FSSAI License Number (Optional)" value={form.fssaiNumber ?? ''} onChangeText={(v) => set('fssaiNumber', v)} />
        <Input label="Business Registration Number (Optional)" value={form.businessRegNumber ?? ''} onChangeText={(v) => set('businessRegNumber', v)} />
      </>
    );
  }


  function renderStep3() {
    return (
      <>
        <Select 
          label="District" 
          placeholder="Select a District"
          options={districts.map(d => ({ label: d.name, value: d.id }))} 
          value={form.districtId ?? ''} 
          onChange={(v) => { set('districtId', v); set('areaId', ''); }} 
        />
        {areas.length > 0 && (
          <Select 
            label="Area" 
            placeholder="Select an Area"
            options={areas.map(a => ({ label: a.name, value: a.id }))} 
            value={form.areaId ?? ''} 
            onChange={(v) => set('areaId', v)} 
          />
        )}
        <Input label="Complete Shop Address" value={form.address ?? ''} onChangeText={(v) => set('address', v)} multiline />
        <Input label="Latitude (Optional)" value={form.latitude?.toString() ?? ''} onChangeText={(v) => set('latitude', parseFloat(v) || undefined)} keyboardType="decimal-pad" />
        <Input label="Longitude (Optional)" value={form.longitude?.toString() ?? ''} onChangeText={(v) => set('longitude', parseFloat(v) || undefined)} keyboardType="decimal-pad" />
        <Input label="Delivery Radius (km)" value={form.deliveryRadius?.toString() ?? '5'} onChangeText={(v) => set('deliveryRadius', parseFloat(v) || 5)} keyboardType="decimal-pad" />
      </>
    );
  }


  function renderStep4() {
    return (
      <>
        <Input label="Account Holder Name" value={form.accountHolderName ?? ''} onChangeText={(v) => set('accountHolderName', v)} />
        <Input label="Bank Name" value={form.bankName ?? ''} onChangeText={(v) => set('bankName', v)} />
        <Input label="Account Number" value={form.accountNumber ?? ''} onChangeText={(v) => set('accountNumber', v)} keyboardType="number-pad" />
        <Input label="IFSC Code" value={form.ifscCode ?? ''} onChangeText={(v) => set('ifscCode', v.toUpperCase())} />
        <Input label="UPI ID (Optional)" value={form.upiId ?? ''} onChangeText={(v) => set('upiId', v)} />
      </>
    );
  }


  function renderStep5() {
    return (
      <>
        <DocUploader label="Shop Logo" value={form.logoUrl ?? ''} onChange={(url) => set('logoUrl', url)} />
        <DocUploader label="Shop Banner" value={form.bannerUrl ?? ''} onChange={(url) => set('bannerUrl', url)} optional />
        <DocUploader label="Owner Photo" value={form.ownerPhotoUrl ?? ''} onChange={(url) => set('ownerPhotoUrl', url)} optional />
        <DocUploader label="Aadhaar / Government ID" value={form.govtIdUrl ?? ''} onChange={(url) => set('govtIdUrl', url)} />
        <DocUploader label="GST Certificate" value={form.gstCertUrl ?? ''} onChange={(url) => set('gstCertUrl', url)} optional />
        <DocUploader label="FSSAI Certificate" value={form.fssaiCertUrl ?? ''} onChange={(url) => set('fssaiCertUrl', url)} optional />
      </>
    );
  }

  function renderStep6() {
    const rows = [
      { label: 'Shop Name', value: form.shopName },
      { label: 'Owner Name', value: form.ownerName },
      { label: 'Mobile', value: form.mobileNumber },
      { label: 'Email', value: form.email },
      { label: 'Category', value: form.shopCategory },
      { label: 'Description', value: form.description },
      { label: 'GST Number', value: form.gstNumber },
      { label: 'FSSAI', value: form.fssaiNumber },
      { label: 'Address', value: form.address },
      { label: 'Delivery Radius', value: form.deliveryRadius ? `${form.deliveryRadius} km` : undefined },
      { label: 'Bank', value: form.bankName },
      { label: 'Account', value: form.accountNumber },
      { label: 'IFSC', value: form.ifscCode },
    ];
    return (
      <>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>Review Your Application</Text>
          {rows.filter((r) => r.value).map((r) => (
            <View key={r.label} style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{r.label}</Text>
              <Text style={styles.reviewValue}>{r.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.docsPreview}>
          <Text style={styles.reviewTitle}>Uploaded Documents</Text>
          <View style={styles.thumbRow}>
            {[
              { label: 'Logo', url: form.logoUrl },
              { label: 'Banner', url: form.bannerUrl },
              { label: 'Owner', url: form.ownerPhotoUrl },
              { label: 'Govt ID', url: form.govtIdUrl },
            ].filter((d) => d.url).map((d) => (
              <View key={d.label} style={styles.thumbItem}>
                <Image source={{ uri: d.url }} style={styles.thumb} />
                <Text style={styles.thumbLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAccepted((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Feather name="check" size={14} color={colors.white} />}
          </View>
          <Text style={styles.termsText}>
            I accept the{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Vendor Agreement</Text>
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  const currentStep = STEPS[step - 1];

  if (isSubmitted) {
    return (
      <SuccessState 
        title="Application Submitted!" 
        message="Your vendor application has been submitted successfully. You will be notified once it is reviewed."
        buttonText="Back to Home"
        onButtonPress={() => router.replace('/vendor-request')}
      />
    );
  }

  return (

    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          {STEPS.map((s) => (
            <View
              key={s.id}
              style={[styles.progressSegment, s.id <= step && styles.progressSegmentActive]}
            />
          ))}
        </View>

        {/* Step header */}
        <View style={styles.stepHeader}>
          <View style={[styles.stepIconBadge, step === STEPS.length && { backgroundColor: '#16a34a' }]}>
            <Feather name={currentStep.icon as any} size={18} color={colors.white} />
          </View>
          <View>
            <Text style={styles.stepNumber}>Step {step} of {STEPS.length}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </ScrollView>

        {/* Navigation Footer */}
        <View style={styles.navFooter}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setStep((s) => s - 1); scrollRef.current?.scrollTo({ y: 0, animated: true }); }}
            >
              <Feather name="chevron-left" size={20} color={colors.text} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < STEPS.length ? (
            <TouchableOpacity
              style={[styles.nextButton, saving && { opacity: 0.7 }]}
              onPress={handleNext}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.white} />
                : <>
                    <Text style={styles.nextButtonText}>Save & Next</Text>
                    <Feather name="chevron-right" size={20} color={colors.white} />
                  </>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: '#16a34a' }, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color={colors.white} />
                : <>
                    <Text style={styles.nextButtonText}>Submit Application</Text>
                    <Feather name="send" size={18} color={colors.white} />
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  progressContainer: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  progressSegment: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  progressSegmentActive: { backgroundColor: colors.primary },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  stepIconBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumber: { ...typography.caption, color: colors.textMuted },
  stepTitle: { ...typography.h3, fontSize: 18, color: colors.text },
  formContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.sm },
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { ...typography.body2, color: colors.text, fontFamily: fonts.medium, marginBottom: 8 },
  optionalTag: { ...typography.caption, color: colors.textMuted, fontFamily: fonts.regular },
  fieldInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 15, fontFamily: fonts.regular, color: colors.text, backgroundColor: colors.surface,
  },
  multilineInput: { height: 100, paddingTop: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text, fontSize: 13 },
  chipTextSelected: { color: colors.white },
  uploader: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface,
    minHeight: 80, justifyContent: 'center',
  },
  uploaderEmpty: { alignItems: 'center', gap: 8 },
  uploaderHint: { ...typography.body2, color: colors.textMuted },
  uploaderDone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  uploaderThumb: { width: 56, height: 56, borderRadius: radius.sm },
  uploaderDoneText: { ...typography.body2, color: '#16a34a', fontFamily: fonts.medium },
  uploaderChange: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  reviewCard: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  reviewTitle: { ...typography.h3, fontSize: 15, color: colors.text, marginBottom: spacing.md, fontFamily: fonts.bold },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { ...typography.body2, color: colors.textMuted, flex: 1 },
  reviewValue: { ...typography.body2, color: colors.text, fontFamily: fonts.medium, flex: 1, textAlign: 'right' },
  docsPreview: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  thumbItem: { alignItems: 'center', gap: 4 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm },
  thumbLabel: { ...typography.caption, color: colors.textMuted, fontSize: 11 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { ...typography.body2, color: colors.text, flex: 1, lineHeight: 22 },
  termsLink: { color: colors.primary, fontFamily: fonts.medium },
  navFooter: {
    flexDirection: 'row', padding: spacing.lg, gap: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  backButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.lg, paddingVertical: 14,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  backButtonText: { ...typography.button, color: colors.text },
  nextButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: spacing.sm, height: 52, borderRadius: radius.md, backgroundColor: colors.primary,
  },
  nextButtonText: { ...typography.button, color: colors.white, fontSize: 16 },
});
