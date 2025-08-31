# Campaign Slots System

## Overview
The Campaign Slots System implements a tiered approach to campaign creation limits based on user credit scores and account age. This system promotes quality campaigns while providing opportunities for new users and those looking to improve their standing.

## Features

### 1. First-Month Access (Onboarding Benefit)
- **All new verified users** get **3 campaign slots** immediately upon sign-up
- These slots are valid only for the **first month** and can be used without restrictions
- After the first month, slot allocation depends on the user's credit score

### 2. Credit Score Tiers & Monthly Free Slots

| Credit Score | Free Slots/Month | Description |
|--------------|------------------|-------------|
| 80–100%     | 5 slots         | Highest trust level, maximum flexibility |
| 75–79%      | 3 slots         | Moderate trust |
| 65–74%      | 1 slot          | Limited campaigns |
| 50–64%      | 0 slots         | Must improve trust or purchase slots |
| 35–49%      | 0 slots         | Very limited access |
| 20–34%      | 0 slots         | Near suspension threshold |
| <20%        | 0 slots         | Cannot create campaigns until score improves |

### 3. Paid Slot Access (Score-Gated)

| Credit Score | Available Slots | Price | Total Possible |
|--------------|-----------------|-------|----------------|
| 50–64%      | Up to 3 slots  | ₱9,000 for 3 | 3 total |
| 35–49%      | Up to 2 slots  | ₱6,000 for 2 | 2 total |
| 20–34%      | 1 slot         | ₱3,000 for 1 | 1 total |
| <20%        | None           | 0    | 0 |

### 4. Slot Rules & Score Impact
- **Slot counts reset every 30 days** from the date of the user's first campaign creation
- **Campaign success and community ratings** directly affect credit scores
- **Paid slots are monthly**, non-transferable, and non-refundable
- **Campaigns only count towards score** once they reach their operational funding threshold

## Technical Implementation

### Database Schema
The `monthly_campaign_limits` table has been extended with new fields:

```sql
ALTER TABLE monthly_campaign_limits 
ADD COLUMN paid_slots_available INTEGER NOT NULL DEFAULT 0,
ADD COLUMN paid_slot_price INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_first_month BOOLEAN NOT NULL DEFAULT false;
```

### API Endpoints
- `GET /api/user/campaign-slots` - Get current user's campaign slot information
- Includes countdown timer, current usage, and next tier information

### Frontend Integration
- **Campaign Slots Card** added to user profile page
- Shows current month status, progress bar, countdown timer
- Displays next tier information and paid slot options
- Real-time updates when slots are used

## User Experience

### Profile Page Display
The Campaign Slots section shows:
1. **Current Month Status** - Slots remaining and allocation type
2. **Progress Bar** - Visual representation of slot usage
3. **Reset Countdown** - Days until 30-day cycle refresh (from first campaign date)
4. **Next Tier Info** - How to unlock more slots
5. **Paid Slots** - Purchase options when available

### Error Messages
When users reach their limit, they receive clear information about:
- Current usage vs. limit
- Credit score requirements for next tier
- Paid slot options (if available)
- Steps to improve their standing

## Benefits

### For Users
- **Transparent limits** with clear progression paths
- **First-month bonus** encourages new user engagement
- **Multiple ways to access slots** (improve score or purchase)
- **Monthly reset** provides regular opportunities

### For Platform
- **Quality control** through credit score requirements
- **Revenue generation** through paid slot sales
- **User engagement** through clear progression goals
- **Fraud prevention** through tiered access control
- **Consistent timing** through 30-day cycles from first campaign creation

## Future Enhancements

### Planned Features
- **Paid slot purchase flow** with payment integration
- **Slot gifting** between users
- **Bulk slot packages** for power users
- **Seasonal bonuses** and special events

### Analytics
- Slot usage patterns and trends
- Credit score improvement tracking
- Revenue from paid slot sales
- User progression through tiers

## Migration Notes

### Database Updates
Run the migration script to add new fields:
```bash
psql -d your_database -f migrations/add-campaign-slot-fields.sql
```

### Existing Users
- Current monthly records will be updated with default values
- New records will automatically include the new fields
- No data loss or disruption to existing functionality

## Support

For questions or issues with the Campaign Slots System:
1. Check the user's credit score and current tier
2. Verify monthly record creation and updates
3. Review slot usage and remaining allocation
4. Confirm payment processing for paid slots (when implemented)
