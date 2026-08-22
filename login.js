exports.handler = async function () {
  const clientId = process.env.DISCORD_CLIENT_ID;

  const redirectUri =
    "https://dynexweb.netlify.app/.netlify/functions/callback";

  const discordUrl =
    "https://discord.com/oauth2/authorize" +
    "?client_id=" + encodeURIComponent(clientId) +
    "&response_type=code" +
    "&redirect_uri=" + encodeURIComponent(redirectUri) +
    "&scope=identify%20guilds";

  return {
    statusCode: 302,
    headers: {
      Location: discordUrl
    }
  };
};
