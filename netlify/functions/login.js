exports.handler = async () => {
  const clientId = process.env.DISCORD_CLIENT_ID;

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
      Location: `https://discord.com/oauth2/authorize?${params.toString()}`
    }
  };
};
