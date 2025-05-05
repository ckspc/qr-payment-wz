"use client"

import type { NextPage } from "next"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

// Force dynamic rendering at runtime (disables static generation)
export const dynamic = "force-dynamic"

const ResultPageContent: NextPage = () => {
  const searchParams = useSearchParams()
  const status = searchParams.get("status")
  const message = searchParams.get("message")

  const isSuccess = status === "success"

  // Function to parse the message and extract the amount for success cases
  const getDisplayMessage = () => {
    if (!isSuccess || !message) {
      // For failure cases or missing message, localize the error message
      return message
        ? message.includes("QR code has already been used")
          ? "QR Code นี้ถูกใช้ไปแล้ว (transRef ซ้ำ)"
          : message.includes("Slip verification failed")
          ? "การตรวจสอบสลิปไม่สำเร็จ"
          : message.includes("transRef is missing")
          ? "ไม่พบ transRef ในข้อมูลสลิป"
          : message.includes("Receiver details are incomplete or missing")
          ? "โอนผิดบัญชี: ข้อมูลผู้รับไม่ครบถ้วนหรือขาดหาย"
          : message
        : "ไม่มีข้อความเพิ่มเติม"
    }

    // For success cases, extract the amount from the message
    try {
      // Extract the JSON part after "รายละเอียด: "
      const jsonPart = message.split("รายละเอียด: ")[1]
      if (!jsonPart) throw new Error("No JSON part found")

      // Parse the JSON
      const parsedData = JSON.parse(jsonPart)
      const amount = parsedData?.data?.amount?.amount

      if (typeof amount !== "number") {
        throw new Error("Amount not found or invalid")
      }

      // Return the simplified success message
      return `เติมเครดิตสำเร็จ จำนวน ${amount}บาท`
    } catch (error) {
      console.error("Error parsing success message:", error)
      return "เติมเครดิตสำเร็จ (ไม่สามารถแสดงจำนวนเงินได้)"
    }
  }

  const displayMessage = getDisplayMessage()

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/BG3.png')" }}
    >
      <div className="bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-lg border-4 border-[#b30009] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all duration-500 scale-100 hover:scale-105">
        {/* Success/Failure Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <svg
              className="w-16 h-16 text-green-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-16 h-16 text-red-500 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
          {isSuccess ? "การแจ้งชำระเงินสำเร็จ!" : "การแจ้งชำระเงินล้มเหลว"}
        </h1>

        {/* Message */}
        <p className="text-lg text-white mb-6 font-medium drop-shadow-md">
          {displayMessage}
        </p>

        {/* Back to Top-Up Page Button */}
        <Link
          href="/"
          className="inline-block bg-gradient-to-r from-[#b30009] to-[#d22831] text-white py-3 px-6 rounded-lg hover:from-[#d22831] hover:to-[#b30009] transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
        >
          กลับสู่หน้าเติมเงิน
        </Link>
      </div>
    </div>
  )
}

// Wrap the component in a Suspense boundary
const ResultPage: NextPage = () => (
  <Suspense
    fallback={<div className="text-white text-center mt-10">กำลังโหลด...</div>}
  >
    <ResultPageContent />
  </Suspense>
)

export default ResultPage
