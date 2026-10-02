# Ainubis CRM Intelligence Model

This document specifies the taxonomy, enums, states, and data models of the Ainubis CRM Intelligence framework.

## 1. Domain Types & Enums

### IntelligenceType
Represents the structural classification of generated intelligence:
- **OBSERVATION**: Objective facts synthesized from CRM activities (e.g., Contact missing mobile number).
- **INSIGHT**: Analytical conclusions derived from trends (e.g., Lead responsiveness is decreasing).
- **RECOMMENDATION**: Suggested actions to improve outcomes (e.g., Propose levy migration contract).
- **ALERT**: Critical warnings requiring immediate attention (e.g., Contract past signing deadline).
- **HUMAN_APPROVAL_REQUIRED**: Recommendations requiring express authorized human signoff.

### IntelligenceStatus
Represents the formal lifecycle of an intelligence record:
- `DRAFT`
- `GENERATED`
- `REVIEWED`
- `APPROVED`
- `REJECTED`
- `EXECUTED`
- `EXPIRED`
- `DISMISSED`

### ConfidenceLevel
Represents the mathematical or rule-based reliability rating:
- `VERY_LOW` (< 20%)
- `LOW` (20-40%)
- `MODERATE` (40-60%)
- `HIGH` (60-80%)
- `VERY_HIGH` (>= 80%)

### ApprovalRequirement
Represents the structural sign-off threshold:
- **INFORMATIONAL**: No action required. Fits raw observations and warnings.
- **RECOMMENDATION**: Action recommended but optional. Dismissible.
- **HUMAN_APPROVAL_REQUIRED**: Mandates positive authorized human action before proceeding.
- **EXECUTABLE_ACTION**: High-confidence automated hook ready for direct triggers.
