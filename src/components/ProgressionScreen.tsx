import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {dailyContentService} from '../services/dailyContentService';
import {
  UserProgress,
  Achievement,
  WeeklyGoal,
  ProgressionMilestone,
  EngagementAnalytics,
} from '../types/Engagement';
import {CharacterType} from '../types/Character';
import {Animated} from 'react-native';

const {width} = Dimensions.get('window');

interface ProgressionScreenProps {
  userId: string;
  userProgress: UserProgress;
  onProgressUpdate: (progress: UserProgress) => void;
}

export const ProgressionScreen: React.FC<ProgressionScreenProps> = ({
  userId,
  userProgress,
  onProgressUpdate,
}) => {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [milestones, setMilestones] = useState<ProgressionMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'goals' | 'stats'>('overview');

  useEffect(() => {
    loadProgressionData();
  }, [userId]);

  const loadProgressionData = async () => {
    try {
      setLoading(true);
      // In a real implementation, these would be service calls
      await loadWeeklyGoals();
      await loadMilestones();
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to load progression data:', error);
      Alert.alert('エラー', 'プログレッションデータの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyGoals = async () => {
    // Mock weekly goals for demonstration
    const goals: WeeklyGoal[] = [
      {
        id: 'weekly_conversations',
        week: '2024-W29',
        title: '週間会話目標',
        description: '今週は20回以上の会話を目指しましょう',
        type: 'conversation_count',
        target: 20,
        current: userProgress.characterAffinities.aoi.conversationCount + 
                 userProgress.characterAffinities.shun.conversationCount,
        rewards: [
          {
            id: 'weekly_exp_bonus',
            type: 'experience',
            amount: 150,
            description: '経験値ボーナス +150',
          },
        ],
        isCompleted: false,
      },
      {
        id: 'weekly_affinity',
        week: '2024-W29',
        title: '好感度向上目標',
        description: 'キャラクターとの絆を深めましょう',
        type: 'character_affinity',
        target: 100,
        current: userProgress.characterAffinities.aoi.level + 
                 userProgress.characterAffinities.shun.level,
        rewards: [
          {
            id: 'special_scenario_unlock',
            type: 'unlock',
            unlockContent: 'special_bonding_scenario',
            description: '特別な絆シナリオ解放',
          },
        ],
        isCompleted: false,
      },
    ];
    setWeeklyGoals(goals);
  };

  const loadMilestones = async () => {
    // Mock milestones for demonstration
    const milestones: ProgressionMilestone[] = [
      {
        id: 'first_conversation',
        name: '初めての会話',
        description: 'キャラクターとの最初の会話を完了',
        type: 'content',
        requirements: {
          completedContent: ['first_dialogue'],
        },
        rewards: {
          experience: 100,
          unlocks: ['basic_scenarios'],
          characterReactions: [
            {
              characterId: 'aoi',
              reaction: 'ありがとう、君と話せて嬉しいよ',
              emotion: 'happy',
            },
          ],
        },
        isUnlocked: true,
        unlockedAt: new Date(),
      },
      {
        id: 'deep_bond',
        name: '深い絆',
        description: 'キャラクターとの好感度が50に到達',
        type: 'affinity',
        requirements: {
          characterAffinity: {aoi: 50, shun: 50},
        },
        rewards: {
          experience: 500,
          unlocks: ['intimate_scenarios', 'special_cg_gallery'],
          specialContent: 'heart_to_heart_conversation',
        },
        isUnlocked: false,
      },
    ];
    setMilestones(milestones);
  };

  const loadAnalytics = async () => {
    // Mock analytics for demonstration
    const analytics: EngagementAnalytics = {
      userId,
      period: 'weekly',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      metrics: {
        sessionCount: 12,
        totalTime: 180, // minutes
        averageSessionDuration: 15,
        conversationCount: 28,
        scenarioCompletions: 8,
        charactersInteractedWith: ['aoi', 'shun'],
        mostActiveTimeSlot: '19:00-21:00',
        retentionRate: 85,
        engagementScore: 78,
      },
      trends: [
        {metric: 'conversation_count', direction: 'up', changePercentage: 15},
        {metric: 'session_duration', direction: 'stable', changePercentage: 2},
        {metric: 'engagement_score', direction: 'up', changePercentage: 8},
      ],
      recommendations: [
        {
          type: 'content',
          suggestion: 'ロマンスシナリオを試してみませんか？',
          reasoning: '最近の会話パターンから、より感情的な内容に興味がありそうです',
          priority: 1,
        },
      ],
    };
    setAnalytics(analytics);
  };

  const renderProgressBar = (current: number, target: number, color: string = '#4CAF50') => {
    const progress = Math.min(current / target, 1);
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              {width: `${progress * 100}%`, backgroundColor: color}
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {current} / {target}
        </Text>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* User Level and Experience */}
      <View style={styles.levelCard}>
        <Text style={styles.levelTitle}>レベル {userProgress.level}</Text>
        <Text style={styles.experienceText}>
          経験値: {userProgress.totalExperience}
        </Text>
        <View style={styles.streakContainer}>
          <Icon name="local-fire-department" size={24} color="#FF6B35" />
          <Text style={styles.streakText}>
            連続ログイン: {userProgress.streakData.currentStreak}日
          </Text>
        </View>
      </View>

      {/* Character Affinities */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>キャラクター親密度</Text>
        {Object.entries(userProgress.characterAffinities).map(([characterId, affinity]) => (
          <View key={characterId} style={styles.affinityRow}>
            <Text style={styles.characterName}>
              {characterId === 'aoi' ? '蒼' : '瞬'}
            </Text>
            {renderProgressBar(affinity.level, 100, '#E91E63')}
          </View>
        ))}
      </View>

      {/* Weekly Goals Preview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>今週の目標</Text>
        {weeklyGoals.slice(0, 2).map((goal) => (
          <View key={goal.id} style={styles.goalRow}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            {renderProgressBar(goal.current, goal.target)}
          </View>
        ))}
      </View>

      {/* Recent Achievements */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>最近の実績</Text>
        {userProgress.achievements.slice(0, 3).map((achievement) => (
          <View key={achievement.id} style={styles.achievementRow}>
            <Icon 
              name={achievement.isEarned ? "stars" : "star-border"} 
              size={24} 
              color={achievement.isEarned ? "#FFD700" : "#CCC"} 
            />
            <Text style={styles.achievementText}>{achievement.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAchievementsTab = () => (
    <ScrollView style={styles.tabContent}>
      {userProgress.achievements.map((achievement) => (
        <TouchableOpacity key={achievement.id} style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <Icon 
              name={achievement.isEarned ? "stars" : "star-border"} 
              size={32} 
              color={achievement.isEarned ? "#FFD700" : "#CCC"} 
            />
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
            </View>
          </View>
          {!achievement.isEarned && (
            <View style={styles.achievementProgress}>
              {renderProgressBar(achievement.progress, 100)}
            </View>
          )}
          {achievement.earnedAt && (
            <Text style={styles.achievementDate}>
              獲得日: {achievement.earnedAt.toLocaleDateString('ja-JP')}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderGoalsTab = () => (
    <ScrollView style={styles.tabContent}>
      {weeklyGoals.map((goal) => (
        <View key={goal.id} style={styles.goalCard}>
          <Text style={styles.goalCardTitle}>{goal.title}</Text>
          <Text style={styles.goalDescription}>{goal.description}</Text>
          {renderProgressBar(goal.current, goal.target)}
          
          <View style={styles.rewardsContainer}>
            <Text style={styles.rewardsTitle}>報酬:</Text>
            {goal.rewards.map((reward, index) => (
              <Text key={index} style={styles.rewardText}>
                • {reward.description}
              </Text>
            ))}
          </View>
          
          {goal.isCompleted && (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.completedText}>完了</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent}>
      {analytics && (
        <>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>今週の統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{analytics.metrics.sessionCount}</Text>
                <Text style={styles.statLabel}>セッション数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{analytics.metrics.totalTime}分</Text>
                <Text style={styles.statLabel}>総利用時間</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{analytics.metrics.conversationCount}</Text>
                <Text style={styles.statLabel}>会話回数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{analytics.metrics.engagementScore}%</Text>
                <Text style={styles.statLabel}>エンゲージメント</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>トレンド</Text>
            {analytics.trends.map((trend, index) => (
              <View key={index} style={styles.trendRow}>
                <Text style={styles.trendMetric}>{trend.metric}</Text>
                <View style={styles.trendIndicator}>
                  <Icon 
                    name={trend.direction === 'up' ? 'trending-up' : 
                          trend.direction === 'down' ? 'trending-down' : 'trending-flat'} 
                    size={20} 
                    color={trend.direction === 'up' ? '#4CAF50' : 
                           trend.direction === 'down' ? '#F44336' : '#FFC107'} 
                  />
                  <Text style={styles.trendPercentage}>
                    {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>おすすめ</Text>
            {analytics.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationRow}>
                <Text style={styles.recommendationSuggestion}>{rec.suggestion}</Text>
                <Text style={styles.recommendationReasoning}>{rec.reasoning}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'achievements':
        return renderAchievementsTab();
      case 'goals':
        return renderGoalsTab();
      case 'stats':
        return renderStatsTab();
      default:
        return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>プログレッションデータを読み込んでいます...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>プログレッション</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          {key: 'overview', label: '概要', icon: 'dashboard'},
          {key: 'achievements', label: '実績', icon: 'stars'},
          {key: 'goals', label: '目標', icon: 'flag'},
          {key: 'stats', label: '統計', icon: 'analytics'},
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.key ? '#007AFF' : '#666'} 
            />
            <Text style={[
              styles.tabLabel, 
              selectedTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  levelCard: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  experienceText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 60,
    textAlign: 'right',
  },
  affinityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  goalRow: {
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  achievementText: {
    fontSize: 14,
    color: '#333',
  },
  achievementCard: {
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
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  achievementProgress: {
    marginTop: 8,
  },
  achievementDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  rewardsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#666',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendMetric: {
    fontSize: 14,
    color: '#333',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendationRow: {
    marginBottom: 12,
  },
  recommendationSuggestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationReasoning: {
    fontSize: 12,
    color: '#666',
  },
});

export default ProgressionScreen;