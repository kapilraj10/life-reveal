# 🚀 Quick Integration Guide

## Option 1: Replace Home Screen (Recommended)

Replace the existing `app/home.tsx` with the new dashboard:

```typescript
// app/home.tsx
import React from 'react';
import { DashboardScreen } from '../src/screens/DashboardScreen';

export default function HomeScreen() {
    return <DashboardScreen />;
}
```

## Option 2: Add as Tab Navigation

Add dashboard to your tab navigation:

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      {/* ... other tabs ... */}
    </Tabs>
  );
}
```

Then update `app/(tabs)/index.tsx`:

```typescript
// app/(tabs)/index.tsx
import React from 'react';
import { DashboardScreen } from '../../src/screens/DashboardScreen';

export default function TabIndexScreen() {
    return <DashboardScreen />;
}
```

## Option 3: Separate Route

Keep existing home and add dashboard as separate route:

```typescript
// Usage in any component
import { router } from 'expo-router';

const goToDashboard = () => {
    router.push('/dashboard');
};
```

## 🎯 Testing the Dashboard

### 1. Test Daily Reflection
```typescript
// Type in the text area
// Wait 1 second → Auto-save should trigger
// Click "Save Reflection" → Alert confirms save
// Restart app → Reflection should load
```

### 2. Test Goals
```typescript
// Type goal title, click +
// Click checkbox → Goal marked complete
// Check achievements → Should see "Completed: [goal]"
// Click × → Goal deleted
// Progress bar should update
```

### 3. Test Achievements
```typescript
// Complete a goal → Achievement appears
// Reflect 7 days in a row → "7-Day Streak!" appears
// All achievements stay permanent
```

### 4. Test Logout
```typescript
// Click Logout → Confirmation appears
// Confirm → Redirects to login
// Data remains safe (not deleted)
// Login again → All data still there
```

## 🔧 Customization Examples

### Change Colors
```typescript
// Update in each component's StyleSheet
backgroundColor: '#YOUR_COLOR'
```

### Change Auto-Save Delay
```typescript
// In DailyReflectionChat.tsx, line ~67
setTimeout(() => {
    autoSaveAsync();
}, 2000); // Change to 2 seconds
```

### Limit Achievements Shown
```typescript
// In GoalsAchievementsSection.tsx, line ~48
achievementsStorage.getRecent(10), // Change from 5 to 10
```

### Customize Achievement Emoji
```typescript
// In GoalsAchievementsSection.tsx, getAchievementEmoji function
case 'goal_completed':
    return '🎉'; // Change emoji
```

## 📊 Data Access Examples

### View All Reflections
```typescript
import { reflectionStorage } from '../src/storage/localData';

const viewAllReflections = async () => {
    const all = await reflectionStorage.getAll();
    console.log('All reflections:', all);
};
```

### Get Weekly Goals Stats
```typescript
import { goalsStorage } from '../src/storage/localData';

const getWeeklyStats = async () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const goals = await goalsStorage.getByDate(dateStr);
        last7Days.push({ date: dateStr, goals });
    }
    
    console.log('Last 7 days:', last7Days);
};
```

### Export All Data (Backup)
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const exportAllData = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const lifeRevealKeys = keys.filter(k => k.startsWith('@lifereveal:'));
    const data = await AsyncStorage.multiGet(lifeRevealKeys);
    
    const backup = {};
    data.forEach(([key, value]) => {
        backup[key] = JSON.parse(value);
    });
    
    console.log('Backup:', JSON.stringify(backup, null, 2));
    // Save to file or send to server
};
```

## 🎨 UI Customization

### Add Custom Header Action
```typescript
// In DashboardHeader.tsx
<TouchableOpacity onPress={handleSettings}>
    <Text style={styles.settingsIcon}>⚙️</Text>
</TouchableOpacity>
```

### Add Animations
```bash
npm install react-native-reanimated
```

```typescript
import Animated, { FadeInDown } from 'react-native-reanimated';

// Wrap components
<Animated.View entering={FadeInDown}>
    <DailyReflectionChat />
</Animated.View>
```

### Add Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';

const handleGoalComplete = async () => {
    await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
    );
    // ... rest of code
};
```

## 🧪 Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Can type in reflection text area
- [ ] Auto-save works after 1 second
- [ ] Can submit reflection
- [ ] Reflection loads on app restart
- [ ] Past reflections are read-only
- [ ] Can add new goal
- [ ] Can mark goal as complete
- [ ] Achievement appears on completion
- [ ] Progress bar updates correctly
- [ ] Can delete today's goals
- [ ] Cannot delete past goals
- [ ] Logout shows confirmation
- [ ] Logout redirects to login
- [ ] Data persists after logout/login

## 🚨 Common Issues

### Issue: "Cannot read property 'user' of undefined"
**Solution**: Ensure AuthContext is properly wrapped around the app

### Issue: AsyncStorage not working
**Solution**: 
```bash
npm install @react-native-async-storage/async-storage
npx expo prebuild
```

### Issue: Components not updating
**Solution**: Check that useState is being called properly and state updates trigger re-renders

### Issue: Dates showing wrong day
**Solution**: Verify timezone handling in `getTodayDate()` function

## 📱 Platform-Specific Notes

### iOS
- Shadow works natively
- Haptic feedback supported
- Auto-save works smoothly

### Android
- Use `elevation` instead of shadow
- Haptic feedback limited
- May need keyboard handling adjustments

### Web
- AsyncStorage uses localStorage
- Some animations may differ
- Test responsive breakpoints

## 🎓 Next Steps

1. **Test thoroughly** on all target platforms
2. **Add error tracking** (e.g., Sentry)
3. **Implement analytics** to track usage
4. **Add onboarding** for first-time users
5. **Create backup system** for cloud sync
6. **Add push notifications** for daily reminders
7. **Implement search** for historical data
8. **Add export feature** for data portability

---

**Need Help?** Check the main `DASHBOARD_IMPLEMENTATION.md` for detailed API documentation.
