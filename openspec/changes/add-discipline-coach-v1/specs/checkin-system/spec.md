# Check-in System

## ADDED Requirements

### Requirement: Today's Task Dashboard
The system SHALL display today's task dashboard on home page showing all active plans grouped by dimension.

#### Scenario: View today's tasks
- **WHEN** user opens home page
- **THEN** current date SHALL be displayed at top
- **AND** coach character with greeting message SHALL be shown
- **AND** all active dimensions SHALL be displayed as expandable cards
- **AND** each dimension card SHALL show completion progress (e.g., 1/2)
- **AND** overall completion progress bar SHALL be shown at bottom

#### Scenario: Expand dimension tasks
- **WHEN** user taps on dimension card
- **THEN** card SHALL expand to show all task items for that dimension
- **AND** each task SHALL display: title, target value, status, check-in button

#### Scenario: No tasks for today
- **WHEN** current weekday is not in any plan's week_days
- **THEN** home page SHALL show "今天没有计划任务"
- **AND** coach SHALL display rest day message

### Requirement: Check-in Interaction
The system SHALL provide simple and delightful check-in flow for completing tasks.

#### Scenario: Check-in simple task
- **WHEN** user taps "打卡" button on a simple boolean task
- **THEN** confirmation modal SHALL appear
- **AND** user can optionally add notes
- **AND** user confirms to complete check-in
- **AND** task status SHALL update to completed
- **AND** coach feedback animation and message SHALL be shown

#### Scenario: Check-in quantitative task
- **WHEN** user taps "打卡" on time/count/page-based task
- **THEN** input modal SHALL appear with number input field
- **AND** default value SHALL be the target value
- **AND** user can input actual completed value
- **AND** optional notes field SHALL be available
- **AND** on confirmation, record SHALL be saved with actual value

#### Scenario: Check-in feedback
- **WHEN** user completes check-in
- **THEN** lightweight animation SHALL play
- **AND** coach character SHALL show encouraging expression and message
- **AND** task list SHALL update to show completion status
- **AND** overall progress bar SHALL update
- **AND** toast message SHALL confirm success

### Requirement: Retrospective Check-in
The system SHALL allow users to check-in for past 7 days.

#### Scenario: Access past date check-in
- **WHEN** user views calendar or statistics page
- **THEN** user can tap on any date within past 7 days
- **AND** day detail page SHALL open showing that day's tasks
- **AND** user can check-in or modify existing records

#### Scenario: Retrospective check-in limitation
- **WHEN** user attempts to check-in for date older than 7 days
- **THEN** system SHALL show "只能补打卡最近7天的记录"
- **AND** check-in button SHALL be disabled for dates beyond 7 days

#### Scenario: Modify existing check-in
- **WHEN** user opens day detail for already checked-in date
- **THEN** completed tasks SHALL show "已完成" status
- **AND** user can tap to modify actual value or notes
- **AND** updated record SHALL replace previous record

### Requirement: Consecutive Days Tracking
The system SHALL calculate and display consecutive check-in days for each dimension and overall.

#### Scenario: Calculate dimension consecutive days
- **WHEN** user completes all tasks for a dimension on a day
- **THEN** that day SHALL count as completion for that dimension
- **AND** consecutive day counter for dimension SHALL increment by 1
- **AND** if user misses any task on a day, consecutive days SHALL reset to 0

#### Scenario: Display consecutive days
- **WHEN** user views home page or statistics
- **THEN** overall consecutive days SHALL be prominently displayed
- **AND** each dimension's consecutive days can be viewed in statistics page

#### Scenario: Consecutive days after retrospective check-in
- **WHEN** user retrospectively completes missing days within 7 days
- **THEN** consecutive days SHALL be recalculated including filled gaps
- **AND** if gap is filled completely, consecutive count SHALL continue

### Requirement: Check-in Record Data Schema
The system SHALL store check-in records with fields: record_id, user_id, plan_id, date, value, status, remark, created_at.

#### Scenario: Create check-in record
- **WHEN** user completes check-in
- **THEN** unique record_id SHALL be generated
- **AND** date SHALL be stored as YYYY-MM-DD format
- **AND** value SHALL store actual completed value (number or boolean)
- **AND** status SHALL be one of: 完成/未完成/部分
- **AND** optional remark text SHALL be stored
- **AND** created_at SHALL record timestamp

#### Scenario: Query today's records
- **WHEN** system loads today's task dashboard
- **THEN** all records with date=today SHALL be fetched
- **AND** records SHALL be matched with plan_id to show completion status

### Requirement: Task Completion Status Calculation
The system SHALL determine task completion status based on actual value vs target value.

#### Scenario: Boolean task completion
- **WHEN** task type is boolean (e.g., 吃早餐)
- **THEN** status SHALL be "完成" if checked, "未完成" if not

#### Scenario: Quantitative task full completion
- **WHEN** actual value >= target value
- **THEN** status SHALL be "完成"
- **AND** visual indicator SHALL show full completion (green checkmark)

#### Scenario: Quantitative task partial completion
- **WHEN** actual value < target value but > 0
- **THEN** status SHALL be "部分"
- **AND** visual indicator SHALL show partial completion (yellow indicator)
- **AND** consecutive days MAY be affected (based on business rule)

#### Scenario: Task not attempted
- **WHEN** no record exists for task on a date
- **THEN** status SHALL be "未完成"
- **AND** consecutive days SHALL reset to 0 for that dimension
