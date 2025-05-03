import { XMLParser } from "fast-xml-parser";

export default {
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		const response = await fetch("https://www.youtube.com/feeds/videos.xml?channel_id=UCoYzQqZNCRqqAomJwJ6yEdg");
		if (!response.ok) console.error("Error fetching RSS feed.");

		const json = new XMLParser().parse(await response.text());

		const latestVideoId = json.feed.entry[0].id;
		// console.log(latestVideoId);

		// TODO: Use Durable Objects instead of a D1 Database.
		// TODO: Check if the initial cached value is empty, if empty, set it to the latest video so it doesn't send the webhook.

		const query = await env.DB.exec("SELECT id FROM id_table");
		console.log(query);

		const latestVideoTitle = json.feed.entry[0]["media:group"]["media:title"];
		const latestVideoURL = `https://youtu.be/${json.feed.entry[0]["yt:videoId"]}`;
		const authorDisplayName = json.feed.entry[0].author.name;
		const webhookMessage = `<@&1368242352074002572> ${authorDisplayName} just posted a [${latestVideoTitle}](${latestVideoURL})!`;
		const webhookURL =
			"https://discord.com/api/webhooks/1368301387452256378/xaSrE__COQTyhAkNBX1wDrVMSwWjk_nlmYOgf6li2lXyzVdC6SQDrAdDld2XfNrfpFD0";

		// fetch("", { body: {} });
	},
} satisfies ExportedHandler<Env>;
