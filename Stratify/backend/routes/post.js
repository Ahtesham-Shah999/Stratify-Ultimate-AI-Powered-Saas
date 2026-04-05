const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/create',                  postController.createPost);
router.get('/all',                      postController.getAllPosts);
router.get('/featured',                 postController.getFeaturedPosts);
router.get('/getbyid/:post_id',         postController.getPostById);
router.get('/getbyuser/:user_id',       postController.getPostsByUser);
router.get('/getbystrategy/:strategy_id', postController.getPostsByStrategy);
router.post('/updatebyid/:post_id',     postController.updatePost);
router.delete('/deletebyid/:post_id',   postController.deletePost);
router.post('/vote/:post_id',           postController.votePost);

module.exports = router;