import { XMLParser } from "fast-xml-parser";

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const response = await fetch(env.YOUTUBE_RSS_URL);
    if (!response.ok) console.error("Error fetching RSS feed.");
    const json = new XMLParser().parse(await response.text());

    // TODO: Use Durable Objects instead of a D1 Database.

    const latestVideoId = json.feed.entry[0]["yt:videoId"];
    let query = await env.DB.prepare("SELECT id FROM id_table").run();

    if (query.results.length === 0) {
      env.DB.prepare("INSERT INTO id_table (id) VALUES (?)")
        .bind(latestVideoId)
        .run();

      query = await env.DB.prepare("SELECT id FROM id_table").run();
    }

    // Check if any new videos have been posted, if so, end the cron job
    if (query.results[0].id === latestVideoId) return;

    const latestVideoTitle = json.feed.entry[0]["media:group"]["media:title"];
    const latestVideoURL = `https://youtu.be/${json.feed.entry[0]["yt:videoId"]}`;
    const authorDisplayName = json.feed.entry[0].author.name;
    const webhookMessage = `<@&1368242352074002572> ${authorDisplayName} just posted a [${latestVideoTitle}](${latestVideoURL})!`;

    fetch(env.DISCORD_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: webhookMessage,
      }),
    });
  },
} satisfies ExportedHandler<Env>;
