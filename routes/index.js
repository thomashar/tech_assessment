var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs/promises'); 


router.get('/', async function(req, res, next) {
  try {
    const ohioListing = await realtorScrap();

    await saveAsJson('ohioListings.json', ohioListing);
  } catch (error) {
    next(error);
  }
})

router.use(function(err, req, res, next) {
  console.error(err.stack);
  next();
});


async function realtorScrap(){
  console.log('Realtor Scrap');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto("https://www.realtor.com/realestateandhomes-search/Ohio", {
    waitUntil: "domcontentloaded",
  });

  console.log('DOM Loaded');

  const listingElement = await page.evaluate(() => {
    const listings = [];

    document.querySelectorAll('[id^="placeholder_property_"]').forEach((item) => {
      try {
        const broker  = item.querySelector('[data-testid="broker-title"]').innerText;
        const status  = item.querySelector('[data-testid="card-description"]').innerText;
        const price   = item.querySelector('[data-testid="card-price"]').innerText;
        const feature = item.querySelector('[data-testid="card-meta"]').innerText;
        const address = item.querySelector('[data-testid="card-address"]').innerText;

        const replaceNewlines = (text) => text.replace(/\n/g, ' ');

        let listingData;

        listingData = {
          broker: broker,
          status: status,
          price: price,
          feature: replaceNewlines(feature),
          address: replaceNewlines(address),
        };

        listings.push(listingData);
      } catch (error) {
        console.error('Error processing an item:', error.message);
      }
    });
    
    return listings;
  });

  await browser.close();
  return listingElement;
}

async function saveAsJson(filePath, data) {
  try {
    const jsonData = JSON.stringify(data, null, 2);

    await fs.writeFile(filePath, jsonData, 'utf-8');

    console.log(`Data saved to ${filePath}`);
    return jsonData;
  } catch (error) {
    console.error('Error saving data as JSON:', error.message);
    throw error;
  }
}


module.exports = router;
