import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AuthContext } from '../context/auth';
import { reflectionService } from '../services/reflection.service';
import { goalService } from '../services/goal.service';
import { achievementService } from '../services/achievement.service';

interface DashboardHeaderProps {
    onLogout?: () => void;
}

/**
 * Dashboard Header Component
 * - Displays app name
 * - Profile button with modal
 * - User details, export options, logout
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
    const router = useRouter();
    const { user, logout } = useContext(AuthContext);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🚪 Starting logout process...');

                            // Close modal first
                            setShowProfileModal(false);

                            // Call logout from AuthContext - this removes token
                            await logout();
                            console.log('✅ Token removed, user cleared');

                            // Call optional onLogout callback
                            if (onLogout) {
                                onLogout();
                            }

                            // Redirect to login page
                            console.log('🔄 Redirecting to login page...');
                            try {
                                // ensure navigation happens after logout completes
                                router.replace('/(auth)/login');
                            } catch (navErr) {
                                console.error('Navigation error after logout:', navErr);
                            }

                            console.log('✅ Logout complete');
                        } catch (error) {
                            console.error('❌ Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleExportReflections = async () => {
        setIsExporting(true);
        try {
            console.log('📊 Starting reflections export...');
            const { reflections } = await reflectionService.getAllReflections({ limit: 1000 });

            if (reflections.length === 0) {
                Alert.alert('No Data', 'You have no reflections to export.');
                setIsExporting(false);
                return;
            }

            // Format as CSV with BOM for Excel compatibility
            let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
            csvContent += 'Date,Reflection,Created At\n';

            reflections.forEach(r => {
                // Format date for Excel
                const date = r.date || '';
                const createdAt = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
                // Escape quotes and newlines
                const text = (r.reflectionText || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                csvContent += `"${date}","${text}","${createdAt}"\n`;
            });

            // Save to file using FileSystem
            const fs = FileSystem as any;
            const baseDir = fs.documentDirectory || fs.cacheDirectory || '';

            if (!baseDir) {
                Alert.alert('Error', 'File system not available on this platform. Export canceled.');
                setIsExporting(false);
                return;
            }

            const fileName = `LifeReveal_Reflections_${new Date().toISOString().split('T')[0]}.csv`;
            const fileUri = baseDir + fileName;

            await fs.writeAsStringAsync(fileUri, csvContent, {
                encoding: fs.EncodingType ? fs.EncodingType.UTF8 : 'utf8',
            });

            console.log('✅ Reflections CSV saved to:', fileUri);

            // Share the file (handle Android content URI)
            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
                let shareUri = fileUri;
                try {
                    if (Platform.OS === 'android' && typeof fs.getContentUriAsync === 'function') {
                        shareUri = await fs.getContentUriAsync(fileUri);
                    }
                } catch (err) {
                    console.warn('Could not convert to content URI:', err);
                }

                await Sharing.shareAsync(shareUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Daily Reflections',
                    UTI: 'public.comma-separated-values-text',
                });

                console.log('📤 Reflections shared successfully');
                Alert.alert('Success', `Exported ${reflections.length} reflections!`);
            } else {
                Alert.alert(
                    'Export Complete',
                    `Exported ${reflections.length} reflections to:\n${fileName}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('❌ Export error:', error);
            Alert.alert('Error', 'Failed to export reflections. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportGoals = async () => {
        setIsExporting(true);
        try {
            console.log('🎯 Starting goals export...');
            const { goals } = await goalService.getAllGoals({ limit: 1000 });

            if (goals.length === 0) {
                Alert.alert('No Data', 'You have no goals to export.');
                setIsExporting(false);
                return;
            }

            // Format as CSV with BOM for Excel compatibility
            let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
            csvContent += 'Date,Title,Status,Created At\n';

            goals.forEach(g => {
                // Format date for Excel
                const date = g.date || '';
                const createdAt = g.createdAt ? new Date(g.createdAt).toLocaleString() : '';
                const status = g.completed ? 'Completed' : 'In Progress';
                // Escape quotes
                const title = (g.title || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                csvContent += `"${date}","${title}","${status}","${createdAt}"\n`;
            });

            // Save to file using FileSystem
            const fs = FileSystem as any;
            const baseDir = fs.documentDirectory || fs.cacheDirectory || '';

            if (!baseDir) {
                Alert.alert('Error', 'File system not available on this platform. Export canceled.');
                setIsExporting(false);
                return;
            }

            const fileName = `LifeReveal_Goals_${new Date().toISOString().split('T')[0]}.csv`;
            const fileUri = baseDir + fileName;

            await fs.writeAsStringAsync(fileUri, csvContent, {
                encoding: fs.EncodingType ? fs.EncodingType.UTF8 : 'utf8',
            });

            console.log('✅ Goals CSV saved to:', fileUri);

            // Share the file (handle Android content URI)
            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
                let shareUri = fileUri;
                try {
                    if (Platform.OS === 'android' && typeof fs.getContentUriAsync === 'function') {
                        shareUri = await fs.getContentUriAsync(fileUri);
                    }
                } catch (err) {
                    console.warn('Could not convert to content URI:', err);
                }

                await Sharing.shareAsync(shareUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Daily Goals',
                    UTI: 'public.comma-separated-values-text',
                });

                console.log('📤 Goals shared successfully');
                Alert.alert('Success', `Exported ${goals.length} goals!`);
            } else {
                Alert.alert(
                    'Export Complete',
                    `Exported ${goals.length} goals to:\n${fileName}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('❌ Export error:', error);
            Alert.alert('Error', 'Failed to export goals. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportAchievements = async () => {
        setIsExporting(true);
        try {
            console.log('🏆 Starting achievements export...');
            const { achievements } = await achievementService.getAllAchievements({ limit: 1000 });

            if (achievements.length === 0) {
                Alert.alert('No Data', 'You have no achievements to export.');
                setIsExporting(false);
                return;
            }

            // Format as CSV with BOM for Excel compatibility
            let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
            csvContent += 'Title,Description,Type,Date,Created At\n';

            achievements.forEach(a => {
                // Format dates for Excel
                const date = a.date || '';
                const createdAt = a.createdAt ? new Date(a.createdAt).toLocaleString() : '';
                // Escape quotes and newlines
                const title = (a.title || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                const description = (a.description || '').replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
                const type = a.type || '';
                csvContent += `"${title}","${description}","${type}","${date}","${createdAt}"\n`;
            });

            // Save to file using FileSystem
            const fs = FileSystem as any;
            const baseDir = fs.documentDirectory || fs.cacheDirectory || '';

            if (!baseDir) {
                Alert.alert('Error', 'File system not available on this platform. Export canceled.');
                setIsExporting(false);
                return;
            }

            const fileName = `LifeReveal_Achievements_${new Date().toISOString().split('T')[0]}.csv`;
            const fileUri = baseDir + fileName;

            await fs.writeAsStringAsync(fileUri, csvContent, {
                encoding: fs.EncodingType ? fs.EncodingType.UTF8 : 'utf8',
            });

            console.log('✅ Achievements CSV saved to:', fileUri);

            // Share the file (handle Android content URI)
            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
                let shareUri = fileUri;
                try {
                    if (Platform.OS === 'android' && typeof fs.getContentUriAsync === 'function') {
                        shareUri = await fs.getContentUriAsync(fileUri);
                    }
                } catch (err) {
                    console.warn('Could not convert to content URI:', err);
                }

                await Sharing.shareAsync(shareUri, {
                    mimeType: 'text/csv',
                    dialogTitle: 'Export Achievements',
                    UTI: 'public.comma-separated-values-text',
                });

                console.log('📤 Achievements shared successfully');
                Alert.alert('Success', `Exported ${achievements.length} achievements!`);
            } else {
                Alert.alert(
                    'Export Complete',
                    `Exported ${achievements.length} achievements to:\n${fileName}`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('❌ Export error:', error);
            Alert.alert('Error', 'Failed to export achievements. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.appName}>LifeReveal</Text>
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => setShowProfileModal(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.profileIconCircle}>
                            <Text style={styles.profileIconText}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Modal */}
            <Modal
                visible={showProfileModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProfileModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Profile</Text>
                                <TouchableOpacity
                                    onPress={() => setShowProfileModal(false)}
                                    style={styles.closeButton}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* User Details Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>👤 User Details</Text>
                                <View style={styles.detailCard}>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Name:</Text>
                                        <Text style={styles.detailValue}>{user?.name || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Email:</Text>
                                        <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>User ID:</Text>
                                        <Text style={styles.detailValue}>{user?.userId || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Export Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📊 Export Activity</Text>
                                <TouchableOpacity
                                    style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
                                    onPress={handleExportReflections}
                                    disabled={isExporting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {isExporting ? 'Exporting...' : '📝 Export Daily Reflections'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
                                    onPress={handleExportGoals}
                                    disabled={isExporting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {isExporting ? 'Exporting...' : '🎯 Export Goals'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
                                    onPress={handleExportAchievements}
                                    disabled={isExporting}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {isExporting ? 'Exporting...' : '🏆 Export Achievements'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Logout Section */}
                            <View style={styles.section}>
                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    onPress={() => {
                                        setShowProfileModal(false);
                                        handleLogout();
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.logoutText}>🚪 Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#FFFFFF',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        letterSpacing: 0.5,
    },
    profileButton: {
        padding: 4,
    },
    profileIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6C63FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileIconText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 24,
        color: '#6C757D',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8F9FA',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#495057',
        marginBottom: 12,
    },
    detailCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6C757D',
    },
    detailValue: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    actionButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionButtonDisabled: {
        backgroundColor: '#CED4DA',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    logoutButton: {
        backgroundColor: '#DC3545',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
