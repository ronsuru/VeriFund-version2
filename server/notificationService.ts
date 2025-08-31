import { storage } from './storage';
import type { InsertNotification } from '@shared/schema';

// Notification System Types
export interface NotificationTemplate {
  title: string;
  messageTemplate: string;
  actionUrlTemplate?: string;
  priority: string;
  icon: string;
}

export interface NotificationContext {
  [key: string]: any;
  campaignId?: string;
  campaignTitle?: string;
  category?: string;
  updateType?: string;
  taskTitle?: string;
  amount?: string;
  fromUser?: string;
  message?: string;
  userName?: string;
  commentId?: string;
  title?: string;
  description?: string;
  announcementId?: string;
  rewardType?: string;
  rewardDescription?: string;
  relatedId?: string;
}

// Notification Type Definitions
export enum NotificationType {
  CAMPAIGN_INTEREST_MATCH = 'campaign_interest_match',
  CAMPAIGN_UPDATE = 'campaign_update', 
  VOLUNTEER_TASK = 'volunteer_task',
  CONTRIBUTION_RECEIVED = 'contribution_received',
  TIP_RECEIVED = 'tip_received',
  COMMENT_MENTION = 'comment_mention',
  ADMIN_ANNOUNCEMENT = 'admin_announcement',
  REWARD_DISTRIBUTION = 'reward_distribution',
  SECURITY_UPDATE = 'security_update'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification Templates
const notificationTemplates: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.CAMPAIGN_INTEREST_MATCH]: {
    title: 'New Campaign Match!',
    messageTemplate: 'A new campaign "{campaignTitle}" matches your interests in {category}.',
    actionUrlTemplate: '/campaigns/{campaignId}',
    priority: NotificationPriority.NORMAL,
    icon: '🎯'
  },
  
  [NotificationType.CAMPAIGN_UPDATE]: {
    title: 'Campaign Update',
    messageTemplate: '"{campaignTitle}" has a new update: {updateType}',
    actionUrlTemplate: '/campaigns/{campaignId}',
    priority: NotificationPriority.NORMAL,
    icon: '📢'
  },
  
  [NotificationType.VOLUNTEER_TASK]: {
    title: 'New Volunteer Task',
    messageTemplate: 'New task available for "{campaignTitle}": {taskTitle}',
    actionUrlTemplate: '/volunteer-applications',
    priority: NotificationPriority.NORMAL,
    icon: '🤝'
  },
  
  [NotificationType.CONTRIBUTION_RECEIVED]: {
    title: 'Contribution Received!',
    messageTemplate: 'You received ₱{amount} for "{campaignTitle}"{fromUser}',
    actionUrlTemplate: '/campaigns/{campaignId}',
    priority: NotificationPriority.HIGH,
    icon: '💰'
  },
  
  [NotificationType.TIP_RECEIVED]: {
    title: 'Tip Received!',
    messageTemplate: 'You received a ₱{amount} tip{fromUser}{message}',
    actionUrlTemplate: '/my-profile',
    priority: NotificationPriority.HIGH,
    icon: '🎁'
  },
  
  [NotificationType.COMMENT_MENTION]: {
    title: 'You were mentioned',
    messageTemplate: '{userName} mentioned you in a comment on "{campaignTitle}"',
    actionUrlTemplate: '/campaigns/{campaignId}#comment-{commentId}',
    priority: NotificationPriority.NORMAL,
    icon: '💬'
  },
  
  [NotificationType.ADMIN_ANNOUNCEMENT]: {
    title: 'Platform Announcement',
    messageTemplate: '{title}: {description}',
    actionUrlTemplate: '/announcements/{announcementId}',
    priority: NotificationPriority.HIGH,
    icon: '📣'
  },
  
  [NotificationType.REWARD_DISTRIBUTION]: {
    title: 'Reward Earned!',
    messageTemplate: 'Congratulations! You earned {rewardType}: {rewardDescription}',
    actionUrlTemplate: '/my-profile',
    priority: NotificationPriority.HIGH,
    icon: '🏆'
  },
  
  [NotificationType.SECURITY_UPDATE]: {
    title: 'Security Notice',
    messageTemplate: 'Security update for your account: {updateType}',
    actionUrlTemplate: '/my-profile',
    priority: NotificationPriority.URGENT,
    icon: '🔒'
  }
};

