import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import "dotenv/config"

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

let clientID = process.env.API_CLIENT_ID;
let clientSecret = process.env.API_CLIENT_SECRET

let accessToken = null;
let tokenExpiration = 0;

const credentials = Buffer
  .from(`${clientID}:${clientSecret}`)
  .toString("base64");

async function getAccessToken(){
    if(accessToken && Date.now() < tokenExpiration){
        return accessToken;
    }

    const response = await fetch(
        "https://oauth.fatsecret.com/connect/token",
        {
            method: "POST",
            headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials&scope=basic"
        }
    );

    if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed: ${text}`);
    }

    const data = await response.json();

    accessToken = data.access_token;
    tokenExpiration = Date.now() + data.expires_in * 1000;

    return accessToken;
}

app.get("/nutrition/search", async (req, res) => {
    try{
        const { query } = req.query;
        if (!query) {
        return res.status(400).json({ error: "Missing query" });
        }

        const token = await getAccessToken();

        const response = await fetch(
            `https://platform.fatsecret.com/rest/foods/search/v4?search_expression=${encodeURIComponent(query)}&format=json`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to get data"});
    }

});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});