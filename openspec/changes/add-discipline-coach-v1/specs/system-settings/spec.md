# System Settings and Feedback

## ADDED Requirements

### Requirement: Personal Center Page
The system SHALL provide personal center page displaying user profile and navigation to key features.

#### Scenario: View personal center
- **WHEN** user taps "我的" tab in bottom navigation
- **THEN** personal center page SHALL open
- **AND** user avatar and nickname SHALL be displayed at top
- **AND** member status badge SHALL be shown if applicable
- **AND** consecutive check-in days SHALL be displayed prominently

#### Scenario: Personal center menu
- **WHEN** personal center page is displayed
- **THEN** menu items SHALL include:
  - 我的计划 (navigate to plan settings)
  - 数据统计 (navigate to statistics)
  - 会员中心 (navigate to membership)
  - 意见反馈 (navigate to feedback form)
  - 关于我们 (navigate to about page)
  - 服务协议 (navigate to terms)
  - 隐私政策 (navigate to privacy policy)
- **AND** each item SHALL be tappable with right arrow indicator

### Requirement: Notification and Reminder Settings
The system SHALL allow users to configure notification preferences for reminders.

#### Scenario: Access notification settings
- **WHEN** user navigates to settings page from personal center
- **THEN** notification settings section SHALL be displayed
- **AND** "接收打卡提醒" toggle SHALL be available
- **AND** reminder time configuration SHALL be accessible if enabled

#### Scenario: Enable reminder notifications
- **WHEN** user toggles "接收打卡提醒" to on
- **THEN** system SHALL request WeChat subscription message authorization
- **AND** if authorized, reminder toggle SHALL stay on
- **AND** user SHALL be able to configure reminder times

#### Scenario: Configure reminder times
- **WHEN** user taps reminder time setting
- **THEN** time picker SHALL appear with options:
  - 早间提醒 (e.g., 08:00)
  - 晚间提醒 (e.g., 20:00)
- **AND** selected times SHALL be saved
- **AND** subscription messages SHALL be sent at configured times

#### Scenario: Disable reminder notifications
- **WHEN** user toggles reminder off
- **THEN** no subscription messages SHALL be sent
- **AND** reminder time settings SHALL be grayed out
- **AND** user can re-enable anytime

### Requirement: Feedback Submission
The system SHALL provide simple feedback form for users to submit suggestions and issues.

#### Scenario: Access feedback form
- **WHEN** user taps "意见反馈" in personal center
- **THEN** feedback form page SHALL open
- **AND** form SHALL include:
  - Multiline text input for feedback content
  - Optional contact info field (WeChat ID or email)
  - Submit button

#### Scenario: Submit feedback
- **WHEN** user enters feedback and taps submit
- **THEN** feedback content SHALL be validated (non-empty)
- **AND** feedback SHALL be sent to backend and stored in database
- **AND** success toast SHALL show "反馈提交成功,感谢您的建议!"
- **AND** form SHALL be cleared after submission

#### Scenario: View feedback submission status
- **WHEN** user submits feedback
- **THEN** feedback record SHALL be created with:
  - user_id
  - content (text)
  - contact_info (optional)
  - created_at timestamp
  - status (pending/reviewed) - V1 backend only
- **AND** optional future feature: user can view feedback history

### Requirement: About and Legal Pages
The system SHALL provide informational pages for about, terms, and privacy policy.

#### Scenario: View about page
- **WHEN** user taps "关于我们"
- **THEN** about page SHALL display:
  - App name and version number
  - Brief product description
  - Contact information (email or WeChat)
  - Copyright notice

#### Scenario: View terms of service
- **WHEN** user taps "服务协议"
- **THEN** terms page SHALL open with:
  - Scrollable legal text
  - Standard service terms
  - User responsibilities and app limitations

#### Scenario: View privacy policy
- **WHEN** user taps "隐私政策"
- **THEN** privacy policy page SHALL open with:
  - Data collection explanation (openid, check-in data, etc.)
  - Data usage and storage policies
  - User rights (access, deletion, etc.)
  - Compliance with WeChat platform policies

### Requirement: User Profile Management
The system SHALL allow users to update basic profile information.

#### Scenario: Update nickname
- **WHEN** user taps on nickname in personal center
- **THEN** edit modal SHALL appear with text input
- **AND** user can enter new nickname
- **AND** on save, nickname SHALL be updated in database
- **AND** new nickname SHALL display immediately

#### Scenario: Update avatar
- **WHEN** user taps on avatar in personal center
- **THEN** WeChat authorization dialog MAY appear (if not previously authorized)
- **AND** user can grant permission to use WeChat avatar
- **AND** avatar SHALL be updated from WeChat profile
- **AND** V1 SHALL not support custom avatar upload

### Requirement: Data Export and Account Management
The system SHALL provide basic account management features (V1 simplified).

#### Scenario: View account data summary
- **WHEN** user accesses account settings
- **THEN** data summary SHALL show:
  - Account creation date
  - Total check-in days
  - Active plan count
  - Member status and expiration (if applicable)

#### Scenario: Request account deletion (V1 reserved)
- **WHEN** user wants to delete account
- **THEN** "删除账户" option SHALL be available
- **AND** confirmation dialog SHALL warn about data loss
- **AND** on confirmation, all user data SHALL be marked for deletion
- **AND** deletion SHALL comply with GDPR/PIPL requirements

### Requirement: App Version and Updates
The system SHALL display current version and check for updates.

#### Scenario: Display app version
- **WHEN** user views about page or settings
- **THEN** current version number SHALL be displayed (e.g., "v1.0.0")
- **AND** version SHALL match app.json version field

#### Scenario: Check for updates (optional)
- **WHEN** user taps "检查更新" in about page
- **THEN** system SHALL check WeChat mini program backend for updates
- **AND** if update available, prompt SHALL guide user to restart
- **AND** if up-to-date, message SHALL confirm "当前已是最新版本"

### Requirement: Settings Data Persistence
The system SHALL persist user settings locally and sync with backend.

#### Scenario: Save settings locally
- **WHEN** user changes any setting
- **THEN** setting SHALL be saved to wx.setStorageSync
- **AND** setting SHALL be immediately effective
- **AND** setting SHALL persist across app sessions

#### Scenario: Sync settings with backend
- **WHEN** settings are changed
- **THEN** settings SHALL also be synced to backend user profile
- **AND** if offline, settings SHALL sync on next connection
- **AND** backend SHALL be source of truth for cross-device consistency

### Requirement: Customer Support Access (V1 simplified)
The system SHALL provide basic customer support channels.

#### Scenario: Contact support via feedback
- **WHEN** user submits feedback marked as "urgent" or "bug report"
- **THEN** feedback SHALL be flagged in backend
- **AND** optional: email notification SHALL be sent to support team

#### Scenario: Display support contact
- **WHEN** user views about page
- **THEN** customer support email or WeChat ID SHALL be displayed
- **AND** user can manually copy contact information
- **AND** V1 SHALL not integrate live chat
