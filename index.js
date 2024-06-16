const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.port || 5000;


app.use(express.json());

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"]
}))


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




    app.put('/allParcel/:id', async (req, res) => {
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




    app.post('/allParcel', async (req, res) => {
      const newParcel = req.body;
      console.log(newParcel);
      const result = await parcelCollection.insertOne(newParcel);
      res.send(result)
    })


    app.post('/feedback', async (req, res) => {
      const newFeedback = req.body;
      console.log(newFeedback);
      const result = await feedbackCollection.insertOne(newFeedback);
      res.send(result)
    })

    app.get('/feedback/:id', async (req, res) => {
      const id = req.params.id;
      const query = {deliveryManId: id}
      const result = await feedbackCollection.find(query).toArray();
      res.send(result)
    })


    app.get('/allParcel', async (req, res) => {
      const result = await parcelCollection.find().toArray();
      res.send(result)
    })


    app.get('/update/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await parcelCollection.findOne(query);
      res.send(result);
    })






    app.get('/totalDelivered', async (req, res) => {
      const query = { status: "delivered" }
      const result = await parcelCollection.find(query).toArray();
      res.send(result)
    })





    app.get('/allParcel/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await parcelCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/deliveryList/:id', async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManId: id }
      const result = await parcelCollection.find(query).toArray();
      res.send(result)
    })


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



    // app.put('/update/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }
    //   const options = { upsert: true };
    //   const updateParcel= req.body;
    //   const parcel = {
    //     $set: {
    //       name: updateParcel.name,
    //       email:updateParcel.email,
    //       phone:updateParcel.phone,
    //       receiverName:updateParcel.receiverName,
    //       receiversNumber:updateParcel.receiversNumber,
    //       requestedDeliveryDate:updateParcel.requestedDeliveryDate,
    //       place:updateParcel.place,
    //       latitude:updateParcel.latitude,
    //       longitude:updateParcel.longitude,
    //       type:updateParcel.type,
    //       weight:updateParcel.weight,
    //       bookingDate:updateParcel.bookingDate,
    //       price:updateParcel.price,
    //       status:updateParcel.status
    //     }
    //   }

    //   const result = await parcelCollection.updateOne(filter, parcel, options);
    //   res.send(result);
    // })











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