# User Authentication and Account Management

## ADDED Requirements

### Requirement: WeChat Mini Program Login
The system SHALL support user authentication through WeChat mini program login mechanism using `wx.login` to obtain user's openid as unique identifier.

#### Scenario: First-time user login
- **WHEN** a new user launches the mini program for the first time
- **THEN** the system SHALL call `wx.login` to obtain authorization code
- **AND** backend SHALL exchange the code for openid via WeChat API
- **AND** a new user record SHALL be created with openid as primary key
- **AND** user SHALL be redirected to welcome/onboarding flow

#### Scenario: Returning user login
- **WHEN** an existing user launches the mini program
- **THEN** the system SHALL identify user by stored openid
- **AND** user SHALL be redirected to home page directly
- **AND** last_login_at timestamp SHALL be updated

### Requirement: User Profile Management
The system SHALL maintain user profile information including nickname, avatar, gender, and membership status.

#### Scenario: User authorizes profile information
- **WHEN** user grants permission to access nickname and avatar
- **THEN** the system SHALL retrieve and store nickname and avatar_url
- **AND** profile SHALL be displayed in personal center

#### Scenario: User declines profile authorization
- **WHEN** user declines profile information authorization
- **THEN** the system SHALL allow anonymous usage with openid only
- **AND** default avatar and "用户" nickname SHALL be used
- **AND** user can grant authorization later in settings

### Requirement: First-Time User Onboarding
The system SHALL provide guided onboarding flow for new users to configure initial preferences.

#### Scenario: Complete onboarding process
- **WHEN** new user completes login
- **THEN** welcome page SHALL display with product introduction
- **AND** user SHALL be prompted to select interested dimensions (all selected by default)
- **AND** default plan templates SHALL be created for selected dimensions
- **AND** user SHALL be redirected to home page after completion

#### Scenario: Skip dimension selection
- **WHEN** user keeps all dimensions selected (default)
- **THEN** all five dimensions (运动/饮食/睡眠/阅读/学习) SHALL be activated
- **AND** default plan SHALL be created for each dimension

### Requirement: User Data Schema
The system SHALL store user data with the following fields: user_id (openid), nickname, avatar_url, gender, created_at, last_login_at, is_member, member_expire_at.

#### Scenario: Create user record
- **WHEN** new user is registered
- **THEN** user record SHALL contain openid as user_id
- **AND** created_at SHALL be set to current timestamp
- **AND** is_member SHALL default to false
- **AND** member_expire_at SHALL be null for non-members
