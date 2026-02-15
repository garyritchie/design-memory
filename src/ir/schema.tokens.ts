import { z } from 'zod';

export const colorRoleSchema = z.enum([
  'primary',
  'accent',
  'surface',
  'text',
  'muted',
  'status-success',
  'status-warning',
  'status-error',
  'status-info',
  'unknown',
]);

export const componentTypeSchema = z.enum([
  'button',
  'input',
  'card',
  'table',
  'modal',
  'navigation',
  'form',
  'unknown',
]);

export const colorTokenSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  role: colorRoleSchema,
  evidence: z.array(z.string()),
  usage: z.array(z.string()),
});

export const typographyTokenSchema = z.object({
  family: z.string(),
  size: z.number().positive(),
  weight: z.number().int().min(100).max(900),
  lineHeight: z.number().positive(),
  role: z.enum(['heading', 'body', 'caption', 'label', 'unknown']),
  evidence: z.array(z.string()),
});

export const spacingTokenSchema = z.object({
  value: z.number().nonnegative(),
  unit: z.enum(['px', 'rem', 'em']),
  evidence: z.array(z.string()),
});

export const radiusTokenSchema = z.object({
  value: z.number().nonnegative(),
  unit: z.enum(['px', 'rem', 'em']),
  evidence: z.array(z.string()),
});

export const elevationTokenSchema = z.object({
  shadow: z.string(),
  level: z.number().int().nonnegative(),
  evidence: z.array(z.string()),
});
