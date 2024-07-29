const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', userController.createUser);
router.post('/login', userController.loginUser);
router.get('/profile', protect, userController.getUser);

module.exports = router;
