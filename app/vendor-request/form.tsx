import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform, KeyboardAvoidingView, LayoutAnimation, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { vendorRequestApi, type VendorRequest } from '@/api/vendor-request.api';
import { api } from '@/api/client';
import { colors, spacing, radius, fonts, typography } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { Input, Select, Button, Typography, Badge, SuccessState } from '@/components/ui';
import Toast from 'react-native-toast-message';



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

      let uploadUri = asset.uri;
      
      if (Platform.OS !== 'web') {
        const manipResult = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        uploadUri = manipResult.uri;
      }

      // 1. Prepare form data for our backend
      const form = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uploadUri);
        const blob = await response.blob();
        form.append('file', blob, 'upload.jpg');
      } else {
        form.append('file', { uri: uploadUri, name: 'upload.jpg', type: 'image/jpeg' } as any);
      }
      form.append('folder', 'districtmart/vendors');

      // 2. Upload directly to our backend server
      const uploadRes = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!uploadRes.data.success) {
        throw new Error('Upload failed');
      }

      onChange(uploadRes.data.data.url);
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Could not upload the image. Please try again.');
      else Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Could not upload the image. Please try again.' });
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

function RocketProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const airAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(airAnim, {
        toValue: 1,
        duration: 350, // fast airflow
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const airTranslate = airAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const fillPercent = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: 28, paddingBottom: 16 }}>
      <View style={{ position: 'relative', width: '100%', justifyContent: 'center' }}>
        
        {/* Track Background */}
        <View style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, width: '100%', overflow: 'hidden' }}>
          {/* Active Fill with Airflow */}
          <View style={{ height: '100%', width: `${fillPercent}%`, backgroundColor: '#16a34a', overflow: 'hidden', borderTopRightRadius: 5, borderBottomRightRadius: 5 }}>
            <Animated.View style={{ flexDirection: 'row', width: '300%', transform: [{ translateX: airTranslate }] }}>
              {Array.from({ length: 50 }).map((_, i) => (
                <View key={i} style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginHorizontal: 4, marginTop: 4, borderRadius: 1 }} />
              ))}
            </Animated.View>
          </View>
        </View>

        {/* Numeric Nodes */}
        <View style={{ position: 'absolute', top: '50%', marginTop: -13, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const s = i + 1;
            const isActive = s <= step;
            return (
              <View 
                key={s} 
                style={{ 
                  width: 26, height: 26, borderRadius: 13, 
                  backgroundColor: isActive ? '#16a34a' : '#e2e8f0', 
                  justifyContent: 'center', alignItems: 'center', 
                  borderWidth: 2, borderColor: '#fff' 
                }}
              >
                <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: isActive ? '#fff' : '#94a3b8' }}>{s}</Text>
              </View>
            );
          })}
        </View>

        {/* Rocket Icon */}
        <View style={{ position: 'absolute', top: '50%', marginTop: -16, left: `${fillPercent}%`, marginLeft: -16 }}>
           <View style={{ 
             shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 8,
             backgroundColor: '#fff', borderRadius: 20, padding: 5, transform: [{ rotate: '45deg' }] 
           }}>
             <Ionicons name="rocket" size={22} color="#16a34a" />
           </View>
        </View>

      </View>
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      else Toast.show({ type: 'error', text1: 'Terms Required', text2: 'Please accept the Terms & Conditions to continue.' });
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
      const msg = e.response?.data?.error?.message || e.response?.data?.message || (e instanceof Error ? e.message : 'Could not submit. Try again.');
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
        else Toast.show({ type: 'error', text1: 'Submission Failed', text2: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function validateCurrentStep(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.shopName?.trim()) errs.shopName = 'Shop Name is required';
      if (!form.ownerName?.trim()) errs.ownerName = 'Owner Name is required';
      const mobile = form.mobileNumber?.replace(/\D/g, '') ?? '';
      if (!/^[6-9]\d{9}$/.test(mobile)) errs.mobileNumber = 'Enter a valid 10-digit mobile number';
    }
    if (step === 2) {
      if (!form.shopCategory) errs.shopCategory = 'Please select a shop category';
    }
    if (step === 3) {
      if (!form.latitude || !form.longitude) errs.location = 'GPS location is required';
      if (!form.address?.trim() || form.address.trim().length < 5) errs.address = 'Shop address is required';
    }
    if (step === 4) {
      if (!form.accountHolderName?.trim()) errs.accountHolderName = 'Account holder name is required';
      if (!form.bankName?.trim()) errs.bankName = 'Bank name is required';
      const accountNumber = form.accountNumber?.replace(/\s/g, '') ?? '';
      if (!/^\d{9,18}$/.test(accountNumber)) errs.accountNumber = 'Enter a valid bank account number';
      const ifsc = (form.ifscCode ?? '').trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) errs.ifscCode = 'Enter a valid IFSC code';
    }
    return errs;
  }

  async function handleNext() {
    const errs = validateCurrentStep();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { 
      return; 
    }
    await saveAndNext();
  }

  // ─── Step renderers ───────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <>
        <Input label="Shop Name" value={form.shopName ?? ''} onChangeText={(v) => set('shopName', v)} placeholder="e.g. Fresh Mart" error={errors.shopName} />
        <Input label="Owner Name" value={form.ownerName ?? ''} onChangeText={(v) => set('ownerName', v)} error={errors.ownerName} />
        <Input label="Mobile Number" value={form.mobileNumber ?? ''} onChangeText={(v) => set('mobileNumber', v)} keyboardType="phone-pad" error={errors.mobileNumber} />
        <Input label="Email Address (Optional)" value={form.email ?? ''} onChangeText={(v) => set('email', v)} keyboardType="email-address" error={errors.email} />
      </>
    );
  }


  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  async function handleDetectLocation() {
    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Please allow location access in your device settings.' });
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      
      set('latitude', lat);
      set('longitude', lng);
      // Removed reverse geocoding to address based on user request; they want to manually type the address
      Toast.show({ type: 'success', text1: 'Location Detected', text2: 'Your coordinates have been securely captured.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not fetch your current location.' });
    } finally {
      setIsDetectingLocation(false);
    }
  }

  function renderStep2() {
    return (
      <>
        <Select 
          label="Shop Category" 
          options={SHOP_CATEGORIES.map(c => ({ label: c, value: c }))} 
          value={form.shopCategory ?? ''} 
          onChange={(v) => set('shopCategory', v)} 
          error={errors.shopCategory}
        />
        <Input label="Shop Description (Optional)" value={form.description ?? ''} onChangeText={(v) => set('description', v)} multiline error={errors.description} />
        <Input label="GST Number (Optional)" value={form.gstNumber ?? ''} onChangeText={(v) => set('gstNumber', v)} error={errors.gstNumber} />
        <Input label="FSSAI License Number (Optional)" value={form.fssaiNumber ?? ''} onChangeText={(v) => set('fssaiNumber', v)} error={errors.fssaiNumber} />
        <Input label="Business Registration Number (Optional)" value={form.businessRegNumber ?? ''} onChangeText={(v) => set('businessRegNumber', v)} error={errors.businessRegNumber} />
      </>
    );
  }


  function renderStep3() {
    const gpsDetected = !!(form.latitude && form.longitude);
    return (
      <>
        {/* GPS Button */}
        <View style={{ marginBottom: spacing.md, borderRadius: 16, borderWidth: 1.5, borderColor: gpsDetected ? '#16a34a' : '#f59e0b', backgroundColor: gpsDetected ? '#f0fdf4' : '#fffbeb', padding: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: gpsDetected ? '#16a34a' : '#b45309', flex: 1 }}>
              {gpsDetected ? '✅ GPS Location Detected' : '⚠️ GPS Location Required'}
            </Text>
          </View>
          {gpsDetected ? (
            <Text style={{ fontSize: 12, color: '#16a34a', marginBottom: spacing.sm }}>
              📍 Your location coordinates are captured securely.
            </Text>
          ) : (
            <Text style={{ fontSize: 12, color: '#92400e', marginBottom: spacing.sm }}>
              Your shop's GPS coordinates are needed for delivery radius and map visibility. Tap the button below.
            </Text>
          )}
          <Button 
            title={isDetectingLocation ? "Detecting..." : gpsDetected ? "Re-detect Location" : "📍 Detect My Location (GPS)"} 
            onPress={handleDetectLocation} 
            disabled={isDetectingLocation}
            variant={gpsDetected ? 'ghost' : 'primary'}
          />
        </View>

        {/* Address — only editable after GPS */}
        <View style={{ opacity: gpsDetected ? 1 : 0.4 }} pointerEvents={gpsDetected ? 'auto' : 'none'}>
          <Input 
            label="Complete Shop Address" 
            value={form.address ?? ''} 
            onChangeText={(v) => set('address', v)} 
            multiline 
            placeholder={gpsDetected ? 'e.g. 12, Gandhi St, Perundurai, Erode - 638052' : 'Detect GPS first to fill address'}
            error={errors.address}
          />
          <Input label="Landmark (Optional)" value={form.landmark ?? ''} onChangeText={(v) => set('landmark', v)} />
        </View>
        <Input label="Delivery Radius (km)" value={form.deliveryRadius?.toString() ?? '5'} onChangeText={(v) => set('deliveryRadius', parseFloat(v) || 5)} keyboardType="decimal-pad" />
      </>
    );
  }


  function renderStep4() {
    return (
      <>
        <Input label="Account Holder Name" value={form.accountHolderName ?? ''} onChangeText={(v) => set('accountHolderName', v)} placeholder="As per bank records" error={errors.accountHolderName} />
        <Input label="Bank Name" value={form.bankName ?? ''} onChangeText={(v) => set('bankName', v)} placeholder="e.g. State Bank of India" error={errors.bankName} />
        <Input label="Account Number" value={form.accountNumber ?? ''} onChangeText={(v) => set('accountNumber', v)} keyboardType="number-pad" error={errors.accountNumber} />
        <Input label="IFSC Code" value={form.ifscCode ?? ''} onChangeText={(v) => set('ifscCode', v)} autoCapitalize="characters" placeholder="e.g. SBIN0001234" error={errors.ifscCode} />
        <Input label="UPI ID (Optional)" value={form.upiId ?? ''} onChangeText={(v) => set('upiId', v)} keyboardType="email-address" placeholder="e.g. shop@okaxis" error={errors.upiId} />
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
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <RocketProgressBar step={step} totalSteps={STEPS.length} />

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
              onPress={() => { 
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setStep((s) => s - 1); 
                scrollRef.current?.scrollTo({ y: 0, animated: true }); 
              }}
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
  progressContainer: { flexDirection: 'row', gap: 4, paddingHorizontal: spacing.lg, paddingTop: 10 },
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
