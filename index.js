const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express()
const port = process.env.PORT || 3000;

// middleware
app.use(cors())
app.use(express.json())

//mongodb connections
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;

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

    const booksCollection = client.db("book-management-system").collection("books");

    app.post("/books", async (req, res) => {
      try {
        const result = await booksCollection.insertOne(req.body);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get("/books", async (req, res) => {
      const { page, limit, genre, minPrice, maxPrice, minYear, maxYear, author, sortBy, order, search } = req.query

      try {
        const currentPage = Math.max(1, parseInt(page) || 1);
        const perPage = parseInt(limit) || 10;
        const skip = (currentPage - 1) * perPage;
        const filter = {}

        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
          ]
        }


        if (genre) filter.genre = genre;

        if (author) filter.author = author;

        if (minYear || maxYear) {
          filter.publishedYear = {
            ...(minYear && { $gte: parseFloat(minYear) }),
            ...(maxYear && { $lte: parseFloat(maxYear) })
          }
        }

        if (minPrice || maxPrice) {
          filter.price = {
            ...(minPrice && { $gte: parseInt(minPrice) }),
            ...(maxPrice && { $lte: parseInt(maxPrice) })
          }
        }

        const sortOptions = { [sortBy || "title"]: order === "desc" ? -1 : 1 }

        const [books, totalBooks] = await Promise.all([
          booksCollection
            .find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(perPage)
            .toArray(),
          booksCollection.countDocuments(filter)])




        res.status(201).json(books);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);





app.get("/", (req, res) => {
  res.send("book-management-system-server")
})

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})


