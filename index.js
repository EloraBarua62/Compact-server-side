const express = require("express");
const cors = require("cors");
require('dotenv').config();
var jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 4000;
const app = express();


// MiddleWare
app.use(cors());
app.use(express.json());


// JWT function
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbiden access' });
        }
        req.decoded = decoded;
        next();
    });
}


// Database
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const { default: Stripe } = require("stripe");
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
        const ratingsCollections = client.db('compact_db').collection('ratings');
        const paymentsCollections = client.db('compact_db').collection('payments');





        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollections.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbiden' });
            }
        }

        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body;
            console.log(service);
            const price = service.price;
            const amount = price * 100;
            console.log(amount)

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({ clientSecret: paymentIntent.client_secret })
        });



        app.patch('/my_order/:id' ,verifyJWT, async(req,res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const updateMyOrder = await orderCollections.updateOne(filter,updateDoc);
            const result = await paymentsCollections.insertOne(payment);
            res.send(updateDoc);
        })


        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollections.findOne({ email: email });
            const isAdmin = user?.role === 'admin';
            res.send({ admin: isAdmin });
        })


        // GET API for getting all user
        app.get('/user' ,verifyJWT, async(req,res) => {
            const user = await userCollections.find().toArray();
            const result = user.reverse();
            res.send(result);            
        })


        // GET API for getting all user
        app.get('/ratings' , async(req,res) => {
            const ratings = await ratingsCollections.find().toArray();
            const result = ratings.reverse();
            console.log(result);
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
        app.get('/my_orders',verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email == decodedEmail){
                const query = { email: email }
                const my_orders = await orderCollections.find(query).toArray();
                res.send(my_orders);
            }
            else {
                return res.status(403).send({ message: 'forbiden' })
            } 
        })


        // GET API for getting user's single order
        app.get('/my_order/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await orderCollections.findOne(query);
            res.send(order);
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


        // POST API for rating,review
        app.post('/user_rating' , async(req,res) => {
            const ratings = req.body;
            const rusult = await ratingsCollections.insertOne(ratings);
            res.send(rusult);
        })

      


        app.put('/user/admin/:email', verifyJWT,verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollections.updateOne(filter, updateDoc);
            res.send(result);
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
        app.put('/user_info/:email' , async(req,res) => {
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
        app.delete('/manage_products/:id',verifyJWT,verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const part = await partsCollections.deleteOne(query);
            res.send(part);
        })


         // DELETE API for delete order
        app.delete('/manage_order/:id',verifyJWT, async (req, res) => {
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