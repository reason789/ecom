const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create new Order
exports.newOrder = catchAsyncErrors(async (req,res,next) =>{

    const {shippingInfo, 
        orderItems, 
        paymentInfo, 
        itemsPrice, 
        taxPrice, 
        shippingPrice, 
        totalPrice} = req.body;

        const order = await Order.create({
            shippingInfo, 
            orderItems, 
            paymentInfo, 
            itemsPrice, 
            taxPrice, 
            shippingPrice, 
            totalPrice,
            paidAt: Date.now(),
            user: req.user._id
        });

        res.status(201).json({
            success: true,
            order,
        })
})


// Get single Order
exports.getSingleOrder = catchAsyncErrors(async(req,res,next) => {

    const order = await Order.findById(req.params.id).populate("user", "name email") // by this populate we will get user,s name and email by getting the id of user

    if(!order){
        return next(new ErrorHandler("Order not found with this id", 404))
    }

    res.status(200).json({
        success: true,
        order
    })
})


// Get logged in user Order
exports.myOrders = catchAsyncErrors(async(req,res,next) => {

    const orders = await Order.find({user: req.user._id})
    res.status(200).json({
        success: true,
        orders
    })
})


// Get ALL  Order --Admin
exports.getAllOrders = catchAsyncErrors(async(req,res,next) => {
    
    const orders = await Order.find()

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
})

// Update Order status --Admin
exports.updateOrder = catchAsyncErrors(async(req,res,next) => {
    
    const order = await Order.findById(req.params.id)

    if(!order){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("You have already delivered this order", 400));
    }

    // 14:21:08 we do not need this because the problem is it deduct when product shipped and also delivered which is not okay
    // order.orderItems.forEach(async(o) => {
    //     await updateStock(o.product, o.quantity); // here anyone buy one product, we have to deduct this product from the stock
    // })

    if(req.body.status === "Shipped") {
        order.orderItems.forEach(async(o) => {
            await updateStock(o.product, o.quantity); // here anyone buy one product, we have to deduct this product from the stock
        })
    }

    order.orderStatus = req.body.status

    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false})

    res.status(200).json({
        success: true,
    })
})

async function updateStock(id, quantity){  //product id, 

    const product = await Product.findById(id);

    product.stock -= quantity

    await product.save({ validateBeforeSave: false})
}



// Delete Order --Admin
exports.deleteOrder = catchAsyncErrors(async(req,res,next) => {
    
    const order = await Order.findById(req.params.id)

    await order.remove()

    if(!order){
        return next(new ErrorHandler("Order not found with this id",404))
    }

    res.status(200).json({
        success: true,
    })
})