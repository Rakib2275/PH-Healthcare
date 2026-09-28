import { catchAsync } from "../../utils/catchAsync";
import { Request,Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppointementService } from "./appointement.service";

const bookAppointement = catchAsync(async(req:Request,res:Response) =>{
    const result = await AppointementService.bookAppointment();
    
    sendResponse(res,{
        statusCode : httpStatus.OK,
        success: true,
        message: "Appointement Booking Successfull",
        data: result
    })
}) 

const bookAppointementCallback = catchAsync(async(req:Request,res:Response) =>{
    console.log(req.query)
    const {executedPaymentResult,redirectUrl} =await AppointementService.bookAppointmentCallback(req.query);
    
    console.log(executedPaymentResult)
    res.redirect(redirectUrl);
}) 

export const AppointementController = {
    bookAppointement,
    bookAppointementCallback
}