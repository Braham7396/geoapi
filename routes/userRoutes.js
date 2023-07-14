const express = require('express');

const userController = require(`./../controllers/userController`);
const authController = require(`./../controllers/authController`);

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signup-verify', authController.verifySignupOTP);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword/', authController.updatePassword);

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
