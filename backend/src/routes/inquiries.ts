import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createInquirySchema, updateStatusSchema } from '../schemas';
import {
  listInquiries,
  getInquiry,
  createInquiry,
  findRecentDuplicate,
  updateStatus,
  canTransition,
} from '../services/inquiryService';

const router = Router();
router.use(requireAuth);

function parseId(raw: string) {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

router.get('/', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    if (status && !['New', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid status filter' } });
    }
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const rows = await listInquiries(req.user!, { status, q, page });
    res.json({ inquiries: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = createInquirySchema.safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[String(issue.path[0])] = issue.message;
      }
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields', fields },
      });
    }
    const dup = await findRecentDuplicate(req.user!.id, parsed.data.contact, parsed.data.subject);
    if (dup) {
      return res.status(409).json({
        error: { code: 'DUPLICATE', message: 'This inquiry was already submitted a moment ago', existingId: dup.id },
      });
    }
    const inquiry = await createInquiry(req.user!.id, parsed.data);
    res.status(201).json({ inquiry });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Inquiry id must be a number' } });
    }
    const inquiry = await getInquiry(req.user!, id);
    if (!inquiry) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Inquiry not found' } });
    }
    res.json({ inquiry });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Inquiry id must be a number' } });
    }
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Status and version are required' } });
    }
    const current = await getInquiry(req.user!, id);
    if (!current) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Inquiry not found' } });
    }
    if (!canTransition(current.status, parsed.data.status)) {
      return res.status(409).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot change status from ${current.status} to ${parsed.data.status}`,
        },
      });
    }
    const updated = await updateStatus(id, parsed.data.status, parsed.data.version);
    if (!updated) {
      return res.status(409).json({
        error: { code: 'STALE_VERSION', message: 'This inquiry was changed elsewhere. Please reload.' },
      });
    }
    res.json({ inquiry: updated });
  } catch (err) {
    next(err);
  }
});

export default router;