"use client"

import type { NextPage } from "next"
import Image from "next/image"
import { useState, ChangeEvent } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"

const Home: NextPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserId(event.target.value)
  }

  const handleSubmit = async () => {
    if (!userId) {
      alert("กรุณากรอก User ID ก่อนแจ้งชำระเงิน")
      return
    }
    if (!selectedFile) {
      alert("กรุณาเลือกไฟล์ก่อนแจ้งชำระเงิน")
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("userId", userId)

      const response = await axios.post("/api/verify-slip", formData)
      const { success, message } = response.data

      router.push(
        `/result?status=${
          success ? "success" : "error"
        }&message=${encodeURIComponent(message)}`
      )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
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
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-6"
      style={{ backgroundImage: "url('/BG3.png')" }}
    >
      <div className="bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-lg border-4 border-[#b30009] rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/LogoccZ.png"
            alt="Logo"
            width={400}
            height={200}
            className="object-contain rounded-lg"
          />
        </div>

        {/* QR Code Section */}
        <div className="bg-[#b30009]/10 rounded-xl p-6 mb-6 border-2 border-[#b30009] shadow-inner">
          <div className="flex justify-center">
            <Image
              src="/494887688_1411888273160433_2839512565933097529_n.jpg"
              alt="QR Code"
              width={400}
              height={200}
              className="object-contain rounded-md border border-white shadow-sm"
            />
          </div>
        </div>

        {/* Instruction Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl p-5 mb-6 flex items-center shadow-lg border border-gray-700">
          <span className="text-red-500 text-3xl mr-3 animate-pulse">✕</span>
          <p className="text-base font-medium">
            กรุณาแจ้งชำระเงินโดยการกรอก User ID และอัพโหลด Slip เท่านั้น
          </p>
        </div>

        {/* User ID Input */}
        <div className="mb-6">
          <label className="block text-white text-lg font-semibold mb-2 drop-shadow-md">
            กรอก User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={handleIdChange}
            placeholder="ระบุ User ID"
            className="w-full bg-white/80 text-gray-800 px-4 py-3 rounded-lg border-2 border-[#b30009] focus:outline-none focus:ring-2 focus:ring-[#d22831] shadow-md placeholder-gray-500"
          />
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-white text-lg font-semibold mb-2 drop-shadow-md">
            อัพโหลดหลักฐานการชำระเงิน
          </label>
          <div className="flex items-center bg-white/80 border-2 border-[#b30009] rounded-lg p-3 shadow-md">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-[#b30009] text-white px-5 py-2 rounded-lg cursor-pointer hover:bg-[#d22831] transition-colors duration-200 font-medium"
            >
              Choose File
            </label>
            <span className="ml-3 text-gray-800 truncate flex-1 font-medium">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-[#b30009] to-[#d22831] text-white py-3 rounded-lg hover:from-[#d22831] hover:to-[#b30009] flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-6 w-6 mr-3 text-white"
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
              <span className="font-semibold">กำลังดำเนินการ...</span>
            </>
          ) : (
            <span className="font-semibold text-lg">แจ้งชำระเงิน</span>
          )}
        </button>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-white text-lg underline hover:text-[#d22831] transition-colors duration-200 font-medium drop-shadow-md"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
