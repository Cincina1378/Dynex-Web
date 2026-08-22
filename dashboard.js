exports.handler = async function (event) {
  try {
    const cookie = event.headers.cookie || "";
    const match = cookie.match(/discord_token=([^;]+)/);

    if (!match) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Discord oturumu bulunamadı."
        })
      };
    }

    const token = decodeURIComponent(match[1]);

    const response = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Discord sunucuları alınamadı."
        })
      };
    }

    const guilds = await response.json();

    const result = guilds.map(guild => {
      const permissions = BigInt(guild.permissions || "0");

      return {
        id: guild.id,
        name: guild.name,

        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,

        canManage:
          (permissions & BigInt(0x8)) === BigInt(0x8) ||
          (permissions & BigInt(0x20)) === BigInt(0x20),

        botInstalled: false
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({
        guilds: result
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Sunucular yüklenirken hata oluştu."
      })
    };
  }
};
