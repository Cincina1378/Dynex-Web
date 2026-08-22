exports.handler = async function () {

  return {
    statusCode: 302,

    multiValueHeaders: {
      "Set-Cookie": [
        "discord_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      ]
    },

    headers: {
      Location: "/"
    }
  };

};
