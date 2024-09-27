const { ApolloServer, gql } = require('apollo-server');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

const connectToDatabase = async () => {
  try {
    await client.connect();
    db = client.db("database");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const typeDefs = gql`
  type Netflix {
    id: ID
    title: String
    description: String
    genres: [String]
    imdb_score: Float
    runtime: Int
    release_year: Int
    production_countries: [String]
    age_certification: String
    type: String
  }

  type Query {
    getAllMovies: [Netflix]
    getMovieByTitle(title: String!): Netflix
  }

  type Mutation {
    createMovie(
      title: String!
      description: String
      genres: [String]
      imdb_score: Float
      runtime: Int
      release_year: Int
      production_countries: [String]
      age_certification: String
      type: String
    ): Netflix

    updateMovie(
      title: String!
      description: String
      runtime: Int
      genres: [String]
      imdb_score: Float
    ): Netflix

    deleteMovie(title: String!): String
  }
`;

const resolvers = {
  Query: {
    getAllMovies: async () => {
      return await db.collection("netflixes").find({}).toArray();
    },
    getMovieByTitle: async (_, { title }) => {
      return await db.collection("netflixes").findOne({ title });
    },
  },
  Mutation: {
    createMovie: async (_, args) => {
      const newMovie = { ...args };
      await db.collection("netflixes").insertOne(newMovie);
      return newMovie;
    },
    updateMovie: async (_, { title, description, runtime, genres, imdb_score }) => {
      const updatedMovie = await db.collection("netflixes").findOneAndUpdate(
        { title },
        {
          $set: { description, runtime, genres, imdb_score },
        },
        { returnOriginal: false }
      );
      return updatedMovie.value;
    },
    deleteMovie: async (_, { title }) => {
      await db.collection("netflixes").deleteOne({ title });
      return `Movie ${title} deleted`;
    },
  },
};

const startServer = async () => {
  await connectToDatabase();

  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await server.listen();
  console.log(`🚀 Server ready at ${url}`);
};

startServer().catch(console.error);
