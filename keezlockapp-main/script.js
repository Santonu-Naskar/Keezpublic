const fs = require('fs')


fs.readFile("team.txt", (err, data)=>{
     if(err)
     console.log(err)
     else {
     data = data.toString()
      let arr = data.split("\n")
       let res = ""
      for(let i=0; i<arr.length; i++)
      {
          let str =  `<option value="${i+1}">${arr[i]}</option>`
          res += str + "\n"
          
      }

      fs.writeFile("res.txt", res, (err)=>{
        if(err)
        console.log(err)
        else
        console.log("Data")
      })

     }
})