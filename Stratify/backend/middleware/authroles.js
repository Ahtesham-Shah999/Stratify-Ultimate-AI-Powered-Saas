exports.validateRole = (req, res, next) => {
    const { role } = req.params;
    if (role !== 'TRADER' && role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    next();
  };