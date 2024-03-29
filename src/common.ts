// common.js
import {ApolloServer} from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import {readFileSync} from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import rickMortyResolvers from './graphql/rickmorty/resolvers';
import {handleChat} from './chat/chatHandler';

dotenv.config();

const app = express(); // Create an Express application
const allowedOrigins = ['https://chat-mms.doctorew.com', 'http://local.doctorew.com'];

const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

const rickMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

let rickMortyServer;
let serverStarted = false;

async function startServer() {
    console.log('|-o-| Starting server...');
    if (!serverStarted) {
        rickMortyServer = new ApolloServer({
            typeDefs: rickMortyTypeDefs,
            resolvers: rickMortyResolvers,
        });

        await rickMortyServer.start();
        console.log('|-o-| Apollo Server started');
        rickMortyServer.applyMiddleware({
            app,
            path: process.env.GRAPHQL_PATH || '/rickmorty',
            cors: false, // Use the Express CORS settings
        });

        //  rickMortyServer.applyMiddleware({app, path: process.env.GRAPHQL_PATH || '/rickmorty'});
        serverStarted = true;
    }
    console.log('|-o-| graphql path:', process.env.GRAPHQL_PATH, ' :: API_CHAT_PATH:', process.env.API_CHAT_PATH);
    app.post(process.env.API_CHAT_PATH || '/api/chat', handleChat);
    app.get('/health', (req, res) => res.status(200).send('OK'));
}

export {startServer, app}; // Export the startServer function and the app instance
