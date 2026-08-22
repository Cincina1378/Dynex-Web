exports.handler = async function () {
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!clientId) {
    return {
      statusCode: 500,
      body: "DISCORD_CLIENT_ID bulunamadı."
    };
  }

  const redirectUri =
    "https://dynexweb.netlify.app/.netlify/functions/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "identify guilds"
  });

  return {
    statusCode: 302,
    headers: {
      Location:
        "https://discord.com/oauth2/authorize?" +
        params.toString()
    }
  };
};
