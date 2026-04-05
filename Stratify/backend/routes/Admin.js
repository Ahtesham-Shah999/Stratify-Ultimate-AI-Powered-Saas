const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');

// Define API routes for Admin
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.get('/auditlogs', adminController.getAuditLogs);
router.get('/strategies', adminController.getAllStrategies);

module.exports = router;
