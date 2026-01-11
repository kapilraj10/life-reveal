import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import analyticsService, { TrendInsight } from '../services/analytics.service';

/**
 * Optional Analytics Widget
 * Add this to your existing screens WITHOUT changing their structure
 * 
 * Usage example in your existing journey or home screen
 */
export default function AnalyticsWidget() {
    const [insights, setInsights] = useState<TrendInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            const data = await analyticsService.getAllInsights();
            // Filter to only show insights with sufficient data
            const validInsights = data.filter(i => i.confidence > 0.3);
            setInsights(validInsights);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#2196f3" />
            </View>
        );
    }

    if (insights.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>
                    📊 Start logging to see your insights
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>💡 Your Insights</Text>
            {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                    <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                            {Math.round(insight.confidence * 100)}% confidence
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        marginHorizontal: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
    },
    insightCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        // Platform-specific shadows to avoid warnings
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    insightDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    confidenceBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    confidenceText: {
        fontSize: 12,
        color: '#2196f3',
        fontWeight: '500',
    },
});
