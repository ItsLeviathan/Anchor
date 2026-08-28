# ANCHOR — MONETIZATION & SUBSCRIPTION SPECIFICATION

## BUSINESS MODEL

Anchor uses a **freemium model**.

The free version must provide meaningful value and should not feel artificially restricted.

The paid product is:

# Anchor Pro

The core monetization principle is:

> **Basic organization should be free. Advanced intelligence and capabilities should be paid.**

Do not monetize user data.

Do not sell personal information.

Do not use intrusive advertising as the primary monetization strategy.

---

## FREE PLAN

Free users should have access to:

- Tasks
- Calendar
- Basic reminders
- Recurring tasks
- Basic Brain Dump
- Notes
- Basic habits
- Shopping lists
- Basic expenses
- Basic document expiration reminders
- Basic Student Mode
- Offline functionality
- Basic widgets
- Basic statistics

Free users should receive a limited number of AI actions.

Suggested initial allowance:

**10 AI actions per month.**

The limit must be configurable remotely so it can be changed without requiring a new app release.

---

# ANCHOR PRO

Anchor Pro unlocks:

- Advanced AI Brain Dump
- Advanced task extraction
- AI task breakdown
- AI daily planning
- AI smart scheduling
- AI weekly reviews
- AI-powered expense categorization
- AI document extraction
- Advanced insights
- Advanced widgets
- Unlimited document storage within reasonable fair-use limits
- Advanced recurring responsibilities
- Multiple calendars
- Advanced Student Mode
- Expanded personalization
- Increased AI usage limits
- Priority AI processing

---

# PRICING

Initial pricing should be configurable rather than hard-coded.

Suggested starting prices:

### Monthly

**₱149/month**

### Annual

**₱1,299/year**

The annual plan should be presented as the better-value option.

Do not hard-code currency or price directly into the application.

Store product identifiers and pricing configuration through the platform billing systems.

---

# FREE TRIAL

Offer a:

**7-day Anchor Pro trial**

The trial should demonstrate premium capabilities naturally.

Do not aggressively interrupt onboarding with a paywall.

The user should first experience the core product.

---

# SUBSCRIPTION ARCHITECTURE

Implement a subscription entitlement system.

Suggested database model:

```text
subscriptions
-------------------------
id
user_id
provider
product_id
status
started_at
expires_at
auto_renewing
created_at
updated_at
```

Possible providers:

- Apple
- Google

The backend should determine whether a user currently has Anchor Pro access.

Do not trust only a client-side boolean such as:

```text
isPro = true
```

Subscription state must be validated against the appropriate platform purchase information.

---

# ENTITLEMENTS

Create an entitlement layer.

Example:

```text
Entitlements

canUseAdvancedAI
canUseSmartScheduling
canUseAdvancedInsights
canUseAdvancedWidgets
canStoreAdvancedDocuments
canUseAdvancedStudentMode
aiMonthlyLimit
```

Features should check entitlements through a centralized service.

Do not scatter subscription checks throughout UI components.

Bad:

```text
if (user.isPro) ...
```

throughout the application.

Prefer:

```text
entitlements.canUseAdvancedAI
```

through a centralized entitlement system.

---

# AI USAGE TRACKING

Track AI usage.

Suggested table:

```text
ai_usage
-------------------------
id
user_id
request_type
model
input_tokens
output_tokens
estimated_cost
created_at
```

Track:

- Brain Dump requests
- Task breakdown
- Planning
- Weekly review
- Note summarization
- Expense categorization
- Document extraction

Use this information to control free-tier limits and understand infrastructure costs.

Do not expose internal AI costs to ordinary users.

---

# PAYWALL DESIGN

Paywalls must feel premium and informative.

Do not use manipulative dark patterns.

Example:

```text
ANCHOR PRO

Let Anchor do more for you.

✓ Unlimited intelligent planning
✓ Advanced Brain Dump
✓ Smart scheduling
✓ AI weekly reviews
✓ Advanced insights
✓ Expanded document storage

[ Start 7-day free trial ]

₱149/month
or
₱1,299/year
```

Clearly communicate:

- Price
- Billing period
- Trial duration
- Renewal behavior
- How to cancel

---

# FREE LIMIT EXPERIENCE

When a free user reaches an AI limit:

Do not show:

> You can't use this feature.

Instead:

> You've used your 10 AI actions this month.

> Your tasks, calendar, notes, and reminders are still fully available.

> Upgrade to Anchor Pro for expanded AI assistance.

Provide:

**Maybe later**

and

**Explore Anchor Pro**

Do not prevent access to unrelated free features.

---

# SUBSCRIPTION RESTORATION

Provide:

**Restore Purchases**

inside account/settings.

Users who reinstall the app or change devices should be able to restore their subscription.

Subscription state should synchronize across the user's devices.

---

# ACCOUNT DELETION

If the user deletes their Anchor account:

- delete personal data according to the product's retention policy
- revoke entitlements
- remove private documents
- remove AI-related stored data where applicable
- invalidate sessions

Subscription cancellation must remain handled through the appropriate app-store subscription management system.

---

# PRIVACY

Anchor must never monetize personal user data.

Do not:

- sell user data
- sell task information
- sell financial information
- sell document information
- sell notes
- sell AI conversations
- use private user content for advertising profiles

The business model should be based on subscriptions and optional future premium services.

---

# FUTURE MONETIZATION

Architect the entitlement system so future plans can be added without rewriting the application.

Potential future products:

### Anchor Family

Shared household:

- Tasks
- Shopping
- Calendar
- Bills
- Responsibilities

### Anchor Business

Small-team organization.

These should NOT be implemented in the initial MVP.

Only ensure the architecture can support future subscription tiers.

---

# IMPORTANT

Monetization must never compromise the core emotional promise of Anchor:

> **Keep your life together.**

The application should remain useful to free users.

Users should upgrade because Anchor Pro provides genuinely valuable additional intelligence and capabilities—not because the free version is intentionally frustrating.