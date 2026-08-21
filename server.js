// ======================================================
// DYNEX PANEL - DISCORD BACKEND
// BU DOSYAYI GITHUB ANA DİZİNİNE KOY.
// DISCORD OAUTH2 + SUNUCU LİSTESİ + ROL SİSTEMİ
// ======================================================

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const axios = require("axios");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const API = "https://discord.com/api/v10";

// ... burada önceki server.js kodunun tamamı olacak ...
