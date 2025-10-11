import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Share } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export const IslamicQuoteCard = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample Islamic quotes and hadiths
  const islamicQuotes = [
    {
      id: 1,
      text: "And Allah is the best of planners.",
      source: "Quran 8:30",
      category: "Trust in Allah",
      arabic: "وَاللَّهُ خَيْرُ الْمَاكِرِينَ",
    },
    {
      id: 2,
      text: "The believer is not one who eats his fill while his neighbor goes hungry.",
      source: "Prophet Muhammad (ﷺ)",
      category: "Compassion",
      arabic: null,
    },
    {
      id: 3,
      text: "And it is He who created the heavens and earth in truth. And the day He says, 'Be,' and it is, His word is the truth.",
      source: "Quran 6:73",
      category: "Faith",
      arabic: "وَهُوَ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ بِالْحَقِّ",
    },
    {
      id: 4,
      text: "Kindness is a mark of faith, and whoever is not kind has no faith.",
      source: "Prophet Muhammad (ﷺ)",
      category: "Character",
      arabic: null,
    },
    {
      id: 5,
      text: "And whoever relies upon Allah - then He is sufficient for him.",
      source: "Quran 65:3",
      category: "Trust in Allah",
      arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    },
    {
      id: 6,
      text: "The best of people are those who benefit others.",
      source: "Prophet Muhammad (ﷺ)",
      category: "Service",
      arabic: null,
    },
  ];

  useEffect(() => {
    loadQuoteOfTheDay();
  }, []);

  const loadQuoteOfTheDay = () => {
    setLoading(true);
    // Simulate loading
    setTimeout(() => {
      // Get a random quote for demonstration
      const randomQuote = islamicQuotes[Math.floor(Math.random() * islamicQuotes.length)];
      setQuote(randomQuote);
      setLoading(false);
    }, 300);
  };

  const handleShare = async () => {
    if (!quote) return;

    try {
      const shareText = quote.arabic 
        ? `${quote.arabic}\n\n"${quote.text}"\n\n— ${quote.source}\n\nShared from Quran Chat Buddy`
        : `"${quote.text}"\n\n— ${quote.source}\n\nShared from Quran Chat Buddy`;

      await Share.share({
        message: shareText,
        title: 'Islamic Wisdom',
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContent}>
          <MaterialCommunityIcons 
            name="format-quote-close" 
            size={32} 
            color={theme.colors.primary} 
          />
          <Text style={styles.loadingText}>Loading wisdom...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.errorText}>Unable to load quote</Text>
          <Button onPress={loadQuoteOfTheDay}>Retry</Button>
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
              name="format-quote-close" 
              size={24} 
              color={theme.colors.secondary} 
            />
            <Text style={styles.title}>Islamic Wisdom</Text>
          </View>
          <IconButton
            icon="refresh"
            size={20}
            onPress={loadQuoteOfTheDay}
          />
        </View>

        {/* Category Badge */}
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.secondary + '20' }]}>
            <Text style={[styles.categoryText, { color: theme.colors.secondary }]}>
              {quote.category}
            </Text>
          </View>
        </View>

        {/* Arabic Text (if available) */}
        {quote.arabic && (
          <View style={styles.arabicContainer}>
            <Text style={styles.arabicText}>{quote.arabic}</Text>
          </View>
        )}

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <MaterialCommunityIcons 
            name="format-quote-open" 
            size={24} 
            color={theme.colors.secondary + '60'} 
            style={styles.openQuote}
          />
          <Text style={styles.quoteText}>{quote.text}</Text>
          <MaterialCommunityIcons 
            name="format-quote-close" 
            size={24} 
            color={theme.colors.secondary + '60'} 
            style={styles.closeQuote}
          />
        </View>

        {/* Source */}
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceText}>— {quote.source}</Text>
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
            Share Wisdom
          </Button>
          <Button
            mode="contained"
            onPress={loadQuoteOfTheDay}
            style={styles.newQuoteButton}
            icon="refresh"
            compact
          >
            New Quote
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
    marginBottom: theme.spacing.md,
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
  categoryContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.lg,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arabicContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  arabicText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  quoteContainer: {
    position: 'relative',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.secondary + '05',
    borderRadius: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    marginBottom: theme.spacing.lg,
  },
  openQuote: {
    position: 'absolute',
    top: -2,
    left: theme.spacing.sm,
  },
  closeQuote: {
    position: 'absolute',
    bottom: -2,
    right: theme.spacing.sm,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.onSurface,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    fontStyle: 'italic',
  },
  sourceContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sourceText: {
    fontSize: 14,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  newQuoteButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
  },
});