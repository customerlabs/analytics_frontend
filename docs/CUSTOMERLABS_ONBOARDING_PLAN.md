# CustomerLabs Onboarding Feature Implementation Plan

> **Reference Document** - Use this for context when implementing or debugging the onboarding feature.

## Executive Summary

Build a complete onboarding feature with:
1. **Backend API** in `/Users/jiivadurai/Projects/Analytics/services/fastapi-service`
2. **Frontend Components** in `features/customerlabs/` using right-side Sheet pattern
3. **All 6 steps** with AI recommendations and resume state support
4. **Progress bar** at top of the side sheet

---

## Analysis Summary

### Source Codebases Analyzed

| Codebase | Key Findings |
|----------|--------------|
| **Analytics_Nextjs** | 6-step onboarding flow with sidebar navigation, AI recommendations, field mapping grids |
| **accounts-api-service** | FastAPI handlers with registry pattern, BigQuery integration, TaxonomyConfigService |
| **fastapi-service** | Current integrated service - accounts, workspaces, Keycloak auth already in place |
| **analytics_frontend** | Feature-based modules, Sheet/Dialog patterns, React Query + Zustand, CVA styling |

### Onboarding Steps

1. **data_availability_check** - Validates event data exists (read-only)
2. **basic_account_config** - Timezone, currency, business category
3. **conversion_events_config** - Conversion event mapping with AI recommendations
4. **product_events_config** - Product/item field mappings (ecommerce)
5. **utm_events_config** - UTM parameter mappings
6. **click_id_events_config** - Click ID configuration

---

## Frontend Implementation

### Feature Structure

```
features/customerlabs/
├── index.ts                          # Barrel exports
├── components/
│   ├── index.ts
│   ├── OnboardingSheet.tsx           # Main right-side drawer
│   ├── OnboardingSidebar.tsx         # Step navigation sidebar
│   ├── OnboardingStepContent.tsx     # Step router component
│   ├── steps/
│   │   ├── index.ts
│   │   ├── DataAvailabilityStep.tsx
│   │   ├── BasicAccountConfigStep.tsx
│   │   ├── ConversionEventsStep.tsx
│   │   ├── ProductEventsStep.tsx
│   │   ├── UtmEventsStep.tsx
│   │   └── ClickIdEventsStep.tsx
│   └── shared/
│       ├── index.ts
│       ├── FieldMappingGrid.tsx      # Reusable field mapping table
│       ├── FieldMappingRow.tsx       # Individual mapping row
│       ├── StepWrapper.tsx           # Step container with title
│       └── OnboardingProgress.tsx    # Progress indicator
├── hooks/
│   ├── index.ts
│   ├── useOnboardingSheet.ts         # Zustand store for sheet state
│   ├── useOnboardingState.ts         # Onboarding progress state
│   ├── useOnboardingSteps.ts         # React Query for steps data
│   └── useFieldRecommendations.ts    # AI recommendations fetching
├── services/
│   ├── index.ts
│   ├── onboarding-actions.ts         # Server actions
│   └── onboarding-api.ts             # API client functions
├── types/
│   ├── index.ts
│   └── onboarding.ts                 # TypeScript interfaces
├── schemas/
│   ├── index.ts
│   └── onboarding-schemas.ts         # Zod validation schemas
└── utils/
    ├── index.ts
    └── form-options.ts               # Timezone, currency options
```

### Page Routes

```
app/(dashboard)/ws/[id]/customerlabs/
├── page.tsx                          # CustomerLabs main page
├── layout.tsx                        # Optional layout
└── onboarding/
    ├── page.tsx                      # Onboarding page (Server Component)
    └── OnboardingPageClient.tsx      # Client component with Sheet
```

### Core Components

#### OnboardingSheet (Right-side Drawer)

```tsx
// features/customerlabs/components/OnboardingSheet.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useOnboardingSheet } from '../hooks/useOnboardingSheet';
import { OnboardingSidebar } from './OnboardingSidebar';
import { OnboardingStepContent } from './OnboardingStepContent';

export function OnboardingSheet() {
  const { isOpen, onOpenChange, currentStep, steps } = useOnboardingSheet();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <OnboardingSidebar steps={steps} currentStep={currentStep} />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle>{currentStep?.title}</SheetTitle>
            </SheetHeader>
            <OnboardingStepContent stepKey={currentStep?.step_key} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### Zustand Store for Onboarding State

```tsx
// features/customerlabs/hooks/useOnboardingSheet.ts
import { create } from 'zustand';
import type { OnboardingStep } from '../types';

