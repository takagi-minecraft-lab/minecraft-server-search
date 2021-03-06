import { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda"
import fs from 'fs'
import path from 'path'

const shot = async (host: string) => {
    await chromium.font('https://ghcdn.rawgit.org/googlefonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf')
    const { puppeteer } = chromium
    const agent = await puppeteer.launch({
        args: [...chromium.args, '--window-size=1920,1080'],
        headless: false,
        defaultViewport: null,
        executablePath: await chromium.executablePath,
        env: {
            ...process.env,
            LANG: "ja_JP.UTF-8"
        }
    })
    const page = await agent.newPage()
    try {
        const targetElementSelector = '#server'
        await page.goto(`https://minecraft-server-search.vercel.app/${host}`)
        const clip = await page.evaluate((s: any) => {
            const el = document.querySelector(s)
            const { width, height, top: y, left: x } = el.getBoundingClientRect()
            return { width, height, x, y }
        }, targetElementSelector)
        return await page.screenshot({ clip, type: "png" })
    } finally {
        await page.close()
    }
}

const image = async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader("X-Robots-Tag", "noindex")
    const { host } = req.query
    if (typeof host != "string") return res.status(500)
    shot(host).then((img) => {
        res.setHeader("Link", `<${host}>; rel="canonical"`);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Content-DPR", "2.0");
        res.setHeader("Cache-Control", "max-age=300, public, stale-while-revalidate")
        res.send(img);
    })
}

export default image
