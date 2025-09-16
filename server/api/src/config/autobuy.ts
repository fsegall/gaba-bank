// src/config/autobuy.ts
import { z } from "zod";

const AutobuyEnvSchema = z.object({
  AUTOBUY_ENABLED: z
    .string()
    .optional()
    .transform((v) => (v ?? "false").toLowerCase() === "true"),
  AUTOBUY_DEFAULT_PRODUCT: z.string().optional().default("defy-balanced"),
});

export type AutobuyConfig = z.infer<typeof AutobuyEnvSchema>;

export function getAutobuyConfig(env = process.env): AutobuyConfig {
  return AutobuyEnvSchema.parse(env);
}
