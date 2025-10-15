import { z } from "zod";
import { Position } from "../enums/Position";

// Email validation
const emailSchema = z.string().email("Geçersiz email formatı");

// Phone validation (Türkiye formatı: 05XX XXX XX XX)
const phoneSchema = z
  .string()
  .regex(/^(\+90|0)?[0-9]{10}$/, "Geçersiz telefon numarası formatı");

// Player Position enum validation
const positionSchema = z.enum(
  Object.values(Position) as [string, ...string[]]
);

// Create Player Schema
export const createPlayerSchema = z.object({
  nickname: z
    .string()
    .min(2, "Takma ad en az 2 karakter olmalıdır")
    .max(50, "Takma ad en fazla 50 karakter olabilir")
    .trim(),

  firstName: z
    .string()
    .min(2, "İsim en az 2 karakter olmalıdır")
    .max(50, "İsim en fazla 50 karakter olabilir")
    .trim()
    .optional(),

  lastName: z
    .string()
    .min(2, "Soyisim en az 2 karakter olmalıdır")
    .max(50, "Soyisim en fazla 50 karakter olabilir")
    .trim()
    .optional(),

  email: emailSchema.optional(),

  phoneNumber: phoneSchema.optional(),

  photoUrl: z.string().url("Geçersiz URL formatı").optional(),

  jerseyNumber: z
    .number()
    .int("Forma numarası tam sayı olmalıdır")
    .min(0, "Forma numarası 0-99 arasında olmalıdır")
    .max(99, "Forma numarası 0-99 arasında olmalıdır")
    .optional(),

  position: positionSchema.optional(),

  height: z
    .number()
    .positive("Boy pozitif bir sayı olmalıdır")
    .max(250, "Boy çok yüksek görünüyor")
    .optional(),

  weight: z
    .number()
    .positive("Kilo pozitif bir sayı olmalıdır")
    .max(200, "Kilo çok yüksek görünüyor")
    .optional(),
});

// Update Player Schema (tüm alanlar optional)
export const updatePlayerSchema = z
  .object({
    nickname: z
      .string()
      .min(2, "Takma ad en az 2 karakter olmalıdır")
      .max(50, "Takma ad en fazla 50 karakter olabilir")
      .trim()
      .optional(),

    firstName: z
      .string()
      .min(2, "İsim en az 2 karakter olmalıdır")
      .max(50, "İsim en fazla 50 karakter olabilir")
      .trim()
      .optional(),

    lastName: z
      .string()
      .min(2, "Soyisim en az 2 karakter olmalıdır")
      .max(50, "Soyisim en fazla 50 karakter olabilir")
      .trim()
      .optional(),

    email: emailSchema.optional(),

    phoneNumber: phoneSchema.optional(),

    photoUrl: z.string().url("Geçersiz URL formatı").optional(),

    jerseyNumber: z
      .number()
      .int("Forma numarası tam sayı olmalıdır")
      .min(0, "Forma numarası 0-99 arasında olmalıdır")
      .max(99, "Forma numarası 0-99 arasında olmalıdır")
      .optional(),

    position: positionSchema.optional(),

    height: z
      .number()
      .positive("Boy pozitif bir sayı olmalıdır")
      .max(250, "Boy çok yüksek görünüyor")
      .optional(),

    weight: z
      .number()
      .positive("Kilo pozitif bir sayı olmalıdır")
      .max(200, "Kilo çok yüksek görünüyor")
      .optional(),

    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Güncellenecek en az bir alan belirtmelisiniz",
  });

// Type inference
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;