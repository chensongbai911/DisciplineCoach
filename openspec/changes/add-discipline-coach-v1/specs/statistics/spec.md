# Statistics and Visualization

## ADDED Requirements

### Requirement: Weekly and Monthly Statistics View
The system SHALL provide weekly (7 days) and monthly (30 days) statistics views with dimension filtering.

#### Scenario: View overall statistics
- **WHEN** user navigates to statistics page
- **THEN** default view SHALL show comprehensive statistics
- **AND** time range selector SHALL offer "最近7天" and "最近30天"
- **AND** dimension filter SHALL allow switching between "综合" and individual dimensions

#### Scenario: Switch time range
- **WHEN** user selects different time range
- **THEN** all charts and metrics SHALL update to reflect selected range
- **AND** data SHALL be fetched for the selected period

### Requirement: Overall Completion Statistics
The system SHALL calculate and display overall check-in completion metrics.

#### Scenario: View overall completion rate
- **WHEN** user views comprehensive statistics
- **THEN** overall completion rate SHALL be displayed as percentage (e.g., 80%)
- **AND** average daily completed tasks SHALL be shown
- **AND** dimension completion bar chart SHALL display completion days per dimension

#### Scenario: Calculate completion rate
- **WHEN** system calculates completion rate
- **THEN** rate SHALL be (total completed tasks / total expected tasks) × 100%
- **AND** expected tasks SHALL be sum of all active plans on their scheduled days
- **AND** completed tasks SHALL be records with status="完成"

### Requirement: Dimension-Specific Statistics
The system SHALL provide detailed statistics for individual dimensions.

#### Scenario: View exercise dimension statistics
- **WHEN** user selects "运动" dimension
- **THEN** completion trend chart SHALL show last 7/30 days (bar or line chart)
- **AND** consecutive completion days record SHALL be displayed
- **AND** average exercise duration SHALL be calculated and shown

#### Scenario: View sleep dimension statistics
- **WHEN** user selects "睡眠" dimension
- **THEN** average sleep duration SHALL be calculated from records
- **AND** bedtime compliance rate SHALL be shown
- **AND** trend chart SHALL display sleep hours per day

#### Scenario: View dimension completion trend
- **WHEN** viewing any dimension statistics
- **THEN** chart SHALL show completion status per day
- **AND** X-axis SHALL be dates, Y-axis SHALL be completion count or percentage
- **AND** data points SHALL be color-coded (green=completed, gray=incomplete)

### Requirement: Chart Visualization
The system SHALL use ECharts for WeChat mini program to render charts.

#### Scenario: Render bar chart
- **WHEN** system displays dimension completion days
- **THEN** bar chart SHALL be rendered using ECharts
- **AND** each bar SHALL represent one dimension
- **AND** bar height SHALL correspond to completion day count

#### Scenario: Render line chart
- **WHEN** system displays completion rate trend
- **THEN** line chart SHALL be rendered with dates on X-axis
- **AND** line SHALL connect daily completion rate points
- **AND** chart SHALL be interactive with touch gestures

#### Scenario: Chart loading state
- **WHEN** chart data is being fetched
- **THEN** loading indicator SHALL be displayed
- **AND** chart container SHALL show placeholder
- **AND** once data loads, chart SHALL render smoothly

### Requirement: Weekly Summary Report
The system SHALL generate simple weekly summary report (V1 simplified).

#### Scenario: View weekly summary
- **WHEN** user accesses weekly summary page
- **THEN** summary text SHALL be generated describing:
  - Total check-in days this week
  - Each dimension's completion days
  - Consecutive day achievements
- **AND** summary SHALL be in natural language (e.g., "本周你坚持打卡5天...")

#### Scenario: Example summary content
- **WHEN** summary is generated for user with 5 check-in days
- **THEN** text SHALL include: "本周你坚持打卡 5 天，其中运动完成 4 天，睡眠连续 3 天达标。"
- **AND** text SHALL be shareable via copy button

### Requirement: Statistics Data Calculation
The system SHALL calculate statistics metrics from check-in records efficiently.

#### Scenario: Calculate average values
- **WHEN** system calculates average for a dimension
- **THEN** all records for that dimension in time range SHALL be fetched
- **AND** average SHALL be computed from actual values
- **AND** null or incomplete records SHALL be excluded from calculation

#### Scenario: Identify best streak
- **WHEN** displaying consecutive days record
- **THEN** system SHALL find longest consecutive completion period
- **AND** display SHALL show "连续最多 X 天"
- **AND** date range of best streak MAY be shown

### Requirement: Member vs Free User Statistics Access
The system SHALL differentiate statistics features between free and member users.

#### Scenario: Free user views statistics
- **WHEN** free user accesses statistics page
- **THEN** user SHALL see last 7 days data only
- **AND** simple completion rate and basic charts SHALL be available
- **AND** upgrade prompt SHALL be shown for 30-day view

#### Scenario: Member user views enhanced statistics
- **WHEN** member user accesses statistics page
- **THEN** user SHALL have access to 90-day historical data
- **AND** detailed charts with average/max values SHALL be available
- **AND** weekly/monthly text summary reports SHALL be accessible

### Requirement: Statistics Page Layout
The system SHALL organize statistics page with clear navigation and visual hierarchy.

#### Scenario: Navigate statistics page
- **WHEN** user enters statistics page via bottom tab
- **THEN** top section SHALL show time range and dimension selectors
- **AND** middle section SHALL display key metrics (cards layout)
- **AND** bottom section SHALL show detailed charts
- **AND** page SHALL be scrollable for additional content

#### Scenario: Empty state handling
- **WHEN** user has no check-in data for selected period
- **THEN** empty state illustration SHALL be shown
- **AND** message SHALL encourage user to start checking in
- **AND** charts SHALL show zero values appropriately
