import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import micrologService, { MicroLog } from '../services/microlog.service';
import microLogStorage from '../storage/microLogStorage';

interface MicroLogModalProps {
    visible: boolean;
    onClose: () => void;
    onSave?: (log: MicroLog) => void;
    existingLog?: MicroLog | null;
    timestamp?: string; // Pre-set timestamp for hourly notifications
}

// FR-3.3: Predefined mood emojis
const MOODS = [
    { value: '😡', label: 'Angry' },
    { value: '�', label: 'Neutral' },
    { value: '�', label: 'Happy' },
    { value: '🤩', label: 'Amazing' },
    { value: '😴', label: 'Tired' },
];

// FR-3.2: Rating scale 1-5
const RATINGS = [1, 2, 3, 4, 5];

// Common activities for quick selection
const COMMON_ACTIVITIES = [
    'Work', 'Coding', 'Meeting', 'Email',
    'Exercise', 'Gym', 'Walking',
    'Eating', 'Cooking',
    'Netflix', 'Reading', 'Gaming',
    'Socializing', 'Family Time',
    'Commute', 'Errands', 'Chores',
    'Learning', 'Studying',
    'Rest', 'Sleep', 'Meditation',
];

// FR-3.5: Common tags for quick selection
const COMMON_TAGS = [
    '#Work', '#Health', '#Leisure', '#Social',
    '#Learning', '#Personal', '#Exercise', '#Family',
    '#Creative', '#Productive', '#Relaxing', '#Stressful'
];

// FR-3.4: Character limit for notes
const MAX_NOTE_LENGTH = 140;

