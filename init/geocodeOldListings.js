if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}


const mongoose = require("mongoose");
const Listing = require("../models/listing");

const dbUrl=process.env.ATLASDB_URL;

mongoose.connect(dbUrl)
.then(() => {
    console.log("DB connected");
})
.catch(err => console.log(err));

async function getCoordinates(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'wanderlust-app'
        }
    });

    const data = await response.json();

    if (data.length > 0) {
        return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    } else {
        return [0, 0];
    }
}

async function updateOldListings() {
    let listings = await Listing.find({});

    for (let listing of listings) {
        if (listing.geometry && listing.geometry.coordinates[0] !== 0) {
            continue;
        }

        console.log("Updating:", listing.title);

        const coords = await getCoordinates(listing.location);

        listing.geometry = {
            type: "Point",
            coordinates: coords
        };

        await listing.save();
    }

    console.log("All listings updated!");
    mongoose.connection.close();
}

updateOldListings();