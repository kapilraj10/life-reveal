import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { API_URL } from '../config/api';

/**
 * Debug Info Component
 * Shows API URL and connection status
 * Only visible in development
 */
export const DebugInfo: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const response = await fetch(`${API_URL}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setStatus('connected');
                console.log('✅ Backend connection successful');
            } else {
                setStatus('failed');
                console.error('❌ Backend responded with error:', response.status);
            }
        } catch (error) {
            setStatus('failed');
            console.error('❌ Backend connection failed:', error);
        }
    };

    if (!isVisible) {
        return (
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIsVisible(true)}
            >
                <Text style={styles.toggleText}>🔧</Text>
            </TouchableOpacity>
        );
    }

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return '#48BB78';
            case 'failed': return '#F56565';
            default: return '#FFA500';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return '✅ Connected';
            case 'failed': return '❌ Connection Failed';
            default: return '⏳ Checking...';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔧 Debug Info</Text>
                <TouchableOpacity onPress={() => setIsVisible(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.label}>API URL:</Text>
                    <Text style={styles.value}>{API_URL}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.statusText}>{getStatusText()}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={checkConnection}
                >
                    <Text style={styles.retryText}>🔄 Retry Connection</Text>
                </TouchableOpacity>

                {status === 'failed' && (
                    <View style={styles.helpBox}>
                        <Text style={styles.helpTitle}>💡 Troubleshooting:</Text>
                        <Text style={styles.helpText}>1. Ensure backend is running</Text>
                        <Text style={styles.helpText}>2. Check API_URL in .env file</Text>
                        <Text style={styles.helpText}>3. If on device, use computer&apos;s IP</Text>
                        <Text style={styles.helpText}>4. Example: http://192.168.1.100:5000</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    toggleButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    toggleText: {
        fontSize: 24,
    },
    container: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        left: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A202C',
    },
    closeButton: {
        fontSize: 24,
        color: '#718096',
        fontWeight: '700',
    },
    content: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        minWidth: 80,
    },
    value: {
        fontSize: 13,
        color: '#2D3748',
        flex: 1,
        fontFamily: 'monospace',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    retryButton: {
        backgroundColor: '#6C63FF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    helpBox: {
        backgroundColor: '#FFF5F5',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FED7D7',
        marginTop: 8,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#C53030',
        marginBottom: 8,
    },
    helpText: {
        fontSize: 12,
        color: '#742A2A',
        marginBottom: 4,
    },
});
