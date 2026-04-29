import {Router} from 'express';
import {createCompany, deleteCompany, getAllCompanies, updateCompany} from "../services/companyService.js";
import {validationHandler} from "../middleware/validationHandler.js"
import {createCompanySchema, updateCompanySchema} from "../schemas/companySchema.js"
import {asyncHandler} from "../middleware/asyncHandler.js";

const router = Router();

// GET /companies
router.get('/', asyncHandler(getAllCompanies));

// POST /companies
router.post('/', validationHandler(createCompanySchema), asyncHandler(createCompany) );

// PUT /companies/:id - update a company
router.put('/:id', validationHandler(updateCompanySchema), asyncHandler(updateCompany));
//
// // DELETE /companies/:id
router.delete('/:id', asyncHandler(deleteCompany));

export default router;