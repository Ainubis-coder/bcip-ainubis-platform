# Ainubis CRM Events Registry

Ainubis publishes and consumes events over the `crmEventBus` to support real-time workflows and asynchronous analysis.

## Published Events

- **ai.observation.created**: Triggered whenever a pipeline hygiene, lead validation, or data quality audit record is generated.
- **ai.observation.reviewed**: Triggered when a human marks an observation as reviewed.
- **ai.recommendation.approved**: Triggered when an administrator approves a suggested recommendation.
- **ai.recommendation.rejected**: Triggered when a recommendation is rejected.
- **ai.recommendation.dismissed**: Triggered when a user dismisses an observation.
- **ai.action.requested**: Dispatched when an approved action is triggered for execution.
- **ai.action.executed**: Dispatched upon successful execution of a suggested action (e.g. creating a follow-up task).
- **ai.action.failed**: Dispatched if action execution fails.

## Background Worker Integration

The `ai.ainubis_analysis` job is registered in the background worker queue and executes capabilities asynchronously based on workflow triggers or cron schedules.