interface OnboardingSheetState {
  isOpen: boolean;
  currentStepKey: string | null;
  completedSteps: string[];
  steps: OnboardingStep[];
  stepData: Record<string, unknown>;

  // Actions
  open: () => void;
  close: () => void;
  onOpenChange: (open: boolean) => void;
  setCurrentStep: (stepKey: string) => void;
  markStepCompleted: (stepKey: string) => void;
  setStepData: (stepKey: string, data: unknown) => void;
  setSteps: (steps: OnboardingStep[]) => void;
  reset: () => void;
}

export const useOnboardingSheet = create<OnboardingSheetState>((set, get) => ({
  isOpen: false,
  currentStepKey: null,
  completedSteps: [],
  steps: [],
  stepData: {},

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  onOpenChange: (open) => set({ isOpen: open }),

  setCurrentStep: (stepKey) => set({ currentStepKey: stepKey }),

  markStepCompleted: (stepKey) => {
    const { completedSteps, steps, currentStepKey } = get();
    if (!completedSteps.includes(stepKey)) {
      const newCompleted = [...completedSteps, stepKey];
      const currentIndex = steps.findIndex(s => s.step_key === stepKey);
      const nextStep = steps[currentIndex + 1];

      set({
        completedSteps: newCompleted,
        currentStepKey: nextStep?.step_key || currentStepKey,
      });
    }
  },

  setStepData: (stepKey, data) => set((state) => ({
    stepData: { ...state.stepData, [stepKey]: data },
  })),

  setSteps: (steps) => set({
    steps,
    currentStepKey: steps[0]?.step_key || null,
  }),

  reset: () => set({
    isOpen: false,
    currentStepKey: null,
    completedSteps: [],
    stepData: {},
  }),
}));
```

### Type Definitions

```tsx
// features/customerlabs/types/onboarding.ts
export enum StepKey {
  DATA_AVAILABILITY = 'data_availability_check',
  BASIC_ACCOUNT = 'basic_account_config',
  CONVERSION_EVENTS = 'conversion_events_config',
  PRODUCT_EVENTS = 'product_events_config',
  UTM_EVENTS = 'utm_events_config',
  CLICK_ID_EVENTS = 'click_id_events_config',
}

export interface OnboardingStep {
  step_key: StepKey;
  title: string;
  description?: string;
  step_order: number;
  is_required: boolean;
  skippable_type?: 'permanent' | 'temporary' | null;
  auto_fill_enabled: boolean;
}

export interface OnboardingDataResponse {
  master_steps: OnboardingStep[];
  current_step_key?: string;
  completed_steps: string[];
}

export interface FieldMapping {
  sourceField: string;
  fallback?: string;
  default?: string | number;
}

export interface BasicAccountConfig {
  client_timezone: string;
  base_currency: string;
  business_category: 'ecommerce' | 'saas' | 'lead_gen' | 'custom';
  backfill_start_date?: string;
  multi_currency_enabled: boolean;
  new_user_event: string;
  repeat_user_event: string;
}

export interface ConversionEventsConfig {
  conversion_events: string[];
  field_mappings: {
    order_id?: FieldMapping;
    value?: FieldMapping;
    currency?: FieldMapping;
    coupon?: FieldMapping;
    shipping?: FieldMapping;
    tax?: FieldMapping;
  };
}

export interface StepComponentProps {
  onValidationChange?: (isValid: boolean) => void;
  onRegisterData?: (getData: () => Record<string, unknown>) => void;
}
```

### Zod Validation Schemas

```tsx
// features/customerlabs/schemas/onboarding-schemas.ts
import { z } from 'zod';

export const basicAccountConfigSchema = z.object({
  client_timezone: z.string().min(1, 'Timezone is required'),
  base_currency: z.string().min(1, 'Currency is required'),
  business_category: z.enum(['ecommerce', 'saas', 'lead_gen', 'custom']),
  backfill_start_date: z.string().optional(),
  multi_currency_enabled: z.boolean(),
  new_user_event: z.string().min(1, 'New user event is required'),
  repeat_user_event: z.string().min(1, 'Repeat user event is required'),
});

