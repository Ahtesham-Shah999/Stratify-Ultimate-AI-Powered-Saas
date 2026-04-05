import { z } from "zod";

export const SignInSchema = z.object({
  email: z
    .string()
    .min(1, { error: "Email is required" })
    .email({ error: "Please provide a valid email address." }),

  password: z
    .string()
    .min(6, { error: "Password must be at least 6 characters long" })
    .max(100, { error: "Password cannot exceed 100 characters" })
    .regex(/[A-Z]/, "Password must contain at least one uppercase character")
    .regex(/[a-z]/, "Password must contain at least one lowercase character")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const SignUpSchema = z.object({
  confirmPassword: z
    .string()
    .min(6, { error: "Password must be at least 6 characters long" })
    .max(100, { error: "Password cannot exceed 100 characters" })
    .regex(/[A-Z]/, "Password must contain at least one uppercase character")
    .regex(/[a-z]/, "Password must contain at least one lowercase character")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),

  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces.",
    }),

  email: z
    .string()
    .min(1, { error: "Email is required" })
    .email({ error: "Please provide a valid email address." }),

  password: z
    .string()
    .min(6, { error: "Password must be at least 6 characters long" })
    .max(100, { error: "Password cannot exceed 100 characters" })
    .regex(/[A-Z]/, "Password must contain at least one uppercase character")
    .regex(/[a-z]/, "Password must contain at least one lowercase character")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),
});

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { error: "Email is required" })
    .email({ error: "Please provide a valid email address." }),
});

export const SetNewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters long" })
      .regex(/[A-Z]/, "Password must contain at least one uppercase character")
      .regex(/[a-z]/, "Password must contain at least one lowercase character")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z
      .string()
      .min(6, { error: "Password must be at least 6 characters long" })
      .max(100, { error: "Password cannot exceed 100 characters" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password do not match",
    path: ["confirmPassword"],
  });

export const OtpSchema = z.object({
  otp1: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
  otp2: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
  otp3: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
  otp4: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
  otp5: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
  otp6: z.string().min(1, "Required").regex(/^\d$/, "Only digits allowed"),
});
