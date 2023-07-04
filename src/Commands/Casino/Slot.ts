import { SlotMachine, SlotSymbol } from 'slot-machine'
import { BaseCommand, Command, Message } from '../../Structures'

@Command('slot', {
    category: 'casino',
    description: 'Bets the given amount of gold in a slot machine',
    casino: true,
    usage: 'slot <amount>',
    cooldown: 20,
    exp: 10,
    aliases: ['bet']
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (M.numbers.length < 1) return void M.reply(`amount?`)
        const amount = M.numbers[0]
        const { wallet } = await this.client.DB.getUser(M.sender.jid)
        if (amount > wallet) return void M.reply(`check ur wallet`)
        if (amount < 500) return void M.reply(`You cant bet less than 500`)
        if (amount > 30000) return void M.reply(`You cant bet more than 30000`)
        const machine = new SlotMachine(3, this.symbols)
        const results = machine.play()
        const lines = results.lines.filter((line) => !line.diagonal)
        const points = results.lines.reduce((total, line) => total + line.points, 0)
        const resultAmount = points <= 0 ? -amount : amount * points
        const buffer = await this.client.utils.getBuffer('https://telegra.ph/file/03b20ad7d06ba2b8d8c21.mp4')
        await this.client.DB.setGold(M.sender.jid, resultAmount)
        let text = '🎰 *SLOT MACHINE* 🎰\n\n'
        text += results.visualize()
        text += points <= 0 ? `📉 You lost ${amount} gold` : `📈 You won ${resultAmount} gold`
        return void (await M.reply(buffer, 'video', true, undefined, text))
    }

    private symbols = [
        new SlotSymbol('1', {
            display: '🎰',
            points: 1,
            weight: 100
        }),
        new SlotSymbol('b', {
            display: '💰',
            points: 5,
            weight: 20
        }),
        new SlotSymbol('2', {
            display: '💎',
            points: 1,
            weight: 100
        }),
        new SlotSymbol('b', {
            display: '💰',
            points: 5,
            weight: 40
        })
    ]
}