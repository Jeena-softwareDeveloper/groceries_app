import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { Typography } from './Typography';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value: string;
  onChange?: (value: string) => void;
  onSelect?: (value: string) => void;
  error?: string;
  helperText?: string;
}

export function Select({ label, placeholder, options, value, onChange, onSelect, error, helperText }: SelectProps) {
  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onSelect) onSelect(val);
  };
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {label && <Typography variant="subtitle2" style={styles.label}>{label}</Typography>}
      <TouchableOpacity 
        style={[styles.trigger, error && styles.triggerError]} 
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      
      {(error || helperText) && (
        <Typography variant="caption" color={error ? 'error' : 'textMuted'} style={styles.helpText}>
          {error || helperText}
        </Typography>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">{label || 'Select Option'}</Typography>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    handleChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Feather name="check" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
            <SafeAreaView />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  triggerError: {
    borderColor: colors.error,
  },
  triggerText: {
    ...typography.body1,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  helpText: {
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary + '10',
    borderRadius: radius.md,
    borderBottomWidth: 0,
    marginVertical: 2,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.body1,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontFamily: 'Inter-Medium',
  },
});
