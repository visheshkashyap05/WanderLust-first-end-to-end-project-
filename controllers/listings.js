const Listing=require("../models/listing");

async function getCoordinates(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${location}`;
    
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

module.exports.index=async (req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
};

module.exports.searchListings = async (req, res) => {
    let { query } = req.query;

    if (!query || query.trim() === "") {
        req.flash("error", "Search cannot be empty");
        return res.redirect("/listings");
    }

    const allListings = await Listing.find({
        $or: [
            { location: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { country: { $regex: query, $options: "i" } }
        ]
    });

    res.render("listings/index", { allListings });
};

module.exports.showListing=async (req,res)=>{
    let { id } = req.params;
    const listing=await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author"
        }
    })
    .populate("owner");

//   if (!listing.geometry || listing.geometry.coordinates[0] === 0) {
//   const fullLocation = `${listing.location}, ${listing.country}`;
//   try{
//     const coords = await getCoordinates(fullLocation);
//     listing.geometry = {type: "Point",coordinates: coords};
//     await listing.save();
//     console.log("Auto-updated coords for:", listing.title);
//     }catch(err){
//     console.log("Failed geocoding:", listing.title);
//   }}

    if(!listing){
        req.flash("error","Listing you requested for does not exist anymore!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing=async(req,res,next)=>{
    let url = req.file.secure_url;
    let filename = req.file.public_id;
    
    const coords = await getCoordinates(req.body.listing.location);

    const newListing=new Listing(req.body.listing);

    newListing.geometry = {
    type: "Point",
    coordinates: coords
};

    newListing.owner=req.user._id;
    newListing.image={url,filename};
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist anymore!");
        return res.redirect("/listings");
    }

    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");

    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(
        id,
        {...req.body.listing},
        { runValidators: true, new: true }
    );

    const coords = await getCoordinates(req.body.listing.location);

listing.geometry = {
    type: "Point",
    coordinates: coords
};

await listing.save();

    if(typeof req.file!=="undefined"){
        let url = req.file.secure_url;
        let filename = req.file.public_id;
        listing.image={url,filename};
        await listing.save();
    }
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing=async (req,res)=>{
    let {id}=req.params;
    let listing = await Listing.findById(id);
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted!");
    res.redirect(`/listings`);
};