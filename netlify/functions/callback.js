exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Discord kodu alınamadı."
    };
  }

  try {
    const response = await fetch(
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Discord token hatası:", data);

      return {
        statusCode: 400,
        body: "Discord token alınamadı."
      };
    }

    const userResponse = await fetch(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      }
    );

    const user = await userResponse.json();

    return {
      statusCode: 302,
      multiValueHeaders: {
        "Set-Cookie": [
          `discord_token=${data.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`
        ]
      },
      headers: {
        Location:
          `/?discord_id=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}`
      }
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: "Sunucu hatası."
    };
  }
};
