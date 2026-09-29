import { catchAsync } from "../../utils/catchAsync";
import { Request,Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { AppointementService } from "./appointement.service";
import { RequestUser } from "../../middleware/checkAuth";

const bookAppointement = catchAsync(async(req:Request,res:Response) =>{
    const payload = req.body;
    const user = req.user as RequestUser;
    
    const result = await AppointementService.bookAppointment(payload,user);
    
    sendResponse(res,{
        statusCode : httpStatus.OK,
        success: true,
        message: "Appointement Booking Successfull",
        data: result
    })
}) 

const payAppointment = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await AppointementService.payAppointment(payload, user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Appointment Payment Initiated Successfully",
		data: result,
	});
});

const bookAppointementCallback = catchAsync(async(req:Request,res:Response) =>{
    const {redirectUrl} =await AppointementService.bookAppointmentCallback(req.query);
    
    res.redirect(redirectUrl);
}) 

export const AppointementController = {
    bookAppointement,
    payAppointment,
    bookAppointementCallback
}