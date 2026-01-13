import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { reflectionService, DailyReflection } from '../services/reflection.service';

interface DailyReflectionChatProps {
    onReflectionSaved?: (reflection: DailyReflection) => void;
}

/**
 * Daily Reflection Chat Component
 * - Modern chat-like UI for daily reflections
 * - Auto-saves locally
 * - Editable same day, read-only after
 * - Enhanced visual feedback
 */
export const DailyReflectionChat: React.FC<DailyReflectionChatProps> = ({ onReflectionSaved }) => {
    const [reflectionText, setReflectionText] = useState('');
    const [currentReflection, setCurrentReflection] = useState<DailyReflection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const today = new Date().toISOString().split('T')[0];
    const canEdit = !currentReflection || currentReflection.date === today;

    // Pulse animation for save badge
    useEffect(() => {
        if (currentReflection) {
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    }, [currentReflection]);

    /**
     * Load today's reflection on mount
     */
    useEffect(() => {
        loadTodayReflection();
    }, []);

    const loadTodayReflection = async () => {
        setIsLoading(true);
        try {
            const reflection = await reflectionService.getTodayReflection();
            if (reflection) {
                setCurrentReflection(reflection);
                setReflectionText(reflection.reflectionText);
                console.log('✅ Reflection loaded:', { date: reflection.date, length: reflection.reflectionText.length });
            } else {
                console.log('ℹ️ No reflection found for today');
                setCurrentReflection(null);
                setReflectionText('');
            }
        } catch (error) {
            console.error('❌ Error loading reflection:', error);
            Alert.alert('Error', 'Failed to load reflection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Auto-save reflection (debounced)
     */
    useEffect(() => {
        if (!canEdit || !reflectionText.trim() || !isEditing) return;

        const autoSaveAsync = async () => {
            try {
                const saved = await reflectionService.saveReflection(reflectionText);
                setCurrentReflection(saved);
                console.log('✅ Auto-saved reflection:', { date: saved.date, length: saved.reflectionText.length });
            } catch (error) {
                console.error('❌ Auto-save error:', error);
            }
        };

        const timer = setTimeout(() => {
            autoSaveAsync();
        }, 1000); // Auto-save after 1 second of no typing

        return () => clearTimeout(timer);
    }, [reflectionText, canEdit, isEditing]);

    /**
     * Submit reflection (explicit save)
     */
    const handleSubmit = async () => {
        if (!reflectionText.trim()) {
            Alert.alert('Empty Reflection', 'Please write something before submitting.');
            return;
        }

        if (!canEdit) {
            Alert.alert('Read-Only', 'You can only edit today\'s reflection.');
            return;
        }

        setIsSaving(true);
        try {
            const saved = await reflectionService.saveReflection(reflectionText);
            setCurrentReflection(saved);
            setIsEditing(false);
            console.log('✅ Reflection saved manually:', { id: saved.id, date: saved.date });

            if (onReflectionSaved) {
                onReflectionSaved(saved);
            }

            Alert.alert(
                '✨ Reflection Saved!',
                'Your thoughts have been recorded for today.',
                [{ text: 'OK' }]
            );
        } catch (error: any) {
            console.error('❌ Save error:', error);
            const errorMessage = error?.message || 'Failed to save reflection. Please try again.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Clear reflection
     */
    const handleClear = () => {
        Alert.alert(
            'Clear Reflection',
            'Are you sure you want to clear your reflection?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setReflectionText('');
                        setIsEditing(true);
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>💭 Daily Reflection</Text>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C63FF" />
                        <Text style={styles.loadingText}>Loading reflection...</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>💭 Daily Reflection</Text>
                        <Text style={styles.date}>{formatDate(today)}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        {currentReflection && !isEditing && (
                            <Animated.View
                                style={[
                                    styles.savedBadge,
                                    { transform: [{ scale: pulseAnim }] }
                                ]}
                            >
                                <Text style={styles.savedBadgeText}>✓</Text>
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Prompt */}
                    <View style={styles.promptContainer}>
                        <View style={styles.promptBubble}>
                            <Text style={styles.promptEmoji}>🌟</Text>
                            <Text style={styles.promptText}>
                                How was your day? What did you learn? What are you grateful for?
                            </Text>
                        </View>
                    </View>

                    {/* User Input */}
                    <View style={styles.userContainer}>
                        <View style={[styles.userBubble, !canEdit && styles.userBubbleReadOnly]}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, !canEdit && styles.inputReadOnly]}
                                value={reflectionText}
                                onChangeText={(text) => {
                                    setReflectionText(text);
                                    setIsEditing(true);
                                }}
                                placeholder="Share your thoughts here..."
                                placeholderTextColor="#A0AEC0"
                                multiline
                                editable={canEdit}
                                textAlignVertical="top"
                                maxLength={2000}
                            />
                            {!canEdit && (
                                <View style={styles.readOnlyOverlay}>
                                    <View style={styles.readOnlyBadge}>
                                        <Text style={styles.readOnlyText}>🔒 Read-Only (Past Day)</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Character Count */}
                        {canEdit && reflectionText.length > 0 && (
                            <Text style={styles.charCount}>
                                {reflectionText.length} / 2000
                            </Text>
                        )}
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                {canEdit && (
                    <View style={styles.footer}>
                        <View style={styles.buttonRow}>
                            {/* Clear Button */}
                            {reflectionText.length > 0 && (
                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={handleClear}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.clearButtonText}>🗑️ Clear</Text>
                                </TouchableOpacity>
                            )}

                            {/* Save Button */}
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!reflectionText.trim() || isSaving) && styles.submitButtonDisabled,
                                    reflectionText.length > 0 && styles.submitButtonActive
                                ]}
                                onPress={handleSubmit}
                                disabled={!reflectionText.trim() || isSaving}
                                activeOpacity={0.8}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <>
                                        <Text style={styles.submitText}>
                                            {currentReflection && !isEditing ? '✓ Saved' : '💾 Save Reflection'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {currentReflection && isEditing && (
                            <Text style={styles.autoSaveHint}>💡 Auto-saving as you type...</Text>
                        )}
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

/**
 * Format date to readable string
 */
const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
        return 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
        });
    }
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 12,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        padding: 20,
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1A202C',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        fontWeight: '500',
        color: '#718096',
    },
    savedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#48BB78',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#48BB78',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    savedBadgeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#718096',
    },
    chatArea: {
        maxHeight: 350,
    },
    chatContent: {
        padding: 20,
    },
    promptContainer: {
        marginBottom: 20,
    },
    promptBubble: {
        backgroundColor: '#EBF8FF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BEE3F8',
        flexDirection: 'row',
        alignItems: 'flex-start',
        maxWidth: '90%',
    },
    promptEmoji: {
        fontSize: 20,
        marginRight: 12,
    },
    promptText: {
        flex: 1,
        fontSize: 15,
        color: '#2C5282',
        lineHeight: 22,
        fontWeight: '500',
    },
    userContainer: {
        marginBottom: 8,
    },
    userBubble: {
        backgroundColor: '#F7FAFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    userBubbleReadOnly: {
        backgroundColor: '#EDF2F7',
        borderColor: '#CBD5E0',
    },
    input: {
        fontSize: 16,
        color: '#1A202C',
        lineHeight: 24,
        minHeight: 120,
        maxHeight: 220,
    },
    inputReadOnly: {
        color: '#718096',
    },
    readOnlyOverlay: {
        marginTop: 12,
    },
    readOnlyBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FEEBC8',
        borderRadius: 10,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#FBD38D',
    },
    readOnlyText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C2D12',
    },
    charCount: {
        fontSize: 12,
        color: '#A0AEC0',
        textAlign: 'right',
        marginTop: 8,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FAFBFC',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    clearButton: {
        backgroundColor: '#FED7D7',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FC8181',
    },
    clearButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#C53030',
    },
    submitButton: {
        flex: 1,
        backgroundColor: '#CBD5E0',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonActive: {
        backgroundColor: '#6C63FF',
        shadowColor: '#6C63FF',
        shadowOpacity: 0.4,
    },
    submitButtonDisabled: {
        backgroundColor: '#E2E8F0',
        shadowOpacity: 0,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    autoSaveHint: {
        fontSize: 12,
        color: '#48BB78',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '500',
    },
});
