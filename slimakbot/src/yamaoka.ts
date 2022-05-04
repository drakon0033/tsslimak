import commandHandler from "./handler/commandHandler";
import { Client, ClientEvents, Intents } from "discord.js";
import { connect } from "mongoose";
import { maps } from "./struct";
import { logger } from "./logger";
import { config } from "dotenv";

const client = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
  ],
});

async function init() {
  config();
  try {
    await connect(process.env.MONGOURI!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    await commandHandler(client);
  } catch (error) {
    logger.message(error);
  }

  maps.events.forEach((event) => {
    client.on(event.name as keyof ClientEvents, (...args) => {
      event.run(...args, client);
    });
  });

  try {
    await client.login(process.env.TOKEN);
  } catch (error) {
    logger.message(error);
  }
}

init();
