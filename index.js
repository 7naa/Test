const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const credentials = "X509-cert-8586207455012682246.pem";

const client = new MongoClient(
  "mongodb+srv://test.4ji6o.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Test",
  {
    tlsCertificateKeyFile: credentials,
    serverApi: ServerApiVersion.v1,
  }
);

// Middleware to parse JSON in the request body
app.use(express.json());

app.get('/',(req,res) => {
  res.send('hello')
});

//Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Connect to MongoDB and initialize server
async function run() {
  try {
    await client.connect();
    const database = client.db("testDB");
    const collection = database.collection("testCol");
    const docCount = await collection.countDocuments({});
    console.log(docCount);
    // perform actions using client
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);