import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';

export default function DailyReflectionScreen() {
    const [happiness, setHappiness] = useState('');
    const [challenges, setChallenges] = useState('');
    const [gratitude, setGratitude] = useState('');
    const [tomorrow, setTomorrow] = useState('');

    const handleSave = () => {
        // TODO: Save reflection to backend/storage
        console.log('Saving reflection:', { happiness, challenges, gratitude, tomorrow });
        alert('Reflection saved!');
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daily Reflection</Text>
                    <Text style={styles.headerSubtitle}>
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.questionCard}>
                        <Text style={styles.questionEmoji}>😊</Text>
                        <Text style={styles.questionTitle}>What made you happy today?</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Share your moments of joy..."
                            value={happiness}
                            onChangeText={setHappiness}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.questionCard}>
                        <Text style={styles.questionEmoji}>💪</Text>
                        <Text style={styles.questionTitle}>What challenges did you face?</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Reflect on the obstacles..."
                            value={challenges}
                            onChangeText={setChallenges}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.questionCard}>
                        <Text style={styles.questionEmoji}>🙏</Text>
                        <Text style={styles.questionTitle}>What are you grateful for?</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Express your gratitude..."
                            value={gratitude}
                            onChangeText={setGratitude}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.questionCard}>
                        <Text style={styles.questionEmoji}>🎯</Text>
                        <Text style={styles.questionTitle}>What will you focus on tomorrow?</Text>
                        <TextInput
                            style={styles.input}
                            multiline
                            numberOfLines={4}
                            placeholder="Set your intentions..."
                            value={tomorrow}
                            onChangeText={setTomorrow}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Reflection</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#007AFF',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 30,
    },
    backButton: {
        marginBottom: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    content: {
        padding: 20,
    },
    questionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    questionEmoji: {
        fontSize: 32,
        marginBottom: 12,
    },
    questionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#f8f9fa',
    },
    actions: {
        padding: 20,
        paddingBottom: 40,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
