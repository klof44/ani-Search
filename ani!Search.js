let noMoreForURL = undefined;
setInterval(() => {
  	if (!document.location.href.includes("https://osu.ppy.sh/beatmapsets/") || document.getElementsByClassName("ani!Search-container").length > 0 || noMoreForURL == document.location.href) return;

	Main();
}, 100);

async function Main() {
	if (document.getElementsByClassName("osu-page osu-page--generic-compact").length == 0) return;
	
	osuPageInsert = document.createElement("div");
	osuPageInsert.className = "ani!Search-container";
	osuPageInsert.style = "padding-bottom: 0;";
	
	document.getElementsByClassName("osu-page osu-page--generic-compact")[0].insertBefore(
		osuPageInsert,
		document.getElementsByClassName("osu-page osu-page--generic-compact")[0].childNodes[2]
	);

	let beatmapResponse = await fetch(`https://api.chimu.moe/v1/set/${document.URL.split("/")[4].split("#")[0]}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
		},
		}
	)
    .then((response) => response.json())

    .catch((error) => console.error(error));
	if (beatmapResponse.Source == null || !beatmapResponse.Tags.match(/\bop\b|\banime\b|\bopening\b|\bending\b|\btv size\b/)) {
		noMoreForURL = document.location.href;
		return;
	}

	var variables = {
		search: beatmapResponse.Source,
		page: 1,
		perPage: 1,
	};

  	var query = `
		query ($id: Int, $page: Int, $perPage: Int, $search: String) {
		Page (page: $page, perPage: $perPage) {
			media (id: $id, search: $search, type: ANIME) {
			id
			bannerImage
			startDate {
				year
			}
			title {
				english
				romaji
			}
			coverImage {
				large
			}
			tags {
				name
			}
			}
		}
		Recommendation (id: $id) {
			rating
		}
		}
    `;

  	var aniListURL = "https://graphql.anilist.co",
		options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			query: query,
			variables: variables,
		}),
    };

  	let aniListResponse = await fetch(aniListURL, options)
    	.catch((error) => console.error(error));

	let anilistJSON = await aniListResponse.json();
	let aniListData = anilistJSON.data;
	let aniListMedia = aniListData.Page.media[0];

	let tagString = "";
	aniListMedia.tags.slice(0, 7).forEach((tag) => tagString += tag.name + ", ");
	tagString = tagString.substring(0, tagString.length - 2);

	osuPageInsert.innerHTML = `
		<div class="ani!Search-container" style="padding-bottom: 0;">
			<div class="ani!Search-background" style="position: absolute; z-index: 0; opacity: 0.2;">
				<img src="${aniListMedia.bannerImage}" style="max-height: 160px; width: 1000px; overflow: hidden; object-fit: cover;">
			</div>
			<div class="ani!Search-content" style="padding: 10px; display: flex; position: relative; text-shadow: 0 1px 3px rgba(0,0,0,.75);">
				<a href="https://anilist.co/anime/${aniListMedia.id}/" target="_blank"><img src="${aniListMedia.coverImage.large}" height=140></a>
				<div class="ani!Search-text" style="padding-left: 10px;">
					<a href="https://anilist.co/anime/${aniListMedia.id}/" target="_blank" style="font-size: 25px; text-decoration: none; color: white;">${aniListMedia.title.english ?? aniListMedia.title.romaji}</a></br>
					<p style="margin-bottom: 2px;">${aniListMedia.startDate.year}</p>
					<p style="margin-bottom: 2px;">Avg. Rating: ${aniListData.Recommendation.rating}/100</p>
					<p style="margin-bottom: 2px;">Tags: ${tagString}</p>
				</div>
			</div>
		</div>
	`;
}
