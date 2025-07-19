import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {dailyContentService} from '../services/dailyContentService';
import {
  DailyContent,
  SpecialEvent,
  CharacterMoment,
  SeasonalTheme,
} from '../types/Engagement';
import {CharacterType} from '../types/Character';

const {width} = Dimensions.get('window');

interface DailyContentScreenProps {
  userId: string;
  onContentSelect: (content: DailyContent) => void;
  onSpecialEventSelect: (event: SpecialEvent) => void;
  onCharacterMomentSelect: (moment: CharacterMoment) => void;
}

export const DailyContentScreen: React.FC<DailyContentScreenProps> = ({
  userId,
  onContentSelect,
  onSpecialEventSelect,
  onCharacterMomentSelect,
}) => {
  const [dailyContent, setDailyContent] = useState<DailyContent[]>([]);
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>([]);
  const [characterMoments, setCharacterMoments] = useState<{
    aoi: CharacterMoment[];
    shun: CharacterMoment[];
  }>({aoi: [], shun: []});
  const [currentTheme, setCurrentTheme] = useState<SeasonalTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContent();
  }, [userId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      await dailyContentService.initialize();

      // Load today's daily content
      const today = new Date();
      const content = await dailyContentService.generateDailyContent(today, userId);
      setDailyContent(content);

      // Load active special events
      const events = await dailyContentService.getActiveSpecialEvents(today);
      setSpecialEvents(events);

      // Load available character moments
      const aoiMoments = await dailyContentService.getAvailableCharacterMoments('aoi', userId);
      const shunMoments = await dailyContentService.getAvailableCharacterMoments('shun', userId);
      setCharacterMoments({aoi: aoiMoments, shun: shunMoments});

      // Get current seasonal theme
      const theme = dailyContentService.getCurrentSeasonalTheme(today);
      setCurrentTheme(theme);
    } catch (error) {
      console.error('Failed to load daily content:', error);
      Alert.alert('エラー', 'コンテンツの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  const handleContentComplete = async (content: DailyContent) => {
    try {
      const success = await dailyContentService.completeContent(content.id, userId);
      if (success) {
        // Update content status
        setDailyContent(prev =>
          prev.map(item =>
            item.id === content.id ? {...item, isCompleted: true} : item
          )
        );
        onContentSelect(content);
      }
    } catch (error) {
      console.error('Failed to complete content:', error);
      Alert.alert('エラー', 'コンテンツの完了処理に失敗しました。');
    }
  };

  const renderDailyContentCard = (content: DailyContent) => (
    <TouchableOpacity
      key={content.id}
      style={[
        styles.contentCard,
        content.isCompleted && styles.completedCard,
        currentTheme && {backgroundColor: currentTheme.colors.background},
      ]}
      onPress={() => handleContentComplete(content)}
      disabled={content.isCompleted}
    >
      <View style={styles.cardHeader}>
        <Text style={[
          styles.cardTitle,
          currentTheme && {color: currentTheme.colors.primary},
        ]}>
          {content.title}
        </Text>
        {content.isCompleted && (
          <Icon name="check-circle" size={24} color="#4CAF50" />
        )}
      </View>
      <Text style={styles.cardDescription}>{content.description}</Text>
      
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.metaText}>{content.estimatedDuration}分</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.metaText}>{content.difficulty}</Text>
        </View>
        {content.characterId && (
          <View style={styles.metaItem}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.metaText}>
              {content.characterId === 'aoi' ? '蒼' : '瞬'}
            </Text>
          </View>
        )}
      </View>

      {content.rewards.length > 0 && (
        <View style={styles.rewardsContainer}>
          <Text style={styles.rewardsTitle}>報酬:</Text>
          {content.rewards.map((reward, index) => (
            <Text key={index} style={styles.rewardText}>
              {reward.description}
            </Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSpecialEventCard = (event: SpecialEvent) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, currentTheme && {borderColor: currentTheme.colors.accent}]}
      onPress={() => onSpecialEventSelect(event)}
    >
      <View style={styles.eventHeader}>
        <Text style={[
          styles.eventTitle,
          currentTheme && {color: currentTheme.colors.accent},
        ]}>
          {event.name}
        </Text>
        <View style={styles.eventBadge}>
          <Text style={styles.eventBadgeText}>{event.type}</Text>
        </View>
      </View>
      <Text style={styles.eventDescription}>{event.description}</Text>
      
      {event.eventScenarios.length > 0 && (
        <View style={styles.scenariosContainer}>
          <Text style={styles.scenariosTitle}>特別シナリオ:</Text>
          {event.eventScenarios.slice(0, 3).map((scenario, index) => (
            <Text key={index} style={styles.scenarioText}>• {scenario}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCharacterMomentCard = (moment: CharacterMoment) => (
    <TouchableOpacity
      key={moment.id}
      style={[styles.momentCard]}
      onPress={() => onCharacterMomentSelect(moment)}
    >
      <View style={styles.momentHeader}>
        <Text style={styles.momentTitle}>{moment.title}</Text>
        <Text style={styles.momentCharacter}>
          {moment.characterId === 'aoi' ? '蒼' : '瞬'}
        </Text>
      </View>
      <Text style={styles.momentDescription}>{moment.description}</Text>
      <View style={styles.momentType}>
        <Icon name="favorite" size={16} color="#E91E63" />
        <Text style={styles.momentTypeText}>{moment.momentType}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSeasonalTheme = () => {
    if (!currentTheme) return null;

    return (
      <View style={[
        styles.themeContainer,
        {backgroundColor: currentTheme.colors.background},
      ]}>
        <Text style={[
          styles.themeTitle,
          {color: currentTheme.colors.primary},
        ]}>
          {currentTheme.name}
        </Text>
        <Text style={[
          styles.themeDescription,
          {color: currentTheme.colors.secondary},
        ]}>
          {currentTheme.description}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>コンテンツを読み込んでいます...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderSeasonalTheme()}

        {/* Daily Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日のコンテンツ</Text>
          {dailyContent.length > 0 ? (
            dailyContent.map(renderDailyContentCard)
          ) : (
            <Text style={styles.emptyText}>今日のコンテンツはありません</Text>
          )}
        </View>

        {/* Special Events Section */}
        {specialEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>特別イベント</Text>
            {specialEvents.map(renderSpecialEventCard)}
          </View>
        )}

        {/* Character Moments Section */}
        {(characterMoments.aoi.length > 0 || characterMoments.shun.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>キャラクターの特別な瞬間</Text>
            
            {characterMoments.aoi.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>蒼</Text>
                {characterMoments.aoi.map(renderCharacterMomentCard)}
              </View>
            )}

            {characterMoments.shun.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>瞬</Text>
                {characterMoments.shun.map(renderCharacterMomentCard)}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  themeContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  themeDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#F8F8F8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  rewardsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  rewardsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 11,
    color: '#666',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  eventBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  scenariosContainer: {
    marginTop: 8,
  },
  scenariosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scenarioText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
  momentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  momentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  momentCharacter: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  momentDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  momentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  momentTypeText: {
    fontSize: 12,
    color: '#E91E63',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginVertical: 32,
  },
});

export default DailyContentScreen;