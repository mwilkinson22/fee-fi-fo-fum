import Twitter from "twit";
import { twitter as keys } from "../config/keys";
const client = new Twitter(keys);
module.exports = client;
