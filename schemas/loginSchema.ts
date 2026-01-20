import * as z from "zod";

export const LoginSchema = z.object({
    email: z.email({ error: "Your email is required" }),
    password: z.string().min(1, "Your password is required")
});