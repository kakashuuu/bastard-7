import { BaseCommand, Command, Message } from '../../Structures';
import { SlotMachine, SlotSymbol } from 'slot-machine';

@Command('slot', {
    category: 'economy',
    description: 'Bets the given amount of gold in a slot machine',
    usage: 'slot <amount>',
    cooldown: 7,
    casino: true,
    exp: 10,
    aliases: ['bet']
})
export default class SlotCommand extends BaseCommand {
    private thumbnailUrls: string[] = [
        'https://telegra.ph/file/2fa16c9937561cedb2149.jpg',
        'https://telegra.ph/file/bcfccd97a8fb0f2de97b7.jpg',
        'https://telegra.ph/file/2a8833584499f8ab964eb.jpg',
        'https://telegra.ph/file/dd4e9d5edfe8e321eb2cd.jpg',
        'https://telegra.ph/file/3ae35aa1970b951cc1a07.jpg',
    ];

    private getRandomThumbnailUrl(): string {
        const randomIndex = Math.floor(Math.random() * this.thumbnailUrls.length);
        return this.thumbnailUrls[randomIndex];
    }

    private betsCount = 0;
    private jackpotThreshold = 20;
    private jackpotMultiplier = 40;

    private symbols = [
        new SlotSymbol('1', {
            display: '🍒',
            points: 1,
            weight: 100
        }),
        new SlotSymbol('2', {
            display: '🍀',
            points: 1,
            weight: 100
        }),
        new SlotSymbol('b', {
            display: '💰',
            points: 5,
            weight: 40
        })
    ];

    override execute = async (M: Message): Promise<void> => {
        if (M.numbers.length < 1) return void M.reply(`amount?`)

        const amount = M.numbers[0]
        const { credits } = await this.client.DB.getUser(M.sender.jid)

        if (amount < 100)
            return void M.reply(`🟨 The minimum amount for betting is *100*`)

        if (amount > credits)
            return void M.reply(`🟥 *You need ${amount - credits} credits to bet with this amount*`)

        if (amount > 15000)
            return void M.reply(`🟨 The maximum amount for betting is *15000*`)

        const machine = new SlotMachine(3, this.symbols)
        const results = machine.play()
        const lines = results.lines.filter((line) => !line.diagonal)
        const points = results.lines.reduce((total, line) => total + line.points, 0)

        const resultAmount = points <= 0 ? -amount : amount
        await this.client.DB.setGold(M.sender.jid, resultAmount)

        this.betsCount++;

        const thumbnailUrl = this.getRandomThumbnailUrl();

        let text = '🎰 *SLOT MACHINE* 🎰\n\n'
        text += results.visualize()

        if (this.betsCount >= this.jackpotThreshold) {
            const jackpotWin = amount * this.jackpotMultiplier;
            text += `\n\n🎉🎉🎉 JACKPOT You won *${jackpotWin}* ! 🎉🎉🎉`;
            this.betsCount = 0;
            await this.client.DB.setGold(M.sender.jid, jackpotWin); 
        } else {
            text += points <= 0 ? `\n\n📉 You lost *${amount}*.` : `\n\n📈 You won *${resultAmount}*`;
        }

        return void (await M.reply(text, 'text', undefined, undefined, undefined, [M.sender.jid], {
            title: this.client.utils.capitalize(`🎰𝐒𝐋𝐎𝐓 𝐌𝐀𝐂𝐇𝐈𝐍𝐄🎰`),
            thumbnail: await this.client.utils.getBuffer(thumbnailUrl),
            mediaType: 1
        }));
    }
    }
