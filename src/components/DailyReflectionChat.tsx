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
} from 'react-native';
import { reflectionService, DailyReflection } from '../services/reflection.service';

interface DailyReflectionChatProps {
    onReflectionSaved?: (reflection: DailyReflection) => void;
}

/**
 * Daily Reflection Chat Component
 * - Chat-like UI for daily reflections
 * - Auto-saves locally
 * - Editable same day, read-only after
 * - Submits once per day
 */
export const DailyReflectionChat: React.FC<DailyReflectionChatProps> = ({ onReflectionSaved }) => {
    const [reflectionText, setReflectionText] = useState('');
    const [currentReflection, setCurrentReflection] = useState<DailyReflection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const today = new Date().toISOString().split('T')[0];
    const canEdit = !currentReflection || currentReflection.date === today;

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
            }
        } catch (error) {
            console.error('Error loading reflection:', error);
            Alert.alert('Error', 'Failed to load reflection. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Auto-save reflection (debounced)
     */
    useEffect(() => {
        if (!canEdit || !reflectionText.trim()) return;

        const autoSaveAsync = async () => {
            try {
                const saved = await reflectionService.saveReflection(reflectionText);
                setCurrentReflection(saved);
            } catch (error) {
                console.error('Auto-save error:', error);
            }
        };

        const timer = setTimeout(() => {
            autoSaveAsync();
        }, 1000); // Auto-save after 1 second of no typing

        return () => clearTimeout(timer);
    }, [reflectionText, canEdit]);

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

            if (onReflectionSaved) {
                onReflectionSaved(saved);
            }

            Alert.alert(
                'Reflection Saved! ✨',
                'Your thoughts have been recorded for today.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save reflection. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Daily Reflection</Text>
                    <Text style={styles.date}>{formatDate(today)}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6C63FF" />
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
                    <Text style={styles.title}>💭 Daily Reflection</Text>
                    <Text style={styles.date}>{formatDate(today)}</Text>
                </View>

                {/* Chat Area */}
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Prompt Message */}
                    <View style={styles.promptBubble}>
                        <Text style={styles.promptText}>
                            How was your day? What did you learn? What are you grateful for?
                        </Text>
                    </View>

                    {/* User Input */}
                    <View style={styles.userBubble}>
                        <TextInput
                            ref={inputRef}
                            style={[styles.input, !canEdit && styles.inputReadOnly]}
                            value={reflectionText}
                            onChangeText={setReflectionText}
                            placeholder="Share your thoughts..."
                            placeholderTextColor="#999"
                            multiline
                            editable={canEdit}
                            textAlignVertical="top"
                            maxLength={2000}
                        />
                        {!canEdit && (
                            <View style={styles.readOnlyBadge}>
                                <Text style={styles.readOnlyText}>Read-Only (Past Day)</Text>
                            </View>
                        )}
                    </View>

                    {/* Character Count */}
                    {canEdit && (
                        <Text style={styles.charCount}>
                            {reflectionText.length} / 2000 characters
                        </Text>
                    )}
                </ScrollView>

                {/* Submit Button */}
                {canEdit && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!reflectionText.trim() || isSaving) && styles.submitButtonDisabled,
                            ]}
                            onPress={handleSubmit}
                            disabled={!reflectionText.trim() || isSaving}
                            activeOpacity={0.8}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitText}>
                                    {currentReflection ? 'Update Reflection' : 'Save Reflection'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {currentReflection && (
                            <Text style={styles.autoSaveText}>Auto-saved ✓</Text>
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
        padding: 16,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6C757D',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatArea: {
        maxHeight: 300,
    },
    chatContent: {
        padding: 16,
    },
    promptBubble: {
        backgroundColor: '#E8F4FD',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        alignSelf: 'flex-start',
        maxWidth: '85%',
    },
    promptText: {
        fontSize: 15,
        color: '#2C5F8D',
        lineHeight: 22,
    },
    userBubble: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DEE2E6',
    },
    input: {
        fontSize: 16,
        color: '#1A1A1A',
        lineHeight: 24,
        minHeight: 100,
        maxHeight: 200,
    },
    inputReadOnly: {
        color: '#6C757D',
        backgroundColor: '#F1F3F5',
    },
    readOnlyBadge: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF3CD',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    readOnlyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#856404',
    },
    charCount: {
        fontSize: 12,
        color: '#ADB5BD',
        textAlign: 'right',
        marginTop: 8,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    submitButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#CED4DA',
    },
    submitText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    autoSaveText: {
        fontSize: 12,
        color: '#28A745',
        textAlign: 'center',
        marginTop: 8,
    },
});
