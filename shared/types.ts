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

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  metadata?: any;
  priority?: string;
  relatedId?: string;
  expiresAt?: Date;
}