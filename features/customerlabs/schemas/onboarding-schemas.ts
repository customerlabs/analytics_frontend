import { z } from "zod";

/**
 * Field mapping schema for event configurations
 */
export const fieldMappingSchema = z.object({
  target_field: z.string().min(1, "Target field is required"),
  source_field: z.string().min(1, "Source field is required"),
  fallback_field: z.string().optional(),
  default_value: z.string().optional(),
  is_required: z.boolean(),
});

export type FieldMappingInput = z.infer<typeof fieldMappingSchema>;

/**
 * Basic account configuration schema
 */
export const basicAccountConfigSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),
  business_category: z.string().min(1, "Business category is required"),
  new_user_event: z.string().optional().default(""),
  repeat_user_event: z.string().optional().default(""),
});

export type BasicAccountConfigInput = z.infer<typeof basicAccountConfigSchema>;

/**
 * Conversion events configuration schema
 */
export const conversionEventsConfigSchema = z.object({
  selected_events: z
    .array(z.string())
    .min(1, "At least one conversion event is required"),
  field_mappings: z.array(fieldMappingSchema),
});

export type ConversionEventsConfigInput = z.infer<
  typeof conversionEventsConfigSchema
>;

/**
 * Product events configuration schema
 */
export const productEventsConfigSchema = z.object({
  selected_events: z.array(z.string()),
  field_mappings: z.array(fieldMappingSchema),
});

export type ProductEventsConfigInput = z.infer<
  typeof productEventsConfigSchema
>;

/**
 * UTM events configuration schema
 */
export const utmEventsConfigSchema = z.object({
  selected_events: z.array(z.string()),
  field_mappings: z.array(fieldMappingSchema),
});

export type UtmEventsConfigInput = z.infer<typeof utmEventsConfigSchema>;

/**
 * Schema validation helper
 */
export function validateStepData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
