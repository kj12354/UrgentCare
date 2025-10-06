import { z } from 'zod'
export const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string().min(1),
  phone: z.string().optional()
})
