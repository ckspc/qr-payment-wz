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

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/BG3.png')" }}
    >
      <div className="bg-white/30 backdrop-blur-md border-2 border-[#b30009] rounded-xl shadow-lg p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          {isSuccess ? "การแจ้งชำระเงินสำเร็จ!" : "การแจ้งชำระเงินล้มเหลว"}
        </h1>
        <p className="text-white mb-6">{message || "ไม่มีข้อความเพิ่มเติม"}</p>
        <Link
          href="/"
          className="inline-block bg-[#b30009] text-white py-2 px-4 rounded-lg hover:bg-[#d22831]"
        >
          กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  )
}

// Wrap the component in a Suspense boundary
const ResultPage: NextPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ResultPageContent />
  </Suspense>
)

export default ResultPage
