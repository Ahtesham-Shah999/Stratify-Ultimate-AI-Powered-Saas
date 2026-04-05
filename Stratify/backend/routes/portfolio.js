const express = require('express');
const router = express.Router();

const portfolioController = require('../controllers/portfolioController');

router.post('/', portfolioController.createPortfolio);
router.get('/', portfolioController.getAllPortfolios);
router.get('/user/:user_id', portfolioController.getPortfoliosByUser);
router.get('/totalcapital/:portfolio_id', portfolioController.getTotalCapitalByPortfolio);
router.get('/:portfolio_id', portfolioController.getPortfolioById);
router.put('/:portfolio_id', portfolioController.updatePortfolio);
router.delete('/:portfolio_id', portfolioController.deletePortfolio);

module.exports = router;