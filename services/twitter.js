import Twitter from "twitter-lite";
import { twitter as keys } from "../config/keys";
const client = new Twitter(keys);
module.exports = client;
