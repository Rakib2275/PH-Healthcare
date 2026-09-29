import { success } from "zod"
import config from "../../config"
import { getBkashIdToken } from "../../lib/bkash"
import { prisma } from "../../lib/prisma"
import { AppointmentStatus, PamentStatus } from "../../../generated/prisma/enums"
import { RequestUser } from "../../middleware/checkAuth"

const bookAppointment = async (payload : any,user: RequestUser) =>{
    const transactionResult = await prisma.$transaction(async(tx) =>{
        
        const appointment = await tx.appointment.create({
            data:{
                status: AppointmentStatus.PENDING
            }
        })
        
        const bkashIdToken = await getBkashIdToken()

    if(!bkashIdToken){
        throw new Error("No Bkash Access Token")
    }

    const bkashCreatePaymentResponse = await fetch(`${config.bkash_base_url}/tokenized/checkout/create`,{
        method: "POST",
        headers:{
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: bkashIdToken,
                "X-APP-Key": config.bkash_app_key,
                },
                body : JSON.stringify({
                    // agreementID:'TokenizedMerchant01L3IKB6H1565072174986',
                    mode: "0011",
                    payerReference: user.email,
                    // payerReference: "01723882525",
                    callbackURL: `${config.bkash_callback_url}/appointment/book-appointment/payment/callback`,
                    // merchantAssociationInfo: "MI05MID54RF09123456One",
                    amount: "1200",
                    currency: "BDT",
                    intent: "sale",
                    merchantInvoiceNumber: appointment.id
                })
    })

    const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json()

    //console.log(bkashCreatePaymentResult);

    await tx.payment.create({
        data:{
            merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
            appointmentId: appointment.id,
            amount: "1200",
            gatewayResponse: bkashCreatePaymentResult,
            bkashPaymentId: bkashCreatePaymentResult.paymentID,
            payerReference: user.email

        }
    })

    return bkashCreatePaymentResult
    })
    return transactionResult
}

const payAppointment = async (payload: any, user: RequestUser) => {
    const appointmentId = payload.appointmentId;

	const existingAppointment = await prisma.appointment.findUnique({
		where: {
			id: appointmentId,
		},
	});

	if (!existingAppointment) {
		throw new Error("Appointment Does Not Exists");
	}

	if (existingAppointment.status !== "PENDING") {
		throw new Error("Appointment Is Not Pending!");
	}

	// if (existingAppointment.status === "CANCELLED" || existingAppointment.status === "ONGOING" || existingAppointment.status === "COMPLETED"){
	//     const appointmentStatus = existingAppointment.status
	//     throw new Error(`Appointment is already ${appointmentStatus.toLowerCase}`)
	// }

	const bkashIdToken = await getBkashIdToken();

	if (!bkashIdToken) {
		throw new Error("No Bkash Access Token Found!");
	}

	const bkashCreatePaymentResponse = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/create`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: bkashIdToken,
				"X-App-Key": config.bkash_app_key,
			},
			body: JSON.stringify({
				mode: "0011",
				// payerReference: "0123456789", //user email or phone number
				payerReference: user.email, //user email or phone number
				callbackURL: `${config.bkash_callback_url}/appointment/book-appointment/payment/callback`,
				amount: "1200",
				currency: "BDT",
				intent: "sale",
				// merchantInvoiceNumber: "Inv4" // apppointment id
				merchantInvoiceNumber: existingAppointment.id, // apppointment id
			}),
		},
	);

	const bkashCreatePaymentResult = await bkashCreatePaymentResponse.json();

	await prisma.payment.update({
		where: {
			appointmentId: existingAppointment.id,
		},

		data: {
			merchantInvoiceNumber: bkashCreatePaymentResult.merchantInvoiceNumber,
			gatewayResponse: bkashCreatePaymentResult,
			bkashPaymentId: bkashCreatePaymentResult.paymentID,
		},
	});

	return {
		paymentUrl: bkashCreatePaymentResult.bkashURL,
	};
};

const bookAppointmentCallback = async(query : Record<string, any>) =>{
    const transactionResult = await prisma.$transaction(async(tx) =>{
        const paymentId = query.paymentID

    if(!paymentId){
        throw new Error("Payment Id Missing")
    }

    const status = query.status
    if(!status){
        throw new Error("Payment Status is Missing")
    }

    const bkashIdToken = await getBkashIdToken();
    if(!bkashIdToken){
        throw new Error("No Bkash Access Token")
    }

    const executedPaymentResponse = await fetch(`${config.bkash_base_url}/tokenized/checkout/execute`,{
        method: "POST",
        headers:{
            "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: bkashIdToken,
                "X-APP-Key": config.bkash_app_key
        },
        body: JSON.stringify({
            paymentID: paymentId
        })
    })

    const executedPaymentResult = await executedPaymentResponse.json()

    console.log(executedPaymentResult)

    if (status === "success") {
			await tx.appointment.update({
				where: {
					id: executedPaymentResult.merchantInvoiceNumber,
				},
				data: {
					status: AppointmentStatus.CONFIRMED,
				},
			});

			await tx.payment.update({
				where: {
					appointmentId: executedPaymentResult.merchantInvoiceNumber,
					bkashPaymentId: paymentId,
				},
				data: {
					status: PamentStatus.PAID,
					bkashTrxId: executedPaymentResult.trxID,
					paidAt: executedPaymentResult.paymentExecuteTime,
					gatewayResponse: executedPaymentResult,
				},
			});

			return {
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=success`,
			};
		} else if (status === "failure") {
			await tx.payment.update({
				where: {
					bkashPaymentId: paymentId,
				},
				data: {
					status: PamentStatus.FAILED,
					gatewayResponse: executedPaymentResult,
				},
			});
			return {
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=failue`,
			};
		} else if (status === "cancel") {
			await tx.payment.update({
				where: {
					bkashPaymentId: paymentId,
				},
				data: {
					status: PamentStatus.CANCELLED,
					gatewayResponse: executedPaymentResult,
				},
			});
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=cancel`,
			};
		} else {
			return {
				executedPaymentResult,
				redirectUrl: `${config.frontend_url}/dashboard/my-appointments?error=payment-failed`,
			};
		}
    })
    return transactionResult
}
export const AppointementService = {
    bookAppointment,
    payAppointment,
    bookAppointmentCallback
}