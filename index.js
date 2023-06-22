const express = require('express')
require('dotenv').config()
const cors = require('cors')
const stripe = require('stripe')(process.env.DB_PAYMENT_GATEWAY_SECRET_KEY)
const app = express()
app.use(cors())
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 5000;
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const verifyJwt = (req,res,nex)=>{
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:"UnAthorized Access"})
  }
  const token = authorization.splite(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    
  })


}




const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.d1kr80i.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const users = client.db("perfect-database").collection("users");
    const classes = client.db("perfect-database").collection("classes");
    const cart = client.db("perfect-database").collection("cart");
    const review = client.db("BIstroBossDatabase").collection("review");

    //-----------------------------All get Methods--------------------------------------
    // get all user data
    app.get('/users', async (req, res) => {
      const result = await users.find().toArray()
      res.send(result)

    })
    // get all classes data
    app.get('/classes', async (req, res) => {
      const result = await classes.find().toArray()
      res.send(result)

    })
    // get all cart data
    app.get('/cart', async (req, res) => {
      const result = await cart.find().toArray()
      res.send(result)
    })
    // get courses data by user
    app.get('/classes/mycourses/email', async (req, res) => {
      const email = req.query.email;
      console.log(email)
      const result = await classes.find({ email: email }).toArray()
      if (result) {
        console.log(result);
        res.send(result);
      }
      else if (result.length <= 0) {
        res.send([])
      }
      else {
        res.status(404).send('User not found');
      }
    })
    // get user data by current user email
    app.get('/users/email', async (req, res) => {
      const email = req.query.email;
      const result = await users.findOne({ email: email });
      if (result) {
        console.log(result);
        res.send(result);
      } else {
        res.status(404).send('User not found');
      }
    });
    // get cart data by user
    app.get('/cart/email', async (req, res) => {
      const email = req.query.email;
      // console.log(email)
      const result = await cart.find({ addedby: email }).toArray();
      // console.log(result)-
      if (result.length > 0) {
        // console.log(result);
        res.send(result);
      } else {
        res.status(404).send('User not found');
      }
    });
    app.get('/review', async (req, res) => {
      const result = await review.find().toArray()
      res.send(result)
    })






    // ------------------------------All POST methods-----------------------------------------
    // Add A User
    app.post('/users', async (req, res) => {
      const isUser = await users.findOne({ email: req.body.email });
      if (isUser) {
        return res.send({ message: 'User already exists' });
      }
      const user = req.body;
      const result = await users.insertOne(user);
      console.log(result);
      res.send(result);
    });
    // post a cart data by current user
    app.post('/cart', async (req, res) => {
      Cart = req.body;
      const result = await cart.insertOne(Cart);
      console.log(result);
      res.send(result);
    });
    // inserting a course
    app.post('/classes', async (req, res) => {
      const isExitst = await users.findOne({ title: req.body.title });
      if (isExitst === req.body.title) {
        return res.send({ message: 'this title is already exists' });
      }
      const course = req.body;
      const result = await classes.insertOne(course);
      console.log(result, isExitst);
      res.send(result);
    });
    app.post('/create-payment-intent', async (req, res) => {
      const price = req.body;
      console.log('hitting me:', price)
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      });
    });
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      })
      res.send({ token })
    })





    //------------------------------updating api---------------------------------
    //TODO make everything secure soon...
    // updating user role by an admin
    app.patch('/users/roles/update/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      console.log(role, id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedUser = {
        $set: {
          role: role,
        },
      };
      const update = await users.updateOne(filter, updatedUser, options);
      res.send(update);
    });
    // updating a course status by admin
    app.patch('/classes/status/update/:id', async (req, res) => {
      const id = req.params.id;
      const { status, feedback } = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedClass = {
        $set: {
          status,
          feedback,
        },
      };
      const update = await classes.updateOne(filter, updatedClass, options);
      console.log(update);
      res.send(update);
    });





    // ----------------------------Delete Api---------------------------------------
    //delete a class
    app.delete('/classes/delete/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await classes.deleteOne(query);
      res.send(result)
    })
    // delete a cart
    app.delete('/cart/:id', async (req, res) => {
      const cartId = req.params.id;
      console.log(cartId)
      const query = { _id: new ObjectId(cartId) }
      const result = await cart.deleteOne(query);
      res.send(result)
    });












    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('server started now')
})
app.listen(port, () => {
  console.log('')
})
