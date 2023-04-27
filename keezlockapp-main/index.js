const express = require("express");
const { google } = require("googleapis");
const user = require('./model/user.js')
const blog = require('./model/blog.js')
const img = require('./model/daily.js')
const app = express();
const bcrypt = require("bcryptjs");
const PORT = process.env.PORT || 3000
var ObjectId = require('mongodb').ObjectID;
const mongoose = require('mongoose')
const jwt = require("jsonwebtoken");

const cookieParser = require("cookie-parser");
const e = require("express");
app.use(cookieParser());
app.use(express.json())

mongoose.connect("Mongodb url").then(()=>{
console.log("Connected with database")
}).catch((err)=>{
  console.log("Error in connection with database")
})

const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets", 
});
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    next();
  });
const spreadsheetId1 = sheet.id;
const spreadsheetId2 = sheet.id;
const spreadsheetId3 = sheet.id;
const spreadsheetId4 = sheet.id
const spreadsheetId5 = sheet.id
app.use(express.static(__dirname + "/public"))
app.set("view engine", "ejs");

app.use(express.json());

app.get("/", check, (req,res)=>{
    res.render("home")
})

app.get("/blog", (req,res)=>{
  res.render("blog")
})

app.get("/ncaa", checkVerfied,(req,res)=>{
  res.render("ncaa")
})

app.get("/tracker", checkVerfied, (req,res)=>{


  let admin = req.body.user['admin']
   if(admin=='true')
   {
    res.render("tracker", {admin: true})
   }
   else{
    res.render("tracker", {admin: false})
   }

})

app.post("/ncaa", checkVerfied, async (req,res)=>{
  let away = req.body.away
  let home = req.body.home
  let away_point_spread = req.body.away_point_spread
  let home_point_spread = req.body.home_point_spread
 

  const authClientObject = await auth.getClient();
  const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });  
  await googleSheetsInstance.spreadsheets.values.update({
      auth, 
      spreadsheetId: spreadsheetId5, 
      range: "Model!B21:C21", 
      valueInputOption: "USER_ENTERED", 
      resource: {
          values: [[away,home]],
      },
  });

  await googleSheetsInstance.spreadsheets.values.update({
    auth, 
    spreadsheetId: spreadsheetId5, 
    range: "Model!G16:I16", 
    valueInputOption: "USER_ENTERED", 
    resource: {
        values: [[away_point_spread,'', home_point_spread]],
    },
});


  const readDataA = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId: spreadsheetId5, 
      range: "Model!K23:K26", 
      majorDimension: "COLUMNS"
  })

  let a = readDataA.data.values[0]

 return res.json({code: 200, message: a})

})

app.post("/newBlog", checkAdmin, async (req,res)=>{
    
  let {head, body, imgLink} = req.body;
  let newBlog = new blog({head, body, imgLink, time: Date.now()})
  newBlog.save().then(()=>{
    return res.json({code: 200, message: 'Saved'})
  }).catch((err)=>{
    return res.json({code: 400, message: 'Some Error Occured'})
  })

})

app.get("/getBlogs", async (req,res)=>{
  let recentBlogs = await blog.find({}).sort({time: -1}).limit(5)
  res.json(recentBlogs)
})

async function checkAdmin(req,res, next)
{
  if (!req.cookies.jwt) {
    return res.json({code: 404, message: 'Not a admin'})
  } else {
  var token = req.cookies.jwt;
  try {
    let payload = jwt.verify(token, "admin");
    let tempUser = await user.findById({ _id: payload.id });
    if(tempUser['admin']=='true')
    {
      next();

    }
    else{
      return res.json({code: 404, message: 'Not an admin'})
    }
    
     
    }
   catch (error) {
    res.render("someerroroccured");
  }
}


}


async function check(req, res, next) {
    if (!req.cookies.jwt) {
        next();
    } else {
      var token = req.cookies.jwt;
      //console.log(token)
      //console.log(token)
      try {
        let payload = jwt.verify(token, "admin");
        let tempUser = await user.findById({ _id: payload.id });
          req.body["user"] = tempUser;
          if(tempUser)
          {  
            //remove buy option__________________________________________________________
            // res.redirect("/buy")}
          // else
          // {
            res.redirect("/console")
          }
         
        }
       catch (error) {
        res.render("someerroroccured");
      }
    }
  }
