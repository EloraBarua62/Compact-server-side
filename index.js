const express = require("express");
const cors = require("cors");
require('dotenv').config();
const port = process.env.PORT || 4000;
const app = express();


// MiddleWare
app.use(cors());
app.use(express.json());


// Database
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ghbw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run()
{
    try{
        await client.connect();

        // Database collections
        const partsCollections = client.db('compact_db').collection('parts');


        // GET API for getting all parts
        app.get('/parts' , async(req,res) => {
            const parts = await partsCollections.find().toArray();
            res.send({'All parts':parts});
        })

    }
    finally{

    }

}

run().catch(console.dir);



// Root API
app.get('/', (req,res) => {
    res.send('COMPACT server is running');
})

// Port listen
app.listen(port , ()=>{
    console.log('COPMPACT is running on port',port);
})