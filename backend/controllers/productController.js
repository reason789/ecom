const Product = require("../models/productModel.js");
const ErrorHandler = require("../utils/errorhandler.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary")  // 19:19:04


// Create Product --Admin
exports.createProduct = catchAsyncErrors(async(req,res,next) =>{

    let images = [] 

    if(typeof req.body.images === "string") {  // basically we r checking if one image come or many
        images.push(req.body.images)
    } 
    else {
        images = req.body.images;
    }

    const imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        })
        
        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        })
    }

    req.body.images = imagesLinks;
    //req.body.user = req.user._id;  // for tracking who create products// return new ObjectId("619ce19f2d4c642d2641ca99")
    req.body.user = req.user.id;  // for tracking who create products// return only id
    

    const product = await Product.create(req.body);

    res.status(201).json({
        success:true,
        product
    })
})

// Get All products
exports.getAllProducts = catchAsyncErrors(async(req,res, next) =>{
// return next(new ErrorHandler("this is reason", 500))    for testing frontend popup error
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();   //for counting total products and we will show in Deshboard

    const apiFeature = new ApiFeatures(Product.find(), req.query)
        .search()
        .filter()
        //.pagination(resultPerPage); // see the video 7:07:16 

        //let products = await apiFeature.query;  // showing this error -- "Query was already executed: Product.find({})"
        let products = await apiFeature.query.clone();

        let  filteredProductsCount = products.length;

        apiFeature.pagination(resultPerPage)

        products = await apiFeature.query;     

    res.status(200).json({
        success:true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount
    });
});

// Get All products --ADMIN
exports.getAdminProducts = catchAsyncErrors(async(req,res, next) =>{
      
    const products = await Product.find()
    
        res.status(200).json({
            success:true,
            products
        });
    });

// Get product details
exports.getProductDetails = catchAsyncErrors(async(req,res,next) =>{

    let product = await Product.findById(req.params.id);
    
    if(!product){
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success:true,
        product
    })
})

// Update Product -- Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
  
    if (!product) {
      return next(new ErrorHander("Product not found", 404));
    }
  
    // Images Start Here
    let images = [];
  
    if (typeof req.body.images === "string") {
      images.push(req.body.images);
    } else {
      images = req.body.images;
    }
  
    if (images !== undefined) {
      // Deleting Images From Cloudinary
      for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
      }
  
      const imagesLinks = [];
  
      for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
          folder: "products",
        });
  
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
  
      req.body.images = imagesLinks;
    }
  
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
  
    res.status(200).json({
      success: true,
      product,
    });
  });

// Delete Product --Admin
exports.deleteProduct = catchAsyncErrors(async(req,res,next) =>{

    let product = await Product.findById(req.params.id);
    
    if(!product){
        return next(new ErrorHandler("Product not found", 404));
    }

    // Deleting images from cloudinary // 13:31:38
    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy( product.images[i].public_id )
    }

    await product.remove()
    res.status(200).json({
        success:true,
        message:"Product Deleted Successfully"
    })
})

// Create new review or Update the review
exports.createProductReview = catchAsyncErrors(async(req,res,next) =>{

    const {rating, comment, productId} = req.body
    const review = {
        user:req.user._id,
        name: req.user.name,
        // rating:rating same as below
        rating : Number(rating),
        comment,
    }

    const product = await Product.findById(productId)

    const isReviewed = product.reviews.find((rev) => rev.user.toString() === req.user._id.toString())  // review er user er id // this is actually checking j j review ta ekhane ache sheta amr kina

    if(isReviewed){
        product.reviews.forEach(rev => {
            if((rev) => rev.user.toString() === req.user._id.toString())
            (rev.rating = rating),
            (rev.comment = comment)
        })
    }
    else{
        product.reviews.push(review)
        product.numOfReviews = product.reviews.length
    }

    // 
    // let avg = 0;
    // product.ratings = product.reviews.forEach(rev =>{
    //     avg += rev.rating
    // })/product.reviews.length    // working all but only ratings was not working becasue of we used in local variable product.ratings =


    let avg = 0;

    product.reviews.forEach(rev =>{
        avg += rev.rating
    })

    product.ratings = avg / product.reviews.length

    await product.save({validateBeforeSave: false});

    res.status(200).json({
        success: true
    })
})

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async(req,res,next) =>{

    const product = await Product.findById(req.query.id)

    if(!product){
            return next(new ErrorHandler("Product not found", 404));
        }
   
    res.status(200).json({
        success:true,
        reviews: product.reviews,
    })
})


// Delete Review 
exports.deleteReview = catchAsyncErrors(async(req,res,next) =>{

    const product = await Product.findById(req.query.productId)

    if(!product){
            return next(new ErrorHandler("Product not found", 404));
        }

    const reviews = product.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString())
    const numOfReviews = reviews.length;

    let avg = 0;

    reviews.forEach((rev) => {
        avg += rev.rating;
    })

    // 15: 16: 28 we r getting error .. when we try to delete the last review it devides (something/0). which is NaN

    // const ratings = avg / reviews.length;
    let ratings = 0;

    if(reviews.length === 0){
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }


    await Product.findByIdAndUpdate(req.query.productId, {
        reviews, ratings, numOfReviews,
    },{new:true, runValidators: true, useFindAndModify: false
    })

    res.status(200).json({
        success:true,
    })
})
