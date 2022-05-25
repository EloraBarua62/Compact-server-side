const express = require("express");
const cors = require("cors");
require('dotenv').config();
const port = process.env.PORT || 4000;
const app = express();


// MiddleWare
app.use(cors());
app.use(express.json());


// Database
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ghbw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run()
{
    try{
        await client.connect();

        // Database collections
        const partsCollections = client.db('compact_db').collection('parts');
        const orderCollections = client.db('compact_db').collection('order');


        // GET API for getting all parts
        app.get('/parts' , async(req,res) => {
            const parts = await partsCollections.find().toArray();
            const new_parts = parts.reverse();
            res.send(new_parts);
        })

        // GET API for getting single part
        app.get('/parts/:id' , async(req,res) => {
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const part = await partsCollections.findOne(query);
            res.send(part);
        })

        // GET API for getting all parts
        app.get('/my_orders', async (req, res) => {
            const email = req.query.email;
            const query = {email:email}
            const my_orders = await orderCollections.find(query).toArray();
            res.send(my_orders);
        })


        // GET API for getting all parts
        app.get('/manage_orders', async (req, res) => {
            const parts = await orderCollections.find().toArray();
            res.send(parts);
        })


        // POST API for add parts
        app.post('/parts' , async(req,res) => {
            const parts = req.body;
            const result = await partsCollections.insertOne(parts);
            res.send(result);
        })


        // POST API for place order
        app.post('/order' , async(req,res) => {
            const order = req.body;
            const part = await orderCollections.insertOne(order);
            res.send(part);
        })

         // DELETE API for delete parts
        app.delete('/manage_products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const part = await partsCollections.deleteOne(query);
            res.send(part);
        })


         // DELETE API for delete order
        app.delete('/manage_order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollections.deleteOne(query);
            res.send(order);
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