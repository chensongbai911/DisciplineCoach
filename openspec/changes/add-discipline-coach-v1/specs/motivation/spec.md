# Motivation and Supervision System

## ADDED Requirements

### Requirement: Coach Character Role
The system SHALL feature an anthropomorphic coach character that provides friendly supervision and encouragement.

#### Scenario: Display coach on home page
- **WHEN** user opens home page
- **THEN** coach avatar SHALL be displayed at top section
- **AND** coach SHALL show contextual greeting message
- **AND** coach expression MAY change based on user progress

#### Scenario: Coach feedback on check-in
- **WHEN** user completes a check-in
- **THEN** coach character SHALL appear in feedback modal
- **AND** encouraging message SHALL be displayed
- **AND** lightweight animation SHALL play

### Requirement: Dynamic Coaching Messages
The system SHALL display dynamic messages based on user's daily completion status.

#### Scenario: All tasks completed message
- **WHEN** user completes all tasks for the day
- **THEN** coach SHALL show highly positive message:
  - Examples: "太棒了!今天所有目标都完成了!", "你真是自律之星!"
- **AND** message SHALL emphasize achievement

#### Scenario: Partial completion message
- **WHEN** user completes some but not all tasks
- **THEN** coach SHALL show encouraging message:
  - Examples: "不错哦!还剩X个任务,继续加油!", "已经很努力了,坚持完成剩下的吧!"
- **AND** message SHALL remind remaining task count

#### Scenario: No completion message (evening)
- **WHEN** time is past 18:00 and no tasks completed
- **THEN** coach SHALL show gentle reminder:
  - Examples: "今天还没开始打卡呢,从一个小目标开始吧!", "别忘了今天的计划哦~"
- **AND** message SHALL be supportive not critical

#### Scenario: Morning greeting
- **WHEN** user opens app in morning (6:00-12:00)
- **THEN** coach SHALL show morning greeting:
  - Examples: "早上好!今天也要元气满满哦!", "新的一天开始了,加油!"

#### Scenario: Random message selection
- **WHEN** coach needs to display message
- **THEN** system SHALL randomly select from 3-5 predefined messages for each scenario type
- **AND** message SHALL feel natural and varied

### Requirement: Level and Experience System
The system SHALL implement simplified level and experience system (V1).

#### Scenario: Earn experience on check-in
- **WHEN** user completes a task check-in
- **THEN** user SHALL earn +10 experience points
- **AND** experience bar SHALL update visually

#### Scenario: Level up
- **WHEN** user's experience reaches level threshold
- **THEN** level SHALL increment by 1
- **AND** celebration animation SHALL play
- **AND** "恭喜升级!" message SHALL be shown
- **AND** optional reward MAY be granted (V1 reserved)

#### Scenario: Display level progress
- **WHEN** user views personal center
- **THEN** current level SHALL be displayed (e.g., "Lv 5")
- **AND** progress bar SHALL show XP to next level
- **AND** next level threshold SHALL be shown (e.g., "距离下一级还需 120 XP")

#### Scenario: Calculate level thresholds
- **WHEN** system calculates required XP for levels
- **THEN** formula SHALL be: Level_N_XP = 100 × N (linear for V1)
  - Level 1: 100 XP
  - Level 2: 200 XP
  - Level 3: 300 XP
- **AND** maximum level for V1 MAY be capped at 20

### Requirement: Share Poster Generation
The system SHALL allow users to generate and share achievement posters.

#### Scenario: Generate check-in poster
- **WHEN** user taps "分享" button on statistics or after check-in
- **THEN** poster generation page SHALL open
- **AND** poster SHALL include:
  - User nickname (or "匿名用户" option)
  - Consecutive check-in days
  - Weekly completion rate
  - Coach character illustration
  - App name and QR code (optional)

#### Scenario: Customize poster
- **WHEN** poster is being generated
- **THEN** user SHALL be able to toggle anonymous mode
- **AND** user can select poster template style (V1: 1-2 styles)

#### Scenario: Save or share poster
- **WHEN** poster is ready
- **THEN** "保存到相册" button SHALL save image to device
- **AND** "分享给好友" button SHALL invoke WeChat share interface
- **AND** saved poster SHALL be high resolution (suitable for social media)

### Requirement: Coach Character Asset Management
The system SHALL support coach character assets including avatar and optional skins.

#### Scenario: Default coach appearance
- **WHEN** system displays coach character
- **THEN** default avatar image SHALL be loaded from assets
- **AND** avatar SHALL be simple cartoon style (placeholder for V1)

#### Scenario: Member unlockable skins (V1 reserved)
- **WHEN** member user accesses appearance settings
- **THEN** alternative coach skins SHALL be listed
- **AND** member-exclusive skins SHALL be marked
- **AND** user can select and apply skin
- **AND** selected skin SHALL persist across sessions

### Requirement: Consecutive Days Milestone Celebration
The system SHALL celebrate consecutive day milestones with special messages.

#### Scenario: Reach milestone days
- **WHEN** user reaches consecutive day milestones (7, 14, 30, 60, 100...)
- **THEN** special celebration modal SHALL appear
- **AND** coach SHALL show extra enthusiastic message:
  - "连续打卡7天!你已经超越了90%的人!"
  - "坚持30天了!习惯正在养成!"
- **AND** milestone badge MAY be awarded (V1 reserved)

#### Scenario: Display milestone badges (V1 reserved)
- **WHEN** user views achievement/badge collection page
- **THEN** earned milestone badges SHALL be displayed
- **AND** locked badges SHALL show unlock requirements

### Requirement: Social Sharing Features (V1 Simplified)
The system SHALL support basic sharing functionality without public leaderboards.

#### Scenario: No public leaderboards in V1
- **WHEN** user looks for social features
- **THEN** public leaderboards SHALL NOT be implemented in V1
- **AND** group check-in features SHALL NOT be available in V1
- **AND** these SHALL be reserved for future iterations

#### Scenario: Private achievement sharing only
- **WHEN** user shares achievements
- **THEN** sharing SHALL be limited to poster generation
- **AND** sharing SHALL not expose other users' data
- **AND** sharing SHALL be user-initiated only

### Requirement: Encouragement Timing Intelligence
The system SHALL send contextual encouragement based on time of day and user behavior.

#### Scenario: Lunchtime reminder
- **WHEN** time is around 12:00-13:00 and user has incomplete tasks
- **THEN** optional subscription message MAY remind:
  - "午休时间,别忘了完成上午的计划哦!"

#### Scenario: Evening summary
- **WHEN** time is around 21:00-22:00
- **THEN** optional subscription message MAY show daily summary:
  - "今天完成了X个目标,太棒了!睡前别忘了记录睡眠时间~"

#### Scenario: Subscription message authorization
- **WHEN** system wants to send any subscription message
- **THEN** user MUST have previously authorized subscription
- **AND** system SHALL handle authorization rejection gracefully
- **AND** user can manage subscription settings
