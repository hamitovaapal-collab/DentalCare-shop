import express from "express";
import order from "../api/order.js";
import booking from "../api/booking.js";
const app = express();
app.use(express.json());
app.post("/api/order", order);
app.post("/api/booking", booking);
app.listen(5000, () => console.log("Local API on http://localhost:5000"));
