const express = require("express");
const router = express.Router();
const strategyController = require('../controllers/StrategyController');
// Create a new strategy 
router.post("/create", strategyController.createStrategy);
router.get("/getbyuser/:user_id", strategyController.getStrategiesByUser);
// Get all strategies
router.get("/all", strategyController.getAllStrategies);
// Get strategy by ID
router.get("/getbyid/:strategy_id", strategyController.getStrategyById);
// Update strategy by ID
router.post("/updatebyid/:strategy_id", strategyController.updateStrategy);
// Delete strategy by ID
router.delete("/deletebyid/:strategy_id", strategyController.deleteStrategy);
//pass plain text to python api input :language_input
router.post('/parsedstrategy', strategyController.parsedStrategy);
// Get strategies by portfolio
router.get('/getbyportfolio/:portfolio_id', strategyController.getStrategiesByPortfolio);
module.exports = router;
