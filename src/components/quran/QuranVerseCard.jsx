import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Share } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export const QuranVerseCard = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample verses for demonstration
  const sampleVerses = [
    {
      id: 1,
      surah: 'Al-Baqarah',
      ayah: 255,
      arabicText: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
      translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.',
      reference: 'Quran 2:255 (Ayat al-Kursi)'
    },
    {
      id: 2,
      surah: 'Al-Ikhlas',
      ayah: 1,
      arabicText: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      translation: 'Say, "He is Allah, [who is] One,"',
      reference: 'Quran 112:1'
    },
    {
      id: 3,
      surah: 'Al-Fatiha',
      ayah: 2,
      arabicText: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      translation: '[All] praise is [due] to Allah, Lord of the worlds',
      reference: 'Quran 1:2'
    },
    {
      id: 4,
      surah: 'An-Nur',
      ayah: 35,
      arabicText: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ',
      translation: 'Allah is the light of the heavens and the earth.',
      reference: 'Quran 24:35'
    }
  ];

  useEffect(() => {
    loadVerseOfTheDay();
  }, []);

  const loadVerseOfTheDay = () => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      // Get a random verse for demonstration
      const randomVerse = sampleVerses[Math.floor(Math.random() * sampleVerses.length)];
      setVerse(randomVerse);
      setLoading(false);
    }, 500);
  };

  const handleShare = async () => {
    if (!verse) return;

    try {
      await Share.share({
        message: `${verse.arabicText}\n\n"${verse.translation}"\n\n— ${verse.reference}\n\nShared from Quran Chat Buddy`,
        title: 'Verse from Quran',
      });
    } catch (error) {
      console.error('Error sharing verse:', error);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContent}>
          <MaterialCommunityIcons 
            name="book-open-page-variant" 
            size={32} 
            color={theme.colors.primary} 
          />
          <Text style={styles.loadingText}>Loading verse...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (!verse) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.errorText}>Unable to load verse</Text>
          <Button onPress={loadVerseOfTheDay}>Retry</Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons 
              name="book-open-page-variant" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Text style={styles.title}>Verse of the Day</Text>
          </View>
          <IconButton
            icon="refresh"
            size={20}
            onPress={loadVerseOfTheDay}
          />
        </View>

        {/* Arabic Text */}
        <View style={styles.verseContainer}>
          <Text style={styles.arabicText}>{verse.arabicText}</Text>
        </View>

        {/* Translation */}
        <View style={styles.translationContainer}>
          <Text style={styles.translation}>"{verse.translation}"</Text>
        </View>

        {/* Reference */}
        <View style={styles.referenceContainer}>
          <Text style={styles.reference}>— {verse.reference}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleShare}
            style={styles.shareButton}
            icon="share"
            compact
          >
            Share
          </Button>
          <Button
            mode="contained"
            onPress={loadVerseOfTheDay}
            style={styles.newVerseButton}
            icon="refresh"
            compact
          >
            New Verse
          </Button>
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
  loadingContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  errorText: {
    textAlign: 'center',
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
    color: theme.colors.onSurface,
  },
  verseContainer: {
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  translationContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: theme.colors.onSurface,
    fontStyle: 'italic',
  },
  referenceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  reference: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  shareButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  newVerseButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});