export function MicroLogModal({
    visible,
    onClose,
    onSave,
    existingLog,
    timestamp,
}: MicroLogModalProps) {
    // FR-3.2: Rating input (required)
    const [rating, setRating] = useState<number>(existingLog?.rating || 3);

    // FR-3.3: Mood selection (required)
    const [mood, setMood] = useState<string>(existingLog?.mood || '😐');

    // FR-3.4: Activity note with character limit
    const [activity, setActivity] = useState<string>(existingLog?.activity || '');

    // FR-3.4: Free text note with character limit (140 chars)
    const [note, setNote] = useState<string>(existingLog?.note || '');

    // FR-3.5: Tags with auto-suggestions
    const [tags, setTags] = useState<string[]>(existingLog?.tags || []);

    const [isLoading, setIsLoading] = useState(false);

    // FR-3.1: Automatically associate with current hour or provided timestamp
    const logTimestamp = timestamp || existingLog?.timestamp || new Date().toISOString();

    /**
     * FR-3.5: Load tag and activity suggestions on mount
     */
    useEffect(() => {
        // Preload suggestions for future use
        microLogStorage.getTagSuggestions(20);
        microLogStorage.getActivitySuggestions(20);
    }, []);

    /**
     * FR-3.6: Save log with validation
     */
    const handleSave = async () => {
        // FR-3.2: Require rating before saving
        if (!rating || !mood) {
            Alert.alert('Required Fields', 'Please select both rating and mood');
            return;
        }

        setIsLoading(true);
        try {
            const logData: MicroLog = {
                timestamp: logTimestamp,
                rating,
                mood,
                activity: activity.trim() || undefined,
                note: note.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
            };

            // Save locally first (offline-first)
            await microLogStorage.saveMicroLog(logData);

            // Try to sync with backend
            try {
                if (existingLog?.id) {
                    await micrologService.updateMicroLog(existingLog.id, logData);
                } else {
                    await micrologService.createMicroLog(logData);
                }
            } catch (syncError) {
                // Continue even if backend sync fails (offline-first)
                console.log('Backend sync failed, saved locally:', syncError);
            }

            onSave?.(logData);
            handleClose();
        } catch (error) {
            console.error('Error saving micro-log:', error);
            Alert.alert('Error', 'Failed to save log. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!existingLog) {
            setRating(3);
            setMood('😐');
            setActivity('');
            setNote('');
            setTags([]);
        }
        onClose();
    };

    /**
     * Toggle tag selection
     */
    const toggleTag = (tag: string) => {
        setTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {existingLog ? '✏️ Edit Log' : '⏰ Hourly Check-in'}
                            </Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.scrollView}>
                            {/* Rating */}
                            <View style={styles.selectorContainer}>
                                <Text style={styles.label}>Rate this hour (1-5) ⭐</Text>
                                <View style={styles.ratingRow}>
                                    {RATINGS.map((value) => (
                                        <TouchableOpacity
                                            key={value}
                                            style={[
                                                styles.ratingButton,
                                                rating === value && styles.ratingButtonSelected,
                                            ]}
                                            onPress={() => setRating(value)}
                                        >
                                            <Text style={styles.ratingText}>{value}</Text>
                                            <Text style={styles.ratingStars}>{'⭐'.repeat(value)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Mood */}
                            <View style={styles.selectorContainer}>
                                <Text style={styles.label}>How are you feeling?</Text>
                                <View style={styles.optionsRow}>
                                    {MOODS.map((item) => (
                                        <TouchableOpacity
                                            key={item.value}
                                            style={[
                                                styles.optionButton,
                                                mood === item.value && styles.optionButtonSelected,
                                            ]}
                                            onPress={() => setMood(item.value)}
                                        >
                                            <Text style={styles.emoji}>{item.value}</Text>
                                            <Text style={styles.optionLabel}>{item.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Activity */}
                            <View style={styles.selectorContainer}>
                                <Text style={styles.label}>What are you doing?</Text>
                                <TextInput
                                    style={styles.activityInput}
                                    value={activity}
                                    onChangeText={setActivity}
                                    placeholder="e.g., Coding, Gym, Netflix..."
                                    placeholderTextColor="#999"
                                />
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activitySuggestions}>
                                    {COMMON_ACTIVITIES.map((act) => (
                                        <TouchableOpacity
                                            key={act}
                                            style={styles.suggestionChip}
                                            onPress={() => setActivity(act)}
                                        >
                                            <Text style={styles.suggestionText}>{act}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Tags */}
                            <View style={styles.selectorContainer}>
                                <Text style={styles.label}>Tags (optional)</Text>
                                <View style={styles.tagsContainer}>
                                    {COMMON_TAGS.map((tag) => (
                                        <TouchableOpacity
                                            key={tag}
                                            style={[
                                                styles.tagChip,
                                                tags.includes(tag) && styles.tagChipSelected,
                                            ]}
                                            onPress={() => toggleTag(tag)}
                                        >
                                            <Text style={[
                                                styles.tagText,
                                                tags.includes(tag) && styles.tagTextSelected
                                            ]}>{tag}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Notes */}
                            <View style={styles.notesContainer}>
                                <Text style={styles.label}>
                                    Notes (optional) {note.length}/{MAX_NOTE_LENGTH}
                                </Text>
                                <TextInput
                                    style={styles.notesInput}
                                    multiline
                                    numberOfLines={4}
                                    value={note}
                                    onChangeText={(text) => {
                                        if (text.length <= MAX_NOTE_LENGTH) {
                                            setNote(text);
                                        }
                                    }}
                                    placeholder="Any thoughts or details about this hour?"
                                    placeholderTextColor="#999"
                                    maxLength={MAX_NOTE_LENGTH}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleClose}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                                disabled={isLoading}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isLoading ? 'Saving...' : existingLog ? 'Update' : 'Save Log'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    closeButton: { padding: 5 },
    closeButtonText: { fontSize: 24, color: '#999' },
    scrollView: { padding: 20 },
    selectorContainer: { marginBottom: 25 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
    ratingRow: { flexDirection: 'row', justifyContent: 'space-between' },
    ratingButton: { flex: 1, alignItems: 'center', padding: 12, marginHorizontal: 3, borderRadius: 10, backgroundColor: '#f8f8f8', borderWidth: 2, borderColor: 'transparent' },
    ratingButtonSelected: { backgroundColor: '#fff4e6', borderColor: '#ff9800' },
    ratingText: { fontSize: 18, fontWeight: 'bold', color: '#666', marginBottom: 4 },
    ratingStars: { fontSize: 10 },
    optionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    optionButton: { flex: 1, alignItems: 'center', padding: 10, marginHorizontal: 3, borderRadius: 12, backgroundColor: '#f8f8f8', borderWidth: 2, borderColor: 'transparent' },
    optionButtonSelected: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
    emoji: { fontSize: 28, marginBottom: 5 },
    optionLabel: { fontSize: 10, color: '#666', textAlign: 'center' },
    activityInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#f8f8f8', marginBottom: 10 },
    activitySuggestions: { flexDirection: 'row', marginTop: 5 },
    suggestionChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8 },
    suggestionText: { fontSize: 12, color: '#666' },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tagChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: 'transparent' },
    tagChipSelected: { backgroundColor: '#e3f2fd', borderColor: '#2196f3' },
    tagText: { fontSize: 13, color: '#666', fontWeight: '500' },
    tagTextSelected: { color: '#2196f3' },
    notesContainer: { marginBottom: 20 },
    notesInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, fontSize: 16, minHeight: 100, textAlignVertical: 'top', backgroundColor: '#f8f8f8' },
    actions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, gap: 10 },
    button: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
    saveButton: { backgroundColor: '#2196f3' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