export class NotificationService {
  /**
   * Create a notification for a user
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    context: NotificationContext,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const template = notificationTemplates[type];
      if (!template) {
        throw new Error(`Unknown notification type: ${type}`);
      }

      const title = template.title;
      const message = this.interpolateTemplate(template.messageTemplate, context);
      const actionUrl = template.actionUrlTemplate ? 
        this.interpolateTemplate(template.actionUrlTemplate, context) : undefined;

      await storage.createNotification({
        userId,
        title,
        message,
        type,
        actionUrl,
        metadata: context,
        priority: template.priority,
        relatedId: context.campaignId || context.relatedId,
        expiresAt
      } as InsertNotification);

      console.log(`✅ Notification created for user ${userId}: ${type}`);
    } catch (error) {
      console.error(`❌ Failed to create notification for user ${userId}:`, error);
    }
  }

  /**
   * Create notifications for multiple users
   */
  static async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    context: NotificationContext,
    expiresAt?: Date
  ): Promise<void> {
    const promises = userIds.map(userId => 
      this.createNotification(userId, type, context, expiresAt)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Campaign Interest Matching Notifications
   */
  static async notifyCampaignInterestMatch(
    userIds: string[],
    campaignId: string,
    campaignTitle: string,
    category: string
  ): Promise<void> {
    await this.createBulkNotifications(userIds, NotificationType.CAMPAIGN_INTEREST_MATCH, {
      campaignId,
      campaignTitle,
      category
    });
  }

  /**
   * Campaign Update Notifications
   */
  static async notifyCampaignUpdate(
    contributorIds: string[],
    campaignId: string,
    campaignTitle: string,
    updateType: 'milestone_reached' | 'status_change' | 'completion' | 'issue_reported'
  ): Promise<void> {
    await this.createBulkNotifications(contributorIds, NotificationType.CAMPAIGN_UPDATE, {
      campaignId,
      campaignTitle,
      updateType
    });
  }

  /**
   * Volunteer Task Notifications
   */
  static async notifyVolunteerTask(
    volunteerIds: string[],
    campaignId: string,
    campaignTitle: string,
    taskTitle: string
  ): Promise<void> {
    await this.createBulkNotifications(volunteerIds, NotificationType.VOLUNTEER_TASK, {
      campaignId,
      campaignTitle,
      taskTitle
    });
  }

  /**
   * Contribution Received Notifications
   */
  static async notifyContributionReceived(
    creatorId: string,
    amount: string,
    campaignId: string,
    campaignTitle: string,
    contributorName?: string
  ): Promise<void> {
    await this.createNotification(creatorId, NotificationType.CONTRIBUTION_RECEIVED, {
      amount,
      campaignId,
      campaignTitle,
      fromUser: contributorName ? ` from ${contributorName}` : ''
    });
  }

  /**
   * Tip Received Notifications
   */
  static async notifyTipReceived(
    recipientId: string,
    amount: string,
    tipperName?: string,
    message?: string
  ): Promise<void> {
    await this.createNotification(recipientId, NotificationType.TIP_RECEIVED, {
      amount,
      fromUser: tipperName ? ` from ${tipperName}` : '',
      message: message ? ` with message: "${message}"` : ''
    });
  }

  /**
   * Comment Mention Notifications
   */
  static async notifyCommentMention(
    mentionedUserId: string,
    userName: string,
    campaignId: string,
    campaignTitle: string,
    commentId: string
  ): Promise<void> {
    await this.createNotification(mentionedUserId, NotificationType.COMMENT_MENTION, {
      userName,
      campaignId,
      campaignTitle,
      commentId
    });
  }

  /**
   * Admin Announcement Notifications
   */
  static async notifyAdminAnnouncement(
    userIds: string[],
    title: string,
    description: string,
    announcementId?: string
  ): Promise<void> {
    await this.createBulkNotifications(userIds, NotificationType.ADMIN_ANNOUNCEMENT, {
      title,
      description,
      announcementId
    });
  }

  /**
   * Reward Distribution Notifications
   */
  static async notifyRewardDistribution(
    userId: string,
    rewardType: 'airdrop' | 'badge' | 'rank_promotion' | 'bonus',
    rewardDescription: string
  ): Promise<void> {
    await this.createNotification(userId, NotificationType.REWARD_DISTRIBUTION, {
      rewardType,
      rewardDescription
    });
  }

  /**
   * Security Update Notifications
   */
  static async notifySecurityUpdate(
    userId: string,
    updateType: 'kyc_verified' | 'kyc_required' | 'password_change' | 'login_alert'
  ): Promise<void> {
    await this.createNotification(userId, NotificationType.SECURITY_UPDATE, {
      updateType
    });
  }

  /**
   * Interpolate template variables with context data
   */
  private static interpolateTemplate(template: string, context: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  /**
   * Get notification statistics for analytics
   */
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    const notifications = await storage.getUserNotifications(userId);
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      await storage.deleteExpiredNotifications();
      console.log('✅ Expired notifications cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup expired notifications:', error);
    }
  }
}