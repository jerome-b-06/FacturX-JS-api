import { z } from 'zod';

const pdfConfigSchema = z.object({
  headless: z.coerce.boolean().default(true),
  scale: z.coerce.number().default(1),
  format: z.enum(['A4', 'A3', 'Letter', 'Legal']).default('A4'),
  printBackground: z.coerce.boolean().default(true),
  marginTop: z.string().default('20mm'),
  marginRight: z.string().default('20mm'),
  marginBottom: z.string().default('20mm'),
  marginLeft: z.string().default('20mm'),
});

export const pdfConfig = pdfConfigSchema.parse({
  headless: process.env.PDF_HEADLESS,
  scale: process.env.PDF_SCALE,
  format: process.env.PDF_FORMAT,
  printBackground: process.env.PDF_PRINT_BACKGROUND,
  marginTop: process.env.PDF_MARGIN_TOP,
  marginRight: process.env.PDF_MARGIN_RIGHT,
  marginBottom: process.env.PDF_MARGIN_BOTTOM,
  marginLeft: process.env.PDF_MARGIN_LEFT,
});
