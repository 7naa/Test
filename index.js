const express = require('express')
const app = express()
const port = process.env.PORT||3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://liyana:1234@test.4ji6o.mongodb.net/?retryWrites=true&w=majority&appName=Test";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

//Middleware to parse JSON in request body
app.use(express.json())

//Function to verify JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeaader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, "passgroupj", (err, decode) => {
        if (err) return res.sendStatus(403);

        req.identity = decode; //attach decoded user to the request
    });
}

//Middleware to verify admin role
function verifyAdmin(req, res, next) {
    if (req.identity.role !== 'admin') {
        return res.status(403).send('Forbidden: Admins only.');
    }
    next();
}

//Initialize the first admin (one-time use)
app.post('/initialize-admin', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Missing admin username and password"); 
    }

    if (password.length < 8) {
        return res.status(400).send("Password must be at least 8 characters long");
    }

    try {
        // Check if any admin already exists
        const existingAdmin = await client.db("game").collection("admin").findOne({});
        if (existingAdmin) {
            return res.status(403).send("An admin already exists. Initialization is not allowed.");
    }

    // Hash the password
    const hash = bcrypt.hashSync(password, 15);

    // Insert the new admin
    const result = await client.db("game").collection("admin").insertOne({
      username,
      password: hash
    });

    res.send({ message: "Admin initialized successfully", adminId: result.insertedId });
  } catch (error) {
    console.error("Error during admin initialization:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin registration
app.post('/admin/register', verifyToken, verifyAdmin, async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).send("Missing admin username or password");
    }
  
    if (password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters long.");
    }
  
    try {
      const existingAdmin = await client.db("game").collection("admin").findOne({ username });
      if (existingAdmin) {
        return res.status(400).send("Admin username already exists.");
      }
  
      const hash = bcrypt.hashSync(password, 15);
  
      const result = await client.db("admin").collection("data").insertOne({
        username,
        password: hash
      });
  
      res.send({ message: "Admin registered successfully", adminId: result.insertedId });
    } catch (error) {
      console.error("Error during admin registration:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Admin login
app.post('/admin/login',async(req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).send("Missing admin username or password");
    }
  
    try {
      const admin = await client.db("game").collection("admin").findOne({ username });
  
      if (!admin) {
        return res.status(401).send("-");
      }
  
      const isPasswordValid = bcrypt.compareSync(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).send("Wrong password! Try again");
      }
  
      const token = jwt.sign(
        { _id: admin._id, username: admin.username, role: "admin" },
        'passgroupj'
      );
  
      res.send({ _id: admin._id, token, role: "admin" });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).send("Internal Server Error");
    }
  });

app.get('/hai',(req, res) => {
    res.send('Hello World')
})

app.listen(port, () => {
    console.log('Example app listening on port ${port}')
})