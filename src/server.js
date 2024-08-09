const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const User = require("./Model/usermodel");

const app = express();
const PORT = 5000;

app.use(bodyParser.json());

mongoose
  .connect(
    "mongodb+srv://dassaptarshi13:su0LaRT4uA6a3VHb@cluster0.tbclapx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch((err) => {
    console.error("Connection error", err);
  });

// Create a new user
app.post("/api/users", async (req, res) => {
  const { username, email, password, mobile } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email, and password are required" });
  }

  try {
    const emailExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });
    const mobileExists = await User.findOne({ mobile });

    if (emailExists || usernameExists || mobileExists) {
      return res
        .status(409)
        .json({ error: "username/email/mobile already exists" });
    }

    const newUser = new User({
      id: uuidv4(),
      username,
      email,
      password,
      mobile,
      created_at: new Date(),
      modified_at: new Date(),
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users with sorting and pagination
app.get("/api/users", async (req, res) => {
  const {
    page = 1,
    pagesize = 10,
    sortby = "created_at",
    sortorder = "desc",
    createdAfter,
    createdBefore,
    modifiedAfter,
    modifiedBefore,
  } = req.query;

  try {
    let query = {};

    if (createdAfter) {
      query.created_at = { $gt: new Date(createdAfter) };
    }

    if (createdBefore) {
      query.created_at = { ...query.created_at, $lt: new Date(createdBefore) };
    }

    if (modifiedAfter) {
      query.modified_at = { $gt: new Date(modifiedAfter) };
    }

    if (modifiedBefore) {
      query.modified_at = {
        ...query.modified_at,
        $lt: new Date(modifiedBefore),
      };
    }

    const users = await User.find(query)
      .sort({ [sortby]: sortorder === "asc" ? 1 : -1 })
      .skip((page - 1) * pagesize)
      .limit(Number(pagesize));

    const total_count = await User.countDocuments(query);
    const total_pages = Math.ceil(total_count / pagesize);

    res.status(200).json({
      total_count,
      total_pages,
      current_page: Number(page),
      users,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
