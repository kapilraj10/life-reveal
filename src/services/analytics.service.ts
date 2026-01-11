import microLogStorage from '../storage/microLogStorage';

/**
 * FR-6: Visualization & Analytics Engine ("The Mirror")
 * Provides insights, correlations, and trend analysis
 */

export interface HeatmapData {
    date: string;
    hour: number;
    rating: number;
    mood: string;
    dayOfWeek: number;
}

export interface TrendInsight {
    type: 'time_of_day' | 'day_of_week' | 'tag_correlation' | 'activity_pattern';
    title: string;
    description: string;
    confidence: number; // 0-1
    dataPoints: any[];
}

export interface AnalyticsSummary {
    totalLogs: number;
    averageRating: number;
    dateRange: { start: string; end: string };
    bestHour: { hour: number; avgRating: number };
    worstHour: { hour: number; avgRating: number };
    topMood: string;
    topActivity: string;
    topTag: string;
}

class AnalyticsService {
    /**
     * FR-6.1: Generate weekly heatmap data (GitHub-style)
     */
    async getWeeklyHeatmap(startDate: Date, endDate: Date): Promise<HeatmapData[]> {
        const logs = await microLogStorage.getFilteredMicroLogs({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        return logs.map(log => {
            const date = new Date(log.timestamp);
            return {
                date: date.toISOString().split('T')[0],
                hour: date.getHours(),
                rating: log.rating,
                mood: log.mood,
                dayOfWeek: date.getDay(),
            };
        });
    }

    /**
     * FR-6.1: Get color for heatmap cell based on rating
     * High ratings -> green, Low ratings -> red
     */
    getHeatmapColor(rating: number): string {
        const colors = {
            1: '#ff4444', // Red
            2: '#ff8844', // Orange
            3: '#ffdd44', // Yellow
            4: '#88dd44', // Light green
            5: '#44dd44', // Green
        };
        return colors[rating as keyof typeof colors] || '#eeeeee';
    }

    /**
     * FR-6.2: Analyze time of day patterns
     */
    async analyzeTimeOfDay(): Promise<TrendInsight> {
        const logs = await microLogStorage.getAllMicroLogs();
        const hourlyAverages: { [hour: number]: { total: number; count: number } } = {};

        logs.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            if (!hourlyAverages[hour]) {
                hourlyAverages[hour] = { total: 0, count: 0 };
            }
            hourlyAverages[hour].total += log.rating;
            hourlyAverages[hour].count++;
        });

        const hourlyData = Object.entries(hourlyAverages).map(([hour, data]) => ({
            hour: parseInt(hour),
            average: data.total / data.count,
            count: data.count,
        }));

        // Find best and worst hours
        const sorted = [...hourlyData].sort((a, b) => b.average - a.average);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];

        let description = '';
        if (best && worst) {
            description = `You feel best around ${this.formatHour(best.hour)} (avg: ${best.average.toFixed(1)}/5) and lowest around ${this.formatHour(worst.hour)} (avg: ${worst.average.toFixed(1)}/5).`;
        } else {
            description = 'Not enough data to analyze time of day patterns yet.';
        }

