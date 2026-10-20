import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createInquirySchema = z.object({
  customer_name: z.string().trim().min(1, 'Customer name is required').max(100),
  contact: z.string().trim().min(3, 'Contact is required').max(100),
  subject: z.string().trim().min(1, 'Subject is required').max(150),
  description: z.string().trim().min(1, 'Description is required').max(2000),
});

export const updateStatusSchema = z.object({
  status: z.enum(['New', 'In Progress', 'Resolved']),
  version: z.number().int().positive(),
});