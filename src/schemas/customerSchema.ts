import {z} from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  city: z.string().min(1, "City is required"),
  countryCode: z.string().length(2, "Country code must be exactly 2 characters (e.g., FR, US)"),
  siret: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  email: z.string().email("Invalid email address format"),
});

export const updateCustomerSchema = createCustomerSchema.partial();
