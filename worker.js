const DISCORD_API = "https://discord.com/api/v10";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      const state = crypto.randomUUID();

      const authUrl =
        "https://discord.com/oauth2/authorize?" +
        new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          redirect_uri: env.DISCORD_REDIRECT_URI,
          response_type: "code",
          scope: "identify guilds"
        });

      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl,
          "Set-Cookie":
            `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
        }
      });
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response("Discord kodu bulunamadı.", {
          status: 400
        });
      }

      const tokenResponse = await fetch(
        `${DISCORD_API}/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: env.DISCORD_CLIENT_ID,
            client_secret: env.DISCORD_CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: env.DISCORD_REDIRECT_URI
          })
        }
      );

      if (!tokenResponse.ok) {
        return new Response(
          "Discord OAuth2 doğrulaması başarısız.",
          { status: 401 }
        );
      }

      const token = await tokenResponse.json();

      const userResponse = await fetch(
        `${DISCORD_API}/users/@me`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`
          }
        }
      );

      const user = await userResponse.json();

      const sessionId = crypto.randomUUID();

      await env.SESSIONS.put(
        sessionId,
        JSON.stringify({
          access_token: token.access_token,
          user
        }),
        {
          expirationTtl: 604800
        }
      );

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie":
            `session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
        }
      });
    }

    if (url.pathname === "/api/dashboard") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies.session;

      if (!sessionId) {
        return Response.json(
          { error: "Giriş yapılmamış." },
          { status: 401 }
        );
      }

      const session = await env.SESSIONS.get(sessionId, "json");

      if (!session) {
        return Response.json(
          { error: "Oturum süresi dolmuş." },
          { status: 401 }
        );
      }

      const guildResponse = await fetch(
        `${DISCORD_API}/users/@me/guilds`,
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

      if (!guildResponse.ok) {
        return Response.json(
          { error: "Sunucular alınamadı." },
          { status: 500 }
        );
      }

      const guilds = await guildResponse.json();

      let botGuilds = [];

      if (env.BOT_TOKEN) {
        const botResponse = await fetch(
          `${DISCORD_API}/users/@me/guilds`,
          {
            headers: {
              Authorization:
                `Bot ${env.BOT_TOKEN}`
            }
          }
        );

        if (botResponse.ok) {
          botGuilds = await botResponse.json();
        }
      }

      const result = guilds.map(guild => {
        const permissions =
          BigInt(guild.permissions || "0");

        const ADMINISTRATOR = 0x8n;
        const MANAGE_GUILD = 0x20n;

        const isOwner =
          guild.owner === true;

        const canManage =
          isOwner ||
          (permissions & ADMINISTRATOR) !== 0n ||
          (permissions & MANAGE_GUILD) !== 0n;

        const botInstalled =
          botGuilds.some(
            botGuild => botGuild.id === guild.id
          );

        let icon = null;

        if (guild.icon) {
          icon =
            `https://cdn.discordapp.com/icons/` +
            `${guild.id}/${guild.icon}.png?size=128`;
        }

        return {
          id: guild.id,
          name: guild.name,
          icon,
          owner: isOwner,
          canManage,
          botInstalled
        };
      });

      return Response.json({
        user: {
          id: session.user.id,
          username: session.user.username,
          avatar: session.user.avatar
            ? `https://cdn.discordapp.com/avatars/` +
              `${session.user.id}/${session.user.avatar}.png?size=128`
            : null
        },
        guilds: result
      });
    }

    if (url.pathname === "/logout") {
      const cookies =
        parseCookies(
          request.headers.get("Cookie")
        );

      if (cookies.session) {
        await env.SESSIONS.delete(
          cookies.session
        );
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie":
            "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};


function parseCookies(cookieHeader) {
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const key =
      part.slice(0, index).trim();

    const value =
      part.slice(index + 1).trim();

    cookies[key] = value;
  }

  return cookies;
}