app.get("/console", checkVerfied, (req, res)=>{
   
   let admin = req.body.user['admin']
   if(admin=='true')
   {
    res.render("index", {admin: true})
   }
   else{
    res.render("index", {admin: false})
   }
  
   
})
app.get("/prediction", checkVerfied, (req,res)=>{
    res.render("prediction")
})


app.get("/nfl", checkVerfied, (req,res)=>{
    res.render("nfl")
})

app.get("/daily", checkVerfied, async (req,res)=>{
  let tempImg = await img.find({})
  res.render("daily.ejs", {tempImg})
})
app.post("/login",async (req,res)=>{
    let { email, password } = req.body;

  if (!email || !password) {
    res.json({ code: 404, message: "Please enter both email and password" });
  } else {
    let tempUser = await user.find({ email });
    if (tempUser.length == 0) {
      res.json({ code: 404, message: "User not found" });
    } else {
      try {
        let temp = await bcrypt.compare(password, tempUser[0].password);
        if (temp) {
          let payload = { id: tempUser[0]._id };
          let token = jwt.sign(payload, "admin");
          res.cookie("jwt", token);
          res.json({ code: 200, message: "Login Successful" });
        } else {
          res.json({ code: 404, message: "Incorrect Password" });
        }
      } catch (error) {
        res.json({ code: 404, message: "Incorrect Password" });
      }
    }
  }
})
app.post("/predict", checkVerfied, async (req,res)=>{

    let lineup1 = req.body.lineup1.split("\n");
    let lineup2 = req.body.lineup2.split("\n");
    let home_pitcher = req.body.home_pitcher.toLowerCase();
    let away_pitcher = req.body.away_pitcher.toLowerCase();
    let home_pitcher_player = req.body.home_pitcher_player
    let away_pitcher_player = req.body.away_pitcher_player

    
   
    if(!checklineup(lineup1) || !checklineup(lineup2))
    {
           return res.json({code: 404, message: "Incorrect format of lineup"})
    }
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });  
    let finalLineUp1 = []
    let finalLineUp2 = []
   for(let i=0; i<lineup1.length; i++)
   {
       let temp = []
       temp.push(lineup1[i])
       finalLineUp1.push(temp)
   }
   for(let i=0; i<lineup2.length; i++)
   {
       let temp = []
       temp.push(lineup2[i])
       finalLineUp2.push(temp)
   }
    await googleSheetsInstance.spreadsheets.values.update({
        auth, 
        spreadsheetId: spreadsheetId1, 
        range: "Model!C21:C29", 
        valueInputOption: "USER_ENTERED", 
        resource: {
            values: finalLineUp1,
        },
    });

    await googleSheetsInstance.spreadsheets.values.update({
        auth, 
        spreadsheetId: spreadsheetId1, 
        range: "Model!C31:C39", 
        valueInputOption: "USER_ENTERED", 
        resource: {
            values: finalLineUp2,
        },
    });
      
    if(away_pitcher==='left')
    {
        await googleSheetsInstance.spreadsheets.values.update({
            auth, 
            spreadsheetId: spreadsheetId1, 
            range: "Model!C12:C12", 
            valueInputOption: "USER_ENTERED", 
            resource: {
                values: [["Left"]]
            },
        });

    }
    else
    {
        await googleSheetsInstance.spreadsheets.values.update({
            auth, 
            spreadsheetId: spreadsheetId1, 
            range: "Model!C12:C12", 
            valueInputOption: "USER_ENTERED", 
            resource: {
                values: [["Right"]]
            },
        });

    }

    if(home_pitcher==='left')
    {  
        await googleSheetsInstance.spreadsheets.values.update({
            auth, 
            spreadsheetId: spreadsheetId1, 
            range: "Model!I12:I12", 
            valueInputOption: "USER_ENTERED", 
            resource: {
                values: [["Left"]]
            },
        });

    }
    else
    { 
        await googleSheetsInstance.spreadsheets.values.update({
            auth, 
            spreadsheetId: spreadsheetId1, 
            range: "Model!I12:I12", 
            valueInputOption: "USER_ENTERED", 
            resource: {
                values: [["Right"]]
            },
        });

    }


    await googleSheetsInstance.spreadsheets.values.update({
      auth, 
      spreadsheetId: spreadsheetId1, 
      range: "Model!A12:A12", 
      valueInputOption: "USER_ENTERED", 
      resource: {
          values: [[away_pitcher_player]]
      },
  });

  await googleSheetsInstance.spreadsheets.values.update({
    auth, 
    spreadsheetId: spreadsheetId1, 
    range: "Model!G12:G12", 
    valueInputOption: "USER_ENTERED", 
    resource: {
        values: [[home_pitcher_player]]
    },
});
const readDataA = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId: spreadsheetId1, 
    range: "Model!F2:F2", 
})
const readDataB = await googleSheetsInstance.spreadsheets.values.get({
    auth, //auth object
    spreadsheetId: spreadsheetId1, 
    range: "Model!L2:L2", 
})
     let a = readDataA.data.values[0][0]
     let b = readDataB.data.values[0][0]
     let message = JSON.stringify({a, b})
    res.json({code: 200, message})
})