export const fieldMappingSchema = z.object({
  sourceField: z.string().min(1),
  fallback: z.string().optional(),
  default: z.union([z.string(), z.number()]).optional(),
});

export const conversionEventsConfigSchema = z.object({
  conversion_events: z.array(z.string()).min(1, 'Select at least one event'),
  field_mappings: z.object({
    order_id: fieldMappingSchema,
    value: fieldMappingSchema,
    currency: fieldMappingSchema.optional(),
    coupon: fieldMappingSchema.optional(),
    shipping: fieldMappingSchema.optional(),
    tax: fieldMappingSchema.optional(),
  }),
});
```

### API Pattern (React Query + Server Actions)

```tsx
// features/customerlabs/services/onboarding-actions.ts
'use server';

import { auth } from '@/lib/auth';
import { fetchFromBackendAPI } from '@/lib/apiFetcherServer';
import type { CommonResponse, OnboardingDataResponse } from '../types';

export async function getOnboardingData(accountId: string) {
  const session = await auth();
  if (!session) throw new Error('Not authenticated');

  return fetchFromBackendAPI<CommonResponse<OnboardingDataResponse>>(
    `/api/v1/customerlabs/onboarding?account_id=${accountId}`
  );
}

export async function saveOnboardingStep<T>(
  stepKey: string,
  data: T,
  accountId: string
) {
  const session = await auth();
  if (!session) throw new Error('Not authenticated');

  return fetchFromBackendAPI<CommonResponse<unknown>>(
    `/api/v1/customerlabs/onboarding/step/${stepKey}?account_id=${accountId}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}
```

```tsx
// features/customerlabs/hooks/useOnboardingSteps.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOnboardingData, saveOnboardingStep } from '../services/onboarding-actions';

export function useOnboardingData(accountId: string) {
  return useQuery({
    queryKey: ['onboarding', accountId],
    queryFn: () => getOnboardingData(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveOnboardingStep(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stepKey, data }: { stepKey: string; data: unknown }) =>
      saveOnboardingStep(stepKey, data, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', accountId] });
    },
  });
}
```

---

## Backend Implementation (FastAPI Service)

### Backend File Structure

Create under `/Users/jiivadurai/Projects/Analytics/services/fastapi-service/`:

```
app/
├── api/v1/
│   └── customerlabs/
│       └── onboarding/
│           ├── __init__.py
│           ├── router.py              # Route definitions
│           ├── views.py               # Business logic
│           ├── schemas.py             # Pydantic request/response models
│           └── handlers/
│               ├── __init__.py
│               ├── registry.py        # Handler registry pattern
│               ├── data_availability.py
│               ├── basic_account_config.py
│               ├── conversion_events.py
│               ├── product_events.py
│               ├── utm_events.py
│               └── click_id_events.py
├── models/
│   └── onboarding.py              # SQLModel database models
└── services/
    └── taxonomy_service.py        # AI recommendations service
```

### Database Models

```python
# app/models/onboarding.py
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON, ARRAY, String
from datetime import datetime
from typing import Optional
from ulid import ULID

class MasterOnboardingStep(SQLModel, table=True):
    __tablename__ = "master_onboarding_steps"

    step_key: str = Field(primary_key=True)
    business_category: Optional[str] = None  # NULL = all categories
    step_order: int
    title: str
    description: Optional[str] = None
    is_required: bool = True
    skippable_type: Optional[str] = None  # permanent | temporary
    auto_fill_enabled: bool = True
    validation_rules: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AccountOnboardingProgress(SQLModel, table=True):
    __tablename__ = "account_onboarding_progress"

    account_id: str = Field(primary_key=True)
    current_step_key: Optional[str] = None
    is_completed: bool = False
    completed_steps: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    skipped_permanent: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    skipped_temporary: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    step_data: dict = Field(default={}, sa_column=Column(JSON))
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ConversionSetting(SQLModel, table=True):
    __tablename__ = "conversion_settings"

    account_id: str = Field(primary_key=True)
    conversion_events: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    field_mappings: dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProductSetting(SQLModel, table=True):
    __tablename__ = "product_settings"

    account_id: str = Field(primary_key=True)
    product_events: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    field_mappings: dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UtmSetting(SQLModel, table=True):
    __tablename__ = "utm_settings"

    account_id: str = Field(primary_key=True)
    utm_mappings: list[dict] = Field(default=[], sa_column=Column(JSON))
    enabled_params: list[str] = Field(default=[], sa_column=Column(ARRAY(String)))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClickIdSetting(SQLModel, table=True):
    __tablename__ = "click_id_settings"

    account_id: str = Field(primary_key=True)
    click_id_mappings: list[dict] = Field(default=[], sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### API Endpoints

```python
# app/api/v1/customerlabs/onboarding/router.py
from fastapi import APIRouter, Depends
from app.core.security import CurrentUser
from app.core.database import SessionDep

router = APIRouter(prefix="/customerlabs/onboarding", tags=["customerlabs-onboarding"])

# GET /api/v1/customerlabs/onboarding?account_id={id}
# Returns: master_steps, current_step_key, completed_steps

# GET /api/v1/customerlabs/onboarding/step/{step_key}?account_id={id}
# Returns: step-specific data + recommendations

# POST /api/v1/customerlabs/onboarding/step/{step_key}?account_id={id}
# Body: step-specific form data
# Returns: success + next step info

# GET /api/v1/customerlabs/onboarding/recommendations/{config_type}?account_id={id}
# Returns: AI-generated field mapping recommendations
```

### Handler Registry Pattern

```python
# app/api/v1/customerlabs/onboarding/handlers/registry.py
from typing import Callable, Dict

_step_handlers: Dict[str, Callable] = {}

def register_step_handler(step_key: str):
    def decorator(func: Callable):
        _step_handlers[step_key] = func
        return func
    return decorator

def get_step_handler(step_key: str) -> Callable:
    handler = _step_handlers.get(step_key)
    if not handler:
        raise ValueError(f"No handler registered for step: {step_key}")
    return handler
```

### Pydantic Schemas

```python
# app/api/v1/customerlabs/onboarding/schemas.py
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
import pytz

class OnboardingStepResponse(BaseModel):
    step_key: str
    title: str
    description: Optional[str] = None
    step_order: int
    is_required: bool
    skippable_type: Optional[str] = None
    auto_fill_enabled: bool

class OnboardingDataResponse(BaseModel):
    master_steps: list[OnboardingStepResponse]
    current_step_key: Optional[str] = None
    completed_steps: list[str] = []
    progress_percentage: float = 0.0

class BasicAccountConfigRequest(BaseModel):
    client_timezone: str
    base_currency: str
    business_category: str
    backfill_start_date: Optional[date] = None
    multi_currency_enabled: bool = False
    new_user_event: str
    repeat_user_event: str

    @field_validator('client_timezone')
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        if v not in pytz.all_timezones:
            raise ValueError(f'Invalid timezone: {v}')
        return v

class FieldMappingSchema(BaseModel):
    source_field: str
    fallback: Optional[str] = None
    default: Optional[str | int | float] = None

class ConversionEventsConfigRequest(BaseModel):
    conversion_events: list[str]
    field_mappings: dict[str, FieldMappingSchema]

class ProductEventsConfigRequest(BaseModel):
    product_events: list[str]
    field_mappings: dict[str, FieldMappingSchema]

class UtmEventsConfigRequest(BaseModel):
    utm_mappings: list[dict]
    enabled_params: list[str]

class ClickIdEventsConfigRequest(BaseModel):
    click_id_mappings: list[dict]

class RecommendationResponse(BaseModel):
    recommended_events: list[str] = []
    recommended_mappings: dict = {}
    warnings: list[str] = []
```

### Migration File

```python
# alembic/versions/xxxx_add_onboarding_tables.py
def upgrade():
    # Create master_onboarding_steps
    # Create account_onboarding_progress
    # Create conversion_settings
    # Create product_settings
    # Create utm_settings
    # Create click_id_settings
    # Seed master_onboarding_steps with default data

def downgrade():
    # Drop all tables in reverse order
```

---

## Files to Create

### Backend Files (FastAPI Service)

| File | Purpose |
|------|---------|
| `app/models/onboarding.py` | SQLModel database models |
| `app/api/v1/customerlabs/__init__.py` | CustomerLabs module init |
| `app/api/v1/customerlabs/onboarding/__init__.py` | Onboarding module init |
| `app/api/v1/customerlabs/onboarding/router.py` | Route definitions |
| `app/api/v1/customerlabs/onboarding/views.py` | Business logic |
| `app/api/v1/customerlabs/onboarding/schemas.py` | Pydantic schemas |
| `app/api/v1/customerlabs/onboarding/handlers/__init__.py` | Handler module |
| `app/api/v1/customerlabs/onboarding/handlers/registry.py` | Handler registry |
| `app/api/v1/customerlabs/onboarding/handlers/data_availability.py` | Step 1 handler |
| `app/api/v1/customerlabs/onboarding/handlers/basic_account_config.py` | Step 2 handler |
| `app/api/v1/customerlabs/onboarding/handlers/conversion_events.py` | Step 3 handler |
| `app/api/v1/customerlabs/onboarding/handlers/product_events.py` | Step 4 handler |
| `app/api/v1/customerlabs/onboarding/handlers/utm_events.py` | Step 5 handler |
| `app/api/v1/customerlabs/onboarding/handlers/click_id_events.py` | Step 6 handler |
| `alembic/versions/xxxx_add_onboarding_tables.py` | Database migration |

### Frontend Files (Analytics Frontend)

| File | Purpose |
|------|---------|
| `features/customerlabs/types/onboarding.ts` | TypeScript interfaces |
| `features/customerlabs/schemas/onboarding-schemas.ts` | Zod validation |
| `features/customerlabs/hooks/useOnboardingSheet.ts` | Zustand store |
| `features/customerlabs/hooks/useOnboardingData.ts` | React Query hooks |
| `features/customerlabs/services/onboarding-actions.ts` | Server actions |
| `features/customerlabs/utils/form-options.ts` | Timezone/currency helpers |
| `features/customerlabs/components/shared/StepWrapper.tsx` | Step container |
| `features/customerlabs/components/shared/FieldMappingGrid.tsx` | Mapping table |
| `features/customerlabs/components/shared/FieldMappingRow.tsx` | Mapping row |
| `features/customerlabs/components/shared/OnboardingProgress.tsx` | Progress bar |
| `features/customerlabs/components/OnboardingSidebar.tsx` | Step navigation |
| `features/customerlabs/components/OnboardingStepContent.tsx` | Step router |
| `features/customerlabs/components/OnboardingSheet.tsx` | Main drawer |
| `features/customerlabs/components/steps/DataAvailabilityStep.tsx` | Step 1 UI |
| `features/customerlabs/components/steps/BasicAccountConfigStep.tsx` | Step 2 UI |
| `features/customerlabs/components/steps/ConversionEventsStep.tsx` | Step 3 UI |
| `features/customerlabs/components/steps/ProductEventsStep.tsx` | Step 4 UI |
| `features/customerlabs/components/steps/UtmEventsStep.tsx` | Step 5 UI |
| `features/customerlabs/components/steps/ClickIdEventsStep.tsx` | Step 6 UI |
| `app/(dashboard)/ws/[id]/customerlabs/onboarding/page.tsx` | Route page |

---

## Implementation Order (Combined)

| Phase | Backend Tasks | Frontend Tasks |
|-------|---------------|----------------|
| **1** | Database models + migration | Types + schemas |
| **2** | Pydantic schemas | Zustand store |
| **3** | Handler registry + base endpoints | Server actions stub |
| **4** | data_availability handler | DataAvailabilityStep |
| **5** | basic_account_config handler | BasicAccountConfigStep |
| **6** | conversion_events handler | ConversionEventsStep + FieldMappingGrid |
| **7** | product_events handler | ProductEventsStep |
| **8** | utm_events handler | UtmEventsStep |
| **9** | click_id_events handler | ClickIdEventsStep |
| **10** | recommendations endpoint | AI recommendations hook |
| **11** | - | OnboardingSheet + Sidebar + Progress |
| **12** | - | Page routes |

---

## Verification Plan

### Backend Testing
1. Run migration: `alembic upgrade head`
2. Test endpoints via curl/httpie:
   - `GET /api/v1/customerlabs/onboarding?account_id=test`
   - `POST /api/v1/customerlabs/onboarding/step/basic_account_config`
3. Verify database records created

### Frontend Testing
1. `npm run build` - No TypeScript errors
2. `npm run lint` - No ESLint errors
3. Manual testing:
   - Open onboarding sheet
   - Navigate through steps
   - Fill forms, verify validation
   - Check progress bar updates
   - Test resume state

### Integration Testing
1. Connect frontend to backend
2. Complete full onboarding flow
3. Verify data persisted correctly
