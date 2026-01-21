import { defineCollection, z } from "astro:content";

const commonSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.date(),
  updatedDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});

const guides = defineCollection({
  schema: commonSchema,
});

const journal = defineCollection({
  schema: commonSchema,
});

export const collections = {
  guides,
  journal,
};
