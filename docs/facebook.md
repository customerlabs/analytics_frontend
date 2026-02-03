# Facebook Onboarding Configuration

Multi-step wizard for configuring Facebook Ads accounts after OAuth authorization.

## Overview

After a user authorizes a Facebook Ads account via OAuth, they complete a 3-step configuration wizard:

1. **Pixel Selection** - Choose which Facebook Pixel to use for tracking
2. **Business Type** - Select Lead Generation or Ecommerce
3. **Events Configuration** - Configure primary conversion events and mappings

## Database Setup (REQUIRED)

Before the Facebook onboarding wizard works, you must insert the master step definitions.

### Insert Facebook Master Steps

```sql
INSERT INTO master_onboarding_steps (
    step_key,
    platform,
    business_category,
    step_order,
    title,
    description,
    is_required,
    skippable_type,
    auto_fill_enabled,
    created_at,
    updated_at
)
VALUES
    (
        'fb_pixel_selection',
        'Facebook',
        NULL,
        1,
        'Select Facebook Pixel',
        'Choose the pixel you want to use for conversion tracking. Events will be loaded from this pixel.',
        true,
        'not_skippable',
        false,
        NOW(),
        NOW()
    ),
    (
        'fb_business_type',
        'Facebook',
        NULL,
        2,
        'Select Business Type',
        'Choose your business type to configure the appropriate conversion events.',
        true,
        'not_skippable',
        false,
        NOW(),
        NOW()
    ),
    (
        'fb_lead_events',
        'Facebook',
        'lead_gen',
        3,
        'Configure Lead Events',
        'Set up your primary lead conversion event and mapping.',
        true,
        'not_skippable',
        true,
        NOW(),
        NOW()
    ),
    (
        'fb_ecommerce_events',
        'Facebook',
        'ecommerce',
        3,
        'Configure Purchase Events',
        'Set up your primary purchase conversion event and mapping.',
        true,
        'not_skippable',
        true,
        NOW(),
        NOW()
    ),
    (
        'fb_product_insights',
        'Facebook',
        'ecommerce',
        4,
        'Product-Level Insights',
        'Enable product-level performance tracking for your catalog.',
        false,
        'permanent',
        false,
        NOW(),
        NOW()
    );
```

### Verify Installation

```sql
SELECT step_key, platform, step_order, title
FROM master_onboarding_steps
WHERE platform = 'Facebook'
ORDER BY step_order;
```

Expected: 5 rows

### Step Definitions

| step_key | step_order | business_category | Description |
|----------|------------|-------------------|-------------|
| `fb_pixel_selection` | 1 | NULL (all) | Step 1: Select Facebook Pixel |
| `fb_business_type` | 2 | NULL (all) | Step 2: Choose Lead Gen or Ecommerce |
| `fb_lead_events` | 3 | lead_gen | Step 3 (Lead Gen): Configure lead events |
| `fb_ecommerce_events` | 3 | ecommerce | Step 3 (Ecommerce): Configure purchase events |
| `fb_product_insights` | 4 | ecommerce | Optional: Enable product-level tracking |

## API Endpoints

### Shared Onboarding API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/accounts/onboarding?account_id=X&platform=Facebook` | Get onboarding steps and progress |

### Facebook Settings API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/facebook/settings?account_id=X` | Get Facebook settings from Account.config_data |
| PUT | `/api/v1/facebook/settings?account_id=X` | Update settings and mark step complete |

## Settings Storage

Facebook settings are stored in `Account.config_data` (JSONB field):

```json
{
  "pixel_id": "123456789",
  "pixel_name": "Main Website Pixel",
  "business_type": "ecommerce",
  "lead_config": {
    "primaryEvent": "Lead",
    "primaryEventMapping": "lead"
  },
  "ecommerce_config": {
    "purchaseEvent": "Purchase",
    "purchaseEventMapping": "omni_purchase"
  },
  "product_insights_enabled": true
}
```

## File Structure

### Backend (fastapi-service)

```
app/api/v1/
├── accounts/
│   ├── router.py      # Shared /onboarding endpoint
│   ├── views.py       # get_onboarding_steps()
│   └── schemas.py     # OnboardingStepResponse, OnboardingDataResponse
└── facebook/
    ├── __init__.py
    ├── router.py      # GET/PUT /settings
    ├── views.py       # get_facebook_settings(), update_facebook_settings()
    └── schemas.py     # FacebookSettingsResponse, FacebookSettingsUpdate
```

### Frontend (analytics_frontend)

```
features/
├── accounts/hooks/
│   └── useOnboardingSteps.ts   # Shared hook for all platforms
└── facebook/
    ├── components/onboarding/
    │   ├── FacebookConfigDrawer.tsx
    │   ├── steps/
    │   │   ├── PixelSelectionStep.tsx
    │   │   ├── BusinessTypeStep.tsx
    │   │   └── EventsConfigStep.tsx
    │   └── shared/
    │       ├── ConfigStepIndicator.tsx
    │       ├── PixelCard.tsx
    │       ├── BusinessTypeCard.tsx
    │       ├── EventDropdown.tsx
    │       └── ActionTypeMapping.tsx
    ├── hooks/
    │   └── useFacebookConfig.ts   # Zustand + React Query
    └── server/
        └── actions.ts             # getFacebookSettings, updateFacebookSettings
```

## Flow

```
User creates Facebook account via OAuth
    ↓
Account created with status="draft"
    ↓
FacebookConfigDrawer opens automatically
    ↓
useOnboardingSteps fetches steps from /api/v1/accounts/onboarding?platform=Facebook
    ↓
User completes 3-step wizard
    ↓
saveConfiguration() calls PUT /api/v1/facebook/settings
    ↓
Backend updates Account.config_data + AccountOnboardingProgress
    ↓
Account status changes to "active"
```

## Related Documentation

- [Facebook Auth Flow](./core/facebook-auth.md) - OAuth authorization process
