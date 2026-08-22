const crypto = require("crypto");

function createSession(data) {
  const payload = Buffer
    .from(JSON.stringify(data))
    .toString("base64url");

  const secret = process.env.SESSION_SECRET;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Discord kodu alınamadı."
    };
  }

  if (!process.env.DISCORD_CLIENT_ID ||
      !process.env.DISCORD_CLIENT_SECRET ||
      !process.env.SESSION_SECRET) {
    return {
      statusCode: 500,
      body: "Netlify ortam değişkenleri eksik."
    };
  }

  try {
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id:
            process.env.DISCORD_CLIENT_ID,

          client_secret:
            process.env.DISCORD_CLIENT_SECRET,

          grant_type:
            "authorization_code",

          code,

          redirect_uri:
            "https://dynexweb.netlify.app/.netlify/functions/callback"
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error(tokenData);

      return {
        statusCode: 400,
        body: "Discord token alınamadı."
      };
    }

    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`
        }
      }
    );

    const user = await userResponse.json();

    if (!userResponse.ok) {
      return {
        statusCode: 400,
        body: "Discord hesabı alınamadı."
      };
    }

    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : "https://cdn.discordapp.com/embed/avatars/0.png";

    const session = createSession({
      token: tokenData.access_token,
      userId: user.id,
      username: user.username,
      avatar,
      created: Date.now()
    });

    return {
      statusCode: 302,

      multiValueHeaders: {
        "Set-Cookie": [
          `dynex_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
        ]
      },

      headers: {
        Location:
          "/?login=success"
      }
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: "OAuth bağlantısında hata oluştu."
    };
  }
};
