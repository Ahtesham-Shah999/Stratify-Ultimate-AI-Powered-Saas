const express = require('express');
const router = express.Router();
const backtestController = require('../controllers/backtest');

router.post('/run', backtestController.runBacktest);
router.get('/all', backtestController.getAllBacktests);
router.get('/getbyid/:backtest_id', backtestController.getBacktestById);
router.get('/getbystrategy/:strategy_id', backtestController.getBacktestsByStrategy);
router.get('/getbyuser/:user_id', backtestController.getBacktestsByUser);
router.delete('/deletebyid/:backtest_id', backtestController.deleteBacktest);

module.exports = router;