const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validation');

// POST endpoint to submit user information
router.post('/submit', validateUser, userController.submitUserInfo);

// GET endpoint to retrieve all users (optional - for admin)
router.get('/', userController.getAllUsers);

// GET endpoint to retrieve user by ID
router.get('/:id', userController.getUserById);

// DELETE endpoint to delete user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;