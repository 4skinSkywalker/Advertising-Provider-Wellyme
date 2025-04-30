(async function () {
  // Advertising module
  try {
    function getRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function createLink(imageUrl, linkUrl) {
      const a = document.createElement("A");
      a.href = linkUrl;
      a.style.position = "absolute";
      a.style.inset = 0;
      a.style.background = "url(https://4skinskywalker.github.io/Advertising-Provider-Wellyme/images/" + imageUrl + ")"
      a.style.backgroundSize = "cover";
      a.setAttribute("target", "_blank");
      return a;
    }

    // Identify current page
    let currentPage;
    if (window.location.href.startsWith("https://www.wellyme.org/post")) {
      currentPage = "post";
    } else if (window.location.href === "https://www.wellyme.org/") {
      currentPage = "home";
    } else {
      console.log(window.location.href, "is not an adv target page.");
      return;
    }
    console.debug({ currentPage });

    // Get advertising configuration
    const json = await (await fetch("https://4skinskywalker.github.io/Advertising-Provider-Wellyme/core.json")).json();
    console.debug(json);

    // Get user location
    let userContinent = "EU";
    let userCountry;
    try {
      const data = await (await fetch('https://ipapi.co/json/')).json();
      const {continent_code, country} = data;
      userContinent = continent_code;
      userCountry = country;
    } catch(e) {
      console.error("Could not get user location", e);
    }

    // Initialize advertising structure
    const activeAds = {
      home: {},
      post: {}
    };
    console.debug({ activeAds });

    // Loop over campaings and extract advertising
    const campaigns = Object.keys(json);
    for (const campaign of campaigns) {
      if (!json[campaign].pages) {
        continue;
      }

      const pages = Object.keys(json[campaign].pages);
      for (const page of pages) {
        const _page = json[campaign].pages[page];
        const formats = Object.keys(_page);
        for (const format of formats) {
          if (_page[format].enabled) {
            activeAds[page][format] = activeAds[page][format] || [];
            activeAds[page][format].push(_page[format]);
          }
        }
      }
    }

    const currentPageAds = activeAds[currentPage];
    console.debug({ currentPageAds });

    // Loop over supported formats
    for (const format of ["banner", "card", "overlay"]) {
      if (!currentPageAds[format] || !currentPageAds[format].length) {
        console.debug(format, "not present in current page advertising configuration");
        continue;
      }

      // Filter out foreign campaigns
      const localizedAds = currentPageAds[format].filter(ads => ads.targetingLocation && ads.targetingLocation[userCountry]);
      if (!localizedAds.length) {
        console.debug("No localized ads for", format, "and user location", userCountry);
        continue;
      }

      // Check the presence of the advertising elements
      const domTarget = document.querySelectorAll(".advertising-" + format);
      if (!domTarget || !domTarget.length) {
        console.debug("Element not found for", format);
        continue;
      }

      for (const el of domTarget) {
        const adv = getRandom(localizedAds).targetingLocation[userCountry];
        if (!adv || !adv.imageUrl || !adv.linkUrl) {
          console.debug("No advertising for", format);
          continue;
        }

        el.appendChild(createLink(adv.imageUrl, adv.linkUrl));
      }
    }
  } catch (e) {
    console.error("Could not elaborate advertising", e);
  }
})();