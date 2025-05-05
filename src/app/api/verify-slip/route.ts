import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        // Prepare the file for the EasySlip API
        const uploadFormData = new FormData();
        uploadFormData.append("file", file); // File is already a Blob-compatible type

        // Call the EasySlip API
        const response = await axios.post(
            "https://developer.easyslip.com/api/v1/verify",
            uploadFormData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: "Bearer b286dfdc-910b-4409-95b5-333cd42ca361",
                },
            }
        );

        return NextResponse.json({
            success: true,
            message: "การแจ้งชำระเงินสำเร็จ! รายละเอียด: " + JSON.stringify(response.data),
            data: response.data,
        });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "เกิดข้อผิดพลาดในการแจ้งชำระเงิน: " +
                    (error.response?.data?.message || error.message),
            },
            { status: 500 }
        );
    }
}