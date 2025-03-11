const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.port || 5000;
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const jwt = require('jsonwebtoken')

app.use(express.json());

app.use(cors({
  origin: ["*"]
}))




// update mongo user and password 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z7hla77.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const usersCollection = client.db("ParcelPioneer").collection('users');
    const parcelCollection = client.db("ParcelPioneer").collection('allParcel');
    const feedbackCollection = client.db("ParcelPioneer").collection('feedback');


    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }



    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }


    // get all parcel
    app.get('/allParcel', verifyToken, async (req, res) => {
      // const { from, to } = req.query;
      // const query = {
      //   requestedDeliveryDate: {
      //     $gte: new Date(from),
      //     $lte: new Date(to)
      //   }
      // };
      const result = await parcelCollection.find().toArray();
      res.send(result)
    })


    //post user collection in database
    app.post('/users', async (req, res) => {
      const user = req.body;

      const query = { email: user.email }
      const isExistingUser = await usersCollection.findOne(query);

      if (isExistingUser) {
        return res.send({
          message: 'user already exists', insertedId: null
        })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


    app.get('/totalAdmin', async (req, res) => {
      const query = { role: 'admin' }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })
    // get data of a  delivery man 
    app.get('/deliveryMan', async (req, res) => {
      const query = { role: 'deliveryMan' }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/regularUser', async (req, res) => {
      const query = { role: 'regularUser' }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })





    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await usersCollection.findOne(query);
      res.send(result)
    })



    //User related api
    // update user info in database
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email }
      const options = { upsert: true };
      const updateUser = req.body;
      const User = {
        $set: {
          photo: updateUser.photo,
          name: updateUser.displayName,
          phone: updateUser.phoneNumber
        }
      }
      const result = await usersCollection.updateOne(filter, User, options);
      res.send(result);
    })




    app.put('/allParcel/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateBooking = req.body;
      const Booking = {
        $set: {
          approximateDaliveryDate: updateBooking.deliveryDate,
          deliveryManId: updateBooking.deliveryManId,
          status: updateBooking.status
        }
      }
      const result = await parcelCollection.updateOne(filter, Booking, options);
      res.send(result);
    })



    //add parcel from customer
    app.post('/allParcel', async (req, res) => {
      const newParcel = req.body;
      console.log(newParcel);
      const result = await parcelCollection.insertOne(newParcel);
      res.send(result)
    })

    //add feedback from customer
    app.post('/feedback', async (req, res) => {
      const newFeedback = req.body;
      console.log(newFeedback);
      const result = await feedbackCollection.insertOne(newFeedback);
      res.send(result)
    })
    //get feedback of a specific deliver man
    app.get('/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManId: id }
      const result = await feedbackCollection.find(query).toArray();
      res.send(result)
    })



    // get all feedback data from db
    app.get('/feedback', async (req, res) => {
      const result = await feedbackCollection.find().toArray();
      res.send(result)
    })


    //find data for update a item
    app.get('/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelCollection.findOne(query);
      res.send(result);
    })


    //get payment by specific parcel id
    app.get('/payment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await parcelCollection.findOne(query);
      res.send(result);
    })





    // get total delivery
    app.get('/totalDelivered', async (req, res) => {
      const query = { status: "delivered" }
      const result = await parcelCollection.find(query).toArray();
      res.send(result)
    })




    //get all parcel for a specific customer
    app.get('/allParcel/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const search = req.query.search;
      const query = {
        email: email,
        status: { $regex: search, $options: 'i' }
      }
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    })

    //get delivery list for a specific delivery man
    app.get('/deliveryList/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManId: id }
      const result = await parcelCollection.find(query).toArray();
      res.send(result)
    })


    //Make admin 
    app.patch('/makeAdmin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }

      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    })



    //Parcel returned by the delivery man
    app.patch('/bookingReturned/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'returned'
        }
      }

      const result = await parcelCollection.updateOne(query, updateDoc);
      res.send(result);
    })



    // Parcel delivered by the delivery man

    app.patch('/delivered/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'delivered'
        }
      }
      const result = await parcelCollection.updateOne(query, updateDoc);
      res.send(result);
    })




    // Parcel canceled by the user
    app.patch('/canceled/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'canceled'
        }
      }

      const result = await parcelCollection.updateOne(query, updateDoc);
      res.send(result);
    })



    // Update number of parcel of all deluvery man
    app.patch('/totalDeliveredNumber/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $inc: {
          numberOfParcelDelivered: 1
        }
      }

      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    })



    // Find deliveryman avg rating

    app.patch('/calculateAvgRating/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const aggregationResult = await feedbackCollection.aggregate([
        {
          $match: { deliveryManId: id }
        },
        {
          $group: {
            _id: "$deliveryManId",
            averageRating: { $avg: "$rating" },
          }
        }
      ]).toArray();


      if (aggregationResult.length > 0) {
        const averageRating = aggregationResult[0].averageRating;

        const updateDoc = {
          $set: {
            averageRating: averageRating
          }
        };

        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      } else {
        res.status(404).send('No feedback found for the given delivery man ID');
      }

    });



    //Find top delivery man
    app.get('/topDeliveryMan', async (req, res) => {
      const topDeliveryMan = await usersCollection.aggregate([
        {
          $match: {
            role: 'deliveryMan'
          }
        },
        {
          $sort: {
            numberOfParcelDelivered: -1,
            averageRating: -1
          }
        },
        {
          $limit: 3
        }
      ]).toArray();
      // const result =  usersCollection.find(topDeliveryMan).toArray();
      res.send(topDeliveryMan);
    })








    // Make delivery man
    app.patch('/makeDeliveryMan/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'deliveryMan'
        }
      }

      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    })


    //Update parcel
    app.put('/update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateParcel = req.body;
      const parcel = {
        $set: {
          name: updateParcel.name,
          email: updateParcel.email,
          phone: updateParcel.phone,
          receiverName: updateParcel.receiverName,
          receiversNumber: updateParcel.receiversNumber,
          requestedDeliveryDate: updateParcel.requestedDeliveryDate,
          place: updateParcel.place,
          latitude: updateParcel.latitude,
          longitude: updateParcel.longitude,
          type: updateParcel.type,
          weight: updateParcel.weight,
          bookingDate: updateParcel.bookingDate,
          price: updateParcel.price,
          status: updateParcel.status
        }
      }

      const result = await parcelCollection.updateOne(filter, parcel, options);
      res.send(result);
    })


    // update data when customer give the money
    app.patch('/paymentDone/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: 'Done'
        }
      }
      const result = await parcelCollection.updateOne(query, updateDoc);
      res.send(result)
    })



    //payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });










    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //colse
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from ParcelPioneer');
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})