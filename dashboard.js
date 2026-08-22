exports.handler = async function (event) {
  try {
    const cookies = event.headers.cookie || "";

    const match = cookies.match(
      /(?:^|;\s*)discord_token=([^;]+)/
    );

    if (!match) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Discord oturumu bulunamadı."
        })
      };
    }

    const accessToken = decodeURIComponent(match[1]);

    const response = await fetch(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    const guilds = await response.json();

    if (!response.ok) {
      console.error(
        "Discord guild hatası:",
        guilds
      );

      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Discord sunucuları alınamadı."
        })
      };
    }

    const result = guilds.map(guild => {

      const permissions =
        BigInt(guild.permissions || "0");

      const administrator =
        (permissions & BigInt(0x8)) === BigInt(0x8);

      const manageGuild =
        (permissions & BigInt(0x20)) === BigInt(0x20);

      return {
        id: guild.id,

        name: guild.name,

        icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
          : null,

        canManage:
          administrator || manageGuild,

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

    console.error(
      "Dashboard hatası:",
      error
    );

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        error:
          "Sunucular yüklenirken hata oluştu."
      })
    };
  }
};
