import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import sql from "mssql";

const dbConfig = {
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    server: process.env.DB_SERVER!,
    port: parseInt(process.env.DB_PORT!, 10),
    database: process.env.DB_DATABASE!,
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
};

// Expected receiver details for validation
const EXPECTED_RECEIVER = {
    bank: {
        id: "004",
        name: "ธนาคารกสิกรไทย",
        short: "KBANK",
    },
    account: {
        name: {
            th: "นาย รวย ท",
            en: "MR. RAUY T",
        },
        bank: {
            type: "BANKAC",
            account: "xxx-x-x1117-x",
        },
    },
};

export async function POST(req: NextRequest) {
    let pool;
    try {
        // Connect to MSSQL
        pool = await sql.connect(dbConfig);

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const userId = formData.get("userId") as string | null;

        if (!file) {
            return NextResponse.json(
                { message: "No file uploaded" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        // Step 1: Get CustomerID from Accounts table using email (userId)
        const customerResult = await pool
            .request()
            .input("userId", sql.VarChar, userId)
            .query("SELECT CustomerID FROM Accounts WHERE email = @userId");

        const customerData = customerResult.recordset;
        if (!customerData.length) {
            return NextResponse.json(
                { message: "Customer not found with this User ID" },
                { status: 404 }
            );
        }

        const customerId = customerData[0].CustomerID;

        // Step 2: Get current MONEY and PointTopup for this CustomerID from Web_PakG
        const balanceResult = await pool
            .request()
            .input("customerId", sql.Int, customerId)
            .query("SELECT MONEY, PointTopup FROM Web_PakG WHERE CustomerID = @customerId");

        const balanceData = balanceResult.recordset;
        if (!balanceData.length) {
            return NextResponse.json(
                { message: "Customer balance not found in Web_PakG" },
                { status: 404 }
            );
        }

        const currentBalance = balanceData[0].MONEY || 0;
        const currentPointTopup = balanceData[0].PointTopup || 0;

        // Step 3: Verify the slip using EasySlip API
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const response = await axios.post(
            "https://developer.easyslip.com/api/v1/verify",
            uploadFormData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${process.env.EASYSLIP_API_TOKEN}`,
                },
            }
        );

        // Check if slip verification is successful
        if (response.data.status !== 200) {
            return NextResponse.json(
                { message: "Slip verification failed" },
                { status: 400 }
            );
        }

        // Step 4: Extract the amount, transRef, and receiver details from the slip
        const slipAmount = response.data.data.amount.amount; // e.g., 1
        const transRef = response.data.data.transRef; // e.g., "015125192231CTF05105"
        const receiver = response.data.data.receiver;

        // Validate transRef
        if (!transRef) {
            return NextResponse.json(
                { message: "transRef is missing from slip verification response" },
                { status: 400 }
            );
        }

        // Step 5: Validate the receiver details with null checks
        const receiverValidationErrors: string[] = [];

        // Check if receiver and its nested properties exist
        if (!receiver || !receiver.bank || !receiver.account || !receiver.account.name || !receiver.account.bank) {
            return NextResponse.json(
                {
                    message: "โอนผิดบัญชี: Receiver details are incomplete or missing",
                },
                { status: 400 }
            );
        }

        // Validate bank details
        if (receiver.bank.id !== EXPECTED_RECEIVER.bank.id) {
            receiverValidationErrors.push(`Bank ID does not match (expected: ${EXPECTED_RECEIVER.bank.id}, got: ${receiver.bank.id})`);
        }
        if (receiver.bank.name !== EXPECTED_RECEIVER.bank.name) {
            receiverValidationErrors.push(`Bank name does not match (expected: ${EXPECTED_RECEIVER.bank.name}, got: ${receiver.bank.name})`);
        }
        if (receiver.bank.short !== EXPECTED_RECEIVER.bank.short) {
            receiverValidationErrors.push(`Bank short name does not match (expected: ${EXPECTED_RECEIVER.bank.short}, got: ${receiver.bank.short})`);
        }

        // Validate account details
        if (receiver.account.name.th !== EXPECTED_RECEIVER.account.name.th) {
            receiverValidationErrors.push(`Account name (Thai) does not match (expected: ${EXPECTED_RECEIVER.account.name.th}, got: ${receiver.account.name.th})`);
        }
        if (receiver.account.name.en !== EXPECTED_RECEIVER.account.name.en) {
            receiverValidationErrors.push(`Account name (English) does not match (expected: ${EXPECTED_RECEIVER.account.name.en}, got: ${receiver.account.name.en})`);
        }
        if (receiver.account.bank.type !== EXPECTED_RECEIVER.account.bank.type) {
            receiverValidationErrors.push(`Account type does not match (expected: ${EXPECTED_RECEIVER.account.bank.type}, got: ${receiver.account.bank.type})`);
        }
        if (receiver.account.bank.account !== EXPECTED_RECEIVER.account.bank.account) {
            receiverValidationErrors.push(`Account number does not match (expected: ${EXPECTED_RECEIVER.account.bank.account}, got: ${receiver.account.bank.account})`);
        }

        if (receiverValidationErrors.length > 0) {
            return NextResponse.json(
                {
                    message: "โอนผิดบัญชี: " + receiverValidationErrors.join(", "),
                },
                { status: 400 }
            );
        }

        // Step 6: Check if the transRef (LinkGift) has already been used
        const linkGiftCheck = await pool
            .request()
            .input("linkGift", sql.NVarChar, transRef)
            .query("SELECT COUNT(*) as count FROM Web_PakG_Log_Topup WHERE CAST(LinkGift AS NVARCHAR(MAX)) = @linkGift");

        const linkGiftCount = linkGiftCheck.recordset[0].count;
        if (linkGiftCount > 0) {
            return NextResponse.json(
                { message: "QR code has already been used (duplicate transRef)" },
                { status: 409 }
            );
        }

        // Step 7: Calculate new MONEY and PointTopup
        const newBalance = currentBalance + slipAmount;
        const newPointTopup = currentPointTopup + slipAmount;

        // Step 8: Update MONEY and PointTopup in the Web_PakG table
        await pool
            .request()
            .input("newBalance", sql.BigInt, newBalance)
            .input("newPointTopup", sql.BigInt, newPointTopup)
            .input("customerId", sql.Int, customerId)
            .query(
                "UPDATE Web_PakG SET MONEY = @newBalance, PointTopup = @newPointTopup WHERE CustomerID = @customerId"
            );

        // Step 9: Log the top-up in Web_PakG_Log_Topup using transRef as LinkGift
        const currentTimestamp = new Date().toISOString();
        await pool
            .request()
            .input("customerId", sql.Int, customerId)
            .input("topup", sql.BigInt, slipAmount)
            .input("timeReward", sql.DateTime, currentTimestamp)
            .input("linkGift", sql.NVarChar, transRef)
            .query(
                "INSERT INTO Web_PakG_Log_Topup (CustomerID, Topup, TimeReward, LinkGift) VALUES (@customerId, @topup, @timeReward, @linkGift)"
            );

        return NextResponse.json({
            success: true,
            message: "การแจ้งชำระเงินสำเร็จ! รายละเอียด: " + JSON.stringify(response.data),
            data: response.data,
            customerId: customerId,
            previousBalance: currentBalance,
            newBalance: newBalance,
            previousPointTopup: currentPointTopup,
            newPointTopup: newPointTopup,
            topupLogged: {
                customerId: customerId,
                topup: slipAmount,
                timeReward: currentTimestamp,
                linkGift: transRef,
            },
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
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}