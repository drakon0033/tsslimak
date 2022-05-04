import { config, EVENT, maps, util } from "../struct";
import moment from "moment-timezone";
import { schedule } from "node-cron";
import {
  CategoryChannel,
  ColorResolvable,
  Guild,
  GuildChannel,
  MessageEmbed,
  Snowflake,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { userModel } from "../db/models/userModel";
import { Reminders } from "../db/models/reminders";
import { guildSettings } from "../db/models/guildSettings";
import { IActivatedRoles } from "../db/types/activatedRoles";
import { IUnixesTimes } from "../db/types/unixesTimes";
import { UnixesTimes } from "../db/models/unixesTimes";
import { activatedRoles } from "../db/models/activatedRoles";
import { birthdayModel } from "../db/models/birthday";
import { logger } from "../logger";

const event: EVENT<"ready"> = {
  name: "ready",
  run: async (Client) => {
    logger.message(Client.user?.username + " Готова!");

    const guild = Client.guilds.cache.get(config.guildSettings.guildID)!;
    if (!guild) return;

    schedule("*/5 * * * *", () => {
      updateVoiceOnline(guild);
      voiceMembers(guild);
    });

    schedule("* * * * *", () => {
      roleRemove(guild);
      setChannelPosition(guild);
      clearChannels(guild);
      reminders(guild);
    });

    schedule(
      "0 0 0 * * *",
      () => {
        addBirthdayRole(guild);
      },
      {
        timezone: "Europe/Moscow",
      }
    );

    schedule(
      "0 59 23 * * *",
      () => {
        removeBirthdayRole(guild);
      },
      {
        timezone: "Europe/Moscow",
      }
    );
  },
};

async function addBirthdayRole(guild: Guild) {
  const day = moment().tz("Europe/Moscow").format("MM-DD");
  const birthdays = await birthdayModel.find({
    bdayDate: day,
  });

  if (!birthdays) {
    return;
  }

  birthdays.forEach(async (bday) => {
    try {
      const newsChannel = guild.channels.cache.get(
        config.ids.channelIds.announceChannel
      ) as TextChannel;
      const member = await guild.members.fetch(bday.uid!);
      const embed = new MessageEmbed()
        .setTitle("День Рождение!")
        .setColor(config.colors.embedBlankColor as ColorResolvable)
        .setDescription(
          `Сегодня свое день рождение празднует %member%!`.replace(
            "%member%",
            member.toString()
          ) +
            `\n\nОт всего сервера хотим поздравить тебя с твоим днем, пожелать тебе крепкого здоровья, много-много денег, любви и счастья побольше. ` +
            `Желаем тебе успешных реализаций всего того что ты задумал, что бы удача шла бок-о-бок с тобой! ` +
            `Круто проведи свое день рождение, ведь следующее будет только через год, надеемся увидеть тебя тут и в следующем году 🎉\n\nС Днём Рождения! 🎂`
        );

      newsChannel.send({
        content: member.toString(),
        embeds: [embed],
      });

      member.roles.add(config.ids.roleIds.birthdayRole);
      logger.message(`Роль "ДР" была добавлена ${member.user.tag}`);
    } catch (error) {
      util.DiscordErrorHandler(error, {
        isEvent: true,
        guild,
        eventName: "ready",
      });

      await birthdayModel.deleteOne({
        uid: bday.uid,
      });
    }
  });
}

async function removeBirthdayRole(guild: Guild) {
  try {
    const role = await guild.roles.fetch(config.ids.roleIds.birthdayRole);

    if (!role?.members.size) {
      return;
    }

    role?.members.forEach((member) => {
      member.roles.remove(config.ids.roleIds.birthdayRole);
      logger.message(`Роль "ДР" была убрана у ${member.user.tag}`);
    });
  } catch (error) {
    util.DiscordErrorHandler(error, {
      eventName: "ready",
      guild,
      isEvent: true,
    });
  }
}

async function voiceMembers(guild: Guild) {
  const voiceChannels = guild.channels.cache.filter(
    (channel) => channel.type === "GUILD_VOICE"
  );
  voiceChannels.forEach((channel) => {
    if (channel.isThread()) return;
    channel.members.forEach(async (member) => {
      if (member.user.bot) {
        return;
      }
      const user = await util.findOneOrCreate(
        userModel,
        { uid: member.id },
        { uid: member.id }
      );
      if (user?.voice?.voiceTime) {
        return;
      }
      await userModel.updateOne(
        { uid: member.id },
        {
          $set: {
            "voice.voiceTime": new Date().getTime(),
          },
        }
      );
    });
  });
}

async function updateVoiceOnline(guild: Guild) {
  const voiceChannels = guild.channels.cache.filter(
    (channel) => channel.type === "GUILD_VOICE"
  );
  voiceChannels.forEach((channel) => {
    if (channel.isThread()) return;
    channel.members.forEach((member) => {
      if (member.user.bot) {
        return;
      }

      const skyNet = util.getTextChannel(config.ids.channelIds.SkyNet, guild);
      util.updateVoiceTime(member, {
        isEvent: true,
      });
    });
  });
}

async function setChannelPosition(gid: Guild) {
  const gSetts = await guildSettings.findOne({ gid: gid.id });

  if (!gSetts || !gSetts.vCat || !gSetts.vChannelCreate || !gSetts.vLuvCat) {
    return;
  }

  ManageCats(gid, gSetts?.vCat!, gSetts?.vChannelCreate);
  ManageCats(gid, gSetts?.vLuvCat!);

  function ManageCats(
    guild: Guild,
    catID: Snowflake,
    channelToFilter?: Snowflake
  ) {
    const category = guild.channels.cache.get(catID) as CategoryChannel;

    const channels =
      category.children != undefined
        ? channelToFilter
          ? category.children.filter(
              (channel) =>
                channel.id != channelToFilter && channel.type != "GUILD_TEXT"
            )
          : category.children
        : undefined;

    let position = channelToFilter ? 1 : 0;
    const arr: channelArr[] = [];

    channels?.forEach((channel) => {
      arr.push({
        channel: channel,
        memberSize: channel.members.size,
      });
    });

    arr
      .sort((a, b) => {
        return b.memberSize! - a.memberSize!;
      })
      .forEach((entry) => {
        const voiceChannel = entry.channel as VoiceChannel;
        if (voiceChannel.position != position) {
          voiceChannel.setPosition(position);
        }
        position++;
      });
  }
}

async function reminders(guild: Guild) {
  const remindArr = await Reminders.find({
    remindTime: {
      $lt: new Date().getTime(),
    },
  });

  const channel = guild.channels.cache.get(
    config.ids.channelIds.SkyNet
  ) as TextChannel;

  if (!remindArr.length) {
    return;
  }

  const embed = new MessageEmbed()
    .setColor("#fffdfd")
    .setFooter(
      `Интересно как поставить напоминание? ${config.guildSettings.PREFIX}help remind что бы узнать как.`,
      guild?.iconURL({ size: 2048, dynamic: true })!
    );
  remindArr.forEach(async (remind) => {
    await Reminders.deleteOne({ uid: remind.uid, counter: remind.counter });
    const member = await guild.members.fetch(remind.uid!);
    embed.setAuthor(
      `Ваше напоминание!`,
      member?.user.displayAvatarURL({ size: 2048, dynamic: true })
    );
    embed.setDescription(remind.text!);
    channel.send({ content: member.toString(), embeds: [embed] });
  });
}

async function roleRemove(gid: Guild) {
  function ManageRoles(
    dbArr: IActivatedRoles[] | IUnixesTimes[],
    type: string
  ) {
    switch (type) {
      case "anotherRoles":
        dbArr.forEach(async (entry) => {
          await UnixesTimes.deleteOne({ uid: entry.uid });
          try {
            const member = await gid.members.fetch(entry.uid!);
            const role = gid.roles.cache.get(entry.roleID!);
            member.roles.remove(entry.roleID!);
            logger.message(
              `Роль ${role?.name} была убрана у ${member.user.tag}`
            );
          } catch (error) {
            util.DiscordErrorHandler(error, {
              isEvent: true,
              eventName: "ready",
              guild: gid,
            });
          }
        });
        break;
      case "colors":
        dbArr.forEach(async (entry) => {
          await activatedRoles.deleteOne({
            uid: entry.uid,
            roleID: entry.roleID,
          });
          try {
            const member = await gid.members.fetch(entry.uid!);
            const role = gid.roles.cache.get(entry.roleID!);
            logger.message(
              `Роль ${role?.name} была убрана у ${member.user.tag} и удалена`
            );
          } catch (error) {
            util.DiscordErrorHandler(error, {
              eventName: "ready",
              guild: gid,
              isEvent: true,
            });
            const role = gid.roles.cache.get(entry.roleID!);
            logger.message(
              `Роль ${role?.name} была убрана у UID ${entry.uid} и удалена`
            );
          }
          gid.roles.cache.get(entry.roleID!)?.delete();
        });
        break;
    }
  }

  ManageRoles(
    await activatedRoles.find({
      removeTime: { $lt: new Date().getTime() },
    }),
    "colors"
  );
  ManageRoles(
    await UnixesTimes.find({ removeTime: { $lt: new Date().getTime() } }),
    "anotherRoles"
  );
}

async function clearChannels(gid: Guild) {
  const gSetts = await guildSettings.findOne({ gid: gid.id });

  if (!gSetts || !gSetts.vCat || !gSetts.vChannelCreate || !gSetts.vLuvCat) {
    return;
  }

  function ManageChannels(catID: Snowflake, channelToEscape?: Snowflake) {
    const category = gid.channels.cache.get(catID) as CategoryChannel;
    category.children.forEach((channel) => {
      if (channelToEscape) {
        if (!channel.members.size && channel.id != channelToEscape) {
          maps.automaton.has(channel.id)
            ? maps.automaton.delete(channel.id)
            : undefined;
          channel.delete();
        }
      } else {
        if (!channel.members.size) {
          maps.automaton.has(channel.id)
            ? maps.automaton.delete(channel.id)
            : undefined;
          channel.delete();
        }
      }
    });
  }

  ManageChannels(gSetts?.vCat!, gSetts?.vChannelCreate!);
  ManageChannels(gSetts?.vLuvCat!);
}

type channelArr = {
  channel?: GuildChannel;
  memberSize?: number;
};

export default event;
