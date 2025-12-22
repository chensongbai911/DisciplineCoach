# Membership and Payment System

## ADDED Requirements

### Requirement: Subscription-Based Membership Tiers
The system SHALL offer three subscription tiers: monthly (18元), quarterly (48元), and annual (168元).

#### Scenario: View membership options
- **WHEN** user accesses membership center page
- **THEN** three subscription tiers SHALL be displayed:
  - 月度会员: ¥18/月
  - 季度会员: ¥48/3个月 (¥16/月)
  - 年度会员: ¥168/年 (¥14/月)
- **AND** each tier SHALL show price and benefits
- **AND** recommended tier SHALL be highlighted

#### Scenario: New user first-time discount (optional)
- **WHEN** new user views membership options
- **THEN** optional first-month discount SHALL show ¥9.9 for first month
- **AND** discount badge SHALL be prominently displayed
- **AND** after first month, regular pricing SHALL apply

### Requirement: Membership Purchase Flow
The system SHALL integrate WeChat Pay for seamless in-app purchase.

#### Scenario: Initiate membership purchase
- **WHEN** user selects membership tier and taps purchase button
- **THEN** tier selection SHALL be highlighted
- **AND** user SHALL be shown service agreement checkbox
- **AND** purchase button SHALL be enabled only after agreement acceptance

#### Scenario: Complete WeChat payment
- **WHEN** user confirms purchase
- **THEN** WeChat Pay modal SHALL be invoked via wx.requestPayment
- **AND** payment parameters SHALL include order_id, amount, timestamp, signature
- **AND** user SHALL complete payment in WeChat payment interface

#### Scenario: Payment success
- **WHEN** payment is completed successfully
- **THEN** backend SHALL receive payment callback from WeChat
- **AND** user.is_member SHALL be updated to true
- **AND** user.member_expire_at SHALL be set to current_date + subscription_duration
- **AND** success page SHALL be shown with confirmation message
- **AND** user SHALL be granted immediate access to member features

#### Scenario: Payment failure
- **WHEN** payment fails or is cancelled
- **THEN** error message SHALL be displayed
- **AND** user SHALL remain non-member
- **AND** user can retry payment

### Requirement: Member Status Management
The system SHALL track and display member status and expiration date.

#### Scenario: Display member status in UI
- **WHEN** member user views personal center
- **THEN** member badge SHALL be displayed
- **AND** expiration date SHALL be shown (e.g., "会员有效期至 2024-12-31")
- **AND** member-only features SHALL be accessible

#### Scenario: Display non-member status
- **WHEN** free user views personal center
- **THEN** "开通会员" call-to-action SHALL be displayed
- **AND** member benefits preview SHALL be shown
- **AND** tap SHALL navigate to membership center

### Requirement: Membership Expiration Handling
The system SHALL handle membership expiration and send timely reminders.

#### Scenario: Membership expires
- **WHEN** current_date > user.member_expire_at
- **THEN** user.is_member SHALL be automatically set to false
- **AND** member features SHALL be locked
- **AND** renewal prompt SHALL be shown on next login

#### Scenario: Expiration reminder
- **WHEN** membership expiration is 3 days away
- **THEN** subscription message SHALL be sent (if authorized):
  - "你的会员将在 3 天后到期，本月你已经坚持打卡 20 天，继续保持吗?"
- **AND** message SHALL include renewal link

#### Scenario: Check member status
- **WHEN** user attempts to access member-only feature
- **THEN** system SHALL verify is_member=true AND current_date <= member_expire_at
- **AND** if not valid, upgrade prompt SHALL be shown

### Requirement: Member Exclusive Benefits
The system SHALL provide enhanced features exclusively for member users.

#### Scenario: Enhanced plan capacity
- **WHEN** member user creates plans
- **THEN** user SHALL be able to create 3-5 plans per dimension (vs 1 for free)
- **AND** custom dimension creation SHALL be available

#### Scenario: Retrospective check-in cards
- **WHEN** member user needs to fill missed check-ins
- **THEN** user SHALL receive 3 retrospective cards per month
- **AND** cards SHALL be usable for dates beyond 7-day limit
- **AND** remaining card count SHALL be displayed

#### Scenario: Advanced statistics access
- **WHEN** member user views statistics
- **THEN** 90-day historical data SHALL be accessible
- **AND** detailed charts with averages and maximums SHALL be shown
- **AND** weekly/monthly text reports SHALL be available

#### Scenario: Rest day configuration
- **WHEN** member user sets rest/vacation days
- **THEN** user SHALL be able to mark 1-2 days per month as rest days
- **AND** rest days SHALL not break consecutive day streaks
- **AND** rest days SHALL be visually indicated in calendar

#### Scenario: Theme customization
- **WHEN** member user accesses appearance settings
- **THEN** multiple theme colors SHALL be available
- **AND** coach character skins SHALL be unlockable
- **AND** selected theme SHALL persist across sessions

### Requirement: Order Data Schema
The system SHALL store payment orders with fields: order_id, user_id, order_type, amount, pay_status, wechat_pay_trade_no, start_at, end_at, created_at.

#### Scenario: Create order record
- **WHEN** user initiates purchase
- **THEN** unique order_id SHALL be generated
- **AND** order_type SHALL be one of: month/quarter/year
- **AND** amount SHALL be stored in cents (e.g., 1800 for ¥18)
- **AND** pay_status SHALL default to "pending"
- **AND** created_at SHALL record timestamp

#### Scenario: Update order after payment
- **WHEN** payment callback is received
- **THEN** pay_status SHALL be updated to "success"
- **AND** wechat_pay_trade_no SHALL be stored
- **AND** start_at SHALL be set to payment time
- **AND** end_at SHALL be calculated as start_at + duration

### Requirement: Membership Center UI
The system SHALL provide clear and persuasive membership center interface.

#### Scenario: Display benefits comparison
- **WHEN** user views membership center
- **THEN** comparison table SHALL show free vs member features:
  - Plan capacity: 1 vs 3-5 per dimension
  - Statistics range: 7 days vs 90 days
  - Retrospective cards: 0 vs 3/month
  - Rest days: Not available vs 1-2/month
  - Themes: Default only vs Multiple options

#### Scenario: Show social proof
- **WHEN** membership center is displayed
- **THEN** optional member count or testimonials MAY be shown
- **AND** benefits SHALL be described with concrete examples

### Requirement: Free User Upgrade Prompts
The system SHALL show contextual upgrade prompts when free users attempt member features.

#### Scenario: Trigger upgrade prompt on limit
- **WHEN** free user attempts to create 2nd plan in a dimension
- **THEN** modal SHALL appear explaining member benefit
- **AND** "立即开通会员" button SHALL navigate to membership center

#### Scenario: Trigger upgrade prompt on statistics
- **WHEN** free user tries to view 30-day statistics
- **THEN** blur effect SHALL be applied to locked content
- **AND** upgrade prompt SHALL overlay with benefits description
