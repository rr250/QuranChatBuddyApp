import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export const StatisticsCard = () => {
  const [stats, setStats] = useState({
    prayersCompleted: 0,
    totalPrayers: 5,
    quranPagesRead: 0,
    quizScore: 0,
    streakDays: 0,
  });

  useEffect(() => {
    loadUserStatistics();
  }, []);

  const loadUserStatistics = () => {
    // In a real app, this would load from Firebase
    // For now, using sample data
    setStats({
      prayersCompleted: 3,
      totalPrayers: 5,
      quranPagesRead: 12,
      quizScore: 85,
      streakDays: 7,
    });
  };

  const statisticItems = [
    {
      id: 'prayers',
      title: 'Prayers Today',
      value: `${stats.prayersCompleted}/${stats.totalPrayers}`,
      progress: stats.prayersCompleted / stats.totalPrayers,
      icon: 'clock-check',
      color: theme.colors.primary,
    },
    {
      id: 'quran',
      title: 'Quran Pages',
      value: `${stats.quranPagesRead}`,
      progress: (stats.quranPagesRead % 10) / 10, // Mock progress
      icon: 'book-open-page-variant',
      color: theme.colors.secondary,
    },
    {
      id: 'quiz',
      title: 'Quiz Average',
      value: `${stats.quizScore}%`,
      progress: stats.quizScore / 100,
      icon: 'head-question',
      color: theme.colors.asr,
    },
    {
      id: 'streak',
      title: 'Daily Streak',
      value: `${stats.streakDays} days`,
      progress: (stats.streakDays % 30) / 30, // Mock progress for 30-day cycle
      icon: 'fire',
      color: theme.colors.maghrib,
    },
  ];

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="chart-line" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.title}>Your Progress</Text>
        </View>

        <View style={styles.statsGrid}>
          {statisticItems.map((item) => (
            <View key={item.id} style={styles.statItem}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: item.color + '20' }]}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={20} 
                    color={item.color} 
                  />
                </View>
                <Text style={styles.statValue}>{item.value}</Text>
              </View>
              <Text style={styles.statTitle}>{item.title}</Text>
              <ProgressBar
                progress={item.progress}
                color={item.color}
                style={styles.progressBar}
              />
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Today's Goal</Text>
            <Text style={styles.summaryValue}>
              {Math.round((stats.prayersCompleted / stats.totalPrayers) * 100)}% Complete
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryValue}>Keep up the great work! 🌟</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurface,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outline + '30',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.outline,
    marginHorizontal: theme.spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
});