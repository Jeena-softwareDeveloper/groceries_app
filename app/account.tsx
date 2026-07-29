import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import type { CustomerProfile } from '@/types/customer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '@/api';
import { customerApi } from '@/api/customer.api';
import { Header } from '@/components/Header';
import { colors, radius, spacing, fonts } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import { useState } from 'react';

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user: authUser } = useAppSelector((s) => s.auth);
  
  const { data: user, isLoading } = useQuery<CustomerProfile>({ 
    queryKey: ['me'], 
    queryFn: authApi.getMe,
    initialData: (authUser as CustomerProfile) || undefined,
    retry: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const updateMutation = useMutation({
    mutationFn: customerApi.updateProfile,
    onSuccess: (updatedData) => {
      // Refresh local caches and Redux store
      queryClient.setQueryData(['me'], updatedData);
      dispatch(setUser(updatedData));
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ name, email });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Account Info" showBack showSearch={false} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={32} color={colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'All Time Market User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'Customer'}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!isEditing ? (
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="Enter your name" 
              />
              
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput 
                style={styles.input} 
                value={email} 
                onChangeText={setEmail} 
                placeholder="Enter your email" 
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Pressable 
                style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Feather name="phone" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.label}>Phone Number</Text>
                  <Text style={styles.val}>{user?.phone || 'Not available'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Feather name="mail" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.val}>{user?.email || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Feather name="calendar" size={20} color={colors.textMuted} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.label}>Member Since</Text>
                  <Text style={styles.val}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Feather name={user?.isBlocked ? "x-circle" : "check-circle"} size={24} color={user?.isBlocked ? "#ef4444" : "#10b981"} />
          </View>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>Account Status</Text>
            <Text style={[styles.statusVal, { color: user?.isBlocked ? "#ef4444" : "#10b981" }]}>
              {user?.isBlocked ? 'Blocked' : 'Active & Verified'}
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  editBtnText: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  editForm: {
    gap: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: -4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  val: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusIcon: {
    marginRight: spacing.md,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statusVal: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  }
});
