const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  
    head: {
        type: String,
        required: true
    },
    body: {
        type: String, 
        required: true
    },
    imgLink: {
        type: String,
        required: true
    },
    
    time: {
        type: String,
        required: true
    }
 
});

var blog = mongoose.model("blog", blogSchema);
module.exports = blog;