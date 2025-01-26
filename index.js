const express = require('express')
const app = express()
const port = process.env.PORT||5000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

const credentials = 'X509-cert-8586207455012682246.pem'
//Middleware to parse JSON in request body
app.use(express.json());

const client = new MongoClient('mongodb+srv://test.4ji6o.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Test', {
  tlsCertificateKeyFile: credentials,
  serverApi: ServerApiVersion.v1
});

app.get('/hai',(req, res) => {
  res.send('Hello World')
})

app.listen(port, () => {
console.log(`Example app listening on port ${port}`);
});

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