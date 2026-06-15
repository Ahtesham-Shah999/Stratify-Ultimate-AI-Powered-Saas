const axios = require('axios');

const PYTHON_BASE_URL = "http://127.0.0.1:8001";

exports.analyzeController = async (req, res) => {
  const { pair, page_size } = req.body;

  if (!pair || !pair.trim()) {
    return res.status(400).json({ error: "pair field is required in request body" });
  }

  try {
    const { data } = await axios.get(
      `${PYTHON_BASE_URL}/sentiment`,
      { params: { pair: pair.trim(), page_size: page_size || 12 }, timeout: 180000 }
    );
    return res.json(data);
  } catch (err) {
    const detail = err.response?.data?.detail || err.message;
    const status = err.response?.status || 500;
    return res.status(status).json({ error: detail });
  }
};