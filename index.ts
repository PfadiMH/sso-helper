import cors from "cors";
import express from "express";

const redirectUrl = process.env.REDIRECT_URL;

if (!redirectUrl) {
  throw new Error("REDIRECT_URL environment variable is not set");
}

const app = express();
const port = 3000;
app.use(cors());

app.get("/callback", (req, res) => {
  const queryParams = req.query;
  const queryString = new URLSearchParams(queryParams).toString();
  res.redirect(`${redirectUrl}?${queryString}`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Redirect URL: ${redirectUrl}`);
});
