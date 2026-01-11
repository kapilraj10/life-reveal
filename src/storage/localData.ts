import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local Storage Keys
 */
const STORAGE_KEYS = {
    DAILY_REFLECTIONS: '@lifereveal:daily_reflections',
    DAILY_GOALS: '@lifereveal:daily_goals',
    ACHIEVEMENTS: '@lifereveal:achievements',
    USER_SESSION: '@lifereveal:user_session',
};

/**
 * Data Types
 */
export interface DailyReflection {
    date: string; // YYYY-MM-DD
    reflectionText: string;
    createdAt: string; // ISO timestamp
}

export interface DailyGoal {
    id: string;
    title: string;
    completed: boolean;
    date: string; // YYYY-MM-DD
    createdAt: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    date: string; // YYYY-MM-DD
    createdAt: string;
    type: 'goal_completed' | 'streak' | 'milestone';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

/**
 * Check if a date is today
 */
export const isToday = (date: string): boolean => {
    return date === getTodayDate();
};

/**
 * Daily Reflections Storage
 */
export const reflectionStorage = {
    /**
     * Get all reflections
     */
    async getAll(): Promise<DailyReflection[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_REFLECTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading reflections:', error);
            return [];
        }
    },

    /**
     * Get today's reflection
     */
    async getToday(): Promise<DailyReflection | null> {
        const reflections = await this.getAll();
        const today = getTodayDate();
        return reflections.find((r) => r.date === today) || null;
    },

    /**
     * Save or update today's reflection
     */
    async saveToday(text: string): Promise<DailyReflection> {
        const reflections = await this.getAll();
        const today = getTodayDate();
        const existingIndex = reflections.findIndex((r) => r.date === today);

        const reflection: DailyReflection = {
            date: today,
            reflectionText: text,
            createdAt: existingIndex >= 0 ? reflections[existingIndex].createdAt : new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            reflections[existingIndex] = reflection;
        } else {
            reflections.push(reflection);
        }

        // Sort by date descending
        reflections.sort((a, b) => b.date.localeCompare(a.date));

        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_REFLECTIONS, JSON.stringify(reflections));
        return reflection;
    },

    /**
     * Get reflection for specific date
     */
    async getByDate(date: string): Promise<DailyReflection | null> {
        const reflections = await this.getAll();
        return reflections.find((r) => r.date === date) || null;
    },
};

/**
 * Daily Goals Storage
 */
export const goalsStorage = {
    /**
     * Get all goals
     */
    async getAll(): Promise<DailyGoal[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading goals:', error);
            return [];
        }
    },

    /**
     * Get today's goals
     */
    async getToday(): Promise<DailyGoal[]> {
        const goals = await this.getAll();
        const today = getTodayDate();
        return goals.filter((g) => g.date === today);
    },

    /**
     * Add a new goal for today
     */
    async addGoal(title: string): Promise<DailyGoal> {
        const goals = await this.getAll();
        const newGoal: DailyGoal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            completed: false,
            date: getTodayDate(),
            createdAt: new Date().toISOString(),
        };

        goals.push(newGoal);
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));

        return newGoal;
    },

    /**
     * Toggle goal completion
     */
    async toggleGoal(goalId: string): Promise<DailyGoal | null> {
        const goals = await this.getAll();
        const goalIndex = goals.findIndex((g) => g.id === goalId);

        if (goalIndex === -1) return null;

        const goal = goals[goalIndex];

        // Only allow toggling today's goals
        if (!isToday(goal.date)) return null;

        goal.completed = !goal.completed;
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));

        // Create achievement if goal is completed
        if (goal.completed) {
            await achievementsStorage.addAchievement({
                title: `Completed: ${goal.title}`,
                description: `You completed your goal: ${goal.title}`,
                type: 'goal_completed',
            });
        }

        return goal;
    },

    /**
     * Delete a goal
     */
    async deleteGoal(goalId: string): Promise<void> {
        const goals = await this.getAll();
        const goal = goals.find((g) => g.id === goalId);

        // Only allow deleting today's goals
        if (!goal || !isToday(goal.date)) return;

        const filtered = goals.filter((g) => g.id !== goalId);
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(filtered));
    },

    /**
     * Get goals by date
     */
    async getByDate(date: string): Promise<DailyGoal[]> {
        const goals = await this.getAll();
        return goals.filter((g) => g.date === date);
    },

    /**
     * Get completion stats
     */
    async getStats(): Promise<{ total: number; completed: number; percentage: number }> {
        const todayGoals = await this.getToday();
        const total = todayGoals.length;
        const completed = todayGoals.filter((g) => g.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { total, completed, percentage };
    },
};

/**
 * Achievements Storage
 */
export const achievementsStorage = {
    /**
     * Get all achievements
     */
    async getAll(): Promise<Achievement[]> {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading achievements:', error);
            return [];
        }
    },

    /**
     * Add a new achievement
     */
    async addAchievement(params: {
        title: string;
        description: string;
        type: Achievement['type'];
    }): Promise<Achievement> {
        const achievements = await this.getAll();
        const newAchievement: Achievement = {
            id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: params.title,
            description: params.description,
            date: getTodayDate(),
            createdAt: new Date().toISOString(),
            type: params.type,
        };

        achievements.unshift(newAchievement);
        await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));

        return newAchievement;
    },

    /**
     * Get recent achievements (last N)
     */
    async getRecent(limit: number = 5): Promise<Achievement[]> {
        const achievements = await this.getAll();
        return achievements.slice(0, limit);
    },

    /**
     * Check for streak achievements
     */
    async checkStreaks(): Promise<void> {
        const reflections = await reflectionStorage.getAll();

        // Calculate consecutive days
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            if (reflections.find((r) => r.date === dateStr)) {
                streak++;
            } else {
                break;
            }
        }

        // Award streak achievements
        if (streak === 7 && !await this.hasStreak(7)) {
            await this.addAchievement({
                title: '7-Day Streak! 🔥',
                description: 'You reflected for 7 days in a row!',
                type: 'streak',
            });
        } else if (streak === 30 && !await this.hasStreak(30)) {
            await this.addAchievement({
                title: '30-Day Streak! 🏆',
                description: 'Incredible! 30 days of reflection!',
                type: 'streak',
            });
        }
    },

    /**
     * Check if streak achievement exists
     */
    async hasStreak(days: number): Promise<boolean> {
        const achievements = await this.getAll();
        return achievements.some(
            (a) => a.type === 'streak' && a.title.includes(`${days}-Day`)
        );
    },
};

/**
 * Clear all local data (for logout)
 */
export const clearAllData = async (): Promise<void> => {
    try {
        // Only clear session, keep data safe
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } catch (error) {
        console.error('Error clearing session:', error);
    }
};

/**
 * Export storage keys for direct access if needed
 */
export { STORAGE_KEYS };
