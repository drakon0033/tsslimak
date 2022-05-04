import {
  Client,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel,
} from "discord.js";
import { disableParts } from "../db/models/disabledParts";
import { enableParts } from "../db/models/enabledParts";
import { guildSettings } from "../db/models/guildSettings";
import { Reactions } from "../db/models/reactions";
import { userModel } from "../db/models/userModel";
import { EVENT, config, maps, util, COMMAND } from "../struct";
import { schedule } from "node-cron";
import { logger } from "../logger";

const reactions = {
  "650657007787048960": "💜",
  "646609693942349835": "💎",
  "646609815744937985": "🍒",
};

const event: EVENT<"messageCreate"> = {
  name: "messageCreate",
  run: async (message, Client) => {
    if (message.guild?.id != config.guildSettings.guildID) {
      return;
    }

    yamaoka(message);

    if (message.author.bot) {
      return upCheck(message);
    }

    const inviteTest =
      /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|com)|discordapp\.com\/invite)\/.+[a-z]/;

    if (
      inviteTest.test(message.content) &&
      !message.member?.permissions.has("VIEW_AUDIT_LOG", true)
    ) {
      message.delete();
      return;
    }

    const gSetts = await util.findOneOrCreate(
      guildSettings,
      { gid: message.guild.id },
      { gid: message.guild.id }
    );
    const noXPchs = gSetts?.noXPchannels
      ? gSetts.noXPchannels.toString().split(/ +/g)
      : [];
    const [cmd, ...args] = message.content
      .slice(config.guildSettings.PREFIX.length)
      .split(/ +/g);

    checkChannels(message, noXPchs);

    if (!message.content.startsWith(config.guildSettings.PREFIX)) {
      return;
    }

    commandHandler(cmd, message, args, Client);
  },
};

function yamaoka(message: Message) {
  switch (true) {
    case message.content === "Ямаока, помурчи":
      const chance = util.randomInt(1, 100);
      if (chance > 50) {
        message.channel.send({
          content: `Мур-р~ <a:AnotherCat:749941255940603935>`,
        });
      } else {
        message.channel.send({ content: `Не хочу...` });
      }
      break;
    case message.content === "Ямаока, доброе утро":
      message.channel.send({
        content: `${message.author.toString()} Доброго утречка~ <a:Heeeeeey:863148929696661554>`,
      });
      break;
    case message.content === "Ямаока, спокойной ночи":
      message.channel.send({
        content: `${message.author.toString()} Сладких снов! <:peepoCute:855913570528002068>`,
      });
      break;
  }
}

async function commandHandler(
  cmd: string,
  message: Message,
  args: string[],
  client: Client
) {
  const command = maps.commands.find((c) => c.name === cmd)
    ? maps.commands.find((c) => c.name === cmd)
    : maps.commands
        .filter((c) => c.aliases != undefined)
        .find((c) => c.aliases?.includes(cmd)!);

  if (!command) {
    handleReaction(cmd, message);
  } else {
    handleCommand(command, message, args, client);
  }
}

async function upCheck(message: Message) {
  const botsIds = [config.ids.userIds.sUpBotID, config.ids.userIds.bumpBotId];

  if (!botsIds.includes(message.author.id)) {
    return;
  }

  const regEx = /<@!?(?<id>\d+)>/;
  const embed = message.embeds[0];
  const members = await message.guild?.members.fetch();
  const result = embed
    ? embed.description && !/Message for/.test(embed.description)
      ? regEx.exec(embed.description)
      : null
    : null;

  const user =
    embed && /Успешный Up!/.test(embed!.description!)
      ? members?.find((m) => m.user.tag === embed.footer?.text)
      : result
      ? members?.find((m) => m.id === result.groups!.id)
      : null;

  if (!user) {
    return;
  }

  await userModel.updateOne(
    { uid: user.id },
    {
      $inc: {
        shards: 100,
      },
    }
  );

  message.channel.send(
    `${user.toString()} держи **100** ${
      config.emojis.SHARDS
    } за **UP** сервера <a:Shine:777550535364444241>`
  );

  const resultTime = util.getMoscowTime(4 * 60 * 60 * 1000);
  logger.message(
    `Пинг UP'а будет в ${resultTime.hours}:${resultTime.minutes}:${resultTime.seconds}`
  );

  const task = schedule(
    `${resultTime.seconds} ${resultTime.minutes} ${resultTime.hours} * * *`,
    () => {
      message.channel.send(
        `**<@&832299415590010901>**, доступен UP сервера у ${message.author.toString()}`
      );
      task.destroy();
    },
    {
      timezone: "Europe/Moscow",
    }
  );
}

