const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
 _id: {
    type: Number,
    required: true
 },
  imgLink: {
     type: String,
     required: true
  }
  
 
});

var img = mongoose.model("img", imageSchema);
module.exports = img;