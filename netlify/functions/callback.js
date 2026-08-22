exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Discord kodu alınamadı."
    };
  }

  try {
    const tokenResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID,
          client_secret: process.env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code: code,
          redirect_uri:
            "https://dynexweb.netlify.app/.netlify/functions/callback"
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Discord token hatası:", tokenData);

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
        body: "Discord kullanıcı bilgileri alınamadı."
      };
    }

    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    return {
      statusCode: 302,

      multiValueHeaders: {
        "Set-Cookie": [
          `discord_token=${encodeURIComponent(
            tokenData.access_token
          )}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
        ]
      },

      headers: {
        Location:
          `/?discord_id=${encodeURIComponent(user.id)}` +
          `&username=${encodeURIComponent(user.username)}` +
          `&avatar=${encodeURIComponent(avatar)}`
      }
    };

  } catch (error) {
    console.error("Callback hatası:", error);

    return {
      statusCode: 500,
      body: "Sunucu hatası."
    };
  }
};
