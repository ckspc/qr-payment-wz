"use client"

import type { NextPage } from "next"
import Image from "next/image"
import { useState, ChangeEvent } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"

const Home: NextPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("กรุณาเลือกไฟล์ก่อนแจ้งชำระเงิน")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Call your Next.js API route
      const response = await axios.post("/api/verify-slip", formData)

      const { success, message } = response.data

      // Redirect to result page based on the API response
      router.push(
        `/result?status=${
          success ? "success" : "error"
        }&message=${encodeURIComponent(message)}`
      )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Handle client-side errors (e.g., network issues)
      const errorMessage =
        "เกิดข้อผิดพลาดในการเรียก API: " +
        (error.response?.data?.message || error.message)
      router.push(
        `/result?status=error&message=${encodeURIComponent(errorMessage)}`
      )
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/BG3.png')" }}
    >
      <div className="bg-white/30 backdrop-blur-md border-2 border-[#b30009] rounded-xl shadow-lg p-6 max-w-md w-full">
        <Image
          src="/LogoccZ.png"
          alt="QR Code"
          width={400}
          height={200}
          className="object-contain"
        />
        {/* QR Code Section */}
        <div className="rounded-lg p-4 mb-4">
          <div className="flex justify-center mb-4">
            <Image
              src="/494887688_1411888273160433_2839512565933097529_n.jpg"
              alt="QR Code"
              width={400}
              height={200}
              className="object-contain"
            />
          </div>
        </div>

        {/* Instruction Section */}
        <div className="bg-gray-800 text-white rounded-lg p-4 mb-4 flex items-center">
          <span className="text-red-500 text-2xl mr-2">✕</span>
          <p className="text-sm">
            กรุณาแจ้งชำระเงินโดยการอัพโหลด Slip เท่านั้น
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-4">
          <label className="block text-white mb-2">
            อัพโหลดหลักฐานการชำระเงิน
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg p-2">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap"
            >
              Choose File
            </label>
            <span className="ml-2 text-white truncate flex-1">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        {/* Submit Button with Loading State */}
        <button
          onClick={handleSubmit}
          className="w-full bg-[#b30009] text-white py-2 rounded-lg hover:bg-[#d22831] flex items-center justify-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              กำลังดำเนินการ...
            </>
          ) : (
            "แจ้งชำระเงิน"
          )}
        </button>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link href="/" className="text-white underline">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
