const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const fs = require("fs");

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

// Verify JWT token middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, "passgroupj", (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.identity = decoded; // Attach decoded user data to the request
    next();
  });
}

// Middleware to verify admin role
function verifyAdmin(req, res, next) {
  if (req.identity.role !== "admin") {
    return res.status(403).send("Forbidden: Admins only.");
  }
  next();
}

// Connect to MongoDB and initialize server
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit process if connection fails
  }
}

// Routes
app.post("/initialize-admin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 8) {
    return res.status(400).send("Invalid username or password.");
  }

  try {
    const existingAdmin = await client.db("game").collection("admin").findOne({});
    if (existingAdmin) {
      return res.status(403).send("Admin already exists.");
    }

    const hashedPassword = bcrypt.hashSync(password, 15);
    const result = await client.db("game").collection("admin").insertOne({
      username,
      password: hashedPassword,
    });

    res.send({ message: "Admin initialized successfully", adminId: result.insertedId });
  } catch (error) {
    console.error("Error initializing admin:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password.");
  }

  try {
    const admin = await client.db("game").collection("admin").findOne({ username });
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).send("Invalid credentials.");
    }

    const token = jwt.sign({ _id: admin._id, username: admin.username, role: "admin" }, "passgroupj");
    res.send({ token, role: "admin" });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/admin/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await client.db("game").collection("user").find({}).toArray();
    res.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/user", async (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name || !email || password.length < 8) {
    return res.status(400).send("Invalid input.");
  }

  try {
    const existingUser = await client.db("game").collection("user").findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists.");
    }

    const hashedPassword = bcrypt.hashSync(password, 15);
    const result = await client.db("game").collection("user").insertOne({
      username,
      password: hashedPassword,
      name,
      email,
    });

    res.send({ message: "User registered successfully", userId: result.insertedId });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Missing username or password.");
  }

  try {
    const user = await client.db("game").collection("user").findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).send("Invalid credentials.");
    }

    const token = jwt.sign({ _id: user._id, username: user.username, role: "user" }, "passgroupj");
    res.send({ token, role: "user" });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});