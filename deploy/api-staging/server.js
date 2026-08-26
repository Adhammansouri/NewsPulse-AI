// Hostinger Git entry file — delegates to server.cjs (same bootstrap Passenger uses).
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
require("./server.cjs");