app.post("/mlb", checkVerfied, async (req,res)=>{
    let away = req.body.away
    let home = req.body.home
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });  
    await googleSheetsInstance.spreadsheets.values.update({
        auth, 
        spreadsheetId: spreadsheetId2, 
        range: "Model!P12:P13", 
        valueInputOption: "USER_ENTERED", 
        resource: {
            values: [[away], [home]],
        },
    });

    const readDataA = await googleSheetsInstance.spreadsheets.values.get({
        auth, //auth object
        spreadsheetId: spreadsheetId2, 
        range: "Model!P15:P20", 
    })

    let a = readDataA.data.values
    let message = JSON.stringify({a})
   return res.json({code: 200, message})

})

app.get("/admin", checkAdmin, (req,res)=>{
  res.render("addBlog.ejs")
})

app.get("/getBlog/:id", async (req,res)=>{
       const id = req.params.id
       let fblog = await blog.find({_id: id})
       res.render("blogshow.ejs", {head: fblog[0].head, body: fblog[0].body, imgLink: fblog[0].imgLink})
})

app.get("/mlb", checkVerfied,(req,res)=>{
    res.render("mlb")
})

app.get("/test", async (req,res)=>{
  res.send("test")

})

// app.post("/sucesspayment", (req,res)=>{
//   res.json(req.body)
// })
app.post("/nfl", checkVerfied, async (req,res)=>{
    let away = req.body.away
    let home = req.body.home
    let away_point_spread = req.body.away_point_spread
    let away_over_under = req.body.away_over_under
    let away_projected_score = req.body.away_projected_score
    let home_point_spread = req.body.home_point_spread
    let home_over_under = req.body.home_over_under
    let home_projected_score = req.body.home_projected_score
    const authClientObject = await auth.getClient();
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });  
    await googleSheetsInstance.spreadsheets.values.update({
        auth, 
        spreadsheetId: spreadsheetId3, 
        range: "Model!B2:B4", 
        valueInputOption: "USER_ENTERED", 
        resource: {
            values: [[away], [''], [home]],
        },
    });
  
    await googleSheetsInstance.spreadsheets.values.update({
      auth, 
      spreadsheetId: spreadsheetId3, 
      range: "Model!E2:G2", 
      valueInputOption: "USER_ENTERED", 
      resource: {
          values: [[away_point_spread, away_over_under, away_projected_score]],
      },
  });
  await googleSheetsInstance.spreadsheets.values.update({
    auth, 
    spreadsheetId: spreadsheetId3, 
    range: "Model!E4:G4", 
    valueInputOption: "USER_ENTERED", 
    resource: {
        values: [[home_point_spread, home_over_under, home_projected_score]],
    },
});

    const readDataA = await googleSheetsInstance.spreadsheets.values.get({
        auth, //auth object
        spreadsheetId: spreadsheetId3, 
        range: "Model!C2:O2", 
    })
    
    const readDataB = await googleSheetsInstance.spreadsheets.values.get({
        auth, //auth object
        spreadsheetId: spreadsheetId3, 
        range: "Model!C4:O4", 
    })

    let a = readDataA.data.values
    let b = readDataB.data.values

    let message = JSON.stringify({a, b})
   return res.json({code: 200, message})





})

