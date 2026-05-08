import {Router} from 'express';
import {
    createInvoice,
    deleteInvoice,
    downloadInvoice, getCompanyInvoiceById,
    getCompanyInvoices,
    updateInvoice
} from "../services/invoiceService.js";
import {asyncHandler} from "../middleware/asyncHandler.js";
import {validationHandler} from "../middleware/validationHandler.js";
import {createInvoiceSchema, updateInvoiceSchema} from "../schemas/invoiceSchema.js";

const router = Router({mergeParams: true});

// GET /companies/:companyId/invoices
router.get('/', asyncHandler(getCompanyInvoices));
// GET /companies/:companyId/invoices/:id
router.get('/:id', asyncHandler(getCompanyInvoiceById));
// POST /invoices
router.post('/', validationHandler(createInvoiceSchema), asyncHandler(createInvoice));
// PUT /invoices/:id
router.put('/:id', validationHandler(updateInvoiceSchema), asyncHandler(updateInvoice));
// DELETE /invoices/:id
router.delete('/:id', asyncHandler(deleteInvoice));

router.get('/:id/download', asyncHandler(downloadInvoice));

export default router;