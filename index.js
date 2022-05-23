const express = require("express");
const cors = require("cors");
require('dotenv').config();
const port = process.env.PORT || 4000;
const app = express();


// MiddleWare
app.use(cors());
app.use(express.json());

// Root API
app.get('/', (req,res) => {
    res.send('COMPACT server is running');
})

// Port listen
app.listen(port , ()=>{
    console.log('COPMPACT is running on port',port);
})