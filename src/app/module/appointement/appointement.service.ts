import { success } from "zod"
import config from "../../config"
import { getBkashIdToken } from "../../lib/bkash"
import { prisma } from "../../lib/prisma"
import { AppointmentStatus } from "../../../generated/prisma/enums"

const bookAppointment = async (payload : any) =>{
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
                    payerReference: "01723882525",
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

    return bkashCreatePaymentResult
    })
}

const bookAppointmentCallback = async(query : Record<string, any>) =>{
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

    if(status === 'success'){
        return{
            executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=success`
        }
    }
    if(status === 'failure'){
        return{
            executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=failure`
        }
    }
    if(status === 'cancle'){
        return{
            executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-appointments?status=cancle`
        }
    }

    return{
        executedPaymentResult,
        redirectUrl: `${config.frontend_url}/dashboard/my-appointments`
    }

    return executedPaymentResult
}
export const AppointementService = {
    bookAppointment,
    bookAppointmentCallback
}