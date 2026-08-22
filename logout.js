exports.handler = async function () {
  return {
    statusCode: 302,

    multiValueHeaders: {
      "Set-Cookie": [
        "dynex_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      ]
    },

    headers: {
      Location: "/"
    }
  };
};
