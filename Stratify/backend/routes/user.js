const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

// POST /api/user/signup
router.post('/signup', userController.registerUser);

// POST /api/user/login
router.post('/checkemail/:email',userController.checkUserEmail);
router.post('/login', userController.loginUser);
router.put('/update-user/:email', userController.updateUser);
router.get('/getuserbyid/:id',userController.getUserById)
router.delete('/deleteuser/:id',userController.deleteUser)
router.get('/getAllusers',userController.getAllUsers)
router.post('/setUserSettings',userController.setUserSettings)
router.post('/updateUserSettings/:user_id',userController.updateUserSettings)

// Upload profile picture directly to storage and update user model
router.post('/upload-pic/:user_id', upload.single('profile_pic'), userController.uploadProfilePic)

module.exports = router;
