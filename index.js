const express =  require('express');
const cors =  require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.port || 5000;


app.use(express.json());

app.use(cors({
    origin:["http://localhost:5173","http://localhost:5174"]
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

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //colse
  }
}
run().catch(console.dir);
























