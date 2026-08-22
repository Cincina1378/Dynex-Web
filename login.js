exports.handler = async function (event) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Discord kodu bulunamadı."
    };
  }

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri:
        "https://dynexweb.netlify.app/.netlify/functions/callback"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      statusCode: 400,
      body: "Discord doğrulaması başarısız oldu."
    };
  }

  const userResponse = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers: {
        Authorization: `${data.token_type} ${data.access_token}`
      }
    }
  );

  const user = await userResponse.json();

  return {
    statusCode: 302,
    headers: {
      Location: `/?discord_id=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}`
    }
  };
};
