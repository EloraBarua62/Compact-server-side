const express = require("express");
const cors = require("cors");
require('dotenv').config();
var jwt = require('jsonwebtoken');
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
        const userCollections = client.db('compact_db').collection('user');


        // GET API for getting all user
        app.get('/user' , async(req,res) => {
            const user = await userCollections.find().toArray();
            const result = user.reverse();
            res.send(result);            
        })


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

        // GET API for getting my_orders
        app.get('/my_orders', async (req, res) => {
            const email = req.query.email;
            const query = {email:email}
            const my_orders = await orderCollections.find(query).toArray();
            res.send(my_orders);



            // // JWT
            // const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            // res.send({ my_orders, token });
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



        // PUT API for user data entry
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            };
            const result = await userCollections.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });

        })


        // PUT API for rating,review
        app.put('/user_rating/:email' , async(req,res) => {
            const email = req.params.email;
            const filter = { email: email };
            const userRatingInfo = req.body;
            const options = { upsert: true }
            const updateDoc = {
                $set: userRatingInfo,
            }
            const result = await userCollections.updateOne(filter,updateDoc,options);
            res.send(result);
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