        return {
            type: 'time_of_day',
            title: 'Time of Day Patterns',
            description,
            confidence: this.calculateConfidence(logs.length),
            dataPoints: hourlyData,
        };
    }

    /**
     * FR-6.2: Analyze day of week patterns
     */
    async analyzeDayOfWeek(): Promise<TrendInsight> {
        const logs = await microLogStorage.getAllMicroLogs();
        const dayAverages: { [day: number]: { total: number; count: number; moods: string[] } } = {};

        logs.forEach(log => {
            const day = new Date(log.timestamp).getDay();
            if (!dayAverages[day]) {
                dayAverages[day] = { total: 0, count: 0, moods: [] };
            }
            dayAverages[day].total += log.rating;
            dayAverages[day].count++;
            dayAverages[day].moods.push(log.mood);
        });

        const dayData = Object.entries(dayAverages).map(([day, data]) => ({
            day: parseInt(day),
            dayName: this.getDayName(parseInt(day)),
            average: data.total / data.count,
            count: data.count,
            topMood: this.getMostFrequent(data.moods),
        }));

        const sorted = [...dayData].sort((a, b) => b.average - a.average);
        const bestDay = sorted[0];
        const worstDay = sorted[sorted.length - 1];

        let description = '';
        if (bestDay && worstDay) {
            description = `${bestDay.dayName}s are your best (${bestDay.average.toFixed(1)}/5 ${bestDay.topMood}), while ${worstDay.dayName}s tend to be harder (${worstDay.average.toFixed(1)}/5 ${worstDay.topMood}).`;
        } else {
            description = 'Not enough data to analyze day of week patterns yet.';
        }

        return {
            type: 'day_of_week',
            title: 'Day of Week Insights',
            description,
            confidence: this.calculateConfidence(logs.length),
            dataPoints: dayData,
        };
    }

    /**
     * FR-6.2: Analyze tag correlations with ratings
     */
    async analyzeTagCorrelations(): Promise<TrendInsight> {
        const logs = await microLogStorage.getAllMicroLogs();
        const tagStats: { [tag: string]: { total: number; count: number } } = {};

        logs.forEach(log => {
            if (log.tags) {
                log.tags.forEach(tag => {
                    if (!tagStats[tag]) {
                        tagStats[tag] = { total: 0, count: 0 };
                    }
                    tagStats[tag].total += log.rating;
                    tagStats[tag].count++;
                });
            }
        });

        const tagData = Object.entries(tagStats)
            .map(([tag, data]) => ({
                tag,
                average: data.total / data.count,
                count: data.count,
            }))
            .filter(item => item.count >= 3) // Only tags used at least 3 times
            .sort((a, b) => b.average - a.average);

        const bestTags = tagData.slice(0, 3);
        const worstTags = tagData.slice(-3).reverse();

        let description = '';
        if (bestTags.length > 0 && worstTags.length > 0) {
            description = `Activities tagged with ${bestTags.map(t => t.tag).join(', ')} correlate with higher ratings, while ${worstTags.map(t => t.tag).join(', ')} tend to have lower ratings.`;
        } else {
            description = 'Not enough data to analyze tag patterns yet.';
        }

        return {
            type: 'tag_correlation',
            title: 'What Makes You Happy?',
            description,
            confidence: this.calculateConfidence(logs.length),
            dataPoints: tagData,
        };
    }

    /**
     * FR-6.2: Analyze activity patterns
     */
    async analyzeActivityPatterns(): Promise<TrendInsight> {
        const logs = await microLogStorage.getAllMicroLogs();
        const activityStats: { [activity: string]: { total: number; count: number } } = {};

        logs.forEach(log => {
            if (log.activity) {
                const activity = log.activity;
                if (!activityStats[activity]) {
                    activityStats[activity] = { total: 0, count: 0 };
                }
                activityStats[activity].total += log.rating;
                activityStats[activity].count++;
            }
        });

        const activityData = Object.entries(activityStats)
            .map(([activity, data]) => ({
                activity,
                average: data.total / data.count,
                count: data.count,
            }))
            .filter(item => item.count >= 3)
            .sort((a, b) => b.average - a.average);

        const topActivity = activityData[0];

        let description = '';
        if (topActivity) {
            description = `"${topActivity.activity}" consistently rates highest (${topActivity.average.toFixed(1)}/5 over ${topActivity.count} entries).`;
        } else {
            description = 'Not enough data to analyze activity patterns yet.';
        }

        return {
            type: 'activity_pattern',
            title: 'Activity Insights',
            description,
            confidence: this.calculateConfidence(logs.length),
            dataPoints: activityData,
        };
    }

    /**
     * Get comprehensive analytics summary
     */
    async getAnalyticsSummary(
        startDate?: Date,
        endDate?: Date
    ): Promise<AnalyticsSummary> {
        const filters: any = {};
        if (startDate) filters.startDate = startDate.toISOString();
        if (endDate) filters.endDate = endDate.toISOString();

        const logs = await microLogStorage.getFilteredMicroLogs(filters);

        if (logs.length === 0) {
            return {
                totalLogs: 0,
                averageRating: 0,
                dateRange: { start: '', end: '' },
                bestHour: { hour: 0, avgRating: 0 },
                worstHour: { hour: 0, avgRating: 0 },
                topMood: '',
                topActivity: '',
                topTag: '',
            };
        }

        // Calculate averages
        const totalRating = logs.reduce((sum, log) => sum + log.rating, 0);
        const averageRating = totalRating / logs.length;

        // Get date range
        const dates = logs.map(log => new Date(log.timestamp).getTime());
        const dateRange = {
            start: new Date(Math.min(...dates)).toISOString().split('T')[0],
            end: new Date(Math.max(...dates)).toISOString().split('T')[0],
        };

        // Calculate hourly averages
        const hourlyData: { [hour: number]: { total: number; count: number } } = {};
        logs.forEach(log => {
            const hour = new Date(log.timestamp).getHours();
            if (!hourlyData[hour]) hourlyData[hour] = { total: 0, count: 0 };
            hourlyData[hour].total += log.rating;
            hourlyData[hour].count++;
        });

        const hourlyAverages = Object.entries(hourlyData).map(([hour, data]) => ({
            hour: parseInt(hour),
            avgRating: data.total / data.count,
        }));

        const bestHour = hourlyAverages.reduce((best, curr) =>
            curr.avgRating > best.avgRating ? curr : best
        );
        const worstHour = hourlyAverages.reduce((worst, curr) =>
            curr.avgRating < worst.avgRating ? curr : worst
        );

        // Get top mood, activity, tag
        const moods = logs.map(log => log.mood);
        const activities = logs.map(log => log.activity).filter(Boolean) as string[];
        const tags = logs.flatMap(log => log.tags || []);

        return {
            totalLogs: logs.length,
            averageRating,
            dateRange,
            bestHour,
            worstHour,
            topMood: this.getMostFrequent(moods),
            topActivity: this.getMostFrequent(activities),
            topTag: this.getMostFrequent(tags),
        };
    }

    /**
     * FR-6.3: Get long-term view data (1 year, 5 years)
     */
    async getLongTermView(years: number = 1): Promise<{
        monthly: { month: string; average: number; count: number }[];
        yearly: { year: number; average: number; count: number }[];
    }> {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - years);

        const logs = await microLogStorage.getFilteredMicroLogs({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        // Monthly aggregation
        const monthlyData: { [key: string]: { total: number; count: number } } = {};
        const yearlyData: { [year: number]: { total: number; count: number } } = {};

        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}`;
            const year = date.getFullYear();

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { total: 0, count: 0 };
            }
            if (!yearlyData[year]) {
                yearlyData[year] = { total: 0, count: 0 };
            }

            monthlyData[monthKey].total += log.rating;
            monthlyData[monthKey].count++;
            yearlyData[year].total += log.rating;
            yearlyData[year].count++;
        });

        const monthly = Object.entries(monthlyData).map(([month, data]) => ({
            month,
            average: data.total / data.count,
            count: data.count,
        }));

        const yearly = Object.entries(yearlyData).map(([year, data]) => ({
            year: parseInt(year),
            average: data.total / data.count,
            count: data.count,
        }));

        return { monthly, yearly };
    }

    /**
     * Get all insights in one call
     */
    async getAllInsights(): Promise<TrendInsight[]> {
        return Promise.all([
            this.analyzeTimeOfDay(),
            this.analyzeDayOfWeek(),
            this.analyzeTagCorrelations(),
            this.analyzeActivityPatterns(),
        ]);
    }

    // Helper methods
    private formatHour(hour: number): string {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}${period}`;
    }

    private getDayName(day: number): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[day];
    }

    private getMostFrequent<T>(arr: T[]): T {
        if (arr.length === 0) return '' as T;
        const frequency: { [key: string]: number } = {};
        arr.forEach(item => {
            const key = String(item);
            frequency[key] = (frequency[key] || 0) + 1;
        });
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
        return sorted[0][0] as unknown as T;
    }

    private calculateConfidence(dataPoints: number): number {
        // Confidence increases with more data points
        if (dataPoints < 10) return 0.2;
        if (dataPoints < 50) return 0.5;
        if (dataPoints < 100) return 0.7;
        return 0.9;
    }
}

export default new AnalyticsService();
