const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        url: String,
        filename: String,
    },
    geometry: {
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        default: [0, 0]
    }
},
    price: {    
        type: Number,
        required: true,
        min: 0,
    },
    location: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    reviews:[
        {
            type:Schema.Types.ObjectId,
            ref:"Review",
        },
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if (listing){
    await Review.deleteMany({_id:{$in:listing.reviews}});
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;