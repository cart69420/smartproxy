# SmartProxy (WIP)

(can someone help me come up with a name)

very smart proxy for minecraft

[![CodeFactor](https://www.codefactor.io/repository/github/cart69420/smartproxy/badge)](https://www.codefactor.io/repository/github/cart69420/smartproxy)
![Minecraft](https://img.shields.io/badge/Minecraft-1.12.2-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

# Introduction

**SmartProxy** was intended to be designed to help you get better gameplay advantages while using the least amount of resources as possible and being easy to use.

**SmartProxy** is currently aimed at *Minecraft 1.12.2 Crystal PvP*.

# Features

* Supports any account cracked/premium
* Automatically detects server joins and proxies them
* Ping-spoofing
* Built-in utilties/"hacks" 🤑 (soon)
* more coming soon...

    *(**IMPORTANT**: Most features require you to have my 'communication' mod, which will be releasing soon.)*

# Usage

1. Clone the repository `git clone https://github.com/cart69420/smartproxy.git`
2. Run `npm install`
3. You can start right away by running `npm run start`. The proxy's port will be `25566` and `6969` for the socket.

    *If you want to customize the ports, navigate to `src/index.ts` (I should add an easier way to do this)*
4. After any edit, run `npm run start` again.

## Notes

* If you try connecting to `<proxy ip>:<proxy port>`, you will be in the server which was set in `src/index.ts` or the last server which got changed to by feature `#2`.
* It is **not** a bright idea to use this on localhost if you want an advantage.
* This works just like [3arthh4ck's PingBypass](https://github.com/3arthqu4ke/3arthh4ck). The **closer** you are to the server being proxied, the **better** ping you get.
* If you notice in `src/index.ts`, there are **middlewares**! Intercept packets going in and out. You might need some help from ["packet information page"](https://minecraft-data.prismarine.js.org/?v=1.12.2&d=protocol)

# Credits

* cart69420 (me)
* [3arthqu4ke](https://github.com/3arthqu4ke) (original idea)
* [PrismarineJS/mineflayer](https://github.com/PrismarineJS/mineflayer) (files I butchered in `src/core/libs`)

# Contributing

If you've found any issuess, kindly open a report.

Pull requests are appreciated and will be reviewed as soon as possible.
