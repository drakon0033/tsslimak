import {
  Client,
  Guild,
  GuildMember,
  Message,
  MessageEmbed,
  Snowflake,
  TextChannel,
} from "discord.js";
import { userModel } from "./db/models/userModel";
import { config, COMMAND, errorCodes, randomEngine } from "./struct";
import moment from "moment";
import { notifyModel } from "./db/models/notify";
import { FilterQuery, Model } from "mongoose";
import { logger } from "./logger";

const requiredPermission = {
  Dev: (msg: Message) => {
    return {
      allowed: msg.author.id === config.ids.userIds.OWNER_ID,
      position: 4,
    };
  },
  Admin: (msg: Message) => {
    return {
      allowed: msg.member?.roles.cache.some((role) =>
        config.ids.roleIds.AdminRoles.includes(role.id)
      ),
      position: 3,
    };
  },
  Moderator: (msg: Message) => {
    return {
      allowed: msg.member?.roles.cache.some((role) =>
        config.ids.roleIds.ModeratorRoles.includes(role.id)
      ),
      position: 2,
    };
  },
  User: (msg: Message) => {
    return {
      allowed: msg.member?.roles.cache.has(config.ids.roleIds.UserDefault),
      position: 1,
    };
  },
};

const utils = {
  deleteMessage: (msg: Message, time: number) => {
    setTimeout(() => {
      msg.delete();
    }, time);
  },

  randomInt: (min: number, max: number) => {
    return randomEngine.integer(min, max);
  },

  /**
   *
   * @param toAdd should be a milliseconds value you want to add to get new Date, like you need an date with +4 hours
   */
  getMoscowTime: (toAdd?: number) => {
    const newDate = toAdd ? new Date(new Date().getTime() + toAdd) : new Date();
    const moscowString = newDate
      .toLocaleString([], { timeZone: "Europe/Moscow", hour12: false })
      .match(/\d+/g)!;
    let [month, day, year, hours, minutes, seconds] = moscowString;

    hours = hours === "24" ? "0" : hours;
    minutes = minutes === "60" ? "59" : minutes;
    seconds = seconds === "60" ? "59" : seconds;

    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
    };
  },

  randomElement: (array: any) => {
    return array[Math.floor(Math.random() * array.length)];
  },

  checkPerms: (permission: string, message: Message) => {
    const filteredPermissions = Object.keys(requiredPermission).filter(
      (perm) => perm != permission
    );
    const { allowed, position } = requiredPermission[permission](message);

    let cmdAllowed = allowed;
    let highPosition = position;

    if (!cmdAllowed) {
      for (const perm of filteredPermissions) {
        const { allowed, position } = requiredPermission[perm](message);
        if (allowed && position > highPosition) {
          cmdAllowed = true;
        }
      }
    }

    return cmdAllowed;
  },

  DiscordErrorHandler: (error, options: DiscordErrorHandlerOptions) => {
    const callTime = `<t:${Math.floor(new Date().getTime() / 1000)}>`;
    const errorText = errorCodes[error.code];

    let errorEmbed: MessageEmbed;

    if (options.isEvent) {
      const embedText =
        `\nВремя вызова: \`${callTime}\`` + `\nТекст ошибки: \`${errorText}\``;
      errorEmbed = new MessageEmbed()
        .setAuthor(
          `Ошибка в ивенте: ${options.eventName}`,
          options.guild!.iconURL({ size: 2048, dynamic: true })!
        )
        .setDescription(embedText)
        .setColor("PURPLE")
        .setThumbnail(
          "https://i.pinimg.com/564x/32/b2/d8/32b2d8784e05e4b144f59fb9b55849b5.jpg"
        )
        .setTimestamp(new Date());
    } else {
      const message = options.message!;
      const cmd = options.cmd!;
      const embedText =
        `\nВызывал её: ${message.author.toString()}` +
        `\nВремя вызова: \`${callTime}\`` +
        `\nТекст ошибки: \`${errorText}\``;
      errorEmbed = new MessageEmbed()
        .setAuthor(
          `Ошибка в команде: ${cmd.name}`,
          message.guild?.iconURL({ size: 2048, dynamic: true })!
        )
        .setDescription(embedText)
        .setColor("PURPLE")
        .setThumbnail(
          "https://i.pinimg.com/564x/32/b2/d8/32b2d8784e05e4b144f59fb9b55849b5.jpg"
        )
        .setTimestamp(new Date());
    }

    const channel = utils.getTextChannel(
      config.ids.channelIds.ErrorChannel,
      options.isEvent ? options.guild! : options.message?.guild!
    );
    channel.send({ embeds: [errorEmbed] });
  },

  /**
   * @param message Message
   * @param uid should be args where user probably will provide UID
   * @param returnNothing if function doesn't find any member, should it return nothing instead of member who execute function?
   */
  getDiscordMember: async (
    message: Message,
    options?: getDiscordMemberOptions
  ): Promise<GuildMember | undefined> => {
    let member: GuildMember | undefined;

    if (message.mentions.members?.first()) {
      member = message.mentions.members.first()!;
    } else if (options!.uid) {
      try {
        member = await message.guild?.members.fetch(options!.uid)!;
      } catch (error) {
        options!.returnNothing
          ? (member = undefined)
          : (member = message.member!);
      }
    } else {
      options!.returnNothing
        ? (member = undefined)
        : (member = message.member!);
    }

    return member;
  },

  updateVoiceTime: async (
    member: GuildMember,
    options?: UpdateVoiceTimeOptions
  ) => {
    let user = await userModel.findOne({
      uid: member.id,
    });

    if (!member.voice.channel) {
      if (options?.returnUser) {
        return user;
      } else {
        return;
      }
    }
    if (!user?.voice?.voiceTime) {
      await userModel.updateOne(
        {
          uid: member.id,
        },
        { $set: { "voice.voiceTime": new Date().getTime() } }
      );
      if (options?.returnUser) {
        return (user = await userModel.findOne({ uid: member.id }));
      } else {
        return;
      }
    }

    const mVC = member.voice;
    let cof = config.guildSettings.VoiceCof;
    if (
      mVC.selfDeaf ||
      mVC.selfMute ||
      mVC.channel?.userLimit === 1 ||
      mVC.channel?.id === config.ids.channelIds.AfkRoom
    ) {
      cof = 0.5;
    }

    let timeInVoice = new Date().getTime() - user.voice.voiceTime;
    const addXp = Math.floor(mins(timeInVoice) * cof);

    await userModel.updateOne(
      {
        uid: member.id,
      },
      {
        $set: {
          "voice.voiceTime": !options?.isEvent ? new Date().getTime() : null,
        },
        $inc: {
          "voice.voiceBonus": -timeInVoice,
          "voice.allTime": timeInVoice,
          xp: addXp,
        },
      }
    );

    utils.lvlUp(
      member,
      utils.getTextChannel(config.ids.channelIds.SkyNet, member.guild)
    );

    user = await userModel.findOne({
      uid: member.id,
    });

    logger.message(
      `${member.user.tag} получил за ${mins(timeInVoice)} минут ${addXp} опыта.`
    );

    utils.checkVoiceBonus(
      member,
      utils.getTextChannel(config.ids.channelIds.SkyNet, member.guild)
    );

    if (options?.returnUser) {
      return (user = await userModel.findOne({
        uid: member.id,
      }));
    }

    function mins(time: number) {
      return Math.floor(moment.duration(time).asMinutes());
    }
  },

  checkVoiceBonus: async (member: GuildMember, channel: TextChannel) => {
    const user = await userModel.findOne({
      uid: member.id,
    });

    if (user?.voice?.voiceBonus! > 0) {
      return;
    }

    await userModel.updateOne(
      {
        uid: member.id,
      },
      {
        $inc: {
          "inventory.capsuls": 1,
        },
        $set: {
          "voice.voiceBonus": 18000000 - -user?.voice?.voiceBonus!,
        },
      }
    );

    const skynet = member.guild.channels.cache.get(
      config.ids.channelIds.SkyNet
    ) as TextChannel;

    const awardEmbed = new MessageEmbed()
      .setAuthor(
        `ой-ой, уведомление!`,
        member.guild.iconURL({ size: 2048, dynamic: true })!
      )
      .setDescription(
        `Приветик! Прости что тревожу.. за **5** часов голосовой активности мне сказали выдавать вот эти вот штуки ${config.emojis.CAPS}!` +
          `\nКак видишь, пришло время и тебе получить **1** штучку` +
          `\n\nЕё ты можешь найти у себя в профиле.\nПропиши \`!me\` [тут](https://discord.com/channels/${member.guild.id}/${skynet.id}/)` +
          `\nЧто бы открыть, достаточно написать \`!open\` [всё там же](https://discord.com/channels/${member.guild.id}/${skynet.id}/)` +
          `\nЕсли у тебя скопилось их много, ты можешь сделать следующее:` +
          `\nОткрыть несколько: \`!open 10\` или сразу все \`!open all\`` +
          `\n\nСпасибо что проводишь время у нас на сервере! Удачки <a:zaebali:751569581515997254>`
      )
      .setFooter(
        `Если не хотите получать уведомления об капсулах, напишите !dnotify в скайнете.`
      )
      .setColor(member.displayColor)
      .setThumbnail("https://i.imgur.com/JS35zZI.png");

    if (await notifyModel.findOne({ uid: member.id })) {
      logger.message(`Пользователь: ${member.user.tag} получил 1 капсулу.`);
      return;
    }

    try {
      member.send({ embeds: [awardEmbed] }).then((_) => {
        logger.message(`Пользователь: ${member.user.tag} получил 1 капсулу.`);
      });
    } catch (error) {
      logger.message(
        `Не могу отправить сообщение о капсуле пользователю: ${member.user.tag}.`
      );
      channel.send({ content: member.toString(), embeds: [awardEmbed] });
    }
  },

  /**
   * @param member GuildMember object
   * @param channel TextChanel object where message will be send
   * @returns updatedUserObject from db
   */
  lvlUp: async (member: GuildMember, channel: TextChannel) => {
    const lvlUpRolesIds = config.ids.roleIds;
    const user = await userModel.findOne({
      uid: member.id,
    });

    let xpToLvlUp = 25 * (user!.lvl! * user!.lvl!) + 50 * user!.lvl! + 100;
    let lvlsToAdd = 0;
    let newLvl = user?.lvl!;
    let shardsToAdd = 0;

    for (; user!.xp! >= xpToLvlUp; ) {
      lvlsToAdd += 1;
      shardsToAdd += utils.randomInt(10, 50);
      newLvl += lvlsToAdd;
      xpToLvlUp = 25 * (newLvl * newLvl) + 50 * newLvl + 100;
    }

    if (!lvlsToAdd) return user;

    await userModel.updateOne(
      {
        uid: member.id,
      },
      {
        $inc: {
          lvl: lvlsToAdd,
          shards: shardsToAdd,
        },
      }
    );

    const rolesForLvlUp = {
      3: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl3);
      },
      5: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl5);
        member.roles.remove(lvlUpRolesIds.lvl3);
      },
      10: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl10);
        member.roles.remove(lvlUpRolesIds.lvl5);
      },
      15: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl15);
        member.roles.remove(lvlUpRolesIds.lvl10);
      },
      30: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl30);
        member.roles.remove(lvlUpRolesIds.lvl15);
      },
      50: (member: GuildMember) => {
        member.roles.add(lvlUpRolesIds.lvl50);
        member.roles.remove(lvlUpRolesIds.lvl30);
      },
    };

    const lvlUpEmbed = new MessageEmbed()
      .setAuthor(
        `${member.user.tag} перешел на новый уровень ${newLvl}`,
        member.user.displayAvatarURL({ size: 2048, dynamic: true })
      )
      .setColor(member.displayColor!);
    channel?.send({ embeds: [lvlUpEmbed] });

    if (!rolesForLvlUp[newLvl]) {
      return await userModel.findOne({ uid: member.id });
    } else {
      rolesForLvlUp[newLvl](member);
    }

    return await userModel.findOne({ uid: member.id });
  },

  /**
   * @param channelID id of channel on provided guild
   * @param guild guild object
   * @returns object with text channel
   */
  getTextChannel: (channelID: Snowflake, guild: Guild) => {
    return guild.channels.cache.get(channelID) as TextChannel;
  },

  errorMessage: async (message: Message, options: errorMessageOptions) => {
    const additionalInfo = options.example
      ? `**\`Пример использования\`**\n${utils.cmdExampleToString(
          options.cmd?.example!,
          true
        )}`
      : "";
    const text = `${options.text}.\n${additionalInfo}`;
    const errorEmbed = new MessageEmbed()
      .setAuthor(
        `エラー`,
        message.author.displayAvatarURL({ size: 2048, dynamic: true })
      )
      .setThumbnail(
        "https://i.pinimg.com/564x/b9/11/69/b91169dba8d01511f7e9ec426c7c5021.jpg"
      )
      .setDescription(text)
      .setColor("#2f3136");

    if (options.reply) {
      message.delete();
      return message.channel
        .send({
          content: message.author.toString(),
          embeds: [errorEmbed],
        })
        .then((m) => utils.deleteMessage(m, 10000));
    } else {
      message.delete();
      return message.channel
        .send({ embeds: [errorEmbed] })
        .then((m) => utils.deleteMessage(m, 10000));
    }
  },

  /**
   * @param cmdExamples array of exmaple string for command
   * @returns formated string
   */
  cmdExampleToString: (cmdExamples: string[], join?: boolean) => {
    return cmdExamples
      .map((element) => `\`${config.guildSettings.PREFIX}${element}\``)
      .join(join ? "\n" : "");
  },

  /**
   * @param emoji Can be ID or emoji name, or emoji object
   * @param client Bot Client
   * @returns Emoji object
   */
  getEmoji: (emoji: string, client: Client) => {
    let emote = client.emojis.cache.find(
      (e) => e.name!.toLowerCase() === emoji
    );
    if (emote) {
      return emote;
    } else if (client.emojis.cache.find((e) => e.id === emoji)) {
      emote = client.emojis.cache.find((e) => e.id === emoji);
      if (emote) return emote;
    } else {
      emote = client.emojis.cache.find((e) => `<:${e.name}:${e.id}>` === emoji);
      if (emote) return emote;
    }
  },

  /**
   * @param ms time in milliseconds
   * @returns sleep for provided time
   */
  sleep: (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * @param args command args e.g. user input
   * @param options getTimeOptions
   * @returns getTimeReturn or undefined
   */
  getTime: (
    args: string[],
    options?: getTimeOptions
  ): getTimeReturn | undefined => {
    let shift, validateDate;
    if (options) {
      options.shift ? (shift = options.shift) : undefined;
      options.validateDate ? (validateDate = options.validateDate) : undefined;
    }
    if (shift) args.shift();
    switch (true) {
      case validateDate:
        const valDateRegExp =
          /(?<year>[0-9]{4}):(?<month>0?[1-9]|1[0-2]):(?<day>0?[1-9]|[12][0-9]|3[01])\s(?<hours>00|[0-9]|1[0-9]|2[0-3]).(?<minutes>[0-9]|[0-5][0-9]).(?<seconds>[0-9]|[0-5][0-9])\s(?<reason>.*)$/;
        const res = valDateRegExp.exec(args.join(" "))?.groups!;

        if (!res) {
          return undefined;
        }

        const year = Number(res.year);
        const month = Number(res.month);
        const day = Number(res.day);
        const hours = Number(res.hours);
        const minutes = Number(res.minutes);
        const seconds = Number(res.seconds);

        const date = new Date(year, month, day, hours, minutes, seconds);

        return {
          milliseconds: date.getTime(),
          reason: res.reason,
          difference: date.getTime() - new Date().getTime(),
          dateObj: date,
        };
      default:
        const result = utils.parseDuration(args.join(" "));
        let total =
          1000 *
          ((result.d ? +result.d * 24 * 60 * 60 : 0) +
            (result.h ? +result.h * 60 * 60 : 0) +
            (result.m ? +result.m * 60 : 0) +
            (result.s ? +result.s : 0));
        const currentMillis = new Date().getTime();
        const newDate = new Date(currentMillis + total);
        return {
          milliseconds: newDate.getTime(),
          difference: newDate.getTime() - new Date().getTime(),
          reason: result.reason,
          dateObj: newDate,
        };
    }
  },

  findOneOrCreate: async <T extends Model<any>>(
    model: T,
    findOpt: fcOpt<T>,
    createOpt: fcOpt<T>
  ): Promise<rOpt<T> | null> => {
    return (await model.findOne(findOpt))
      ? await model.findOne(findOpt)
      : await model.create(createOpt);
  },

  parseDuration: (string) => {
    var match =
      /(?:\s?(\d+)[d/д])?(?:\s?(\d+)[h/ч])?(?:\s?(\d+)[m/м]?)?(?:\s?(\d+)[s/с]?)?(?:\s?(.*)?)?/.exec(
        string
      )!;
    return {
      d: parseInt(match[1], 10) || 0,
      h: parseInt(match[2], 10) || 0,
      m: parseInt(match[3], 10) || 0,
      s: parseInt(match[4], 10) || 0,
      reason: match.slice(5).join(" ") || undefined,
    };
  },
};

type fcOpt<T> = T extends Model<infer U> ? FilterQuery<U> : never;
type rOpt<T> = T extends Model<infer U> ? U : never;

interface getTimeReturn {
  reason?: string;
  milliseconds?: number;
  dateObj?: Date;
  difference?: number;
}

interface getDiscordMemberOptions {
  returnNothing?: boolean;
  uid?: Snowflake;
}

interface getTimeOptions {
  shift?: boolean;
  validateDate?: boolean;
}

interface errorMessageOptions {
  text?: string;
  embed?: MessageEmbed;
  example?: boolean;
  cmd?: COMMAND;
  reply?: boolean;
}

interface UpdateVoiceTimeOptions {
  returnUser?: boolean;
  isEvent?: boolean;
}

interface DiscordErrorHandlerOptions {
  cmd?: COMMAND;
  eventName?: string;
  message?: Message;
  guild?: Guild;
  isEvent?: boolean;
}

export default utils;
