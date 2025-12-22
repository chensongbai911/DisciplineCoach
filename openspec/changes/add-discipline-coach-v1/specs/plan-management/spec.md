# Plan Management System

## ADDED Requirements

### Requirement: Five Core Dimensions Support
The system SHALL support five core habit dimensions: 运动 (Exercise), 饮食 (Diet), 睡眠 (Sleep), 阅读 (Reading), and 学习 (Study).

#### Scenario: View all dimensions
- **WHEN** user navigates to plan settings page
- **THEN** all five dimensions SHALL be displayed
- **AND** each dimension SHALL show current active status
- **AND** user can navigate to detailed configuration for each dimension

#### Scenario: Toggle dimension activation
- **WHEN** user toggles dimension switch to off
- **THEN** dimension SHALL be deactivated
- **AND** dimension SHALL not appear in today's task list
- **AND** existing plan data SHALL be preserved (not deleted)
- **AND** user can reactivate dimension later to restore plans

### Requirement: Exercise Plan Configuration
The system SHALL allow users to configure exercise plans with target types (duration/steps/count), execution frequency, and reminder settings.

#### Scenario: Create duration-based exercise plan
- **WHEN** user creates exercise plan with duration target
- **THEN** target type SHALL be set to "按时长"
- **AND** target value SHALL be input in minutes (e.g., 30)
- **AND** plan SHALL include execution frequency (weekday selection)
- **AND** optional reminder time can be configured

#### Scenario: Create step-count exercise plan
- **WHEN** user selects "按步数" target type
- **THEN** target value SHALL be input as integer steps (e.g., 8000)
- **AND** system SHALL reserve interface for WeChat step data integration

#### Scenario: Set weekly execution frequency
- **WHEN** user configures execution frequency
- **THEN** user SHALL be able to select multiple weekdays (Monday to Sunday)
- **AND** default SHALL be all days selected (Mon-Sun)
- **AND** plan SHALL only appear on selected days

### Requirement: Diet Plan Configuration
The system SHALL support checklist-style diet habits including breakfast, sugary drinks, late-night snacks, and water intake.

#### Scenario: Configure diet habit checklist
- **WHEN** user configures diet plan
- **THEN** user SHALL be able to toggle predefined habits:
  - 吃早餐 (Eat breakfast)
  - 不喝含糖饮料 (No sugary drinks)
  - 不吃宵夜 (No late-night snacks)
  - 每天喝水≥X杯 (Drink X cups of water)
- **AND** water intake target SHALL be configurable number

#### Scenario: Add custom diet habit (V1 simplified)
- **WHEN** user wants to add custom diet habit
- **THEN** user SHALL be able to add up to 1 custom habit item
- **AND** custom habit SHALL have name and boolean completion status

### Requirement: Sleep Plan Configuration
The system SHALL allow users to set target bedtime and sleep duration goals.

#### Scenario: Set sleep goals
- **WHEN** user configures sleep plan
- **THEN** user SHALL input target bedtime (e.g., 23:30)
- **AND** user SHALL input minimum sleep duration (e.g., ≥7 hours)
- **AND** bedtime reminder time can be configured (e.g., 23:00)

#### Scenario: Check-in sleep record
- **WHEN** user checks in sleep
- **THEN** user SHALL input actual sleep time
- **AND** user SHALL input wake up time
- **AND** system SHALL calculate sleep duration automatically
- **AND** system SHALL determine if goals are met

### Requirement: Reading Plan Configuration
The system SHALL support reading plans with duration or page-based targets and optional book tracking.

#### Scenario: Create duration-based reading plan
- **WHEN** user creates reading plan with duration target
- **THEN** target SHALL be set in minutes (e.g., 20 minutes)
- **AND** execution frequency SHALL be configurable by weekday

#### Scenario: Create page-based reading plan
- **WHEN** user selects page-based target
- **THEN** target SHALL be set as number of pages (e.g., 10 pages)
- **AND** optional current book name can be recorded

#### Scenario: Track reading progress
- **WHEN** user inputs current book information
- **THEN** book name SHALL be stored as text field
- **AND** optional progress note (page/chapter) can be added

### Requirement: Study Plan Configuration
The system SHALL support study plans with duration or task-based targets and optional tags.

#### Scenario: Create duration-based study plan
- **WHEN** user creates study plan with duration target
- **THEN** target SHALL be set in minutes (e.g., 30 minutes)
- **AND** execution frequency SHALL be configurable by weekday

#### Scenario: Create task-based study plan
- **WHEN** user selects task-based target
- **THEN** task description SHALL be simple text input
- **AND** completion SHALL be boolean (completed or not)

#### Scenario: Add study tags
- **WHEN** user wants to categorize study plan
- **THEN** user SHALL be able to select from existing tags (e.g., 英语, 编程, 考证)
- **AND** user SHALL be able to create one new custom tag

### Requirement: Plan Reminder Settings
The system SHALL support reminder configuration using WeChat subscription messages.

#### Scenario: Enable plan reminder
- **WHEN** user enables reminder for a plan
- **THEN** reminder toggle SHALL be set to true
- **AND** user SHALL select reminder time
- **AND** system SHALL request subscription message authorization
- **AND** reminder SHALL be sent at configured time on execution days

#### Scenario: User declines subscription authorization
- **WHEN** user declines subscription message authorization
- **THEN** reminder SHALL not be sent
- **AND** user can re-authorize later in settings

### Requirement: Plan Data Schema
The system SHALL store plan data with fields: plan_id, user_id, category, title, type, target_value, unit, week_days, remind_time, is_active, created_at, updated_at.

#### Scenario: Create plan record
- **WHEN** user creates a new plan
- **THEN** unique plan_id SHALL be generated
- **AND** category SHALL be one of: 运动/饮食/睡眠/阅读/学习/custom
- **AND** type SHALL indicate target type (time/step/count/boolean)
- **AND** week_days SHALL be stored as array (e.g., [1,2,3,4,5])
- **AND** is_active SHALL default to true

### Requirement: Free User Plan Limits
The system SHALL limit free users to one plan per dimension.

#### Scenario: Free user creates plan
- **WHEN** free user (is_member=false) attempts to create plan
- **THEN** system SHALL check existing plan count for that dimension
- **AND** if count >= 1, system SHALL show upgrade prompt
- **AND** user SHALL be unable to create additional plans without membership

### Requirement: Member User Enhanced Plan Capacity
The system SHALL allow member users to create 3-5 plans per dimension.

#### Scenario: Member user creates multiple plans
- **WHEN** member user (is_member=true) creates plan
- **THEN** system SHALL allow up to 5 plans per dimension
- **AND** user can create additional plans until limit is reached