async function handleCommand(
  command: COMMAND,
  message: Message,
  args: string[],
  client: Client
) {
  if (!util.checkPerms(command.permission, message)) {
    message.channel.send(`у вас нет прав использовать эту комманду.`);
    return;
  }
  if (maps.cooldowns.has(message.author.id)) {
    message.channel.send(
      `вам нужно подождать **\`${cooldownRemaining(
        message.author.id
      )}с\`** прежде чем использовать след. комманду.`
    );
    return;
  }

  const isDisable = await disableParts.findOne({
    $or: [
      {
        name: command.category,
        channel: message.channel.id,
      },
      {
        name: command.category,
        channel: null,
      },
      {
        name: command.name,
        channel: message.channel.id,
      },
      {
        name: command.name,
        channel: null,
      },
    ],
  });
  const isEnable = await enableParts.findOne({
    $or: [
      {
        name: command.category,
        channel: message.channel.id,
      },
      {
        name: command.name,
        channel: message.channel.id,
      },
      {
        name: command.category,
        channel: null,
      },
      {
        name: command.name,
        channel: null,
      },
    ],
  });

  if (!message.member?.permissions.has("VIEW_AUDIT_LOG", true)) {
    if (!isEnable) {
      if (isDisable) {
        const channel = util.getTextChannel(
          config.ids.channelIds.SkyNet,
          message.guild!
        );
        message.channel.send(
          `Эта команда **не работает** в данном чате. Перейдите в: ${channel.toString()}`
        );
        return;
      }
    }
  }

  command.run(client, message, args);

  if (message.member?.permissions.has("ADMINISTRATOR")) {
    return;
  }
  maps.cooldowns.set(
    message.author.id,
    new Date().getTime() + command.cooldown * 1000
  );
  setTimeout(() => {
    maps.cooldowns.delete(message.author.id);
  }, command.cooldown * 1000);
}

async function handleReaction(cmd: string, message: Message) {
  const possibleReaction = await Reactions.findOne({
    Name: cmd,
  });

  if (!possibleReaction) {
    return;
  }

  if (!possibleReaction.Gifs?.length) {
    return util.errorMessage(message, {
      text: "У этой реакций нет гифок. Вы можете добавить их сами , отправив заявку (**!help radd**). Либо попросить администрацию",
      reply: true,
    });
  }

  let text;
  let toMention: string | undefined;

  if (message.mentions.members?.first()) {
    const filteredMembers = message.mentions.members.filter(
      (m) => m.id != message.author.id
    );
    if (filteredMembers.size) {
      if (!possibleReaction.Text) {
        return util.errorMessage(message, {
          text: "У этой реакции нет основного текста, либо она только для одного человека",
          reply: true,
        });
      }

      toMention = filteredMembers.map((k) => k.toString()).join(", ");

      text = possibleReaction.Text.replace(
        "%author%",
        message.author.toString()
      ).replace("%target%", toMention);
    } else {
      if (!possibleReaction.SoloText) {
        return util.errorMessage(message, {
          text: `Если вы хотите ${cmd} себя, то попросите другого человека сделать это, будет куда приятней! Наверное..`,
          reply: true,
        });
      }

      text = possibleReaction.SoloText.replace(
        "%author%",
        message.author.toString()
      );
    }
  } else {
    if (!possibleReaction.SoloText) {
      return util.errorMessage(message, {
        text: "Вы забыли упомянуть человека, либо у этой `соло` реакции нет доп. текста",
        reply: true,
      });
    }

    text = possibleReaction.SoloText.replace(
      "%author%",
      message.author.toString()
    );
  }

  const randomGif = util.randomElement(possibleReaction.Gifs);

  const embed = new MessageEmbed()
    .setDescription(text)
    .setColor("#2F3136")
    .setFooter(`Реакция: ${config.guildSettings.PREFIX}${cmd}`)
    .setImage(randomGif);

  message.channel.send({
    content: toMention ? toMention : message.author.toString(),
    embeds: [embed],
  });
}

async function checkChannels(message: Message, noXPchs: string[]) {
  if (
    noXPchs.includes(message.channel.id) ||
    message.content.startsWith(config.guildSettings.PREFIX)
  ) {
    return;
  }

  const possibleReaction = reactions[message.channel.id];
  if (possibleReaction) {
    const regEx =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    if (message.attachments.first() || regEx.test(message.content)) {
      message.react(possibleReaction);
    } else {
      message.delete();
    }
  }

  await userModel.updateOne(
    { uid: message.author.id },
    {
      $inc: {
        messages: 1,
      },
    }
  );

  if (maps.userInXPCD.has(message.author.id)) {
    return;
  }

  maps.userInXPCD.set(message.author.id, undefined);
  xpAdd(message);
  const channel = message.guild?.channels.cache.get(
    config.ids.channelIds.SkyNet
  ) as TextChannel;
  util.lvlUp(message.member!, channel);

  return setTimeout(() => {
    maps.userInXPCD.delete(message.author.id);
  }, 60000);
}

async function xpAdd(message: Message) {
  await userModel.updateOne(
    { uid: message.author.id },
    {
      $inc: {
        xp: 10,
      },
    }
  );

  logger.message(`${message.author.tag} получил 10 опыта за сообщение`);
  return;
}

function cooldownRemaining(uid: Snowflake) {
  const dif = (maps.cooldowns.get(uid)! - new Date().getTime()) / 1000;
  return dif.toFixed(1);
}

export default event;
