const { Router } = require('express');
const controller = require('../controllers/claims.controller');
const validateClaim = require('../middleware/validateClaim');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', validateClaim, controller.submit);
router.put('/:id', validateClaim, controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
