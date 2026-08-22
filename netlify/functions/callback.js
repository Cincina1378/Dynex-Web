exports.handler = async function (event) {

  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Discord doğrulama kodu bulunamadı."
    };
  }

  const params = new URLSearchParams();

  params.append(
    "client_id",
    process.env.DISCORD_CLIENT_ID
  );

  params.append(
    "client_secret",
    process.env.DISCORD_CLIENT_SECRET
  );

  params.append(
    "grant_type",
    "authorization_code"
  );

  params.append(
    "code",
    code
  );

  params.append(
    "redirect_uri",
    "https://dynexweb.netlify.app/.netlify/functions/callback"
  );

  const tokenResponse = await fetch(
    "https://discord.com/api/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: params
    }
  );

  const tokenData =
    await tokenResponse.json();

  if (!tokenResponse.ok) {

    return {
      statusCode: 400,
      body:
        "Discord token alınamadı."
    };

  }

  const userResponse = await fetch(
    "https://discord.com/api/users/@me",
    {
      headers: {
        Authorization:
          `${tokenData.token_type} ${tokenData.access_token}`
      }
    }
  );

  const user =
    await userResponse.json();

  return {

    statusCode: 302,

    headers: {

      Location:
        `/?discord_id=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}`

    }

  };

};
