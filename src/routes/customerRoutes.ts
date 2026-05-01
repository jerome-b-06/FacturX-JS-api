import {Router} from 'express';
import {createCustomer, deleteCustomer, getAllCompanyCustomers, updateCustomer} from "../services/customerService.js";
import {validationHandler} from "../middleware/validationHandler.js"
import {createCustomerSchema, updateCustomerSchema} from "../schemas/customerSchema.js"
import {asyncHandler} from "../middleware/asyncHandler.js";

const router = Router({mergeParams: true});

// GET /customers
router.get('/', asyncHandler(getAllCompanyCustomers));

// POST /customers
router.post('/', validationHandler(createCustomerSchema), asyncHandler(createCustomer) );

// PUT /customers/:id - update a customer
router.put('/:id', validationHandler(updateCustomerSchema), asyncHandler(updateCustomer));
//
// // DELETE /customers/:id
router.delete('/:id', asyncHandler(deleteCustomer));

export default router;