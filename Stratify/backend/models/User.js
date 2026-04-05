const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique:true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['TRADER', 'ADMIN'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  profile_pic: {
    type: String,
    default: "" // URL or path to image in backend
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;