app.post("/nba", checkVerfied, async (req,res)=>{
  let away = req.body.away
  let home = req.body.home
  let away_point_spread = req.body.away_point_spread
  let away_over_under = req.body.away_over_under
  let away_projected_score = req.body.away_projected_score
  let home_point_spread = req.body.home_point_spread
  let home_over_under = req.body.home_over_under
  let home_projected_score = req.body.home_projected_score
  const authClientObject = await auth.getClient();
  const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });  
  await googleSheetsInstance.spreadsheets.values.update({
      auth, 
      spreadsheetId: spreadsheetId4, 
      range: "Model!B6:B8", 
      valueInputOption: "USER_ENTERED", 
      resource: {
          values: [[away], [''], [home]],
      },
  });

  await googleSheetsInstance.spreadsheets.values.update({
    auth, 
    spreadsheetId: spreadsheetId4, 
    range: "Model!E6:G6", 
    valueInputOption: "USER_ENTERED", 
    resource: {
        values: [[away_point_spread, away_over_under, away_projected_score]],
    },
});
await googleSheetsInstance.spreadsheets.values.update({
  auth, 
  spreadsheetId: spreadsheetId4, 
  range: "Model!E8:G8", 
  valueInputOption: "USER_ENTERED", 
  resource: {
      values: [[home_point_spread, home_over_under, home_projected_score]],
  },
});

  const readDataA = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId: spreadsheetId4, 
      range: "Model!C6:O6", 
  })
  
  const readDataB = await googleSheetsInstance.spreadsheets.values.get({
      auth, //auth object
      spreadsheetId: spreadsheetId4, 
      range: "Model!C8:O8", 
  })

  let a = readDataA.data.values
  let b = readDataB.data.values

  let message = JSON.stringify({a, b})
 return res.json({code: 200, message})





})


function checklineup(lineup)
{
      if(lineup.length != 9)
      {
        return false;
      }
      for(let i=0; i<lineup.length; i++)
      {  
          if(!lineup[i].includes((i+1).toString() + " - "))
          return false;
        
      }

      return true;
}



async function checkVerfied(req, res, next) {
    if (!req.cookies.jwt) {
      res.redirect("/");
    } else {
      var token = req.cookies.jwt;
      //console.log(token)
      //console.log(token)
      try {
        let payload = jwt.verify(token, "admin");
        let tempUser = await user.findById({ _id: payload.id });
        req.body["user"] = tempUser
        // let query = 'status:\'active\' AND metadata[\'email\']:\'' +tempUser.email + '\''
      //   const subscription = await stripe.subscriptions.search({
      //    query
      //  });

      //remove payment option_______________________________________
      next();
        // if(subscription.data.length>=1)
        // {
        //         next();
        // }
        // else{
        //   res.redirect("/buy")
        // }
        
        }
        //console.log(tempUser)
       catch (error) {
        res.render("home");
      }
    }
  }



app.post("/signup", async (req,res)=>{
    let {fname, lname, email, password} = req.body

    if(!lname || !lname || !email || !password)
    {
        return res.json({code: 404, message: "Please enter all the fields"})
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    email = email.toLowerCase()
    let newUser = new user({fname, lname, email, password: hashedPassword})
    newUser.save().then(()=>{
       return res.json({code: 200, message: "Account created successfully, please login !!! "})
    }).catch((err)=>{
        if (err.code == 11000)
        res.json({
          code: 404,
          message: "User already registed with the given email ID",
        });
      else {
        console.log(err);
        res.json({
          code: 404,
          message: "Some Error Occured, Please try after some time",
        });
      }
    })
})
app.get("/logout",(req,res)=>{
    res.clearCookie("jwt")
    res.render("home.ejs")
})

app.get("/nba", checkVerfied, (req,res)=>{
  res.render("nba.ejs")
})
app.get("/contact", (req,res)=>{
    res.render("contact")
})



app.listen(PORT, (err)=>{
if(err)
console.log(err)
else
console.log("Server is Listening on port: " + PORT)
})
