import * as z from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
});

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
