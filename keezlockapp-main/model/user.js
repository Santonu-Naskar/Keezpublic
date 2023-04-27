const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  payment: {
    type: Boolean,
    required: true,
    default: false
  },
  admin: {
    required: true,
    type: String,
    default: 'false'
  }
  
 
});

var user = mongoose.model("user", userSchema);
module.exports = user;