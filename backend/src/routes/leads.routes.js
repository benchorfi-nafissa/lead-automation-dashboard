const express = require('express');
const {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
} = require('../controllers/leads.controller');

const router = express.Router();

router.post('/', createLead);
router.get('/', listLeads);
router.get('/:id', getLeadById);
router.patch('/:id', updateLead);

module.exports = router;